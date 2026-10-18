# Generuje ikony PNG z docs/assets/ikony/ikona.svg (narzędzie deweloperskie, wymaga playwright):
#   python tools/ikony.py
import pathlib
from playwright.sync_api import sync_playwright

KAT = pathlib.Path(__file__).resolve().parent.parent / 'docs' / 'assets' / 'ikony'
svg = (KAT / 'ikona.svg').read_text()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    for plik, r in [('ikona-192.png', 192), ('ikona-512.png', 512), ('apple-touch-icon.png', 180)]:
        s = b.new_page(viewport={'width': r, 'height': r})
        s.set_content('<body style="margin:0">' + svg.replace('<svg ', f'<svg width="{r}" height="{r}" ', 1) + '</body>')
        s.screenshot(path=str(KAT / plik))
        s.close()
        print(plik, r)
    b.close()
