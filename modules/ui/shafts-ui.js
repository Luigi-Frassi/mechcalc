// ============================================================================
// MODULE 4: SHAFTS
// UI: reads inputs, calls the core (core/shafts-core.js), shows the results,
// the Goodman diagram and the dimensioned sketch of the section.
// ============================================================================

let currentShaftMode = 'design';   // 'design' (find d) | 'check' (d known)

function setShaftMode(mode) {
  currentShaftMode = mode === 'check' ? 'check' : 'design';
  const on = "px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30 transition-all";
  const off = "px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white border border-transparent transition-all";
  const bD = document.getElementById('shaftModeDesign'), bC = document.getElementById('shaftModeCheck');
  if (bD) bD.className = currentShaftMode === 'design' ? on : off;
  if (bC) bC.className = currentShaftMode === 'check' ? on : off;
  calculateShafts();
}

function shaftVal(id, fallback) {
  const v = parseFloat(document.getElementById(id)?.value);
  return Number.isFinite(v) ? v : fallback;
}

function shaftShow(id, visible) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('hidden', !visible);
}

function shaftFmt(x, n = 2) {
  if (!Number.isFinite(x)) return '∞';
  return x.toFixed(n);
}

function shaftText(t, key, vars = {}) {
  let s = t[key] || key;
  for (const [k, v] of Object.entries(vars)) s = s.replace('{' + k + '}', v);
  return s;
}

// Reads the form. Returns { inp, Xreq, mode, geometry }
function readShaftInputs() {
  const torqueInput = document.getElementById('shaftTorqueInput')?.value || 'power';
  let Mt;
  if (torqueInput === 'torque') {
    Mt = shaftVal('shaftMt', 0);
  } else {
    const P = shaftVal('shaftPower', 0), n = shaftVal('shaftSpeed', 1);
    const omega = 2 * Math.PI * n / 60;
    Mt = omega > 0 ? P * 1000 / omega : 0;
  }
  const notchType = document.getElementById('shaftNotchType')?.value || 'shoulder';
  const mode = currentShaftMode;
  let notch;
  if (notchType === 'shoulder') {
    notch = { type: 'shoulder', Dd: Math.max(1, shaftVal('shaftDd', 1.1)), r: Math.max(0.05, shaftVal('shaftR', 1)) };
  } else if (notchType === 'keyway') {
    notch = { type: 'keyway', key: document.getElementById('shaftKeyType')?.value, condition: document.getElementById('shaftKeyCond')?.value };
  } else if (notchType === 'manual') {
    notch = { type: 'manual', ke: shaftVal('shaftKe', 1), keT: shaftVal('shaftKeT', 1) };
  } else {
    notch = { type: 'none' };
  }
  const inp = {
    loads: {
      Mf: Math.abs(shaftVal('shaftMf', 0)),
      bendingCycle: document.getElementById('shaftBendCycle')?.value || 'rotating',
      Mt: Math.abs(Mt),
      torsionCycle: document.getElementById('shaftTorsionCycle')?.value || 'static',
      N: shaftVal('shaftAxial', 0)
    },
    sigmaR: shaftVal('shaftSigmaR', 1080),
    sigmaS: shaftVal('shaftSigmaS', 800),
    sigmaLF: shaftVal('shaftSigmaLF', 520),
    cycles: document.getElementById('shaftLife')?.value === 'finite' ? shaftVal('shaftCycles', 1e6) : 0,
    finish: document.getElementById('shaftFinish')?.value || 'e',
    notch
  };
  return { inp, Xreq: Math.max(1, shaftVal('shaftX', 1.75)), mode, notchType, torqueInput, Mt };
}

