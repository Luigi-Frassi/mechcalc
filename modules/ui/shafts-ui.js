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
  const key = {
    key: document.getElementById('shaftKeyType')?.value, condition: document.getElementById('shaftKeyCond')?.value,
    keyKe: shaftVal('shaftKeyKe', 1), keyKeT: shaftVal('shaftKeyKeT', 1)
  };
  const shoulderGeo = { Dd: Math.max(1, shaftVal('shaftDd', 1.1)), r: Math.max(0.05, shaftVal('shaftR', 1)) };
  if (notchType === 'shoulder') {
    notch = { type: 'shoulder', ...shoulderGeo };
  } else if (notchType === 'combined') {
    notch = { type: 'combined', ...shoulderGeo, ...key };
  } else if (notchType === 'keyway') {
    notch = { type: 'keyway', ...key };
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
  const shoulder = notchType === 'shoulder' || notchType === 'combined';
  const keyway = notchType === 'keyway' || notchType === 'combined';
  const keyGiven = keyway && document.getElementById('shaftKeyType')?.value === 'given';
  shaftShow('shaftCycles', document.getElementById('shaftLife')?.value === 'finite');
  shaftShow('colShaftDcheck', mode === 'check');
  shaftShow('colShaftDd', shoulder && mode === 'design');
  shaftShow('colShaftDDcheck', shoulder && mode === 'check');
  shaftShow('colShaftR', shoulder);
  shaftShow('colShaftKeyType', keyway);
  shaftShow('colShaftKeyCond', keyway && !keyGiven);
  shaftShow('colShaftKeyKe', keyGiven);
  shaftShow('colShaftKeyKeT', keyGiven);
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
  if (shaftSeatAuto && notchType === 'combined') warnings.push(t.shaftSeatAuto);
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

  // ---- check mode: maximum load at this diameter (all loads scaled together, X ∝ 1/load)
  const lambda = Math.min(res.Xfatigue, res.Xyield) / Xreq;
  const showMax = mode === 'check' && Number.isFinite(lambda);
  shaftShow('shaftMaxCard', showMax);
  if (showMax) {
    const L = inp.loads, vals = [];
    if (L.Mf) vals.push(`Mf max = ${shaftFmt(L.Mf * lambda, 1)} N·m`);
    if (L.Mt) vals.push(`Mt max = ${shaftFmt(L.Mt * lambda, 1)} N·m`);
    if (L.N) vals.push(`N max = ${shaftFmt(L.N * lambda, 0)} N`);
    if (torqueInput === 'power') vals.push(shaftText(t, 'shaftMaxPower', { p: shaftFmt(shaftVal('shaftPower', 0) * lambda, 2), n: shaftFmt(shaftVal('shaftSpeed', 0), 0) }));
    setTxt('shaftMaxFactor', shaftText(t, 'shaftMaxFactorFmt', { l: shaftFmt(lambda, 3) }));
    setTxt('shaftMaxValues', vals.join(' · '));
    setTxt('shaftMaxSub', shaftText(t, 'shaftMaxSub', { g: res.Xfatigue <= res.Xyield ? t.shaftMaxGovF : t.shaftMaxGovY }));
  }

  // ---- breakdown
  const isShoulder = shoulder && res.KtB !== undefined;
  setTxt('shaftBkKt', isShoulder ? `${shaftFmt(res.KtB, 2)} / ${shaftFmt(res.KtT, 2)}` : '—');
  setTxt('shaftBkQ', isShoulder ? `${shaftFmt(res.qB, 2)} / ${shaftFmt(res.qT, 2)}` : '—');
  setTxt('shaftBkKe', notchType === 'combined'
    ? `${shaftFmt(res.ke, 2)} / ${shaftFmt(res.keT, 2)} = ` + shaftText(t, 'shaftBkKeCombined', {
      s: `${shaftFmt(res.shoulderKe, 2)}/${shaftFmt(res.shoulderKeT, 2)}`, k: `${shaftFmt(res.keyKe, 2)}/${shaftFmt(res.keyKeT, 2)}` })
    : `${shaftFmt(res.ke, 2)} / ${shaftFmt(res.keT, 2)}`);
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
  shaftShow('shaftMaxCard', false);
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
  if ((notchType === 'shoulder' || notchType === 'combined') && D) {
    // small diameter on the left, shoulder on the right, fillet radius at the corner
    const path = `M 30 ${cy - hd} L ${xs - rPx} ${cy - hd} Q ${xs} ${cy - hd} ${xs} ${cy - hd - rPx} L ${xs} ${cy - hD} L 270 ${cy - hD}
      L 270 ${cy + hD} L ${xs} ${cy + hD} L ${xs} ${cy + hd + rPx} Q ${xs} ${cy + hd} ${xs - rPx} ${cy + hd} L 30 ${cy + hd} Z`;
    s += `<path d="${path}" fill="rgba(56,189,248,0.10)" stroke="#38bdf8" stroke-width="1.6"/>`;
    s += `<text x="${xs - 6}" y="${cy - hd - 6}" fill="#fbbf24" font-size="9" text-anchor="end" font-family="monospace">r ${shaftFmt(r, 1)}</text>`;
    if (notchType === 'combined') {
      s += `<rect x="70" y="${cy - hd}" width="${xs - 90}" height="${Math.max(3, hd * 0.25)}" fill="#0f172a" stroke="#fbbf24" stroke-width="1"/>`;
    }
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
      share: Math.max(0, shaftVal(p + 'Share', 100)) / 100,
      FtDir: g(p + 'FtDir') || '+V',
      FrDir: g(p + 'FrDir') || '+H',
      FaDir: g(p + 'FaDir') || '+x',
      Fv: shaftVal(p + 'Fv', 0), Fh: shaftVal(p + 'Fh', 0), Fa: shaftVal(p + 'Fa', 0), e: shaftVal(p + 'E', 0)
    };
  });
  return {
    L: Math.max(0, shaftVal('shaftLength', 0)),
    xA: shaftVal('shaftXA', 0), xB: shaftVal('shaftXB', 240),
    axialBearing: g('shaftAxialBearing') === 'B' ? 'B' : 'A',
    theta: shaftVal('shaftTheta', 20),
    life: Math.max(0, shaftVal('shaftBearingLife', 10)),
    bearingType: g('shaftBearingType') === 'roller' ? 'roller' : 'ball',
    elements, Mt
  };
}

