// ============================================================================
// COMPLETE TRANSMISSION REPORT
// One document for the whole drive: motor -> timing belt -> gear pair -> shaft -> fits.
// Chapter 1 is the power flow (block diagram, speed and torque of every stage) with the
// consistency checks between modules; then one chapter per module, built by the module reports.
// ============================================================================

const REPORT_TX_TXT = {
  it: {
    title: 'Trasmissione completa — dimensionamento di massima', menuThis: 'Relazione di questo modulo', menuTx: 'Relazione della trasmissione completa',
    pick: 'Moduli da includere', generate: 'Genera relazione', none: 'Seleziona almeno un modulo.',
    mods: { belts: 'Cinghia sincrona', gears: 'Ruote dentate', shafts: 'Albero', fits: 'Accoppiamenti ISO' },
    toc: 'Indice', ch0: 'Schema della trasmissione e flusso di potenza', summary: 'Riepilogo dei risultati', open: 'Apri questo calcolo',
    motor: 'Motore', stage: 'Stadio', nIn: 'n ingresso [rpm]', nOut: 'n uscita [rpm]', Pw: 'P [kW]', Min: 'M ingresso [N·m]', Mout: 'M uscita [N·m]', ratio: 'Rapporto',
    checks: 'Coerenza tra i moduli', ok: 'coerente', warn: 'da controllare', result: 'Risultato principale',
    beltGear: (nb, ng) => `Velocità: uscita della cinghia ${nb} rpm, pignone ${ng} rpm`,
    beltGearP: (pb, pg) => `Potenza: cinghia ${pb} kW, ruote ${pg} kW`,
    shaftOn: w => `L'albero gira come ${w}`, pinionShaft: 'l\'albero del pignone', wheelShaft: 'l\'albero della ruota', beltShaft: 'la puleggia condotta',
    shaftMismatch: (ns, list) => `L'albero gira a ${ns} rpm, ma nessuno stadio ha questa velocità (${list} rpm)`,
    shaftP: (ps, pg) => `Potenza sull'albero ${ps} kW, stadio a monte ${pg} kW`,
    shaftTorqueOnly: 'L\'albero è definito con il momento torcente: velocità non confrontabile',
    fitD: (df, ds) => `Ø dell'accoppiamento ${df} mm, Ø dell'albero ${ds} mm`,
    pinion: 'pignone', wheel: 'ruota',
    rim: (w, df, d, s, smin, ok) => `Calettamento del ${w}: Ø di piede ${df} mm su albero Ø${d} → spessore sotto il dente ${s} mm ${ok ? '≥' : '<'} 2,5·m = ${smin} mm` + (ok ? '' : ` → realizzare il ${w} di pezzo con l'albero (albero-${w})`),
    capacity: 'potenza trasmissibile (verifica di una coppia esistente)', geomOnly: 'solo geometria (nessuna potenza)',
    hint: 'Ogni modulo usa i propri dati: se uno stadio non è coerente, correggi i valori nel modulo e rigenera la relazione.',
    hyp: 'Rendimenti trascurati (potenza costante lungo la catena); le velocità seguono i rapporti di trasmissione: cinghia $n_2 = n_1\\,z_1/z_2$, ruote $n_2 = n_1\\,\\tau$ con $\\tau = z_1/z_2$; momento $M = P/\\omega$.',
    chapter: 'Capitolo'
  },
  en: {
    title: 'Complete transmission — preliminary sizing', menuThis: 'Report of this module', menuTx: 'Complete transmission report',
    pick: 'Modules to include', generate: 'Generate report', none: 'Select at least one module.',
    mods: { belts: 'Timing belt', gears: 'Gears', shafts: 'Shaft', fits: 'ISO fits' },
    toc: 'Contents', ch0: 'Transmission layout and power flow', summary: 'Summary of the results', open: 'Open this calculation',
    motor: 'Motor', stage: 'Stage', nIn: 'n in [rpm]', nOut: 'n out [rpm]', Pw: 'P [kW]', Min: 'M in [N·m]', Mout: 'M out [N·m]', ratio: 'Ratio',
    checks: 'Consistency between modules', ok: 'consistent', warn: 'to be checked', result: 'Main result',
    beltGear: (nb, ng) => `Speed: belt output ${nb} rpm, pinion ${ng} rpm`,
    beltGearP: (pb, pg) => `Power: belt ${pb} kW, gears ${pg} kW`,
    shaftOn: w => `The shaft turns as ${w}`, pinionShaft: 'the pinion shaft', wheelShaft: 'the wheel shaft', beltShaft: 'the driven pulley',
    shaftMismatch: (ns, list) => `The shaft turns at ${ns} rpm, but no stage has this speed (${list} rpm)`,
    shaftP: (ps, pg) => `Power on the shaft ${ps} kW, upstream stage ${pg} kW`,
    shaftTorqueOnly: 'The shaft is defined by its torque: speed not comparable',
    fitD: (df, ds) => `Fit Ø ${df} mm, shaft Ø ${ds} mm`,
    pinion: 'pinion', wheel: 'wheel',
    rim: (w, df, d, s, smin, ok) => `Mounting of the ${w}: root Ø ${df} mm on shaft Ø${d} → rim under the teeth ${s} mm ${ok ? '≥' : '<'} 2.5·m = ${smin} mm` + (ok ? '' : ` → make the ${w} integral with the shaft (${w} shaft)`),
    capacity: 'power capacity (check of an existing pair)', geomOnly: 'geometry only (no power)',
    hint: 'Each module uses its own data: if a stage is not consistent, correct the values in the module and generate the report again.',
    hyp: 'Efficiencies neglected (constant power along the chain); speeds follow the transmission ratios: belt $n_2 = n_1\\,z_1/z_2$, gears $n_2 = n_1\\,\\tau$ with $\\tau = z_1/z_2$; torque $M = P/\\omega$.',
    chapter: 'Chapter'
  }
};

