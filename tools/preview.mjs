import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { ROOT } from "./public-files.mjs";

const output = path.join(ROOT, "dist");
await stat(path.join(output, "index.html")).catch(() => {
  throw new Error("Build the public site first with npm run build.");
});
const prefix = "/awesome-physical-ai/";
const portArgument = process.argv.indexOf("--port");
let port = Number(portArgument >= 0 ? process.argv[portArgument + 1] : 4173);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Port must be between 1024 and 65535.");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};
const server = createServer(async (request, response) => {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    if (pathname === "/" || pathname === prefix.slice(0, -1)) {
      response.writeHead(302, { Location: prefix }).end();
      return;
    }
    if (!pathname.startsWith(prefix)) {
      response.writeHead(404).end("Not found");
      return;
    }
    const relative = pathname.slice(prefix.length) || "index.html";
    const candidate = path.resolve(
      output,
      relative.endsWith("/") ? `${relative}index.html` : relative,
    );
    const file = await realpath(candidate);
    if (
      !file.startsWith(`${output}${path.sep}`) ||
      !(await stat(file)).isFile()
    ) {
      response.writeHead(404).end("Not found");
      return;
    }
    const body = await readFile(file);
    response.writeHead(200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") {
      const body = await readFile(path.join(output, "404.html"));
      response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      response.end(request.method === "HEAD" ? undefined : body);
    } else response.writeHead(400).end("Bad request");
  }
});
server.on("error", (error) => {
  if (error.code === "EADDRINUSE" && port < 65535) {
    port += 1;
    server.listen(port, "127.0.0.1");
  } else throw error;
});
server.on("listening", () =>
  console.log(`Preview: http://127.0.0.1:${port}${prefix}`),
);
server.listen(port, "127.0.0.1");
