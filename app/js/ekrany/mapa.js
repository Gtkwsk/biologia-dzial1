// Baza: mapa światów, tryby gry i gotowość do sprawdzianu.

import { h } from '../core/dom.js';
import { bossOdblokowany, misjeUkonczone, swiatOdblokowany } from '../core/gra.js';
import { K, infoGracza } from '../kontekst.js';
import SWIATY from '../../data/swiaty.js';
import { gwiazdki, kafel, pasekPostepu } from './wspolne.js';

export function gotowosc(stan) {
  const misje = SWIATY.flatMap((s) => s.misje);
  const gw = misje.reduce((a, m) => a + (stan.misje[m.id]?.gwiazdki ?? 0), 0) / (misje.length * 3);
  const bossy = SWIATY.filter((s) => stan.bossy[s.id]?.pokonany).length / SWIATY.length;
  const spr = Math.max(0, ...stan.sprawdziany.map((s) => s.proc)) / 100;
  return Math.round(100 * (0.4 * gw + 0.25 * bossy + 0.35 * spr));
}

function nastepnyKrok(stan) {
  for (const s of SWIATY) {
    if (!swiatOdblokowany(stan, s.id)) break;
    const m = s.misje.find((x) => !stan.misje[x.id]?.ukonczono);
    if (m) return { tekst: `Misja: ${m.nazwa}`, href: `#/swiat/${s.id}/misja/${m.id}`, opis: `${s.tytul} · ${s.temat}` };
    if (!stan.bossy[s.id]?.pokonany) return { tekst: `Boss: ${s.boss.imie}`, href: `#/swiat/${s.id}/boss`, opis: `${s.tytul} · walka z bossem` };
  }
  if (!stan.sprawdziany.some((s) => s.proc >= 75)) return { tekst: 'Próbny sprawdzian', href: '#/sprawdzian', opis: 'Wszystkie bossy pokonane. Sprawdź się jak na prawdziwym sprawdzianie!' };
  return { tekst: 'Arena błyskawiczna', href: '#/arena', opis: 'Pobij swój rekord i utrzymaj formę.' };
}