function calculateShafts() {
  const sec = document.getElementById('moduleShaftsSection');
  if (!sec) return;
  const t = translations[currentLang];
  const { inp, Xreq, mode, notchType, torqueInput, Mt } = readShaftInputs();

  // ---- visibility of the inputs
  const shoulder = notchType === 'shoulder';
  shaftShow('colShaftPower', torqueInput === 'power');
  shaftShow('colShaftSpeed', torqueInput === 'power');
  shaftShow('colShaftMt', torqueInput === 'torque');
  shaftShow('shaftCycles', document.getElementById('shaftLife')?.value === 'finite');
  shaftShow('colShaftDcheck', mode === 'check');
  shaftShow('colShaftDd', shoulder && mode === 'design');
  shaftShow('colShaftDDcheck', shoulder && mode === 'check');
  shaftShow('colShaftR', shoulder);
  shaftShow('colShaftKeyType', notchType === 'keyway');
  shaftShow('colShaftKeyCond', notchType === 'keyway');
  shaftShow('colShaftKe', notchType === 'manual');
  shaftShow('colShaftKeT', notchType === 'manual');

  const mtInfo = document.getElementById('shaftMtInfo');
  if (mtInfo) {
    const n = shaftVal('shaftSpeed', 0);
    mtInfo.innerText = torqueInput === 'power'
      ? shaftText(t, 'shaftMtFmt', { mt: shaftFmt(Mt, 1), w: shaftFmt(2 * Math.PI * n / 60, 1) })
      : `Mt = ${shaftFmt(Mt, 1)} N·m`;
  }

  const fat = shaftFatigueStrength(inp.sigmaR, inp.sigmaLF, inp.cycles);
  const sInfo = document.getElementById('shaftSigmaNInfo');
  if (sInfo) sInfo.innerText = `σN = ${shaftFmt(fat.sigmaN, 0)} MPa`;

  // ---- calculation
  const warnings = [];
  const badMaterial = !(inp.sigmaLF > 0 && inp.sigmaR > inp.sigmaLF && inp.sigmaS > 0 && inp.sigmaS <= inp.sigmaR);
  if (badMaterial) warnings.push(t.shaftWarnBadMat);
  if (inp.sigmaR < 300 || inp.sigmaR > 1600) warnings.push(t.shaftWarnSigma);
  if (fat.finite) warnings.push(shaftText(t, 'shaftWarnFinite', { sn: shaftFmt(fat.sigmaN, 0), m: shaftFmt(fat.m, 2) }));

  let res, d, D = null, dMin = null, governing = null, roundedBumped = false;
  if (mode === 'design') {
    const des = badMaterial ? { ok: false } : shaftDesign(inp, Xreq);
    if (!des.ok) {
      if (!badMaterial) warnings.push(t.shaftWarnTooLarge);
      renderShaftEmpty(t, warnings);
      return;
    }
    res = des.final; d = des.d; D = des.D; dMin = des.dMin; governing = des.governing;
    roundedBumped = shaftRoundToBearing(dMin) !== d;
    if (roundedBumped) warnings.push(t.shaftWarnRounded);
  } else {
    d = Math.max(1, shaftVal('shaftDcheck', 65));
    let notch = inp.notch;
    if (shoulder) {
      D = Math.max(d, shaftVal('shaftDDcheck', d));
      notch = { ...notch, Dd: D / d };
    }
    res = shaftCheck({ ...inp, notch }, d);
  }

  if (shoulder && res.rdOutOfRange) warnings.push(shaftText(t, 'shaftWarnRd', { rd: shaftFmt(res.rd, 3) }));
  if (shoulder && D && (D / d > 2.0 || D / d < 1.09)) warnings.push(shaftText(t, 'shaftWarnDd', { Dd: shaftFmt(D / d, 2) }));

  // ---- result cards
  const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
  const setCls = (id, c) => { const el = document.getElementById(id); if (el) el.className = c; };
  const ok = x => x >= Xreq - 1e-9;
  const big = 'text-xl font-bold mt-1 ';

  if (mode === 'design') {
    setTxt('shaftRes1Title', t.shaftRes1Title);
    setTxt('shaftRes1', `d ≥ ${shaftFmt(dMin, 1)} mm`);
    setTxt('shaftRes1Sub', governing === 'yield' ? t.shaftGovYield : t.shaftGovFatigue);
    setTxt('shaftRes2Title', t.shaftRes2Title);
    setTxt('shaftRes2', shoulder ? `d = ${d} mm · D = ${D} mm` : `d = ${d} mm`);
    setTxt('shaftRes2Sub', shoulder ? `r = ${shaftFmt(inp.notch.r, 1)} mm · ${t.shaftBearingNote}` : t.shaftBearingNote);
  } else {
    setTxt('shaftRes1Title', t.shaftResSection);
    setTxt('shaftRes1', shoulder ? `d = ${shaftFmt(d, 1)} · D = ${shaftFmt(D, 1)} mm` : `d = ${shaftFmt(d, 1)} mm`);
    setTxt('shaftRes1Sub', shoulder ? `r = ${shaftFmt(inp.notch.r, 1)} mm · D/d = ${shaftFmt(D / d, 2)} · r/d = ${shaftFmt(res.rd, 3)}` : '');
    setTxt('shaftRes2Title', t.shaftResStresses);
    setTxt('shaftRes2', `${shaftFmt(res.sigmaAeq, 0)} / ${shaftFmt(res.sigmaMeq, 0)} MPa`);
    setTxt('shaftRes2Sub', 'σa,eq / σm,eq');
  }
  setTxt('shaftRes3', `X = ${shaftFmt(res.Xfatigue, 2)}`);
  setCls('shaftRes3', big + (ok(res.Xfatigue) ? 'text-emerald-400' : 'text-amber-400'));
  setTxt('shaftRes3Sub', `${ok(res.Xfatigue) ? t.shaftOk : t.shaftKo} (${t.shaftRequired} ${shaftFmt(Xreq, 2)})`);
  setTxt('shaftRes4', `X = ${shaftFmt(res.Xyield, 2)}`);
  setCls('shaftRes4', big + (ok(res.Xyield) ? 'text-emerald-400' : 'text-amber-400'));
  setTxt('shaftRes4Sub', `${ok(res.Xyield) ? t.shaftOk : t.shaftKo} · σs = ${shaftFmt(inp.sigmaS, 0)} MPa`);

  // ---- breakdown
  const isShoulder = shoulder && res.KtB !== undefined;
  setTxt('shaftBkKt', isShoulder ? `${shaftFmt(res.KtB, 2)} / ${shaftFmt(res.KtT, 2)}` : '—');
  setTxt('shaftBkQ', isShoulder ? `${shaftFmt(res.qB, 2)} / ${shaftFmt(res.qT, 2)}` : '—');
  setTxt('shaftBkKe', `${shaftFmt(res.ke, 2)} / ${shaftFmt(res.keT, 2)}`);
  setTxt('shaftBkB', `${shaftFmt(res.b1, 3)} / ${shaftFmt(res.b2, 3)}`);
  setTxt('shaftBkSigmaN', `${shaftFmt(res.sigmaNf, 0)} MPa`);
  const sigB = res.sigmaBa || res.sigmaBm, tau = res.tauA + res.tauM;
  setTxt('shaftBkNom', `${shaftFmt(sigB, 1)} / ${shaftFmt(tau, 1)} MPa`);
  setTxt('shaftBkAeq', `${shaftFmt(res.sigmaAeq, 1)} MPa`);
  setTxt('shaftBkMeq', `${shaftFmt(res.sigmaMeq, 1)} MPa`);

  renderShaftWarnings(warnings);
  drawShaftGoodman(res, inp, Xreq, t);
  drawShaftSketch(d, D, shoulder ? inp.notch.r : null, notchType, t);
}

