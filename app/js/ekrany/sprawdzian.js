// Próbny sprawdzian: zadania z całego działu, bez podpowiedzi w trakcie, z punktacją,
// oceną szkolną i raportem słabych stron. Zegar 30 minut jest dobrowolny.

import { h } from '../core/dom.js';
import { graj } from '../core/dzwieki.js';
import { konfetti, licznik } from '../core/efekty.js';
import { dodajXp, ocenaSzkolna } from '../core/gra.js';
import { wybierz } from '../core/losuj.js';
import { dzisiaj } from '../core/stan.js';
import { przygotuj, punkty } from '../core/zadania-logika.js';
import { widokZadania } from '../components/zadanie.js';
import { K, poNagrodzie, zadanie } from '../kontekst.js';
import SPRAWDZIAN, { SKALA, CZAS_MINUT } from '../../data/sprawdzian.js';
import SWIATY from '../../data/swiaty.js';
import { formatCzas, naglowek, pasekPostepu } from './wspolne.js';

export const MAKS_PUNKTOW = SPRAWDZIAN.reduce((a, z) => a + z.punkty, 0);

export function wylosujSprawdzian(los = Math.random) {
  return SPRAWDZIAN.map((poz) => ({ ...poz, z: przygotuj(zadanie(wybierz(poz.pula, los)), los) }));
}

function nazwaMisji({ swiat, id }) {
  return SWIATY.find((s) => s.id === swiat)?.misje.find((m) => m.id === id)?.nazwa ?? id;
}

