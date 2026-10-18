// Próbny sprawdzian z działu I (tryb „Sprawdzian”). Układ zadań na wzór testów „Wiesz czy nie wiesz?”
// i typowych sprawdzianów z tego działu (zob. README: źródła typów zadań). Treść zadań jest własna.
// Każde zadanie: punkty (maksimum), pula (warianty; przy każdym podejściu losowany jest jeden),
// misja (gdzie to ćwiczyć: świat i misja). Punktacja: zadania wybor/liczba/kolejnosc 0 albo pełne
// punkty; pozostałe proporcjonalnie do liczby dobrych elementów (w dół).

export default [
  { nr: 1, nazwa: 'Biologia i cechy organizmów', punkty: 1, misja: { swiat: 1, id: 'm1-zycie' }, pula: ['b1-cechy-wybor', 't1-drozdze-wybor', 't1-biologia-wybor'] },
  { nr: 2, nazwa: 'Czynności życiowe: definicje', punkty: 3, misja: { swiat: 1, id: 'm1-czynnosci' }, pula: ['b1-czynnosci-przyp-2', 't1-czynnosci-przyp'] },
  { nr: 3, nazwa: 'Czynności życiowe: przykłady', punkty: 2, misja: { swiat: 1, id: 'm1-czynnosci' }, pula: ['t1-sytuacje-przyp', 'b1-sytuacje-przyp-2'] },
  { nr: 4, nazwa: 'Poziomy budowy organizmu', punkty: 1, misja: { swiat: 1, id: 'm1-wieza' }, pula: ['b1-wieza-nerwowa', 't1-wieza-zwierze', 'b1-wieza-roslina-2', 't1-wieza-roslina'] },
  { nr: 5, nazwa: 'Komórka, tkanka, narząd, organ', punkty: 2, misja: { swiat: 1, id: 'm1-wieza' }, pula: ['t1-poziomy-luki', 'b1-poziomy-luki-2', 't1-poziomy-przyp'] },
  { nr: 6, nazwa: 'Dziedziny biologii', punkty: 1, misja: { swiat: 1, id: 'm1-dziedziny' }, pula: ['t1-naukowiec-1', 't1-naukowiec-2', 't1-naukowiec-3', 'b1-naukowiec-4'] },
  { nr: 7, nazwa: 'Dziedziny biologii: dopasowanie', punkty: 2, misja: { swiat: 1, id: 'm1-dziedziny' }, pula: ['t1-dziedziny-przyp', 'b1-dziedziny-przyp-2'] },
  { nr: 8, nazwa: 'Obserwacja czy doświadczenie', punkty: 2, misja: { swiat: 2, id: 'm2-od' }, pula: ['b2-od-sort-3', 't2-od-sort', 't2-od-sort-2'] },
  { nr: 9, nazwa: 'Próba badawcza i kontrolna', punkty: 1, misja: { swiat: 2, id: 'm2-proby' }, pula: ['t2-proba-1', 't2-proba-2', 'b2-proba-4'] },
  { nr: 10, nazwa: 'Metoda naukowa: prawda/fałsz', punkty: 2, misja: { swiat: 2, id: 'm2-metoda' }, pula: ['t2-metoda-pf', 't2-proby-pf', 'b2-proby-pf-2'] },
  { nr: 11, nazwa: 'Etapy metody naukowej', punkty: 1, misja: { swiat: 2, id: 'm2-metoda' }, pula: ['t2-metoda-kolejnosc'] },
  { nr: 12, nazwa: 'Cechy dobrego badacza i źródła wiedzy', punkty: 2, misja: { swiat: 2, id: 'm2-badacz' }, pula: ['t2-cechy-przyp', 't2-zrodla-luki'] },
  { nr: 13, nazwa: 'Części mikroskopu', punkty: 3, misja: { swiat: 3, id: 'm3-czesci' }, pula: ['t3-schemat', 'b3-schemat-2'] },
  { nr: 14, nazwa: 'Funkcje części mikroskopu', punkty: 2, misja: { swiat: 3, id: 'm3-czesci' }, pula: ['t3-funkcje-przyp', 'b3-funkcje-przyp-2'] },
  { nr: 15, nazwa: 'Preparat mikroskopowy', punkty: 1, misja: { swiat: 3, id: 'm3-preparat' }, pula: ['t3-preparat-kolejnosc', 't3-preparat-luki'] },
  { nr: 16, nazwa: 'Zasady obserwacji mikroskopowej', punkty: 2, misja: { swiat: 3, id: 'm3-ostrosc' }, pula: ['t3-obserwacja-pf', 'b3-obserwacja-pf-2'] },
  { nr: 17, nazwa: 'Obliczanie powiększenia', punkty: 1, misja: { swiat: 3, id: 'm3-powiekszenie' }, pula: ['b3-pow-tekst', 't3-pow-gen-1'] },
];

// Skala ocen jak w wielu szkolnych przedmiotowych zasadach oceniania (procent punktów).
export const SKALA = [
  { od: 100, ocena: 'celujący (6)' },
  { od: 90, ocena: 'bardzo dobry (5)' },
  { od: 75, ocena: 'dobry (4)' },
  { od: 50, ocena: 'dostateczny (3)' },
  { od: 30, ocena: 'dopuszczający (2)' },
  { od: 0, ocena: 'niedostateczny (1)' },
];

export const CZAS_MINUT = 30;
