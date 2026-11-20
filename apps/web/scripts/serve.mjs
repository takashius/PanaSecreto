// Servidor local mínimo para ver dist/ (solo desarrollo).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };
const port = Number(process.env.PORT ?? 4173);

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x').pathname;
  const rel = normalize(url === '/' ? '/index.html' : url).replace(/^(\.\.[/\\])+/, '');
  try {
    const body = await readFile(join(dist, rel));
    res.writeHead(200, { 'content-type': types[extname(rel)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }).end(await readFile(join(dist, '404.html')));
  }
}).listen(port, () => console.log(`web: http://localhost:${port}`));
