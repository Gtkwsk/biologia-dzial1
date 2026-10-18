// Centrum powtórek: fiszki (3 pudełka), pytania otwarte z kluczem, trening powiększeń, ściąga.

import { h, ikona } from '../core/dom.js';
import { graj } from '../core/dzwieki.js';
import { iskry } from '../core/efekty.js';
import { dodajXp, NAZWY_UMIEJETNOSCI, raportUmiejetnosci, XP } from '../core/gra.js';
import { tasuj } from '../core/losuj.js';
import { zadanieObiektywu, zadaniePowiekszenia } from '../core/generator.js';
import { K, misjaUmiejetnosci, poNagrodzie } from '../kontekst.js';
import FISZKI from '../../data/fiszki.js';
import OTWARTE from '../../data/otwarte.js';
import SCIAGA from '../../data/sciaga.js';
import { kafel, naglowek, pasekPostepu } from './wspolne.js';

const TEMATY = { 0: 'Wszystkie', 1: 'Temat 1', 2: 'Temat 2', 3: 'Temat 3' };

function wyborTematu(aktywny, naZmiane) {
  const przyciski = Object.entries(TEMATY).map(([k, t]) =>
    h('button', { type: 'button', class: 'zakladka', 'aria-pressed': String(Number(k) === aktywny), onclick: () => naZmiane(Number(k)) }, t),
  );
  return h('div', { class: 'zakladki', role: 'group', 'aria-label': 'Wybór tematu' }, przyciski);
}

export function ekranPowtorki() {
  const raport = raportUmiejetnosci(K.stan).filter((r) => r.proc !== null && r.proc < 80).slice(0, 4);
  const fiszkiUmiem = Object.values(K.stan.fiszki).filter((p) => p >= 3).length;
  return h('section', { class: 'ekran ekran--powtorka' }, [
    naglowek('Powtórka przed sprawdzianem', { nadtytul: 'Centrum treningowe' }),
    raport.length
      ? h('div', { class: 'karta raport' }, [
          h('h2', { class: 'karta__tytul', tekst: '🎯 Twoje słabsze punkty' }),
          h(
            'ul',
            { class: 'raport__lista' },
            raport.map((r) => {
              const m = misjaUmiejetnosci(r.klucz);
              return h('li', {}, [
                h('span', { tekst: `${NAZWY_UMIEJETNOSCI[r.klucz] ?? r.klucz}: ${r.proc}% dobrych` }),
                m ? h('a', { href: `#/swiat/${m.swiat}/misja/${m.misja}`, class: 'link', tekst: ` ćwicz ▶` }) : null,
              ]);
            }),
          ),
        ])
      : null,
    h('div', { class: 'kafle' }, [
      kafel({ href: '#/fiszki', ikona: '🃏', tytul: 'Fiszki', opis: `${FISZKI.length} pojęć z działu. „Umiem na pewno”: ${fiszkiUmiem}.` }),
      kafel({ href: '#/otwarte', ikona: '✍️', tytul: 'Pytania otwarte', opis: `${OTWARTE.length} pytań jak na sprawdzianie. Napisz odpowiedź i porównaj z kluczem.` }),
      kafel({ href: '#/powiekszenia', ikona: '🧮', tytul: 'Trening powiększeń', opis: `Okular × obiektyw bez końca. Najlepsza seria: ${K.stan.powiekszenia.najlepsza}.` }),
      kafel({ href: '#/sciaga', ikona: '📌', tytul: 'Ściąga i pułapki', opis: 'Najważniejsze wiadomości i najczęstsze błędy z każdego tematu.' }),
      kafel({ href: '#/sprawdzian', ikona: '📝', tytul: 'Próbny sprawdzian', opis: 'Sprawdź się na koniec powtórki.', klasa: 'kafel--sprawdzian' }),
      kafel({ href: '#/arena', ikona: '⚡', tytul: 'Arena błyskawiczna', opis: 'Szybka rozgrzewka na 90 sekund.', klasa: 'kafel--arena' }),
    ]),
  ]);
}

