import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import {
  assertPublicPath,
  DATA_FILE,
  PROJECT_NAME,
  publicFiles,
  REPO_URL,
  ROOT,
  SHORT_NAME,
  SITE_URL,
  walkFiles,
} from "./public-files.mjs";
import { renderReadme } from "./render-readme.mjs";

const run = promisify(execFile);
const references = JSON.parse(
  await readFile(path.join(ROOT, DATA_FILE), "utf8"),
);
const fields = [
  "id",
  "title",
  "authors",
  "year",
  "venue",
  "type",
  "url",
  "doi",
].sort();
const types = new Set(["conference", "journal", "preprint", "book", "other"]);
assert(
  Array.isArray(references) && references.length > 0,
  "Reference library must be a nonempty array",
);
const ids = new Set();
for (const reference of references) {
  assert(
    reference && typeof reference === "object",
    "Reference must be an object",
  );
  assert.deepEqual(
    Object.keys(reference).sort(),
    fields,
    `Only public bibliographic fields are allowed: ${reference.id}`,
  );
  assert(
    typeof reference.id === "string" &&
      /^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/.test(reference.id),
    "Invalid reference ID",
  );
  assert(!ids.has(reference.id), `Duplicate reference ID: ${reference.id}`);
  ids.add(reference.id);
  for (const field of ["title", "venue", "url", "doi"]) {
    assert(
      typeof reference[field] === "string",
      `${reference.id}: ${field} must be a string`,
    );
    assert(
      reference[field] === reference[field].trim(),
      `${reference.id}: ${field} has extra whitespace`,
    );
    assert(
      !/[<>\u0000-\u001f]/.test(reference[field]),
      `${reference.id}: ${field} contains markup or control characters`,
    );
  }
  assert(reference.title, `${reference.id}: missing title`);
  assert(
    Array.isArray(reference.authors) &&
      reference.authors.every(
        (author) =>
          typeof author === "string" &&
          author.trim() === author &&
          author.length &&
          !/[<>\u0000-\u001f]/.test(author),
      ),
    `${reference.id}: invalid authors`,
  );
  assert(
    reference.year === null ||
      (Number.isInteger(reference.year) &&
        reference.year >= 1800 &&
        reference.year <= new Date().getUTCFullYear() + 1),
    `${reference.id}: invalid year`,
  );
  assert(
    types.has(reference.type),
    `${reference.id}: unknown publication type`,
  );
  if (reference.url) {
    const url = new URL(reference.url);
    assert(
      ["https:", "http:"].includes(url.protocol) &&
        !url.username &&
        !url.password,
      `${reference.id}: unsafe URL`,
    );
  }
  assert(
    !reference.doi || /^10\.\d{4,9}\/\S+$/i.test(reference.doi),
    `${reference.id}: invalid DOI`,
  );
}

const readme = await readFile(path.join(ROOT, "README.md"), "utf8");
assert.equal(
  readme,
  renderReadme(references),
  "README is out of date. Run npm run readme.",
);
const files = await publicFiles();
const fileSet = new Set(files);
assert(fileSet.has("assets/readme-banner.png"), "README banner is missing");
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const htmlByFile = new Map(
  await Promise.all(
    htmlFiles.map(async (file) => [
      file,
      await readFile(path.join(ROOT, file), "utf8"),
    ]),
  ),
);
const idsByFile = new Map();
for (const [file, html] of htmlByFile) {
  const pageIds = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
  assert.equal(
    new Set(pageIds).size,
    pageIds.length,
    `Duplicate HTML IDs: ${file}`,
  );
  idsByFile.set(file, new Set(pageIds));
}

function checkLocalReference(value, source) {
  const ref = value.replaceAll("&amp;", "&");
  if (/^(?:mailto:|tel:|data:)/i.test(ref)) return;
  if (/^https?:/i.test(ref)) {
    const absolute = new URL(ref);
    if (
      absolute.origin !== new URL(SITE_URL).origin ||
      !absolute.pathname.startsWith(new URL(SITE_URL).pathname)
    )
      return;
  } else
    assert(
      !/^[a-z][a-z\d+.-]*:/i.test(ref),
      `Unsafe link protocol in ${source}: ${ref}`,
    );
  assert(!ref.startsWith("//"), `Protocol-relative link in ${source}: ${ref}`);
  const base = new URL(source, SITE_URL);
  const resolved = new URL(ref, base);
  const prefix = new URL(SITE_URL).pathname;
  assert(
    resolved.pathname.startsWith(prefix),
    `Link leaves project path in ${source}: ${ref}`,
  );
  let file = decodeURIComponent(resolved.pathname.slice(prefix.length));
  if (!file || file.endsWith("/")) file += "index.html";
  assert(fileSet.has(file), `Missing local public file in ${source}: ${ref}`);
  if (resolved.hash && idsByFile.has(file))
    assert(
      idsByFile.get(file).has(decodeURIComponent(resolved.hash.slice(1))),
      `Missing anchor in ${source}: ${ref}`,
    );
}

