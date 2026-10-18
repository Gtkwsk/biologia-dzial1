// Widok jednego zadania (wszystkie typy). Obsługa dotykiem i klawiaturą, bez przeciągania.
//
//   const w = widokZadania(zadanie, { egzamin, naWynik })
//   w.el            element do wstawienia
//   naWynik(wynik, odp) wywoływane po „Sprawdź” / „Zatwierdź”
// W trybie egzaminu (sprawdzian) nie ma podpowiedzi; poprawne odpowiedzi widać dopiero w podsumowaniu.

import { h, ikona } from '../core/dom.js';
import { tasuj, tasujInaczej } from '../core/losuj.js';
import { sprawdz, kompletna } from '../core/zadania-logika.js';
import { rysunekMikroskopu } from './mikroskop.js';

const ETYKIETY_TYPOW = {
  wybor: 'Wybierz odpowiedź',
  pf: 'Prawda czy fałsz?',
  przyp: 'Dopasuj',
  kolejnosc: 'Ułóż w kolejności',
  luki: 'Uzupełnij luki',
  sort: 'Przyporządkuj',
  liczba: 'Oblicz',
  schemat: 'Podpisz schemat',
};

function wybierzLista(opcje, { etykieta, naZmiane }) {
  const sel = h('select', { class: 'wybor-lista', 'aria-label': etykieta, onchange: () => naZmiane(sel.value) }, [
    h('option', { value: '', tekst: '— wybierz —' }),
    ...opcje.map((o) => h('option', { value: o, tekst: o })),
  ]);
  return sel;
}

function poprawka(tekst) {
  return h('span', { class: 'poprawka' }, [ikona('dobrze', 'ikona ikona--mala'), ` ${tekst}`]);
}

