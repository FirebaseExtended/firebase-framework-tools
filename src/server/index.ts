import { onRequest } from 'firebase-functions/v2/https';

const { HTTPS_OPTIONS, FRAMEWORK } = require(`${process.cwd()}/settings`);
const { handle } = require(`../frameworks/${FRAMEWORK}/server`);

export const ssr = onRequest(HTTPS_OPTIONS, handle);
