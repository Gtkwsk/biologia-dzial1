# Test całej gry w przeglądarce (headless Chrome): przejście wszystkich misji, bossów,
# sprawdzianu i trybów powtórki, z kontrolą błędów konsoli i CSP. Zrzuty ekranu w zrzuty/.
#   node tools/serwer.js 8080 &   python tools/e2e.py
import json, os, pathlib, re, sys
from playwright.sync_api import sync_playwright

URL = os.environ.get('E2E_URL', 'http://localhost:8080/')
NOTA = 'Niezależna pomoc do nauki zgodna z podstawą programową biologii dla klasy 5 (2024). Nie jest produktem ani materiałem wydawnictwa.'
ZRZUTY = pathlib.Path(__file__).resolve().parent.parent / 'zrzuty'
ZRZUTY.mkdir(exist_ok=True)
bledy = []

def zamknij_okno(page):
    page.wait_for_timeout(50)
    while page.locator('.okno--awans').count():
        page.locator('.okno--awans button').click()

def dalej(page):
    zamknij_okno(page)
    page.locator('.wyjasnienie__przyciski .przycisk').click()

def rozwiaz(page, Z, zle=False):
    zamknij_okno(page)
    sek = page.locator('section.zadanie').last
    zid = sek.get_attribute('data-zadanie')
    z = Z[zid]
    t = z['typ']
    if t == 'wybor':
        idx = z['poprawna'] if not zle else (z['poprawna'] + 1) % len(z['opcje'])
        sek.locator(f'button[data-opcja="{idx}"]').click()
    elif t == 'pf':
        for i, wiersz in enumerate(sek.locator('.pf__wiersz').all()):
            p = z['zdania'][i]['p'] != (zle and i == 0)
            wiersz.locator('.pf__przycisk--p' if p else '.pf__przycisk--f').click()
    elif t == 'przyp':
        for n, w in enumerate(sek.locator('.przyp__wiersz').all()):
            l = w.locator('.przyp__lewa').inner_text()
            para = next(p for p in z['pary'] if p['l'] == l)
            odp = para['p']
            if zle and n == 0:
                odp = next(p['p'] for p in z['pary'] if p['p'] != para['p'])
            w.locator('select').select_option(odp)
    elif t == 'kolejnosc':
        el = z['elementy'][::-1] if zle else z['elementy']
        for e in el:
            sek.locator('.kol__pula .kol__element', has_text=e).filter(has_text=re.compile('^' + re.escape(e) + '$')).first.click()
    elif t == 'luki':
        for i, o in enumerate(z['odp']):
            sek.locator(f'select[aria-label="luka {i+1}"]').select_option(o if not (zle and i == 0) else z['bank'][0] if z.get('bank') else z['odp'][-1])
    elif t == 'sort':
        for n, w in enumerate(sek.locator('.sort__wiersz').all()):
            tx = w.locator('.sort__element').inner_text()
            e = next(e for e in z['elementy'] if e['t'] == tx)
            k = e['k'] if not (zle and n == 0) else (e['k'] + 1) % len(z['kategorie'])
            w.locator(f'button[data-kat="{k}"]').click()
    elif t == 'liczba':
        tresc = sek.locator('.zadanie__tresc').inner_text()
        m = re.search(r'Okular powiększa (\d+) razy, a obiektyw (\d+) razy', tresc)
        m2 = re.search(r'Obraz jest powiększony (\d+) razy, a okular powiększa (\d+) razy', tresc)
        if m2: odp = int(m2.group(1)) // int(m2.group(2))
        elif m: odp = int(m.group(1)) * int(m.group(2))
        else: odp = z['odp']
        if zle and m: odp = int(m.group(1)) + int(m.group(2))
        sek.locator('.liczba__pole').fill(str(odp))
        sek.locator('.liczba__pole').dispatch_event('input')
    elif t == 'schemat':
        for g in sek.locator('g.mk-znacznik').all():
            i = int(g.get_attribute('data-punkt'))
            nr = g.locator('text').text_content()
            sek.locator(f'select[aria-label="część numer {nr}"]').select_option(z['punkty'][i])
    przycisk = sek.locator('.przycisk--sprawdz')
    assert przycisk.is_enabled(), f'{zid}: przycisk nieaktywny'
    przycisk.click()
    return zid

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    ctx = b.new_context(viewport={'width': 1280, 'height': 860}, device_scale_factor=1)
    page = ctx.new_page()
    page.on('console', lambda m: m.type in ('error', 'warning') and bledy.append(f'console.{m.type}: {m.text}'))
    page.on('pageerror', lambda e: bledy.append(f'pageerror: {e}'))
    page.goto(URL)
    # pierwsze uruchomienie: ekran z pytaniem o imię
    page.wait_for_selector('.imie-ekran')
    assert page.locator('.imie-ekran .przycisk--glowny').is_disabled()
    page.locator('.imie__pole').fill('   ')
    assert page.locator('.imie-ekran .przycisk--glowny').is_disabled(), 'same spacje nie przechodzą'
    page.locator('.imie__pole').fill('Ola')
    page.wait_for_timeout(500)
    page.screenshot(path=str(ZRZUTY / '00-imie.png'))
    page.locator('.imie__pole').press('Enter')
    page.wait_for_selector('.swiat-karta')
    assert 'Cześć, Ola!' in page.locator('h1').inner_text()
    assert 'Ola' in page.locator('.hud__ranga').inner_text()
    page.reload(); page.wait_for_selector('.swiat-karta')
    assert page.locator('.imie-ekran').count() == 0, 'imię zapamiętane'
    Z = {z['id']: z for z in page.evaluate("import('./data/zadania.js').then(m => m.default)")}
    SW = page.evaluate("import('./data/swiaty.js').then(m => m.default)")
    page.wait_for_timeout(600)
    page.screenshot(path=str(ZRZUTY / '01-baza.png'), full_page=True)
    assert page.locator('.stopka, .nota-niezaleznosci').count() == 0, 'brak stopek na mapie'
    assert NOTA not in page.locator('body').inner_text() and 'Zadania obejmują dział I' not in page.locator('body').inner_text(), 'brak tekstów stopek'
    assert not re.search(r'Nowa Era|Puls życia', page.locator('body').inner_text()), 'brak nazwy wydawnictwa/podręcznika'

    # świat 2 zablokowany na starcie
    assert page.locator('.swiat-karta--2.swiat-karta--zablokowana').count() == 1

    pierwszy = True
    for s in SW:
        for m in s['misje']:
            page.goto(f"{URL}#/swiat/{s['id']}/misja/{m['id']}")
            for n in range(len(m['zadania'])):
                page.wait_for_selector('section.zadanie .przycisk--sprawdz')
                zle = pierwszy and n == 1
                rozwiaz(page, Z, zle=zle)
                page.wait_for_selector('.wyjasnienie')
                if zle:
                    page.wait_for_timeout(400)
                    page.screenshot(path=str(ZRZUTY / '03-blad-z-wyjasnieniem.png'), full_page=True)
                if s['id'] == 3 and m['id'] == 'm3-czesci' and n == 0:
                    page.wait_for_timeout(300)
                    page.screenshot(path=str(ZRZUTY / '04-schemat-mikroskopu.png'), full_page=True)
                dalej(page)
            page.wait_for_selector('.podsumowanie')
            if pierwszy:
                page.wait_for_timeout(900)
                page.screenshot(path=str(ZRZUTY / '05-koniec-misji.png'))
                # zamknij ewentualne okno awansu
            zamknij_okno(page)
            pierwszy = False
        # boss
        page.goto(f"{URL}#/swiat/{s['id']}/boss")
        page.locator('.boss-intro button').click()
        bylo = 0
        while page.locator('.podsumowanie').count() == 0:
            page.wait_for_selector('section.zadanie .przycisk--sprawdz')
            rozwiaz(page, Z, zle=(s['id'] == 1 and bylo == 0))
            page.wait_for_selector('.wyjasnienie')
            if bylo == 1 and s['id'] == 1:
                page.screenshot(path=str(ZRZUTY / '06-boss.png'))
            dalej(page)
            bylo += 1
            assert bylo < 15
        assert page.locator('.podsumowanie[data-wygrana="true"]').count() == 1, f'boss {s["id"]} niepokonany'
        page.wait_for_timeout(500)
        if s['id'] == 1:
            page.screenshot(path=str(ZRZUTY / '07-boss-pokonany.png'))
        zamknij_okno(page)

    # hardcore (świat 3) – na czas, 1 serce
    page.goto(f"{URL}#/swiat/3/boss/hardcore")
    page.locator('.boss-intro button').click()
    page.wait_for_selector('.boss-czas:not([hidden])')
    while page.locator('.podsumowanie').count() == 0:
        page.wait_for_selector('section.zadanie .przycisk--sprawdz')
        rozwiaz(page, Z)
        page.wait_for_selector('.wyjasnienie')
        dalej(page)
    assert page.locator('.podsumowanie[data-wygrana="true"]').count() == 1
    zamknij_okno(page)

    # sprawdzian na 100%
    page.goto(f"{URL}#/sprawdzian")
    page.locator('.spr-intro .przelacznik').click()
    page.locator('.spr-intro .przycisk--glowny').click()
    page.wait_for_selector('.spr__czas:not([hidden])')
    k = 0
    while page.locator('.spr-wynik').count() == 0:
        page.wait_for_selector('section.zadanie .przycisk--sprawdz')
        if k == 2:
            page.screenshot(path=str(ZRZUTY / '08-sprawdzian-w-trakcie.png'))
        rozwiaz(page, Z, zle=(k == 4))
        k += 1
        assert k < 30
    page.wait_for_timeout(900)
    tekst = page.locator('.spr-wynik__punkty').inner_text()
    print('sprawdzian:', tekst, page.locator('.spr-wynik__ocena').inner_text())
    page.locator('.spr-lista details').first.evaluate('d => d.open = true')
    page.screenshot(path=str(ZRZUTY / '09-wynik-sprawdzianu.png'), full_page=True)
    zamknij_okno(page)

    # arena (kilka odpowiedzi)
    page.goto(f"{URL}#/arena")
    page.locator('.boss-intro button').click()
    for _ in range(9):
        page.locator('.arena__przycisk').first.click()
        page.wait_for_timeout(80)
    page.screenshot(path=str(ZRZUTY / '10-arena.png'))

    # powtórka
    page.goto(f"{URL}#/powtorka"); page.wait_for_selector('.kafel')
    page.goto(f"{URL}#/fiszki"); page.locator('.fiszka').click(); page.wait_for_timeout(600)
    page.screenshot(path=str(ZRZUTY / '11-fiszki.png'))
    page.locator('.przycisk--dobrze').click()
    page.goto(f"{URL}#/otwarte"); page.locator('.otwarte__pole').fill('budowa komórkowa i czynności życiowe')
    page.locator('.otwarte .przycisk--glowny').click(); page.locator('.otwarte__check').first.check()
    page.screenshot(path=str(ZRZUTY / '12-pytania-otwarte.png'), full_page=True)
    page.locator('.otwarte__klucz .przycisk--glowny').click()
    page.goto(f"{URL}#/powiekszenia"); page.wait_for_selector('.pow__pytanie')
    for _ in range(3):
        q = page.locator('.pow__pytanie').inner_text()
        m = re.search(r'Okular powiększa (\d+) razy, a obiektyw (\d+) razy', q)
        m2 = re.search(r'Obraz jest powiększony (\d+) razy, a okular powiększa (\d+) razy', q)
        odp = int(m.group(1)) * int(m.group(2)) if m else int(m2.group(1)) // int(m2.group(2))
        page.locator('.pow .liczba__pole').fill(str(odp))
        page.locator('.pow .przycisk--glowny').click()
        assert page.locator('.pow__info[data-stan="dobrze"]').count() == 1
        page.locator('.pow .przycisk--glowny').click()
    page.screenshot(path=str(ZRZUTY / '13-trening-powiekszen.png'))
    page.goto(f"{URL}#/sciaga"); page.wait_for_selector('.sciaga')
    page.goto(f"{URL}#/profil"); page.wait_for_selector('.odznaki'); page.wait_for_timeout(300)
    page.screenshot(path=str(ZRZUTY / '14-profil.png'), full_page=True)
    assert page.locator('.ekran--profil .nota-niezaleznosci, .ekran--profil .stopka').count() == 0 and NOTA not in page.locator('.ekran--profil').inner_text(), 'brak stopki w profilu'
    page.goto(f"{URL}#/rodzic"); page.wait_for_selector('.rodzic__ustawienia')
    page.locator('.rodzic__ustawienia .imie__pole').fill('Kuba')
    page.locator('.rodzic__ustawienia .imie__formularz button').click()
    page.wait_for_function("document.querySelector('.hud__ranga').textContent.startsWith('Kuba')")
    page.goto(f"{URL}#/profil"); page.locator('.ekran--profil .imie__pole').fill('Ola')
    page.locator('.ekran--profil .imie__formularz button').click()
    page.wait_for_function("document.querySelector('.naglowek .nadtytul').textContent === 'Ola'")
    # stary zapis bez imienia: jednorazowe pytanie
    page.evaluate("(() => { const k='puls-zycia-arena-dzial-1'; const s=JSON.parse(localStorage.getItem(k)); delete s.imie; localStorage.setItem(k, JSON.stringify(s)); })()")
    page.goto(URL); page.reload(); page.wait_for_selector('.imie-ekran')
    page.locator('.imie__pole').fill('Ola'); page.locator('.imie__pole').press('Enter')
    page.wait_for_selector('.swiat-karta')
    assert page.locator('.swiat-karta--3:not(.swiat-karta--zablokowana)').count() == 1, 'postępy zachowane'
    page.goto(URL); page.wait_for_selector('.swiat-karta'); page.wait_for_timeout(700)
    page.screenshot(path=str(ZRZUTY / '02-baza-po-przejsciu.png'), full_page=True)
    stan = page.evaluate("JSON.parse(localStorage.getItem('puls-zycia-arena-dzial-1'))")
    print('XP:', stan['xp'], 'odznaki:', sorted(stan['odznaki']), 'maxCombo:', stan['maxCombo'])

    # telefon
    tel = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    tp = tel.new_page()
    tp.on('pageerror', lambda e: bledy.append(f'pageerror (telefon): {e}'))
    tp.goto(URL); tp.wait_for_selector('.imie-ekran'); tp.wait_for_timeout(500)
    tp.screenshot(path=str(ZRZUTY / '00-telefon-imie.png'))
    tp.locator('.imie__pole').fill('Zosia'); tp.locator('.imie-ekran .przycisk--glowny').click()
    tp.wait_for_selector('.swiat-karta'); tp.wait_for_timeout(600)
    tp.screenshot(path=str(ZRZUTY / '15-telefon-baza.png'))
    assert tp.locator('.stopka, .nota-niezaleznosci').count() == 0, 'brak stopek na telefonie'
    tp.goto(f"{URL}#/swiat/1/misja/m1-czynnosci"); tp.wait_for_selector('section.zadanie'); tp.wait_for_timeout(400)
    tp.screenshot(path=str(ZRZUTY / '16-telefon-zadanie.png'), full_page=True)
    b.close()

print('Błędy konsoli/strony:', len(bledy))
for e in bledy: print(' -', e)
sys.exit(1 if bledy else 0)