const BUDOWNICZOWIE = {
  wybor(z, odp, zmiana) {
    const kolejnosc = tasuj(z.opcje.map((_, i) => i));
    const przyciski = kolejnosc.map((i, n) =>
      h('button', {
        type: 'button',
        class: 'opcja',
        'data-opcja': String(i),
        'aria-pressed': 'false',
        onclick: () => {
          odp.v = i;
          for (const b of przyciski) b.setAttribute('aria-pressed', String(b === przyciski[n]));
          zmiana();
        },
      }, [h('span', { class: 'opcja__litera', tekst: 'ABCDEF'[n] }), h('span', { class: 'opcja__tekst', tekst: z.opcje[i] })]),
    );
    return {
      el: h('div', { class: 'opcje' }, przyciski),
      oznacz(wynik, egzamin) {
        for (const b of przyciski) {
          const i = Number(b.dataset.opcja);
          b.disabled = true;
          if (egzamin) continue;
          if (i === z.poprawna) b.dataset.stan = 'dobrze';
          else if (i === odp.v) b.dataset.stan = 'zle';
        }
      },
    };
  },

  pf(z, odp, zmiana) {
    odp.v = z.zdania.map(() => null);
    const wiersze = z.zdania.map((zd, i) => {
      const przyciski = [true, false].map((wartosc) =>
        h('button', {
          type: 'button',
          class: `pf__przycisk pf__przycisk--${wartosc ? 'p' : 'f'}`,
          'aria-pressed': 'false',
          onclick: () => {
            odp.v[i] = wartosc;
            for (const b of przyciski) b.setAttribute('aria-pressed', String(b === przyciski[wartosc ? 0 : 1]));
            zmiana();
          },
        }, wartosc ? 'P' : 'F'),
      );
      return { el: h('div', { class: 'pf__wiersz' }, [h('p', { class: 'pf__zdanie', tekst: zd.t }), h('div', { class: 'pf__przyciski' }, przyciski)]), przyciski };
    });
    return {
      el: h('div', { class: 'pf' }, wiersze.map((w) => w.el)),
      oznacz(wynik, egzamin) {
        wiersze.forEach((w, i) => {
          w.przyciski.forEach((b) => (b.disabled = true));
          if (egzamin) return;
          w.el.dataset.stan = wynik.wyniki[i] ? 'dobrze' : 'zle';
          if (!wynik.wyniki[i]) w.el.append(poprawka(z.zdania[i].p ? 'To zdanie jest prawdziwe.' : 'To zdanie jest fałszywe.'));
        });
      },
    };
  },

  przyp(z, odp, zmiana) {
    odp.v = z.pary.map(() => '');
    const prawe = tasuj([...new Set([...z.pary.map((p) => p.p), ...(z.dodatkowe ?? [])])]);
    const kolejnosc = tasuj(z.pary.map((_, i) => i));
    const wiersze = kolejnosc.map((i) => {
      const sel = wybierzLista(prawe, { etykieta: z.pary[i].l, naZmiane: (v) => ((odp.v[i] = v), zmiana()) });
      return { i, sel, el: h('div', { class: 'przyp__wiersz' }, [h('p', { class: 'przyp__lewa', tekst: z.pary[i].l }), sel]) };
    });
    return {
      el: h('div', { class: 'przyp' }, wiersze.map((w) => w.el)),
      oznacz(wynik, egzamin) {
        for (const w of wiersze) {
          w.sel.disabled = true;
          if (egzamin) continue;
          w.el.dataset.stan = wynik.wyniki[w.i] ? 'dobrze' : 'zle';
          if (!wynik.wyniki[w.i]) w.el.append(poprawka(z.pary[w.i].p));
        }
      },
    };
  },

  kolejnosc(z, odp, zmiana) {
    odp.v = [];
    const pula = tasujInaczej(z.elementy);
    const ulozone = h('ol', { class: 'kol__ulozone', 'aria-label': 'Twoja kolejność' });
    const zrodlo = h('div', { class: 'kol__pula' });
    const podpowiedz = h('p', { class: 'kol__podpowiedz', tekst: 'Stukaj elementy po kolei. Stuknięcie ułożonego elementu odkłada go z powrotem.' });
    let zablokowane = false;
    const rysuj = () => {
      ulozone.replaceChildren(
        ...odp.v.map((e, n) =>
          h('li', {}, [
            h('button', {
              type: 'button',
              class: 'kol__element kol__element--ulozony',
              disabled: zablokowane,
              onclick: () => {
                odp.v.splice(n, 1);
                rysuj();
                zmiana();
              },
            }, [h('span', { class: 'kol__nr', tekst: String(n + 1) }), h('span', { tekst: e })]),
          ]),
        ),
      );
      zrodlo.replaceChildren(
        ...pula
          .filter((e) => !odp.v.includes(e))
          .map((e) =>
            h('button', {
              type: 'button',
              class: 'kol__element',
              disabled: zablokowane,
              onclick: () => {
                odp.v.push(e);
                rysuj();
                zmiana();
              },
            }, e),
          ),
      );
    };
    rysuj();
    return {
      el: h('div', { class: 'kol' }, [podpowiedz, ulozone, zrodlo]),
      oznacz(wynik, egzamin) {
        zablokowane = true;
        rysuj();
        podpowiedz.remove();
        if (egzamin) return;
        [...ulozone.children].forEach((li, i) => (li.dataset.stan = wynik.wyniki[i] ? 'dobrze' : 'zle'));
        if (!wynik.poprawne) {
          ulozone.after(h('div', { class: 'kol__poprawna' }, [h('p', { class: 'etykieta', tekst: 'Poprawna kolejność:' }), h('ol', {}, z.elementy.map((e) => h('li', { tekst: e })))]));
        }
      },
    };
  },

  luki(z, odp, zmiana) {
    odp.v = z.odp.map(() => '');
    const slowa = tasuj([...new Set([...z.odp, ...(z.bank ?? [])])]);
    const pola = [];
    const czesci = z.tekst.split(/\{(\d+)\}/);
    const akapit = h(
      'p',
      { class: 'luki__tekst' },
      czesci.map((c, n) => {
        if (n % 2 === 0) return c;
        const i = Number(c);
        const sel = wybierzLista(slowa, { etykieta: `luka ${i + 1}`, naZmiane: (v) => ((odp.v[i] = v), zmiana()) });
        sel.classList.add('wybor-lista--luka');
        pola[i] = sel;
        return sel;
      }),
    );
    return {
      el: h('div', { class: 'luki' }, [akapit]),
      oznacz(wynik, egzamin) {
        pola.forEach((p, i) => {
          p.disabled = true;
          if (egzamin) return;
          p.dataset.stan = wynik.wyniki[i] ? 'dobrze' : 'zle';
        });
        if (!egzamin && !wynik.poprawne) {
          akapit.after(h('p', { class: 'poprawka poprawka--blok' }, [ikona('dobrze', 'ikona ikona--mala'), ` Poprawnie: ${z.odp.map((o, i) => `${i + 1}) ${o}`).join(', ')}`]));
        }
      },
    };
  },

  sort(z, odp, zmiana) {
    odp.v = z.elementy.map(() => null);
    const kolejnosc = tasuj(z.elementy.map((_, i) => i));
    const wiersze = kolejnosc.map((i) => {
      const przyciski = z.kategorie.map((k, ki) =>
        h('button', {
          type: 'button',
          class: 'sort__kat',
          'data-kat': String(ki),
          'aria-pressed': 'false',
          onclick: () => {
            odp.v[i] = ki;
            przyciski.forEach((b, bi) => b.setAttribute('aria-pressed', String(bi === ki)));
            zmiana();
          },
        }, k),
      );
      return { i, przyciski, el: h('div', { class: 'sort__wiersz' }, [h('p', { class: 'sort__element', tekst: z.elementy[i].t }), h('div', { class: 'sort__kategorie' }, przyciski)]) };
    });
    return {
      el: h('div', { class: 'sort' }, wiersze.map((w) => w.el)),
      oznacz(wynik, egzamin) {
        for (const w of wiersze) {
          w.przyciski.forEach((b) => (b.disabled = true));
          if (egzamin) continue;
          w.el.dataset.stan = wynik.wyniki[w.i] ? 'dobrze' : 'zle';
          if (!wynik.wyniki[w.i]) w.el.append(poprawka(z.kategorie[z.elementy[w.i].k]));
        }
      },
    };
  },

  liczba(z, odp, zmiana) {
    odp.v = '';
    const pole = h('input', {
      type: 'text',
      inputmode: 'numeric',
      autocomplete: 'off',
      class: 'liczba__pole',
      'aria-label': 'Twoja odpowiedź',
      oninput: () => {
        pole.value = pole.value.replace(/[^\d]/g, '').slice(0, 6);
        odp.v = pole.value;
        zmiana();
      },
    });
    const klawiatura = h(
      'div',
      { class: 'liczba__klawiatura' },
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'C'].map((k) =>
        h('button', {
          type: 'button',
          class: 'klawisz',
          onclick: () => {
            if (k === '⌫') pole.value = pole.value.slice(0, -1);
            else if (k === 'C') pole.value = '';
            else if (pole.value.length < 6) pole.value += k;
            odp.v = pole.value;
            zmiana();
          },
        }, k),
      ),
    );
    const wiersz = h('div', { class: 'liczba__wiersz' }, [pole, h('span', { class: 'liczba__jednostka', tekst: z.jednostka ?? '' })]);
    return {
      el: h('div', { class: 'liczba' }, [wiersz, klawiatura]),
      oznacz(wynik, egzamin) {
        pole.disabled = true;
        klawiatura.remove();
        if (egzamin) return;
        wiersz.dataset.stan = wynik.poprawne ? 'dobrze' : 'zle';
        if (!wynik.poprawne) {
          const suma = z.pulapka !== undefined && Number(odp.v) === z.pulapka;
          wiersz.after(
            h('p', { class: 'poprawka poprawka--blok' }, [
              ikona('dobrze', 'ikona ikona--mala'),
              ` Poprawnie: ${z.rozwiazanie ?? z.odp}${z.rozwiazanie ? '' : ` ${z.jednostka ?? ''}`}`,
              suma ? h('strong', { class: 'pulapka', tekst: ' Uwaga: powiększenia się mnoży, a nie dodaje!' }) : null,
            ]),
          );
        }
      },
    };
  },

  schemat(z, odp, zmiana) {
    odp.v = z.punkty.map(() => '');
    const numery = z.numery ?? z.punkty.map((_, i) => i + 1);
    const nazwy = tasuj([...z.punkty, ...(z.dodatkowe ?? [])]);
    const rysunek = rysunekMikroskopu(z.punkty, numery);
    const kolejnosc = z.punkty.map((_, i) => i).sort((a, b) => numery[a] - numery[b]);
    const wiersze = kolejnosc.map((i) => {
      const sel = wybierzLista(nazwy, { etykieta: `część numer ${numery[i]}`, naZmiane: (v) => ((odp.v[i] = v), zmiana()) });
      return { i, sel, el: h('div', { class: 'schemat__wiersz' }, [h('span', { class: 'schemat__nr', tekst: String(numery[i]) }), sel]) };
    });
    return {
      el: h('div', { class: 'schemat' }, [h('div', { class: 'schemat__rysunek' }, [rysunek]), h('div', { class: 'schemat__lista' }, wiersze.map((w) => w.el))]),
      oznacz(wynik, egzamin) {
        for (const w of wiersze) {
          w.sel.disabled = true;
          if (egzamin) continue;
          w.el.dataset.stan = wynik.wyniki[w.i] ? 'dobrze' : 'zle';
          rysunek.querySelector(`[data-punkt="${w.i}"]`)?.setAttribute('data-stan', wynik.wyniki[w.i] ? 'dobrze' : 'zle');
          if (!wynik.wyniki[w.i]) w.el.append(poprawka(z.punkty[w.i]));
        }
      },
    };
  },
};

