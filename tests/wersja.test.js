import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { oczekiwanePliki, KATALOG_APP } from '../tools/wersja.js';

test('sw.js i js/wersja.js są aktualne (uruchom: node tools/wersja.js)', async () => {
  const { sw, wersjaJs } = await oczekiwanePliki();
  assert.equal(await readFile(path.join(KATALOG_APP, 'sw.js'), 'utf8'), sw);
  assert.equal(await readFile(path.join(KATALOG_APP, 'js', 'wersja.js'), 'utf8'), wersjaJs);
});
