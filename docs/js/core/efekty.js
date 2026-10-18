// Efekty wizualne nagród (wzorzec z gry „Wyprawa do wnętrza życia”): iskry przy dobrej odpowiedzi, konfetti
// po zadaniu bez błędu, eksplozja przy pokonaniu bossa, licznik nabijający wynik.
// Czysty DOM i CSS (css/efekty.css), bez obrazków i bez płótna. Przy ustawieniu systemowym
// „ogranicz ruch” efekty się nie pojawiają. Losowość dotyczy tylko wyglądu cząstek, nigdy nagrody.

import { ograniczRuch } from './dom.js';

const KOLORY = ['#22d3ee', '#a3e635', '#fbbf24', '#f472b6', '#8b5cf6', '#38bdf8', '#fde68a'];

function warstwa() {
  let el = document.getElementById('efekty');
  if (!el) {
    el = document.createElement('div');
    el.id = 'efekty';
    el.setAttribute('aria-hidden', 'true');
    document.body.append(el);
  }
  return el;
}

function czastka(klasa, styl) {
  const el = document.createElement('span');
  el.className = klasa;
  for (const [k, v] of Object.entries(styl)) el.style.setProperty(k, v);
  el.addEventListener('animationend', () => el.remove(), { once: true });
  // Zabezpieczenie, gdyby animacja się nie uruchomiła (np. karta w tle).
  setTimeout(() => el.remove(), 4000);
  return el;
}

function srodek(cel) {
  if (!cel) return null;
  if (typeof cel.getBoundingClientRect === 'function') {
    const r = cel.getBoundingClientRect();
    if (!r.width && !r.height) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return Number.isFinite(cel.x) && Number.isFinite(cel.y) ? cel : null;
}

// Rozprysk iskier ze środka elementu (albo z punktu { x, y } w oknie).
export function iskry(cel, { ile = 12, zasieg = 1, kolory = KOLORY } = {}) {
  if (ograniczRuch()) return;
  const p = srodek(cel);
  if (!p) return;
  const w = warstwa();
  for (let i = 0; i < ile; i++) {
    const kat = (360 / ile) * i + Math.random() * (360 / ile);
    const odleglosc = (36 + Math.random() * 44) * zasieg;
    w.append(
      czastka('iskra', {
        '--x': `${p.x}px`,
        '--y': `${p.y}px`,
        '--kat': `${kat.toFixed(1)}deg`,
        '--d': `${odleglosc.toFixed(0)}px`,
        '--kolor': kolory[i % kolory.length],
        '--rozmiar': `${(6 + Math.random() * 6).toFixed(1)}px`,
      }),
    );
  }
}

// Konfetti spadające z góry ekranu.
export function konfetti({ ile = 70, kolory = KOLORY } = {}) {
  if (ograniczRuch()) return;
  const w = warstwa();
  for (let i = 0; i < ile; i++) {
    w.append(
      czastka('konfetti', {
        '--x': `${(Math.random() * 100).toFixed(1)}vw`,
        '--kolor': kolory[i % kolory.length],
        '--czas': `${(1.6 + Math.random() * 1.2).toFixed(2)}s`,
        '--opoznienie': `${(Math.random() * 0.6).toFixed(2)}s`,
        '--obrot': `${(540 + Math.random() * 720).toFixed(0)}deg`,
        '--dryf': `${(Math.random() * 80 - 40).toFixed(0)}px`,
        '--szer': `${(7 + Math.random() * 6).toFixed(0)}px`,
      }),
    );
  }
}

// Eksplozja przy pokonaniu bossa: duży rozprysk ze środka elementu i konfetti.
export function eksplozja(cel) {
  if (ograniczRuch()) return;
  iskry(cel ?? { x: innerWidth / 2, y: innerHeight / 3 }, { ile: 36, zasieg: 2.6 });
  konfetti({ ile: 110 });
}

// Nabija liczbę w elemencie od 0 do wartości końcowej. Element dostaje klasę licznik--animuje
// na czas animacji (test całej gry czeka na jej koniec).
export function licznik(el, wartosc, { ms = 500 } = {}) {
  const koniec = Math.max(0, Math.round(wartosc));
  if (ograniczRuch() || koniec === 0 || typeof requestAnimationFrame !== 'function') {
    el.textContent = String(koniec);
    return;
  }
  el.classList.add('licznik--animuje');
  el.textContent = '0';
  const start = performance.now();
  const krok = (teraz) => {
    const czesc = Math.min(1, (teraz - start) / ms);
    const wygladzona = 1 - (1 - czesc) ** 3;
    el.textContent = String(Math.round(koniec * wygladzona));
    if (czesc < 1) requestAnimationFrame(krok);
    else el.classList.remove('licznik--animuje');
  };
  requestAnimationFrame(krok);
}
