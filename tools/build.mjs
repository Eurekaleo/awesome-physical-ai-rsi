import assert from "node:assert/strict";
import { cp, lstat, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { publicFiles, ROOT } from "./public-files.mjs";

const files = await publicFiles();
const output = path.join(ROOT, "dist");
assert.equal(path.dirname(output), path.resolve(ROOT));
const existing = await lstat(output).catch((error) => {
  if (error.code !== "ENOENT") throw error;
});
assert(!existing?.isSymbolicLink(), "Build output must not be a symlink");

// This directory is owned exclusively by the public build.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
let bytes = 0;
for (const file of files) {
  const destination = path.join(output, file);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(path.join(ROOT, file), destination);
  bytes += (await lstat(destination)).size;
}
await writeFile(path.join(output, ".nojekyll"), "");
console.log(
  `Public build ready: ${files.length + 1} files, ${(bytes / 1024 / 1024).toFixed(2)} MB. Output: dist/`,
);