let lastShaftBeam = null;
let shaftSeatAuto = false;   // notch set to shoulder + keyway because the section is on a gear seat

// Screen direction of a force in the end view seen from B, looking towards A (V up, +H to the left:
// +H comes out of the side view towards the viewer, which from B is on the left)
function shaftEndViewVec(dir) {
  const [plane, sgn] = shaftDirVec(dir);
  return plane === 'V' ? [0, -sgn] : [-sgn, 0];
}

const SHAFT_DIR_WORDS = {
  en: { '+V': '↑ +V', '-V': '↓ −V', '+H': '⊙ +H', '-H': '⊗ −H' },
  it: { '+V': '↑ +V', '-V': '↓ −V', '+H': '⊙ +H', '-H': '⊗ −H' }
};

// Oblique (cavalier) view of the whole shaft, horizontal, as in the hand solutions: x to the right, +V up,
// +H towards the viewer (drawn down-left). The selected gear shows its mesh point and the forces Ft, Fr (and Fa)
// it applies to the shaft; the other elements are drawn faded for context.
function shaftGearIsoView(el, bi, labels, active, Mt, t) {
  const W = 400, H = 220, ax = 104;                       // axis height on screen
  const xs = [bi.xA, bi.xB, ...active.map(e => e.x)];
  if (bi.L > 0) xs.push(0, bi.L);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), span = Math.max(x1 - x0, 1);
  const X = x => 100 + (x - x0) / span * (W - 130);
  const hx = -0.62, hy = 0.42;                            // screen vector of a unit +H (towards the viewer)
  const P = (x, v, h) => [X(x) + hx * h, ax - v + hy * h];
  const pt = p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  const vecOf = dir => { const [pl, sg] = shaftDirVec(dir); return pl === 'V' ? [sg, 0] : [0, sg]; };  // [v, h]
  const arrow = (a, b, col, w = 2.6) => {
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), hd = 9;
    return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${col}" stroke-width="${w}"/>` +
      `<polygon points="${b[0]},${b[1]} ${b[0] - hd * Math.cos(ang - 0.42)},${b[1] - hd * Math.sin(ang - 0.42)} ${b[0] - hd * Math.cos(ang + 0.42)},${b[1] - hd * Math.sin(ang + 0.42)}" fill="${col}"/>`;
  };
  const disc = (x, R, stroke, fill, sw) => {
    const pts = [];
    for (let i = 0; i <= 48; i++) { const a = i / 48 * 2 * Math.PI; pts.push(pt(P(x, R * Math.cos(a), R * Math.sin(a)))); }
    return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  };
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="shrink-0 max-w-full h-auto bg-slate-950/60 rounded-lg border border-slate-800">`;
  // reference triad (bottom left)
  const o = [34, H - 30];
  s += arrow(o, [o[0] + 26, o[1]], '#64748b', 1.4) + arrow(o, [o[0], o[1] - 26], '#38bdf8', 1.4) + arrow(o, [o[0] + hx * 30, o[1] + hy * 30], '#fbbf24', 1.4);
  s += `<text x="${o[0] + 29}" y="${o[1] + 4}" fill="#64748b" font-size="9" font-family="monospace">x</text>`;
  s += `<text x="${o[0] + 4}" y="${o[1] - 22}" fill="#38bdf8" font-size="9" font-family="monospace">+V</text>`;
  s += `<text x="${o[0] + hx * 30 + 14}" y="${o[1] + hy * 30 + 6}" fill="#fbbf24" font-size="9" font-family="monospace">+H ⊙</text>`;
  // faded context: other gears and couplings
  for (const e of active) {
    if (e === el) continue;
    if (e.type === 'gear') s += disc(e.x, Math.max(14, Math.min(40, e.d / 6)), 'rgba(168,85,247,0.35)', 'rgba(168,85,247,0.05)', 1);
    else s += `<rect x="${X(e.x) - 6}" y="${ax - 8}" width="12" height="16" fill="none" stroke="rgba(148,163,184,0.4)"/>`;
  }
  // shaft and bearings
  const xa = x0, xb = x1;
  s += `<line x1="${X(xa)}" y1="${ax}" x2="${X(xb)}" y2="${ax}" stroke="#cbd5e1" stroke-width="6" stroke-linecap="round"/>`;
  for (const xbng of [bi.xA, bi.xB]) {
    const px = X(xbng);
    s += `<polygon points="${px},${ax + 4} ${px - 7},${ax + 16} ${px + 7},${ax + 16}" fill="none" stroke="#94a3b8" stroke-width="1.4"/>`;
  }
  for (const p of labels.points) s += `<text x="${X(p.x)}" y="${ax + 46}" fill="#64748b" font-size="10" text-anchor="middle" font-family="monospace">${p.name}</text>`;
  // the selected gear and its forces on the shaft
  const R = Math.max(26, Math.min(46, el.d / 5));
  s += disc(el.x, R, '#a855f7', 'rgba(168,85,247,0.10)', 1.6);
  const [fv, fh] = vecOf(el.FrDir), [tv, th] = vecOf(el.FtDir);
  const m3 = [-fv * R, -fh * R];                          // mesh point (v, h): opposite to Fr
  const M = P(el.x, m3[0], m3[1]);
  const len = 38, lenH = 52;                              // H looks shorter in the oblique view: longer arrow
  const tip = (v, h) => P(el.x, m3[0] + v * len, m3[1] + h * lenH);
  const loads = shaftElementLoads(el, Mt, bi.theta);
  s += arrow(M, tip(fv, fh), '#f43f5e');
  s += arrow(M, tip(tv, th), '#34d399');
  // label just beyond the arrow tip, on the side the arrow points to
  const lab = (b, txt, col) => {
    const dx = b[0] - M[0], dy = b[1] - M[1], n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n;
    const anchor = ux > 0.3 ? 'start' : ux < -0.3 ? 'end' : 'middle';
    const tx = b[0] + ux * 6, ty = b[1] + uy * 6 + (uy > 0.3 ? 10 : uy < -0.3 ? -2 : 4);
    return `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" fill="${col}" font-size="10.5" font-weight="bold" text-anchor="${anchor}" font-family="monospace">${txt}</text>`;
  };
  s += lab(tip(fv, fh), `Fr ${shaftFmt(loads.Fr, 0)} N`, '#f43f5e');
  s += lab(tip(tv, th), `Ft ${shaftFmt(loads.Ft, 0)} N`, '#34d399');
  if (loads.FaMag > 0) {
    const sa = el.FaDir === '-x' ? -1 : 1, aEnd = [M[0] + sa * 40, M[1]];
    s += arrow(M, aEnd, '#fbbf24');
    s += `<text x="${aEnd[0] + (sa > 0 ? 4 : -4)}" y="${aEnd[1] - 5}" fill="#fbbf24" font-size="10.5" font-weight="bold" text-anchor="${sa > 0 ? 'start' : 'end'}" font-family="monospace">Fa</text>`;
  }
  s += `<circle cx="${M[0]}" cy="${M[1]}" r="3.5" fill="#e2e8f0"/>`;
  s += `<text x="${W - 8}" y="16" fill="#94a3b8" font-size="9.5" text-anchor="end" font-family="monospace">${t.shaftIsoTitle}</text>`;
  return s + '</svg>';
}

