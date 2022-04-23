import { Request as FunctionsRequest } from 'firebase-functions/v2/https';
import type { Response } from 'express';
import { initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, User } from 'firebase/auth';
import cookie from 'cookie';
import LRU from 'lru-cache';

const { FRAMEWORK, FIREBASE_CONFIG } = require(`${process.cwd()}/settings`);
const { handle: frameworkHandle } = require(`../frameworks/${FRAMEWORK}/server`);

const adminApp = initializeAdminApp();
const adminAuth = getAdminAuth(adminApp);

export type Request = FunctionsRequest & { firebaseApp?: FirebaseApp, currentUser?: User|null };

// TODO performance tune this
const firebaseAppsLRU = new LRU<string, FirebaseApp>({
    max: 100,
    ttl: 1_000 * 60 * 5,
    allowStale: true,
    updateAgeOnGet: true,
    dispose: (value) => {
        deleteApp(value);
    }
});

export const handle = async (req: Request, res: Response) => {
    // TODO figure out why middleware isn't doing this for us
    const cookies = cookie.parse(req.headers.cookie || '');
    let _decodeIdTokenMemo;
    const decodeIdToken = async () => _decodeIdTokenMemo ||= cookies.__session ?
        await adminAuth.verifySessionCookie(cookies.__session, true).catch(() => null) :
        null;
    if (req.url === '/__next/cookie') {
        if (req.body.user) {
            const idToken = req.body.user.idToken;
            const decodedIdTokenFromBody = await adminAuth.verifyIdToken(idToken, true);
            // TODO freshen the session cookie if needed
            //      check for idToken having been freshly minted
            const decodedIdToken = await decodeIdToken();
            if (decodedIdTokenFromBody.uid === decodedIdToken?.uid) {
                res.status(304).end();
            } else {
                // TODO allow this to be configurable
                const expiresIn = 60 * 60 * 24 * 5 * 1000;
                // TODO log the failure
                const cookie = await adminAuth.createSessionCookie(idToken, { expiresIn }).catch(() => null);
                if (cookie) {
                    const options = { maxAge: expiresIn, httpOnly: true, secure: true };
                    res.cookie('__session', cookie, options).status(201).end();
                } else {
                    res.status(401).end();
                }
            }
        } else {
            res.status(204).clearCookie('__session').end();
        }
        return;
    }
    // TODO only go down this path for routes that need it
    const decodedIdToken = await decodeIdToken();
    if (FIREBASE_CONFIG && decodedIdToken) {
        const { uid } = decodedIdToken;
        let app = firebaseAppsLRU.get(uid);
        if (!app) {
            const random = Math.random().toString(36).split('.')[1];
            const appName = `authenticated-context:${uid}:${random}`;
            app = initializeApp(FIREBASE_CONFIG, appName);
            firebaseAppsLRU.set(uid, app);
        }
        const auth = getAuth(app);
        if (auth.currentUser?.uid !== uid) {
            // TODO get custom claims
            //      check in with the Auth team to make sure this is the best way of doing this
            const customToken = await adminAuth.createCustomToken(decodedIdToken.uid);
            await signInWithCustomToken(auth, customToken);
        }
        // TODO can we use a symbol for these or otherwise set them as non iterable
        //      can we drop this and just use useRouter().query.__FIREBASE_APP_NAME?
        // Pass the authenticated firebase app name to getInitialProps, getServerSideProps via req
        // I'd normally reach for a global here, but we need to think about concurrency now with CF3v2
        req.firebaseApp = app;
        req.currentUser = auth.currentUser;
    }
    frameworkHandle(req, res);
};
