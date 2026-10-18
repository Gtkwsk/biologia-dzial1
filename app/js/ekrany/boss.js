// Walka z bossem: 5 ciosów (pasek życia bossa), 3 serca gracza. Z każdej puli losowany jest
// jeden wariant zadania. Zła odpowiedź zabiera serce, a pula wraca na koniec kolejki z innym
// wariantem. Rewanż hardcore: 1 serce i 40 sekund na zadanie (tryb dobrowolny, po wygranej).

import { h } from '../core/dom.js';
import { graj } from '../core/dzwieki.js';
import { eksplozja } from '../core/efekty.js';
import { bossOdblokowany, swiatOdblokowany, zapiszBossa, zapiszOdpowiedz } from '../core/gra.js';
import { tasuj, wybierz } from '../core/losuj.js';
import { przygotuj } from '../core/zadania-logika.js';
import { widokZadania, panelWyjasnienia } from '../components/zadanie.js';
import { K, poNagrodzie, reakcjaNaOdpowiedz, zadanie } from '../kontekst.js';
import SWIATY from '../../data/swiaty.js';
import { formatCzas, naglowek, plakietkaXp } from './wspolne.js';

const CZAS_HARDCORE = 40;

export function ekranBossa({ swiat: nr, hardcore = false }) {
  const s = SWIATY.find((x) => x.id === nr);
  const stan = K.stan;
  if (!swiatOdblokowany(stan, nr) || !bossOdblokowany(stan, s) || (hardcore && !stan.bossy[nr]?.pokonany)) {
    return h('section', { class: 'ekran ekran--waski' }, [
      naglowek(s.boss.imie, { wstecz: `#/swiat/${nr}` }),
      h('p', { class: 'karta', tekst: hardcore ? '🔒 Rewanż hardcore otwiera się po pierwszej wygranej z bossem.' : '🔒 Najpierw ukończ wszystkie misje tego świata.' }),
    ]);
  }
  const b = s.boss;
  const ZYCIE = b.pule.length;
  const SERCA = hardcore ? 1 : 3;
  let zycie = ZYCIE;
  let serca = SERCA;
  let kolejka = [];
  let uzyte = new Set();
  let zegar = null;
  const ekran = h('section', { class: `ekran ekran--boss motyw-swiata-${nr}`, 'data-hardcore': String(hardcore) });

  const zatrzymajZegar = () => {
    if (zegar) clearInterval(zegar);
    zegar = null;
  };

  const losujWariant = (pula) => {
    const wolne = pula.filter((id) => !uzyte.has(id));
    const id = wybierz(wolne.length ? wolne : pula);
    uzyte.add(id);
    return przygotuj(zadanie(id));
  };

  const arena = h('div', { class: 'boss-arena' });
  const pasekBossa = h('div', { class: 'boss-hp', role: 'img' });
  const sercaEl = h('div', { class: 'boss-serca' });
  const czasEl = h('div', { class: 'boss-czas', hidden: !hardcore });
  const avatar = h('div', { class: 'boss-avatar', tekst: b.ikona });
  const miejsceZadania = h('div', { class: 'boss-zadanie' });

  const rysujStatus = () => {
    pasekBossa.setAttribute('aria-label', `Życie bossa: ${zycie} z ${ZYCIE}`);
    pasekBossa.replaceChildren(...Array.from({ length: ZYCIE }, (_, i) => h('span', { class: 'boss-hp__segment', 'data-pelny': String(i < zycie) })));
    sercaEl.setAttribute('aria-label', `Twoje serca: ${serca} z ${SERCA}`);
    sercaEl.replaceChildren(...Array.from({ length: SERCA }, (_, i) => h('span', { class: 'serce', 'data-pelne': String(i < serca), tekst: '❤' })));
  };

  const koniec = (wygrana) => {
    zatrzymajZegar();
    const w = zapiszBossa(stan, nr, { wygrana, hardcore });
    poNagrodzie(w);
    if (wygrana) {
      graj('cios');
      setTimeout(() => graj('fanfara'), 250);
      eksplozja(avatar);
    } else graj('koniec');
    const nastepny = nr < 3 ? `#/swiat/${nr + 1}` : '#/sprawdzian';
    ekran.replaceChildren(
      naglowek(b.imie, { wstecz: `#/swiat/${nr}`, nadtytul: hardcore ? 'Rewanż hardcore' : 'Walka z bossem' }),
      h('div', { class: 'podsumowanie karta', 'data-wygrana': String(wygrana) }, [
        h('div', { class: 'podsumowanie__boss', 'data-pokonany': String(wygrana), tekst: b.ikona }),
        h('p', { class: 'okno__nadtytul', tekst: wygrana ? 'ZWYCIĘSTWO!' : 'TYM RAZEM BOSS WYGRAŁ' }),
        h('h2', { class: 'podsumowanie__tytul', tekst: wygrana ? `${b.imie} pokonany!` : 'Nic straconego.' }),
        wygrana ? h('p', { class: 'podsumowanie__xp', tekst: `+${w.xp} XP` }) : null,
        h('p', {
          tekst: wygrana
            ? nr < 3
              ? hardcore
                ? 'Wygrana w trybie hardcore. Prawdziwy mistrz!'
                : `Brama do świata ${nr + 1} jest otwarta.`
              : 'Wszystkie światy zaliczone. Czas na próbny sprawdzian!'
            : 'Przeczytaj wyjaśnienia, powtórz misje i spróbuj ponownie. Zadania zostaną wylosowane od nowa.',
        }),
        h('div', { class: 'podsumowanie__przyciski' }, [
          wygrana ? h('a', { href: nastepny, class: 'przycisk przycisk--glowny' }, nr < 3 ? `Do świata ${nr + 1} ▶` : '📝 Próbny sprawdzian ▶') : null,
          h('button', { type: 'button', class: 'przycisk przycisk--boss', onclick: () => dispatchEvent(new HashChangeEvent('hashchange')) }, '⚔ Walcz jeszcze raz'),
          h('a', { href: `#/swiat/${nr}`, class: 'przycisk' }, 'Wróć do świata'),
        ]),
      ]),
    );
  };

  const nastepne = () => {
    rysujStatus();
    if (zycie <= 0) return koniec(true);
    if (serca <= 0) return koniec(false);
    const { pula, z } = kolejka.shift();
    let rozstrzygniete = false;
    const rozstrzygnij = (wynik, el) => {
      if (rozstrzygniete) return;
      rozstrzygniete = true;
      zatrzymajZegar();
      const wg = zapiszOdpowiedz(stan, { dobrze: wynik.poprawne, umiejetnosc: z.umiejetnosc });
      reakcjaNaOdpowiedz(wg, wynik.poprawne, el);
      if (wynik.poprawne) {
        zycie -= 1;
        graj('cios');
        avatar.classList.remove('boss-avatar--trafiony');
        void avatar.offsetWidth;
        avatar.classList.add('boss-avatar--trafiony');
      } else {
        serca -= 1;
        ekran.classList.remove('ekran--wstrzas');
        void ekran.offsetWidth;
        ekran.classList.add('ekran--wstrzas');
        kolejka.push({ pula, z: losujWariant(pula) });
      }
      rysujStatus();
      const ostatnie = zycie <= 0 || serca <= 0;
      const dalej = h('button', { type: 'button', class: 'przycisk przycisk--glowny', onclick: nastepne }, ostatnie ? 'Wynik walki ▶' : 'Następny cios ▶');
      el.append(
        panelWyjasnienia(z, wynik, {
          naglowek: wynik.poprawne ? `Trafienie! ${b.imie} traci punkt życia.` : wynik.czasMinal ? 'Czas minął! Tracisz serce.' : 'Pudło! Tracisz serce.',
          dodatki: wynik.poprawne ? [plakietkaXp(wg.xp, wg.mnoznik)] : [],
          przyciski: [dalej],
        }),
      );
      dalej.focus({ preventScroll: true });
      dalej.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    const widok = widokZadania(z, { naWynik: (wynik, _o, el) => rozstrzygnij(wynik, el), etykietaPrzycisku: '⚔ Atakuj!' });
    miejsceZadania.replaceChildren(widok.el);
    if (hardcore) {
      let zostalo = CZAS_HARDCORE;
      czasEl.textContent = `⏱ ${formatCzas(zostalo)}`;
      czasEl.dataset.malo = 'false';
      zegar = setInterval(() => {
        zostalo -= 1;
        czasEl.textContent = `⏱ ${formatCzas(zostalo)}`;
        czasEl.dataset.malo = String(zostalo <= 10);
        if (zostalo <= 10 && zostalo > 0) graj('tik');
        if (zostalo <= 0) {
          zatrzymajZegar();
          widok.el.querySelectorAll('button, select, input').forEach((x) => (x.disabled = true));
          widok.el.querySelector('.przycisk--sprawdz')?.remove();
          rozstrzygnij({ poprawne: false, dobre: 0, wszystkie: 1, wyniki: [false], czasMinal: true }, widok.el);
        }
      }, 1000);
    }
  };

  const startWalki = () => {
    zycie = ZYCIE;
    serca = SERCA;
    uzyte = new Set();
    kolejka = tasuj(b.pule).map((pula) => ({ pula, z: losujWariant(pula) }));
    ekran.replaceChildren(
      naglowek(b.imie, { wstecz: `#/swiat/${nr}`, nadtytul: hardcore ? '💀 Rewanż hardcore' : `Boss świata ${nr}` }),
      h('div', { class: 'boss-status' }, [avatar, h('div', { class: 'boss-status__paski' }, [h('p', { class: 'boss-status__imie', tekst: b.imie }), pasekBossa, h('div', { class: 'boss-status__dol' }, [sercaEl, czasEl])])]),
      miejsceZadania,
    );
    nastepne();
  };

  ekran.append(
    naglowek(b.imie, { wstecz: `#/swiat/${nr}`, nadtytul: hardcore ? '💀 Rewanż hardcore' : `Boss świata ${nr}` }),
    h('div', { class: 'boss-intro karta' }, [
      h('div', { class: 'boss-intro__ikona', tekst: b.ikona }),
      h('p', { class: 'boss-intro__opis', tekst: b.opis }),
      h('ul', { class: 'boss-intro__zasady' }, [
        h('li', { tekst: `⚔ ${ZYCIE} dobrych odpowiedzi pokonuje bossa (zadania z całego tematu).` }),
        h('li', { tekst: hardcore ? '❤ Masz tylko 1 serce. Jeden błąd i koniec!' : '❤ Masz 3 serca. Zła odpowiedź zabiera jedno.' }),
        hardcore ? h('li', { tekst: `⏱ Na każde zadanie masz ${CZAS_HARDCORE} sekund.` }) : h('li', { tekst: '⏳ Bez limitu czasu. Spokojnie czytaj polecenia.' }),
        h('li', { tekst: '🔥 Combo z misji trwa dalej i mnoży XP.' }),
      ]),
      h('button', { type: 'button', class: 'przycisk przycisk--boss przycisk--duzy', onclick: startWalki }, hardcore ? '💀 Zaczynamy rewanż' : '⚔ Do walki!'),
    ]),
    arena,
  );
  return { el: ekran, sprzataj: zatrzymajZegar };
}
