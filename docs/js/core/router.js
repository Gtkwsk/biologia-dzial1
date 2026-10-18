// Adresy ekranów po znaku # (działa offline i bez reguł na serwerze). Wzorzec z gry
// „Wyprawa do wnętrza życia”.
//
// #/                         mapa (baza)
// #/swiat/2                  świat: wstęp i misje
// #/swiat/2/misja/<id>       misja
// #/swiat/2/boss             boss świata
// #/arena                    arena błyskawiczna (90 s)
// #/sprawdzian               próbny sprawdzian
// #/powtorka                 centrum powtórek
// #/fiszki  #/otwarte  #/powiekszenia  #/sciaga
// #/profil                   profil gracza: poziom, odznaki, statystyki
// #/rodzic                   panel rodzica

export const PROSTE = ['arena', 'sprawdzian', 'powtorka', 'fiszki', 'otwarte', 'powiekszenia', 'sciaga', 'profil', 'rodzic'];

export function parsujAdres(hash = '') {
  let czesci;
  try {
    czesci = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map((c) => decodeURIComponent(c));
  } catch {
    return { ekran: 'nieznany' };
  }
  const [a, b, c, d] = czesci;
  if (!a || (a === 'mapa' && czesci.length === 1)) return { ekran: 'mapa' };
  if (a === 'swiat' && /^[1-3]$/.test(b ?? '')) {
    if (czesci.length === 2) return { ekran: 'swiat', swiat: Number(b) };
    if (c === 'misja' && d && czesci.length === 4) return { ekran: 'misja', swiat: Number(b), misja: d };
    if (c === 'boss' && czesci.length === 3) return { ekran: 'boss', swiat: Number(b) };
    if (c === 'boss' && d === 'hardcore' && czesci.length === 4) return { ekran: 'boss', swiat: Number(b), hardcore: true };
  }
  if (czesci.length === 1 && PROSTE.includes(a)) return { ekran: a };
  return { ekran: 'nieznany' };
}

export function adres(cel) {
  switch (cel.ekran) {
    case 'mapa':
      return '#/';
    case 'swiat':
      return `#/swiat/${cel.swiat}`;
    case 'misja':
      return `#/swiat/${cel.swiat}/misja/${encodeURIComponent(cel.misja)}`;
    case 'boss':
      return `#/swiat/${cel.swiat}/boss${cel.hardcore ? '/hardcore' : ''}`;
    default:
      return `#/${cel.ekran}`;
  }
}