function renderShaftWarnings(warnings) {
  const ul = document.getElementById('shaftWarnings');
  if (!ul) return;
  ul.innerHTML = '';
  for (const w of warnings) {
    const li = document.createElement('li');
    li.innerText = '⚠ ' + w;
    ul.appendChild(li);
  }
}

function renderShaftEmpty(t, warnings) {
  for (const id of ['shaftRes1', 'shaftRes2', 'shaftRes3', 'shaftRes4']) {
    const el = document.getElementById(id); if (el) el.innerText = '--';
  }
  for (const id of ['shaftRes1Sub', 'shaftRes2Sub', 'shaftRes3Sub', 'shaftRes4Sub']) {
    const el = document.getElementById(id); if (el) el.innerText = '';
  }
  renderShaftWarnings(warnings);
  const g = document.getElementById('shaftGoodmanChart'); if (g) g.innerHTML = '';
  const s = document.getElementById('shaftSketch'); if (s) s.innerHTML = '';
}

// Goodman diagram in the σm,eq – σa,eq plane: limit line, line with safety factor X, working point
function drawShaftGoodman(res, inp, Xreq, t) {
  const svg = document.getElementById('shaftGoodmanChart');
  if (!svg) return;
  const x0 = 40, y0 = 190, w = 240, h = 160;
  const aLim = res.b1 * res.b2 * res.sigmaNf;        // σa limit at σm = 0
  const mLim = inp.sigmaR;                           // σm limit at σa = 0
  const maxA = Math.max(aLim, res.sigmaAeq) * 1.1, maxM = Math.max(mLim, res.sigmaMeq) * 1.02;
  const X = v => x0 + (v / maxM) * w, Y = v => y0 - (v / maxA) * h;
  const f0 = n => Math.round(n);
  let s = '';
  s += `<line x1="${x0}" y1="${y0}" x2="${x0 + w}" y2="${y0}" stroke="#64748b" stroke-width="1"/>`;
  s += `<line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 - h - 5}" stroke="#64748b" stroke-width="1"/>`;
  s += `<text x="${x0 + w / 2}" y="${y0 + 26}" fill="#94a3b8" font-size="9" text-anchor="middle" font-family="monospace">σm,eq [MPa]</text>`;
  s += `<text x="${x0 - 4}" y="${y0 - h - 8}" fill="#94a3b8" font-size="9" text-anchor="start" font-family="monospace">σa,eq [MPa]</text>`;
  // limit line and safe line
  s += `<line x1="${X(0)}" y1="${Y(aLim)}" x2="${X(mLim)}" y2="${Y(0)}" stroke="#f43f5e" stroke-width="1.8"/>`;
  s += `<line x1="${X(0)}" y1="${Y(aLim / Xreq)}" x2="${X(mLim / Xreq)}" y2="${Y(0)}" stroke="#38bdf8" stroke-width="1.4" stroke-dasharray="5 3"/>`;
  s += `<text x="${X(0) + 4}" y="${Y(aLim) - 4}" fill="#f43f5e" font-size="9" font-family="monospace">${f0(aLim)} = b₁b₂σN</text>`;
  s += `<text x="${X(mLim)}" y="${y0 + 12}" fill="#f43f5e" font-size="9" text-anchor="end" font-family="monospace">σR = ${f0(mLim)}</text>`;
  s += `<text x="${X(mLim / Xreq)}" y="${y0 + 12}" fill="#38bdf8" font-size="9" text-anchor="middle" font-family="monospace">${t.shaftSafeLine} ${shaftFmt(Xreq, 2)}</text>`;
  // working point and load line from the origin
  const px = X(res.sigmaMeq), py = Y(res.sigmaAeq);
  s += `<line x1="${X(0)}" y1="${Y(0)}" x2="${px}" y2="${py}" stroke="#fbbf24" stroke-width="1" stroke-dasharray="2 2"/>`;
  s += `<circle cx="${px}" cy="${py}" r="4" fill="#fbbf24"/>`;
  const labelLeft = px > x0 + w * 0.6;
  s += `<text x="${labelLeft ? px - 7 : px + 7}" y="${py + 13}" fill="#fbbf24" font-size="9" text-anchor="${labelLeft ? 'end' : 'start'}" font-family="monospace">${t.shaftWorkPoint} (${f0(res.sigmaMeq)}; ${f0(res.sigmaAeq)})</text>`;
  svg.innerHTML = s;
}

