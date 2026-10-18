// Stan gracza (zapisywany w localStorage). Funkcje czyste: łatwe do testów.

export const WERSJA_STANU = 1;

export function nowyStan() {
  return {
    wersja: WERSJA_STANU,
    imie: '', // imię gracza (pytamy przy pierwszym uruchomieniu)
    xp: 0,
    combo: 0,
    maxCombo: 0,
    misje: {}, // id -> { gwiazdki, ukonczono }
    bossy: {}, // nr świata -> { pokonany, hardcore, proby }
    odznaki: {}, // id -> data zdobycia
    dni: [], // daty RRRR-MM-DD, w które gracz grał
    statystyki: { dobre: 0, zle: 0 },
    umiejetnosci: {}, // klucz -> { dobre, zle }
    fiszki: {}, // id -> pudełko 1..3
    sprawdziany: [], // { data, pkt, max, proc, czas }
    arenaRekord: 0,
    powiekszenia: { seria: 0, najlepsza: 0, razem: 0 },
    ustawienia: { dzwiek: true, odblokujWszystko: false },
  };
}

function liczba(v, domyslna = 0) {
  return Number.isFinite(v) && v >= 0 ? v : domyslna;
}

function obiekt(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}

// Wczytuje zapis i uzupełnia brakujące pola. Rzuca wyjątek przy zupełnie złym formacie.
export function odczytajStan(dane) {
  if (!dane || typeof dane !== 'object' || Array.isArray(dane)) throw new Error('zły format');
  const s = nowyStan();
  s.imie = normalizujImie(dane.imie);
  s.xp = liczba(dane.xp);
  s.combo = 0; // combo nie przechodzi między sesjami
  s.maxCombo = liczba(dane.maxCombo);
  s.misje = obiekt(dane.misje);
  s.bossy = obiekt(dane.bossy);
  s.odznaki = obiekt(dane.odznaki);
  s.dni = Array.isArray(dane.dni) ? dane.dni.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)) : [];
  s.statystyki = { dobre: liczba(dane.statystyki?.dobre), zle: liczba(dane.statystyki?.zle) };
  s.umiejetnosci = obiekt(dane.umiejetnosci);
  s.fiszki = obiekt(dane.fiszki);
  s.sprawdziany = Array.isArray(dane.sprawdziany) ? dane.sprawdziany.slice(-20) : [];
  s.arenaRekord = liczba(dane.arenaRekord);
  s.powiekszenia = { ...s.powiekszenia, ...obiekt(dane.powiekszenia) };
  s.ustawienia = { ...s.ustawienia, ...obiekt(dane.ustawienia) };
  return s;
}

export const MAKS_IMIE = 20;

// Imię gracza: bez znaków sterujących i nadmiarowych spacji, najwyżej 20 znaków.
export function normalizujImie(tekst) {
  if (typeof tekst !== 'string') return '';
  return Array.from(
    tekst
      .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e]/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
  )
    .slice(0, MAKS_IMIE)
    .join('')
    .trim();
}

export function dzisiaj(data = new Date()) {
  const r = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const d = String(data.getDate()).padStart(2, '0');
  return `${r}-${m}-${d}`;
}
