// Wspólny stan aplikacji i reakcje na nagrody (dźwięk, efekty, awans, odznaki).

import { h } from './core/dom.js';
import { graj, ustawDzwieki } from './core/dzwieki.js';
import { iskry, konfetti } from './core/efekty.js';
import { poziom, sprawdzOdznaki, seriaDni, zapiszDzien } from './core/gra.js';
import { dzisiaj } from './core/stan.js';
import SWIATY from '../data/swiaty.js';
import ODZNAKI from '../data/odznaki.js';
import ZADANIA from '../data/zadania.js';

export const K = { stan: null, magazyn: null, zapisDostepny: true };
export const ZADANIA_ID = new Map(ZADANIA.map((z) => [z.id, z]));

export function zadanie(id) {
  const z = ZADANIA_ID.get(id);
  if (!z) throw new Error(`brak zadania ${id}`);
  return z;
}

// Misja, w której ćwiczy się daną umiejętność (do linków „Ćwicz”).
export function misjaUmiejetnosci(klucz) {
  for (const s of SWIATY) for (const m of s.misje) if (m.zadania.some((id) => ZADANIA_ID.get(id)?.umiejetnosc === klucz)) return { swiat: s.id, misja: m.id, nazwa: m.nazwa };
  return null;
}

export function zapisz() {
  if (K.magazyn) K.zapisDostepny = K.magazyn.zapisz(K.stan);
}

export function powiadom(tekst, { rodzaj = 'info', ikona = '' } = {}) {
  const pojemnik = document.getElementById('powiadomienia');
  if (!pojemnik) return;
  const el = h('div', { class: `powiadomienie powiadomienie--${rodzaj}` }, [ikona ? h('span', { class: 'powiadomienie__ikona', tekst: ikona }) : null, h('span', { tekst })]);
  pojemnik.append(el);
  setTimeout(() => el.classList.add('powiadomienie--znika'), 2600);
  setTimeout(() => el.remove(), 3200);
}

export function odswiezHud() {
  document.dispatchEvent(new CustomEvent('hud'));
}

function pokazAwans(wynik) {
  graj('poziom');
  konfetti({ ile: 90 });
  const okno = h('div', { class: 'okno-tlo', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'awans-tytul' }, [
    h('div', { class: 'okno okno--awans' }, [
      h('p', { class: 'okno__nadtytul', tekst: 'NOWY POZIOM!' }),
      h('div', { class: 'awans__odznaka', tekst: String(wynik.poziom) }),
      h('h2', { id: 'awans-tytul', class: 'okno__tytul', tekst: wynik.ranga }),
      h('p', { tekst: wynik.max ? 'Osiągnięto najwyższy poziom. Legenda!' : `Do kolejnego poziomu: ${wynik.do - K.stan.xp} XP.` }),
      h('button', { type: 'button', class: 'przycisk przycisk--glowny', onclick: () => okno.remove() }, 'Super!'),
    ]),
  ]);
  // Kliknięcie tła albo Escape też zamyka okno.
  okno.addEventListener('click', (e) => e.target === okno && okno.remove());
  okno.addEventListener('keydown', (e) => e.key === 'Escape' && okno.remove());
  document.body.append(okno);
  okno.querySelector('button').focus();
}

// Po każdej zmianie XP: awans, odznaki, seria dni, zapis i odświeżenie paska.
export function poNagrodzie(wynik) {
  zapiszDzien(K.stan, dzisiaj());
  if (wynik?.awans) pokazAwans(wynik);
  const nowe = sprawdzOdznaki(K.stan, SWIATY, ODZNAKI, dzisiaj());
  nowe.forEach((id, n) => {
    const o = ODZNAKI.find((x) => x.id === id);
    setTimeout(() => {
      graj('odznaka');
      powiadom(`Nowa odznaka: ${o.nazwa}`, { rodzaj: 'odznaka', ikona: o.ikona });
    }, 400 + n * 700);
  });
  zapisz();
  odswiezHud();
}

// Reakcja na odpowiedź w misji / u bossa: dźwięk, iskry, combo.
export function reakcjaNaOdpowiedz(wynikGry, dobrze, el) {
  if (dobrze) {
    graj('dobrze');
    iskry(el, { ile: wynikGry.mnoznik > 1 ? 20 : 12, zasieg: wynikGry.mnoznik });
    if (wynikGry.wzrostMnoznika) {
      setTimeout(() => graj('combo'), 180);
      powiadom(`COMBO x${wynikGry.mnoznik}! Każda dobra odpowiedź daje więcej XP.`, { rodzaj: 'combo', ikona: '🔥' });
    }
  } else {
    graj('zle');
    if (wynikGry.straconeCombo >= 3) powiadom(`Combo ${wynikGry.straconeCombo} przerwane. XP zostają, zbieraj od nowa!`, { rodzaj: 'info', ikona: '💨' });
  }
  poNagrodzie(wynikGry);
}

// Imię do wyświetlania. Bez imienia: neutralne „Gracz” (w powitaniu „Graczu”).
export function imieGracza({ wolacz = false } = {}) {
  return K.stan?.imie || (wolacz ? 'Graczu' : 'Gracz');
}

export function infoGracza() {
  const p = poziom(K.stan.xp);
  return { ...p, seria: seriaDni(K.stan.dni, dzisiaj()) };
}

export function ustawDzwiek(tak) {
  K.stan.ustawienia.dzwiek = tak;
  ustawDzwieki(tak);
  zapisz();
  odswiezHud();
}
