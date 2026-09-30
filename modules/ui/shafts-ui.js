// ============================================================================
// MODULE 4: SHAFTS
// UI: reads inputs, calls the core (core/shafts-core.js), shows the results,
// the Goodman diagram and the dimensioned sketch of the section.
// ============================================================================

let currentShaftMode = 'beam';   // 'beam' (1D beam & loads) | 'design' (find d) | 'check' (d known)

function setShaftMode(mode) {
  currentShaftMode = (mode === 'check' || mode === 'design') ? mode : 'beam';
  const on = "px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30 transition-all";
  const off = "px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white border border-transparent transition-all";
  for (const [id, m] of [['shaftModeBeam', 'beam'], ['shaftModeDesign', 'design'], ['shaftModeCheck', 'check']]) {
    const b = document.getElementById(id);
    if (b) b.className = currentShaftMode === m ? on : off;
  }
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

// Torque transmitted by the shaft [N·m]
function readShaftTorque() {
  const torqueInput = document.getElementById('shaftTorqueInput')?.value || 'power';
  if (torqueInput === 'torque') return { torqueInput, Mt: Math.abs(shaftVal('shaftMt', 0)) };
  const P = shaftVal('shaftPower', 0), n = shaftVal('shaftSpeed', 1);
  const omega = 2 * Math.PI * n / 60;
  return { torqueInput, Mt: omega > 0 ? Math.abs(P * 1000 / omega) : 0 };
}

// Reads the section form. Returns { inp, Xreq, mode, ... }
function readShaftInputs() {
  const { torqueInput, Mt: MtShaft } = readShaftTorque();
  const Mt = document.getElementById('shaftSecTorque')?.checked === false ? 0 : MtShaft;
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

  // ---- shared: torque transmitted by the shaft
  const { torqueInput, Mt: MtShaft } = readShaftTorque();
  shaftShow('colShaftPower', torqueInput === 'power');
  shaftShow('colShaftSpeed', torqueInput === 'power');
  shaftShow('colShaftMt', torqueInput === 'torque');
  const mtInfo = document.getElementById('shaftMtInfo');
  if (mtInfo) {
    const n = shaftVal('shaftSpeed', 0);
    mtInfo.innerText = torqueInput === 'power'
      ? shaftText(t, 'shaftMtFmt', { mt: shaftFmt(MtShaft, 1), w: shaftFmt(2 * Math.PI * n / 60, 1) })
      : `Mt = ${shaftFmt(MtShaft, 1)} N·m`;
  }

  shaftShow('shaftBeamPanel', currentShaftMode === 'beam');
  shaftShow('shaftSectionPanel', currentShaftMode !== 'beam');
  calculateShaftBeam(t, MtShaft);          // always kept up to date, also while hidden
  if (currentShaftMode === 'beam') return;

  const { inp, Xreq, mode, notchType, Mt } = readShaftInputs();

  // ---- visibility of the inputs
  const shoulder = notchType === 'shoulder';
  shaftShow('shaftCycles', document.getElementById('shaftLife')?.value === 'finite');
  shaftShow('colShaftDcheck', mode === 'check');
  shaftShow('colShaftDd', shoulder && mode === 'design');
  shaftShow('colShaftDDcheck', shoulder && mode === 'check');
  shaftShow('colShaftR', shoulder);
  shaftShow('colShaftKeyType', notchType === 'keyway');
  shaftShow('colShaftKeyCond', notchType === 'keyway');
  shaftShow('colShaftKe', notchType === 'manual');
  shaftShow('colShaftKeT', notchType === 'manual');

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


// ============================================================================
// STEP 1: the shaft as a beam on two bearings
// ============================================================================

const SHAFT_EL_SLOTS = [1, 2, 3, 4];

function readShaftBeamInputs(Mt) {
  const g = id => document.getElementById(id)?.value;
  const elements = SHAFT_EL_SLOTS.map(i => {
    const p = 'shaftEl' + i;
    return {
      slot: i,
      type: g(p + 'Type') || 'none',
      x: shaftVal(p + 'X', 0),
      d: Math.max(0, shaftVal(p + 'D', 0)),
      helix: Math.max(0, Math.min(45, shaftVal(p + 'Helix', 0))),
      torque: g(p + 'Torque') || 'in',
      FtDir: g(p + 'FtDir') || '+V',
      FrDir: g(p + 'FrDir') || '+H',
      FaDir: g(p + 'FaDir') || '+x',
      Fv: shaftVal(p + 'Fv', 0), Fh: shaftVal(p + 'Fh', 0), Fa: shaftVal(p + 'Fa', 0), e: shaftVal(p + 'E', 0)
    };
  });
  return {
    xA: shaftVal('shaftXA', 0), xB: shaftVal('shaftXB', 240),
    axialBearing: g('shaftAxialBearing') === 'B' ? 'B' : 'A',
    theta: shaftVal('shaftTheta', 20),
    life: Math.max(0, shaftVal('shaftBearingLife', 10)),
    bearingType: g('shaftBearingType') === 'roller' ? 'roller' : 'ball',
    elements, Mt
  };
}

let lastShaftBeam = null;

function calculateShaftBeam(t, Mt) {
  const bi = readShaftBeamInputs(Mt);
  const warnings = [];

  // visibility of the element fields
  for (const el of bi.elements) {
    const p = 'shaftEl' + el.slot, gear = el.type === 'gear', force = el.type === 'force', any = el.type !== 'none';
    shaftShow('col' + p[0].toUpperCase() + p.slice(1) + 'X', any);
    for (const f of ['D', 'Helix', 'FtDir', 'FrDir']) shaftShow('colShaftEl' + el.slot + f, gear);
    shaftShow('colShaftEl' + el.slot + 'FaDir', gear && el.helix > 0);
    shaftShow('colShaftEl' + el.slot + 'Torque', gear || el.type === 'coupling');
    for (const f of ['Fv', 'Fh', 'Fa', 'E']) shaftShow('colShaftEl' + el.slot + f, force);
    const info = document.getElementById(p + 'Info');
    if (info) {
      if (gear) {
        const L = shaftElementLoads(el, Mt, bi.theta);
        info.innerText = shaftText(t, L.FaMag > 0 ? 'shaftElGearInfoA' : 'shaftElGearInfo',
          { ft: shaftFmt(L.Ft, 0), fr: shaftFmt(L.Fr, 0), fa: shaftFmt(L.FaMag, 0) });
        if (el.FtDir.slice(1) === el.FrDir.slice(1)) warnings.push(`${t.shaftElLabel} ${el.slot}: ${t.shaftElSamePlane}`);
      } else info.innerText = '';
    }
  }

  const res = shaftBeam({ xA: bi.xA, xB: bi.xB, elements: bi.elements, Mt, theta: bi.theta, axialBearing: bi.axialBearing });
  lastShaftBeam = res.ok ? res : null;
  const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
  if (!res.ok) {
    warnings.push(t.shaftBeamSupportsErr);
    for (const id of ['shaftBeamRA', 'shaftBeamRB', 'shaftBeamC', 'shaftBeamCrit']) setTxt(id, '--');
    for (const id of ['shaftBeamRASub', 'shaftBeamRBSub', 'shaftBeamCSub', 'shaftBeamCritSub', 'shaftSecInfo']) setTxt(id, '');
    renderShaftBeamWarnings(warnings);
    const svg = document.getElementById('shaftBeamChart'); if (svg) svg.innerHTML = '';
    return;
  }
  // torque balance: beyond the last element the torque must be zero
  const tEnd = res.at(res.xmax + 1).T;
  if (Math.abs(tEnd) > 1e-6 * Math.max(1, Mt)) warnings.push(t.shaftTorqueUnbalanced);

  const kN = v => shaftFmt(v / 1000, 2);
  setTxt('shaftBeamRA', shaftText(t, 'shaftBeamRes', { r: kN(res.RA.R) }));
  setTxt('shaftBeamRASub', `V ${kN(res.RA.V)} · H ${kN(res.RA.H)}` + (res.RA.axial ? ` · ${shaftText(t, 'shaftBeamAxial', { a: kN(res.RA.axial) })}` : ''));
  setTxt('shaftBeamRB', shaftText(t, 'shaftBeamRes', { r: kN(res.RB.R) }));
  setTxt('shaftBeamRBSub', `V ${kN(res.RB.V)} · H ${kN(res.RB.H)}` + (res.RB.axial ? ` · ${shaftText(t, 'shaftBeamAxial', { a: kN(res.RB.axial) })}` : ''));
  const CA = shaftBearingC(res.RA.R, bi.life, bi.bearingType), CB = shaftBearingC(res.RB.R, bi.life, bi.bearingType);
  setTxt('shaftBeamC', `${kN(CA)} / ${kN(CB)} kN`);
  setTxt('shaftBeamCSub', `C = R · L^(1/${bi.bearingType === 'roller' ? '3.33' : '3'}), L = ${shaftFmt(bi.life, 1)}·10⁶`);
  const cr = res.critical;
  setTxt('shaftBeamCrit', shaftText(t, 'shaftBeamCritFmt', { x: shaftFmt(cr.x, 1) }));
  setTxt('shaftBeamCritSub', shaftText(t, 'shaftBeamCritSub', { mf: shaftFmt(cr.Mf, 0), mt: shaftFmt(Math.abs(cr.T), 0) }));

  const xs = shaftVal('shaftSecX', cr.x);
  const sec = shaftBeamSection(res, xs);
  setTxt('shaftSecInfo', shaftText(t, 'shaftSecInfoFmt', { mf: shaftFmt(sec.Mf, 1), mv: shaftFmt(sec.Mv, 1), mh: shaftFmt(sec.Mh, 1), mt: shaftFmt(Math.abs(sec.T), 1), n: shaftFmt(sec.N, 0) }));

  renderShaftBeamWarnings(warnings);
  drawShaftBeamChart(res, bi, xs, t);
}

// Internal actions at a section: the side (just left / just right of a load) with the larger bending moment
function shaftBeamSection(res, x) {
  const l = res.at(x, -1), r = res.at(x, 1);
  const s = r.Mf >= l.Mf ? r : l;
  return { ...s, T: Math.abs(l.T) > Math.abs(r.T) ? l.T : r.T };
}

function renderShaftBeamWarnings(warnings) {
  // reuse the info line under the chart title area: shown in the section picker card
  const el = document.getElementById('shaftSecInfo');
  if (!el) return;
  const old = el.parentElement.querySelector('.shaft-beam-warn');
  if (old) old.remove();
  if (!warnings.length) return;
  const ul = document.createElement('ul');
  ul.className = 'shaft-beam-warn mt-2 space-y-1 text-[11px] text-amber-400/90 font-sans';
  for (const w of warnings) { const li = document.createElement('li'); li.innerText = '⚠ ' + w; ul.appendChild(li); }
  el.parentElement.appendChild(ul);
}

function shaftGoToCritical() {
  if (!lastShaftBeam) return;
  const el = document.getElementById('shaftSecX');
  if (el) el.value = Math.round(lastShaftBeam.critical.x * 10) / 10;
  calculateShafts();
}

// Copies the internal actions of the chosen section into the fatigue design (step 2)
function shaftUseSection() {
  if (!lastShaftBeam) return;
  const x = shaftVal('shaftSecX', lastShaftBeam.critical.x);
  const s = shaftBeamSection(lastShaftBeam, x);
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  set('shaftMf', Math.round(s.Mf * 10) / 10);
  set('shaftAxial', Math.round(s.N));
  const tq = document.getElementById('shaftSecTorque');
  if (tq) tq.checked = Math.abs(s.T) > 1e-6;
  setShaftMode('design');
}

// Diagram: shaft with supports and loads, bending moments in V, H and resultant, torque
function drawShaftBeamChart(res, bi, xSel, t) {
  const svg = document.getElementById('shaftBeamChart');
  if (!svg) return;
  const X0 = 55, X1 = 575;
  const span = Math.max(res.xmax - res.xmin, 1);
  const X = x => X0 + (x - res.xmin) / span * (X1 - X0);
  const f0 = v => Math.round(v);
  let s = '';

  // ---- lane 1: shaft, supports, loads (y 12..92)
  const yS = 52;
  s += `<line x1="${X(res.xmin) - 8}" y1="${yS}" x2="${X(res.xmax) + 8}" y2="${yS}" stroke="#cbd5e1" stroke-width="3"/>`;
  for (const [x, lab] of [[bi.xA, 'A'], [bi.xB, 'B']]) {
    const px = X(x);
    s += `<polygon points="${px},${yS + 3} ${px - 7},${yS + 15} ${px + 7},${yS + 15}" fill="none" stroke="#94a3b8" stroke-width="1.4"/>`;
    s += `<text x="${px}" y="${yS + 27}" fill="#94a3b8" font-size="10" text-anchor="middle" font-family="monospace">${lab}</text>`;
  }
  for (const l of res.loads) {
    const px = X(l.x), el = l.el;
    if (el.type === 'gear') {
      const h = Math.max(10, Math.min(36, el.d / 8));
      s += `<rect x="${px - 4}" y="${yS - h}" width="8" height="${2 * h}" fill="rgba(168,85,247,0.25)" stroke="#a855f7" stroke-width="1.2"/>`;
    } else if (el.type === 'coupling') {
      s += `<rect x="${px - 6}" y="${yS - 7}" width="12" height="14" fill="rgba(148,163,184,0.2)" stroke="#94a3b8" stroke-width="1.2"/>`;
    }
    // V force: vertical arrow; H force: ⊙ (+H, out of the page) or ⊗ (−H)
    if (Math.abs(l.Fv) > 1e-9) {
      const up = l.Fv > 0, y1 = up ? yS + 32 : yS - 32, y2 = up ? yS + 6 : yS - 6;
      s += `<line x1="${px + 10}" y1="${y1}" x2="${px + 10}" y2="${y2}" stroke="#38bdf8" stroke-width="1.6"/>`;
      s += `<polygon points="${px + 10},${y2} ${px + 7},${y2 + (up ? 6 : -6)} ${px + 13},${y2 + (up ? 6 : -6)}" fill="#38bdf8"/>`;
      const right = px + 60 < X1;
      s += `<text x="${right ? px + 14 : px + 6}" y="${up ? yS + 30 : yS - 36}" fill="#38bdf8" font-size="8" text-anchor="${right ? 'start' : 'end'}" font-family="monospace">V ${shaftFmt(l.Fv / 1000, 1)}</text>`;
    }
    if (Math.abs(l.Fh) > 1e-9) {
      const cy = yS - 20;
      s += `<circle cx="${px - 14}" cy="${cy}" r="5" fill="none" stroke="#fbbf24" stroke-width="1.2"/>`;
      s += l.Fh > 0 ? `<circle cx="${px - 14}" cy="${cy}" r="1.4" fill="#fbbf24"/>`
        : `<path d="M ${px - 17} ${cy - 3} L ${px - 11} ${cy + 3} M ${px - 11} ${cy - 3} L ${px - 17} ${cy + 3}" stroke="#fbbf24" stroke-width="1.1"/>`;
      s += `<text x="${px - 21}" y="${cy + 3}" fill="#fbbf24" font-size="8" text-anchor="end" font-family="monospace">H ${shaftFmt(l.Fh / 1000, 1)}</text>`;
    }
  }

  // ---- lane 2: bending moments (y 108..238, zero at 173)
  const y0 = 175, hM = 56;
  const smp = res.samples;
  const mMax = Math.max(1e-9, ...smp.map(p => Math.max(Math.abs(p.Mv), Math.abs(p.Mh), p.Mf)));
  const Y = m => y0 - m / mMax * hM;
  const poly = key => smp.map(p => `${X(p.x).toFixed(1)},${Y(p[key]).toFixed(1)}`).join(' ');
  s += `<line x1="${X0}" y1="${y0}" x2="${X1}" y2="${y0}" stroke="#475569" stroke-width="1"/>`;
  s += `<polyline points="${poly('Mv')}" fill="none" stroke="#38bdf8" stroke-width="1.2"/>`;
  s += `<polyline points="${poly('Mh')}" fill="none" stroke="#fbbf24" stroke-width="1.2"/>`;
  s += `<polyline points="${poly('Mf')}" fill="none" stroke="#f43f5e" stroke-width="2.2"/>`;
  const cr = res.critical;
  s += `<circle cx="${X(cr.x)}" cy="${Y(cr.Mf)}" r="3.5" fill="#f43f5e"/>`;
  s += `<text x="${X(cr.x)}" y="${Y(cr.Mf) - 7}" fill="#f43f5e" font-size="9" text-anchor="middle" font-family="monospace">${f0(cr.Mf)} N·m</text>`;
  s += `<text x="8" y="${y0 - hM + 4}" fill="#94a3b8" font-size="8" font-family="monospace">N·m</text>`;
  // legend
  const leg = [['#38bdf8', t.shaftLegendMV], ['#fbbf24', t.shaftLegendMH], ['#f43f5e', t.shaftLegendMf], ['#a855f7', t.shaftLegendT]];
  leg.forEach(([c, lab], i) => {
    const lx = X0 + i * 120;
    s += `<line x1="${lx}" y1="250" x2="${lx + 14}" y2="250" stroke="${c}" stroke-width="2"/><text x="${lx + 18}" y="253" fill="#94a3b8" font-size="8" font-family="monospace">${lab}</text>`;
  });

  // ---- lane 3: torque (y 258..318, zero at 300)
  const yT = 302, hT = 34;
  const tMax = Math.max(1e-9, ...smp.map(p => Math.abs(p.T)));
  s += `<line x1="${X0}" y1="${yT}" x2="${X1}" y2="${yT}" stroke="#475569" stroke-width="1"/>`;
  const tPts = smp.map(p => `${X(p.x).toFixed(1)},${(yT - Math.abs(p.T) / tMax * hT).toFixed(1)}`);
  s += `<polygon points="${X(res.xmin).toFixed(1)},${yT} ${tPts.join(' ')} ${X(res.xmax).toFixed(1)},${yT}" fill="rgba(168,85,247,0.12)" stroke="none"/>`;
  s += `<polyline points="${tPts.join(' ')}" fill="none" stroke="#a855f7" stroke-width="1.6"/>`;
  if (tMax > 1e-6) s += `<text x="8" y="${yT - hT + 4}" fill="#a855f7" font-size="8" font-family="monospace">${f0(tMax)}</text>`;

  // positions on the axis + selected section
  const marks = [...new Set([bi.xA, bi.xB, ...res.loads.map(l => l.x)])].sort((a, b) => a - b);
  for (const m of marks) s += `<text x="${X(m)}" y="326" fill="#64748b" font-size="8" text-anchor="middle" font-family="monospace">${shaftFmt(m, m % 1 ? 1 : 0)}</text>`;
  if (Number.isFinite(xSel) && xSel >= res.xmin - 1e-9 && xSel <= res.xmax + 1e-9) {
    const px = X(xSel);
    s += `<line x1="${px}" y1="14" x2="${px}" y2="318" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 3" opacity="0.7"/>`;
    s += `<text x="${px + 3}" y="22" fill="#e2e8f0" font-size="8" font-family="monospace">x=${shaftFmt(xSel, 1)}</text>`;
  }
  svg.innerHTML = s;
}
