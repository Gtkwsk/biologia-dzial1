// Rejestracja service workera i komunikat o nowej wersji gry.

import { h } from './core/dom.js';

function banerAktualizacji(odswiez) {
  if (document.querySelector('.baner-aktualizacji')) return;
  document.body.append(
    h('div', { class: 'baner-aktualizacji', role: 'status' }, [
      h('span', {}, 'Jest nowa wersja aplikacji.'),
      h('button', { type: 'button', class: 'przycisk przycisk--maly', onclick: odswiez }, 'Odśwież'),
    ]),
  );
}

export function zarejestrujServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const lokalnie = ['localhost', '127.0.0.1'].includes(location.hostname);
  if (location.protocol !== 'https:' && !lokalnie) return;

  let czekaNaOdswiezenie = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (czekaNaOdswiezenie) location.reload();
  });

  navigator.serviceWorker
    .register('sw.js')
    .then((rejestracja) => {
      const pokaz = () =>
        banerAktualizacji(() => {
          if (!rejestracja.waiting) return location.reload();
          czekaNaOdswiezenie = true;
          rejestracja.waiting.postMessage('aktualizuj');
        });
      if (rejestracja.waiting && navigator.serviceWorker.controller) pokaz();
      rejestracja.addEventListener('updatefound', () => {
        const nowy = rejestracja.installing;
        nowy?.addEventListener('statechange', () => {
          if (nowy.state === 'installed' && navigator.serviceWorker.controller) pokaz();
        });
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') rejestracja.update().catch(() => {});
      });
    })
    .catch(() => {});
}
