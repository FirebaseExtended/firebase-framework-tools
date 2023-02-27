type Server = typeof import('./angular/index.js') |
    typeof import('./express/index.js') |
    typeof import('./next.js/index.js') |
    typeof import('./nuxt/index.js') |
    typeof import('./nuxt3/index.js') |
    typeof import('./sveltekit/index.js')|
    typeof import('./_devMode/index.js') |
    typeof import('./angular/firebase-aware.js') |
    typeof import('./express/firebase-aware.js') |
    typeof import('./next.js/firebase-aware.js') |
    typeof import('./nuxt/firebase-aware.js') |
    typeof import('./nuxt3/firebase-aware.js') |
    typeof import('./_devMode/firebase-aware.js');

const dirname = process.env.__FIREBASE_FRAMEWORKS_ENTRY__;
const usingFirebaseJsSdk = !!process.env.__FIREBASE_DEFAULTS__;
const basename = usingFirebaseJsSdk ? 'firebase-aware' : 'index';

const { handle: frameworkHandle }: Server = await import(`./${dirname}/${basename}.js`);

// TODO move to middleware
const firebaseAware = usingFirebaseJsSdk ? await import('./firebase-aware.js') : undefined;

export const handle = firebaseAware?.handleFactory(frameworkHandle) || frameworkHandle;