export function ekranFiszek() {
  let temat = 0;
  const ekran = h('section', { class: 'ekran ekran--fiszki' });
  const miejsce = h('div');
  let talia = [];
  let i = 0;

  const ulozTalie = () => {
    const pula = FISZKI.filter((f) => !temat || f.temat === temat);
    // najpierw najsłabiej znane (pudełko 1), w środku pudełka losowo
    talia = [1, 2, 3].flatMap((p) => tasuj(pula.filter((f) => (K.stan.fiszki[f.id] ?? 1) === p)));
    i = 0;
  };

  const pudelka = () => {
    const pula = FISZKI.filter((f) => !temat || f.temat === temat);
    const ile = [1, 2, 3].map((p) => pula.filter((f) => (K.stan.fiszki[f.id] ?? 1) === p).length);
    return h('div', { class: 'pudelka' }, [
      h('span', { class: 'pudelko pudelko--1', tekst: `📦 Nowe / do nauki: ${ile[0]}` }),
      h('span', { class: 'pudelko pudelko--2', tekst: `📦 Prawie: ${ile[1]}` }),
      h('span', { class: 'pudelko pudelko--3', tekst: `📦 Umiem na pewno: ${ile[2]}` }),
    ]);
  };

  const rysuj = () => {
    if (i >= talia.length) {
      miejsce.replaceChildren(
        pudelka(),
        h('div', { class: 'karta podsumowanie' }, [
          h('p', { class: 'okno__nadtytul', tekst: 'TALIA PRZEJRZANA' }),
          h('p', { tekst: 'Przejrzyj talię jeszcze raz: najpierw pokażą się fiszki, których jeszcze nie umiesz.' }),
          h('button', { type: 'button', class: 'przycisk przycisk--glowny', onclick: () => (ulozTalie(), rysuj()) }, '🔁 Jeszcze raz'),
        ]),
      );
      return;
    }
    const f = talia[i];
    let odwrocona = false;
    const karta = h('button', { type: 'button', class: 'fiszka', 'aria-label': 'Fiszka: stuknij, żeby odwrócić', 'data-odwrocona': 'false' }, [
      h('span', { class: 'fiszka__strona fiszka__przod' }, [h('span', { class: 'fiszka__etykieta', tekst: `Temat ${f.temat} · pojęcie` }), h('span', { class: 'fiszka__tekst', tekst: f.przod }), h('span', { class: 'fiszka__podpowiedz', tekst: 'Stuknij, żeby zobaczyć odpowiedź' })]),
      h('span', { class: 'fiszka__strona fiszka__tyl' }, [h('span', { class: 'fiszka__etykieta', tekst: f.przod }), h('span', { class: 'fiszka__tekst fiszka__tekst--tyl', tekst: f.tyl })]),
    ]);
    const oceny = h('div', { class: 'fiszka__oceny', hidden: true }, [
      h('button', { type: 'button', class: 'przycisk przycisk--zle', onclick: () => ocen(false) }, '✖ Jeszcze nie'),
      h('button', { type: 'button', class: 'przycisk przycisk--dobrze', onclick: (e) => ocen(true, e.currentTarget) }, '✔ Umiem'),
    ]);
    karta.addEventListener('click', () => {
      odwrocona = !odwrocona;
      karta.dataset.odwrocona = String(odwrocona);
      oceny.hidden = false;
    });
    const ocen = (umiem, el) => {
      const p = K.stan.fiszki[f.id] ?? 1;
      K.stan.fiszki[f.id] = umiem ? Math.min(3, p + 1) : 1;
      if (umiem) {
        graj('dobrze');
        iskry(el, { ile: 8 });
        poNagrodzie(dodajXp(K.stan, XP.fiszka));
      } else {
        graj('zle');
        poNagrodzie(null);
      }
      i += 1;
      rysuj();
    };
    miejsce.replaceChildren(pudelka(), h('p', { class: 'fiszki__licznik', tekst: `Fiszka ${i + 1} z ${talia.length}` }), karta, oceny);
  };

  const zmienTemat = (t) => {
    temat = t;
    ulozTalie();
    ekran.replaceChildren(naglowek('Fiszki', { wstecz: '#/powtorka', nadtytul: 'Powtórka' }), wyborTematu(temat, zmienTemat), miejsce);
    rysuj();
  };
  zmienTemat(0);
  return ekran;
}

