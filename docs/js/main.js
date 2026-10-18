// Start aplikacji: wczytanie stanu, pasek gracza (HUD), router ekranów.

import { h, ikona, wyczysc } from './core/dom.js';
import { ustawDzwieki } from './core/dzwieki.js';
import { utworzMagazyn } from './core/magazyn.js';
import { adres, parsujAdres } from './core/router.js';
import { K, imieGracza, infoGracza, ustawDzwiek, powiadom } from './kontekst.js';
import { ekranImienia } from './ekrany/imie.js';
import { zarejestrujServiceWorker } from './pwa.js';
import { ekranMapy } from './ekrany/mapa.js';
import { ekranSwiata } from './ekrany/swiat.js';
import { ekranMisji } from './ekrany/misja.js';
import { ekranBossa } from './ekrany/boss.js';
import { ekranAreny } from './ekrany/arena.js';
import { ekranSprawdzianu } from './ekrany/sprawdzian.js';
import { ekranPowtorki, ekranFiszek, ekranOtwartych, ekranPowiekszen, ekranSciagi } from './ekrany/powtorka.js';
import { ekranProfilu, ekranRodzica } from './ekrany/profil.js';

let sprzataj = null;

function hud() {
  const el = document.getElementById('hud');
  const g = infoGracza();
  const logo = h('a', { href: '#/', class: 'hud__logo', 'aria-label': 'Baza (przytrzymaj 3 sekundy: panel rodzica)' }, [
    h('span', { class: 'hud__logo-znak', tekst: '⚡' }),
    h('span', { class: 'hud__logo-tekst' }, [h('strong', { tekst: 'PULS' }), ' ARENA']),
  ]);
  // Przytrzymanie logo przez 3 s otwiera panel rodzica (jak w grze-wzorcu).
  let zegar = null;
  const start = () => {
    zegar = setTimeout(() => {
      zegar = null;
      location.hash = '#/rodzic';
    }, 3000);
  };
  const stop = () => zegar && clearTimeout(zegar);
  logo.addEventListener('pointerdown', start);
  for (const z of ['pointerup', 'pointerleave', 'pointercancel']) logo.addEventListener(z, stop);
  logo.addEventListener('contextmenu', (e) => e.preventDefault());

  const pasek = h('div', { class: 'hud__xp-pasek', role: 'progressbar', 'aria-label': 'Postęp do kolejnego poziomu', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(g.postep * 100)) }, [h('span', { class: 'hud__xp-wypelnienie' })]);
  pasek.firstChild.style.setProperty('--postep', `${(g.postep * 100).toFixed(1)}%`);
  const combo = K.stan.combo;
  wyczysc(el);
  el.append(
    logo,
    h('a', { href: '#/profil', class: 'hud__gracz', 'aria-label': `Poziom ${g.poziom}, ${g.ranga}. Profil gracza.` }, [
      h('span', { class: 'hud__poziom', tekst: String(g.poziom) }),
      h('span', { class: 'hud__opis' }, [h('span', { class: 'hud__ranga', tekst: `${imieGracza()} · ${g.ranga}` }), pasek, h('span', { class: 'hud__xp', tekst: g.max ? `${K.stan.xp} XP · MAX` : `${K.stan.xp} / ${g.do} XP` })]),
    ]),
    h('div', { class: 'hud__liczniki' }, [
      h('span', { class: 'hud__licznik hud__licznik--combo', 'data-aktywne': String(combo >= 3), title: 'Combo: dobre odpowiedzi z rzędu', tekst: `🔥 ${combo}` }),
      h('span', { class: 'hud__licznik', title: 'Seria dni nauki', tekst: `📅 ${g.seria}` }),
      h('button', {
        type: 'button',
        class: 'hud__dzwiek',
        'aria-label': K.stan.ustawienia.dzwiek ? 'Wyłącz dźwięk' : 'Włącz dźwięk',
        onclick: () => ustawDzwiek(!K.stan.ustawienia.dzwiek),
        tekst: K.stan.ustawienia.dzwiek ? '🔊' : '🔇',
      }),
    ]),
  );
}

function ekranNieznany() {
  return h('section', { class: 'ekran ekran--waski' }, [
    h('h1', { class: 'tytul', tekst: 'Tu nic nie ma' }),
    h('p', { tekst: 'Ten adres nie prowadzi do żadnego ekranu.' }),
    h('a', { href: '#/', class: 'przycisk przycisk--glowny' }, [ikona('wstecz'), ' Wróć do bazy']),
  ]);
}

const EKRANY = {
  mapa: ekranMapy,
  swiat: ekranSwiata,
  misja: ekranMisji,
  boss: ekranBossa,
  arena: ekranAreny,
  sprawdzian: ekranSprawdzianu,
  powtorka: ekranPowtorki,
  fiszki: ekranFiszek,
  otwarte: ekranOtwartych,
  powiekszenia: ekranPowiekszen,
  sciaga: ekranSciagi,
  profil: ekranProfilu,
  rodzic: ekranRodzica,
};

function pokaz() {
  const cel = parsujAdres(location.hash);
  if (typeof sprzataj === 'function') sprzataj();
  sprzataj = null;
  const glowny = document.getElementById('ekran');
  wyczysc(glowny);
  document.querySelectorAll('.okno-tlo').forEach((o) => o.remove());
  let wynik;
  try {
    // Pierwsze uruchomienie (albo stary zapis bez imienia): najpierw pytamy o imię.
    // Panel rodzica zostaje dostępny zawsze.
    if (!K.stan.imie && cel.ekran !== 'rodzic') wynik = ekranImienia({ poZapisie: pokaz });
    else wynik = (EKRANY[cel.ekran] ?? ekranNieznany)(cel);
  } catch (blad) {
    console.error(blad);
    wynik = ekranNieznany();
  }
  if (wynik && wynik.el) {
    glowny.append(wynik.el);
    sprzataj = wynik.sprzataj ?? null;
  } else glowny.append(wynik);
  document.body.dataset.ekran = !K.stan.imie && cel.ekran !== 'rodzic' ? 'imie' : cel.ekran;
  hud();
  scrollTo(0, 0);
  glowny.querySelector('h1')?.focus?.({ preventScroll: true });
}

function start() {
  K.magazyn = utworzMagazyn(globalThis.localStorage);
  const { stan, dostepny, uszkodzony } = K.magazyn.wczytaj();
  K.stan = stan;
  K.zapisDostepny = dostepny;
  ustawDzwieki(stan.ustawienia.dzwiek);
  document.addEventListener('hud', hud);
  addEventListener('hashchange', pokaz);
  pokaz();
  if (!dostepny) powiadom('Przeglądarka nie pozwala zapisywać postępów. Gra działa, ale wynik zniknie po zamknięciu.', { ikona: '⚠️' });
  if (uszkodzony) powiadom('Zapis był uszkodzony. Zaczynasz od nowa (stara kopia została zachowana).', { ikona: '⚠️' });
  zarejestrujServiceWorker();
}

export { adres };
start();
