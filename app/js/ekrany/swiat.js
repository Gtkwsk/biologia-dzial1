// Świat: wstęp, lista misji i boss.

import { h } from '../core/dom.js';
import { bossOdblokowany, misjeUkonczone, swiatOdblokowany } from '../core/gra.js';
import { K } from '../kontekst.js';
import SWIATY from '../../data/swiaty.js';
import { gwiazdki, naglowek } from './wspolne.js';

export function ekranSwiata({ swiat: nr }) {
  const s = SWIATY.find((x) => x.id === nr);
  const stan = K.stan;
  if (!swiatOdblokowany(stan, nr)) {
    return h('section', { class: 'ekran ekran--waski' }, [
      naglowek(s.tytul, { nadtytul: `Świat ${nr}` }),
      h('p', { class: 'karta', tekst: `🔒 Ten świat otworzy się po pokonaniu bossa świata ${nr - 1}.` }),
      h('a', { href: `#/swiat/${nr - 1}`, class: 'przycisk przycisk--glowny' }, `Idź do świata ${nr - 1}`),
    ]);
  }
  const ukonczone = misjeUkonczone(stan, s);
  const boss = stan.bossy[nr];
  const bossOtwarty = bossOdblokowany(stan, s);
  return h('section', { class: `ekran ekran--swiat motyw-swiata-${nr}` }, [
    naglowek(`${s.ikona} ${s.tytul}`, { nadtytul: `Świat ${nr} · Temat ${nr}. ${s.temat}` }),
    h('div', { class: 'swiat-wstep karta' }, [
      ...s.wstep.map((t) => h('p', { tekst: t })),
      h('h2', { class: 'karta__tytul', tekst: 'Co zbadasz' }),
      h('ul', { class: 'lista-ptaszki' }, s.coZbadasz.map((t) => h('li', { tekst: t }))),
      h('p', { class: 'swiat-wstep__strony', tekst: `📖 ${s.strony}` }),
    ]),
    h('h2', { class: 'sekcja__tytul', tekst: `Misje (${ukonczone}/${s.misje.length})` }),
    h(
      'ol',
      { class: 'misje' },
      s.misje.map((m, i) => {
        const wynik = stan.misje[m.id];
        const li = h('li', {}, [
          h('a', { href: `#/swiat/${nr}/misja/${m.id}`, class: 'misja-karta', 'data-ukonczona': String(!!wynik?.ukonczono) }, [
            h('span', { class: 'misja-karta__nr', tekst: String(i + 1) }),
            h('span', { class: 'misja-karta__teksty' }, [h('span', { class: 'misja-karta__nazwa', tekst: m.nazwa }), h('span', { class: 'misja-karta__opis', tekst: `${m.opis} · ${m.zadania.length} zadań` })]),
            wynik?.ukonczono ? gwiazdki(wynik.gwiazdki) : h('span', { class: 'misja-karta__start', tekst: 'START' }),
          ]),
        ]);
        li.style.setProperty('--i', String(i));
        return li;
      }),
    ),
    h('h2', { class: 'sekcja__tytul', tekst: 'Boss świata' }),
    h('div', { class: 'boss-karta', 'data-otwarty': String(bossOtwarty), 'data-pokonany': String(!!boss?.pokonany) }, [
      h('span', { class: 'boss-karta__ikona', tekst: s.boss.ikona }),
      h('div', { class: 'boss-karta__teksty' }, [
        h('p', { class: 'boss-karta__imie', tekst: s.boss.imie }),
        h('p', { class: 'boss-karta__opis', tekst: s.boss.opis }),
        h('div', { class: 'boss-karta__przyciski' }, [
          bossOtwarty
            ? h('a', { href: `#/swiat/${nr}/boss`, class: 'przycisk przycisk--boss' }, boss?.pokonany ? '⚔ Walcz ponownie' : '⚔ Walcz!')
            : h('p', { class: 'boss-karta__blokada', tekst: `🔒 Ukończ wszystkie misje (${ukonczone}/${s.misje.length}), żeby wyzwać bossa.` }),
          boss?.pokonany ? h('a', { href: `#/swiat/${nr}/boss/hardcore`, class: 'przycisk przycisk--hardcore' }, boss.hardcore ? '💀 Rewanż hardcore ✔' : '💀 Rewanż hardcore') : null,
        ]),
        boss?.pokonany ? h('p', { class: 'boss-karta__info', tekst: 'Rewanż hardcore: 1 serce, 40 sekund na każde zadanie, +150 XP.' }) : null,
      ]),
    ]),
    nr < 3 && boss?.pokonany ? h('a', { href: `#/swiat/${nr + 1}`, class: 'przycisk przycisk--glowny przycisk--szeroki' }, `Dalej: świat ${nr + 1} ▶`) : null,
    nr === 3 && boss?.pokonany ? h('a', { href: '#/sprawdzian', class: 'przycisk przycisk--glowny przycisk--szeroki' }, '📝 Teraz próbny sprawdzian ▶') : null,
  ]);
}