export function ekranOtwartych() {
  let temat = 0;
  const ekran = h('section', { class: 'ekran ekran--otwarte' });
  const miejsce = h('div');
  let lista = [];
  let i = 0;

  const rysuj = () => {
    if (i >= lista.length) {
      miejsce.replaceChildren(
        h('div', { class: 'karta podsumowanie' }, [
          h('p', { class: 'okno__nadtytul', tekst: 'KONIEC PYTAŃ' }),
          h('p', { tekst: 'Najlepszy trening przed sprawdzianem: odpowiadaj pełnymi zdaniami, a potem porównuj z kluczem.' }),
          h('button', { type: 'button', class: 'przycisk przycisk--glowny', onclick: () => ((i = 0), (lista = tasuj(lista)), rysuj()) }, '🔁 Od nowa'),
        ]),
      );
      return;
    }
    const q = lista[i];
    const pole = h('textarea', { class: 'otwarte__pole', rows: '4', 'aria-label': 'Twoja odpowiedź', placeholder: 'Napisz tu swoją odpowiedź…' });
    const kluczEl = h('div', { class: 'otwarte__klucz', hidden: true });
    const pokaz = h('button', {
      type: 'button',
      class: 'przycisk przycisk--glowny',
      onclick: () => {
        pokaz.remove();
        pole.readOnly = true;
        const pola = q.klucz.map((k) => h('input', { type: 'checkbox', class: 'otwarte__check' }));
        const dalej = h('button', {
          type: 'button',
          class: 'przycisk przycisk--glowny',
          onclick: (e) => {
            const ile = pola.filter((p) => p.checked).length;
            if (ile * 2 >= q.klucz.length) {
              graj('dobrze');
              iskry(e.currentTarget, { ile: 10 });
              poNagrodzie(dodajXp(K.stan, XP.otwarte));
            } else poNagrodzie(null);
            i += 1;
            rysuj();
          },
        }, 'Dalej ▶');
        kluczEl.replaceChildren(
          h('p', { class: 'etykieta', tekst: `🔑 Klucz (${q.punkty} pkt). Zaznacz, co masz w swojej odpowiedzi:` }),
          h('ul', { class: 'otwarte__lista' }, q.klucz.map((k, n) => h('li', {}, [h('label', {}, [pola[n], ` ${k}`])]))),
          q.uwaga ? h('p', { class: 'otwarte__uwaga', tekst: q.uwaga }) : null,
          dalej,
        );
        kluczEl.hidden = false;
      },
    }, '🔑 Pokaż klucz');
    miejsce.replaceChildren(
      h('div', { class: 'karta otwarte' }, [
        h('p', { class: 'zadanie__typ', tekst: `Pytanie ${i + 1} z ${lista.length} · temat ${q.temat} · ${q.punkty} pkt` }),
        h('h2', { class: 'zadanie__tresc', tekst: q.pytanie }),
        pole,
        pokaz,
        kluczEl,
      ]),
    );
  };

  const zmienTemat = (t) => {
    temat = t;
    lista = OTWARTE.filter((q) => !temat || q.temat === temat);
    i = 0;
    ekran.replaceChildren(naglowek('Pytania otwarte', { wstecz: '#/powtorka', nadtytul: 'Powtórka' }), wyborTematu(temat, zmienTemat), miejsce);
    rysuj();
  };
  zmienTemat(0);
  return ekran;
}

