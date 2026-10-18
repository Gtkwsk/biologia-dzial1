// Losowanie. Generator z ziarnem (mulberry32) pozwala testować losowe układy powtarzalnie.

export function rng(ziarno = Date.now() >>> 0) {
  let a = ziarno >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function wybierz(tablica, los = Math.random) {
  return tablica[Math.floor(los() * tablica.length)];
}

export function tasuj(tablica, los = Math.random) {
  const t = tablica.slice();
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(los() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}

// Tasuje tak, żeby wynik różnił się od kolejności wejściowej (gdy to możliwe).
export function tasujInaczej(tablica, los = Math.random) {
  if (tablica.length < 2) return tablica.slice();
  for (let proba = 0; proba < 20; proba++) {
    const t = tasuj(tablica, los);
    if (t.some((x, i) => x !== tablica[i])) return t;
  }
  return tablica.slice().reverse();
}
