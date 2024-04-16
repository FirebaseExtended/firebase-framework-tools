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

app.use(express.static(path.join(__dirname, "..", "browser"), { maxAge: oneYear }));
app.get("*", function (request, response) {
  response.sendFile(path.join(__dirname, "..", "browser", "index.html"));
});
var port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Node Express server listening on http://localhost:${port}`);
});
