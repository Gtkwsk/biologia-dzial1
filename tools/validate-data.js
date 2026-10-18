// Walidator danych: node tools/validate-data.js
// Sprawdza spójność zadań, światów, sprawdzianu, fiszek i zgodność z podstawą programową 2024
// (w dziale I nie ma już pierwiastków ani związków chemicznych).

import ZADANIA from '../app/data/zadania.js';
import SWIATY from '../app/data/swiaty.js';
import SPRAWDZIAN from '../app/data/sprawdzian.js';
import FISZKI from '../app/data/fiszki.js';
import OTWARTE from '../app/data/otwarte.js';
import ODZNAKI from '../app/data/odznaki.js';
import ARENA from '../app/data/arena.js';
import { TYPY } from '../app/js/core/zadania-logika.js';
import { NAZWY_UMIEJETNOSCI } from '../app/js/core/gra.js';
import { KOTWICE } from '../app/js/components/mikroskop-kotwice.js';

const bledy = [];
const blad = (t) => bledy.push(t);
const ids = new Map();
const ZAKAZANE = /pierwiast|związk\w* chemiczn|związek chemiczny|węglowodan|białk|tłuszcz/i;

for (const z of ZADANIA) {
  if (ids.has(z.id)) blad(`powtórzone id ${z.id}`);
  ids.set(z.id, z);
  if (!TYPY.includes(z.typ)) blad(`${z.id}: nieznany typ ${z.typ}`);
  if (![1, 2, 3].includes(z.temat)) blad(`${z.id}: zły temat`);
  if (!NAZWY_UMIEJETNOSCI[z.umiejetnosc]) blad(`${z.id}: nieznana umiejętność ${z.umiejetnosc}`);
  if (!z.tresc || !z.wyjasnienie) blad(`${z.id}: brak treści lub wyjaśnienia`);
  if (ZAKAZANE.test(JSON.stringify(z))) blad(`${z.id}: treść spoza podstawy 2024 (chemia)`);
  switch (z.typ) {
    case 'wybor':
      if (!(z.opcje?.length >= 2) || !Number.isInteger(z.poprawna) || !z.opcje[z.poprawna]) blad(`${z.id}: złe opcje`);
      if (new Set(z.opcje).size !== z.opcje.length) blad(`${z.id}: powtórzone opcje`);
      break;
    case 'pf':
      if (!z.zdania?.length || z.zdania.some((d) => typeof d.p !== 'boolean' || !d.t)) blad(`${z.id}: złe zdania`);
      break;
    case 'przyp': {
      if (!z.pary?.length) blad(`${z.id}: brak par`);
      const lewe = z.pary.map((p) => p.l);
      if (new Set(lewe).size !== lewe.length) blad(`${z.id}: powtórzone lewe strony`);
      for (const d of z.dodatkowe ?? []) if (z.pary.some((p) => p.p === d)) blad(`${z.id}: dodatkowa odpowiedź ${d} jest też poprawna`);
      break;
    }
    case 'kolejnosc':
      if (!(z.elementy?.length >= 3) || new Set(z.elementy).size !== z.elementy.length) blad(`${z.id}: złe elementy`);
      break;
    case 'luki': {
      const n = [...z.tekst.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1]));
      if (n.length !== z.odp.length || n.some((x, i) => x !== i)) blad(`${z.id}: luki nie pasują do odpowiedzi`);
      for (const b of z.bank ?? []) if (z.odp.includes(b)) blad(`${z.id}: słowo z banku ${b} jest też odpowiedzią`);
      break;
    }
    case 'sort':
      if (!(z.kategorie?.length >= 2) || z.elementy.some((e) => !z.kategorie[e.k])) blad(`${z.id}: złe kategorie`);
      break;
    case 'liczba':
      if (!z.gen && !Number.isFinite(z.odp)) blad(`${z.id}: brak odpowiedzi liczbowej`);
      if (z.gen && !['powiekszenie', 'obiektyw'].includes(z.gen)) blad(`${z.id}: nieznany generator`);
      break;
    case 'schemat':
      for (const p of z.punkty) if (!KOTWICE[p]) blad(`${z.id}: brak części ${p} na rysunku`);
      for (const d of z.dodatkowe ?? []) if (z.punkty.includes(d)) blad(`${z.id}: dodatkowa nazwa jest poprawna`);
      break;
  }
}

