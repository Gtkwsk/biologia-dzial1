// Profil gracza (poziom, odznaki, statystyki) i ukryty panel rodzica.

import { h } from '../core/dom.js';
import { NAZWY_UMIEJETNOSCI, ocenaSzkolna, PROGI, RANGI, raportUmiejetnosci } from '../core/gra.js';
import { nowyStan } from '../core/stan.js';
import { K, infoGracza, misjaUmiejetnosci, odswiezHud, ustawDzwiek, zapisz } from '../kontekst.js';
import ODZNAKI from '../../data/odznaki.js';
import SWIATY from '../../data/swiaty.js';
import ZADANIA from '../../data/zadania.js';
import { SKALA } from '../../data/sprawdzian.js';
import { WERSJA } from '../wersja.js';
import { gotowosc } from './mapa.js';
import { naglowek, pasekPostepu } from './wspolne.js';

function statystyka(wartosc, opis) {
  return h('div', { class: 'stat' }, [h('span', { class: 'stat__wartosc', tekst: String(wartosc) }), h('span', { class: 'stat__opis', tekst: opis })]);
}

export function ekranProfilu() {
  const stan = K.stan;
  const g = infoGracza();
  const { dobre, zle } = stan.statystyki;
  const raport = raportUmiejetnosci(stan);
  const znane = new Map(raport.map((r) => [r.klucz, r]));
  return h('section', { class: 'ekran ekran--profil' }, [
    naglowek('Profil gracza', { nadtytul: 'Mikołaj' }),
    h('div', { class: 'karta profil-poziom' }, [
      h('div', { class: 'profil-poziom__odznaka', tekst: String(g.poziom) }),
      h('div', { class: 'profil-poziom__teksty' }, [
        h('p', { class: 'profil-poziom__ranga', tekst: g.ranga }),
        pasekPostepu(stan.xp - g.od, g.max ? 1 : g.do - g.od, { etykieta: 'XP do następnego poziomu', klasa: 'pasek--xp' }),
        h('p', { class: 'profil-poziom__xp', tekst: g.max ? `${stan.xp} XP · najwyższy poziom!` : `${stan.xp} XP · do poziomu ${g.poziom + 1} (${RANGI[g.poziom]}) brakuje ${g.do - stan.xp} XP` }),
      ]),
    ]),
    h('div', { class: 'staty' }, [
      statystyka(`${gotowosc(stan)}%`, 'gotowość do sprawdzianu'),
      statystyka(dobre + zle ? `${Math.round((100 * dobre) / (dobre + zle))}%` : '–', 'dobrych odpowiedzi'),
      statystyka(stan.maxCombo, 'najdłuższe combo'),
      statystyka(g.seria, 'dni z rzędu'),
      statystyka(stan.arenaRekord, 'rekord Areny'),
      statystyka(stan.sprawdziany.length ? `${Math.max(...stan.sprawdziany.map((s) => s.proc))}%` : '–', 'najlepszy sprawdzian'),
    ]),
    h('h2', { class: 'sekcja__tytul', tekst: `Odznaki (${Object.keys(stan.odznaki).length}/${ODZNAKI.length})` }),
    h(
      'ul',
      { class: 'odznaki' },
      ODZNAKI.map((o) =>
        h('li', { class: 'odznaka', 'data-zdobyta': String(!!stan.odznaki[o.id]) }, [
          h('span', { class: 'odznaka__ikona', tekst: stan.odznaki[o.id] ? o.ikona : '🔒' }),
          h('span', { class: 'odznaka__nazwa', tekst: o.nazwa }),
          h('span', { class: 'odznaka__opis', tekst: o.opis }),
        ]),
      ),
    ),
    h('h2', { class: 'sekcja__tytul', tekst: 'Mapa umiejętności' }),
    h(
      'ul',
      { class: 'umiejetnosci' },
      Object.entries(NAZWY_UMIEJETNOSCI).map(([k, nazwa]) => {
        const r = znane.get(k);
        const m = misjaUmiejetnosci(k);
        return h('li', { class: 'umiejetnosc', 'data-poziom': r?.proc == null ? 'brak' : r.proc >= 80 ? 'mocna' : r.proc >= 50 ? 'srednia' : 'slaba' }, [
          h('span', { class: 'umiejetnosc__nazwa', tekst: nazwa }),
          pasekPostepu(r?.proc ?? 0, 100, { etykieta: nazwa }),
          h('span', { class: 'umiejetnosc__proc', tekst: r?.proc == null ? 'jeszcze nie ćwiczono' : `${r.proc}% (${r.dobre}/${r.dobre + r.zle})` }),
          m && (r?.proc ?? 0) < 80 ? h('a', { href: `#/swiat/${m.swiat}/misja/${m.misja}`, class: 'link umiejetnosc__link', tekst: 'ćwicz ▶' }) : null,
        ]);
      }),
    ),
    h('h2', { class: 'sekcja__tytul', tekst: 'Rangi' }),
    h('ol', { class: 'rangi' }, RANGI.map((r, i) => h('li', { 'data-osiagnieta': String(stan.xp >= PROGI[i]) }, [h('strong', { tekst: `${i + 1}. ${r}` }), ` · od ${PROGI[i]} XP`]))),
  ]);
}