const REPORT_TX_ORDER = ['belts', 'gears', 'shafts', 'fits'];
const reportVisited = new Set();   // modules opened in this session: preselected in the transmission report

function txTorque(PkW, n) { return PkW > 0 && n > 0 ? PkW * 1000 / (2 * Math.PI * n / 60) : null; }
function txClose(a, b, tol = 0.02) { return a > 0 && b > 0 && Math.abs(a - b) / Math.max(a, b) <= tol; }

// Speed, torque and power of every stage, read from the modules' current inputs
function transmissionStages(mods) {
  const st = {};
  if (mods.includes('belts')) {
    const z1 = parseInt(document.getElementById('pulleyZ1').value) || 20;
    let z2 = parseInt(document.getElementById('pulleyZ2').value) || 40;
    if (currentRatioMethod !== 'teeth') z2 = beltZ2FromTau(z1, parseFloat(document.getElementById('targetTau').value) || 2).z2;
    const power = currentBeltMode !== 'geom';
    const P = power ? parseFloat(document.getElementById('motorPower').value) || 0 : null;
    const n1 = power ? parseFloat(document.getElementById('driverSpeed').value) || 0 : null;
    st.belts = { P, n1, n2: n1 ? n1 * z1 / z2 : null, ratio: `z₂/z₁ = ${z2}/${z1}`, geomOnly: !power };
  }
  if (mods.includes('gears')) {
    calculateGears();
    const g = lastGearState;
    if (g && g.mode === 'design') {
      const n1 = g.load.n1_rpm, tau = g.tau;
      const r = g.r, mn = r.mn, x1 = g.xr1 || 0;
      st.gears = { P: g.load.W_watt / 1000, n1, n2: n1 * tau, ratio: `τ = z₁/z₂ = ${g.z1}/${g.z2}`,
        geom: { m: mn, df1: r.dp1 - 2 * mn * (1.25 - x1), df2: r.dp2 - 2.5 * mn } };
    } else if (g) {
      const p = g.params;
      st.gears = { P: g.r.P_kW_max, n1: p.n1, n2: p.n1 * p.z1 / p.z2, ratio: `τ = ${p.z1}/${p.z2}`, capacity: true };
    }
  }
  if (mods.includes('shafts')) {
    const { torqueInput, Mt } = readShaftTorque();
    const power = torqueInput === 'power';
    st.shafts = { Mt, P: power ? shaftVal('shaftPower', 0) : null, n: power ? shaftVal('shaftSpeed', 0) : null };
  }
  if (mods.includes('fits')) {
    const dIn = parseFloat(document.getElementById('nominalDiameter').value);
    st.fits = { d: currentUnit === 'metric' ? dIn : dIn * 25.4, fit: document.getElementById('fitType').value };
  }
  return st;
}