export function ekranSprawdzianu() {
  const ekran = h('section', { class: 'ekran ekran--sprawdzian' });
  let zegar = null;
  const stop = () => {
    if (zegar) clearInterval(zegar);
    zegar = null;
  };

  const start = (zZegarem) => {
    const zestaw = wylosujSprawdzian();
    const odpowiedzi = new Array(zestaw.length).fill(null); // { wynik, pkt }
    let i = 0;
    let zostalo = CZAS_MINUT * 60;
    const startCzas = Date.now();
    const czasEl = h('span', { class: 'spr__czas', hidden: !zZegarem, tekst: `⏱ ${formatCzas(zostalo)}` });
    const gora = h('div', { class: 'spr__gora' });
    const miejsce = h('div', { class: 'spr__zadanie' });

    const rysujGore = () => {
      gora.replaceChildren(
        h('span', { class: 'spr__licznik', tekst: `Zadanie ${Math.min(i + 1, zestaw.length)} z ${zestaw.length} · ${zestaw[Math.min(i, zestaw.length - 1)].punkty} pkt` }),
        czasEl,
        pasekPostepu(i, zestaw.length, { etykieta: 'Postęp sprawdzianu' }),
      );
    };

    const zakoncz = (czasMinal = false) => {
      stop();
      const wynik = odpowiedzi.reduce((a, o) => a + (o?.pkt ?? 0), 0);
      const proc = Math.round((100 * wynik) / MAKS_PUNKTOW);
      const ocena = ocenaSzkolna(proc, SKALA);
      const sekundy = Math.round((Date.now() - startCzas) / 1000);
      K.stan.sprawdziany.push({ data: dzisiaj(), pkt: wynik, max: MAKS_PUNKTOW, proc, czas: sekundy });
      K.stan.sprawdziany = K.stan.sprawdziany.slice(-20);
      const w = dodajXp(K.stan, wynik * 5);
      poNagrodzie(w);
      graj(proc >= 75 ? 'fanfara' : 'koniec');
      if (proc >= 75) konfetti({ ile: proc >= 100 ? 140 : 80 });

      const slabe = zestaw.map((poz, n) => ({ poz, o: odpowiedzi[n] })).filter(({ poz, o }) => (o?.pkt ?? 0) < poz.punkty);
      const misjeDoPowtorki = [...new Map(slabe.map(({ poz }) => [poz.misja.id, poz.misja])).values()];
      const liczbaEl = h('span', { tekst: '0' });
      ekran.replaceChildren(
        naglowek('Wynik sprawdzianu', { nadtytul: czasMinal ? 'Czas minął' : 'Próbny sprawdzian' }),
        h('div', { class: 'spr-wynik karta', 'data-zdany': String(proc >= 50) }, [
          h('p', { class: 'spr-wynik__punkty' }, [liczbaEl, ` / ${MAKS_PUNKTOW} pkt`]),
          h('p', { class: 'spr-wynik__proc', tekst: `${proc}%` }),
          h('p', { class: 'spr-wynik__ocena', tekst: `Przewidywana ocena: ${ocena}` }),
          h('p', { class: 'spr-wynik__czas', tekst: `Czas: ${formatCzas(sekundy)} · +${wynik * 5} XP` }),
          h('p', { class: 'spr-wynik__uwaga', tekst: 'Skala ocen jest orientacyjna. Nauczyciel może stosować inne progi procentowe.' }),
        ]),
        misjeDoPowtorki.length
          ? h('div', { class: 'karta raport' }, [
              h('h2', { class: 'karta__tytul', tekst: '🎯 Do powtórki przed sprawdzianem' }),
              h('ul', { class: 'raport__lista' }, misjeDoPowtorki.map((m) => h('li', {}, [h('a', { href: `#/swiat/${m.swiat}/misja/${m.id}`, class: 'link', tekst: `Świat ${m.swiat}: ${nazwaMisji(m)}` })]))),
            ])
          : h('div', { class: 'karta raport' }, [h('h2', { class: 'karta__tytul', tekst: '🏆 Komplet punktów! Jesteś gotowy.' })]),
        h('h2', { class: 'sekcja__tytul', tekst: 'Zadanie po zadaniu' }),
        h(
          'ol',
          { class: 'spr-lista' },
          zestaw.map((poz, n) => {
            const o = odpowiedzi[n];
            const pkt = o?.pkt ?? 0;
            const pelne = pkt === poz.punkty;
            return h('li', { class: 'spr-lista__poz', 'data-stan': pelne ? 'dobrze' : pkt > 0 ? 'czesciowo' : 'zle' }, [
              h('details', {}, [
                h('summary', {}, [
                  h('span', { class: 'spr-lista__nr', tekst: `${poz.nr}.` }),
                  h('span', { class: 'spr-lista__nazwa', tekst: poz.nazwa }),
                  h('span', { class: 'spr-lista__pkt', tekst: `${pkt}/${poz.punkty} pkt` }),
                ]),
                h('div', { class: 'spr-lista__szczegoly' }, [
                  h('p', { class: 'spr-lista__tresc', tekst: poz.z.tresc }),
                  o ? null : h('p', { class: 'spr-lista__brak', tekst: 'Brak odpowiedzi.' }),
                  o && !pelne ? h('p', { tekst: `Dobrze: ${o.wynik.dobre} z ${o.wynik.wszystkie} elementów.` }) : null,
                  h('p', { class: 'spr-lista__klucz', tekst: kluczOdpowiedzi(poz.z) }),
                  h('p', { class: 'spr-lista__wyjasnienie', tekst: poz.z.wyjasnienie }),
                  pelne ? null : h('a', { href: `#/swiat/${poz.misja.swiat}/misja/${poz.misja.id}`, class: 'link', tekst: `Ćwicz: ${nazwaMisji(poz.misja)} ▶` }),
                ]),
              ]),
            ]);
          }),
        ),
        h('div', { class: 'podsumowanie__przyciski' }, [
          h('button', { type: 'button', class: 'przycisk przycisk--glowny', onclick: () => dispatchEvent(new HashChangeEvent('hashchange')) }, '📝 Nowy zestaw'),
          h('a', { href: '#/powtorka', class: 'przycisk' }, '🧠 Powtórka'),
          h('a', { href: '#/', class: 'przycisk' }, 'Baza'),
        ]),
      );
      licznik(liczbaEl, wynik);
    };

    const pokaz = () => {
      rysujGore();
      if (i >= zestaw.length) return zakoncz();
      const poz = zestaw[i];
      const widok = widokZadania(poz.z, {
        egzamin: true,
        naWynik: (wynik) => {
          odpowiedzi[i] = { wynik, pkt: punkty(poz.z, wynik, poz.punkty) };
          i += 1;
          graj('tik');
          pokaz();
        },
      });
      const pomin = h('button', { type: 'button', class: 'przycisk przycisk--cichy', onclick: () => ((i += 1), pokaz()) }, 'Pomiń (0 pkt)');
      widok.el.querySelector('.zadanie__akcje').append(pomin);
      miejsce.replaceChildren(h('p', { class: 'spr__numer', tekst: `Zadanie ${poz.nr}. ${poz.nazwa} (${poz.punkty} pkt)` }), widok.el);
    };

    ekran.replaceChildren(naglowek('Próbny sprawdzian', { nadtytul: 'Dział I · Biologia – nauka o życiu', wstecz: '#/sprawdzian' }), gora, miejsce);
    if (zZegarem) {
      zegar = setInterval(() => {
        zostalo -= 1;
        czasEl.textContent = `⏱ ${formatCzas(zostalo)}`;
        czasEl.dataset.malo = String(zostalo <= 120);
        if (zostalo <= 0) zakoncz(true);
      }, 1000);
    }
    pokaz();
  };

  const historia = K.stan.sprawdziany.slice(-5).reverse();
  let zZegarem = false;
  const przelacznik = h('button', {
    type: 'button',
    class: 'przelacznik',
    role: 'switch',
    'aria-checked': 'false',
    onclick: () => {
      zZegarem = !zZegarem;
      przelacznik.setAttribute('aria-checked', String(zZegarem));
    },
  }, [h('span', { class: 'przelacznik__galka' }), `Zegar ${CZAS_MINUT} minut (jak na lekcji)`]);
  ekran.append(
    naglowek('Próbny sprawdzian', { nadtytul: 'Dział I · Biologia – nauka o życiu' }),
    h('div', { class: 'karta spr-intro' }, [
      h('p', { class: 'spr-intro__lead', tekst: `${SPRAWDZIAN.length} zadań · ${MAKS_PUNKTOW} punktów · wszystkie trzy tematy działu.` }),
      h('ul', { class: 'lista-ptaszki' }, [
        h('li', { tekst: 'Zadania są losowane z puli, więc każde podejście jest trochę inne.' }),
        h('li', { tekst: 'Jak na prawdziwym sprawdzianie: podpowiedzi i poprawne odpowiedzi zobaczysz dopiero na końcu.' }),
        h('li', { tekst: 'Na końcu: punkty, przewidywana ocena i lista misji do powtórki.' }),
        h('li', { tekst: 'Punktacja: wybór, obliczenia i kolejność – 0 albo komplet; pozostałe zadania – punkty za część dobrych elementów.' }),
      ]),
      przelacznik,
      h('button', { type: 'button', class: 'przycisk przycisk--glowny przycisk--duzy', onclick: () => start(zZegarem) }, '📝 Rozpocznij sprawdzian'),
    ]),
    historia.length
      ? h('div', { class: 'karta' }, [
          h('h2', { class: 'karta__tytul', tekst: 'Ostatnie wyniki' }),
          h('ul', { class: 'historia' }, historia.map((s) => h('li', { tekst: `${s.data}: ${s.pkt}/${s.max} pkt (${s.proc}%) · ${ocenaSzkolna(s.proc, SKALA)}` }))),
        ])
      : null,
  );
  return { el: ekran, sprzataj: stop };
}