export function ekranRodzica() {
  const stan = K.stan;
  const ekran = h('section', { class: 'ekran ekran--rodzic' });
  const rysuj = () => {
    const misje = SWIATY.flatMap((s) => s.misje);
    const ukonczone = misje.filter((m) => stan.misje[m.id]?.ukonczono).length;
    let potwierdz = false;
    const reset = h('button', {
      type: 'button',
      class: 'przycisk przycisk--zle',
      onclick: () => {
        if (!potwierdz) {
          potwierdz = true;
          reset.textContent = 'Na pewno? Stuknij jeszcze raz, żeby usunąć postępy';
          return;
        }
        K.stan = nowyStan();
        zapisz();
        location.hash = '#/';
      },
    }, 'Wyzeruj postępy');
    const przelacznik = (wartosc, opis, zmien) => {
      const b = h('button', { type: 'button', class: 'przelacznik', role: 'switch', 'aria-checked': String(wartosc), onclick: () => (zmien(!wartosc), rysuj()) }, [h('span', { class: 'przelacznik__galka' }), opis]);
      return b;
    };
    const raport = raportUmiejetnosci(stan).filter((r) => r.proc !== null);
    ekran.replaceChildren(
      naglowek('Panel rodzica', { nadtytul: 'Ustawienia i wyniki' }),
      h('div', { class: 'karta' }, [
        h('h2', { class: 'karta__tytul', tekst: 'Wyniki' }),
        h('ul', { class: 'lista-ptaszki' }, [
          h('li', { tekst: `Misje: ${ukonczone}/${misje.length}; bossy: ${SWIATY.filter((s) => stan.bossy[s.id]?.pokonany).length}/3.` }),
          h('li', { tekst: `Odpowiedzi: ${stan.statystyki.dobre} dobrych, ${stan.statystyki.zle} błędnych. Dni nauki: ${stan.dni.length}.` }),
          h('li', { tekst: `Próbne sprawdziany: ${stan.sprawdziany.length ? stan.sprawdziany.map((s) => `${s.data} ${s.proc}% (${ocenaSzkolna(s.proc, SKALA)})`).join('; ') : 'jeszcze żadnego'}.` }),
          h('li', { tekst: `Najsłabsze umiejętności: ${raport.slice(0, 3).map((r) => `${NAZWY_UMIEJETNOSCI[r.klucz]} ${r.proc}%`).join(', ') || 'brak danych'}.` }),
        ]),
      ]),
      h('div', { class: 'karta rodzic__ustawienia' }, [
        h('h2', { class: 'karta__tytul', tekst: 'Ustawienia' }),
        przelacznik(stan.ustawienia.dzwiek, 'Dźwięki i wibracje', (v) => ustawDzwiek(v)),
        przelacznik(stan.ustawienia.odblokujWszystko, 'Odblokuj wszystkie światy i bossów (np. powtórka tylko jednego tematu)', (v) => {
          stan.ustawienia.odblokujWszystko = v;
          zapisz();
          odswiezHud();
        }),
        reset,
      ]),
      h('div', { class: 'karta' }, [
        h('h2', { class: 'karta__tytul', tekst: 'O aplikacji' }),
        h('p', { tekst: `Dział I „Biologia – nauka o życiu” (klasa 5, podręcznik „Puls życia 5”, Nowa Era, podstawa programowa 2024): tematy 1–3. ${ZADANIA.length} zadań w misjach i u bossów, próbny sprawdzian, fiszki, pytania otwarte i trening powiększeń.` }),
        h('p', { tekst: 'Treść zadań i rysunki są własne; aplikacja nie zawiera tekstów ani ilustracji z podręcznika. Działa offline, postępy zapisuje tylko w tej przeglądarce.' }),
        h('p', { tekst: 'Mechanika gry wzorowana na „Wyprawie do wnętrza życia” (biologia-gra.netlify.app).' }),
        h('p', { class: 'wersja', tekst: `Wersja ${WERSJA}` }),
      ]),
    );
  };
  rysuj();
  return ekran;
}
