// Sprawdzanie odpowiedzi we wszystkich typach zadań. Funkcje czyste (testy: tests/zadania.test.js).
//
// Format odpowiedzi:
//   wybor      indeks wybranej opcji w tablicy opcje (z danych, nie z widoku po tasowaniu)
//   pf         tablica true/false/null (po jednym na zdanie)
//   przyp      tablica wybranych prawych stron (po jednej na parę)
//   kolejnosc  tablica elementów w kolejności ułożonej przez gracza
//   luki       tablica słów wstawionych w luki
//   sort       tablica indeksów kategorii (po jednym na element)
//   liczba     liczba (zadanie musi mieć pole odp; zadania z generatora dostają je w przygotuj())
//   schemat    tablica nazw części (po jednej na punkt schematu)

import { zadaniePowiekszenia, zadanieObiektywu } from './generator.js';
import { tasuj } from './losuj.js';

export const TYPY = ['wybor', 'pf', 'przyp', 'kolejnosc', 'luki', 'sort', 'liczba', 'schemat'];
// W sprawdzianie te typy dają 0 albo komplet punktów; pozostałe proporcjonalnie.
export const CALOSCIOWE = new Set(['wybor', 'liczba', 'kolejnosc']);

function normalizuj(t) {
  return String(t ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

// Konkretyzuje zadanie z generatora (losowe liczby). Zwraca kopię gotową do wyświetlenia.
// Schemat w wariancie bossa (id zaczyna się od „b”) ma pomieszaną numerację części.
export function przygotuj(zadanie, los = Math.random) {
  if (zadanie.typ === 'schemat') {
    const kolejne = zadanie.punkty.map((_, i) => i + 1);
    return { ...zadanie, numery: zadanie.id.startsWith('b') ? tasuj(kolejne, los) : kolejne };
  }
  if (zadanie.typ !== 'liczba' || !zadanie.gen) return zadanie;
  const g = zadanie.gen === 'obiektyw' ? zadanieObiektywu(los) : zadaniePowiekszenia(los);
  return {
    ...zadanie,
    tresc: `${zadanie.tresc} ${g.pytanie}`,
    odp: g.odp,
    jednostka: 'razy',
    rozwiazanie: g.rozwiazanie,
    pulapka: g.pulapka,
  };
}

export function sprawdz(zadanie, odp) {
  const z = zadanie;
  let wyniki; // tablica true/false dla każdego elementu
  switch (z.typ) {
    case 'wybor':
      wyniki = [odp === z.poprawna];
      break;
    case 'pf':
      wyniki = z.zdania.map((zd, i) => odp?.[i] === zd.p);
      break;
    case 'przyp':
      wyniki = z.pary.map((p, i) => odp?.[i] === p.p);
      break;
    case 'kolejnosc':
      wyniki = z.elementy.map((e, i) => odp?.[i] === e);
      break;
    case 'luki':
      wyniki = z.odp.map((o, i) => normalizuj(odp?.[i]) === normalizuj(o));
      break;
    case 'sort':
      wyniki = z.elementy.map((e, i) => odp?.[i] === e.k);
      break;
    case 'liczba':
      wyniki = [Number(String(odp ?? '').replace(',', '.').trim()) === z.odp && String(odp ?? '').trim() !== ''];
      break;
    case 'schemat':
      wyniki = z.punkty.map((p, i) => odp?.[i] === p);
      break;
    default:
      throw new Error(`nieznany typ zadania: ${z.typ}`);
  }
  const dobre = wyniki.filter(Boolean).length;
  return { poprawne: dobre === wyniki.length, dobre, wszystkie: wyniki.length, wyniki };
}

export function punkty(zadanie, wynik, max) {
  if (wynik.poprawne) return max;
  if (CALOSCIOWE.has(zadanie.typ)) return 0;
  return Math.floor((wynik.dobre / wynik.wszystkie) * max);
}

// Czy odpowiedź jest kompletna (przycisk „Sprawdź” aktywny dopiero wtedy).
export function kompletna(zadanie, odp) {
  const z = zadanie;
  switch (z.typ) {
    case 'wybor':
      return Number.isInteger(odp);
    case 'liczba':
      return String(odp ?? '').trim() !== '';
    case 'kolejnosc':
      return Array.isArray(odp) && odp.length === z.elementy.length;
    default: {
      const n = { pf: z.zdania?.length, przyp: z.pary?.length, luki: z.odp?.length, sort: z.elementy?.length, schemat: z.punkty?.length }[z.typ];
      return Array.isArray(odp) && odp.length === n && odp.every((x) => x !== null && x !== undefined && x !== '');
    }
  }
}