// Small end view of a gear (seen from B): mesh point, Fr towards the axis, Ft tangent
function shaftGearEndView(el, t, L) {
  // viewBox 200 × 170, drawn at 260 px: big enough to read the directions at a glance
  const c = 100, cy = 96, R = 52, len = 40;
  const [fx, fy] = shaftEndViewVec(el.FrDir), [tx, ty] = shaftEndViewVec(el.FtDir);
  const mx = c - fx * R, my = cy - fy * R;                   // mesh point: opposite to Fr
  const arrow = (x1, y1, x2, y2, col) => {
    const a = Math.atan2(y2 - y1, x2 - x1), h = 9;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="3"/>` +
      `<polygon points="${x2},${y2} ${x2 - h * Math.cos(a - 0.42)},${y2 - h * Math.sin(a - 0.42)} ${x2 - h * Math.cos(a + 0.42)},${y2 - h * Math.sin(a + 0.42)}" fill="${col}"/>`;
  };
  // label beside the middle of the arrow, on the side away from the shaft axis
  // (Fr: on the side opposite to Ft, so the two never overlap)
  const lab = (x, y, dx, dy, txt, col, side = null) => {
    const midx = x + dx * len / 2, midy = y + dy * len / 2;
    let nx = -dy, ny = dx;
    if (side) { nx = side[0]; ny = side[1]; }
    else if ((midx + nx - c) * nx + (midy + ny - cy) * ny < 0) { nx = -nx; ny = -ny; }
    const lx = midx + nx * 8, ly = midy + ny * 8 + (ny > 0 ? 9 : ny < 0 ? -2 : 4);
    const anchor = nx > 0 ? 'start' : nx < 0 ? 'end' : 'middle';
    return `<text x="${lx}" y="${ly}" fill="${col}" font-size="11" font-weight="bold" text-anchor="${anchor}" font-family="monospace">${txt}</text>`;
  };
  const words = { '+V': '+V', '-V': '−V', '+H': '+H ⊙', '-H': '−H ⊗' };
  let s = `<svg viewBox="0 0 200 196" width="260" height="255" class="shrink-0 bg-slate-950/60 rounded-lg border border-slate-800">`;
  // axes of the end view: V up, H to the right (seen from A, +H out of the side view = to the right here)
  s += `<line x1="${c}" y1="22" x2="${c}" y2="170" stroke="#334155" stroke-width="1" stroke-dasharray="4 3"/>`;
  s += `<line x1="30" y1="${cy}" x2="170" y2="${cy}" stroke="#334155" stroke-width="1" stroke-dasharray="4 3"/>`;
  s += `<text x="${c - 5}" y="24" text-anchor="end" fill="#38bdf8" font-size="10" font-family="monospace">+V</text>`;
  s += `<text x="26" y="${cy + 4}" fill="#fbbf24" font-size="10" text-anchor="end" font-family="monospace">+H</text>`;
  s += `<circle cx="${c}" cy="${cy}" r="${R}" fill="rgba(168,85,247,0.06)" stroke="#a855f7" stroke-width="1.4" stroke-dasharray="5 3"/>`;
  s += `<circle cx="${c}" cy="${cy}" r="11" fill="rgba(203,213,225,0.25)" stroke="#cbd5e1" stroke-width="1.5"/>`;
  s += arrow(mx, my, mx + fx * len, my + fy * len, '#f43f5e');
  s += arrow(mx, my, mx + tx * len, my + ty * len, '#34d399');
  s += `<circle cx="${mx}" cy="${my}" r="4" fill="#e2e8f0"/>`;
  s += lab(mx, my, fx, fy, `Fr ${words[el.FrDir]}`, '#f43f5e', [-tx, -ty]);
  s += lab(mx, my, tx, ty, `Ft ${words[el.FtDir]}`, '#34d399');
  s += `<text x="100" y="190" fill="#94a3b8" font-size="9.5" text-anchor="middle" font-family="monospace">${t.shaftEndViewTitle}${L ? ' · ' + L : ''}</text>`;
  return s + '</svg>';
}

function calculateShaftBeam(t, Mt) {
  const bi = readShaftBeamInputs(Mt);
  const warnings = [];
  const words = SHAFT_DIR_WORDS[currentLang] || SHAFT_DIR_WORDS.en;
  const active = bi.elements.filter(e => e.type !== 'none');
  const labels = shaftPointLabels(bi.xA, bi.xB, active.map(e => e.x), bi.L);
  const nameOf = el => labels.elements[active.indexOf(el)] || '';

  // visibility of the element fields, element names and gear info
  for (const el of bi.elements) {
    const p = 'shaftEl' + el.slot, gear = el.type === 'gear', force = el.type === 'force', any = el.type !== 'none';
    shaftShow('col' + p[0].toUpperCase() + p.slice(1) + 'X', any);
    for (const f of ['D', 'Helix', 'FtDir', 'FrDir']) shaftShow('colShaftEl' + el.slot + f, gear);
    shaftShow('colShaftEl' + el.slot + 'FaDir', gear && el.helix > 0);
    shaftShow('colShaftEl' + el.slot + 'Torque', gear || el.type === 'coupling');
    shaftShow('colShaftEl' + el.slot + 'Share', gear || el.type === 'coupling');
    for (const f of ['Fv', 'Fh', 'Fa', 'E']) shaftShow('colShaftEl' + el.slot + f, force);
    const tag = document.getElementById(p + 'Name');
    if (tag) tag.innerText = any ? '→ ' + nameOf(el) : '';
    const info = document.getElementById(p + 'Info');
    if (info) {
      if (gear) {
        const L = shaftElementLoads(el, Mt, bi.theta);
        const txt = shaftText(t, L.FaMag > 0 ? 'shaftElGearInfoA' : 'shaftElGearInfo',
          { ft: shaftFmt(L.Ft, 0), fr: shaftFmt(L.Fr, 0), fa: shaftFmt(L.FaMag, 0) }) +
          ' · ' + shaftText(t, 'shaftElGearDirs', { ft: words[el.FtDir], fr: words[el.FrDir] }) +
          (el.torque === 'none' ? ' · ' + shaftText(t, 'shaftElIdlerInfo', { mt: shaftFmt(L.MtEl, 1) })
            : Math.abs(el.share - 1) > 1e-9 ? ' · ' + shaftText(t, 'shaftElMtInfo', { mt: shaftFmt(L.MtEl, 1) }) : '');
        const same = el.FtDir.slice(1) === el.FrDir.slice(1);
        info.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.className = 'flex flex-wrap items-center gap-4';
        if (!same) wrap.innerHTML = shaftGearIsoView(el, bi, labels, active, Mt, t) + shaftGearEndView(el, t, nameOf(el));
        const span = document.createElement('span');
        span.innerText = txt;
        wrap.appendChild(span);
        info.appendChild(wrap);
        if (same) warnings.push(`${t.shaftElLabel} ${el.slot}: ${t.shaftElSamePlane}`);
      } else info.innerText = '';
    }
  }

  // bearing names in the inputs
  const n1 = labels.bearing1, n2 = labels.bearing2;
  const axSel = document.getElementById('shaftAxialBearing');
  if (axSel && axSel.options.length === 2) {
    axSel.options[0].text = `${t.optBearingA} · ${n1}`;
    axSel.options[1].text = `${t.optBearingB} · ${n2}`;
  }

  const res = shaftBeam({ xA: bi.xA, xB: bi.xB, L: bi.L, elements: bi.elements, Mt, theta: bi.theta, axialBearing: bi.axialBearing });
  lastShaftBeam = res.ok ? res : null;
  const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
  setTxt('shaftBeamRATitle', shaftText(t, 'shaftReactionAt', { p: n1, n: 1 }));
  setTxt('shaftBeamRBTitle', shaftText(t, 'shaftReactionAt', { p: n2, n: 2 }));
  setTxt('shaftBeamCTitle', shaftText(t, 'shaftBearingCTitle', { a: n1, b: n2 }));
  if (!res.ok) {
    warnings.push(t.shaftBeamSupportsErr);
    for (const id of ['shaftBeamRA', 'shaftBeamRB', 'shaftBeamC', 'shaftBeamCrit']) setTxt(id, '--');
    for (const id of ['shaftBeamRASub', 'shaftBeamRBSub', 'shaftBeamCSub', 'shaftBeamCritSub', 'shaftSecInfo', 'shaftBeamLifeInfo']) setTxt(id, '');
    renderShaftBeamWarnings(warnings);
    const svg = document.getElementById('shaftBeamChart'); if (svg) svg.innerHTML = '';
    return;
  }
  // points outside the shaft
  if (bi.L > 0) {
    for (const p of [{ x: bi.xA, n: n1 }, { x: bi.xB, n: n2 }, ...active.map(e => ({ x: e.x, n: nameOf(e) }))]) {
      if (p.x < -1e-9 || p.x > bi.L + 1e-9) warnings.push(shaftText(t, 'shaftOutsideShaft', { p: p.n, x: shaftFmt(p.x, 1) }));
    }
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
  // life in hours (speed known when the torque comes from power and speed) and life with catalog ratings
  const nRpm = document.getElementById('shaftTorqueInput')?.value === 'torque' ? 0 : shaftVal('shaftSpeed', 0);
  const lifeLines = [];
  if (nRpm > 0) lifeLines.push(shaftText(t, 'shaftLifeHours', { l: shaftFmt(bi.life, 1), h: shaftFmt(bi.life * 1e6 / (60 * nRpm), 0), n: shaftFmt(nRpm, 0) }));
  for (const [cId, R, name] of [['shaftBearingCA', res.RA.R, n1], ['shaftBearingCB', res.RB.R, n2]]) {
    const Ccat = shaftVal(cId, 0) * 1000;
    if (!(Ccat > 0)) continue;
    const lf = shaftBearingLife(Ccat, R, bi.bearingType, nRpm);
    lifeLines.push(shaftText(t, 'shaftLifeCatalog', { p: name, lp: shaftFmt(lf.L, 1), hp: lf.hours === null ? '—' : shaftFmt(lf.hours, 0) }));
  }
  setTxt('shaftBeamLifeInfo', lifeLines.join('\n'));
  const cr = res.critical;
  const crName = (res.labels.points.find(p => Math.abs(p.x - cr.x) < 1e-6) || {}).name;
  setTxt('shaftBeamCrit', shaftText(t, 'shaftBeamCritFmt', { x: shaftFmt(cr.x, 1) }) + (crName ? ` (${crName})` : ''));
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
  // section on the seat of a gear or coupling: in the course the hub sits on a keyway next to a shoulder
  const seat = lastShaftBeam.loads.some(l => (l.el.type === 'gear' || l.el.type === 'coupling') && Math.abs(l.x - x) < 1e-6);
  shaftSeatAuto = seat;
  if (seat) set('shaftNotchType', 'combined');
  setShaftMode('design');
}

// Diagram, as in the course solutions: the shaft with the named points, then for each plane (V, H)
// the forces in that plane (reactions included) and its bending moment, then the resultant Mf and the torque.
function drawShaftBeamChart(res, bi, xSel, t) {
  const svg = document.getElementById('shaftBeamChart');
  if (!svg) return;
  const X0 = 55, X1 = 575;
  const span = Math.max(res.xmax - res.xmin, 1);
  const X = x => X0 + (x - res.xmin) / span * (X1 - X0);
  const f0 = v => Math.round(v);
  const kN = v => shaftFmt(v / 1000, 2);
  const points = res.labels.points;
  const title = (y, txt, col = '#cbd5e1') => `<text x="8" y="${y}" fill="${col}" font-size="9" font-weight="bold" font-family="monospace">${txt}</text>`;
  let s = '';

  // ---- 1. shaft with ends, bearings, elements and names (y 0..100)
  s += title(14, t.shaftChartShaft);
  const yS = 50;
  s += `<line x1="${X(res.xmin)}" y1="${yS}" x2="${X(res.xmax)}" y2="${yS}" stroke="#cbd5e1" stroke-width="4"/>`;
  for (const x of [bi.xA, bi.xB]) {
    const px = X(x);
    s += `<polygon points="${px},${yS + 3} ${px - 7},${yS + 15} ${px + 7},${yS + 15}" fill="none" stroke="#94a3b8" stroke-width="1.4"/>`;
  }
  for (const l of res.loads) {
    const px = X(l.x), el = l.el;
    if (el.type === 'gear') {
      const h = Math.max(10, Math.min(30, el.d / 8));
      s += `<rect x="${px - 4}" y="${yS - h}" width="8" height="${2 * h}" fill="rgba(168,85,247,0.25)" stroke="#a855f7" stroke-width="1.2"/>`;
    } else if (el.type === 'coupling') {
      s += `<rect x="${px - 6}" y="${yS - 8}" width="12" height="16" fill="rgba(148,163,184,0.2)" stroke="#94a3b8" stroke-width="1.2"/>`;
    } else {
      s += `<circle cx="${px}" cy="${yS}" r="4" fill="#38bdf8"/>`;
    }
  }
  for (const p of points) {
    const px = X(p.x);
    s += `<text x="${px}" y="${yS + 30}" fill="#e2e8f0" font-size="11" font-weight="bold" text-anchor="middle" font-family="monospace">${p.name}</text>`;
    s += `<text x="${px}" y="${yS + 41}" fill="#64748b" font-size="7.5" text-anchor="middle" font-family="monospace">${shaftFmt(p.x, p.x % 1 ? 1 : 0)}</text>`;
  }

  // common scale for the three bending moment diagrams, so they can be compared
  const smp = res.samples;
  const mMax = Math.max(1e-9, ...smp.map(p => p.Mf));
  // one scale for all diagrams: the tallest one (positive + negative part) fills 84 px
  const rng = key => ({ hi: Math.max(0, ...smp.map(p => p[key])), lo: Math.min(0, ...smp.map(p => p[key])) });
  const rV = rng('Mv'), rH = rng('Mh');
  const kM = 84 / Math.max(1e-9, rV.hi - rV.lo, rH.hi - rH.lo, mMax);
  // moment at a named point: the side with the larger magnitude (a couple makes a jump)
  const mAt = (x, key) => { const a = res.at(x, -1)[key], b = res.at(x, 1)[key]; return Math.abs(b) >= Math.abs(a) ? b : a; };

  // ---- 2./3. one block per plane
  const planeBlock = (y0, plane) => {
    const fKey = plane === 'V' ? 'Fv' : 'Fh', cKey = plane === 'V' ? 'Cv' : 'Ch', mKey = plane === 'V' ? 'Mv' : 'Mh';
    const col = plane === 'V' ? '#38bdf8' : '#fbbf24';
    let b = title(y0 + 12, plane === 'V' ? t.shaftChartPlaneV : t.shaftChartPlaneH, col);
    b += `<text x="${X1}" y="${y0 + 12}" fill="#64748b" font-size="7.5" text-anchor="end" font-family="monospace">${plane === 'V' ? t.shaftChartUpV : t.shaftChartUpH}</text>`;
    // beam with the forces of this plane
    const yb = y0 + 48;
    b += `<line x1="${X(res.xmin)}" y1="${yb}" x2="${X(res.xmax)}" y2="${yb}" stroke="#94a3b8" stroke-width="2"/>`;
    const forces = [
      { x: bi.xA, F: res.RA[plane], react: true }, { x: bi.xB, F: res.RB[plane], react: true },
      ...res.loads.map(l => ({ x: l.x, F: l[fKey], C: l[cKey] }))
    ];
    for (const f of forces) {
      const px = X(f.x);
      if (f.react) b += `<polygon points="${px},${yb + 2} ${px - 5},${yb + 10} ${px + 5},${yb + 10}" fill="none" stroke="#64748b" stroke-width="1"/>`;
      if (Math.abs(f.F) > 1e-9) {
        const up = f.F > 0;
        const ya = up ? yb + 30 : yb - 30, yh = up ? yb + 2 : yb - 2;
        const c = f.react ? '#94a3b8' : col;
        b += `<line x1="${px}" y1="${ya}" x2="${px}" y2="${yh}" stroke="${c}" stroke-width="1.8"/>`;
        b += `<polygon points="${px},${yh} ${px - 4},${yh + (up ? 7 : -7)} ${px + 4},${yh + (up ? 7 : -7)}" fill="${c}"/>`;
        const right = px + 50 < X1;
        b += `<text x="${right ? px + 5 : px - 5}" y="${up ? ya - 1 : ya + 7}" fill="${c}" font-size="8" text-anchor="${right ? 'start' : 'end'}" font-family="monospace">${kN(f.F)} kN</text>`;
      }
      if (f.C && Math.abs(f.C) > 1e-9) {
        b += `<path d="M ${px - 8} ${yb - 9} A 9 9 0 1 ${f.C > 0 ? 0 : 1} ${px + 8} ${yb - 9}" fill="none" stroke="${col}" stroke-width="1.1"/>`;
        b += `<text x="${px}" y="${yb - 20}" fill="${col}" font-size="7.5" text-anchor="middle" font-family="monospace">C ${f0(f.C)} N·m</text>`;
      }
    }
    // bending moment diagram of this plane
    const r = plane === 'V' ? rV : rH;
    const ym = y0 + 92 + r.hi * kM + (84 - (r.hi - r.lo) * kM) / 2, hM = r.hi * kM;
    const Y = m => ym - m * kM;
    const pts = smp.map(p => `${X(p.x).toFixed(1)},${Y(p[mKey]).toFixed(1)}`).join(' ');
    b += `<line x1="${X(res.xmin)}" y1="${ym}" x2="${X(res.xmax)}" y2="${ym}" stroke="#475569" stroke-width="1"/>`;
    b += `<polygon points="${X(res.xmin).toFixed(1)},${ym} ${pts} ${X(res.xmax).toFixed(1)},${ym}" fill="${plane === 'V' ? 'rgba(56,189,248,0.12)' : 'rgba(251,191,36,0.12)'}" stroke="none"/>`;
    b += `<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.8"/>`;
    b += `<text x="8" y="${y0 + 96}" fill="${col}" font-size="8" font-family="monospace">${mKey} [N·m]</text>`;
    for (const p of points) {
      const m = mAt(p.x, mKey);
      if (Math.abs(m) < 0.5) continue;
      b += `<circle cx="${X(p.x)}" cy="${Y(m)}" r="2.2" fill="${col}"/>`;
      b += `<text x="${X(p.x)}" y="${m >= 0 ? Y(m) - 5 : Y(m) + 11}" fill="${col}" font-size="8" text-anchor="middle" font-family="monospace">${p.name} ${f0(m)}</text>`;
    }
    return b;
  };
  s += planeBlock(100, 'V');
  s += planeBlock(290, 'H');

  // ---- 4. resultant bending moment
  const yR0 = 478, ymR = 590, hR = mMax * kM;
  s += title(yR0 + 12, t.shaftChartTotal, '#f43f5e');
  const YR = m => ymR - m * kM;
  const ptsR = smp.map(p => `${X(p.x).toFixed(1)},${YR(p.Mf).toFixed(1)}`).join(' ');
  s += `<line x1="${X(res.xmin)}" y1="${ymR}" x2="${X(res.xmax)}" y2="${ymR}" stroke="#475569" stroke-width="1"/>`;
  s += `<polygon points="${X(res.xmin).toFixed(1)},${ymR} ${ptsR} ${X(res.xmax).toFixed(1)},${ymR}" fill="rgba(244,63,94,0.12)" stroke="none"/>`;
  s += `<polyline points="${ptsR}" fill="none" stroke="#f43f5e" stroke-width="2.2"/>`;
  s += `<text x="8" y="${yR0 + 26}" fill="#f43f5e" font-size="8" font-family="monospace">Mf [N·m]</text>`;
  const cr = res.critical;
  for (const p of points) {
    const m = mAt(p.x, 'Mf');
    if (m < 0.5) continue;
    const isCrit = Math.abs(p.x - cr.x) < 1e-6;
    s += `<circle cx="${X(p.x)}" cy="${YR(m)}" r="${isCrit ? 3.8 : 2.2}" fill="#f43f5e"/>`;
    s += `<text x="${X(p.x)}" y="${YR(m) - 6}" fill="#f43f5e" font-size="${isCrit ? 9 : 8}" font-weight="${isCrit ? 'bold' : 'normal'}" text-anchor="middle" font-family="monospace">${p.name} ${f0(m)}</text>`;
  }
  if (!points.some(p => Math.abs(p.x - cr.x) < 1e-6)) {
    s += `<circle cx="${X(cr.x)}" cy="${YR(cr.Mf)}" r="3.8" fill="#f43f5e"/>`;
    s += `<text x="${X(cr.x)}" y="${YR(cr.Mf) - 6}" fill="#f43f5e" font-size="9" font-weight="bold" text-anchor="middle" font-family="monospace">${f0(cr.Mf)}</text>`;
  }

  // ---- 5. torque
  const yT = 650, hT = 30;
  s += title(606, t.shaftChartTorque, '#a855f7');
  const tMax = Math.max(1e-9, ...smp.map(p => Math.abs(p.T)));
  s += `<line x1="${X(res.xmin)}" y1="${yT}" x2="${X(res.xmax)}" y2="${yT}" stroke="#475569" stroke-width="1"/>`;
  const tPts = smp.map(p => `${X(p.x).toFixed(1)},${(yT - Math.abs(p.T) / tMax * hT).toFixed(1)}`);
  s += `<polygon points="${X(res.xmin).toFixed(1)},${yT} ${tPts.join(' ')} ${X(res.xmax).toFixed(1)},${yT}" fill="rgba(168,85,247,0.12)" stroke="none"/>`;
  s += `<polyline points="${tPts.join(' ')}" fill="none" stroke="#a855f7" stroke-width="1.6"/>`;
  if (tMax > 1e-6) s += `<text x="${X1}" y="${yT - hT - 3}" fill="#a855f7" font-size="8" text-anchor="end" font-family="monospace">Mt = ${f0(tMax)} N·m</text>`;

  // named points: thin guides through all the diagrams; selected section dashed
  for (const p of points) {
    s += `<line x1="${X(p.x)}" y1="${yS + 44}" x2="${X(p.x)}" y2="${yT}" stroke="#334155" stroke-width="0.6" stroke-dasharray="1 3"/>`;
  }
  if (Number.isFinite(xSel) && xSel >= res.xmin - 1e-9 && xSel <= res.xmax + 1e-9) {
    const px = X(xSel);
    s += `<line x1="${px}" y1="22" x2="${px}" y2="${yT}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 3" opacity="0.6"/>`;
    s += `<text x="${px + 3}" y="28" fill="#e2e8f0" font-size="8" font-family="monospace">x=${shaftFmt(xSel, 1)}</text>`;
  }
  svg.innerHTML = s;
}
