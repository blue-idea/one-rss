import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const port = Number(process.argv[2] ?? "4173");
const rootDir = path.resolve(process.argv[3] ?? "dist");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function resolveRequestPath(urlPathname) {
  const pathname = decodeURIComponent(urlPathname);
  const safePath = pathname.replace(/^\/+/, "");
  const exactPath = path.join(rootDir, safePath);

  if (safePath && existsSync(exactPath)) {
    return exactPath;
  }

  if (!path.extname(safePath)) {
    const htmlPath = path.join(rootDir, `${safePath || "index"}.html`);
    if (existsSync(htmlPath)) {
      return htmlPath;
    }
  }

  return null;
}

const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const filePath = resolveRequestPath(requestUrl.pathname);

  if (!filePath) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
    return;
  }

  const fileStat = await stat(filePath);
  const extension = path.extname(filePath).toLowerCase();
  const contentType =
    MIME_TYPES[extension] ?? "application/octet-stream";

  res.writeHead(200, {
    "Content-Length": fileStat.size,
    "Content-Type": contentType,
  });

  createReadStream(filePath).pipe(res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Static server listening on http://127.0.0.1:${port}`);
});
