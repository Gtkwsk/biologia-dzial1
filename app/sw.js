// Service worker: praca offline po pierwszym uruchomieniu.
// WERSJA i PLIKI uzupełnia narzędzie: node tools/wersja.js (nie edytować ręcznie).
// Każda zmiana w app/ zmienia WERSJA, więc przeglądarka pobiera nową wersję gry.

const WERSJA = '05330542690a';
const PLIKI = [
  './',
  'assets/fonts/OFL-lexend.txt',
  'assets/fonts/OFL-titan-one.txt',
  'assets/fonts/lexend-latin-ext-wght-normal.woff2',
  'assets/fonts/lexend-latin-wght-normal.woff2',
  'assets/fonts/titan-one-latin-400-normal.woff2',
  'assets/fonts/titan-one-latin-ext-400-normal.woff2',
  'assets/ikony/apple-touch-icon.png',
  'assets/ikony/ikona-192.png',
  'assets/ikony/ikona-512.png',
  'assets/ikony/ikona.svg',
  'css/baza.css',
  'css/efekty.css',
  'css/ekrany.css',
  'css/tokeny.css',
  'css/zadania.css',
  'data/arena.js',
  'data/fiszki.js',
  'data/odznaki.js',
  'data/otwarte.js',
  'data/sciaga.js',
  'data/sprawdzian.js',
  'data/swiaty.js',
  'data/zadania.js',
  'index.html',
  'js/components/mikroskop-kotwice.js',
  'js/components/mikroskop.js',
  'js/components/zadanie.js',
  'js/core/dom.js',
  'js/core/dzwieki.js',
  'js/core/efekty.js',
  'js/core/generator.js',
  'js/core/gra.js',
  'js/core/losuj.js',
  'js/core/magazyn.js',
  'js/core/router.js',
  'js/core/stan.js',
  'js/core/zadania-logika.js',
  'js/ekrany/arena.js',
  'js/ekrany/boss.js',
  'js/ekrany/mapa.js',
  'js/ekrany/misja.js',
  'js/ekrany/powtorka.js',
  'js/ekrany/profil.js',
  'js/ekrany/sprawdzian.js',
  'js/ekrany/swiat.js',
  'js/ekrany/wspolne.js',
  'js/kontekst.js',
  'js/main.js',
  'js/pwa.js',
  'js/wersja.js',
  'manifest.webmanifest',
];

const PAMIEC = `puls-arena-${WERSJA}`;

self.addEventListener('install', (zdarzenie) => {
  zdarzenie.waitUntil(caches.open(PAMIEC).then((pamiec) => pamiec.addAll(PLIKI)));
});

self.addEventListener('activate', (zdarzenie) => {
  zdarzenie.waitUntil(
    caches
      .keys()
      .then((klucze) => Promise.all(klucze.filter((k) => k.startsWith('puls-arena-') && k !== PAMIEC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Nowa wersja czeka, aż gracz stuknie „Odśwież” (komunikat z gry).
self.addEventListener('message', (zdarzenie) => {
  if (zdarzenie.data === 'aktualizuj') self.skipWaiting();
});

self.addEventListener('fetch', (zdarzenie) => {
  const zadanie = zdarzenie.request;
  if (zadanie.method !== 'GET') return;
  const adres = new URL(zadanie.url);
  if (adres.origin !== self.location.origin) return;


  zdarzenie.respondWith(
    (async () => {
      const pamiec = await caches.open(PAMIEC);
      if (zadanie.mode === 'navigate') return (await pamiec.match('index.html')) || fetch(zadanie);
      return (await pamiec.match(zadanie, { ignoreSearch: true })) || fetch(zadanie);
    })(),
  );
});
