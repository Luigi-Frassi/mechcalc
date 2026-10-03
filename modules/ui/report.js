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
    reopen: 'Riapri questo calcolo', generated: 'Generata con MechCalc',
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
    bearingFormula: 'C = R · L^(1/p), p = 3 (sfere) o 10/3 (rulli); con C di catalogo L = (C/R)^p',
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
      'Albero su due appoggi (cuscinetti) in due piani ortogonali V e H; momento risultante Mf = √(Mv² + Mh²).',
      'Forze delle ruote applicate nel punto di contatto; la forza assiale delle ruote elicoidali genera una coppia concentrata Fa·r.',
      'Fatica: σa,eq = √((Ke σa)² + 3(Ke\' τa)²), σm,eq = σm/2 + √((σm/2)² + τm²); Goodman σa,eq/(b₁b₂σN) + σm,eq/σR = 1/X.',
      'Kt dalla formula B·(r/d)^a del corso, q dalla formula di Neuber (coincide con i diagrammi), Ke = q(Kt − 1) + 1; b₁ e b₂ dai diagrammi del corso.',
      'Vita finita: retta di Wöhler tra σR a 10³ e σLF a 10⁶ cicli.'
    ]
  },
  en: {
    docTitle: 'Calculation report', shaftTitle: 'Transmission shaft — preliminary sizing',
    project: 'Project', author: 'Author', date: 'Date', clickToEdit: 'click to edit',
    printBtn: 'Print / Save as PDF', htmlBtn: 'Download HTML', printHint: 'In the print dialog choose “Save as PDF”. The yellow fields can be edited before printing.',
    reopen: 'Reopen this calculation', generated: 'Generated with MechCalc',
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
    bearingFormula: 'C = R · L^(1/p), p = 3 (ball) or 10/3 (roller); with a catalog C, L = (C/R)^p',
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
      'Shaft on two supports (bearings) in two orthogonal planes V and H; resultant moment Mf = √(Mv² + Mh²).',
      'Gear forces applied at the mesh point; the axial force of helical gears adds a concentrated couple Fa·r.',
      'Fatigue: σa,eq = √((Ke σa)² + 3(Ke\' τa)²), σm,eq = σm/2 + √((σm/2)² + τm²); Goodman σa,eq/(b₁b₂σN) + σm,eq/σR = 1/X.',
      'Kt from the course formula B·(r/d)^a, q from Neuber\'s formula (it matches the charts), Ke = q(Kt − 1) + 1; b₁ and b₂ from the course charts.',
      'Finite life: Wöhler line between σR at 10³ and σLF at 10⁶ cycles.'
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

// The app draws its SVGs for a dark background: map the light strokes/texts to dark ones for white paper
function reportSvgForPrint(svgHtml) {
  const map = {
    '#cbd5e1': '#334155', '#e2e8f0': '#0f172a', '#94a3b8': '#475569', '#64748b': '#64748b', '#475569': '#94a3b8', '#334155': '#cbd5e1',
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
  body { font-family: "Inter", "Helvetica Neue", Arial, sans-serif; color: #0f172a; font-size: 10.5pt; line-height: 1.45; margin: 0; background: #f1f5f9; }
  .page { max-width: 190mm; margin: 0 auto; background: #fff; padding: 14mm 12mm; }
  .toolbar { position: sticky; top: 0; z-index: 5; background: #0f172a; color: #e2e8f0; padding: 10px 16px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; font-size: 13px; }
  .toolbar button { background: #2563eb; color: #fff; border: 0; border-radius: 6px; padding: 7px 14px; font-weight: 600; cursor: pointer; font-size: 13px; }
  .toolbar button.sec { background: #334155; }
  .toolbar span { color: #94a3b8; }
  header.rep { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 14px; }
  header.rep .brand { font-size: 9pt; letter-spacing: .08em; text-transform: uppercase; color: #2563eb; font-weight: 700; }
  header.rep h1 { font-size: 17pt; margin: 2px 0 2px; }
  header.rep h2 { font-size: 11pt; margin: 0 0 8px; color: #475569; font-weight: 500; }
  .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 16px; font-size: 9.5pt; }
  .meta b { color: #475569; font-weight: 600; margin-right: 4px; }
  [contenteditable] { background: #fef9c3; padding: 0 3px; border-radius: 2px; outline: none; }
  h3 { font-size: 12pt; margin: 18px 0 6px; padding-bottom: 3px; border-bottom: 1px solid #cbd5e1; break-after: avoid; }
  h3 .n { color: #2563eb; margin-right: 6px; }
  h4 { font-size: 10.5pt; margin: 10px 0 4px; color: #334155; break-after: avoid; }
  table { border-collapse: collapse; width: 100%; margin: 4px 0 8px; font-size: 9.5pt; break-inside: avoid; }
  th, td { border: 1px solid #cbd5e1; padding: 3px 6px; text-align: left; vertical-align: top; }
  thead th { background: #f1f5f9; font-weight: 600; }
  table.kv th { width: 42%; background: #f8fafc; font-weight: 500; color: #334155; }
  tr.hl td { background: #fff1f2; font-weight: 600; }
  .f { font-family: "JetBrains Mono", Consolas, monospace; font-size: 9.3pt; background: #f8fafc; border-left: 3px solid #2563eb; padding: 5px 8px; margin: 4px 0; white-space: pre-wrap; break-inside: avoid; }
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
  footer.rep a { color: #2563eb; word-break: break-all; }
  ul { margin: 4px 0 8px 18px; padding: 0; }
  @media print { body { background: #fff; } .toolbar { display: none; } .page { padding: 0; max-width: none; } a { color: inherit; } }
  `;
}

function reportShell(title, subtitle, body, R) {
  const today = new Date().toLocaleDateString(currentLang === 'it' ? 'it-IT' : 'en-GB');
  let link = '';
  try { link = typeof shareUrl === 'function' ? shareUrl() : window.location.href; } catch (e) { link = window.location.href; }
  return `<!doctype html><html lang="${currentLang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${reportEsc(R.docTitle)} — ${reportEsc(subtitle)}</title><style>${reportCSS()}</style></head><body>
<div class="toolbar"><button onclick="window.print()">🖨 ${R.printBtn}</button>
<button class="sec" onclick="(function(){var h='<!doctype html>'+document.documentElement.outerHTML;var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([h],{type:'text/html'}));a.download='relazione-mechcalc.html';a.click();})()">⬇ ${R.htmlBtn}</button>
<span>${R.printHint}</span></div>
<div class="page">
<header class="rep"><div class="brand">MechCalc · ${R.docTitle}</div><h1>${reportEsc(title)}</h1><h2>${reportEsc(subtitle)}</h2>
<div class="meta"><div><b>${R.project}:</b><span contenteditable="true" title="${R.clickToEdit}">—</span></div>
<div><b>${R.author}:</b><span contenteditable="true" title="${R.clickToEdit}">—</span></div><div><b>${R.date}:</b>${today}</div></div></header>
${body}
<footer class="rep"><p>${R.disclaimer}</p><p>${R.generated} · <a href="${reportEsc(link)}">${R.reopen} ↗</a> <span class="small">(${reportEsc(link.split('?')[0])})</span></p></footer>
</div></body></html>`;
}

function reportOpen(html) {
  const w = window.open('', '_blank');
  if (w && w.document) { w.document.open(); w.document.write(html); w.document.close(); return true; }
  // popup blocked: download the report instead
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  a.download = 'relazione-mechcalc.html';
  document.body.appendChild(a); a.click(); a.remove();
  return false;
}

// ---------------------------------------------------------------------------
// Shafts report
// ---------------------------------------------------------------------------
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
      body += `<h4>${R.forcesTitle}</h4><div class="f">${R.formulaGear}</div>` +
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
      `<div class="f">${R.bearingFormula}${rpm > 0 ? `\nL = ${N(bi.life, 1)}·10⁶ = ${N(bi.life * 1e6 / (60 * rpm), 0)} h @ ${N(rpm, 0)} rpm` : ''}</div>`;

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
    const lines = [];
    lines.push(`σf = 32·Mf/(π·d³) = 32·${N(L.Mf * 1000, 0)}/(π·${N(d, 1)}³) = ${N(res.sigmaBa || res.sigmaBm, 2)} MPa`);
    if (L.Mt) lines.push(`τ = 16·Mt/(π·d³) = 16·${N(L.Mt * 1000, 0)}/(π·${N(d, 1)}³) = ${N(res.tauA + res.tauM, 2)} MPa  (τa = ${N(res.tauA, 2)}, τm = ${N(res.tauM, 2)})`);
    if (L.N) lines.push(`σN = N/A = ${N(res.sigmaN, 2)} MPa`);
    body += `<h4>${R.nominal}</h4><div class="f">${lines.join('\n')}</div>`;
    const cl = [];
    if (res.KtB !== undefined) cl.push(`Kt = ${N(res.KtB, 3)} (r/d = ${N(res.rd, 4)}) · q = ${N(res.qB, 3)} → Ke,sp = q·(Kt − 1) + 1 = ${N(res.shoulderKe || res.ke, 3)}`);
    if (res.keyKe) cl.push(`ke ${R.keyway} = ${N(res.keyKe, 2)} / ke' = ${N(res.keyKeT, 2)}`);
    cl.push(`Ke = ${N(res.ke, 3)} · Ke' = ${N(res.keT, 3)} · b₁(${N(d, 0)}) = ${N(res.b1, 3)} · b₂ = ${N(res.b2, 3)}`);
    cl.push(fs.finite ? `σN = σR·(10³/N)^(1/m) = ${N(res.sigmaNf, 1)} MPa  (m = 3/log(σR/σLF) = ${N(fs.m, 3)})` : `σN = σLF = ${N(res.sigmaNf, 0)} MPa`);
    body += `<h4>${R.coeffs}</h4><div class="f">${cl.join('\n')}</div>`;
    body += `<h4>${R.eqStress}</h4><div class="f">σa,eq = √((Ke·σa)² + 3·(Ke'·τa)²) = ${N(res.sigmaAeq, 2)} MPa\nσm,eq = σm/2 + √((σm/2)² + τm²) = ${N(res.sigmaMeq, 2)} MPa</div>`;
    const okF = res.Xfatigue >= Xreq - 1e-9, okY = res.Xyield >= Xreq - 1e-9;
    const vMis = shaftStaticVonMises(inp, d);
    body += `<h4>${R.goodman} · ${R.yieldT}</h4><div class="f">1/X = σa,eq/(b₁·b₂·σN) + σm,eq/σR = ${N(res.sigmaAeq, 2)}/(${N(res.b1, 3)}·${N(res.b2, 3)}·${N(res.sigmaNf, 1)}) + ${N(res.sigmaMeq, 2)}/${N(inp.sigmaR, 0)}  →  X = ${N(res.Xfatigue, 3)}\nX = σs/(σa,eq + σm,eq) = ${N(inp.sigmaS, 0)}/${N(res.sigmaAeq + res.sigmaMeq, 2)} = ${N(res.Xyield, 3)}\n${R.vonMises}: σid = √(σ² + 3τ²) = ${N(vMis.sigmaId, 2)} MPa → X = ${N(vMis.X, 2)}</div>`;
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
  body += H(R.s9) + '<ul>' + R.hyp.map(h => `<li>${h}</li>`).join('') + '</ul>';

  calculateShafts();   // restore the app view (the report redrew some charts)
  return reportShell(R.shaftTitle, mode === 'check' ? `${R.s6c} · d = ${N(d, 1)} mm` : (d ? `d = ${N(d, 0)} mm` : ''), body, R);
}

function openShaftReport() {
  reportOpen(buildShaftReportHtml());
}

function openReport() {
  if (activeModule === 'shafts') openShaftReport();
}