export function widokZadania(zadanie, { egzamin = false, naWynik, etykietaPrzycisku } = {}) {
  const odp = { v: null };
  const przycisk = h('button', { type: 'button', class: 'przycisk przycisk--glowny przycisk--sprawdz', disabled: true }, etykietaPrzycisku ?? (egzamin ? 'Zatwierdź' : 'Sprawdź'));
  const zmiana = () => {
    przycisk.disabled = !kompletna(zadanie, odp.v);
  };
  const budowniczy = BUDOWNICZOWIE[zadanie.typ];
  if (!budowniczy) throw new Error(`nieznany typ zadania ${zadanie.typ}`);
  const czesc = budowniczy(zadanie, odp, zmiana);
  const el = h('section', { class: `zadanie zadanie--${zadanie.typ}`, 'data-zadanie': zadanie.id }, [
    h('p', { class: 'zadanie__typ', tekst: ETYKIETY_TYPOW[zadanie.typ] }),
    h('h2', { class: 'zadanie__tresc', tekst: zadanie.tresc }),
    czesc.el,
    h('div', { class: 'zadanie__akcje' }, [przycisk]),
  ]);
  let gotowe = false;
  const zatwierdz = () => {
    if (gotowe || !kompletna(zadanie, odp.v)) return;
    gotowe = true;
    const wynik = sprawdz(zadanie, odp.v);
    czesc.oznacz(wynik, egzamin);
    przycisk.remove();
    if (!egzamin) el.dataset.stan = wynik.poprawne ? 'dobrze' : 'zle';
    naWynik?.(wynik, odp.v, el);
  };
  przycisk.addEventListener('click', zatwierdz);
  // Enter zatwierdza pole liczbowe.
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && zadanie.typ === 'liczba') zatwierdz();
  });
  return { el, zatwierdz, odpowiedz: () => odp.v };
}

// Panel z wyjaśnieniem po odpowiedzi (tryby treningowe).
export function panelWyjasnienia(zadanie, wynik, { naglowek, dodatki = [], przyciski = [] } = {}) {
  return h('div', { class: 'wyjasnienie', 'data-stan': wynik.poprawne ? 'dobrze' : 'zle', role: 'status' }, [
    h('p', { class: 'wyjasnienie__naglowek' }, [
      ikona(wynik.poprawne ? 'dobrze' : 'info', 'ikona'),
      naglowek ?? (wynik.poprawne ? 'Dobrze!' : wynik.dobre ? `Prawie: ${wynik.dobre} z ${wynik.wszystkie}.` : 'Tym razem nie.'),
    ]),
    ...dodatki,
    h('p', { class: 'wyjasnienie__tekst', tekst: zadanie.wyjasnienie }),
    h('div', { class: 'wyjasnienie__przyciski' }, przyciski),
  ]);
}