export function ekranPowiekszen() {
  const stan = K.stan;
  stan.powiekszenia.seria = 0;
  const ekran = h('section', { class: 'ekran ekran--powiekszenia' });
  const miejsce = h('div', { class: 'karta pow' });
  const wzor = h('p', { class: 'pow__wzor' }, [h('strong', { tekst: 'powiększenie obrazu' }), ' = powiększenie okularu × powiększenie obiektywu']);

  const rysuj = () => {
    const z = Math.random() < 0.25 ? { ...zadanieObiektywu(), odwrotne: true } : zadaniePowiekszenia();
    const pole = h('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', class: 'liczba__pole', 'aria-label': 'Wynik' });
    const info = h('p', { class: 'pow__info', 'aria-live': 'polite' });
    let gotowe = false;
    const sprawdz = () => {
      if (gotowe || !pole.value.trim()) return;
      gotowe = true;
      const dobrze = Number(pole.value) === z.odp;
      if (dobrze) {
        stan.powiekszenia.seria += 1;
        stan.powiekszenia.razem += 1;
        stan.powiekszenia.najlepsza = Math.max(stan.powiekszenia.najlepsza, stan.powiekszenia.seria);
        graj('dobrze');
        iskry(pole, { ile: 12 });
        info.dataset.stan = 'dobrze';
        info.replaceChildren(ikona('dobrze', 'ikona ikona--mala'), ` Dobrze! ${z.rozwiazanie}. +${XP.powiekszenie} XP`);
        poNagrodzie(dodajXp(stan, XP.powiekszenie));
      } else {
        stan.powiekszenia.seria = 0;
        graj('zle');
        info.dataset.stan = 'zle';
        info.replaceChildren(
          ` Poprawnie: ${z.rozwiazanie}.`,
          Number(pole.value) === z.pulapka ? h('strong', { tekst: z.odwrotne ? ' Tu trzeba podzielić, a nie odjąć.' : ' Powiększenia się mnoży, a nie dodaje!' }) : '',
        );
        poNagrodzie(null);
      }
      pole.disabled = true;
      przycisk.textContent = 'Następne ▶';
      przycisk.onclick = rysuj;
      seria.textContent = `Seria: ${stan.powiekszenia.seria} · najlepsza: ${stan.powiekszenia.najlepsza}`;
      przycisk.focus();
    };
    const przycisk = h('button', { type: 'button', class: 'przycisk przycisk--glowny' }, 'Sprawdź');
    przycisk.onclick = sprawdz;
    pole.addEventListener('input', () => (pole.value = pole.value.replace(/[^\d]/g, '').slice(0, 6)));
    pole.addEventListener('keydown', (e) => e.key === 'Enter' && (gotowe ? rysuj() : sprawdz()));
    const seria = h('p', { class: 'pow__seria', tekst: `Seria: ${stan.powiekszenia.seria} · najlepsza: ${stan.powiekszenia.najlepsza}` });
    miejsce.replaceChildren(
      wzor,
      h('div', { class: 'pow__soczewki' }, [
        h('span', { class: 'pow__soczewka' }, [h('small', { tekst: 'okular' }), `${z.okular}×`]),
        h('span', { class: 'pow__znak', tekst: '×' }),
        h('span', { class: 'pow__soczewka' }, [h('small', { tekst: 'obiektyw' }), z.odwrotne ? '?' : `${z.obiektyw}×`]),
        h('span', { class: 'pow__znak', tekst: '=' }),
        h('span', { class: 'pow__soczewka pow__soczewka--wynik' }, [h('small', { tekst: 'obraz' }), z.odwrotne ? `${z.okular * z.obiektyw}×` : '?']),
      ]),
      h('p', { class: 'pow__pytanie', tekst: z.pytanie }),
      h('div', { class: 'liczba__wiersz' }, [pole, h('span', { class: 'liczba__jednostka', tekst: 'razy' })]),
      przycisk,
      info,
      seria,
      pasekPostepu(Math.min(stan.powiekszenia.seria, 10), 10, { etykieta: 'Seria do odznaki Kalkulator powiększeń' }),
    );
    pole.focus({ preventScroll: true });
  };
  ekran.append(naglowek('Trening powiększeń', { wstecz: '#/powtorka', nadtytul: 'Powtórka · temat 3' }), miejsce);
  rysuj();
  return ekran;
}

export function ekranSciagi() {
  return h('section', { class: 'ekran ekran--sciaga' }, [
    naglowek('Ściąga i pułapki', { wstecz: '#/powtorka', nadtytul: 'Powtórka' }),
    ...SCIAGA.map((t) =>
      h('div', { class: `karta sciaga motyw-swiata-${t.temat}` }, [
        h('h2', { class: 'karta__tytul', tekst: `Temat ${t.temat}. ${t.tytul}` }),
        h('ul', { class: 'lista-ptaszki' }, t.punkty.map((p) => h('li', { tekst: p }))),
        h('h3', { class: 'sciaga__pulapki-tytul', tekst: '⚠ Częste pułapki na sprawdzianie' }),
        h('ul', { class: 'sciaga__pulapki' }, t.pulapki.map((p) => h('li', { tekst: p }))),
      ]),
    ),
  ]);
}