const uzyte = new Set();
for (const s of SWIATY) {
  for (const m of s.misje) {
    for (const id of m.zadania) {
      if (!ids.has(id)) blad(`misja ${m.id}: brak zadania ${id}`);
      else if (ids.get(id).temat !== s.id) blad(`misja ${m.id}: zadanie ${id} z innego tematu`);
      uzyte.add(id);
    }
  }
  if (s.boss.pule.length < 3) blad(`boss ${s.id}: za mało pul`);
  for (const pula of s.boss.pule) for (const id of pula) {
    if (!ids.has(id)) blad(`boss ${s.id}: brak zadania ${id}`);
    uzyte.add(id);
  }
}
for (const id of ids.keys()) if (!uzyte.has(id)) blad(`zadanie ${id} nie jest w żadnej misji ani u bossa`);

const tematySpr = new Set();
for (const poz of SPRAWDZIAN) {
  if (!(poz.punkty >= 1)) blad(`sprawdzian ${poz.nr}: złe punkty`);
  for (const id of poz.pula) {
    if (!ids.has(id)) blad(`sprawdzian ${poz.nr}: brak zadania ${id}`);
    else tematySpr.add(ids.get(id).temat);
  }
  const s = SWIATY.find((x) => x.id === poz.misja.swiat);
  if (!s?.misje.some((m) => m.id === poz.misja.id)) blad(`sprawdzian ${poz.nr}: zła misja`);
}
if (tematySpr.size !== 3) blad('sprawdzian nie obejmuje wszystkich trzech tematów');
const umiejSpr = new Set(SPRAWDZIAN.flatMap((p) => p.pula.map((id) => ids.get(id)?.umiejetnosc)));
for (const u of Object.keys(NAZWY_UMIEJETNOSCI)) if (!umiejSpr.has(u)) blad(`sprawdzian nie sprawdza umiejętności ${u}`);

const fid = new Set();
for (const f of FISZKI) {
  if (fid.has(f.id)) blad(`fiszka ${f.id} powtórzona`);
  fid.add(f.id);
  if (!f.przod || !f.tyl || ![1, 2, 3].includes(f.temat)) blad(`fiszka ${f.id} niekompletna`);
}
for (const o of OTWARTE) if (!o.pytanie || !o.klucz?.length || !(o.punkty >= 1)) blad(`pytanie otwarte ${o.id} niekompletne`);
for (const a of ARENA) if (!a.t || typeof a.p !== 'boolean') blad(`arena: złe zdanie ${a.t}`);
if (new Set(ODZNAKI.map((o) => o.id)).size !== ODZNAKI.length) blad('powtórzone odznaki');
for (const zestaw of [FISZKI, OTWARTE, ARENA]) for (const x of zestaw) if (ZAKAZANE.test(JSON.stringify(x))) blad(`treść spoza podstawy 2024: ${JSON.stringify(x).slice(0, 60)}`);

if (bledy.length) {
  console.error(`Błędy danych (${bledy.length}):\n- ${bledy.join('\n- ')}`);
  process.exit(1);
}
const naTemat = [1, 2, 3].map((t) => ZADANIA.filter((z) => z.temat === t).length);
console.log(`Dane w porządku: ${ZADANIA.length} zadań (tematy: ${naTemat.join(' / ')}), ${SPRAWDZIAN.length} pozycji sprawdzianu, ${FISZKI.length} fiszek, ${OTWARTE.length} pytań otwartych, ${ARENA.length} zdań Areny, ${ODZNAKI.length} odznak.`);