function transmissionChecks(st, X) {
  const N = reportNum, out = [];
  const add = (ok, txt) => out.push({ ok, txt });
  if (st.belts && st.gears && st.belts.n2 && !st.gears.capacity) {
    add(txClose(st.belts.n2, st.gears.n1), X.beltGear(N(st.belts.n2, 0), N(st.gears.n1, 0)));
    if (st.belts.P) add(txClose(st.belts.P, st.gears.P), X.beltGearP(N(st.belts.P, 2), N(st.gears.P, 2)));
  }
  if (st.shafts) {
    if (!st.shafts.n) add(null, X.shaftTorqueOnly);
    else {
      const cands = [];
      if (st.gears) { cands.push([st.gears.n1, X.pinionShaft, st.gears]); cands.push([st.gears.n2, X.wheelShaft, st.gears]); }
      if (st.belts && st.belts.n2) cands.push([st.belts.n2, X.beltShaft, st.belts]);
      if (cands.length) {
        const hit = cands.find(c => txClose(c[0], st.shafts.n));
        if (hit) {
          add(true, X.shaftOn(hit[1]) + ` (${N(st.shafts.n, 0)} rpm)`);
          // gear keyed on this shaft: enough material between the tooth root and the bore?
          if (hit[2] === st.gears && st.gears.geom && reportLastShaft && reportLastShaft.d) {
            const g = st.gears.geom, pin = hit[1] === X.pinionShaft;
            const df = pin ? g.df1 : g.df2, s = (df - reportLastShaft.d) / 2, smin = 2.5 * g.m;
            add(s >= smin, X.rim(pin ? X.pinion : X.wheel, N(df, 1), N(reportLastShaft.d, 0), N(s, 1), N(smin, 1), s >= smin));
          }
          if (hit[2].P && !hit[2].capacity) add(txClose(st.shafts.P, hit[2].P), X.shaftP(N(st.shafts.P, 2), N(hit[2].P, 2)));
        } else add(false, X.shaftMismatch(N(st.shafts.n, 0), cands.map(c => N(c[0], 0)).join(' / ')));
      }
    }
  }
  if (st.fits && reportLastShaft && reportLastShaft.d) {
    const ds = reportLastShaft.d, df = st.fits.d;
    const near = [ds, reportLastShaft.D].filter(Boolean).some(v => Math.abs(v - df) < 0.5);
    add(near, X.fitD(N(df, 0), N(ds, 0) + (reportLastShaft.D ? ' / ' + N(reportLastShaft.D, 0) : '')));
  }
  return out;
}

