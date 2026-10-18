// Mechanika gry: punkty doświadczenia (XP), poziomy i rangi, combo, gwiazdki, seria dni,
// odblokowania i odznaki. Funkcje czyste albo zmieniające tylko przekazany stan (testy: tests/gra.test.js).
//
// Zasady „bez kary”: błąd zeruje combo, ale nigdy nie zabiera zdobytych XP; seria dni
// po przerwie liczy się od nowa, a zdobyte odznaki zostają na zawsze.

export const PROGI = [0, 150, 400, 750, 1200, 1800, 2500, 3300, 4200, 5200, 6500];
export const RANGI = [
  'Obserwator',
  'Młodszy badacz',
  'Badacz terenowy',
  'Laborant',
  'Hipotezator',
  'Mikroskopista',
  'Starszy badacz',
  'Doktor biologii',
  'Profesor',
  'Mistrz Życia',
  'Legenda Biologii',
];

export const XP = {
  zadanie: 15, // dobra odpowiedź w misji, u bossa i w sprawdzianie (przed mnożnikiem combo)
  misja: 20, // ukończenie misji + 10 za każdą gwiazdkę
  gwiazdka: 10,
  boss: 100,
  hardcore: 150,
  arena: 3, // za każdy punkt w Arenie
  fiszka: 2,
  powiekszenie: 5,
  otwarte: 5,
};

export function poziom(xp) {
  let p = 0;
  while (p + 1 < PROGI.length && xp >= PROGI[p + 1]) p++;
  const od = PROGI[p];
  const doPoziomu = PROGI[p + 1] ?? null;
  return {
    poziom: p + 1,
    ranga: RANGI[p],
    od,
    do: doPoziomu,
    postep: doPoziomu === null ? 1 : (xp - od) / (doPoziomu - od),
    max: doPoziomu === null,
  };
}

export function mnoznikCombo(combo) {
  if (combo >= 8) return 3;
  if (combo >= 5) return 2;
  if (combo >= 3) return 1.5;
  return 1;
}

export function dodajXp(stan, ile) {
  const przed = poziom(stan.xp).poziom;
  stan.xp += Math.max(0, Math.round(ile));
  const po = poziom(stan.xp);
  return { awans: po.poziom > przed, ...po };
}

// Zapisuje odpowiedź na całe zadanie. Zwraca, ile XP przyznano i co się zmieniło w combo.
export function zapiszOdpowiedz(stan, { dobrze, umiejetnosc, bazaXp = XP.zadanie }) {
  const u = (stan.umiejetnosci[umiejetnosc] ??= { dobre: 0, zle: 0 });
  const mnoznikPrzed = mnoznikCombo(stan.combo);
  if (dobrze) {
    stan.combo += 1;
    stan.maxCombo = Math.max(stan.maxCombo, stan.combo);
    stan.statystyki.dobre += 1;
    u.dobre += 1;
    const mnoznik = mnoznikCombo(stan.combo);
    const wynik = dodajXp(stan, bazaXp * mnoznik);
    return { xp: Math.round(bazaXp * mnoznik), combo: stan.combo, mnoznik, wzrostMnoznika: mnoznik > mnoznikPrzed, ...wynik };
  }
  const stracone = stan.combo;
  stan.combo = 0;
  stan.statystyki.zle += 1;
  u.zle += 1;
  return { xp: 0, combo: 0, mnoznik: 1, wzrostMnoznika: false, straconeCombo: stracone, awans: false, ...poziom(stan.xp) };
}

export function gwiazdki(bledneZadania) {
  if (bledneZadania <= 0) return 3;
  if (bledneZadania === 1) return 2;
  return 1;
}

// Liczba kolejnych dni nauki, kończąca się dziś albo wczoraj.
export function seriaDni(dni, dzis) {
  const zbior = new Set(dni);
  const krok = (d, o) => {
    const t = new Date(`${d}T12:00:00`);
    t.setDate(t.getDate() + o);
    return t.toISOString().slice(0, 10);
  };
  let d = zbior.has(dzis) ? dzis : krok(dzis, -1);
  let n = 0;
  while (zbior.has(d)) {
    n++;
    d = krok(d, -1);
  }
  return n;
}

export function zapiszDzien(stan, dzis) {
  if (!stan.dni.includes(dzis)) stan.dni.push(dzis);
  stan.dni = stan.dni.slice(-120);
}

export function swiatOdblokowany(stan, nr) {
  return nr === 1 || stan.ustawienia.odblokujWszystko || stan.bossy[nr - 1]?.pokonany === true;
}

