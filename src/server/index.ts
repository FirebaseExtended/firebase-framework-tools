import { onRequest } from 'firebase-functions/v2/https';
import { pathToFileURL } from 'url';
export { Request } from './firebase-aware.js';

const { HTTPS_OPTIONS, FRAMEWORK } = require(`${pathToFileURL(process.cwd())}/settings`);
const { handle } = require(`../frameworks/${FRAMEWORK}/server`);

export const ssr = onRequest(HTTPS_OPTIONS, handle);