export function ekranMapy() {
  const stan = K.stan;
  const g = infoGracza();
  const krok = nastepnyKrok(stan);
  const proc = gotowosc(stan);
  const kolo = h('div', { class: 'gotowosc__kolo' }, [h('span', { class: 'gotowosc__liczba', tekst: `${proc}%` })]);
  kolo.style.setProperty('--proc', `${proc}%`);
  const swiaty = SWIATY.map((s, i) => {
    const otwarty = swiatOdblokowany(stan, s.id);
    const ukonczone = misjeUkonczone(stan, s);
    const gw = s.misje.reduce((a, m) => a + (stan.misje[m.id]?.gwiazdki ?? 0), 0);
    const boss = stan.bossy[s.id];
    const zawartosc = [
      h('span', { class: 'swiat-karta__nr', tekst: `ŚWIAT ${s.id}` }),
      h('span', { class: 'swiat-karta__ikona', tekst: s.ikona }),
      h('span', { class: 'swiat-karta__tytul', tekst: s.tytul }),
      h('span', { class: 'swiat-karta__temat', tekst: `Temat ${s.id}. ${s.temat}` }),
      h('span', { class: 'swiat-karta__stan' }, [
        h('span', { tekst: `Misje ${ukonczone}/${s.misje.length}` }),
        h('span', { class: 'swiat-karta__gw', tekst: `★ ${gw}/${s.misje.length * 3}` }),
      ]),
      pasekPostepu(ukonczone + (boss?.pokonany ? 1 : 0), s.misje.length + 1, { etykieta: `Postęp świata ${s.id}` }),
      h('span', { class: 'swiat-karta__boss', 'data-pokonany': String(!!boss?.pokonany) }, [
        `${s.boss.ikona} ${s.boss.imie}: `,
        boss?.pokonany ? (boss.hardcore ? 'pokonany (hardcore) 💀' : 'pokonany ✔') : bossOdblokowany(stan, s) ? 'czeka na walkę!' : 'zablokowany',
      ]),
    ];
    const el = otwarty
      ? h('a', { href: `#/swiat/${s.id}`, class: `swiat-karta swiat-karta--${s.id}` }, zawartosc)
      : h('div', { class: `swiat-karta swiat-karta--${s.id} swiat-karta--zablokowana`, 'aria-disabled': 'true' }, [...zawartosc, h('span', { class: 'swiat-karta__blokada', tekst: `🔒 Pokonaj bossa świata ${s.id - 1}` })]);
    el.style.setProperty('--i', String(i));
    return h('li', {}, [el]);
  });

  return h('section', { class: 'ekran ekran--mapa' }, [
    h('div', { class: 'baner' }, [
      h('div', { class: 'baner__teksty' }, [
        h('p', { class: 'nadtytul', tekst: 'Biologia · klasa 5 · Dział I „Biologia – nauka o życiu”' }),
        h('h1', { class: 'tytul tytul--duzy', tabindex: '-1' }, ['Cześć, Mikołaj! ', h('span', { class: 'tytul__akcent', tekst: 'Gotowy na misję?' })]),
        h('p', { class: 'baner__opis', tekst: `Poziom ${g.poziom} · ${g.ranga}. Przejdź trzy światy, pokonaj bossów i zdaj próbny sprawdzian.` }),
        h('a', { href: krok.href, class: 'przycisk przycisk--glowny przycisk--duzy' }, [h('span', { tekst: '▶ ' }), krok.tekst]),
        h('p', { class: 'baner__podpis', tekst: krok.opis }),
      ]),
      h('div', { class: 'gotowosc', 'aria-label': `Gotowość do sprawdzianu: ${proc}%` }, [
        kolo,
        h('p', { class: 'gotowosc__opis', tekst: 'gotowość do sprawdzianu' }),
      ]),
    ]),
    h('h2', { class: 'sekcja__tytul', tekst: 'Mapa światów' }),
    h('ol', { class: 'swiaty' }, swiaty),
    h('h2', { class: 'sekcja__tytul', tekst: 'Tryby' }),
    h('div', { class: 'kafle' }, [
      kafel({ href: '#/sprawdzian', ikona: '📝', tytul: 'Próbny sprawdzian', opis: '17 zadań z całego działu, punkty, ocena i raport słabych stron.', klasa: 'kafel--sprawdzian', znaczek: stan.sprawdziany.length ? h('span', { class: 'kafel__znaczek', tekst: `najlepiej ${Math.max(...stan.sprawdziany.map((s) => s.proc))}%` }) : null }),
      kafel({ href: '#/arena', ikona: '⚡', tytul: 'Arena błyskawiczna', opis: '90 sekund, prawda/fałsz i powiększenia. Combo podbija punkty.', klasa: 'kafel--arena', znaczek: stan.arenaRekord ? h('span', { class: 'kafel__znaczek', tekst: `rekord ${stan.arenaRekord}` }) : null }),
      kafel({ href: '#/powtorka', ikona: '🧠', tytul: 'Powtórka', opis: 'Fiszki, pytania otwarte z kluczem, trening powiększeń, ściąga.', klasa: 'kafel--powtorka' }),
      kafel({ href: '#/profil', ikona: '🏅', tytul: 'Profil i odznaki', opis: `${Object.keys(stan.odznaki).length} odznak · mocne i słabe strony.`, klasa: 'kafel--profil' }),
    ]),
    h('p', { class: 'stopka', tekst: 'Zadania ułożone na podstawie treści działu I podręcznika „Puls życia 5” (Nowa Era, podstawa programowa 2024). Pytania i rysunki są własne.' }),
  ]);
}

export { gwiazdki };
