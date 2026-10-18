import test from 'node:test';
import assert from 'node:assert/strict';
import { poziom, mnoznikCombo, zapiszOdpowiedz, gwiazdki, seriaDni, zapiszMisje, zapiszBossa, swiatOdblokowany, bossOdblokowany, sprawdzOdznaki, ocenaSzkolna } from '../app/js/core/gra.js';
import { nowyStan, odczytajStan } from '../app/js/core/stan.js';
import SWIATY from '../app/data/swiaty.js';
import ODZNAKI from '../app/data/odznaki.js';
import { SKALA } from '../app/data/sprawdzian.js';

test('poziomy i rangi', () => {
  assert.equal(poziom(0).poziom, 1);
  assert.equal(poziom(0).ranga, 'Obserwator');
  assert.equal(poziom(149).poziom, 1);
  assert.equal(poziom(150).poziom, 2);
  assert.equal(poziom(6500).max, true);
  assert.equal(poziom(99999).poziom, 11);
  assert.ok(Math.abs(poziom(275).postep - 0.5) < 1e-9);
});

test('combo: mnożnik rośnie, błąd zeruje combo, ale nie zabiera XP', () => {
  assert.deepEqual([0, 2, 3, 4, 5, 7, 8, 20].map(mnoznikCombo), [1, 1, 1.5, 1.5, 2, 2, 3, 3]);
  const s = nowyStan();
  for (let i = 0; i < 5; i++) zapiszOdpowiedz(s, { dobrze: true, umiejetnosc: 'cechy' });
  // 15 + 15 + 22.5 + 22.5 + 30 (zaokrąglane przy dodawaniu)
  assert.equal(s.combo, 5);
  const przed = s.xp;
  const w = zapiszOdpowiedz(s, { dobrze: false, umiejetnosc: 'cechy' });
  assert.equal(s.combo, 0);
  assert.equal(s.xp, przed);
  assert.equal(w.straconeCombo, 5);
  assert.deepEqual(s.umiejetnosci.cechy, { dobre: 5, zle: 1 });
  assert.equal(s.maxCombo, 5);
});

test('gwiazdki misji', () => {
  assert.equal(gwiazdki(0), 3);
  assert.equal(gwiazdki(1), 2);
  assert.equal(gwiazdki(4), 1);
  const s = nowyStan();
  const a = zapiszMisje(s, 'm1-zycie', 2);
  assert.equal(a.pierwszyRaz, true);
  zapiszMisje(s, 'm1-zycie', 0);
  assert.equal(s.misje['m1-zycie'].gwiazdki, 3);
  zapiszMisje(s, 'm1-zycie', 3);
  assert.equal(s.misje['m1-zycie'].gwiazdki, 3, 'gorszy wynik nie zabiera gwiazdek');
});

test('seria dni', () => {
  assert.equal(seriaDni(['2026-10-16', '2026-10-17', '2026-10-18'], '2026-10-18'), 3);
  assert.equal(seriaDni(['2026-10-16', '2026-10-17'], '2026-10-18'), 2, 'liczy się do wczoraj');
  assert.equal(seriaDni(['2026-10-10'], '2026-10-18'), 0);
  assert.equal(seriaDni(['2026-10-31', '2026-11-01'], '2026-11-01'), 2, 'przejście miesiąca');
});

test('odblokowania i bossowie', () => {
  const s = nowyStan();
  assert.equal(swiatOdblokowany(s, 1), true);
  assert.equal(swiatOdblokowany(s, 2), false);
  assert.equal(bossOdblokowany(s, SWIATY[0]), false);
  for (const m of SWIATY[0].misje) zapiszMisje(s, m.id, 0);
  assert.equal(bossOdblokowany(s, SWIATY[0]), true);
  zapiszBossa(s, 1, { wygrana: false });
  assert.equal(swiatOdblokowany(s, 2), false);
  const w = zapiszBossa(s, 1, { wygrana: true });
  assert.equal(w.xp, 100);
  assert.equal(swiatOdblokowany(s, 2), true);
  const h = zapiszBossa(s, 1, { wygrana: true, hardcore: true });
  assert.equal(h.xp, 150);
  const nowe = sprawdzOdznaki(s, SWIATY, ODZNAKI, '2026-10-18');
  assert.ok(nowe.includes('pierwszy-krok') && nowe.includes('boss-1') && nowe.includes('hardcore') && nowe.includes('bez-bledu'));
  assert.deepEqual(sprawdzOdznaki(s, SWIATY, ODZNAKI, '2026-10-18'), [], 'odznaka przyznawana raz');
});

test('ocena szkolna', () => {
  assert.equal(ocenaSzkolna(100, SKALA), 'celujący (6)');
  assert.equal(ocenaSzkolna(76, SKALA), 'dobry (4)');
  assert.equal(ocenaSzkolna(49, SKALA), 'dopuszczający (2)');
  assert.equal(ocenaSzkolna(0, SKALA), 'niedostateczny (1)');
});

test('odczyt stanu uzupełnia braki i odrzuca zły format', () => {
  const s = odczytajStan({ xp: 120, combo: 9, ustawienia: { dzwiek: false } });
  assert.equal(s.xp, 120);
  assert.equal(s.combo, 0);
  assert.equal(s.ustawienia.dzwiek, false);
  assert.equal(s.ustawienia.odblokujWszystko, false);
  assert.throws(() => odczytajStan([]));
  assert.throws(() => odczytajStan(null));
});
