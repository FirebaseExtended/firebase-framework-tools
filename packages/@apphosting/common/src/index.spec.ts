import assert from "assert";
import fs from "fs";
import path from "path";
import os from "os";
const importIndex = import("@apphosting/common/dist/index.js");

describe("update or create .gitignore", () => {
  let tmpDir: string;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-gitignore"));
  });

  it(".gitignore file exists and is correctly updated with missing paths", async () => {
    const { updateOrCreateGitignore } = await importIndex;
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "existingpath/");

    updateOrCreateGitignore(tmpDir, ["existingpath/", "newpath/"]);

    const gitignoreContent = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    assert.equal(`existingpath/\nnewpath/\n`, gitignoreContent);
  });
  it(".gitignore file does not exist and is created", async () => {
    const { updateOrCreateGitignore } = await importIndex;
    updateOrCreateGitignore(tmpDir, ["chickenpath/", "newpath/"]);
    const gitignoreContent = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    assert.equal(`chickenpath/\nnewpath/`, gitignoreContent);
  });
});
