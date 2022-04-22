import { onRequest } from 'firebase-functions/v2/https';

const { HTTPS_OPTIONS, FRAMEWORK, FIREBASE_CONFIG } = require(`${process.cwd()}/settings`);
const { handle } = require(FIREBASE_CONFIG ? `./firebase-aware` : `../frameworks/${FRAMEWORK}/server`);

export default onRequest(HTTPS_OPTIONS, handle);
