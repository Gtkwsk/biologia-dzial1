// Zapis stanu w localStorage pod jednym kluczem (wzorzec z gry „Wyprawa do wnętrza życia”).
// Nieczytelny zapis nie jest nadpisywany bez śladu: trafia pod klucz kopii.

import { nowyStan, odczytajStan } from './stan.js';

export const KLUCZ = 'puls-zycia-arena-dzial-1';
export const KLUCZ_KOPII = `${KLUCZ}-kopia-nieczytelna`;

export function utworzMagazyn(storage) {
  return {
    wczytaj() {
      let surowe;
      try {
        surowe = storage.getItem(KLUCZ);
      } catch {
        return { stan: nowyStan(), dostepny: false, uszkodzony: false };
      }
      if (surowe === null || surowe === undefined) return { stan: nowyStan(), dostepny: true, uszkodzony: false };
      try {
        return { stan: odczytajStan(JSON.parse(surowe)), dostepny: true, uszkodzony: false };
      } catch {
        try {
          storage.setItem(KLUCZ_KOPII, surowe);
        } catch {
          // brak miejsca na kopię
        }
        return { stan: nowyStan(), dostepny: true, uszkodzony: true };
      }
    },
    zapisz(stan) {
      try {
        storage.setItem(KLUCZ, JSON.stringify(stan));
        return true;
      } catch {
        return false;
      }
    },
    usun() {
      try {
        storage.removeItem(KLUCZ);
        return true;
      } catch {
        return false;
      }
    },
  };
}
