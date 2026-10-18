# Puls Arena · Biologia 5 · Dział I

Gra do nauki i powtórki przed sprawdzianem z biologii (klasa 5, podręcznik „Puls życia 5”, Nowa Era,
edycja zgodna z podstawą programową 2024). Obejmuje dział I „Biologia – nauka o życiu”:

1. Biologia jako nauka (cechy i czynności życiowe organizmów, poziomy budowy, dziedziny biologii)
2. Jak poznawać biologię? (obserwacja i doświadczenie, próba badawcza i kontrolna, metoda naukowa, badacz i źródła wiedzy)
3. Obserwacje mikroskopowe (budowa mikroskopu, preparat, zasady obserwacji, obliczanie powiększenia)

Pomysł, struktura i mechanika są wzorowane na grze „Wyprawa do wnętrza życia” (biologia-gra.netlify.app):
mapa światów odblokowywanych przez bossów, misje z natychmiastowym wyjaśnieniem, boss z paskiem życia
i sercami, próbny sprawdzian, ukryty panel rodzica (przytrzymaj logo 3 s), dźwięki z Web Audio, PWA offline,
ścisła polityka CSP, bez frameworków i bez kroku budowania.

## Uruchomienie

```
node tools/serwer.js 8080      # potem http://localhost:8080/
```

Wystarczy dowolny statyczny serwer dla katalogu `docs/` (np. `python3 -m http.server -d docs`).
Przez `file://` moduły ES nie zadziałają. Wdrożenie: GitHub Pages z katalogu `docs/` (poniżej) albo katalog `docs/` na Netlify (plik `netlify.toml` jest gotowy).

## Testy

```
node --test                    # logika gry, sprawdzanie zadań, generator, router, aktualność sw.js
node tools/validate-data.js    # spójność danych + brak treści spoza podstawy 2024
node tools/wersja.js           # po każdej zmianie w docs/ (wersja + lista plików offline)
python tools/e2e.py            # pełne przejście gry w headless Chrome (playwright), zrzuty w zrzuty/
```

## Treści

Wszystkie polecenia, wyjaśnienia, fiszki i rysunki (mikroskop w SVG) są własne. Typy zadań odpowiadają
typowym sprawdzianom z tego działu (test „Wiesz czy nie wiesz?” z bezpłatnego fragmentu podręcznika,
publicznie dostępne karty pracy i quizy), ale żaden tekst nie jest z nich kopiowany.
Fonty Titan One i Lexend: licencja SIL OFL (pliki w docs/assets/fonts).

## GitHub Pages

Gra jest publikowana przez GitHub Pages bezpośrednio z gałęzi `main`, katalog `/docs`
(https://gtkwsk.github.io/biologia-dzial1/). Wszystkie ścieżki w grze są względne, więc działa pod
adresem `/biologia-dzial1/`. Plik `docs/.nojekyll` wyłącza przetwarzanie przez Jekyll.
Aktualizacja po zmianach:

```
node tools/wersja.js && node --test && node tools/validate-data.js
git commit -am "…" && git push
```

GitHub Pages nie wysyła własnych nagłówków, więc polityka CSP z `netlify.toml` działa tylko na Netlify.
