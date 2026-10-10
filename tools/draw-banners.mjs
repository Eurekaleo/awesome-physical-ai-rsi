// Draw the README banner (assets/readme-banner.png) and the social preview (assets/social-preview.png) from the
// teaser illustration, the project mark and the site's font, with a headless Chrome, Chromium or Edge.
//
//   node tools/draw-banners.mjs
//
// Run by hand after changing the wording or the teaser, then commit the PNGs. The banners carry no counts or
// dates, so they do not go stale when the bibliography changes.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT } from "./public-files.mjs";
import { SURVEY } from "./survey-content.mjs";

const BANNERS = [
  // [output file, width, height, title size, teaser width]
  ["assets/readme-banner.png", 1600, 600, 48, 860],
  ["assets/social-preview.png", 1200, 630, 40, 590],
];

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  const found = candidates.find((candidate) => candidate && existsSync(candidate));
  if (!found) throw new Error("No Chrome, Chromium or Edge found; set CHROME_PATH");
  return found;
}

function page(width, height, titleSize, teaserWidth) {
  const asset = (file) => pathToFileURL(path.join(ROOT, file)).href;
  const [lead, rest] = SURVEY.title.split(" to ");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Manrope; src: url("${asset("assets/fonts/manrope-latin.woff2")}") format("woff2"); font-weight: 200 800; }
html, body { margin: 0; }
body { width: ${width}px; height: ${height}px; overflow: hidden; font-family: Manrope, sans-serif; color: #172b28;
  background: linear-gradient(90deg, #f4f7f5 0%, #f4f7f5 34%, #ffffff 58%); position: relative; }
.copy { position: absolute; left: ${Math.round(width * 0.045)}px; top: 50%; transform: translateY(-50%); width: ${Math.round(width - teaserWidth - width * 0.06)}px; }
.brand { display: flex; align-items: center; gap: 14px; font-size: ${Math.round(titleSize * 0.42)}px; font-weight: 800; color: #125b50; margin-bottom: ${Math.round(titleSize * 0.75)}px; }
.brand img { width: ${Math.round(titleSize * 0.72)}px; height: ${Math.round(titleSize * 0.72)}px; border-radius: 7px; }
.brand span { font-weight: 500; }
h1 { margin: 0; font-size: ${titleSize}px; line-height: 1.12; font-weight: 700; letter-spacing: -0.01em; }
h1 em { font-style: normal; color: #125b50; }
.subtitle { margin: ${Math.round(titleSize * 0.42)}px 0 ${Math.round(titleSize * 0.5)}px; font-size: ${Math.round(titleSize * 0.4)}px; line-height: 1.45; color: #566760; }
.rule { width: 300px; height: 1px; background: #dce4df; margin-bottom: ${Math.round(titleSize * 0.42)}px; }
.status { display: flex; align-items: center; gap: 14px; font-size: ${Math.round(titleSize * 0.35)}px; color: #566760; }
.status strong { color: #125b50; font-weight: 700; }
.status i { width: 6px; height: 6px; background: #914252; display: inline-block; }
.teaser { mix-blend-mode: multiply; position: absolute; right: ${Math.round(width * 0.025)}px; top: 50%; transform: translateY(-50%); width: ${teaserWidth}px; }
</style></head><body>
<div class="copy">
  <div class="brand"><img src="${asset("assets/mark.png")}" alt=""><div>Physical AI <span>+ RSI</span></div></div>
  <h1>${lead}<br>to <em>${rest.replace(" Self-", "<br>Self&#8209;")}</em></h1>
  <p class="subtitle">${SURVEY.subtitle}</p>
  <div class="rule"></div>
  <div class="status"><strong>A survey &amp; reference library</strong><i></i>Paper coming soon</div>
</div>
<img class="teaser" src="${asset("assets/teaser.webp")}" alt="">
</body></html>`;
}

const browser = findBrowser();
const temp = await mkdtemp(path.join(os.tmpdir(), "banners-"));
try {
  for (const [file, width, height, titleSize, teaserWidth] of BANNERS) {
    const html = path.join(temp, "banner.html");
    await writeFile(html, page(width, height, titleSize, teaserWidth));
    execFileSync(browser, [
      "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--allow-file-access-from-files",
      `--window-size=${width},${height}`, `--user-data-dir=${path.join(temp, "profile")}`, "--virtual-time-budget=3000",
      `--screenshot=${path.join(ROOT, file)}`, pathToFileURL(html).href,
    ], { stdio: "ignore" });
    console.log(`Wrote ${file} (${width}x${height})`);
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}
