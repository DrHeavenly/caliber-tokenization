// Zero-dependency static server for previewing public/ locally.
// Vercel serves the same directory in production; this only exists so
// `npm run dev` gives you a URL without installing anything.

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

createServer(async (req, res) => {
  // normalize() collapses `..` so a request can't escape public/.
  const rel = normalize(decodeURIComponent(new URL(req.url, "http://localhost").pathname));
  let file = join(ROOT, rel);
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  // Mirrors vercel.json's cleanUrls: /overview resolves to overview.html, so a
  // link that works locally works in production.
  const candidates = [file, `${file}.html`, join(file, "index.html")];
  file = "";
  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) {
        file = candidate;
        break;
      }
    } catch {
      // try the next candidate
    }
  }
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
    return;
  }

  res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`serving public/ at http://localhost:${PORT}`);
});