// Block diagram of the power flow, drawn for paper (dark strokes on white)
function transmissionDiagram(st, X) {
  const N = reportNum, boxes = [];
  const first = st.belts || st.gears || st.shafts;
  if (first && (st.belts ? st.belts.P : st.gears ? st.gears.P : st.shafts.P)) {
    const P = st.belts && st.belts.P ? st.belts.P : st.gears && !st.gears.capacity ? st.gears.P : st.shafts ? st.shafts.P : null;
    const n = st.belts && st.belts.n1 ? st.belts.n1 : st.gears ? st.gears.n1 : st.shafts ? st.shafts.n : null;
    if (P) boxes.push({ name: X.motor, l1: `${N(P, 2)} kW`, l2: n ? `${N(n, 0)} rpm` : '', icon: 'motor' });
  }
  if (st.belts) boxes.push({ name: X.mods.belts, l1: st.belts.ratio, l2: st.belts.n2 ? `→ ${N(st.belts.n2, 0)} rpm` : X.geomOnly.split(' (')[0], icon: 'belt' });
  if (st.gears) boxes.push({ name: X.mods.gears, l1: st.gears.ratio, l2: `→ ${N(st.gears.n2, 0)} rpm`, icon: 'gear' });
  if (st.shafts) boxes.push({ name: X.mods.shafts, l1: `Mt = ${N(st.shafts.Mt, 1)} N·m`, l2: reportLastShaft && reportLastShaft.d ? `d = ${N(reportLastShaft.d, 0)} mm` : '', icon: 'shaft' });
  if (st.fits) boxes.push({ name: X.mods.fits, l1: `Ø${N(st.fits.d, 0)} ${st.fits.fit}`, l2: '', icon: 'fit' });
  if (!boxes.length) return '';
  const W = 680, bw = Math.min(150, (W - 20 - (boxes.length - 1) * 26) / boxes.length), gap = boxes.length > 1 ? (W - 20 - boxes.length * bw) / (boxes.length - 1) : 0;
  const icon = (k, cx, cy) => {
    if (k === 'motor') return `<rect x="${cx - 16}" y="${cy - 10}" width="26" height="20" rx="3" fill="none" stroke="#0f172a" stroke-width="1.6"/><line x1="${cx + 10}" y1="${cy}" x2="${cx + 18}" y2="${cy}" stroke="#0f172a" stroke-width="2.4"/><line x1="${cx - 12}" y1="${cy - 4}" x2="${cx + 6}" y2="${cy - 4}" stroke="#0f172a"/><line x1="${cx - 12}" y1="${cy + 4}" x2="${cx + 6}" y2="${cy + 4}" stroke="#0f172a"/>`;
    if (k === 'belt') return `<circle cx="${cx - 10}" cy="${cy}" r="6" fill="none" stroke="#0f172a" stroke-width="1.6"/><circle cx="${cx + 10}" cy="${cy}" r="10" fill="none" stroke="#0f172a" stroke-width="1.6"/><line x1="${cx - 10}" y1="${cy - 6}" x2="${cx + 10}" y2="${cy - 10}" stroke="#0369a1" stroke-width="1.6"/><line x1="${cx - 10}" y1="${cy + 6}" x2="${cx + 10}" y2="${cy + 10}" stroke="#0369a1" stroke-width="1.6"/>`;
    if (k === 'gear') {
      let t = '';
      for (const [gx, r, nT] of [[cx - 8, 7, 8], [cx + 9, 11, 12]]) {
        t += `<circle cx="${gx}" cy="${cy}" r="${r}" fill="none" stroke="#0f172a" stroke-width="1.6"/>`;
        for (let i = 0; i < nT; i++) { const a = i * 2 * Math.PI / nT; t += `<line x1="${gx + r * Math.cos(a)}" y1="${cy + r * Math.sin(a)}" x2="${gx + (r + 3) * Math.cos(a)}" y2="${cy + (r + 3) * Math.sin(a)}" stroke="#0f172a" stroke-width="2"/>`; }
      }
      return t;
    }
    if (k === 'shaft') return `<rect x="${cx - 20}" y="${cy - 4}" width="40" height="8" fill="none" stroke="#0f172a" stroke-width="1.6"/><rect x="${cx - 6}" y="${cy - 9}" width="12" height="18" fill="none" stroke="#0f172a" stroke-width="1.4"/><circle cx="${cx - 15}" cy="${cy + 10}" r="2.5" fill="#0f172a"/><circle cx="${cx + 15}" cy="${cy + 10}" r="2.5" fill="#0f172a"/>`;
    return `<rect x="${cx - 16}" y="${cy - 10}" width="32" height="20" fill="none" stroke="#0f172a" stroke-width="1.6"/><rect x="${cx - 16}" y="${cy - 4}" width="32" height="8" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>`;
  };
  let svg = `<svg class="rep-svg" viewBox="0 0 ${W} 120" xmlns="http://www.w3.org/2000/svg" font-family="Inter, Arial, sans-serif">`;
  boxes.forEach((b, i) => {
    const x = 10 + i * (bw + gap), cx = x + bw / 2;
    svg += `<rect x="${x}" y="8" width="${bw}" height="104" rx="8" fill="#f8fafc" stroke="#334155" stroke-width="1.2"/>`;
    svg += icon(b.icon, cx, 34);
    svg += `<text x="${cx}" y="66" text-anchor="middle" font-size="${b.name.length > 15 ? 10.5 : 11.5}" font-weight="700" fill="#0f172a">${reportEsc(b.name)}</text>`;
    svg += `<text x="${cx}" y="84" text-anchor="middle" font-size="10" fill="#334155">${reportEsc(b.l1)}</text>`;
    if (b.l2) svg += `<text x="${cx}" y="100" text-anchor="middle" font-size="10" fill="#0369a1" font-weight="600">${reportEsc(b.l2)}</text>`;
    if (i < boxes.length - 1) {
      const x1 = x + bw + 3, x2 = x + bw + gap - 3;
      svg += `<line x1="${x1}" y1="60" x2="${x2 - 6}" y2="60" stroke="#0f172a" stroke-width="1.6"/><path d="M ${x2} 60 L ${x2 - 8} 55 L ${x2 - 8} 65 Z" fill="#0f172a"/>`;
    }
  });
  return svg + '</svg>';
}

