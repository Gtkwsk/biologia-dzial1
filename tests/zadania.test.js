import test from 'node:test';
import assert from 'node:assert/strict';
import { sprawdz, punkty, przygotuj, kompletna } from '../docs/js/core/zadania-logika.js';
import { zadaniePowiekszenia, zadanieObiektywu, dystraktory } from '../docs/js/core/generator.js';
import { rng, tasujInaczej } from '../docs/js/core/losuj.js';
import { parsujAdres, adres } from '../docs/js/core/router.js';
import ZADANIA from '../docs/data/zadania.js';
import SPRAWDZIAN from '../docs/data/sprawdzian.js';

// Wzorcowa (poprawna) odpowiedź na każde zadanie.
function wzorcowa(z) {
  switch (z.typ) {
    case 'wybor': return z.poprawna;
    case 'pf': return z.zdania.map((d) => d.p);
    case 'przyp': return z.pary.map((p) => p.p);
    case 'kolejnosc': return z.elementy.slice();
    case 'luki': return z.odp.slice();
    case 'sort': return z.elementy.map((e) => e.k);
    case 'liczba': return String(z.odp);
    case 'schemat': return z.punkty.slice();
  }
}

test('każde zadanie da się rozwiązać w 100% wzorcową odpowiedzią', () => {
  for (const z0 of ZADANIA) {
    const z = przygotuj(z0, rng(7));
    const o = wzorcowa(z);
    assert.ok(kompletna(z, o), `${z.id}: odpowiedź kompletna`);
    const w = sprawdz(z, o);
    assert.ok(w.poprawne, `${z.id}: wzorcowa odpowiedź poprawna`);
  }
});

test('błędna odpowiedź nie jest poprawna, punkty częściowe', () => {
  const pf = ZADANIA.find((z) => z.typ === 'pf');
  const zla = pf.zdania.map((d, i) => (i === 0 ? !d.p : d.p));
  const w = sprawdz(pf, zla);
  assert.equal(w.poprawne, false);
  assert.equal(w.dobre, pf.zdania.length - 1);
  assert.equal(punkty(pf, w, 2), Math.floor(((pf.zdania.length - 1) / pf.zdania.length) * 2));
  const kol = ZADANIA.find((z) => z.typ === 'kolejnosc');
  const wk = sprawdz(kol, kol.elementy.slice().reverse());
  assert.equal(punkty(kol, wk, 1), 0, 'kolejność: 0 albo komplet');
});

test('luki: wielkość liter i spacje nie mają znaczenia', () => {
  const z = { typ: 'luki', odp: ['tlen'] };
  assert.ok(sprawdz(z, ['  Tlen ']).poprawne);
});

test('generator powiększeń', () => {
  const los = rng(1);
  for (let i = 0; i < 200; i++) {
    const a = zadaniePowiekszenia(los);
    assert.equal(a.odp, a.okular * a.obiektyw);
    const d = dystraktory(a);
    assert.equal(d.length, 3);
    assert.ok(!d.includes(a.odp));
    const b = zadanieObiektywu(los);
    assert.equal(b.odp * b.okular, b.okular * b.obiektyw);
  }
  const z = przygotuj(ZADANIA.find((x) => x.gen === 'powiekszenie'), rng(3));
  assert.ok(Number.isInteger(z.odp) && z.tresc.includes('razy'));
  assert.ok(sprawdz(z, String(z.odp)).poprawne);
  assert.ok(!sprawdz(z, String(z.pulapka)).poprawne);
});

test('schemat bossa ma pomieszaną numerację, ale poprawną permutację', () => {
  const z = przygotuj(ZADANIA.find((x) => x.id === 'b3-schemat-2'), rng(5));
  assert.deepEqual(z.numery.slice().sort((a, b) => a - b), z.punkty.map((_, i) => i + 1));
});

test('tasujInaczej zmienia kolejność', () => {
  const t = ['a', 'b', 'c', 'd'];
  for (let i = 0; i < 50; i++) assert.notDeepEqual(tasujInaczej(t, rng(i)), t);
});

test('router', () => {
  assert.deepEqual(parsujAdres(''), { ekran: 'mapa' });
  assert.deepEqual(parsujAdres('#/swiat/2'), { ekran: 'swiat', swiat: 2 });
  assert.deepEqual(parsujAdres('#/swiat/3/misja/m3-czesci'), { ekran: 'misja', swiat: 3, misja: 'm3-czesci' });
  assert.deepEqual(parsujAdres('#/swiat/1/boss/hardcore'), { ekran: 'boss', swiat: 1, hardcore: true });
  assert.deepEqual(parsujAdres('#/swiat/7'), { ekran: 'nieznany' });
  assert.deepEqual(parsujAdres('#/sprawdzian'), { ekran: 'sprawdzian' });
  assert.equal(adres({ ekran: 'boss', swiat: 2, hardcore: true }), '#/swiat/2/boss/hardcore');
});

test('sprawdzian: suma punktów i pule', () => {
  const max = SPRAWDZIAN.reduce((a, p) => a + p.punkty, 0);
  assert.ok(max >= 25 && max <= 35, `maks. ${max}`);
});