export function misjeUkonczone(stan, swiat) {
  return swiat.misje.filter((m) => stan.misje[m.id]?.ukonczono).length;
}

export function bossOdblokowany(stan, swiat) {
  return stan.ustawienia.odblokujWszystko || misjeUkonczone(stan, swiat) === swiat.misje.length;
}

export function zapiszMisje(stan, id, liczbaBlednych) {
  const g = gwiazdki(liczbaBlednych);
  const byla = stan.misje[id];
  stan.misje[id] = { ukonczono: true, gwiazdki: Math.max(g, byla?.gwiazdki ?? 0) };
  const xp = byla ? Math.round((XP.gwiazdka * g) / 2) : XP.misja + XP.gwiazdka * g;
  return { gwiazdki: g, xp, pierwszyRaz: !byla, ...dodajXp(stan, xp) };
}

export function zapiszBossa(stan, nr, { wygrana, hardcore = false }) {
  const b = (stan.bossy[nr] ??= { pokonany: false, hardcore: false, proby: 0 });
  b.proby += 1;
  if (!wygrana) return { xp: 0, awans: false, ...poziom(stan.xp) };
  const pierwszy = hardcore ? !b.hardcore : !b.pokonany;
  if (hardcore) b.hardcore = true;
  b.pokonany = true;
  const xp = pierwszy ? (hardcore ? XP.hardcore : XP.boss) : 25;
  return { xp, pierwszy, ...dodajXp(stan, xp) };
}

export function ocenaSzkolna(proc, skala) {
  return skala.find((s) => proc >= s.od)?.ocena ?? skala[skala.length - 1].ocena;
}

// Warunki odznak. Zwraca identyfikatory nowo zdobytych odznak (i zapisuje je w stanie).
export function sprawdzOdznaki(stan, swiaty, odznaki, dzis) {
  const wszystkieMisje = swiaty.flatMap((s) => s.misje);
  const warunki = {
    'pierwszy-krok': () => Object.values(stan.misje).some((m) => m.ukonczono),
    'bez-bledu': () => Object.values(stan.misje).some((m) => m.gwiazdki === 3),
    'combo-5': () => stan.maxCombo >= 5,
    'combo-10': () => stan.maxCombo >= 10,
    'boss-1': () => stan.bossy[1]?.pokonany,
    'boss-2': () => stan.bossy[2]?.pokonany,
    'boss-3': () => stan.bossy[3]?.pokonany,
    hardcore: () => Object.values(stan.bossy).some((b) => b.hardcore),
    'wszystkie-misje': () => wszystkieMisje.every((m) => stan.misje[m.id]?.ukonczono),
    'arena-20': () => stan.arenaRekord >= 20,
    kalkulator: () => stan.powiekszenia.najlepsza >= 10,
    fiszki: () => Object.values(stan.fiszki).filter((p) => p >= 3).length >= 15,
    'sprawdzian-db': () => stan.sprawdziany.some((s) => s.proc >= 75),
    'sprawdzian-max': () => stan.sprawdziany.some((s) => s.proc >= 100),
    'seria-3': () => stan.dni.length >= 3,
  };
  const nowe = [];
  for (const o of odznaki) {
    if (stan.odznaki[o.id]) continue;
    if (warunki[o.id]?.()) {
      stan.odznaki[o.id] = dzis;
      nowe.push(o.id);
    }
  }
  return nowe;
}

// Mocne i słabe strony: procent dobrych odpowiedzi w każdej umiejętności.
export function raportUmiejetnosci(stan) {
  return Object.entries(stan.umiejetnosci)
    .map(([klucz, { dobre, zle }]) => ({ klucz, dobre, zle, proc: dobre + zle ? Math.round((100 * dobre) / (dobre + zle)) : null }))
    .sort((a, b) => (a.proc ?? 101) - (b.proc ?? 101));
}

export const NAZWY_UMIEJETNOSCI = {
  biologia: 'Czym zajmuje się biologia',
  cechy: 'Cechy organizmów',
  czynnosci: 'Czynności życiowe',
  poziomy: 'Poziomy budowy organizmu',
  dziedziny: 'Dziedziny biologii',
  obserwacja: 'Obserwacja i doświadczenie',
  proby: 'Próba badawcza i kontrolna',
  metoda: 'Metoda naukowa',
  badacz: 'Cechy badacza i źródła wiedzy',
  mikroskop: 'Budowa mikroskopu',
  preparat: 'Preparat mikroskopowy',
  'obserwacja-mikro': 'Obserwacja pod mikroskopem',
  powiekszenie: 'Obliczanie powiększenia',
};
