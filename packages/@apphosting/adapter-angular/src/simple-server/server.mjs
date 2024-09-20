// *** IMPORTANT NOTE ***
// make sure to run "npm run build" after making any changes to this file
// changes to this file will not be reflected unless that command is run
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const oneYear = 31_536_000_000;

const browserDistFolder = path.join(__dirname, "..", "browser");

app.get("*.*", express.static(browserDistFolder, { maxAge: oneYear }));
app.get("*", express.static(browserDistFolder, { cacheControl: false, extensions: ["html"] }));
app.get("*", (request, response) => {
  response.sendFile(path.join(browserDistFolder, "index.html"), { cacheControl: false });
});
var port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Node Express server listening on http://localhost:${port}`);
});
