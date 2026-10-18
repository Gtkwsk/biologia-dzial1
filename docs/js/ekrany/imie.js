// Ekran powitalny z pytaniem o imię (pierwsze uruchomienie) i formularz zmiany imienia
// (profil, panel rodzica). Imię zapisuje się w tym samym zapisie co postępy.

import { h } from '../core/dom.js';
import { graj } from '../core/dzwieki.js';
import { MAKS_IMIE, normalizujImie } from '../core/stan.js';
import { K, odswiezHud, zapisz } from '../kontekst.js';

export function formularzImienia({ przycisk = 'Zapisz', poZapisie, duzy = false, id = 'pole-imienia' } = {}) {
  const pole = h('input', {
    id,
    type: 'text',
    class: `imie__pole${duzy ? ' imie__pole--duze' : ''}`,
    maxlength: String(MAKS_IMIE),
    autocomplete: 'given-name',
    autocapitalize: 'words',
    spellcheck: 'false',
    required: true,
    placeholder: 'np. Ola, Kuba, Zosia…',
    value: K.stan.imie || '',
  });
  const zatwierdz = h('button', { type: 'submit', class: `przycisk przycisk--glowny${duzy ? ' przycisk--duzy' : ''}` }, przycisk);
  const info = h('p', { class: 'imie__info', 'aria-live': 'polite' });
  const aktualizuj = () => {
    zatwierdz.disabled = normalizujImie(pole.value) === '';
  };
  pole.addEventListener('input', aktualizuj);
  aktualizuj();
  const form = h('form', { class: 'imie__formularz', novalidate: true }, [
    h('label', { class: 'imie__etykieta', for: id, tekst: 'Jak masz na imię?' }),
    h('div', { class: 'imie__wiersz' }, [pole, zatwierdz]),
    info,
  ]);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const imie = normalizujImie(pole.value);
    if (!imie) {
      info.textContent = 'Wpisz swoje imię.';
      pole.focus();
      return;
    }
    K.stan.imie = imie;
    zapisz();
    odswiezHud();
    graj('odznaka');
    info.textContent = `Zapisano: ${imie}`;
    poZapisie?.(imie);
  });
  form.pole = pole;
  return form;
}

export function ekranImienia({ poZapisie } = {}) {
  const formularz = formularzImienia({ przycisk: 'Zaczynamy ▶', duzy: true, poZapisie });
  const el = h('section', { class: 'ekran ekran--imie' }, [
    h('div', { class: 'imie-ekran karta' }, [
      h('div', { class: 'imie-ekran__logo', 'aria-hidden': 'true' }, [h('span', { tekst: '⚡' })]),
      h('p', { class: 'nadtytul', tekst: 'Biologia · klasa 5 · Dział I' }),
      h('h1', { class: 'tytul tytul--duzy', tabindex: '-1' }, ['Witaj w ', h('span', { class: 'tytul__akcent', tekst: 'Puls Arenie!' })]),
      h('p', { class: 'imie-ekran__opis', tekst: 'Trzy światy, trzech bossów i próbny sprawdzian z działu „Biologia – nauka o życiu”. Zbieraj XP, nabijaj combo i zdobywaj odznaki.' }),
      formularz,
      h('p', { class: 'imie-ekran__uwaga', tekst: 'Imię zapisuje się tylko na tym urządzeniu. Możesz je zmienić w profilu.' }),
    ]),
  ]);
  setTimeout(() => formularz.pole.focus({ preventScroll: true }), 50);
  return el;
}