// Link that reopens one module with its current inputs
function reportModuleLink(mod) {
  const prev = activeModule;
  activeModule = mod;
  let link = '';
  try { link = shareUrl(); } catch (e) { link = window.location.href; }
  activeModule = prev;
  return link;
}

function buildTransmissionReportHtml(mods) {
  const R = REPORT_TXT[currentLang] || REPORT_TXT.en, X = REPORT_TX_TXT[currentLang] || REPORT_TX_TXT.en, N = reportNum;
  const builders = { belts: buildBeltReportHtml, gears: buildGearReportHtml, shafts: buildShaftReportHtml, fits: buildFitReportHtml };
  mods = REPORT_TX_ORDER.filter(m => mods.includes(m));
  if (!mods.length) return null;
  const prev = activeModule;
  const parts = [];
  reportLastShaft = null;
  // module chapters first (the shaft chapter also gives the diameter used by the summary)
  for (const m of mods) {
    reportCollect = [];
    activeModule = m;
    try { builders[m](); } catch (e) { console.error(e); }
    const p = reportCollect[0];
    reportCollect = null;
    if (p) parts.push({ mod: m, ...p, link: reportModuleLink(m) });
  }
  activeModule = prev;
  if (!parts.length) return null;

  const st = transmissionStages(parts.map(p => p.mod));
  const checks = transmissionChecks(st, X);
  let body = '';
  // contents
  body += `<div class="toc"><b>${X.toc}</b><ol><li>${X.ch0}</li>${parts.map(p => `<li>${reportEsc(p.title)}</li>`).join('')}</ol></div>`;
  // chapter 1: power flow
  body += `<h2 class="ch"><span class="n">1</span>${X.ch0}</h2>`;
  body += `<div class="fig">${transmissionDiagram(st, X)}</div>`;
  const rows = [];
  if (st.belts) rows.push([X.mods.belts, st.belts.ratio, st.belts.n1 ? N(st.belts.n1, 0) : '—', st.belts.n2 ? N(st.belts.n2, 0) : '—', st.belts.P ? N(st.belts.P, 2) : '—',
    st.belts.P ? N(txTorque(st.belts.P, st.belts.n1), 1) : '—', st.belts.P ? N(txTorque(st.belts.P, st.belts.n2), 1) : '—']);
  if (st.gears) rows.push([X.mods.gears + (st.gears.capacity ? '*' : ''), st.gears.ratio, N(st.gears.n1, 0), N(st.gears.n2, 0), N(st.gears.P, 2),
    N(txTorque(st.gears.P, st.gears.n1), 1), N(txTorque(st.gears.P, st.gears.n2), 1)]);
  if (st.shafts) rows.push([X.mods.shafts, '—', st.shafts.n ? N(st.shafts.n, 0) : '—', st.shafts.n ? N(st.shafts.n, 0) : '—', st.shafts.P ? N(st.shafts.P, 2) : '—', N(st.shafts.Mt, 1), N(st.shafts.Mt, 1)]);
  if (rows.length) body += reportTable([X.stage, X.ratio, X.nIn, X.nOut, X.Pw, X.Min, X.Mout], rows) +
    (st.gears && st.gears.capacity ? `<p class="small">* ${X.capacity}</p>` : '');
  if (checks.length) {
    body += `<h4>${X.checks}</h4><table class="chk"><tbody>` + checks.map(c =>
      `<tr><td class="${c.ok === null ? 'na' : c.ok ? 'ok' : 'ko'}">${c.ok === null ? '–' : c.ok ? '✓' : '⚠'}</td><td>${reportEsc(c.txt)}</td><td class="small">${c.ok === null ? '' : c.ok ? X.ok : X.warn}</td></tr>`).join('') + '</tbody></table>';
    if (checks.some(c => c.ok === false)) body += `<p class="small">${X.hint}</p>`;
  }
  body += `<h4>${X.summary}</h4>` + reportTable([X.chapter, X.result], parts.map((p, i) => [`${i + 2}. ${reportEsc(X.mods[p.mod])}`, p.subtitle]));
  body += `<p class="small">${reportTexify(X.hyp)}</p>`;
  // module chapters: section numbers become chapter.section
  parts.forEach((p, i) => {
    const ch = i + 2;
    const b = p.body.replace(/<span class="n">(\d+)\.<\/span>/g, (_, k) => `<span class="n">${ch}.${k}</span>`);
    body += `<section class="chapter"><h2 class="ch"><span class="n">${ch}</span>${reportEsc(p.title)}</h2><p class="chsub">${p.subtitle}</p>` + b +
      `<p class="small chnote">${p.disclaimer}</p><p class="small"><a href="${reportEsc(p.link)}">${X.open} ↗</a></p></section>`;
  });
  const subtitle = parts.map(p => X.mods[p.mod]).join(' · ');
  return reportShell(X.title, subtitle, body, R);
}

