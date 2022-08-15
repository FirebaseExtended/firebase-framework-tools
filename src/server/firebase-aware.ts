import { Request as FunctionsRequest } from 'firebase-functions/v2/https';
import type { Response } from 'express';
import { initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
// @ts-ignore
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
// @ts-ignore
import { getAuth, signInWithCustomToken, User } from 'firebase/auth';
import cookie from 'cookie';
import LRU from 'lru-cache';

import {
    COOKIE_MAX_AGE,
    ID_TOKEN_MAX_AGE,
    LRU_MAX_INSTANCES,
    LRU_TTL
} from '../constants.js';

const FRAMEWORKS_APP_OPTIONS = process.env.FRAMEWORKS_APP_OPTIONS && JSON.parse(process.env.FRAMEWORKS_APP_OPTIONS);

const adminApp = initializeAdminApp();
const adminAuth = getAdminAuth(adminApp);

export type Request = FunctionsRequest & { firebaseApp?: FirebaseApp, currentUser?: User|null };

const firebaseAppsLRU = new LRU<string, FirebaseApp>({
    max: LRU_MAX_INSTANCES,
    ttl: LRU_TTL,
    allowStale: true,
    updateAgeOnGet: true,
    dispose: (value) => {
        deleteApp(value);
    }
});

const mintCookie = async (req: Request, res: Response) => {
    const idToken = req.header('Authorization')?.split('Bearer ')?.[1];
    const verifiedIdToken = idToken ? await adminAuth.verifyIdToken(idToken) : null;
    if (verifiedIdToken) {
        if (new Date().getTime() / 1_000 - verifiedIdToken.auth_time > ID_TOKEN_MAX_AGE) {
            res.status(301).end();
        } else {
            const cookie = await adminAuth.createSessionCookie(idToken!, { expiresIn: COOKIE_MAX_AGE }).catch((e: any) => {
                console.error(e.message);
            });
            if (cookie) {
                const options = { maxAge: COOKIE_MAX_AGE, httpOnly: true, secure: true };
                res.cookie('__session', cookie, options).status(201).end();
            } else {
                res.status(401).end();
            }
        }
    } else {
        res.status(204).clearCookie('__session').end();
    }
};

const handleAuth = async (req: Request) => {
    if (!FRAMEWORKS_APP_OPTIONS) return;
    const cookies = cookie.parse(req.headers.cookie || '');
    const { __session } = cookies;
    if (!__session) return;
    const decodedIdToken = await adminAuth.verifySessionCookie(__session).catch((e: any) => console.error(e.message));
    if (!decodedIdToken) return;
    const { uid } = decodedIdToken;
    let app = firebaseAppsLRU.get(uid);
    if (!app) {
        const isRevoked = !(await adminAuth.verifySessionCookie(__session, true).catch((e: any) => console.error(e.message)));
        if (isRevoked) return;
        const random = Math.random().toString(36).split('.')[1];
        const appName = `authenticated-context:${uid}:${random}`;
        app = initializeApp(FRAMEWORKS_APP_OPTIONS, appName);
        firebaseAppsLRU.set(uid, app);
    }
    const auth = getAuth(app);
    if (auth.currentUser?.uid !== uid) {
        // TODO(jamesdaniels) get custom claims
        const customToken = await adminAuth.createCustomToken(uid).catch((e: any) => console.error(e.message));
        if (!customToken) return;
        await signInWithCustomToken(auth, customToken);
    }
    req.firebaseApp = app;
    req.currentUser = auth.currentUser;
};

export const handleFactory = (frameworkHandle: (req: Request, res: Response) => void) => async (req: Request, res: Response) => {
    if (req.url === '/__session') {
        await mintCookie(req, res);
    } else {
        await handleAuth(req);
        frameworkHandle(req, res);
    }
};