for (const [file, html] of htmlByFile) {
  for (const [, ref] of html.matchAll(
    /\b(?:href|src|poster)=["']([^"']+)["']/g,
  ))
    checkLocalReference(ref, file);
  for (const [, attributes] of html.matchAll(/<meta\b([^>]+)>/gi)) {
    if (
      /\b(?:property|name)=["'](?:og:image|twitter:image)["']/i.test(attributes)
    ) {
      const content = attributes.match(/\bcontent=["']([^"']+)["']/i)?.[1];
      assert(content, `Missing social-preview image in ${file}`);
      checkLocalReference(content, file);
    }
  }
  for (const [, srcset] of html.matchAll(/\bsrcset=["']([^"']+)["']/g)) {
    for (const candidate of srcset.split(","))
      checkLocalReference(candidate.trim().split(/\s+/)[0], file);
  }
  assert(
    !/\bname=["']citation_[^"']+["']/i.test(html),
    `Unpublished scholarly metadata in ${file}`,
  );
  for (const [, json] of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    const data = JSON.parse(json);
    assert(
      !JSON.stringify(data).includes("ScholarlyArticle"),
      `Unpublished scholarly article metadata in ${file}`,
    );
  }
}
for (const file of files.filter((item) => item.endsWith(".css"))) {
  const css = await readFile(path.join(ROOT, file), "utf8");
  for (const [, ref] of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g))
    checkLocalReference(ref.trim(), file);
}
const manifest = JSON.parse(
  await readFile(path.join(ROOT, "site.webmanifest"), "utf8"),
);
for (const icon of manifest.icons ?? [])
  checkLocalReference(icon.src, "site.webmanifest");
if (manifest.start_url)
  checkLocalReference(manifest.start_url, "site.webmanifest");

const homepage = htmlByFile.get("index.html");
const homepageText = homepage.replaceAll("&amp;", "&");
assert(
  homepageText.includes(PROJECT_NAME) && homepageText.includes(SHORT_NAME),
  "Project name or short brand is missing",
);
assert(
  readme.replaceAll("&amp;", "&").includes(PROJECT_NAME),
  "README project name is missing",
);
assert.equal(
  manifest.name,
  PROJECT_NAME,
  "Manifest project name is inconsistent",
);
assert.equal(
  manifest.short_name,
  SHORT_NAME,
  "Manifest short brand is inconsistent",
);
const packageMetadata = JSON.parse(
  await readFile(path.join(ROOT, "package.json"), "utf8"),
);
assert.equal(
  packageMetadata.repository.url,
  `git+${REPO_URL}.git`,
  "Package repository URL is inconsistent",
);
assert.equal(
  packageMetadata.homepage,
  SITE_URL,
  "Package website URL is inconsistent",
);
for (const [file, html] of htmlByFile) {
  assert(
    !html.includes("Physical AI Survey"),
    `Outdated project name in ${file}`,
  );
  assert(
    !/awesome-physical-ai(?=[/"'#?]|\.git\b)/.test(html),
    `Outdated project URL in ${file}`,
  );
}
assert(homepage.includes(SITE_URL), "Canonical project URL is missing");
assert(
  idsByFile.get("index.html").has("references"),
  "Reference section is missing",
);
assert(
  idsByFile.get("index.html").has("publication"),
  "Publication section is missing",
);
const placeholders = [
  ...homepage.matchAll(
    /<template\b[^>]*data-survey-content=["']([^"']+)["'][^>]*>([\s\S]*?)<\/template>/g,
  ),
];
assert.deepEqual(
  placeholders.map((match) => match[1]).sort(),
  ["abstract", "citation", "framework", "overview"],
  "Reserved survey placeholders are missing or duplicated",
);
for (const [, name, content] of placeholders)
  assert.equal(
    content.trim(),
    "",
    `Survey placeholder must remain empty: ${name}`,
  );
const robots = await readFile(path.join(ROOT, "robots.txt"), "utf8");
const sitemap = await readFile(path.join(ROOT, "sitemap.xml"), "utf8");
assert(
  robots.includes(`Sitemap: ${SITE_URL}sitemap.xml`),
  "Sitemap is not advertised in robots.txt",
);
assert(
  sitemap.includes(`<loc>${SITE_URL}</loc>`),
  "Canonical homepage is missing from sitemap",
);

let repositoryFiles;
try {
  const { stdout: top } = await run("git", ["rev-parse", "--show-toplevel"], {
    cwd: ROOT,
  });
  if (path.resolve(top.trim()) === path.resolve(ROOT)) {
    const { stdout } = await run(
      "git",
      ["ls-files", "-co", "--exclude-standard", "-z"],
      { cwd: ROOT, maxBuffer: 8 * 1024 * 1024 },
    );
    repositoryFiles = [...new Set(stdout.split("\0").filter(Boolean))];
  }
} catch (error) {
  if (!String(error.stderr).includes("not a git repository")) throw error;
}
repositoryFiles ??= await walkFiles("", {
  ignore: new Set([
    ".git",
    ".DS_Store",
    "dist",
    "node_modules",
    "test-results",
    "playwright-report",
  ]),
});
for (const file of repositoryFiles) assertPublicPath(file);
console.log(
  `Checks passed: ${references.length} metadata-only references; README synchronized; ${files.length} public files; local links resolved; survey placeholders empty.`,
);
