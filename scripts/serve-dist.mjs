import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import process from "node:process";

const PORT = Number.parseInt(process.env.PORT ?? "4174", 10);
const ROOT = resolve(process.cwd(), "dist");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function resolvePath(urlPath) {
  const pathname = decodeURIComponent((urlPath ?? "/").split("?")[0] || "/");
  const normalizedPath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const candidates = [];

  if (normalizedPath === "/" || normalizedPath.length === 0) {
    candidates.push(join(ROOT, "index.html"));
  } else {
    const relativePath = normalizedPath.replace(/^[/\\]+/, "");
    candidates.push(join(ROOT, relativePath));

    if (!extname(relativePath)) {
      candidates.push(join(ROOT, `${relativePath}.html`));
      candidates.push(join(ROOT, relativePath, "index.html"));
    }
  }

  return candidates.find((candidate) => existsSync(candidate));
}

const server = createServer(async (request, response) => {
  const filePath = resolvePath(request.url);

  if (!filePath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not Found");
    return;
  }

  const fileStat = await stat(filePath);
  response.writeHead(200, {
    "Content-Length": fileStat.size,
    "Content-Type":
      MIME_TYPES[extname(filePath)] ?? "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`dist server listening on http://127.0.0.1:${PORT}`);
});
