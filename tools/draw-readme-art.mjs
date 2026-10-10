// Draw the README section icons and section cards, each in a light and a dark version.
//
//   node tools/draw-readme-art.mjs
//
// The artwork is static: run this by hand after changing a card's text, a colour or an icon, and commit the SVGs.
// The README links them through <picture> so GitHub shows the version matching the reader's theme. Colours follow
// the website (site/styles.css). The banner (assets/readme-banner.png) and the survey figures are not drawn here.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ROOT } from "./public-files.mjs";

const OUT = path.join(ROOT, "assets", "readme");
const SANS = "Manrope,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

// Accent per role: [light theme, dark theme]. The light values are the website's green, rose and badge colours.
const ACCENT = {
  green: ["#125b50", "#5fb8a4"],
  rose: ["#914252", "#e58fa1"],
  blue: ["#416cb3", "#8fb0ea"],
  gold: ["#99700c", "#e3bb5c"],
  teal: ["#087f80", "#4fc3c4"],
  grey: ["#566760", "#9fb2ab"],
};
const CHROME = {
  light: { tile: "#f4f7f5", tileLine: "#dce4df", card: "#ffffff", cardLine: "#dce4df", cardTile: "#e7f0eb", title: "#172b28", sub: "#566760" },
  dark: { tile: "#16211f", tileLine: "#2b3a37", card: "#121a19", cardLine: "#2b3a37", cardTile: "#1c2a27", title: "#e9f1ee", sub: "#9fb2ab" },
};

// Glyphs on a 24x24 grid; "CUR" is replaced by the stroke colour.
const GLYPHS = {
  about: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="7.6" r=".6" fill="CUR"/>',
  questions: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.7"/><circle cx="12" cy="16.9" r=".6" fill="CUR"/>',
  guide: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/>' +
    '<rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
  framework: '<rect x="3.5" y="4" width="17" height="4" rx="1.2"/><rect x="3.5" y="10" width="17" height="4" rx="1.2"/><rect x="3.5" y="16" width="17" height="4" rx="1.2"/>',
  uses: '<path d="M12 4l8.5 4.3L12 12.6 3.5 8.3 12 4Z"/><path d="M3.5 12.2 12 16.5l8.5-4.3"/><path d="M3.5 16 12 20.3l8.5-4.3"/>',
  recursion: '<path d="M19.5 12a7.5 7.5 0 0 1-12.9 5.2"/><path d="M4.5 12a7.5 7.5 0 0 1 12.9-5.2"/><path d="M17.6 3.6v3.4h-3.4"/><path d="M6.4 20.4V17h3.4"/>',
  problems: '<path d="M5.5 21V4"/><path d="M5.5 4.5h11l-2.4 3.8 2.4 3.8h-11"/>',
  references: '<path d="M4.5 5.5c2.6-1 5-.8 7.5.8v13c-2.5-1.6-4.9-1.8-7.5-.8v-13Z"/><path d="M19.5 5.5c-2.6-1-5-.8-7.5.8v13c2.5-1.6 4.9-1.8 7.5-.8v-13Z"/>',
  contribute: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>',
  contributors: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5"/>' +
    '<circle cx="16.5" cy="9.5" r="2.4"/><path d="M15.6 14.2c2.4-.2 4.4 1.3 4.9 4.3"/>',
  star: '<path d="M12 4.2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8L12 4.2Z"/>',
  cite: '<path d="M5 17.5c0-4.5 1.2-7.5 4.5-9.5M13 17.5c0-4.5 1.2-7.5 4.5-9.5"/><circle cx="7" cy="16" r="2.2"/><circle cx="15" cy="16" r="2.2"/>',
  layout: '<path d="M4 6.5h6l1.6 2H20v10H4z"/>',
  license: '<path d="M12 4v16M8 20h8M5 7h14"/><path d="M5 7l-2.5 6a2.5 2.5 0 0 0 5 0L5 7ZM19 7l-2.5 6a2.5 2.5 0 0 0 5 0L19 7Z"/>',
};
const ICON_ACCENT = {
  about: "teal", questions: "gold", guide: "green", framework: "blue", uses: "green", recursion: "rose", problems: "green",
  references: "grey", contribute: "rose", contributors: "teal", star: "gold", cite: "grey", layout: "grey", license: "grey",
};
// Section cards: [file key and icon, title, subtitle]; tools/render-readme.mjs links each card to its section.
const CARDS = [
  ["about", "Overview", "From experience to recursion"],
  ["questions", "Research questions", "What limits the next gain?"],
  ["framework", "The review at a glance", "Uses, conditions, claims"],
  ["recursion", "Toward RSI", "Testing the two links"],
  ["problems", "Open problems", "Six directions to start"],
  ["references", "References", "The survey's library"],
];

function glyph(name, color, scale, dx, dy) {
  const body = GLYPHS[name].replaceAll("CUR", color);
  return `<g transform="translate(${dx} ${dy}) scale(${scale})" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
}

function icon(name, theme) {
  const c = CHROME[theme];
  const color = ACCENT[ICON_ACCENT[name]][theme === "light" ? 0 : 1];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">` +
    `<rect x=".5" y=".5" width="35" height="35" rx="9" fill="${c.tile}" stroke="${c.tileLine}"/>${glyph(name, color, 1, 6, 6)}</svg>\n`;
}

function card(index, key, title, sub, theme) {
  const c = CHROME[theme];
  const color = ACCENT[ICON_ACCENT[key]][theme === "light" ? 0 : 1];
  const text = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "’");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 246 70" width="246" height="70" role="img" aria-label="${text(title)}: ${text(sub)}">` +
    `<defs><clipPath id="r"><rect width="246" height="70" rx="9.5"/></clipPath></defs>` +
    `<rect width="246" height="70" rx="9.5" fill="${c.card}"/><rect width="4" height="70" fill="${color}" clip-path="url(#r)"/>` +
    `<rect x=".5" y=".5" width="245" height="69" rx="9" fill="none" stroke="${c.cardLine}"/>` +
    `<rect x="19" y="17" width="36" height="36" rx="9" fill="${c.cardTile}"/>${glyph(key, color, 0.75, 28, 26)}` +
    `<text x="64" y="33" fill="${c.title}" font-family="${SANS}" font-size="14.5" font-weight="700">${text(title)}</text>` +
    `<text x="64" y="51" fill="${c.sub}" font-family="${SANS}" font-size="11">${text(sub)}</text>` +
    `<text x="232" y="18" fill="${color}" font-family="${SANS}" font-size="10" font-weight="700" text-anchor="end">0${index}</text></svg>\n`;
}

await mkdir(path.join(OUT, "icons"), { recursive: true });
let written = 0;
for (const theme of Object.keys(CHROME)) {
  for (const name of Object.keys(ICON_ACCENT)) {
    await writeFile(path.join(OUT, "icons", `${name}-${theme}.svg`), icon(name, theme));
    written += 1;
  }
  for (const [i, [key, title, sub]] of CARDS.entries()) {
    await writeFile(path.join(OUT, `card-${key}-${theme}.svg`), card(i + 1, key, title, sub, theme));
    written += 1;
  }
}
console.log(`Wrote ${written} SVGs under assets/readme.`);
