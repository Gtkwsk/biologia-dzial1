// Rysunek mikroskopu optycznego (SVG rysowane od zera, bez obrazów z podręcznika).
// Punkty kotwiczenia odpowiadają nazwom części w zadaniach typu „schemat”.

import { s } from '../core/dom.js';
import { KOTWICE } from './mikroskop-kotwice.js';

export { KOTWICE };

// punkty: tablica nazw części; numery: tablica numerów (ten sam porządek).
export function rysunekMikroskopu(punkty = [], numery = punkty.map((_, i) => i + 1)) {
  const czesci = [
    s('rect', { x: '70', y: '330', width: '180', height: '26', rx: '10', class: 'mk-metal-ciemny' }),
    s('path', { d: 'M196 332 L216 332 C236 262 236 168 192 102 L172 116 C206 174 206 256 194 332 Z', class: 'mk-metal' }),
    s('rect', { x: '118', y: '58', width: '40', height: '98', rx: '4', class: 'mk-metal-jasny' }),
    s('rect', { x: '124', y: '26', width: '28', height: '36', rx: '4', class: 'mk-okular' }),
    s('rect', { x: '119', y: '21', width: '38', height: '9', rx: '3', class: 'mk-metal-ciemny' }),
    s('path', { d: 'M106 155 L170 155 L162 176 L114 176 Z', class: 'mk-okular' }),
    s('rect', { x: '117', y: '176', width: '11', height: '24', rx: '2', class: 'mk-szklo' }),
    s('rect', { x: '133', y: '176', width: '13', height: '36', rx: '2', class: 'mk-szklo' }),
    s('rect', { x: '151', y: '176', width: '10', height: '18', rx: '2', class: 'mk-szklo' }),
    s('rect', { x: '186', y: '223', width: '22', height: '11', class: 'mk-metal' }),
    s('rect', { x: '76', y: '222', width: '150', height: '12', rx: '3', class: 'mk-stolik' }),
    s('rect', { x: '112', y: '215', width: '54', height: '7', rx: '1', class: 'mk-preparat' }),
    s('rect', { x: '136', y: '276', width: '6', height: '56', class: 'mk-metal' }),
    s('path', { d: 'M121 262 L157 262 L149 280 L129 280 Z', class: 'mk-metal-ciemny' }),
    s('circle', { cx: '139', cy: '259', r: '10', class: 'mk-swiatlo' }),
    s('circle', { cx: '224', cy: '250', r: '17', class: 'mk-sruba' }),
    s('circle', { cx: '224', cy: '250', r: '6', class: 'mk-metal-ciemny' }),
    s('circle', { cx: '226', cy: '296', r: '10', class: 'mk-sruba' }),
  ];
  const znaczniki = punkty.map((nazwa, i) => {
    const k = KOTWICE[nazwa];
    if (!k) return null;
    return s('g', { class: 'mk-znacznik', 'data-punkt': String(i) }, [
      s('line', { x1: String(k.lx), y1: String(k.ly), x2: String(k.x), y2: String(k.y), class: 'mk-linia' }),
      s('circle', { cx: String(k.x), cy: String(k.y), r: '3.5', class: 'mk-kropka' }),
      s('circle', { cx: String(k.lx), cy: String(k.ly), r: '13', class: 'mk-numer' }),
      s('text', { x: String(k.lx), y: String(k.ly + 5), 'text-anchor': 'middle', class: 'mk-numer-tekst', tekst: String(numery[i]) }),
    ]);
  });
  return s('svg', { class: 'mikroskop-svg', viewBox: '0 0 320 370', role: 'img', 'aria-label': 'Schemat mikroskopu optycznego z ponumerowanymi częściami' }, [
    s('title', { tekst: 'Mikroskop optyczny' }),
    ...czesci,
    ...znaczniki,
  ]);
}
