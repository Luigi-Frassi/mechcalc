# Browser test for shareable links and form behaviour.
# Requires Playwright with Chromium:  pip install playwright && playwright install chromium
# Run from the repository root:        python3 tests/browser_test.py
# Serves the repo locally, drives the real page in headless Chromium (offline: CDN scripts are
# stubbed, Tailwind's .hidden / md: / sm: rules are emulated), and checks that opening the
# generated URL in a fresh page reproduces exactly the same inputs, results and charts.
import http.server, threading, functools, json, sys, os
from playwright.sync_api import sync_playwright

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=REPO)
class Quiet(handler.func):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=REPO))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{srv.server_address[1]}/'

SNAP_JS = """() => {
  const vis = el => !!(el.offsetParent || el.getClientRects().length);
  const sec = ['moduleFitsSection','moduleBeltsSection','moduleGearsSection','moduleShaftsSection'].find(id => !document.getElementById(id).classList.contains('hidden'));
  const root = document.getElementById(sec);
  const inputs = [...root.querySelectorAll('input,select')].filter(vis).map(e => e.id + '=' + (e.type==='checkbox'||e.type==='radio' ? e.checked : e.value));
  const svgs = [...root.querySelectorAll('svg')].map(s => s.innerHTML);
  return { sec, lang: currentLang, unit: currentUnit, title: document.getElementById('moduleTitle').innerText,
           text: root.innerText, inputs, svgs };
}"""

