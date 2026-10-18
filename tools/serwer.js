// Lokalny serwer do podglądu gry: node tools/serwer.js [port]
// Wysyła te same nagłówki bezpieczeństwa co Netlify (z netlify.toml), żeby błędy CSP
// wychodziły już lokalnie.

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KORZEN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = path.join(KORZEN, 'app');

const TYPY = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.mp3': 'audio/mpeg',
};

async function politykaCSP() {
  const toml = await readFile(path.join(KORZEN, 'netlify.toml'), 'utf8');
  return toml.match(/Content-Security-Policy = "([^"]+)"/)?.[1] ?? '';
}

export async function uruchomSerwer(port = 8080) {
  const csp = await politykaCSP();
  const serwer = http.createServer(async (zadanie, odpowiedz) => {
    try {
      const sciezkaUrl = decodeURIComponent(new URL(zadanie.url, 'http://lokalnie').pathname);
      let plik = path.normalize(path.join(APP, sciezkaUrl));
      if (!plik.startsWith(APP)) throw new Error('poza katalogiem');
      if ((await stat(plik).catch(() => null))?.isDirectory()) plik = path.join(plik, 'index.html');
      const tresc = await readFile(plik);
      odpowiedz.writeHead(200, {
        'Content-Type': TYPY[path.extname(plik)] ?? 'application/octet-stream',
        'Cache-Control': 'no-cache',
        'Content-Security-Policy': csp,
        'X-Content-Type-Options': 'nosniff',
      });
      odpowiedz.end(tresc);
    } catch {
      odpowiedz.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      odpowiedz.end('Nie znaleziono');
    }
  });
  await new Promise((gotowe) => serwer.listen(port, '127.0.0.1', gotowe));
  return serwer;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.argv[2]) || 8080;
  await uruchomSerwer(port);
  console.log(`Gra działa pod adresem http://localhost:${port}/`);
}
