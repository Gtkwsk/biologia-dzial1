// Generator zadań z obliczania powiększenia (okular × obiektyw). Funkcje czyste.

import { wybierz } from './losuj.js';

export const OKULARY = [5, 10, 12, 15, 16, 20];
export const OBIEKTYWY = [4, 8, 10, 20, 40, 60, 100];

export function zadaniePowiekszenia(los = Math.random) {
  const okular = wybierz(OKULARY, los);
  const obiektyw = wybierz(OBIEKTYWY, los);
  return {
    okular,
    obiektyw,
    odp: okular * obiektyw,
    pytanie: `Okular powiększa ${okular} razy, a obiektyw ${obiektyw} razy. Ile razy powiększony jest obraz?`,
    rozwiazanie: `${okular} × ${obiektyw} = ${okular * obiektyw}`,
    // Typowy błąd: dodanie zamiast mnożenia.
    pulapka: okular + obiektyw,
  };
}

export function zadanieObiektywu(los = Math.random) {
  const okular = wybierz(OKULARY, los);
  const obiektyw = wybierz(OBIEKTYWY, los);
  const obraz = okular * obiektyw;
  return {
    okular,
    obiektyw,
    odp: obiektyw,
    pytanie: `Obraz jest powiększony ${obraz} razy, a okular powiększa ${okular} razy. Ile razy powiększa obiektyw?`,
    rozwiazanie: `${obraz} : ${okular} = ${obiektyw}`,
    pulapka: obraz - okular,
  };
}

// Trzy błędne odpowiedzi do pytań wyboru w Arenie: suma, połowa, dziesięć razy więcej/mniej.
export function dystraktory(z) {
  const kandydaci = [z.okular + z.obiektyw, z.odp * 10, z.odp / 2, z.odp * 2, z.odp + 10];
  const wynik = [];
  for (const k of kandydaci) {
    if (Number.isInteger(k) && k > 0 && k !== z.odp && !wynik.includes(k)) wynik.push(k);
    if (wynik.length === 3) break;
  }
  return wynik;
}