// ---- report menu in the header: this module, or the whole transmission
function toggleReportMenu(ev) {
  if (ev) ev.stopPropagation();
  const m = document.getElementById('reportMenu');
  if (!m) { openReport(); return; }
  const X = REPORT_TX_TXT[currentLang] || REPORT_TX_TXT.en;
  if (m.classList.contains('hidden')) {
    reportVisited.add(activeModule);
    document.getElementById('reportMenuThis').textContent = X.menuThis;
    document.getElementById('reportMenuTxTitle').textContent = X.menuTx;
    document.getElementById('reportMenuPick').textContent = X.pick;
    document.getElementById('reportMenuGo').textContent = X.generate;
    document.getElementById('reportMenuMods').innerHTML = REPORT_TX_ORDER.map(k =>
      `<label class="flex items-center gap-2 py-0.5 cursor-pointer"><input type="checkbox" value="${k}" class="accent-blue-500" ${reportVisited.has(k) ? 'checked' : ''}> <span>${X.mods[k]}</span></label>`).join('');
    document.getElementById('reportMenuMsg').textContent = '';
    m.classList.remove('hidden');
  } else m.classList.add('hidden');
}

function openTransmissionReport() {
  const X = REPORT_TX_TXT[currentLang] || REPORT_TX_TXT.en;
  const mods = [...document.querySelectorAll('#reportMenuMods input:checked')].map(i => i.value);
  if (!mods.length) { document.getElementById('reportMenuMsg').textContent = X.none; return; }
  document.getElementById('reportMenu').classList.add('hidden');
  const w = window.open('', '_blank');
  if (w && w.document) w.document.write('<p style="font-family:sans-serif;padding:20px">…</p>');
  reportLoadKatex().then(() => {
    const html = buildTransmissionReportHtml(mods);
    // the builders redraw charts of the other modules: bring the visible one back to its own state
    try { ({ fits: calculateFits, belts: calculateBelts, gears: calculateGears, shafts: calculateShafts })[activeModule](); } catch (e) { /* view refresh only */ }
    if (html) reportOpen(html, w); else if (w) w.close();
  });
}

document.addEventListener('click', ev => {
  const m = document.getElementById('reportMenu');
  if (m && !m.classList.contains('hidden') && !m.contains(ev.target) && ev.target.closest('#reportBtn') === null) m.classList.add('hidden');
});
