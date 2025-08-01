import assert from "assert";
import fs from "fs";
import path from "path";
import os from "os";
import { updateOrCreateGitignore } from "./index";

describe("update or create .gitignore", () => {
  let tmpDir: string;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-gitignore"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it(".gitignore file exists and is correctly updated with missing paths", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "existingpath/");

    updateOrCreateGitignore(tmpDir, ["existingpath/", "newpath/"]);

    const gitignoreContent = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    assert.equal(`existingpath/\nnewpath/`, gitignoreContent);
  });
  it(".gitignore file does not exist and is created", () => {
    updateOrCreateGitignore(tmpDir, ["chickenpath/", "newpath/"]);
    const gitignoreContent = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    assert.equal(`chickenpath/\nnewpath/`, gitignoreContent);
  });
});
