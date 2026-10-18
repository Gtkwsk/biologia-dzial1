// Krótkie dźwięki gry (krótkie i wyłączalne; wzorzec z gry „Wyprawa do wnętrza życia”). Syntezowane w Web Audio,
// bez plików, więc działają offline. Włączanie i wyłączanie: przycisk głośnika i panel rodzica (stan.ustawienia.dzwiek);
// ten sam przełącznik steruje wibracją (Android; Safari na iPadzie jej nie obsługuje).
// Dźwięk błędu jest cichy i niski: informuje, nie karze. Kolejne dobre odpowiedzi bez błędu
// brzmią coraz wyżej (seria bez kary: błąd tylko wraca do pierwszego tonu).

const GLOSNOSC = 0.12;
const MAKS_SERIA = 4;
// Mnożniki wysokości kolejnych dobrych odpowiedzi (interwały tercja, kwinta, oktawa).
const SERIA = [1, 1.2, 1.5, 2];

// Nuty: [częstotliwość w Hz, początek w s, długość w s, kształt fali].
const DZWIEKI = {
  dobrze: [
    [660, 0, 0.09, 'sine'],
    [880, 0.08, 0.13, 'sine'],
  ],
  zle: [
    [262, 0, 0.12, 'triangle'],
    [220, 0.1, 0.16, 'triangle'],
  ],
  // Koniec zadania bez błędu: zaczyna się chwilę po dźwięku ostatniej odpowiedzi.
  koniec: [
    [523, 0.22, 0.1, 'sine'],
    [659, 0.31, 0.1, 'sine'],
    [784, 0.4, 0.18, 'sine'],
  ],
  wygrana: [
    [523, 0, 0.11, 'sine'],
    [659, 0.11, 0.11, 'sine'],
    [784, 0.22, 0.11, 'sine'],
    [1047, 0.33, 0.32, 'sine'],
  ],
  // Fanfara: pokonany boss (po eksplozji) i komplet punktów w próbnym sprawdzianie.
  fanfara: [
    [523, 0, 0.14, 'triangle'],
    [523, 0.16, 0.1, 'triangle'],
    [659, 0.28, 0.14, 'triangle'],
    [784, 0.44, 0.14, 'triangle'],
    [1047, 0.6, 0.5, 'triangle'],
    [659, 0.6, 0.5, 'sine'],
    [784, 0.6, 0.5, 'sine'],
  ],
  // Nowa albo lepsza karta w atlasie.
  karta: [
    [784, 0, 0.08, 'triangle'],
    [1175, 0.09, 0.08, 'triangle'],
    [1568, 0.18, 0.22, 'sine'],
  ],
  // Cios zadany bossowi: krótkie, niskie uderzenie.
  cios: [
    [160, 0, 0.07, 'square'],
    [110, 0.04, 0.16, 'triangle'],
  ],
  // Nowy poziom gracza: szybkie arpeggio w górę.
  poziom: [
    [392, 0, 0.08, 'square'],
    [523, 0.07, 0.08, 'square'],
    [659, 0.14, 0.08, 'square'],
    [784, 0.21, 0.08, 'square'],
    [1047, 0.28, 0.3, 'triangle'],
  ],
  // Combo x1.5 / x2 / x3.
  combo: [
    [988, 0, 0.06, 'square'],
    [1319, 0.06, 0.12, 'triangle'],
  ],
  // Odznaka.
  odznaka: [
    [659, 0, 0.1, 'triangle'],
    [988, 0.1, 0.1, 'triangle'],
    [1319, 0.2, 0.25, 'sine'],
  ],
  tik: [[1200, 0, 0.03, 'square']],
};

const WIBRACJE = {
  dobrze: [14],
  zle: [24, 40, 24],
  koniec: [18, 30, 36],
  wygrana: [30, 40, 30, 40, 80],
  fanfara: [30, 40, 30, 40, 120],
  karta: [16, 30, 16],
  cios: [40],
  poziom: [20, 30, 20, 30, 60],
  combo: [12, 20, 12],
  odznaka: [16, 30, 16],
  tik: [],
};

export const NAZWY_DZWIEKOW = Object.keys(DZWIEKI);

let wlaczone = true;
let kontekst = null;
let seria = 0;

export function ustawDzwieki(tak) {
  wlaczone = tak === true;
}

export function dzwiekiWlaczone() {
  return wlaczone;
}

// Mnożnik wysokości dla kolejnej dobrej odpowiedzi w serii (funkcja czysta, do testów).
export function mnoznikSerii(n) {
  return SERIA[Math.min(Math.max(n, 1), MAKS_SERIA) - 1];
}

export function zerujSerie() {
  seria = 0;
}

function wibruj(nazwa) {
  const wzor = WIBRACJE[nazwa];
  if (!wzor || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(wzor);
  } catch {
    // Brak wibracji nie przerywa gry.
  }
}

export function graj(nazwa) {
  const nuty = DZWIEKI[nazwa];
  if (!wlaczone || !nuty) return;
  let mnoznik = 1;
  if (nazwa === 'dobrze') {
    seria = Math.min(seria + 1, MAKS_SERIA);
    mnoznik = mnoznikSerii(seria);
  } else if (nazwa === 'zle' || nazwa === 'koniec' || nazwa === 'wygrana' || nazwa === 'fanfara') {
    seria = 0;
  }
  wibruj(nazwa);
  const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!AC) return;
  try {
    kontekst ??= new AC();
    if (kontekst.state === 'suspended') kontekst.resume().catch(() => {});
    const t0 = kontekst.currentTime + 0.01;
    for (const [czestotliwosc, poczatek, dlugosc, ksztalt] of nuty) {
      const oscylator = kontekst.createOscillator();
      const wzmocnienie = kontekst.createGain();
      oscylator.type = ksztalt;
      oscylator.frequency.value = czestotliwosc * mnoznik;
      const start = t0 + poczatek;
      wzmocnienie.gain.setValueAtTime(0.0001, start);
      wzmocnienie.gain.exponentialRampToValueAtTime(GLOSNOSC, start + 0.015);
      wzmocnienie.gain.exponentialRampToValueAtTime(0.0001, start + dlugosc);
      oscylator.connect(wzmocnienie).connect(kontekst.destination);
      oscylator.start(start);
      oscylator.stop(start + dlugosc + 0.03);
    }
  } catch {
    // Brak dźwięku nie przerywa gry.
  }
}