// Krótki klucz odpowiedzi do podsumowania.
export function kluczOdpowiedzi(z) {
  switch (z.typ) {
    case 'wybor':
      return `Odpowiedź: ${z.opcje[z.poprawna]}`;
    case 'pf':
      return `Klucz: ${z.zdania.map((zd, i) => `${i + 1} – ${zd.p ? 'P' : 'F'}`).join(', ')}`;
    case 'przyp':
      return `Klucz: ${z.pary.map((p) => `${p.l} → ${p.p}`).join('; ')}`;
    case 'kolejnosc':
      return `Kolejność: ${z.elementy.join(' → ')}`;
    case 'luki':
      return `Luki: ${z.odp.join(', ')}`;
    case 'sort':
      return `Klucz: ${z.elementy.map((e) => `${e.t} – ${z.kategorie[e.k]}`).join('; ')}`;
    case 'liczba':
      return `Wynik: ${z.rozwiazanie ?? z.odp} ${z.jednostka ?? ''}`.trim();
    case 'schemat':
      return `Części: ${z.punkty
        .map((p, i) => [z.numery?.[i] ?? i + 1, p])
        .sort((a, b) => a[0] - b[0])
        .map(([n, p]) => `${n} – ${p}`)
        .join(', ')}`;
    default:
      return '';
  }
}
