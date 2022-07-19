import { pathToFileURL } from "url";

const { handle } = require(`${pathToFileURL(process.cwd())}/bootstrap.js`);

export { handle };