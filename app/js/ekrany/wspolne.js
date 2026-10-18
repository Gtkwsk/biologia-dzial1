// Elementy wspólne ekranów.

import { h, ikona } from '../core/dom.js';

export function naglowek(tytul, { wstecz = '#/', nadtytul = '', etykietaWstecz = 'Wróć' } = {}) {
  return h('header', { class: 'naglowek' }, [
    wstecz ? h('a', { href: wstecz, class: 'przycisk przycisk--ikona', 'aria-label': etykietaWstecz }, [ikona('wstecz')]) : null,
    h('div', { class: 'naglowek__teksty' }, [nadtytul ? h('p', { class: 'nadtytul', tekst: nadtytul }) : null, h('h1', { class: 'tytul', tabindex: '-1', tekst: tytul })]),
  ]);
}

export function gwiazdki(n, max = 3) {
  return h(
    'span',
    { class: 'gwiazdki', 'aria-label': `${n} z ${max} gwiazdek` },
    Array.from({ length: max }, (_, i) => h('span', { class: 'gwiazdka', 'data-pelna': String(i < n), tekst: '★' })),
  );
}

export function pasekPostepu(wartosc, max, { etykieta = 'Postęp', klasa = '' } = {}) {
  const el = h('div', { class: `pasek ${klasa}`, role: 'progressbar', 'aria-label': etykieta, 'aria-valuemin': '0', 'aria-valuemax': String(max), 'aria-valuenow': String(wartosc) }, [h('span', { class: 'pasek__wypelnienie' })]);
  el.firstChild.style.setProperty('--postep', `${max ? Math.min(100, (100 * wartosc) / max).toFixed(1) : 0}%`);
  return el;
}

export function kafel({ href, ikona: ik, tytul, opis, klasa = '', znaczek = null, zablokowany = false }) {
  const tresc = [
    h('span', { class: 'kafel__ikona', tekst: ik }),
    h('span', { class: 'kafel__teksty' }, [h('span', { class: 'kafel__tytul', tekst: tytul }), opis ? h('span', { class: 'kafel__opis', tekst: opis }) : null]),
    znaczek,
  ];
  if (zablokowany) return h('div', { class: `kafel kafel--zablokowany ${klasa}`, 'aria-disabled': 'true' }, [...tresc, h('span', { class: 'kafel__klodka' }, [ikona('klodka')])]);
  return h('a', { href, class: `kafel ${klasa}` }, tresc);
}

export function plakietkaXp(xp, mnoznik = 1) {
  return h('span', { class: 'plakietka-xp' }, [`+${xp} XP`, mnoznik > 1 ? h('span', { class: 'plakietka-xp__mnoznik', tekst: ` x${mnoznik}` }) : null]);
}

export function formatCzas(sekundy) {
  const s = Math.max(0, Math.ceil(sekundy));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
