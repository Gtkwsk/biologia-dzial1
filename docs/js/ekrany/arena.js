// Arena błyskawiczna: 90 sekund, szybkie prawda/fałsz i obliczenia powiększenia.
// Punkty: 1 za dobrą odpowiedź, +1 przy combo 5+, +2 przy combo 10+. Błąd zeruje combo, punktów nie zabiera.

import { h } from '../core/dom.js';
import { graj, zerujSerie } from '../core/dzwieki.js';
import { iskry, konfetti, licznik } from '../core/efekty.js';
import { dodajXp, XP } from '../core/gra.js';
import { tasuj } from '../core/losuj.js';
import { dystraktory, zadaniePowiekszenia } from '../core/generator.js';
import { K, poNagrodzie } from '../kontekst.js';
import ARENA from '../../data/arena.js';
import { formatCzas, naglowek } from './wspolne.js';

export const CZAS_ARENY = 90;

export function punktyAreny(combo) {
  return 1 + (combo >= 5 ? 1 : 0) + (combo >= 10 ? 1 : 0);
}

export function ekranAreny() {
  const ekran = h('section', { class: 'ekran ekran--arena' });
  let zegar = null;
  const stop = () => {
    if (zegar) clearInterval(zegar);
    zegar = null;
  };

  const start = () => {
    let zostalo = CZAS_ARENY;
    let punkty = 0;
    let combo = 0;
    let maxCombo = 0;
    let n = 0;
    const bledy = [];
    let talia = tasuj(ARENA);
    zerujSerie();
    const czasEl = h('span', { class: 'arena__czas', tekst: `⏱ ${formatCzas(zostalo)}` });
    const punktyEl = h('span', { class: 'arena__punkty', tekst: '0' });
    const comboEl = h('span', { class: 'arena__combo', tekst: '' });
    const pasekCzasu = h('div', { class: 'arena__pasek' }, [h('span')]);
    const karta = h('div', { class: 'arena__karta', 'aria-live': 'polite' });

    const nastepne = () => {
      n += 1;
      karta.classList.remove('arena__karta--wjazd');
      void karta.offsetWidth;
      karta.classList.add('arena__karta--wjazd');
      // co czwarte pytanie: obliczenie powiększenia z wyborem odpowiedzi
      if (n % 4 === 0) {
        const z = zadaniePowiekszenia();
        const opcje = tasuj([z.odp, ...dystraktory(z)]);
        karta.replaceChildren(
          h('p', { class: 'arena__rodzaj', tekst: '🔬 Oblicz' }),
          h('p', { class: 'arena__pytanie', tekst: `Okular ${z.okular}×, obiektyw ${z.obiektyw}×. Powiększenie obrazu?` }),
          h('div', { class: 'arena__opcje' }, opcje.map((o) => h('button', { type: 'button', class: 'arena__przycisk', onclick: (e) => odpowiedz(o === z.odp, e.currentTarget, { t: `Okular ${z.okular}×, obiektyw ${z.obiektyw}×`, poprawnie: z.rozwiazanie }) }, `${o}×`))),
        );
        return;
      }
      if (!talia.length) talia = tasuj(ARENA);
      const zd = talia.pop();
      karta.replaceChildren(
        h('p', { class: 'arena__rodzaj', tekst: `Temat ${zd.temat} · prawda czy fałsz?` }),
        h('p', { class: 'arena__pytanie', tekst: zd.t }),
        h('div', { class: 'arena__opcje arena__opcje--pf' }, [
          h('button', { type: 'button', class: 'arena__przycisk arena__przycisk--p', onclick: (e) => odpowiedz(zd.p === true, e.currentTarget, { t: zd.t, poprawnie: zd.p ? 'prawda' : 'fałsz' }) }, 'PRAWDA'),
          h('button', { type: 'button', class: 'arena__przycisk arena__przycisk--f', onclick: (e) => odpowiedz(zd.p === false, e.currentTarget, { t: zd.t, poprawnie: zd.p ? 'prawda' : 'fałsz' }) }, 'FAŁSZ'),
        ]),
      );
    };

    const odpowiedz = (dobrze, przycisk, info) => {
      if (!zegar) return;
      if (dobrze) {
        combo += 1;
        maxCombo = Math.max(maxCombo, combo);
        punkty += punktyAreny(combo);
        graj('dobrze');
        iskry(przycisk, { ile: combo >= 5 ? 16 : 8 });
        if (combo === 5 || combo === 10) graj('combo');
      } else {
        combo = 0;
        graj('zle');
        bledy.push(info);
        karta.classList.remove('arena__karta--blad');
        void karta.offsetWidth;
        karta.classList.add('arena__karta--blad');
      }
      punktyEl.textContent = String(punkty);
      comboEl.textContent = combo >= 2 ? `🔥 combo ${combo}${combo >= 10 ? ' · +3 pkt' : combo >= 5 ? ' · +2 pkt' : ''}` : '';
      comboEl.dataset.goraco = String(combo >= 5);
      nastepne();
    };

    const koniec = () => {
      stop();
      const rekord = punkty > K.stan.arenaRekord;
      K.stan.arenaRekord = Math.max(K.stan.arenaRekord, punkty);
      K.stan.maxCombo = Math.max(K.stan.maxCombo, maxCombo);
      const w = dodajXp(K.stan, punkty * XP.arena);
      poNagrodzie(w);
      graj(rekord ? 'fanfara' : 'koniec');
      if (rekord) konfetti();
      const liczba = h('span', { class: 'podsumowanie__xp-liczba', tekst: '0' });
      ekran.replaceChildren(
        naglowek('Arena błyskawiczna', { nadtytul: 'Koniec czasu!' }),
        h('div', { class: 'podsumowanie karta' }, [
          h('p', { class: 'okno__nadtytul', tekst: rekord ? 'NOWY REKORD!' : 'WYNIK' }),
          h('p', { class: 'arena__wynik' }, [liczba, ' pkt']),
          h('p', { tekst: `Rekord: ${K.stan.arenaRekord} pkt · najdłuższe combo: ${maxCombo} · +${punkty * XP.arena} XP` }),
          bledy.length
            ? h('div', { class: 'arena__bledy' }, [
                h('h2', { class: 'karta__tytul', tekst: 'Do poprawki' }),
                h('ul', {}, bledy.slice(0, 12).map((b) => h('li', {}, [h('span', { tekst: b.t }), h('strong', { tekst: ` → ${b.poprawnie}` })]))),
              ])
            : h('p', { tekst: 'Bez żadnego błędu!' }),
          h('div', { class: 'podsumowanie__przyciski' }, [
            h('button', { type: 'button', class: 'przycisk przycisk--glowny', onclick: start }, '⚡ Jeszcze raz'),
            h('a', { href: '#/', class: 'przycisk' }, 'Baza'),
          ]),
        ]),
      );
      licznik(liczba, punkty);
    };

    ekran.replaceChildren(
      h('div', { class: 'arena__gora' }, [h('a', { href: '#/', class: 'przycisk przycisk--cichy przycisk--maly', 'aria-label': 'Przerwij i wróć do bazy' }, '✖ Przerwij'), czasEl, h('span', { class: 'arena__wynik-maly' }, [punktyEl, ' pkt']), comboEl]),
      pasekCzasu,
      karta,
    );
    pasekCzasu.firstChild.style.setProperty('--postep', '100%');
    zegar = setInterval(() => {
      zostalo -= 1;
      czasEl.textContent = `⏱ ${formatCzas(zostalo)}`;
      czasEl.dataset.malo = String(zostalo <= 10);
      pasekCzasu.firstChild.style.setProperty('--postep', `${((100 * zostalo) / CZAS_ARENY).toFixed(1)}%`);
      if (zostalo <= 5 && zostalo > 0) graj('tik');
      if (zostalo <= 0) koniec();
    }, 1000);
    nastepne();
  };

  ekran.append(
    naglowek('Arena błyskawiczna', { nadtytul: 'Tryb na czas' }),
    h('div', { class: 'boss-intro karta' }, [
      h('div', { class: 'boss-intro__ikona', tekst: '⚡' }),
      h('p', { class: 'boss-intro__opis', tekst: 'Masz 90 sekund. Odpowiadaj jak najszybciej na pytania ze wszystkich trzech tematów działu.' }),
      h('ul', { class: 'boss-intro__zasady' }, [
        h('li', { tekst: '✔ Dobra odpowiedź: 1 punkt. Combo 5+: 2 punkty, combo 10+: 3 punkty.' }),
        h('li', { tekst: '✖ Błąd zeruje combo, ale nie zabiera punktów.' }),
        h('li', { tekst: '🔬 Co czwarte pytanie to szybkie obliczenie powiększenia.' }),
        h('li', { tekst: `🏆 Twój rekord: ${K.stan.arenaRekord} pkt.` }),
      ]),
      h('button', { type: 'button', class: 'przycisk przycisk--glowny przycisk--duzy', onclick: start }, '⚡ START'),
    ]),
  );
  return { el: ekran, sprzataj: stop };
}
