// Trzy światy = trzy tematy działu I „Biologia – nauka o życiu” (klasa 5, podstawa programowa 2024).
// Każdy świat: misje (lista id zadań z data/zadania.js) i boss (pule wariantów, z każdej losowany jeden).
// Kolejny świat otwiera pokonanie bossa poprzedniego (panel rodzica może odblokować wszystkie).

export default [
  {
    id: 1,
    tytul: 'Planeta Organizmów',
    temat: 'Biologia jako nauka',
    strony: 'podręcznik: temat 1',
    ikona: '🧬',
    wstep: [
      'Witaj na Planecie Organizmów. Tu wszystko, co żyje, ma dwie wspólne cechy.',
      'Rozpoznasz siedem czynności życiowych, zbudujesz wieżę poziomów budowy organizmu i obsadzisz Biuro Dziedzin Biologii.',
    ],
    coZbadasz: [
      'czym zajmuje się biologia',
      'jakie cechy mają wszystkie organizmy',
      'siedem czynności życiowych',
      'poziomy budowy organizmu: od komórki do organizmu',
      'dziedziny biologii: zoologia, botanika, mikrobiologia, anatomia, fizjologia, ekologia',
    ],
    misje: [
      { id: 'm1-zycie', nazwa: 'Żywe czy nieożywione?', opis: 'Cechy wszystkich organizmów i zakres badań biologii.', zadania: ['t1-biologia-wybor', 't1-zywe-sort', 't1-cechy-pf', 't1-drozdze-wybor'] },
      { id: 'm1-czynnosci', nazwa: 'Siedem czynności życiowych', opis: 'Każda czynność życiowa ma swoją definicję i przykład.', zadania: ['t1-czynnosci-przyp', 't1-sytuacje-przyp', 't1-czynnosci-luki', 't1-czynnosci-pf'] },
      { id: 'm1-wieza', nazwa: 'Wieża budowy organizmu', opis: 'Komórka, tkanka, narząd (organ), układ (system), organizm.', zadania: ['t1-wieza-zwierze', 't1-wieza-roslina', 't1-poziomy-przyp', 't1-poziomy-luki', 't1-organ-wybor'] },
      { id: 'm1-dziedziny', nazwa: 'Biuro Dziedzin Biologii', opis: 'Kto czym się zajmuje? Dopasuj naukowców do dziedzin.', zadania: ['t1-dziedziny-przyp', 't1-naukowiec-1', 't1-naukowiec-2', 't1-obiekty-sort', 't1-naukowiec-3'] },
    ],
    boss: {
      imie: 'Strażnik Życia',
      opis: 'Pilnuje bramy do Laboratorium Hipotez. Pokonasz go tylko, jeśli znasz cechy organizmów, czynności życiowe, poziomy budowy i dziedziny biologii.',
      ikona: '🛡️',
      pule: [
        ['t1-cechy-pf', 'b1-cechy-wybor', 'b1-cechy-pf-2'],
        ['t1-czynnosci-przyp', 'b1-czynnosci-przyp-2', 'b1-sytuacje-przyp-2'],
        ['t1-wieza-zwierze', 'b1-wieza-nerwowa', 'b1-wieza-roslina-2'],
        ['t1-dziedziny-przyp', 'b1-dziedziny-przyp-2', 'b1-naukowiec-4'],
        ['t1-czynnosci-luki', 'b1-poziomy-luki-2', 'b1-czynnosci-pf-2'],
      ],
    },
  },
  {
    id: 2,
    tytul: 'Laboratorium Hipotez',
    temat: 'Jak poznawać biologię?',
    strony: 'podręcznik: temat 2',
    ikona: '🧪',
    wstep: [
      'W Laboratorium Hipotez nie zgaduje się na ślepo. Tu działa metoda naukowa.',
      'Odróżnisz obserwację od doświadczenia, rozpoznasz próbę badawczą i kontrolną i ułożysz etapy badania w dobrej kolejności.',
    ],
    coZbadasz: [
      'czym różni się obserwacja od doświadczenia',
      'próba badawcza i próba kontrolna',
      'etapy metody naukowej: od obserwacji do wniosku',
      'problem badawczy, hipoteza, wyniki, wniosek',
      'źródła wiedzy biologicznej i cechy dobrego badacza',
    ],
    misje: [
      { id: 'm2-od', nazwa: 'Obserwacja czy doświadczenie?', opis: 'Patrzysz czy zmieniasz jeden czynnik?', zadania: ['t2-od-sort', 't2-od-pf', 't2-obserwacja-wybor', 't2-od-sort-2'] },
      { id: 'm2-proby', nazwa: 'Dwie próby', opis: 'Próba badawcza i próba kontrolna różnią się tylko jednym czynnikiem.', zadania: ['t2-proba-1', 't2-proba-2', 't2-proby-pf', 't2-blad-doswiadczenia', 't2-proba-3'] },
      { id: 'm2-metoda', nazwa: 'Metoda naukowa', opis: 'Sześć etapów badania we właściwej kolejności.', zadania: ['t2-metoda-kolejnosc', 't2-pojecia-przyp', 't2-etapy-przyklad', 't2-metoda-pf', 't2-hipoteza-wybor'] },
      { id: 'm2-badacz', nazwa: 'Dobry badacz', opis: 'Skąd brać wiedzę i jakie cechy ma prawdziwy naukowiec.', zadania: ['t2-cechy-przyp', 't2-zrodla-wybor', 't2-cecha-nie-wybor', 't2-zrodla-luki'] },
    ],
    boss: {
      imie: 'Profesor Chaos',
      opis: 'Zmienia w doświadczeniach wszystko naraz i myli hipotezę z wnioskiem. Udowodnij, że metoda naukowa jest silniejsza.',
      ikona: '🌀',
      pule: [
        ['t2-od-sort', 't2-od-sort-2', 'b2-od-sort-3'],
        ['t2-proba-1', 't2-proba-2', 't2-proba-3', 'b2-proba-4'],
        ['t2-metoda-kolejnosc', 'b2-metoda-luki', 'b2-etapy-przyklad-2'],
        ['t2-pojecia-przyp', 'b2-proby-pf-2', 't2-metoda-pf'],
        ['t2-blad-doswiadczenia', 'b2-blad-2', 't2-cechy-przyp'],
      ],
    },
  },
  {
    id: 3,
    tytul: 'Mikroświat',
    temat: 'Obserwacje mikroskopowe',
    strony: 'podręcznik: temat 3',
    ikona: '🔬',
    wstep: [
      'Mikroświat jest wszędzie: w kropli wody z kałuży i w skórce cebuli. Żeby go zobaczyć, trzeba opanować mikroskop.',
      'Podpiszesz części mikroskopu, przygotujesz preparat, ustawisz ostrość i policzysz powiększenie.',
    ],
    coZbadasz: [
      'części mikroskopu optycznego i ich funkcje',
      'jak przygotować preparat ze skórki liścia cebuli',
      'jak krok po kroku obserwować obiekt pod mikroskopem',
      'jak obliczyć powiększenie obrazu',
      'do czego służą lupa, lornetka, mikroskop optyczny i elektronowy',
    ],
    misje: [
      { id: 'm3-czesci', nazwa: 'Części mikroskopu', opis: 'Podpisz schemat i dopasuj funkcje.', zadania: ['t3-schemat', 't3-funkcje-przyp', 't3-czesci-sort', 't3-funkcje-wybor'] },
      { id: 'm3-preparat', nazwa: 'Robimy preparat', opis: 'Skórka liścia cebuli w kropli wody.', zadania: ['t3-preparat-kolejnosc', 't3-narzedzia-przyp', 't3-preparat-pf', 't3-preparat-luki'] },
      { id: 'm3-ostrosc', nazwa: 'Ustaw ostrość', opis: 'Od najmniejszego powiększenia do największego.', zadania: ['t3-obserwacja-kolejnosc', 't3-start-wybor', 't3-obserwacja-pf', 't3-sruby-wybor'] },
      { id: 'm3-powiekszenie', nazwa: 'Kalkulator powiększeń', opis: 'Okular razy obiektyw. Policz szybko i bez błędu.', zadania: ['t3-pow-gen-1', 't3-pow-gen-2', 't3-pow-odwrotne', 't3-przyrzady-przyp', 't3-pow-wybor'] },
    ],
    boss: {
      imie: 'Kapitan Rozmazany',
      opis: 'Rozmazuje każdy obraz i zbija szkiełka nakrywkowe. Ustaw ostrość i pokaż, kto rządzi mikroskopem.',
      ikona: '👾',
      pule: [
        ['t3-schemat', 'b3-schemat-2'],
        ['t3-funkcje-przyp', 'b3-funkcje-przyp-2', 't3-funkcje-wybor'],
        ['t3-preparat-kolejnosc', 't3-preparat-luki', 'b3-preparat-pf-2'],
        ['t3-obserwacja-kolejnosc', 'b3-obserwacja-pf-2', 't3-sruby-wybor'],
        ['t3-pow-gen-1', 't3-pow-gen-2', 't3-pow-odwrotne', 'b3-pow-tekst'],
      ],
    },
  },
];
