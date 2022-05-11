import {
    beforeAuthStateChanged,
    onIdTokenChanged,
    User,
    Auth,
} from 'firebase/auth';
import { ID_TOKEN_MAX_AGE } from '../../constants';

let alreadySetup = false;
let lastPostedIdToken: string|undefined|null = null;

const mintCookie = async (user: User|null) => {
    const idTokenResult = user && await user.getIdTokenResult();
    const idTokenAge = idTokenResult && (new Date().getTime() - Date.parse(idTokenResult.issuedAtTime)) / 1_000;
    if (idTokenAge && idTokenAge > ID_TOKEN_MAX_AGE) return;
    // Specifically trip null => undefined when logged out, to delete any existing cookie
    const idToken = idTokenResult?.token;
    if (lastPostedIdToken === idToken) return;
    lastPostedIdToken = idToken;
    await fetch('/__session', {
        method: idToken ? 'POST' : 'DELETE',
        headers: idToken ? {
            'Authorization': `Bearer ${idToken}`,
        } : {}
    });
};

export const initializeClient = (auth: Auth) => {
    if (auth.app.name !== '[DEFAULT]') return;
    if (typeof window === 'undefined') return;
    if (alreadySetup) return;
    alreadySetup = true;
    beforeAuthStateChanged(auth, mintCookie, () => {
        mintCookie(auth.currentUser)
    });
    onIdTokenChanged(auth, user => mintCookie(user));
}
