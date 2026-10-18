// Misja: kolejne zadania z natychmiastową informacją zwrotną, XP i combo.

import { h } from '../core/dom.js';
import { graj } from '../core/dzwieki.js';
import { konfetti, licznik } from '../core/efekty.js';
import { swiatOdblokowany, zapiszMisje, zapiszOdpowiedz } from '../core/gra.js';
import { przygotuj } from '../core/zadania-logika.js';
import { widokZadania, panelWyjasnienia } from '../components/zadanie.js';
import { K, poNagrodzie, reakcjaNaOdpowiedz, zadanie } from '../kontekst.js';
import SWIATY from '../../data/swiaty.js';
import { gwiazdki, naglowek, pasekPostepu, plakietkaXp } from './wspolne.js';

export function ekranMisji({ swiat: nr, misja: id }) {
  const s = SWIATY.find((x) => x.id === nr);
  const m = s?.misje.find((x) => x.id === id);
  if (!m || !swiatOdblokowany(K.stan, nr)) {
    return h('section', { class: 'ekran ekran--waski' }, [naglowek('Nie ma takiej misji', { wstecz: '#/' })]);
  }
  const zadania = m.zadania.map((zid) => przygotuj(zadanie(zid)));
  const kontener = h('div', { class: 'misja__zadanie' });
  const postep = h('div', { class: 'misja__postep' });
  let i = 0;
  let bledne = 0;
  let zebraneXp = 0;

  const rysujPostep = () => {
    postep.replaceChildren(
      h('span', { class: 'misja__licznik', tekst: `Zadanie ${Math.min(i + 1, zadania.length)} / ${zadania.length}` }),
      pasekPostepu(i, zadania.length, { etykieta: 'Postęp misji' }),
    );
  };

  const koniec = () => {
    const w = zapiszMisje(K.stan, m.id, bledne);
    zebraneXp += w.xp;
    poNagrodzie(w);
    if (w.gwiazdki === 3) {
      graj('wygrana');
      konfetti();
    } else graj('koniec');
    const liczbaXp = h('span', { class: 'podsumowanie__xp-liczba', tekst: '0' });
    const nastepna = s.misje[s.misje.indexOf(m) + 1];
    postep.replaceChildren();
    kontener.replaceChildren(
      h('div', { class: 'podsumowanie karta' }, [
        h('p', { class: 'okno__nadtytul', tekst: 'MISJA UKOŃCZONA' }),
        h('h2', { class: 'podsumowanie__tytul', tekst: m.nazwa }),
        gwiazdki(w.gwiazdki),
        h('p', { class: 'podsumowanie__xp' }, ['+', liczbaXp, ' XP']),
        h('p', { tekst: bledne === 0 ? 'Bez ani jednego błędu. Mistrzostwo!' : `Zadania z błędem: ${bledne}. Zagraj jeszcze raz po 3 gwiazdki.` }),
        h('div', { class: 'podsumowanie__przyciski' }, [
          nastepna
            ? h('a', { href: `#/swiat/${nr}/misja/${nastepna.id}`, class: 'przycisk przycisk--glowny' }, `Dalej: ${nastepna.nazwa} ▶`)
            : h('a', { href: `#/swiat/${nr}`, class: 'przycisk przycisk--glowny' }, 'Do bossa świata ▶'),
          h('button', { type: 'button', class: 'przycisk', onclick: () => dispatchEvent(new HashChangeEvent('hashchange')) }, '↻ Jeszcze raz'),
          h('a', { href: `#/swiat/${nr}`, class: 'przycisk' }, 'Lista misji'),
        ]),
      ]),
    );
    licznik(liczbaXp, zebraneXp);
  };

  const pokazZadanie = () => {
    rysujPostep();
    if (i >= zadania.length) return koniec();
    const z = zadania[i];
    const widok = widokZadania(z, {
      naWynik: (wynik, _odp, el) => {
        if (!wynik.poprawne) bledne += 1;
        const wg = zapiszOdpowiedz(K.stan, { dobrze: wynik.poprawne, umiejetnosc: z.umiejetnosc });
        zebraneXp += wg.xp;
        reakcjaNaOdpowiedz(wg, wynik.poprawne, el);
        const dalej = h('button', { type: 'button', class: 'przycisk przycisk--glowny', onclick: () => ((i += 1), pokazZadanie()) }, i + 1 < zadania.length ? 'Dalej ▶' : 'Zakończ misję ▶');
        el.append(panelWyjasnienia(z, wynik, { dodatki: wynik.poprawne ? [plakietkaXp(wg.xp, wg.mnoznik)] : [], przyciski: [dalej] }));
        dalej.focus({ preventScroll: true });
        dalej.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      },
    });
    kontener.replaceChildren(widok.el);
  };

  pokazZadanie();
  return h('section', { class: `ekran ekran--misja motyw-swiata-${nr}` }, [naglowek(m.nazwa, { wstecz: `#/swiat/${nr}`, nadtytul: `${s.ikona} ${s.tytul}` }), postep, kontener]);
}
