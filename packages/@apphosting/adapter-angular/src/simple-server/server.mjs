import express from "express";
import path from "path";
import { fileURLToPath } from "url";
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "..", "browser")));
app.get("*", function (request, response) {
  response.sendFile(path.join(__dirname, "..", "browser", "index.html"));
});
var port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Node Express server listening on http://localhost:${port}`);
});
