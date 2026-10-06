import assert from "node:assert/strict";
import { lstat, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("../", import.meta.url));
export const SITE_URL = "https://eurekaleo.github.io/awesome-physical-ai/";
export const REPO_URL = "https://github.com/Eurekaleo/awesome-physical-ai";
export const DATA_FILE = "data/references.json";
export const BASE_FILES = [
  "index.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "site.webmanifest",
  DATA_FILE,
];

const ASSET_EXTENSIONS = new Set([
  ".png",
  ".webp",
  ".jpg",
  ".jpeg",
  ".avif",
  ".gif",
  ".ico",
  ".svg",
  ".woff",
  ".woff2",
  ".ttf",
  ".css",
  ".js",
  ".mjs",
]);
const SITE_EXTENSIONS = new Set([".css", ".js", ".mjs"]);
const ASSET_NOTICES = new Set([
  "assets/CREDITS.md",
  "assets/LICENSE",
  "assets/OFL.txt",
  "assets/fonts/OFL.txt",
  "assets/icons/LICENSE.txt",
]);
const FORBIDDEN_EXTENSIONS =
  /\.(?:pdf|tex|bib|bbl|blg|aux|cls|sty|zip|tar|tgz|gz|7z|rar|docx?|pptx?|key|pages|synctex|fdb_latexmk|fls)$/i;
const FORBIDDEN_DIRECTORIES =
  /(?:^|\/)(?:private|manuscript|overleaf|paper|review|source|sources)(?:\/|$)/i;

export function assertPublicPath(file) {
  assert(
    !FORBIDDEN_EXTENSIONS.test(file),
    `Nonpublic document or archive is present: ${file}`,
  );
  assert(
    !FORBIDDEN_DIRECTORIES.test(file),
    `Reserved private directory is present: ${file}`,
  );
  assert(
    !/(?:^|\/)\.env(?:\.|$)/.test(file),
    `Environment file is present: ${file}`,
  );
  assert(!file.includes(".."), `Unsafe file path: ${file}`);
}

export async function walkFiles(directory, { ignore = new Set() } = {}) {
  const files = [];
  const directoryInfo = await lstat(path.join(ROOT, directory));
  assert(
    directoryInfo.isDirectory() && !directoryInfo.isSymbolicLink(),
    `Public directory must not be a symlink: ${directory || "."}`,
  );
  for (const entry of await readdir(path.join(ROOT, directory), {
    withFileTypes: true,
  })) {
    if (ignore.has(entry.name)) continue;
    const file = path.posix.join(directory, entry.name);
    assert(!entry.isSymbolicLink(), `Symlinks are not allowed: ${file}`);
    if (entry.isDirectory()) files.push(...(await walkFiles(file, { ignore })));
    else if (entry.isFile()) files.push(file);
    else assert.fail(`Unsupported filesystem entry: ${file}`);
  }
  return files.sort();
}

export async function publicFiles() {
  const assets = await walkFiles("assets");
  const site = await walkFiles("site");
  for (const file of assets) {
    assert(
      ASSET_EXTENSIONS.has(path.extname(file).toLowerCase()) ||
        ASSET_NOTICES.has(file),
      `Asset extension is not approved: ${file}`,
    );
  }
  for (const file of site)
    assert(
      SITE_EXTENSIONS.has(path.extname(file)),
      `Site extension is not approved: ${file}`,
    );
  const files = [...BASE_FILES, ...assets, ...site];
  for (const file of files) {
    assertPublicPath(file);
    const info = await lstat(path.join(ROOT, file));
    assert(
      info.isFile() && !info.isSymbolicLink() && info.size > 0,
      `Missing or empty public file: ${file}`,
    );
  }
  assert(
    files.includes("assets/CREDITS.md"),
    "Public asset credits are required",
  );
  return files.sort();
}