failures = []
def check(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL ') + name + (('  -- ' + detail) if detail and not cond else ''))
    if not cond: failures.append(name)

def set_val(page, id_, v):
    page.evaluate("([id,v]) => { const e=document.getElementById(id); e.value=v; e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true})); }", [id_, str(v)])

def settle(page): page.wait_for_timeout(400)   # URL sync is debounced (250 ms)

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context()
    TW_STUB = "document.head.insertAdjacentHTML('beforeend','<style>.hidden{display:none}@media(min-width:768px){.md\\\\:flex{display:flex}.md\\\\:hidden{display:none}}@media(min-width:640px){.sm\\\\:inline{display:inline}}</style>')"
    def router(r):
        u = r.request.url
        if u.startswith(BASE): return r.continue_()
        if 'cdn.tailwindcss.com' in u: return r.fulfill(status=200, content_type='application/javascript', body=TW_STUB)  # emulate Tailwind's .hidden
        return r.abort()
    ctx.route('**/*', router)   # offline: no CDN
    errors = []
    def new_page():
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        return pg

    # --- 0. plain load: no errors, clean URL
    pg = new_page(); pg.goto(BASE); settle(pg)
    check('caricamento senza errori JS', not errors, '; '.join(errors))
    check('URL pulito allo stato iniziale', pg.url == BASE, pg.url)

    def roundtrip(name, actions):
        pg = new_page(); pg.goto(BASE); settle(pg)
        actions(pg); settle(pg)
        url = pg.url; before = pg.evaluate(SNAP_JS)
        pg2 = new_page(); pg2.goto(url); settle(pg2)
        after = pg2.evaluate(SNAP_JS)
        same = before == after
        diff = ''
        if not same:
            import difflib
            for k in before:
                if before[k] != after[k]:
                    if k == 'text':
                        diff = 'text: ' + ' | '.join(l for l in difflib.unified_diff(before[k].split('\n'), after[k].split('\n'), lineterm='', n=0) if l[:1] in '+-' and l[:3] not in ('---', '+++'))
                    else:
                        diff = f'{k}: {str(before[k])[:300]} || {str(after[k])[:300]}'
                    break
        check(f'{name}: il link riapre lo stesso calcolo', same, diff)
        print('      ', url.replace(BASE, '/'))
        return pg, pg2, url

    # --- 1. fits, Italian, inches, reverse lookup
    def a1(pg):
        pg.click('#langIT'); pg.click('#unitImperial')
        set_val(pg, 'nominalDiameter', '1.25'); set_val(pg, 'fitType', 'H7/p6')
        pg.click('#modeReverse'); set_val(pg, 'reverseFitNature', 'interference'); set_val(pg, 'reverseTargetVal', '1.2')
    roundtrip('accoppiamenti IT/pollici/ricerca inversa', a1)

    # --- 2. fits: click a comparison-table row
    def a2(pg):
        set_val(pg, 'nominalDiameter', '75')
        pg.click('#comparisonTableBody tr:nth-child(5)')
    _, _, u = roundtrip('accoppiamenti click su riga tabella', a2)
    check('  riga cliccata salvata (H7/k6)', 'fitType=H7%2Fk6' in u, u)

    # --- 3. belts, power mode, tau method
    def a3(pg):
        pg.click('#navBtnBelts'); pg.click('#beltModePower')
        pg.check('#methodTau'); set_val(pg, 'targetTau', '3.1')
        set_val(pg, 'beltProfile', '8'); set_val(pg, 'pulleyZ1', '24'); set_val(pg, 'desiredCenter', '420')
        set_val(pg, 'motorPower', '7.5'); set_val(pg, 'driverSpeed', '960'); set_val(pg, 'serviceFactor', '1.8')
    roundtrip('cinghie potenza + rapporto τ', a3)

    # --- 4. gears design: helical, torque input, center distance, auto-z, locked L, optimizer row 3
    def a4(pg):
        pg.click('#navBtnGears')
        set_val(pg, 'gearToothType', 'helical')
        pg.check('input[name="gearLoadMode"][value="torque"]'); set_val(pg, 'gearTorqueInput', '250')
        pg.check('input[name="gearGeomMode"][value="center"]'); set_val(pg, 'gearTargetCenter', '160'); set_val(pg, 'gearTargetTau', '0.3')
        pg.check('#toggleAutoZ'); pg.check('#toggleLockL'); set_val(pg, 'gearLockedLVal', '45')
        settle(pg)
        rows = pg.locator('#fixedOptTableBody tr')
        if rows.count() >= 3: rows.nth(2).click()
    pg4, _, u = roundtrip('ingranaggi elicoidali, ottimizzatore, riga 3', a4)
    check('  riga dell\'ottimizzatore salvata', 'combo=2' in u, u)

    # --- 5. gears spur with a Series 3 module, recommended alternative chosen
    def a5(pg):
        pg.click('#navBtnGears'); pg.click('#langIT')
        for zp in [17, 18, 19, 20, 21, 22, 23, 24, 25, 16, 15]:
            for P in [11, 15, 18.5, 22, 7.5, 30, 37, 45, 5.5, 4]:
                set_val(pg, 'gearZ1', zp); set_val(pg, 'gearPower', P)
                if pg.evaluate("!document.getElementById('gearSeries3ComparisonCard').classList.contains('hidden')"):
                    pg.click('#btnAdoptRecommended'); return
        raise RuntimeError('nessun caso Serie 3 trovato')
    _, pg5b, u = roundtrip('ingranaggi Serie 3, modulo consigliato', a5)
    check('  scelta "consigliato" salvata', 's3=recommended' in u, u)

    # --- 6. gears W_max helical
    def a6(pg):
        pg.click('#navBtnGears'); pg.click('#gearModeWmax')
        set_val(pg, 'gwToothType', 'helical'); set_val(pg, 'gwAlpha', '25'); set_val(pg, 'gwModule', '4')
        set_val(pg, 'gwZ1', '18'); set_val(pg, 'gwZ2', '50'); set_val(pg, 'gwFaceWidth', '70'); set_val(pg, 'gwSpeed', '750'); set_val(pg, 'gwSigmaH', '981')
    roundtrip('ingranaggi W_max elicoidale', a6)

    # --- 7. demo presets
    for btn in ['#demoHelicalBtn', '#demoSpurBtn', '#demoFitBtn']:
        roundtrip('preset ' + btn, lambda pg, b=btn: pg.click(b))

    # --- 8. duplicate-id fix: gear geometry switcher must not touch the belt τ column
    pg = new_page(); pg.goto(BASE); settle(pg)
    pg.click('#navBtnBelts'); pg.check('#methodTau'); settle(pg)
    belt_tau_visible = lambda: pg.evaluate("!document.getElementById('colTargetTau').classList.contains('hidden')")
    gear_tau_visible = lambda: pg.evaluate("!document.getElementById('colGearTargetTau').classList.contains('hidden')")
    check('cinghie: colonna τ visibile con metodo τ', belt_tau_visible())
    pg.click('#navBtnGears'); pg.check('input[name="gearGeomMode"][value="teeth"]'); settle(pg)
    check('ingranaggi "denti": τ ingranaggi nascosta', not gear_tau_visible())
    check('ingranaggi "denti": τ cinghie NON toccata', belt_tau_visible())
    pg.check('input[name="gearGeomMode"][value="center"]'); settle(pg)
    check('ingranaggi "interasse": τ ingranaggi visibile', gear_tau_visible())

    # --- 8b. z1 visibility must not depend on the click order
    def z1_visible(order):
        pg = new_page(); pg.goto(BASE); settle(pg); pg.click('#navBtnGears')
        for step in order:
            if step == 'auto': pg.check('#toggleAutoZ')
            else: pg.check(f'input[name="gearGeomMode"][value="{step}"]')
        settle(pg)
        return pg.evaluate("!document.getElementById('colPinionZ1').classList.contains('hidden')")
    for geom, expected in [('tau', False), ('center', False), ('teeth', True)]:
        a, b = z1_visible([geom, 'auto']), z1_visible(['auto', geom])
        check(f'z1 con z automatico in modalità {geom}: {"visibile" if expected else "nascosto"} in ogni ordine', a == b == expected, f'{a} {b}')

    # --- 9. robustness: bad parameters are ignored
    pg = new_page(); pg.goto(BASE + '?m=gears&gearPower=abc&gearToothType=<script>&combo=99&lang=xx&unit=zz&geom=%22%5D'); settle(pg)
    snap = pg.evaluate(SNAP_JS)
    check('parametri non validi ignorati, nessun errore', not errors and snap['sec'] == 'moduleGearsSection', '; '.join(errors))
    pg = new_page(); pg.goto(BASE + '?m=nonexistent'); settle(pg)
    check('modulo sconosciuto: pagina normale', pg.evaluate(SNAP_JS)['sec'] == 'moduleFitsSection')

    # --- 10. share button copies the URL (desktop)
    ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=BASE.rstrip('/'))
    pg = new_page(); pg.goto(BASE); settle(pg)
    pg.click('#navBtnBelts'); set_val(pg, 'pulleyZ1', '31'); settle(pg)
    pg.click('.js-share-btn'); pg.wait_for_timeout(200)
    clip = pg.evaluate('navigator.clipboard.readText()')
    label = pg.inner_text('.js-share-btn')
    check('bottone Condividi copia il link', clip == pg.url and 'pulleyZ1=31' in clip, clip)
    check('feedback "Link copiato"', 'copied' in label.lower() or 'copiato' in label.lower(), label)

    # --- 11. shafts module
    pg = new_page(); pg.goto(BASE); settle(pg)
    pg.click('#navBtnShafts'); settle(pg)
    snap = pg.evaluate(SNAP_JS)
    check('alberi: il modulo si apre', snap['sec'] == 'moduleShaftsSection')
    check('alberi: risultati calcolati', 'd ≥' in pg.inner_text('#shaftRes1') and 'X =' in pg.inner_text('#shaftRes3'), pg.inner_text('#shaftRes1'))
    check('alberi: diagramma di Goodman e schizzo disegnati', pg.evaluate("document.getElementById('shaftGoodmanChart').innerHTML.includes('<line') && document.getElementById('shaftSketch').innerHTML.includes('Ø')"))
    # the page shows exactly what the core computes
    pg.click('#demoShaftBtn'); settle(pg)
    core = pg.evaluate('''() => { const { inp, Xreq } = readShaftInputs(); const r = shaftDesign(inp, Xreq); return { d: r.d, D: r.D, dMin: r.dMin, X: r.final.Xfatigue }; }''')
    check('alberi, preset esame: d scelto = 65 mm come nella soluzione', core['d'] == 65 and core['D'] == 77, str(core))
    check('alberi, preset esame: la pagina mostra il risultato del core', pg.inner_text('#shaftRes2').startswith('d = 65 mm · D = 77 mm') and f"{core['X']:.2f}" in pg.inner_text('#shaftRes3'), pg.inner_text('#shaftRes2') + ' | ' + pg.inner_text('#shaftRes3'))
    check('alberi, preset evidenziato', 'blue' in pg.get_attribute('#demoShaftBtn', 'class'))
    # visibility of the inputs
    vis = lambda i: pg.evaluate(f"!document.getElementById('{i}').classList.contains('hidden')")
    set_val(pg, 'shaftNotchType', 'keyway'); settle(pg)
    check('alberi: linguetta mostra tipo e stato, nasconde r e D/d', vis('colShaftKeyType') and vis('colShaftKeyCond') and not vis('colShaftR') and not vis('colShaftDd'))
    set_val(pg, 'shaftNotchType', 'shoulder'); pg.click('#shaftModeCheck'); settle(pg)
    check('alberi, verifica: mostra d e D, nasconde D/d', vis('colShaftDcheck') and vis('colShaftDDcheck') and not vis('colShaftDd'))
    set_val(pg, 'shaftTorqueInput', 'torque'); settle(pg)
    check('alberi: Mt diretto nasconde P e n', vis('colShaftMt') and not vis('colShaftPower') and not vis('colShaftSpeed'))
    # check mode reproduces the exam verification (d = 65, D = 76, r = 2)
    set_val(pg, 'shaftTorqueInput', 'power'); set_val(pg, 'shaftDcheck', 65); set_val(pg, 'shaftDDcheck', 76); set_val(pg, 'shaftR', 2); settle(pg)
    xf = pg.inner_text('#shaftRes3')
    check('alberi, verifica d=65 D=76 r=2: X a fatica ≈ 1.87 (1.82 con i coefficienti letti dal docente)', 'X = 1.87' in xf, xf)
    # language
    pg.click('#langIT'); settle(pg)
    check('alberi in italiano: titolo e schede tradotti', pg.inner_text('#moduleTitle') == 'Progetto a fatica degli alberi' and 'Sicurezza a fatica' in pg.inner_text('#shaftRes3Title'), pg.inner_text('#moduleTitle'))
    txt = pg.evaluate("document.getElementById('moduleShaftsSection').innerText")
    check('alberi: nessun testo mancante (undefined/NaN)', 'undefined' not in txt and 'NaN' not in txt)
    pg.click('#langEN'); settle(pg)

    # share round trip: keyway, finite life, check mode, Italian
    def a_sh(pg):
        pg.click('#navBtnShafts'); pg.click('#langIT'); pg.click('#shaftModeCheck')
        set_val(pg, 'shaftNotchType', 'keyway'); set_val(pg, 'shaftKeyType', 'profile'); set_val(pg, 'shaftKeyCond', 'hardened')
        set_val(pg, 'shaftDcheck', 42); set_val(pg, 'shaftMf', 320); set_val(pg, 'shaftTorsionCycle', 'pulsating')
        set_val(pg, 'shaftLife', 'finite'); set_val(pg, 'shaftCycles', 150000); set_val(pg, 'shaftFinish', 'g')
    _, _, u = roundtrip('alberi: linguetta, vita finita, verifica', a_sh)
    check('  modalità e linguetta nel link', 'smode=check' in u and 'shaftKeyType=profile' in u, u)
    def a_sh2(pg):
        pg.click('#navBtnShafts'); set_val(pg, 'shaftTorqueInput', 'torque'); set_val(pg, 'shaftMt', 250)
        set_val(pg, 'shaftBendCycle', 'static'); set_val(pg, 'shaftAxial', 5000); set_val(pg, 'shaftDd', 1.3); set_val(pg, 'shaftR', 0.8)
    roundtrip('alberi: progetto con Mt diretto e sforzo assiale', a_sh2)

    check('nessun errore JS in tutto il test', not errors, '; '.join(errors[:3]))
    browser.close()
srv.shutdown()
print(f'\n{"TUTTO OK" if not failures else str(len(failures)) + " FALLITI: " + ", ".join(failures)}')
sys.exit(1 if failures else 0)
