// ============================================================================
// CALCULATION REPORTS ("Relazione di calcolo")
// Builds a printable A4 report of the current calculation and opens it in a new tab:
// the user saves it as PDF from the print dialog (vector text and diagrams, nothing leaves the browser).
// Shafts first: beam -> loads -> section design/check -> life -> bearings -> dimensions for CAD.
// ============================================================================

const REPORT_TXT = {
  it: {
    docTitle: 'Relazione di calcolo', shaftTitle: 'Albero di trasmissione — dimensionamento di massima',
    project: 'Progetto', author: 'Autore', date: 'Data', clickToEdit: 'clicca per modificare',
    printBtn: 'Stampa / Salva PDF', htmlBtn: 'Scarica HTML', printHint: 'Nel dialogo di stampa scegli “Salva come PDF”. I campi in giallo si possono modificare prima di stampare.',
    reopen: 'Riapri questo calcolo', generated: 'Generata con Torsio Engineering',
    disclaimer: 'Dimensionamento di massima con il metodo del corso di Costruzione di Macchine (Goodman, coefficienti da diagrammi). I valori servono come prime quote per il CAD: la verifica finale va fatta con le norme (es. DIN 743 / ISO 6336), i cataloghi dei produttori o un\'analisi FEM.',
    s1: 'Dati di progetto', s2: 'Schema dell\'albero e carichi', s3: 'Reazioni vincolari e cuscinetti', s4: 'Diagrammi delle sollecitazioni',
    s5: 'Sezione critica', s6: 'Progetto della sezione', s6c: 'Verifica della sezione', s7: 'Vita a fatica e carico massimo', s8: 'Quote per il CAD', s9: 'Ipotesi e note',
    power: 'Potenza', speed: 'Velocità', torque: 'Momento torcente', omega: 'Velocità angolare', material: 'Materiale',
    finish: 'Finitura superficiale', Xreq: 'Coefficiente di sicurezza richiesto', life: 'Vita richiesta', infinite: 'infinita (≥ 10⁶ cicli)', cycles: 'cicli',
    theta: 'Angolo di pressione', length: 'Lunghezza dell\'albero', bearings: 'Cuscinetti', rotation: 'Rotazione vista da B', ccw: 'antioraria', cw: 'oraria',
    point: 'Punto', type: 'Tipo', pos: 'x [mm]', descr: 'Descrizione', end: 'estremità', bearing: 'cuscinetto', gear: 'ruota dentata', coupling: 'giunto / coppia', force: 'forza',
    pitchD: 'Ø primitivo', helix: 'elica', tIn: 'coppia entrante', tOut: 'coppia uscente', tNone: 'folle', share: 'quota Mt',
    mate: 'ruota coniugata a', manualDirs: 'versi scelti a mano',
    forcesTitle: 'Forze delle ruote sull\'albero', formulaGear: 'Ft = 2·Mt/d,  Fr = Ft·tanθ/cosα,  Fa = Ft·tanα',
    react: 'Reazione', axial: 'assiale', req: 'C richiesto', lifeL: 'durata L', catalog: 'C catalogo', lifeCat: 'durata con C catalogo', hours: 'h',
    bearingFormula: 'C = R · L^(1/p), p = 3 (sfere) o 10/3 (rulli); con C di catalogo L = (C/R)^p', ballW: 'sfere', rollerW: 'rulli',
    critAt: 'Sezione con Mf massimo', sectionUsed: 'Sezione dimensionata (dati della scheda Progetto/Verifica)',
    realSecs: 'Verifica delle sezioni reali', worst: 'più critica',
    notch: 'Intaglio', shoulder: 'spallamento', keyway: 'cava per linguetta', combined: 'spallamento + cava per linguetta', manualKe: 'Ke noto', none: 'sezione liscia',
    bendCycle: 'Flessione', rotating: 'rotante (alterna simmetrica)', staticL: 'costante', torsCycle: 'Torsione', pulsating: 'pulsante', alternating: 'alterna',
    nominal: 'Tensioni nominali', coeffs: 'Coefficienti', eqStress: 'Tensioni equivalenti', goodman: 'Retta di Goodman', yieldT: 'Snervamento',
    vonMises: 'von Mises statico sui picchi (senza Kt)', result: 'Risultato', ok: 'VERIFICATO', ko: 'NON VERIFICATO',
    dMin: 'Diametro minimo', dChosen: 'Diametro scelto (foro cuscinetto)', governs: 'governa', fatigue: 'la fatica', yieldG: 'lo snervamento',
    maxLoad: 'Carico massimo con questo diametro', lifeAtX: 'Vita con X richiesto', miner: 'Danno cumulato (Miner)', manson: 'Danno cumulato (Manson)',
    remaining: 'vita residua', phase: 'fase', cad: 'Elemento', value: 'Valore', note: 'Nota',
    hyp: [
      'Albero su due appoggi (cuscinetti) in due piani ortogonali V e H; momento flettente risultante $M_f = \\sqrt{M_v^2 + M_h^2}$.',
      'Forze delle ruote applicate nel punto di contatto; la forza assiale delle ruote elicoidali genera una coppia concentrata $F_a\\,r$.',
      'Fatica: $\\sigma_{a,eq} = \\sqrt{(K_e\\,\\sigma_a)^2 + 3\\,(K_e\'\\,\\tau_a)^2}$, $\\sigma_{m,eq} = \\frac{\\sigma_m}{2} + \\sqrt{\\left(\\frac{\\sigma_m}{2}\\right)^2 + \\tau_m^2}$; retta di Goodman $\\frac{\\sigma_{a,eq}}{b_1 b_2 \\sigma_N} + \\frac{\\sigma_{m,eq}}{\\sigma_R} = \\frac{1}{X}$.',
      '$K_t$ dalla formula $B\\,(r/d)^a$ del corso, $q$ dalla formula di Neuber (coincide con i diagrammi), $K_e = q\\,(K_t - 1) + 1$; $b_1$ e $b_2$ dai diagrammi del corso.',
      'Vita finita: retta di Wöhler tra $\\sigma_R$ a $10^3$ e $\\sigma_{LF}$ a $10^6$ cicli.'
    ]
  },
  en: {
    docTitle: 'Calculation report', shaftTitle: 'Transmission shaft — preliminary sizing',
    project: 'Project', author: 'Author', date: 'Date', clickToEdit: 'click to edit',
    printBtn: 'Print / Save as PDF', htmlBtn: 'Download HTML', printHint: 'In the print dialog choose “Save as PDF”. The yellow fields can be edited before printing.',
    reopen: 'Reopen this calculation', generated: 'Generated with Torsio Engineering',
    disclaimer: 'Preliminary sizing with the method of the Machine Design course (Goodman line, coefficients from charts). The values are first dimensions for CAD: the final check must follow the standards (e.g. DIN 743 / ISO 6336), the manufacturers\' catalogs or an FEM analysis.',
    s1: 'Design data', s2: 'Shaft layout and loads', s3: 'Support reactions and bearings', s4: 'Internal action diagrams',
    s5: 'Critical section', s6: 'Section design', s6c: 'Section check', s7: 'Fatigue life and maximum load', s8: 'Dimensions for CAD', s9: 'Assumptions and notes',
    power: 'Power', speed: 'Speed', torque: 'Torque', omega: 'Angular speed', material: 'Material',
    finish: 'Surface finish', Xreq: 'Required safety factor', life: 'Required life', infinite: 'infinite (≥ 10⁶ cycles)', cycles: 'cycles',
    theta: 'Pressure angle', length: 'Shaft length', bearings: 'Bearings', rotation: 'Rotation seen from B', ccw: 'counter-clockwise', cw: 'clockwise',
    point: 'Point', type: 'Type', pos: 'x [mm]', descr: 'Description', end: 'end', bearing: 'bearing', gear: 'gear', coupling: 'coupling / torque', force: 'force',
    pitchD: 'pitch Ø', helix: 'helix', tIn: 'torque in', tOut: 'torque out', tNone: 'idler', share: 'Mt share',
    mate: 'mating gear at', manualDirs: 'directions chosen by hand',
    forcesTitle: 'Gear forces on the shaft', formulaGear: 'Ft = 2·Mt/d,  Fr = Ft·tanθ/cosα,  Fa = Ft·tanα',
    react: 'Reaction', axial: 'axial', req: 'Required C', lifeL: 'life L', catalog: 'catalog C', lifeCat: 'life with catalog C', hours: 'h',
    bearingFormula: 'C = R · L^(1/p), p = 3 (ball) or 10/3 (roller); with a catalog C, L = (C/R)^p', ballW: 'ball', rollerW: 'roller',
    critAt: 'Section with the largest Mf', sectionUsed: 'Designed section (data of the Design/Check tab)',
    realSecs: 'Check of the real sections', worst: 'most critical',
    notch: 'Notch', shoulder: 'shoulder', keyway: 'keyway', combined: 'shoulder + keyway', manualKe: 'known Ke', none: 'plain section',
    bendCycle: 'Bending', rotating: 'rotating (fully reversed)', staticL: 'constant', torsCycle: 'Torsion', pulsating: 'pulsating', alternating: 'alternating',
    nominal: 'Nominal stresses', coeffs: 'Coefficients', eqStress: 'Equivalent stresses', goodman: 'Goodman line', yieldT: 'Yield',
    vonMises: 'static von Mises on the peaks (no Kt)', result: 'Result', ok: 'VERIFIED', ko: 'NOT VERIFIED',
    dMin: 'Minimum diameter', dChosen: 'Chosen diameter (bearing bore)', governs: 'governed by', fatigue: 'fatigue', yieldG: 'yield',
    maxLoad: 'Maximum load at this diameter', lifeAtX: 'Life at the required X', miner: 'Cumulative damage (Miner)', manson: 'Cumulative damage (Manson)',
    remaining: 'remaining life', phase: 'phase', cad: 'Item', value: 'Value', note: 'Note',
    hyp: [
      'Shaft on two supports (bearings) in two orthogonal planes V and H; resultant bending moment $M_f = \\sqrt{M_v^2 + M_h^2}$.',
      'Gear forces applied at the mesh point; the axial force of helical gears adds a concentrated couple $F_a\\,r$.',
      'Fatigue: $\\sigma_{a,eq} = \\sqrt{(K_e\\,\\sigma_a)^2 + 3\\,(K_e\'\\,\\tau_a)^2}$, $\\sigma_{m,eq} = \\frac{\\sigma_m}{2} + \\sqrt{\\left(\\frac{\\sigma_m}{2}\\right)^2 + \\tau_m^2}$; Goodman line $\\frac{\\sigma_{a,eq}}{b_1 b_2 \\sigma_N} + \\frac{\\sigma_{m,eq}}{\\sigma_R} = \\frac{1}{X}$.',
      '$K_t$ from the course formula $B\\,(r/d)^a$, $q$ from Neuber\'s formula (it matches the charts), $K_e = q\\,(K_t - 1) + 1$; $b_1$ and $b_2$ from the course charts.',
      'Finite life: Wöhler line between $\\sigma_R$ at $10^3$ and $\\sigma_{LF}$ at $10^6$ cycles.'
    ]
  }
};

function reportEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Number in the report language (decimal comma in Italian)
function reportNum(x, n = 2) {
  if (x === null || x === undefined || Number.isNaN(x)) return '—';
  if (!Number.isFinite(x)) return '∞';
  return x.toLocaleString(currentLang === 'it' ? 'it-IT' : 'en-GB', { minimumFractionDigits: n, maximumFractionDigits: n });
}

// ---- typeset formulas (KaTeX, vendored in vendor/katex, loaded only when a report is generated)
let reportKatexPromise = null;
function reportLoadKatex() {
  if (window.katex) return Promise.resolve(true);
  if (!reportKatexPromise) {
    reportKatexPromise = new Promise(res => {
      const sc = document.createElement('script');
      sc.src = 'vendor/katex/katex.min.js';
      sc.onload = () => res(!!window.katex);
      sc.onerror = () => res(false);
      document.head.appendChild(sc);
    });
  }
  return reportKatexPromise;
}

// Number for a TeX formula: thin space for thousands, decimal comma in Italian
function texNum(x, n = 2) {
  if (x === null || x === undefined || Number.isNaN(x)) return '-';
  if (!Number.isFinite(x)) return '\\infty';
  const neg = x < 0;
  const [i, f] = Math.abs(x).toFixed(n).split('.');
  const ig = i.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');
  return (neg ? '-' : '') + ig + (f ? (currentLang === 'it' ? '{,}' : '.') + f : '');
}

// Display formulas: one TeX line per row, left aligned in a framed block
function reportTex(tex, display = true) {
  if (window.katex) {
    try { return window.katex.renderToString(tex, { displayMode: display, throwOnError: false, output: 'html' }); } catch (e) { /* fall through */ }
  }
  return display ? `<div class="f">${reportEsc(tex)}</div>` : `<code>${reportEsc(tex)}</code>`;
}
function reportEq(lines) {
  return `<div class="eq">${lines.filter(Boolean).map(l => reportTex(l, true)).join('')}</div>`;
}
// Text with inline formulas between $…$
function reportTexify(str) {
  return String(str).split(/\$([^$]+)\$/).map((part, i) => i % 2 ? reportTex(part, false) : part).join('');
}