// Sketch of the section with the dimensions to take into CAD
function drawShaftSketch(d, D, r, notchType, t) {
  const svg = document.getElementById('shaftSketch');
  if (!svg) return;
  const cx = 150, cy = 110;
  const Dm = D || d;
  const k = 120 / Math.max(Dm, 1);            // scale: the larger diameter is 120 px tall
  const hd = d * k / 2, hD = Dm * k / 2;
  const xs = 150;                              // shoulder position
  const rPx = r ? Math.min(Math.max(r * k, 2), 18) : 0;
  let s = '';
  s += `<line x1="20" y1="${cy}" x2="280" y2="${cy}" stroke="#334155" stroke-dasharray="8 3 2 3" stroke-width="1"/>`;
  if (notchType === 'shoulder' && D) {
    // small diameter on the left, shoulder on the right, fillet radius at the corner
    const path = `M 30 ${cy - hd} L ${xs - rPx} ${cy - hd} Q ${xs} ${cy - hd} ${xs} ${cy - hd - rPx} L ${xs} ${cy - hD} L 270 ${cy - hD}
      L 270 ${cy + hD} L ${xs} ${cy + hD} L ${xs} ${cy + hd + rPx} Q ${xs} ${cy + hd} ${xs - rPx} ${cy + hd} L 30 ${cy + hd} Z`;
    s += `<path d="${path}" fill="rgba(56,189,248,0.10)" stroke="#38bdf8" stroke-width="1.6"/>`;
    s += `<text x="${xs - 6}" y="${cy - hd - 6}" fill="#fbbf24" font-size="9" text-anchor="end" font-family="monospace">r ${shaftFmt(r, 1)}</text>`;
    // D dimension
    s += `<line x1="250" y1="${cy - hD}" x2="250" y2="${cy + hD}" stroke="#a855f7" stroke-width="1"/>`;
    s += `<text x="246" y="${cy - 5}" fill="#a855f7" font-size="11" font-weight="bold" text-anchor="end" font-family="monospace">Ø${shaftFmt(D, 0)}</text>`;
  } else {
    s += `<rect x="30" y="${cy - hd}" width="240" height="${2 * hd}" fill="rgba(56,189,248,0.10)" stroke="#38bdf8" stroke-width="1.6"/>`;
    if (notchType === 'keyway') {
      s += `<rect x="110" y="${cy - hd}" width="80" height="${Math.max(3, hd * 0.25)}" fill="#0f172a" stroke="#fbbf24" stroke-width="1"/>`;
    }
  }
  // d dimension
  s += `<line x1="60" y1="${cy - hd}" x2="60" y2="${cy + hd}" stroke="#38bdf8" stroke-width="1"/>`;
  s += `<text x="66" y="${cy - 5}" fill="#38bdf8" font-size="11" font-weight="bold" font-family="monospace">Ø${shaftFmt(d, d % 1 ? 1 : 0)}</text>`;
  svg.innerHTML = s;
}
