// Wersja gry i lista plików do pracy offline.
// Uruchomienie po każdej zmianie w app/:  node tools/wersja.js
//
// Wersja to skrót zawartości wszystkich plików gry. Zmiana dowolnego pliku zmienia
// wersję, a więc i sw.js, dzięki czemu urządzenia pobierają nową wersję gry.
// Test tests/wersja.test.js pilnuje, żeby sw.js i js/wersja.js były aktualne.

import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const KATALOG_APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'app');
// sw.js nie trafia na własną listę; js/wersja.js jest na liście, ale nie wchodzi do skrótu
// (zawiera sam skrót).
const POZA_LISTA = new Set(['sw.js']);
const POZA_SKROTEM = new Set(['js/wersja.js']);

export async function plikiAplikacji(katalog = KATALOG_APP) {
  const wynik = [];
  async function przejdz(wzgledny) {
    const wpisy = await readdir(path.join(katalog, wzgledny), { withFileTypes: true });
    for (const w of wpisy) {
      if (w.name.startsWith('.')) continue;
      const sciezka = wzgledny ? `${wzgledny}/${w.name}` : w.name;
      if (w.isDirectory()) {
        if (sciezka !== 'audio') await przejdz(sciezka);
      } else if (!POZA_LISTA.has(sciezka)) {
        wynik.push(sciezka);
      }
    }
  }
  await przejdz('');
  return wynik.sort();
}

// Numery części słuchowiska, dla których jest plik audio/czesc-N.mp3.
export async function nagrania(katalog = KATALOG_APP) {
  const wpisy = await readdir(path.join(katalog, 'audio')).catch(() => []);
  return wpisy
    .map((n) => /^czesc-([1-6])\.mp3$/.exec(n)?.[1])
    .filter(Boolean)
    .map(Number)
    .sort((a, b) => a - b);
}

export async function obliczWersje(pliki, katalog = KATALOG_APP, dodatek = '') {
  const skrot = createHash('sha256');
  // Lista nagrań wchodzi do skrótu: dodanie nagrania zmienia wersję gry.
  skrot.update(dodatek);
  for (const p of pliki.filter((p) => !POZA_SKROTEM.has(p))) {
    skrot.update(p);
    skrot.update('\0');
    skrot.update(await readFile(path.join(katalog, p)));
    skrot.update('\0');
  }
  return skrot.digest('hex').slice(0, 12);
}

export function trescSW(szablon, wersja, pliki) {
  const lista = ['./', ...pliki].map((p) => `  '${p}',`).join('\n');
  return szablon
    .replace(/const WERSJA = '[^']*';/, `const WERSJA = '${wersja}';`)
    .replace(/const PLIKI = \[[\s\S]*?\];/, `const PLIKI = [\n${lista}\n];`);
}

export function trescWersjiJs(wersja, numery = []) {
  return (
    `// Plik generowany: node tools/wersja.js\nexport const WERSJA = '${wersja}';\n`
  );
}

export async function oczekiwanePliki() {
  const pliki = await plikiAplikacji();
  const numery = await nagrania();
  const wersja = await obliczWersje(pliki, KATALOG_APP, numery.length ? `nagrania:${numery.join(',')}` : '');
  const sw = trescSW(await readFile(path.join(KATALOG_APP, 'sw.js'), 'utf8'), wersja, pliki);
  return { wersja, pliki, sw, wersjaJs: trescWersjiJs(wersja, numery), nagrania: numery };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { wersja, pliki, sw, wersjaJs } = await oczekiwanePliki();
  await writeFile(path.join(KATALOG_APP, 'sw.js'), sw);
  await writeFile(path.join(KATALOG_APP, 'js', 'wersja.js'), wersjaJs);
  console.log(`Wersja gry: ${wersja} (${pliki.length} plików w pamięci offline).`);
}