// The app draws its SVGs for a dark background: map the light strokes/texts to dark ones for white paper
function reportSvgForPrint(svgHtml) {
  const map = {
    '#cbd5e1': '#334155', '#e2e8f0': '#0f172a', '#94a3b8': '#475569', '#64748b': '#64748b', '#475569': '#94a3b8', '#334155': '#cbd5e1',
    '#ffffff': '#0f172a', '#0284c7': '#0369a1',
    '#38bdf8': '#0369a1', '#fbbf24': '#b45309', '#34d399': '#047857', '#f43f5e': '#be123c', '#a855f7': '#7e22ce'
  };
  return svgHtml.replace(/#[0-9a-fA-F]{6}\b/g, c => map[c.toLowerCase()] || c)
    .replace(/class="[^"]*"/, 'class="rep-svg"');
}

function reportTable(head, rows, cls = '') {
  return `<table class="${cls}"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>` +
    rows.map(r => `<tr${r.cls ? ` class="${r.cls}"` : ''}>${(r.cells || r).map(c => `<td>${c}</td>`).join('')}</tr>`).join('') + '</tbody></table>';
}

function reportKV(pairs) {
  return '<table class="kv"><tbody>' + pairs.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('') + '</tbody></table>';
}

function reportCSS() {
  return `
  @page { size: A4; margin: 16mm 14mm 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "Archivo", "Helvetica Neue", Arial, sans-serif; color: #0f172a; font-size: 10.5pt; line-height: 1.45; margin: 0; background: #f1f5f9; }
  .page { max-width: 190mm; margin: 0 auto; background: #fff; padding: 14mm 12mm; }
  .toolbar { position: sticky; top: 0; z-index: 5; background: #0f172a; color: #e2e8f0; padding: 10px 16px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; font-size: 13px; }
  .toolbar button { background: #2e5640; color: #fff; border: 0; border-radius: 6px; padding: 7px 14px; font-weight: 600; cursor: pointer; font-size: 13px; }
  .toolbar button.sec { background: #334155; }
  .toolbar span { color: #94a3b8; }
  header.rep { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 14px; }
  header.rep .brand { font-size: 9pt; letter-spacing: .08em; text-transform: uppercase; color: #2e5640; font-weight: 700; }
  header.rep h1 { font-size: 17pt; margin: 2px 0 2px; }
  header.rep h2 { font-size: 11pt; margin: 0 0 8px; color: #475569; font-weight: 500; }
  .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 16px; font-size: 9.5pt; }
  .meta b { color: #475569; font-weight: 600; margin-right: 4px; }
  [contenteditable] { background: #fef9c3; padding: 0 3px; border-radius: 2px; outline: none; }
  h3 { font-size: 12pt; margin: 18px 0 6px; padding-bottom: 3px; border-bottom: 1px solid #cbd5e1; break-after: avoid; }
  h3 .n { color: #2e5640; margin-right: 6px; }
  h4 { font-size: 10.5pt; margin: 10px 0 4px; color: #334155; break-after: avoid; }
  table { border-collapse: collapse; width: 100%; margin: 4px 0 8px; font-size: 9.5pt; break-inside: avoid; }
  th, td { border: 1px solid #cbd5e1; padding: 3px 6px; text-align: left; vertical-align: top; }
  thead th { background: #f1f5f9; font-weight: 600; }
  table.kv th { width: 42%; background: #f8fafc; font-weight: 500; color: #334155; }
  tr.hl td { background: #fff1f2; font-weight: 600; }
  .f { font-family: "JetBrains Mono", Consolas, monospace; font-size: 9.3pt; background: #f8fafc; border-left: 3px solid #2e5640; padding: 5px 8px; margin: 4px 0; white-space: pre-wrap; break-inside: avoid; }
  .eq { border-left: 3px solid #2e5640; background: #f8fafc; padding: 2px 12px; margin: 4px 0 8px; break-inside: avoid; }
  .eq .katex-display { text-align: left; margin: 6px 0; }
  .eq .katex-display > .katex { text-align: left; }
  .katex { font-size: 1.08em; }
  .ok { color: #047857; font-weight: 700; } .ko { color: #b91c1c; font-weight: 700; }
  .res { border: 1.5px solid #0f172a; border-radius: 6px; padding: 8px 10px; margin: 8px 0; break-inside: avoid; }
  .res .big { font-size: 13pt; font-weight: 700; }
  .fig { break-inside: avoid; margin: 6px 0 10px; text-align: center; }
  .fig .cap { font-size: 8.5pt; color: #64748b; margin-top: 2px; }
  .rep-svg { width: 100%; height: auto; max-height: 230mm; background: #fff; }
  .row { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
  .row .rep-svg { width: 48%; min-width: 220px; }
  .gv { display: grid; grid-template-columns: 62% 34%; gap: 4px 4%; align-items: center; break-inside: avoid; margin: 4px 0 8px; }
  .gv .rep-svg { width: 100%; }
  .small { font-size: 8.8pt; color: #475569; }
  footer.rep { margin-top: 18px; padding-top: 6px; border-top: 1px solid #cbd5e1; font-size: 8.5pt; color: #64748b; }
  footer.rep a { color: #2e5640; word-break: break-all; }
  ul { margin: 4px 0 8px 18px; padding: 0; }
  .toc { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin: 6px 0 12px; font-size: 9.8pt; background: #f8fafc; }
  .toc ol { margin: 4px 0 0 18px; padding: 0; }
  h2.ch { font-size: 14pt; margin: 4px 0 2px; padding: 6px 0 4px; border-bottom: 2px solid #0f172a; break-after: avoid; }
  h2.ch .n { display: inline-block; min-width: 24px; color: #fff; background: #2e5640; border-radius: 4px; text-align: center; margin-right: 8px; padding: 0 6px; }
  .chsub { margin: 2px 0 6px; color: #475569; font-size: 10pt; }
  section.chapter { break-before: page; padding-top: 4px; }
  @media screen { section.chapter { margin-top: 26px; border-top: 6px solid #f1f5f9; padding-top: 14px; } }
  .chnote { border-top: 1px dashed #cbd5e1; padding-top: 4px; margin-top: 10px; }
  table.chk td { border: 0; border-bottom: 1px solid #e2e8f0; }
  table.chk td:first-child { width: 22px; text-align: center; font-weight: 700; }
  table.chk td.ok { color: #047857; } table.chk td.ko { color: #b45309; } table.chk td.na { color: #94a3b8; }
  @media print { body { background: #fff; } .toolbar { display: none; } .page { padding: 0; max-width: none; } a { color: inherit; } }
  `;
}

// When a combined report is being assembled, the module builders hand their parts here instead of a full page
let reportCollect = null;

function reportShell(title, subtitle, body, R, disclaimer = null) {
  if (reportCollect) { reportCollect.push({ title, subtitle, body, disclaimer: disclaimer || R.disclaimer }); return '__part__'; }
  const today = new Date().toLocaleDateString(currentLang === 'it' ? 'it-IT' : 'en-GB');
  let link = '';
  try { link = typeof shareUrl === 'function' ? shareUrl() : window.location.href; } catch (e) { link = window.location.href; }
  return `<!doctype html><html lang="${currentLang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${reportEsc(R.docTitle)} — ${reportEsc(subtitle)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&display=swap"><link rel="stylesheet" href="${new URL('vendor/katex/katex.min.css', window.location.href).href}"><style>${reportCSS()}</style></head><body>
<div class="toolbar"><button onclick="window.print()">🖨 ${R.printBtn}</button>
<button class="sec" onclick="(function(){var h='<!doctype html>'+document.documentElement.outerHTML;var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([h],{type:'text/html'}));a.download='relazione-torsio.html';a.click();})()">⬇ ${R.htmlBtn}</button>
<span>${R.printHint}</span></div>
<div class="page">
<header class="rep"><div class="brand"><svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" style="vertical-align:-3px;margin-right:6px"><circle cx="16" cy="16" r="11" fill="none" stroke="#2e5640" stroke-width="5"/><rect x="13" y="2" width="6" height="7" fill="#e8b321"/></svg>Torsio Engineering · ${R.docTitle}</div><h1>${reportEsc(title)}</h1><h2>${reportEsc(subtitle)}</h2>
<div class="meta"><div><b>${R.project}:</b><span contenteditable="true" title="${R.clickToEdit}">—</span></div>
<div><b>${R.author}:</b><span contenteditable="true" title="${R.clickToEdit}">—</span></div><div><b>${R.date}:</b>${today}</div></div></header>
${body}
<footer class="rep"><p>${disclaimer || R.disclaimer}</p><p>${R.generated} · <a href="${reportEsc(link)}">${R.reopen} ↗</a> <span class="small">(${reportEsc(link.split('?')[0])})</span></p></footer>
</div></body></html>`;
}

function reportOpen(html, w = null) {
  w = w || window.open('', '_blank');
  if (w && w.document) { w.document.open(); w.document.write(html); w.document.close(); return true; }
  // popup blocked: download the report instead
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  a.download = 'relazione-torsio.html';
  document.body.appendChild(a); a.click(); a.remove();
  return false;
}

// ---------------------------------------------------------------------------
// Shafts report
// ---------------------------------------------------------------------------
let reportLastShaft = null;   // diameter of the last shaft report (used by the transmission summary)
function buildShaftReportHtml() {
  const R = REPORT_TXT[currentLang] || REPORT_TXT.en;
  const t = translations[currentLang];
  const N = reportNum;
  const { torqueInput, Mt: MtShaft } = readShaftTorque();
  const bi = readShaftBeamInputs(MtShaft);
  const beam = shaftBeam({ xA: bi.xA, xB: bi.xB, L: bi.L, elements: bi.elements, Mt: MtShaft, theta: bi.theta, axialBearing: bi.axialBearing, rotation: bi.rotation });
  const active = bi.elements.filter(e => e.type !== 'none');
  const labels = shaftPointLabels(bi.xA, bi.xB, active.map(e => e.x), bi.L);
  const nameOf = el => labels.elements[active.indexOf(el)] || '';
  const { inp, Xreq, mode, notchType } = readShaftInputs();
  const finishName = (SHAFT_B2[inp.finish] || {})[currentLang === 'it' ? 'it' : 'en'] || inp.finish;
  const rpm = torqueInput === 'power' ? shaftVal('shaftSpeed', 0) : 0;
  let body = '';
  let sec = 0;
  const H = title => `<h3><span class="n">${++sec}.</span>${title}</h3>`;

  // ---- 1. data
  const lifeTxt = inp.cycles > 0 ? `${N(inp.cycles, 0)} ${R.cycles}` : R.infinite;
  body += H(R.s1) + reportKV([
    ...(torqueInput === 'power' ? [[R.power, `${N(shaftVal('shaftPower', 0), 2)} kW`], [R.speed, `${N(rpm, 0)} rpm  (ω = ${N(2 * Math.PI * rpm / 60, 2)} rad/s)`]] : []),
    [R.torque, `Mt = ${N(MtShaft, 1)} N·m` + (torqueInput === 'power' ? '  (Mt = P/ω)' : '')],
    [R.material, `σR = ${N(inp.sigmaR, 0)} MPa · σs = ${N(inp.sigmaS, 0)} MPa · σLF = ${N(inp.sigmaLF, 0)} MPa`],
    [R.finish, reportEsc(finishName)], [R.Xreq, `X = ${N(Xreq, 2)}`], [R.life, lifeTxt],
    [R.theta, `θ = ${N(bi.theta, 1)}°`], [R.length, bi.L > 0 ? `L = ${N(bi.L, 1)} mm` : '—'],
    [R.bearings, `${bi.bearingType === 'roller' ? 'rulli / roller (p = 10/3)' : 'sfere / ball (p = 3)'} · L = ${N(bi.life, 1)}·10⁶`],
    [R.rotation, bi.rotation === 'cw' ? R.cw : R.ccw]
  ]);

  // ---- 2. layout and loads
  if (beam.ok) {
    const rows = [];
    for (const p of labels.points) {
      const descr = [];
      if (bi.L > 0 && Math.abs(p.x) < 1e-6) descr.push(R.end + ' A');
      if (bi.L > 0 && Math.abs(p.x - bi.L) < 1e-6) descr.push(R.end + ' B');
      if (Math.abs(p.x - bi.xA) < 1e-6) descr.push(R.bearing + ' 1');
      if (Math.abs(p.x - bi.xB) < 1e-6) descr.push(R.bearing + ' 2');
      for (const el of active) {
        if (Math.abs(el.x - p.x) > 1e-6) continue;
        if (el.type === 'gear') {
          const bits = [`${R.gear} ${R.pitchD} ${N(el.d, 1)} mm`];
          if (el.helix > 0) bits.push(`${R.helix} ${N(el.helix, 1)}°`);
          bits.push(el.torque === 'out' ? R.tOut : el.torque === 'none' ? R.tNone : R.tIn);
          if (Math.abs(el.share - 1) > 1e-9) bits.push(`${R.share} ${N(el.share * 100, 0)} %`);
          bits.push(el.dirMode === 'mesh' ? `${R.mate} ${N(el.meshAngle, 0)}°` : R.manualDirs);
          descr.push(bits.join(', '));
        } else if (el.type === 'coupling') descr.push(`${R.coupling}, ${el.torque === 'out' ? R.tOut : R.tIn}`);
        else if (el.type === 'force') descr.push(`${R.force}: V ${N(el.Fv, 0)} N, H ${N(el.Fh, 0)} N, ${R.axial} ${N(el.Fa, 0)} N`);
      }
      rows.push([`<b>${p.name}</b>`, N(p.x, 1), descr.join(' · ')]);
    }
    body += H(R.s2) + reportTable([R.point, R.pos, R.descr], rows);
    const gearRows = beam.loads.filter(l => l.el.type === 'gear').map(l => [nameOf(l.el), N(l.MtEl, 1), N(l.Ft, 0), N(l.Fr, 0), N(l.FaMag, 0), N(l.Fv, 0), N(l.Fh, 0)]);
    if (gearRows.length) {
      body += `<h4>${R.forcesTitle}</h4>` + reportEq(['F_t = \\dfrac{2\\,M_t}{d},\\qquad F_r = \\dfrac{F_t \\tan\\theta}{\\cos\\alpha},\\qquad F_a = F_t \\tan\\alpha']) +
        reportTable([R.point, 'Mt [N·m]', 'Ft [N]', 'Fr [N]', 'Fa [N]', 'V [N]', 'H [N]'], gearRows);
      const views = beam.loads.filter(l => l.el.type === 'gear').map(l =>
        `<div class="gv">${reportSvgForPrint(shaftGearIsoView(l.el, bi, labels, active, MtShaft, t))}${reportSvgForPrint(shaftGearEndView(l.el, l.dirs, bi.rotation, t, nameOf(l.el)))}</div>`).join('');
      body += views;
    }

    // ---- 3. reactions and bearings
    const n1 = labels.bearing1, n2 = labels.bearing2, kN = v => N(v / 1000, 2);
    const brg = [[n1, beam.RA, 'shaftBearingCA'], [n2, beam.RB, 'shaftBearingCB']].map(([nm, Rr, cId]) => {
      const Creq = shaftBearingC(Rr.R, bi.life, bi.bearingType);
      const Ccat = shaftVal(cId, 0) * 1000;
      const lc = Ccat > 0 ? shaftBearingLife(Ccat, Rr.R, bi.bearingType, rpm) : null;
      return [`<b>${nm}</b>`, kN(Rr.V), kN(Rr.H), `<b>${kN(Rr.R)}</b>`, Rr.axial ? kN(Rr.axial) : '—', kN(Creq),
        lc ? `${N(Ccat / 1000, 1)} kN → ${N(lc.L, 1)}·10⁶${lc.hours ? ` (${N(lc.hours, 0)} h)` : ''}` : '—'];
    });
    body += H(R.s3) + reportTable([R.point, 'V [kN]', 'H [kN]', 'R [kN]', `${R.axial} [kN]`, `${R.req} [kN]`, R.lifeCat], brg) +
      reportEq([`C = R\\,L^{1/p}\\qquad \\left(p = 3\\ \\text{${R.ballW}},\\ p = \\tfrac{10}{3}\\ \\text{${R.rollerW}}\\right),\\qquad L = \\left(\\dfrac{C}{R}\\right)^{p}`,
        rpm > 0 ? `L_h = \\dfrac{L \\cdot 10^6}{60\\,n} = \\dfrac{${texNum(bi.life, 1)} \\cdot 10^6}{60 \\cdot ${texNum(rpm, 0)}} = ${texNum(bi.life * 1e6 / (60 * rpm), 0)}\\ \\text{h}` : '']);

    // ---- 4. diagrams (redrawn fresh from the beam)
    const chart = document.getElementById('shaftBeamChart');
    if (chart) {
      drawShaftBeamChart(beam, bi, shaftVal('shaftSecX', beam.critical.x), t);
      body += H(R.s4) + `<div class="fig">${reportSvgForPrint(chart.outerHTML)}</div>`;
    }

    // ---- 5. critical section
    const cr = beam.critical, crName = (labels.points.find(p => Math.abs(p.x - cr.x) < 1e-6) || {}).name;
    const xs = shaftVal('shaftSecX', cr.x), sc = shaftBeamSection(beam, xs);
    body += H(R.s5) + reportKV([
      [R.critAt, `x = ${N(cr.x, 1)} mm${crName ? ' (' + crName + ')' : ''} · Mf = ${N(cr.Mf, 1)} N·m · Mt = ${N(Math.abs(cr.T), 1)} N·m`],
      ['x', `${N(xs, 1)} mm → Mv = ${N(sc.Mv, 1)}, Mh = ${N(sc.Mh, 1)}, Mf = ${N(sc.Mf, 1)} N·m, Mt = ${N(Math.abs(sc.T), 1)} N·m, N = ${N(sc.N, 0)} N`]
    ]);
    const rs = typeof lastShaftRealSections !== 'undefined' && lastShaftRealSections && lastShaftRealSections.rows.length ? lastShaftRealSections : null;
    if (rs) {
      body += `<h4>${R.realSecs}</h4>` + reportTable(['x [mm]', 'd / D, r [mm]', 'Mf [N·m]', 'Mt [N·m]', 'Ke', 'X fat.', 'X snerv./yield'],
        rs.rows.map(r => ({ cls: r === rs.worst ? 'hl' : '', cells: [N(r.x, 1) + (r === rs.worst ? ` (${R.worst})` : ''),
          (r.D > r.d && r.r > 0 ? `Ø${N(r.d, 1)} / Ø${N(r.D, 1)}, r ${N(r.r, 1)}` : `Ø${N(r.d, 1)}`) + (r.keyway ? ` + ${R.keyway}` : ''),
          N(r.Mf, 1), N(r.Mt, 1), N(r.check.ke, 2), N(r.check.Xfatigue, 2), N(r.check.Xyield, 2)] })));
    }
  }

  // ---- 6. section design / check with substituted formulas
  const shoulder = notchType === 'shoulder' || notchType === 'combined';
  let res, d, D = null, des = null;
  if (mode === 'check') {
    d = Math.max(1, shaftVal('shaftDcheck', 65));
    let notch = inp.notch;
    if (shoulder) { D = Math.max(d, shaftVal('shaftDDcheck', d)); notch = { ...notch, Dd: D / d }; }
    res = shaftCheck({ ...inp, notch }, d);
  } else {
    des = shaftDesign(inp, Xreq);
    if (des.ok) { res = des.final; d = des.d; D = des.D; }
  }
  const L = inp.loads;
  const notchName = { shoulder: R.shoulder, keyway: R.keyway, combined: R.combined, manual: R.manualKe, none: R.none }[notchType] || notchType;
  body += H(mode === 'check' ? R.s6c : R.s6) + reportKV([
    [R.sectionUsed, `Mf = ${N(L.Mf, 1)} N·m · Mt = ${N(L.Mt, 1)} N·m · N = ${N(L.N, 0)} N`],
    [R.bendCycle + ' / ' + R.torsCycle, `${L.bendingCycle === 'static' ? R.staticL : R.rotating} / ${{ static: R.staticL, pulsating: R.pulsating, alternating: R.alternating }[L.torsionCycle]}`],
    [R.notch, notchName + (shoulder ? ` · D/d = ${N(inp.notch.Dd || (D && d ? D / d : 0), 2)}, r = ${N(inp.notch.r, 1)} mm` : '')]
  ]);
  if (res) {
    const fs = shaftFatigueStrength(inp.sigmaR, inp.sigmaLF, inp.cycles);
    const T = texNum, sb = res.sigmaBa || res.sigmaBm, sm = res.sigmaBm + res.sigmaN;
    const nom = [`\\sigma_f = \\dfrac{32\\,M_f}{\\pi\\, d^3} = \\dfrac{32 \\cdot ${T(L.Mf * 1000, 0)}}{\\pi \\cdot ${T(d, d % 1 ? 1 : 0)}^3} = ${T(sb, 2)}\\ \\text{MPa}`];
    if (L.Mt) nom.push(`\\tau = \\dfrac{16\\,M_t}{\\pi\\, d^3} = \\dfrac{16 \\cdot ${T(L.Mt * 1000, 0)}}{\\pi \\cdot ${T(d, d % 1 ? 1 : 0)}^3} = ${T(res.tauA + res.tauM, 2)}\\ \\text{MPa}\\qquad (\\tau_a = ${T(res.tauA, 2)},\\ \\tau_m = ${T(res.tauM, 2)})`);
    if (L.N) nom.push(`\\sigma_N = \\dfrac{N}{A} = \\dfrac{4\\,N}{\\pi\\, d^2} = ${T(res.sigmaN, 2)}\\ \\text{MPa}`);
    body += `<h4>${R.nominal}</h4>` + reportEq(nom);
    const cl = [];
    if (res.KtB !== undefined) cl.push(`K_e = q\\,(K_t - 1) + 1 = ${T(res.qB, 3)} \\cdot (${T(res.KtB, 3)} - 1) + 1 = ${T(res.shoulderKe || res.ke, 3)}\\qquad \\left(\\tfrac{r}{d} = ${T(res.rd, 4)},\\ \\tfrac{D}{d} = ${T(inp.notch.Dd || (D / d), 2)}\\right)`);
    if (res.keyKe && res.shoulderKe) cl.push(`K_e = K_{e,\\text{sp}} \\cdot k_{e,\\text{l}} = ${T(res.shoulderKe, 3)} \\cdot ${T(res.keyKe, 2)} = ${T(res.ke, 3)},\\qquad K_e' = ${T(res.shoulderKeT, 3)} \\cdot ${T(res.keyKeT, 2)} = ${T(res.keT, 3)}`);
    else cl.push(`K_e = ${T(res.ke, 3)},\\qquad K_e' = ${T(res.keT, 3)}`);
    cl.push(`b_1(${T(d, 0)}) = ${T(res.b1, 3)},\\qquad b_2 = ${T(res.b2, 3)}`);
    cl.push(fs.finite
      ? `\\sigma_N = \\sigma_R \\left(\\dfrac{10^3}{N}\\right)^{1/m} = ${T(inp.sigmaR, 0)} \\left(\\dfrac{10^3}{${T(inp.cycles, 0)}}\\right)^{1/${T(fs.m, 3)}} = ${T(res.sigmaNf, 1)}\\ \\text{MPa},\\qquad m = \\dfrac{3}{\\log(\\sigma_R/\\sigma_{LF})} = ${T(fs.m, 3)}`
      : `\\sigma_N = \\sigma_{LF} = ${T(res.sigmaNf, 0)}\\ \\text{MPa}`);
    body += `<h4>${R.coeffs}</h4>` + reportEq(cl);
    body += `<h4>${R.eqStress}</h4>` + reportEq([
      `\\sigma_{a,eq} = \\sqrt{(K_e\\,\\sigma_a)^2 + 3\\,(K_e'\\,\\tau_a)^2} = \\sqrt{(${T(res.ke, 3)} \\cdot ${T(res.sigmaBa, 2)})^2 + 3\\,(${T(res.keT, 3)} \\cdot ${T(res.tauA, 2)})^2} = ${T(res.sigmaAeq, 2)}\\ \\text{MPa}`,
      `\\sigma_{m,eq} = \\dfrac{\\sigma_m}{2} + \\sqrt{\\left(\\dfrac{\\sigma_m}{2}\\right)^2 + \\tau_m^2} = \\dfrac{${T(sm, 2)}}{2} + \\sqrt{\\left(\\dfrac{${T(sm, 2)}}{2}\\right)^2 + ${T(res.tauM, 2)}^2} = ${T(res.sigmaMeq, 2)}\\ \\text{MPa}`]);
    const okF = res.Xfatigue >= Xreq - 1e-9, okY = res.Xyield >= Xreq - 1e-9;
    const vMis = shaftStaticVonMises(inp, d);
    body += `<h4>${R.goodman} · ${R.yieldT}</h4>` + reportEq([
      `\\dfrac{1}{X} = \\dfrac{\\sigma_{a,eq}}{b_1\\, b_2\\, \\sigma_N} + \\dfrac{\\sigma_{m,eq}}{\\sigma_R} = \\dfrac{${T(res.sigmaAeq, 2)}}{${T(res.b1, 3)} \\cdot ${T(res.b2, 3)} \\cdot ${T(res.sigmaNf, 1)}} + \\dfrac{${T(res.sigmaMeq, 2)}}{${T(inp.sigmaR, 0)}} \\;\\Rightarrow\\; X = ${T(res.Xfatigue, 3)}`,
      `X = \\dfrac{\\sigma_s}{\\sigma_{a,eq} + \\sigma_{m,eq}} = \\dfrac{${T(inp.sigmaS, 0)}}{${T(res.sigmaAeq + res.sigmaMeq, 2)}} = ${T(res.Xyield, 3)}`]) +
      `<p class="small">${R.vonMises}:</p>` + reportEq([`\\sigma_{id} = \\sqrt{\\sigma^2 + 3\\,\\tau^2} = ${T(vMis.sigmaId, 2)}\\ \\text{MPa} \\;\\Rightarrow\\; X = \\dfrac{\\sigma_s}{\\sigma_{id}} = ${T(vMis.X, 2)}`]);
    let resBox = '';
    if (des && des.ok) resBox += `<div>${R.dMin}: <span class="big">d ≥ ${N(des.dMin, 1)} mm</span> (${R.governs} ${des.governing === 'yield' ? R.yieldG : R.fatigue})</div>` +
      `<div>${R.dChosen}: <span class="big">d = ${N(d, 0)} mm${D ? ` · D = ${N(D, 0)} mm` : ''}</span>${shoulder ? ` · r = ${N(inp.notch.r, 1)} mm` : ''}</div>`;
    else resBox += `<div>d = <span class="big">${N(d, 1)} mm</span>${D ? ` · D = ${N(D, 1)} mm` : ''}</div>`;
    resBox += `<div>X fatica / fatigue = <b>${N(res.Xfatigue, 2)}</b> <span class="${okF ? 'ok' : 'ko'}">${okF ? R.ok : R.ko}</span> · X snerv. / yield = <b>${N(res.Xyield, 2)}</b> <span class="${okY ? 'ok' : 'ko'}">${okY ? R.ok : R.ko}</span> (X ≥ ${N(Xreq, 2)})</div>`;
    body += `<div class="res">${resBox}</div>`;
    // Goodman diagram and sketch, redrawn for this result
    drawShaftGoodman(res, inp, Xreq, t);
    drawShaftSketch(d, D, shoulder ? inp.notch.r : null, notchType, t);
    const g = document.getElementById('shaftGoodmanChart'), k = document.getElementById('shaftSketch');
    if (g && k) body += `<div class="fig"><div class="row">${reportSvgForPrint(g.outerHTML)}${reportSvgForPrint(k.outerHTML)}</div></div>`;

    // ---- 7. life and maximum load (check mode)
    if (mode === 'check') {
      const chkInp = { ...inp, notch: shoulder ? { ...inp.notch, Dd: D / d } : inp.notch };
      const lambda = Math.min(res.Xfatigue, res.Xyield) / Xreq;
      const life = shaftLifeAtX(chkInp, d, Xreq);
      const kv = [[R.maxLoad, `× ${N(lambda, 3)} → Mf = ${N(L.Mf * lambda, 1)} N·m · Mt = ${N(L.Mt * lambda, 1)} N·m` +
        (torqueInput === 'power' ? ` · P = ${N(shaftVal('shaftPower', 0) * lambda, 2)} kW` : '')]];
      kv.push([R.lifeAtX, !life.feasible ? '—' : life.infinite ? R.infinite : `${N(life.N, 0)} ${R.cycles}${rpm > 0 ? ` = ${N(life.N / (60 * rpm), 0)} h` : ''} (σN = ${N(life.sigmaNreq, 1)} MPa)`]);
      const phases = [1, 2].map(i => ({ Mf: Math.abs(shaftVal('shaftPh' + i + 'Mf', 0)), Mt: Math.abs(shaftVal('shaftPh' + i + 'Mt', 0)), cycles: shaftVal('shaftPh' + i + 'N', 0) }))
        .filter(p => p.cycles > 0 && (p.Mf > 0 || p.Mt > 0));
      if (phases.length) {
        const manson = document.getElementById('shaftDamageRule')?.value === 'manson';
        const dm = manson ? shaftMansonDamage(chkInp, d, Xreq, phases) : shaftMinerDamage(chkInp, d, Xreq, phases);
        phases.forEach((p, i) => kv.push([`${R.phase} ${i + 1}`, `Mf = ${N(p.Mf, 1)} N·m · Mt = ${N(p.Mt, 1)} N·m · n = ${N(p.cycles, 0)}`]));
        kv.push([manson ? R.manson : R.miner, (manson ? `D_I = ${N(Math.min(dm.DI, 1), 3)} · D_II = ${N(dm.DII, 3)}` : `D = ${N(dm.D, 3)}`) +
          ` → ${R.remaining} ${N(dm.remaining, 0)} ${R.cycles}${rpm > 0 && Number.isFinite(dm.remaining) ? ` = ${N(dm.remaining / (60 * rpm), 0)} h` : ''}`]);
      }
      body += H(R.s7) + reportKV(kv);
    }

    // ---- 8. dimensions for CAD
    const cad = [];
    if (bi.L > 0) cad.push([R.length, `L = ${N(bi.L, 1)} mm`, '']);
    cad.push([`${R.bearing} 1 (${labels.bearing1})`, `x = ${N(bi.xA, 1)} mm`, '']);
    cad.push([`${R.bearing} 2 (${labels.bearing2})`, `x = ${N(bi.xB, 1)} mm`, '']);
    for (const el of active) cad.push([`${el.type === 'gear' ? R.gear : el.type === 'coupling' ? R.coupling : R.force} (${nameOf(el)})`,
      `x = ${N(el.x, 1)} mm${el.type === 'gear' ? ` · ${R.pitchD} ${N(el.d, 1)} mm` : ''}`, '']);
    cad.push([R.sectionUsed, `d = ${N(d, des ? 0 : 1)} mm${D ? ` · D = ${N(D, des ? 0 : 1)} mm` : ''}${shoulder ? ` · r = ${N(inp.notch.r, 1)} mm` : ''}`, notchName]);
    body += H(R.s8) + reportTable([R.cad, R.value, R.note], cad);
  }

  // ---- 9. assumptions
  body += H(R.s9) + '<ul>' + R.hyp.map(h => `<li>${reportTexify(h)}</li>`).join('') + '</ul>';

  calculateShafts();   // restore the app view (the report redrew some charts)
  reportLastShaft = d ? { d, D, mode, ok: !!res && res.Xfatigue >= Xreq - 1e-9 && res.Xyield >= Xreq - 1e-9 } : null;
  return reportShell(R.shaftTitle, mode === 'check' ? `${R.s6c} · d = ${N(d, 1)} mm` : (d ? `d = ${N(d, 0)} mm` : ''), body, R);
}

function openShaftReport() {
  reportOpen(buildShaftReportHtml());
}

function openReport() {
  const build = { shafts: buildShaftReportHtml, gears: buildGearReportHtml, belts: buildBeltReportHtml, fits: buildFitReportHtml, frames: typeof buildFrameReportHtml === 'function' ? buildFrameReportHtml : null }[activeModule];
  if (!build) return;
  // open the tab now (inside the click, so popup blockers allow it), fill it when the formula typesetter is ready
  const w = window.open('', '_blank');
  if (w && w.document) w.document.write('<p style="font-family:sans-serif;padding:20px">…</p>');
  reportLoadKatex().then(() => {
    const html = build();
    if (html) reportOpen(html, w);
    else if (w) w.close();
  });
}

// ---------------------------------------------------------------------------
// Gears report (design: Hertz → module and face width → Lewis; or capacity of an existing pair)
// ---------------------------------------------------------------------------
const REPORT_GEAR_TXT = {
  it: {
    title: 'Coppia di ruote dentate cilindriche — dimensionamento di massima',
    disclaimer: 'Dimensionamento di massima con il metodo del corso di Costruzione di Macchine (Hertz e Lewis, fattori dai diagrammi). I valori servono come prime quote per il CAD: il progetto esecutivo va verificato con ISO 6336, i dati del produttore delle ruote o un\'analisi FEM.', titleW: 'Coppia di ruote dentate cilindriche — potenza trasmissibile',
    spur: 'denti diritti', helical: 'denti elicoidali', type: 'Tipo di dentatura', s1: 'Dati di progetto', s2: 'Geometria della coppia',
    s3: 'Progetto a usura (Hertz)', s4: 'Verifica a flessione (Lewis)', s5: 'Combinazioni valutate dall\'ottimizzatore', s6: 'Quote per il CAD', s7: 'Ipotesi e note',
    s3w: 'Potenza limite a usura (Hertz)', s4w: 'Potenza limite a flessione (Lewis)', s5w: 'Potenza e coppia massime',
    power: 'Potenza', speed: 'Velocità del pignone', torque: 'Coppia sul pignone', ratio: 'Rapporto richiesto τ = z₁/z₂', center: 'Interasse richiesto',
    Ke: 'Coefficiente elastico della coppia Ke', sigmaH: 'Pressione di contatto ammissibile σH', sigmaL: 'Tensione di flessione ammissibile σL', xr: 'Correzione del pignone x₁',
    options: 'Opzioni', autoZ: 'z ottimizzati automaticamente', lockM: 'modulo imposto', lockL: 'larghezza di fascia imposta', none: 'nessuna',
    teeth: 'Numero di denti', module: 'Modulo', helixAngle: 'Angolo d\'elica α', pitch: 'Diametri primitivi', centerD: 'Interasse',
    face: 'Larghezza di fascia L', phi: 'ϕ = L/dp₁', undercut: 'Sottotaglio', ok: 'VERIFICATO', ko: 'NON VERIFICATO', inRange: 'nell\'intervallo consigliato 0,5–1,0', outRange: 'fuori dall\'intervallo consigliato 0,5–1,0',
    serie: 'Serie UNI', chosenM: 'Modulo unificato scelto', mmin: 'Modulo minimo (ϕ = 1)', combo: 'Combinazione', selected: 'scelta',
    item: 'Elemento', pinion: 'Pignone (1)', wheel: 'Ruota (2)', tip: 'Ø di testa', root: 'Ø di piede', limitedBy: 'Limitata da', hertz: 'usura (Hertz)', lewis: 'flessione (Lewis)',
    hyp: [
      'Angolo di pressione $\\theta = 20°$, dentatura normale (addendum $m$, dedendum $1{,}25\\,m$); il pignone è la ruota più sollecitata.',
      'Usura: pressione di Hertz sul primitivo, $W = \\frac{\\sigma_H^2\\, L\\, \\omega_1 \\sin 2\\theta\\; m^2 z_1^2}{8\\, K_e\\, (1 + \\tau)}$; il progetto fissa $\\phi = L/d_{p1}$ e ricava il modulo, poi la larghezza al modulo unificato.',
      'Flessione: formula di Lewis $\\sigma_L = \\frac{F_c}{L\\, m\\, y}$, con $y$ dal diagramma del corso ($z$ o $z$ equivalente per le elicoidali).',
      'Ruote elicoidali: fattori $\\Phi$, $\\Psi$, $\\Gamma_t$ dal diagramma del corso; $z_{eq} = z/\\cos^3\\alpha$.',
      'I risultati sono di massima: per il progetto esecutivo usare ISO 6336 (fattori di carico, velocità, lubrificazione, materiali).'
    ]
  },
  en: {
    title: 'Pair of cylindrical gears — preliminary sizing',
    disclaimer: 'Preliminary sizing with the method of the Machine Design course (Hertz and Lewis, factors from charts). The values are first dimensions for CAD: the final design must be checked with ISO 6336, the gear manufacturer\'s data or an FEM analysis.', titleW: 'Pair of cylindrical gears — power capacity',
    spur: 'spur', helical: 'helical', type: 'Tooth type', s1: 'Design data', s2: 'Pair geometry',
    s3: 'Pitting design (Hertz)', s4: 'Bending check (Lewis)', s5: 'Combinations evaluated by the optimizer', s6: 'Dimensions for CAD', s7: 'Assumptions and notes',
    s3w: 'Pitting power limit (Hertz)', s4w: 'Bending power limit (Lewis)', s5w: 'Maximum power and torque',
    power: 'Power', speed: 'Pinion speed', torque: 'Pinion torque', ratio: 'Required ratio τ = z₁/z₂', center: 'Required centre distance',
    Ke: 'Elastic coefficient of the pair Ke', sigmaH: 'Allowable contact pressure σH', sigmaL: 'Allowable bending stress σL', xr: 'Pinion profile shift x₁',
    options: 'Options', autoZ: 'teeth optimized automatically', lockM: 'module imposed', lockL: 'face width imposed', none: 'none',
    teeth: 'Number of teeth', module: 'Module', helixAngle: 'Helix angle α', pitch: 'Pitch diameters', centerD: 'Centre distance',
    face: 'Face width L', phi: 'ϕ = L/dp₁', undercut: 'Undercut', ok: 'VERIFIED', ko: 'NOT VERIFIED', inRange: 'in the recommended range 0.5–1.0', outRange: 'outside the recommended range 0.5–1.0',
    serie: 'UNI series', chosenM: 'Chosen standard module', mmin: 'Minimum module (ϕ = 1)', combo: 'Combination', selected: 'chosen',
    item: 'Item', pinion: 'Pinion (1)', wheel: 'Wheel (2)', tip: 'Tip Ø', root: 'Root Ø', limitedBy: 'Limited by', hertz: 'pitting (Hertz)', lewis: 'bending (Lewis)',
    hyp: [
      'Pressure angle $\\theta = 20°$, standard teeth (addendum $m$, dedendum $1.25\\,m$); the pinion is the most loaded gear.',
      'Pitting: Hertz pressure at the pitch point, $W = \\frac{\\sigma_H^2\\, L\\, \\omega_1 \\sin 2\\theta\\; m^2 z_1^2}{8\\, K_e\\, (1 + \\tau)}$; the design fixes $\\phi = L/d_{p1}$ and finds the module, then the face width at the standard module.',
      'Bending: Lewis formula $\\sigma_L = \\frac{F_c}{L\\, m\\, y}$, with $y$ from the course chart ($z$, or the equivalent $z$ for helical gears).',
      'Helical gears: factors $\\Phi$, $\\Psi$, $\\Gamma_t$ from the course chart; $z_{eq} = z/\\cos^3\\alpha$.',
      'The results are preliminary: for the final design use ISO 6336 (load, speed and lubrication factors, materials).'
    ]
  }
};

function buildGearReportHtml() {
  calculateGears();                                   // fresh state
  const R = REPORT_TXT[currentLang] || REPORT_TXT.en;
  const G = REPORT_GEAR_TXT[currentLang] || REPORT_GEAR_TXT.en;
  const N = reportNum, st = lastGearState;
  if (!st) return null;
  let body = '', sec = 0;
  const H = title => `<h3><span class="n">${++sec}.</span>${title}</h3>`;
  const sin2t = Math.sin(2 * GEAR_THETA);
  const chartSvg = () => { const c = document.getElementById('gearChart'); return c ? `<div class="fig">${reportSvgForPrint(c.outerHTML)}</div>` : ''; };
  const cadRows = (z1, z2, mn, mt, x1, L, alpha) => {
    const dp1 = mt * z1, dp2 = mt * z2;
    return reportTable([G.item, 'z', `${G.pitch.split(' ')[0]} dp [mm]`, `${G.tip} [mm]`, `${G.root} [mm]`], [
      [G.pinion, z1, N(dp1, 2), N(dp1 + 2 * mn * (1 + x1), 2), N(dp1 - 2 * mn * (1.25 - x1), 2)],
      [G.wheel, z2, N(dp2, 2), N(dp2 + 2 * mn, 2), N(dp2 - 2.5 * mn, 2)]
    ]) + reportKV([
      [G.module, alpha > 0 ? `mn = ${N(mn, 3)} mm · mt = ${N(mt, 3)} mm` : `m = ${N(mn, 3)} mm`],
      ...(alpha > 0 ? [[G.helixAngle, `${N(alpha, 2)}°`]] : []),
      [G.centerD, `${N(mt * ((z1 + z2) / 2 + x1), 2)} mm`], [G.face, `${N(L, 1)} mm → ${N(Math.ceil(L), 0)} mm`], ['x₁ / x₂', `${N(x1, 2)} / 0`]
    ]);
  };

  if (st.mode === 'wmax') {
    const p = st.params, r = st.r, hel = p.toothType === 'helical';
    const omega = 2 * Math.PI * p.n1 / 60, tau = p.z1 / p.z2;
    const cosA = Math.cos(p.alphaDeg * Math.PI / 180), mt = hel ? p.m_input / cosA : p.m_input;
    const f = hel ? getHelicalFactors(p.alphaDeg, p.z1, p.z2) : null;
    body += H(G.s1) + reportKV([
      [G.type, hel ? G.helical : G.spur], [G.module, hel ? `mn = ${N(p.m_input, 3)} mm (α = ${N(p.alphaDeg, 1)}°, mt = ${N(mt, 3)} mm)` : `m = ${N(p.m_input, 3)} mm`],
      [G.teeth, `z₁ = ${p.z1} · z₂ = ${p.z2} (τ = ${N(tau, 3)})`], [G.face, `L = ${N(p.L_mm, 1)} mm`], [G.speed, `n₁ = ${N(p.n1, 0)} rpm (ω₁ = ${N(omega, 2)} rad/s)`],
      [G.Ke, `${N(p.Ke_GPa, 1)} GPa`], [G.sigmaH, `${N(p.sigmaH_lim, 1)} MPa`], [G.sigmaL, `${N(p.sigmaL_lim, 1)} MPa`], [G.xr, N(p.xr1, 2)]
    ]);
    body += H(G.s2) + reportKV([[G.pitch, `dp₁ = ${N(r.dp1, 2)} mm · dp₂ = ${N(r.dp2, 2)} mm`], [G.centerD, `${N(r.a_center, 2)} mm`], [G.phi, N(r.phi, 3)]]) + chartSvg();
    const T = texNum;
    body += H(G.s3w) + reportEq([
      `W_H = \\dfrac{\\sigma_H^2\\, L\\, \\omega_1 \\sin 2\\theta\\; m_t^2\\, z_1^2}{8\\, K_e\\, (1 + \\tau)}${hel ? '\\cdot\\dfrac{\\Gamma_t}{\\Phi}' : ''}`,
      `\\phantom{W_H} = \\dfrac{${T(p.sigmaH_lim, 1)}^2 \\cdot ${T(p.L_mm, 1)} \\cdot ${T(omega, 2)} \\cdot ${T(sin2t, 4)} \\cdot ${T(mt, 3)}^2 \\cdot ${p.z1}^2}{8 \\cdot ${T(p.Ke_GPa * 1000, 0)} \\cdot ${T(1 + tau, 4)}}${hel ? `\\cdot\\dfrac{${T(f.Gamma_T, 3)}}{${T(f.Phi, 3)}}` : ''} = ${T(r.P_kW_H, 2)}\\ \\text{kW}`]);
    body += H(G.s4w) + reportEq([
      `y = ${T(r.yLewis, 3)}${hel ? `\\qquad \\left(z_{eq} = \\dfrac{z_1}{\\cos^3\\alpha} = ${T(p.z1 / Math.pow(cosA, 3), 1)}\\right)` : ''}`,
      `W_L = \\dfrac{\\sigma_L\\, \\omega_1\\, L\\, m_t\\, m_n\\, z_1\\, y}{2}${hel ? '\\cdot\\dfrac{\\Gamma_t}{\\Psi}' : ''} = \\dfrac{${T(p.sigmaL_lim, 0)} \\cdot ${T(omega, 2)} \\cdot ${T(p.L_mm, 1)} \\cdot ${T(mt, 3)} \\cdot ${T(p.m_input, 3)} \\cdot ${p.z1} \\cdot ${T(r.yLewis, 3)}}{2}${hel ? `\\cdot\\dfrac{${T(f.Gamma_T, 3)}}{${T(f.Psi, 3)}}` : ''} = ${T(r.P_kW_L, 2)}\\ \\text{kW}`]);
    body += H(G.s5w) + `<div class="res"><div>P max = <span class="big">${N(r.P_kW_max, 2)} kW</span> · M₁ max = <span class="big">${N(r.M1_max, 1)} N·m</span></div><div>${G.limitedBy} ${r.limitedBy === 'hertz' ? G.hertz : G.lewis} · Fc max = ${N(r.Fc_max, 0)} N</div></div>`;
    body += H(G.s6) + cadRows(p.z1, p.z2, p.m_input, mt, p.xr1, p.L_mm, hel ? p.alphaDeg : 0);
    body += H(G.s7) + '<ul>' + G.hyp.map(h => `<li>${reportTexify(h)}</li>`).join('') + '</ul>';
    return reportShell(G.titleW, `P max = ${N(r.P_kW_max, 2)} kW`, body, R, G.disclaimer);
  }

  const r = st.r, hel = st.gearType === 'helical', ld = st.load;
  const Ke = st.Ke_GPa * 1000, W = ld.W_watt * 1000;
  const opts = [st.isAutoZ && st.supportsAutoZ ? G.autoZ : '', st.isLockM ? `${G.lockM} (${N(st.lockedM, 2)} mm)` : '', st.isLockL ? `${G.lockL} (${N(st.lockedL, 1)} mm)` : ''].filter(Boolean);
  body += H(G.s1) + reportKV([
    [G.type, hel ? G.helical : G.spur],
    [G.power, `P = ${N(ld.W_watt / 1000, 2)} kW`], [G.speed, `n₁ = ${N(ld.n1_rpm, 0)} rpm (ω₁ = ${N(ld.omega1, 2)} rad/s)`], [G.torque, `M₁ = ${N(ld.M1_Nm, 1)} N·m`],
    [G.ratio, `${N(st.targetTau, 4)}`], ...(st.geomMode === 'center' ? [[G.center, `${N(st.targetI, 1)} mm`]] : []),
    [G.Ke, `${N(st.Ke_GPa, 1)} GPa`], [G.sigmaH, `${N(st.sigmaH_lim, 1)} MPa`], [G.xr, N(st.xr1, 2)], [G.options, opts.length ? opts.join(' · ') : G.none]
  ]);
  const unitOk = r.phiOk, lewOk = r.lewisOk;
  body += H(G.s2) + reportKV([
    [G.teeth, `z₁ = ${st.z1} · z₂ = ${st.z2} · τ = ${N(st.tau, 4)}`],
    [G.module, hel ? `mn = ${N(r.mn, 3)} mm · mt = ${N(r.mt, 3)} mm · α = ${N(r.alphaDeg, 2)}°` : `m = ${N(r.m_norm, 3)} mm (${G.serie} ${r.activeModuleObj.serie || '—'})`],
    [G.pitch, `dp₁ = ${N(r.dp1, 2)} mm · dp₂ = ${N(r.dp2, 2)} mm`], [G.centerD, `${N(r.a_center, 2)} mm`],
    [G.face, `L = ${N(r.L_face, 1)} mm · ϕ = ${N(r.phi, 3)} (${unitOk ? G.inRange : G.outRange})`],
    [G.undercut, `z${hel ? '_eq' : '₁'} = ${N(r.z_check, 1)} ${r.undercutOk ? '≥' : '<'} z_min = ${N(r.z_min, 1)} <span class="${r.undercutOk ? 'ok' : 'ko'}">${r.undercutOk ? G.ok : G.ko}</span>`]
  ]) + chartSvg();
  // Hertz
  const T = texNum, hz = [], hzTxt = [];
  if (!st.activeCombo && !st.isLockM) {
    hz.push(`m_{min}^3 = \\dfrac{8\\, K_e\\, W\\, (1 + \\tau)${hel ? '\\cdot 0{,}6' : ''}}{\\omega_1 \\sin 2\\theta\\; z_1^3\\, \\sigma_H^2} = \\dfrac{8 \\cdot ${T(Ke, 0)} \\cdot ${T(W, 0)} \\cdot ${T(1 + st.tau, 4)}${hel ? '\\cdot 0{,}6' : ''}}{${T(ld.omega1, 2)} \\cdot ${T(sin2t, 4)} \\cdot ${st.z1}^3 \\cdot ${T(st.sigmaH_lim, 1)}^2} \\;\\Rightarrow\\; m_{min} = ${T(r.m_min, 3)}\\ \\text{mm}\\quad (\\phi = 1)`);
  }
  hzTxt.push(`${G.chosenM}: <b>${hel ? `mn = ${N(r.mn, 3)} mm → mt = mn / cos α = ${N(r.mt, 3)} mm` : `m = ${N(r.m_norm, 3)} mm`}</b> (${G.serie} ${r.activeModuleObj.serie || '—'})`);
  const hz2 = [];
  if (!st.isLockL) hz2.push(`\\phi = \\dfrac{8\\, K_e\\, W\\, (1 + \\tau)}{\\omega_1 \\sin 2\\theta\\; z_1^3\\, ${hel ? 'm_t' : 'm'}^3\\, \\sigma_H^2}${hel ? '\\cdot\\dfrac{\\Phi}{\\Gamma_t}' : ''} = ${T(r.phi, 3)} \\;\\Rightarrow\\; L = \\phi\\, d_{p1} = ${T(r.phi, 3)} \\cdot ${T(r.dp1, 2)} = ${T(r.L_face, 1)}\\ \\text{mm}`);
  else hz2.push(`L = ${T(r.L_face, 1)}\\ \\text{mm} \\;\\Rightarrow\\; \\phi = \\dfrac{L}{d_{p1}} = ${T(r.phi, 3)}`);
  if (hel) hz2.push(`\\Phi = ${T(r.factors.Phi, 3)},\\qquad \\Psi = ${T(r.factors.Psi, 3)},\\qquad \\Gamma_t = \\Gamma_{t1} + \\Gamma_{t2} = ${T(r.factors.Gamma_T1, 3)} + ${T(r.factors.Gamma_T2, 3)} = ${T(r.factors.Gamma_T, 3)}`);
  body += H(G.s3) + (hz.length ? reportEq(hz) : '') + `<p>${hzTxt.join('')}</p>` + reportEq(hz2);
  // Lewis
  body += H(G.s4) + reportEq([
    `F_c = \\dfrac{2\\, M_1}{d_{p1}} = \\dfrac{2 \\cdot ${T(ld.M1_Nm * 1000, 0)}}{${T(r.dp1, 2)}} = ${T(r.Fc, 0)}\\ \\text{N}`,
    `y = ${T(r.yLewis, 3)}${hel ? `\\qquad \\left(z_{eq} = \\dfrac{z_1}{\\cos^3\\alpha} = ${T(r.z_check, 1)}\\right)` : ''}`,
    `\\sigma_L = \\dfrac{F_c}{L\\, m${hel ? '_n' : ''}\\, y}${hel ? '\\cdot\\dfrac{\\Psi}{\\Gamma_t}' : ''} = \\dfrac{${T(r.Fc, 0)}}{${T(r.L_face, 1)} \\cdot ${T(r.mn, 3)} \\cdot ${T(r.yLewis, 3)}}${hel ? `\\cdot\\dfrac{${T(r.factors.Psi, 3)}}{${T(r.factors.Gamma_T, 3)}}` : ''} = ${T(r.sigma_L, 1)}\\ \\text{MPa}`]) +
    `<div class="res"><div>σL = <span class="big">${N(r.sigma_L, 0)} MPa</span> ≤ 800 MPa <span class="${lewOk ? 'ok' : 'ko'}">${lewOk ? G.ok : G.ko}</span> · ϕ = <b>${N(r.phi, 2)}</b> (${unitOk ? G.inRange : G.outRange})</div></div>`;
  // optimizer table
  if (st.combos.length) {
    body += H(G.s5) + reportTable([G.combo, 'τ', 'err', G.module, G.centerD, 'ϕ (L)', 'σL [MPa]'], st.combos.map((c, i) => ({
      cls: i === st.selectedComboIdx ? 'hl' : '',
      cells: [`z₁ = ${c.z1}, z₂ = ${c.z2}${i === st.selectedComboIdx ? ` (${G.selected})` : ''}`, N(c.tau, 3), `±${N(c.err, 2)} %`,
        hel ? `mn ${N(c.m, 2)}, α ${N(c.alpha, 1)}°` : `m ${N(c.m, 2)}`, `${N(c.i, 1)} mm`, `${N(c.phi, 2)} (${N(c.L, 1)} mm)`, N(c.sigmaL, 0)]
    })));
  }
  body += H(G.s6) + cadRows(st.z1, st.z2, r.mn, r.mt, st.xr1, r.L_face, hel ? r.alphaDeg : 0);
  body += H(G.s7) + '<ul>' + G.hyp.map(h => `<li>${reportTexify(h)}</li>`).join('') + '</ul>';
  return reportShell(G.title, `z₁ = ${st.z1}, z₂ = ${st.z2}, ${hel ? 'mn' : 'm'} = ${N(r.mn, 2)} mm, L = ${N(r.L_face, 1)} mm`, body, R, G.disclaimer);
}

// ---------------------------------------------------------------------------
// Timing belts report
// ---------------------------------------------------------------------------
const REPORT_BELT_TXT = {
  it: {
    title: 'Trasmissione a cinghia sincrona — dimensionamento di massima', s1: 'Dati di progetto', s2: 'Pulegge e cinghia', s3: 'Interasse effettivo',
    s4: 'Denti in presa e angolo di avvolgimento', s5: 'Larghezza della cinghia', s6: 'Quote per il CAD e ordinazione', s7: 'Ipotesi e note',
    profile: 'Profilo', pitch: 'Passo p', power: 'Potenza', speed: 'Velocità puleggia motrice', c0: 'Fattore di servizio c₀', center0: 'Interasse desiderato',
    ratio: 'Rapporto τ = z₂/z₁', target: 'richiesto', pulley: 'Puleggia', driver: 'motrice (1)', driven: 'condotta (2)', teethW: 'denti', belt: 'Cinghia',
    widthReq: 'Larghezza minima', widthChosen: 'Larghezza scelta (catalogo)', ok: 'VERIFICATO', ko: 'NON VERIFICATO — serve un profilo più grande',
    tooSmall: 'Interasse troppo piccolo per queste pulegge: aumentalo.', mesh: 'Denti in presa sulla motrice', meshOk: '≥ 6: nessuna riduzione', meshKo: '< 6: capacità ridotta',
    order: 'Designazione per l\'ordine', od: 'Ø esterno e flange: dal catalogo del produttore',
    disclaimer: 'Dimensionamento di massima: geometria esatta, larghezza con una forza ammissibile media per profilo (valore indicativo). Per la scelta definitiva usare il catalogo del produttore della cinghia (tabelle di potenza, velocità, tensionamento).',
    hyp: [
      'Diametro primitivo $d_p = z\\,p/\\pi$; sviluppo primitivo $L_0 = 2C_0 + \\frac{\\pi}{2}(d_{p1} + d_{p2}) + \\frac{(d_{p2} - d_{p1})^2}{4C_0}$, arrotondato a un numero intero di denti.',
      'Interasse effettivo dalla soluzione esatta dell\'equazione dello sviluppo (cinghia tesa, rami rettilinei).',
      'Forza tangenziale $F_t = P_c/v$ con $P_c = c_0\\,P$; forza ammissibile per mm di larghezza media per profilo, corretta con $c_1$ (denti in presa) e $c_2$ (lunghezza).',
      'La larghezza è un valore indicativo: i cataloghi danno la potenza trasmissibile in funzione di velocità e numero di denti.'
    ]
  },
  en: {
    title: 'Synchronous belt drive — preliminary sizing', s1: 'Design data', s2: 'Pulleys and belt', s3: 'Actual centre distance',
    s4: 'Teeth in mesh and wrap angle', s5: 'Belt width', s6: 'Dimensions for CAD and ordering', s7: 'Assumptions and notes',
    profile: 'Profile', pitch: 'Pitch p', power: 'Power', speed: 'Driver pulley speed', c0: 'Service factor c₀', center0: 'Desired centre distance',
    ratio: 'Ratio τ = z₂/z₁', target: 'required', pulley: 'Pulley', driver: 'driver (1)', driven: 'driven (2)', teethW: 'teeth', belt: 'Belt',
    widthReq: 'Minimum width', widthChosen: 'Chosen width (catalog)', ok: 'VERIFIED', ko: 'NOT VERIFIED — a larger profile is needed',
    tooSmall: 'Centre distance too small for these pulleys: increase it.', mesh: 'Teeth in mesh on the driver', meshOk: '≥ 6: no reduction', meshKo: '< 6: reduced capacity',
    order: 'Ordering designation', od: 'Outside Ø and flanges: from the manufacturer\'s catalog',
    disclaimer: 'Preliminary sizing: exact geometry, width from an average allowable force per profile (indicative). For the final choice use the belt manufacturer\'s catalog (power ratings, speed, tensioning).',
    hyp: [
      'Pitch diameter $d_p = z\\,p/\\pi$; pitch length $L_0 = 2C_0 + \\frac{\\pi}{2}(d_{p1} + d_{p2}) + \\frac{(d_{p2} - d_{p1})^2}{4C_0}$, rounded to a whole number of teeth.',
      'Actual centre distance from the exact solution of the length equation (taut belt, straight spans).',
      'Tangential force $F_t = P_c/v$ with $P_c = c_0\\,P$; allowable force per mm of width averaged per profile, corrected with $c_1$ (teeth in mesh) and $c_2$ (length).',
      'The width is indicative: catalogs give the transmissible power as a function of speed and number of teeth.'
    ]
  }
};

function buildBeltReportHtml() {
  calculateBelts();
  const R = REPORT_TXT[currentLang] || REPORT_TXT.en, B = REPORT_BELT_TXT[currentLang] || REPORT_BELT_TXT.en, N = reportNum;
  const sel = document.getElementById('beltProfile'), profKey = sel.value, profName = sel.options[sel.selectedIndex].text;
  const z1 = parseInt(document.getElementById('pulleyZ1').value) || 20;
  let z2, tauInfo = '';
  if (currentRatioMethod === 'teeth') z2 = parseInt(document.getElementById('pulleyZ2').value) || 40;
  else { const tt = parseFloat(document.getElementById('targetTau').value) || 2; const q = beltZ2FromTau(z1, tt); z2 = q.z2; tauInfo = ` (${B.target} ${N(tt, 3)}, Δ ${N(q.errPct, 1)} %)`; }
  const c0In = parseFloat(document.getElementById('desiredCenter').value) || 150, C0 = currentUnit === 'metric' ? c0In : c0In * 25.4;
  const P = parseFloat(document.getElementById('motorPower').value) || 1.5, n1 = parseFloat(document.getElementById('driverSpeed').value) || 1500;
  const c0 = parseFloat(document.getElementById('serviceFactor').value) || 1.5;
  const r = computeBelts({ profKey, z1, z2, C0_mm: C0, P_kW: P, n1_rpm: n1, c0 });
  const power = currentBeltMode !== 'geom';
  let body = '', sec = 0;
  const H = title => `<h3><span class="n">${++sec}.</span>${title}</h3>`;
  body += H(B.s1) + reportKV([
    [B.profile, reportEsc(profName)], [B.pitch, `${N(r.p, 2)} mm`], [B.ratio, `${N(r.ratio, 3)}${tauInfo}`], [B.center0, `C₀ = ${N(C0, 1)} mm`],
    ...(power ? [[B.power, `P = ${N(P, 2)} kW`], [B.speed, `n₁ = ${N(n1, 0)} rpm`], [B.c0, N(c0, 2)]] : [])
  ]);
  body += H(B.s2) + reportTable([B.pulley, 'z', 'dp = z·p/π [mm]'], [[B.driver, z1, N(r.dp1, 2)], [B.driven, z2, N(r.dp2, 2)]]);
  if (!r.valid) {
    body += `<div class="res ko">${B.tooSmall}</div>`;
    return reportShell(B.title, reportEsc(profName), body, R, B.disclaimer);
  }
  const T = texNum, L0 = 2 * C0 + Math.PI / 2 * (r.dp1 + r.dp2) + Math.pow(r.dp2 - r.dp1, 2) / (4 * C0);
  body += reportEq([
    `L_0 = 2\\,C_0 + \\dfrac{\\pi}{2}\\,(d_{p1} + d_{p2}) + \\dfrac{(d_{p2} - d_{p1})^2}{4\\,C_0} = 2 \\cdot ${T(C0, 1)} + \\dfrac{\\pi}{2}\\,(${T(r.dp1, 2)} + ${T(r.dp2, 2)}) + \\dfrac{(${T(r.dp2, 2)} - ${T(r.dp1, 2)})^2}{4 \\cdot ${T(C0, 1)}} = ${T(L0, 2)}\\ \\text{mm}`,
    `z_b = \\dfrac{L_0}{p} = ${T(L0 / r.p, 2)} \\;\\to\\; ${r.zb} \\;\\Rightarrow\\; L_p = z_b\\, p = ${T(r.Lp, 1)}\\ \\text{mm}`]);
  const Bq = 4 * r.Lp - 2 * Math.PI * (r.dp1 + r.dp2);
  body += H(B.s3) + reportEq([
    `C = \\dfrac{B + \\sqrt{B^2 - 32\\,(d_{p2} - d_{p1})^2}}{16},\\qquad B = 4\\,L_p - 2\\pi\\,(d_{p1} + d_{p2}) = ${T(Bq, 2)}\\ \\text{mm}`,
    `C = ${T(r.exactC_mm, 2)}\\ \\text{mm}\\qquad (\\Delta = ${T(r.cDiff, 2)}\\ \\text{mm})`]);
  const ch = document.getElementById('beltChart');
  if (ch) body += `<div class="fig">${reportSvgForPrint(ch.outerHTML)}</div>`;
  body += H(B.s4) + reportKV([
    ['β₁', reportTex(`\\beta_1 = \\pi - 2 \\arcsin\\dfrac{d_{p2} - d_{p1}}{2\\,C} = ${T(r.wrapDeg1, 1)}^\\circ`, false)],
    [B.mesh, reportTex(`z_1\\,\\dfrac{\\beta_1}{360^\\circ} = ${T(r.z_mesh, 1)}`, false) + ` (${r.meshOk ? B.meshOk : B.meshKo}, c₁ = ${N(r.c1, 2)})`]
  ]);
  if (power) {
    body += H(B.s5) + reportEq([
      `v = \\dfrac{\\pi\\, d_{p1}\\, n_1}{60\\,000} = \\dfrac{\\pi \\cdot ${T(r.dp1, 2)} \\cdot ${T(n1, 0)}}{60\\,000} = ${T(r.beltSpeed, 2)}\\ \\text{m/s}`,
      `P_c = c_0\\, P = ${T(c0, 2)} \\cdot ${T(P, 2)} = ${T(r.Pc_kW, 2)}\\ \\text{kW} \\;\\Rightarrow\\; F_t = \\dfrac{P_c}{v} = ${T(r.Ft, 0)}\\ \\text{N}`,
      `F_{amm} = f_0\\, c_1\\, c_2 = ${T(baseAllowableForce[profKey] || 20, 1)} \\cdot ${T(r.c1, 2)} \\cdot ${T(r.c2, 2)}\\ \\text{N/mm} \\;\\Rightarrow\\; b_{min} = \\dfrac{F_t}{F_{amm}} = ${T(r.reqWidthMm, 1)}\\ \\text{mm}`]) +
      `<div class="res"><div>${B.widthChosen}: <span class="big">${r.chosenWidth} mm</span> <span class="${r.widthOk ? 'ok' : 'ko'}">${r.widthOk ? B.ok : B.ko}</span></div></div>`;
  }
  body += H(B.s6) + reportKV([
    [`${B.pulley} ${B.driver}`, `z₁ = ${z1} · dp₁ = ${N(r.dp1, 2)} mm`], [`${B.pulley} ${B.driven}`, `z₂ = ${z2} · dp₂ = ${N(r.dp2, 2)} mm`],
    ['C', `${N(r.exactC_mm, 2)} mm`], [B.belt, `Lp = ${N(r.Lp, 1)} mm · ${r.zb} ${B.teethW}${power ? ` · b = ${r.chosenWidth} mm` : ''}`],
    [B.order, `${reportEsc(profName.split(' (')[0])} · ${N(r.Lp, 0)} mm · ${r.zb} ${B.teethW}${power ? ` · ${r.chosenWidth} mm` : ''}`], ['Ø', B.od]
  ]);
  body += H(B.s7) + '<ul>' + B.hyp.map(h => `<li>${reportTexify(h)}</li>`).join('') + '</ul>';
  return reportShell(B.title, `${reportEsc(profName)} · z₁ = ${z1}, z₂ = ${z2} · C = ${N(r.exactC_mm, 1)} mm`, body, R, B.disclaimer);
}

// ---------------------------------------------------------------------------
// ISO fits report
// ---------------------------------------------------------------------------
const REPORT_FIT_TXT = {
  it: {
    title: 'Accoppiamento albero-foro ISO 286 — sistema foro base H7', s1: 'Dati', s2: 'Scostamenti e dimensioni limite', s3: 'Giochi e natura dell\'accoppiamento',
    s4: 'Lavorazioni e rugosità', s5: 'Confronto con gli altri accoppiamenti H7', s6: 'Quote per il disegno', s7: 'Note',
    d: 'Diametro nominale', step: 'Scaglione ISO 286', fit: 'Accoppiamento', hole: 'Foro', shaft: 'Albero', es: 'Scost. sup.', ei: 'Scost. inf.', it: 'Tolleranza',
    dmax: 'Dim. max', dmin: 'Dim. min', playMax: 'Gioco max', playMin: 'Gioco min', kind: 'Natura', clearance: 'con gioco', interference: 'con interferenza', transition: 'incerto',
    proc: 'Lavorazione', ra: 'Rugosità', mean: 'Gioco medio', reverse: 'Scelto con la ricerca inversa: gioco desiderato', drawing: 'Indicazione a disegno',
    disclaimer: 'Valori da ISO 286-2 per lo scaglione del diametro nominale (3–500 mm). Per accoppiamenti con interferenza verificare anche pressione di calettamento e tensioni (Lamé), e le condizioni di montaggio.',
    notes: ['Sistema foro base: foro H7 (EI = 0, ES = IT7), l\'albero porta la posizione della tolleranza.', 'Gioco = dimensione del foro − dimensione dell\'albero; un gioco negativo è un\'interferenza.', 'Lavorazioni e rugosità sono indicazioni tipiche per la classe di tolleranza.']
  },
  en: {
    title: 'Shaft-hole fit ISO 286 — hole-basis system H7', s1: 'Data', s2: 'Deviations and limit sizes', s3: 'Clearances and type of fit',
    s4: 'Machining and roughness', s5: 'Comparison with the other H7 fits', s6: 'Drawing callouts', s7: 'Notes',
    d: 'Nominal diameter', step: 'ISO 286 size range', fit: 'Fit', hole: 'Hole', shaft: 'Shaft', es: 'Upper dev.', ei: 'Lower dev.', it: 'Tolerance',
    dmax: 'Max size', dmin: 'Min size', playMax: 'Max clearance', playMin: 'Min clearance', kind: 'Type', clearance: 'clearance', interference: 'interference', transition: 'transition',
    proc: 'Machining', ra: 'Roughness', mean: 'Mean clearance', reverse: 'Chosen by the reverse lookup: desired clearance', drawing: 'Drawing callout',
    disclaimer: 'Values from ISO 286-2 for the size range of the nominal diameter (3–500 mm). For interference fits also check the fit pressure and stresses (Lamé) and the assembly conditions.',
    notes: ['Hole-basis system: hole H7 (EI = 0, ES = IT7), the shaft carries the tolerance position.', 'Clearance = hole size − shaft size; a negative clearance is an interference.', 'Machining and roughness are typical indications for the tolerance grade.']
  }
};

function buildFitReportHtml() {
  calculateFits();
  const R = REPORT_TXT[currentLang] || REPORT_TXT.en, F = REPORT_FIT_TXT[currentLang] || REPORT_FIT_TXT.en, N = reportNum;
  const t = translations[currentLang];
  const dIn = parseFloat(document.getElementById('nominalDiameter').value), d = currentUnit === 'metric' ? dIn : dIn * 25.4;
  if (!isFitDiameterValid(d)) return null;
  const step = findIsoStep(d), fit = document.getElementById('fitType').value, a = analyzeFit(step, fit);
  const um = v => `${v > 0 ? '+' : ''}${N(v, v % 1 ? 1 : 0)} µm`, mm = v => N(v, 3);
  const kindTxt = F[a.kind];
  let body = '', sec = 0;
  const H = title => `<h3><span class="n">${++sec}.</span>${title}</h3>`;
  const rev = currentMode === 'reverse' ? [[F.reverse, `${document.getElementById('reverseTargetVal').value} µm (${document.getElementById('reverseFitNature').value})`]] : [];
  body += H(F.s1) + reportKV([[F.d, `Ø ${N(d, 2)} mm`], [F.step, `${step.min} – ${step.max} mm`], [F.fit, `${fit} — ${reportEsc(t.fits[fit].label)}`], ...rev]);
  const itS = a.devs.es - a.devs.ei;
  body += H(F.s2) + reportTable(['', F.es, F.ei, F.it, F.dmax, F.dmin], [
    [`${F.hole} H7`, um(a.ES_H), um(a.EI_H), `${N(a.ES_H - a.EI_H, 0)} µm`, mm(d + a.ES_H / 1000), mm(d + a.EI_H / 1000)],
    [`${F.shaft} ${a.shaftClass}`, um(a.devs.es), um(a.devs.ei), `${N(itS, 0)} µm`, mm(d + a.devs.es / 1000), mm(d + a.devs.ei / 1000)]
  ]);
  const ch = document.getElementById('toleranceChart');
  if (ch) body += `<div class="fig">${reportSvgForPrint(ch.outerHTML)}</div>`;
  const T = texNum;
  body += H(F.s3) + reportEq([
    `G_{max} = ES - ei = ${T(a.ES_H, 1)} - (${T(a.devs.ei, 1)}) = ${T(a.maxPlay, 1)}\\ \\mu\\text{m}`,
    `G_{min} = EI - es = ${T(a.EI_H, 1)} - (${T(a.devs.es, 1)}) = ${T(a.minPlay, 1)}\\ \\mu\\text{m}`,
    `G_{med} = \\dfrac{G_{max} + G_{min}}{2} = ${T((a.maxPlay + a.minPlay) / 2, 1)}\\ \\mu\\text{m}`]) +
    `<div class="res"><div>${F.kind}: <span class="big">${kindTxt}</span> · ${F.playMin} ${um(a.minPlay)} · ${F.playMax} ${um(a.maxPlay)}</div></div>`;
  body += H(F.s4) + reportTable(['', F.proc, F.ra], [[F.hole, reportEsc(t.fits[fit].holeProc), fitsRa[fit].holeRa], [F.shaft, reportEsc(t.fits[fit].shaftProc), fitsRa[fit].shaftRa]]);
  body += H(F.s5) + reportTable([F.fit, F.playMin, F.playMax, F.kind], fitKeys.map(k => { const b = analyzeFit(step, k); return { cls: k === fit ? 'hl' : '', cells: [k, um(b.minPlay), um(b.maxPlay), F[b.kind]] }; }));
  const sgn = v => (v >= 0 ? '+' : '−') + N(Math.abs(v) / 1000, 3);
  body += H(F.s6) + reportKV([
    [`${F.hole}`, `Ø${N(d, d % 1 ? 2 : 0)} H7 (${sgn(a.ES_H)} / ${sgn(a.EI_H)})`], [`${F.shaft}`, `Ø${N(d, d % 1 ? 2 : 0)} ${a.shaftClass} (${sgn(a.devs.es)} / ${sgn(a.devs.ei)})`],
    [F.drawing, `Ø${N(d, d % 1 ? 2 : 0)} ${fit}`]
  ]);
  body += H(F.s7) + '<ul>' + F.notes.map(h => `<li>${reportTexify(h)}</li>`).join('') + '</ul>';
  return reportShell(F.title, `Ø${N(d, 2)} ${fit} · ${kindTxt}`, body, R, F.disclaimer);
}
