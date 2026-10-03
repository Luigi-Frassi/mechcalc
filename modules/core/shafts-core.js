// ============================================================================
// MODULE 4: SHAFTS — fatigue design of the critical section
// Core: analytical engine. Pure functions, no DOM access.
// Method of the "Costruzione di Macchine" course (formulario + algoritmo alberi):
//   σa,eq = sqrt((Ke σxa)² + 3 (Ke' τa)²)            (Von Mises on the alternating part)
//   σm,eq = σxm/2 + sqrt((σxm/2)² + τm²)             (max principal stress on the mean part)
//   Goodman:  σa,eq / (b1 b2 σN) + σm,eq / σR = 1/X
//   Yield:    σs / (σa,eq + σm,eq) = X
//   Ke = q (Kt − 1) + 1
// Units: mm, N, N·m, MPa.
// ============================================================================

// ---- b1: size factor (course chart; the points are the original data, straight lines on log d)
const SHAFT_B1 = [
  [10, 1.000], [20, 0.890], [30, 0.835], [40, 0.790], [50, 0.762], [60, 0.740], [70, 0.720],
  [80, 0.705], [90, 0.692], [100, 0.680], [200, 0.614], [300, 0.580], [400, 0.560], [500, 0.545],
  [600, 0.535], [700, 0.529], [800, 0.525], [900, 0.522], [1000, 0.520]
];

function shaftB1(d) {
  const t = SHAFT_B1;
  if (d <= t[0][0]) return t[0][1];
  if (d >= t[t.length - 1][0]) return t[t.length - 1][1];
  let i = 0;
  while (d > t[i + 1][0]) i++;
  const u = (Math.log(d) - Math.log(t[i][0])) / (Math.log(t[i + 1][0]) - Math.log(t[i][0]));
  return t[i][1] + (t[i + 1][1] - t[i][1]) * u;
}

// ---- b2: surface finish factor vs. ultimate strength σR (course chart, digitized, 300-1600 MPa)
const SHAFT_B2_SIGMA = [300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000,
  1050, 1100, 1150, 1200, 1250, 1300, 1350, 1400, 1450, 1500, 1550, 1600];
const SHAFT_B2 = {
  a: { it: 'Lucidatura fine', en: 'Fine polishing', v: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  b: { it: 'Lucidatura media', en: 'Medium polishing', v: [0.980, 0.979, 0.979, 0.978, 0.977, 0.976, 0.974, 0.974, 0.974, 0.973, 0.973, 0.972, 0.971, 0.970, 0.970, 0.969, 0.968, 0.967, 0.966, 0.965, 0.964, 0.963, 0.962, 0.962, 0.961, 0.960, 0.960] },
  c: { it: 'Rettifica fine', en: 'Fine grinding', v: [0.939, 0.938, 0.937, 0.936, 0.935, 0.934, 0.934, 0.932, 0.931, 0.929, 0.928, 0.927, 0.926, 0.925, 0.923, 0.922, 0.922, 0.920, 0.919, 0.918, 0.917, 0.916, 0.914, 0.914, 0.912, 0.911, 0.909] },
  d: { it: 'Rettifica media', en: 'Medium grinding', v: [0.925, 0.919, 0.914, 0.910, 0.905, 0.901, 0.896, 0.891, 0.887, 0.884, 0.881, 0.878, 0.875, 0.872, 0.869, 0.867, 0.864, 0.862, 0.860, 0.858, 0.857, 0.856, 0.855, 0.853, 0.852, 0.851, 0.849] },
  e: { it: 'Sgrossatura buona', en: 'Good rough machining', v: [0.900, 0.890, 0.879, 0.870, 0.860, 0.850, 0.840, 0.831, 0.821, 0.810, 0.800, 0.791, 0.783, 0.774, 0.765, 0.757, 0.749, 0.743, 0.736, 0.731, 0.724, 0.718, 0.712, 0.706, 0.701, 0.695, 0.690] },
  f: { it: 'Sgrossatura normale', en: 'Normal rough machining', v: [0.830, 0.811, 0.794, 0.776, 0.759, 0.742, 0.725, 0.707, 0.690, 0.677, 0.664, 0.651, 0.639, 0.626, 0.613, 0.600, 0.586, 0.573, 0.561, 0.550, 0.540, 0.531, 0.523, 0.514, 0.505, 0.497, 0.490] },
  g: { it: 'Grezzo di laminazione', en: 'As rolled', v: [0.789, 0.756, 0.724, 0.690, 0.656, 0.623, 0.591, 0.563, 0.535, 0.515, 0.494, 0.474, 0.454, 0.436, 0.419, 0.402, 0.386, 0.373, 0.360, 0.348, 0.335, 0.327, 0.320, 0.312, 0.305, 0.300, 0.294] },
  h: { it: 'Corrosione in acqua dolce', en: 'Fresh-water corrosion', v: [0.701, 0.662, 0.625, 0.592, 0.559, 0.527, 0.495, 0.467, 0.440, 0.417, 0.395, 0.375, 0.354, 0.334, 0.315, 0.297, 0.280, 0.264, 0.249, 0.235, 0.221, 0.210, 0.199, 0.190, 0.180, 0.173, 0.165] },
  i: { it: 'Corrosione in acqua di mare', en: 'Sea-water corrosion', v: [0.509, 0.477, 0.445, 0.417, 0.390, 0.370, 0.350, 0.330, 0.309, 0.292, 0.275, 0.257, 0.240, 0.226, 0.211, 0.198, 0.185, 0.175, 0.165, 0.154, 0.144, 0.137, 0.130, 0.122, 0.114, 0.106, 0.099] }
};

function shaftInterp(xs, ys, x) {
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  let i = 0;
  while (x > xs[i + 1]) i++;
  return ys[i] + (ys[i + 1] - ys[i]) * (x - xs[i]) / (xs[i + 1] - xs[i]);
}

function shaftB2(finish, sigmaR) {
  const c = SHAFT_B2[finish] || SHAFT_B2.e;
  return shaftInterp(SHAFT_B2_SIGMA, c.v, sigmaR);
}

// ---- q: notch sensitivity. The course charts follow Neuber exactly: q = 1 / (1 + sqrt(a / r)),
// with sqrt(a) [sqrt(mm)] fitted on each curve (rms error < 0.001).
const SHAFT_Q_SIGMA = [300, 400, 500, 600, 700, 800, 1000, 1200, 1400];
const SHAFT_Q_SQRT_A = {
  bending: [0.8433, 0.5802, 0.4681, 0.3991, 0.3274, 0.2818, 0.2085, 0.1563, 0.1080],
  torsion: [0.5497, 0.4495, 0.3590, 0.3022, 0.2487, 0.2087, 0.1634, 0.1247, 0.0983]
};

function shaftNeuberSqrtA(load, sigmaR) {
  const xs = SHAFT_Q_SIGMA, ys = SHAFT_Q_SQRT_A[load];
  if (sigmaR > xs[xs.length - 1]) {       // beyond the chart: continue the last segment (higher σR -> higher q)
    const n = xs.length;
    const slope = (ys[n - 1] - ys[n - 2]) / (xs[n - 1] - xs[n - 2]);
    return Math.max(0.03, ys[n - 1] + slope * (sigmaR - xs[n - 1]));
  }
  return shaftInterp(xs, ys, Math.max(sigmaR, xs[0]));
}

function shaftQ(load, r, sigmaR) {
  if (!(r > 0)) return 1;
  return 1 / (1 + shaftNeuberSqrtA(load, sigmaR) / Math.sqrt(r));
}

// ---- Kt: shouldered round shaft, Kt ≈ B (r/d)^a (tables of the course charts)
const SHAFT_KT = {
  bending: [[1.01, 0.919, -0.170], [1.03, 0.981, -0.184], [1.10, 0.951, -0.238], [1.50, 0.938, -0.258], [3.00, 0.893, -0.309], [6.00, 0.879, -0.332]],
  torsion: [[1.09, 0.903, -0.127], [1.20, 0.833, -0.216], [2.00, 0.863, -0.239]],
  axial: [[1.01, 0.984, -0.105], [1.05, 1.005, -0.171], [1.20, 0.963, -0.255], [1.50, 1.000, -0.282], [2.00, 1.015, -0.300]]
};
const SHAFT_RD_RANGE = [0.02, 0.30];   // r/d range covered by the charts

// Kt for a D/d ratio: formula on the tabulated ratios, interpolated in ln(D/d − 1)
// (below the first ratio: towards Kt = 1 at D/d = 1; above the last one: last curve)
function shaftKt(load, rd, Dd) {
  const t = SHAFT_KT[load];
  const kAt = row => Math.max(1, row[1] * Math.pow(rd, row[2]));
  if (!(Dd > 1)) return 1;
  if (Dd <= t[0][0]) return 1 + (kAt(t[0]) - 1) * (Dd - 1) / (t[0][0] - 1);
  if (Dd >= t[t.length - 1][0]) return kAt(t[t.length - 1]);
  let i = 0;
  while (Dd > t[i + 1][0]) i++;
  const u = (Math.log(Dd - 1) - Math.log(t[i][0] - 1)) / (Math.log(t[i + 1][0] - 1) - Math.log(t[i][0] - 1));
  return kAt(t[i]) + (kAt(t[i + 1]) - kAt(t[i])) * u;
}

// ---- Keyway: effective notch factors (course table) [torsion Ke', bending Ke]
const SHAFT_KEYWAY = {
  sled:     { annealed: [1.3, 1.6], hardened: [1.6, 2.0] },   // incastrata
  straight: { annealed: [1.3, 1.3], hardened: [1.6, 1.6] },   // dritta
  profile:  { annealed: [1.6, 2.0], hardened: [2.4, 3.0] }    // americana
};

// ---- Fatigue strength for the required life (Wöhler line between 10³ and 10⁶ cycles):
// σ^m N = σR^m 10³ = σLF^m 10⁶,  m = 3 / log10(σR / σLF)
function shaftFatigueStrength(sigmaR, sigmaLF, cycles) {
  if (!cycles || cycles >= 1e6) return { sigmaN: sigmaLF, m: 3 / Math.log10(sigmaR / sigmaLF), finite: false };
  const N = Math.max(1e3, cycles);
  const m = 3 / Math.log10(sigmaR / sigmaLF);
  return { sigmaN: sigmaR * Math.pow(1e3 / N, 1 / m), m, finite: true };
}

// ---- Standard bearing bores [mm] (radial ball bearings): the designed diameter is rounded up to these
const SHAFT_BEARING_BORES = [10, 12, 15, 17, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
  105, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420, 440, 460, 480, 500];

function shaftRoundToBearing(d) {
  return SHAFT_BEARING_BORES.find(b => b >= d - 1e-9) || Math.ceil(d / 10) * 10;
}

// Keyway effective factors: from the table, or given by the problem (key = 'given', keyKe, keyKeT)
function shaftKeywayFactors(notch) {
  if (notch.key === 'given') {
    const ke = Math.max(1, notch.keyKe || 1);
    return { ke, keT: Math.max(1, notch.keyKeT || ke) };
  }
  const row = (SHAFT_KEYWAY[notch.key] || SHAFT_KEYWAY.sled)[notch.condition === 'hardened' ? 'hardened' : 'annealed'];
  return { ke: row[1], keT: row[0] };
}

/**
 * Notch factors at a given geometry.
 * notch = { type: 'shoulder', Dd, r } | { type: 'keyway', key, condition, keyKe?, keyKeT? }
 *       | { type: 'combined', Dd, r, key, condition, keyKe?, keyKeT? } (shoulder + keyway: factors multiplied)
 *       | { type: 'manual', ke, keT } | { type: 'none' }
 */
function shaftNotchFactors(notch, d, sigmaR) {
  if (notch.type === 'shoulder') {
    const rd = notch.r / d;
    const KtB = shaftKt('bending', rd, notch.Dd);
    const KtT = shaftKt('torsion', rd, notch.Dd);
    const KtA = shaftKt('axial', rd, notch.Dd);
    const qB = shaftQ('bending', notch.r, sigmaR);
    const qT = shaftQ('torsion', notch.r, sigmaR);
    return {
      rd, KtB, KtT, KtA, qB, qT,
      ke: qB * (KtB - 1) + 1,          // bending
      keT: qT * (KtT - 1) + 1,         // torsion
      keA: qB * (KtA - 1) + 1,         // axial (bending chart for q)
      rdOutOfRange: rd < SHAFT_RD_RANGE[0] || rd > SHAFT_RD_RANGE[1]
    };
  }
  if (notch.type === 'keyway') {
    const k = shaftKeywayFactors(notch);
    return { ke: k.ke, keT: k.keT, keA: k.ke, keyKe: k.ke, keyKeT: k.keT };
  }
  if (notch.type === 'combined') {
    // shoulder fillet and keyway in the same section: the effective factors multiply
    const s = shaftNotchFactors({ type: 'shoulder', Dd: notch.Dd, r: notch.r }, d, sigmaR);
    const k = shaftKeywayFactors(notch);
    return { ...s, shoulderKe: s.ke, shoulderKeT: s.keT, keyKe: k.ke, keyKeT: k.keT,
      ke: s.ke * k.ke, keT: s.keT * k.keT, keA: s.keA * k.ke };
  }
  if (notch.type === 'manual') {
    const ke = Math.max(1, notch.ke || 1);
    return { ke, keT: Math.max(1, notch.keT || ke), keA: ke };
  }
  return { ke: 1, keT: 1, keA: 1 };
}

/**
 * Nominal stresses at diameter d [mm] for the given loads.
 * loads = { Mf [N·m], bendingCycle: 'rotating'|'static', Mt [N·m], torsionCycle: 'static'|'pulsating'|'alternating', N [N] (static axial) }
 */
function shaftNominalStresses(loads, d) {
  const Wf = Math.PI * d ** 3 / 32;          // mm³
  const Wt = 2 * Wf;
  const A = Math.PI * d ** 2 / 4;
  const sf = Math.abs(loads.Mf || 0) * 1000 / Wf;   // MPa
  const tt = Math.abs(loads.Mt || 0) * 1000 / Wt;
  const sn = (loads.N || 0) / A;
  const s = { Wf, Wt, A, sigmaBa: 0, sigmaBm: 0, tauA: 0, tauM: 0, sigmaN: sn };
  if (loads.bendingCycle === 'static') s.sigmaBm = sf; else s.sigmaBa = sf;
  if (loads.torsionCycle === 'alternating') s.tauA = tt;
  else if (loads.torsionCycle === 'pulsating') { s.tauA = tt / 2; s.tauM = tt / 2; }
  else s.tauM = tt;
  return s;
}

/**
 * Full check of the section at diameter d.
 * inp = { loads, sigmaR, sigmaS, sigmaLF, cycles, finish, notch, b1Override?, b2Override? }
 */
function shaftCheck(inp, d) {
  const s = shaftNominalStresses(inp.loads, d);
  const nf = shaftNotchFactors(inp.notch, d, inp.sigmaR);
  const b1 = inp.b1Override || shaftB1(d);
  const b2 = inp.b2Override || shaftB2(inp.finish, inp.sigmaR);
  const fat = shaftFatigueStrength(inp.sigmaR, inp.sigmaLF, inp.cycles);

  const sxa = nf.ke * s.sigmaBa;                       // alternating normal stress (only bending alternates)
  const txa = nf.keT * s.tauA;
  const sxm = s.sigmaBm + s.sigmaN;                    // mean normal stress: static bending + axial
  const sigmaAeq = Math.sqrt(sxa * sxa + 3 * txa * txa);
  const sigmaMeq = sxm / 2 + Math.sqrt((sxm / 2) ** 2 + s.tauM ** 2);

  const fatigueUse = sigmaAeq / (b1 * b2 * fat.sigmaN) + sigmaMeq / inp.sigmaR;
  const Xfatigue = fatigueUse > 0 ? 1 / fatigueUse : Infinity;
  const Xyield = (sigmaAeq + sigmaMeq) > 0 ? inp.sigmaS / (sigmaAeq + sigmaMeq) : Infinity;

  return { d, ...s, ...nf, b1, b2, sigmaNf: fat.sigmaN, m: fat.m, finiteLife: fat.finite,
    sigmaAeq, sigmaMeq, Xfatigue, Xyield, X: Math.min(Xfatigue, Xyield) };
}

/**
 * Design: smallest d with X ≥ Xreq (fatigue and yield), all coefficients evaluated at that d
 * (the "first attempt" iteration of the algorithm, done automatically).
 * Then d is rounded up to a bearing bore, D = d·(D/d) rounded up to the mm, and the section is re-checked.
 */
function shaftDesign(inp, Xreq) {
  const f = d => shaftCheck(inp, d).X - Xreq;
  let lo = 1, hi = 2000;
  if (f(hi) < 0) return { ok: false, reason: 'tooLarge' };
  if (f(lo) >= 0) hi = lo;
  for (let i = 0; i < 80 && hi - lo > 1e-4; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) >= 0) hi = mid; else lo = mid;
  }
  const dMin = hi;
  const atMin = shaftCheck(inp, dMin);

  // rounded geometry: bearing bore, and for a shoulder D = d·(D/d) rounded up to the mm
  let dR = shaftRoundToBearing(dMin);
  let final = null, D = null;
  for (let guard = 0; guard < 60; guard++) {
    let notch = inp.notch;
    if (notch.type === 'shoulder' || notch.type === 'combined') {
      D = Math.ceil(dR * notch.Dd - 1e-9);
      notch = { ...notch, Dd: D / dR };
    }
    final = shaftCheck({ ...inp, notch }, dR);
    if (final.X >= Xreq - 1e-9) break;
    // rare: the rounded geometry changes Kt/b1 so much that X drops below Xreq -> next bore
    const next = SHAFT_BEARING_BORES.find(b => b > dR);
    if (!next) break;
    dR = next;
  }
  return { ok: true, dMin, atMin, d: dR, D, final, governing: atMin.Xfatigue <= atMin.Xyield ? 'fatigue' : 'yield' };
}

/**
 * Maximum load at a given diameter (reverse problem of many exams: "find the max torque / power / load").
 * With all loads scaled by the same factor λ (they all come from the same torque or force), σa,eq and σm,eq
 * are proportional to λ, so both safety factors scale as 1/λ:  λmax = X(current loads) / Xreq.
 * Returns { lambda, lambdaFatigue, lambdaYield, governing, Mf, Mt, N, check } (Mf, Mt, N at the limit).
 */
function shaftMaxLoad(inp, d, Xreq) {
  const check = shaftCheck(inp, d);
  const lf = check.Xfatigue / Xreq, ly = check.Xyield / Xreq;
  const lambda = Math.min(lf, ly);
  const L = inp.loads;
  return { lambda, lambdaFatigue: lf, lambdaYield: ly, governing: lf <= ly ? 'fatigue' : 'yield',
    Mf: (L.Mf || 0) * lambda, Mt: (L.Mt || 0) * lambda, N: (L.N || 0) * lambda, check };
}

/**
 * Life at a required safety factor (reverse finite-life problem): the σN that gives X = Xreq on the Goodman line,
 * σN = σa,eq / (b1 b2 (1/X − σm,eq/σR)), then N from the Wöhler line σ^m N = σR^m·10³ (N = ∞ if σN ≤ σLF).
 * Coefficients (Ke, b1, b2) do not depend on N, so the check at any life gives the same stresses.
 * Returns { N, sigmaNreq, infinite, feasible, reason?, check }.
 */
function shaftLifeAtX(inp, d, Xreq) {
  const check = shaftCheck({ ...inp, cycles: 0 }, d);
  const out = { N: 0, sigmaNreq: NaN, infinite: false, feasible: false, check };
  if (check.Xyield < Xreq) return { ...out, reason: 'yield' };
  const room = 1 / Xreq - check.sigmaMeq / inp.sigmaR;
  if (!(room > 0)) return { ...out, reason: 'mean' };
  if (!(check.sigmaAeq > 0)) return { ...out, N: Infinity, infinite: true, feasible: true, sigmaNreq: 0 };
  const sN = check.sigmaAeq / (check.b1 * check.b2 * room);
  const m = 3 / Math.log10(inp.sigmaR / inp.sigmaLF);
  if (sN <= inp.sigmaLF) return { ...out, N: Infinity, infinite: true, feasible: true, sigmaNreq: sN, m };
  if (sN >= inp.sigmaR) return { ...out, sigmaNreq: sN, m, reason: 'static' };
  return { ...out, N: 1e3 * Math.pow(inp.sigmaR / sN, m), feasible: true, sigmaNreq: sN, m };
}

/**
 * Cumulative damage (Miner): previous phases with their own loads for n cycles each, every N_i computed at the
 * required safety factor (as in the course solutions). The remaining life at the current loads is (1 − D)·N_current.
 * phases = [{ Mf, Mt, cycles }] (N·m; a missing Mf/Mt keeps the current value) or [{ factor, cycles }] (all loads × factor).
 * Returns { phases: [{ cycles, N, D }], D, Ncurrent, remaining, failed }.
 */
function shaftMinerDamage(inp, d, Xreq, phases) {
  const L = inp.loads;
  const phaseInp = p => ({ ...inp, loads: p.factor !== undefined
    ? { ...L, Mf: (L.Mf || 0) * p.factor, Mt: (L.Mt || 0) * p.factor, N: (L.N || 0) * p.factor }
    : { ...L, Mf: p.Mf !== undefined ? p.Mf : L.Mf, Mt: p.Mt !== undefined ? p.Mt : L.Mt } });
  const rows = (phases || []).filter(p => p && p.cycles > 0).map(p => {
    const life = shaftLifeAtX(phaseInp(p), d, Xreq);
    const N = life.feasible ? life.N : 0;
    return { ...p, N, D: N > 0 ? (Number.isFinite(N) ? p.cycles / N : 0) : Infinity };
  });
  const D = rows.reduce((s, r) => s + r.D, 0);
  const cur = shaftLifeAtX(inp, d, Xreq);
  const Ncurrent = cur.feasible ? cur.N : 0;
  return { phases: rows, D, Ncurrent, failed: D >= 1, remaining: D >= 1 ? 0 : (1 - D) * Ncurrent };
}

/**
 * Manson's double linear damage rule (as in the course): each life N splits into a propagation part
 * N_II = 14·N^0.6 and a nucleation part N_I = N − N_II. Damage accumulates linearly on N_I first; when the
 * nucleation is complete, on N_II. Pure arithmetic on the lives of the phases.
 * phases = [{ n, N }] already worked; Ncur = life at the current loads. Returns { DI, DII, remaining, failed }.
 */
function shaftMansonFromLives(phases, Ncur) {
  const split = N => { if (!Number.isFinite(N)) return { NI: Infinity, NII: Infinity }; const NII = Math.min(N, 14 * Math.pow(N, 0.6)); return { NI: N - NII, NII }; };
  let DI = 0, DII = 0;
  for (const p of phases || []) {
    if (!(p.n > 0)) continue;
    const { NI, NII } = split(p.N);
    if (!(p.N > 0)) { DII = Infinity; break; }
    let n = p.n;
    if (DI < 1) {
      const toNucleate = (1 - DI) * NI;
      if (n <= toNucleate || !Number.isFinite(NI)) { DI += n / NI; n = 0; }
      else { DI = 1; n -= toNucleate; }
    }
    if (n > 0) DII += n / NII;
  }
  const cur = split(Ncur);
  const failed = DII >= 1;
  const remaining = failed ? 0 : DI < 1 ? (1 - DI) * cur.NI + cur.NII : (1 - DII) * cur.NII;
  return { DI, DII, remaining, failed };
}

// Manson's rule on the shaft: lives of the previous phases and of the current loads at the required X
function shaftMansonDamage(inp, d, Xreq, phases) {
  const mi = shaftMinerDamage(inp, d, Xreq, phases);
  const res = shaftMansonFromLives(mi.phases.map(p => ({ n: p.cycles, N: p.N })), mi.Ncurrent);
  return { ...res, Ncurrent: mi.Ncurrent, phases: mi.phases };
}

/**
 * Static check with von Mises on the peak nominal stresses (non-rotating shaft, or a quick check of the peak):
 * σ = σbending,max + σaxial, τ = τmax, σid = sqrt(σ² + 3τ²), X = σs / σid. No notch factor (ductile material, static load).
 */
function shaftStaticVonMises(inp, d) {
  const s = shaftNominalStresses(inp.loads, d);
  const sigma = s.sigmaBa + s.sigmaBm + Math.abs(s.sigmaN), tau = s.tauA + s.tauM;
  const sigmaId = Math.sqrt(sigma * sigma + 3 * tau * tau);
  return { sigma, tau, sigmaId, X: sigmaId > 0 ? inp.sigmaS / sigmaId : Infinity };
}

// Section design with fixed coefficients (as in a hand solution): closed form for Wf,
// valid for rotating bending + torque and no axial load.
function shaftDesignFixedCoefficients({ Mf, Mt, torsionCycle = 'static', ke, keT = 1, b1, b2, sigmaN, sigmaR, X }) {
  // σa,eq = sqrt((ke Mf/Wf)² + 3(keT τa)²), σm,eq = τm, with τ = Mt / (2 Wf)
  const tA = torsionCycle === 'alternating' ? 1 : torsionCycle === 'pulsating' ? 0.5 : 0;
  const tM = torsionCycle === 'alternating' ? 0 : torsionCycle === 'pulsating' ? 0.5 : 1;
  const aTerm = Math.sqrt((ke * Mf) ** 2 + 3 * (keT * tA * Mt / 2) ** 2);   // N·m (× 1/Wf)
  const mTerm = tM * Mt / 2;
  const Wf = X * (aTerm / (b1 * b2 * sigmaN) + mTerm / sigmaR) * 1000;     // mm³ (N·mm / MPa)
  return { Wf, d: Math.cbrt(32 * Wf / Math.PI) };
}

// ============================================================================
// SHAFT AS A 1D BEAM on two bearings (preliminary step of the course algorithm)
// Two bending planes: V (vertical, y) and H (horizontal, z). x along the shaft [mm].
// Sign convention: forces positive along +y / +z; bending moment at x from the loads on the left,
// M(x) = Σ F_j (x − x_j) + Σ C_j (C_j = concentrated couple, e.g. axial force at the pitch radius).
// Units: mm, N, N·m.
// ============================================================================

const SHAFT_DIRS = ['+V', '-V', '+H', '-H'];

function shaftDirVec(dir) {
  // returns [plane, sign]
  const s = (dir || '+V')[0] === '-' ? -1 : 1;
  const plane = (dir || '+V').slice(1) === 'H' ? 'H' : 'V';
  return [plane, s];
}

/**
 * Forces of one element on the shaft.
 * el = { type: 'gear'|'coupling'|'force'|'none', x, d, helix, FtDir, FrDir, FaDir, torque: 'in'|'out'|'none', share,
 *        Fv, Fh, Fa, e }   (force: direct components; e = radial offset of Fa in the H plane [mm])
 * Mt = torque transmitted by the shaft [N·m], theta = normal pressure angle [deg].
 * share = fraction of Mt carried by this element (default 1): e.g. 0.5 when two users split the power.
 * torque 'none' = idler gear: the mesh forces come from share·Mt but no torque enters or leaves the shaft.
 */
/**
 * Unit directions (components [V, H]) of the gear forces on the shaft.
 * Manual: FtDir / FrDir ('±V', '±H'). Mesh mode (el.dirMode === 'mesh'): the mating gear centre is at angle
 * el.meshAngle [deg] from +V towards +H (counter-clockwise in the end view from B); Fr points from the mesh to the
 * axis (−u); Ft follows the rotation of the mesh point for a driven gear (torque 'in' or 'none') and opposes it for
 * a driving gear ('out'). rotation = 'ccw' | 'cw' as seen from B (ccw: ω along +x, x × V = H).
 * Returns { rU, tU, meshU } (meshU = direction from the axis to the mesh point).
 */
function shaftGearDirections(el, rotation = 'ccw') {
  const vec = dir => { const [pl, sg] = shaftDirVec(dir); return pl === 'V' ? [sg, 0] : [0, sg]; };
  if (el.dirMode === 'mesh') {
    const phi = (el.meshAngle || 0) * Math.PI / 180;
    const u = [Math.cos(phi), Math.sin(phi)];
    const w = rotation === 'cw' ? -1 : 1;
    const v = [-w * u[1], w * u[0]];                       // velocity direction of the mesh point
    const role = el.torque === 'out' ? -1 : 1;
    return { rU: [-u[0], -u[1]], tU: [role * v[0], role * v[1]], meshU: u };
  }
  const rU = vec(el.FrDir);
  return { rU, tU: vec(el.FtDir), meshU: [-rU[0], -rU[1]] };
}

function shaftElementLoads(el, Mt, theta = 20, rotation = 'ccw') {
  const out = { x: el.x || 0, Fv: 0, Fh: 0, Fa: 0, Cv: 0, Ch: 0, T: 0, Ft: 0, Fr: 0, FaMag: 0 };
  const share = Number.isFinite(el.share) && el.share >= 0 ? el.share : 1;
  const MtEl = Math.abs(Mt) * share;
  const tSign = el.torque === 'out' ? -1 : el.torque === 'none' ? 0 : 1;
  out.MtEl = MtEl;
  if (el.type === 'gear') {
    const r = (el.d || 0) / 2;                                   // mm
    const alpha = (el.helix || 0) * Math.PI / 180;
    const Ft = r > 0 ? MtEl * 1000 / r : 0;                     // N
    const Fr = Ft * Math.tan(theta * Math.PI / 180) / Math.cos(alpha);
    const Fa = Ft * Math.tan(alpha);
    out.Ft = Ft; out.Fr = Fr; out.FaMag = Fa;
    const dirs = shaftGearDirections(el, rotation);
    out.dirs = dirs;
    out.Fv = Ft * dirs.tU[0] + Fr * dirs.rU[0];
    out.Fh = Ft * dirs.tU[1] + Fr * dirs.rU[1];
    if (Fa > 0) {
      const sa = el.FaDir === '-x' ? -1 : 1;
      out.Fa = sa * Fa;
      // Fa acts at the mesh point, offset r·meshU from the axis -> concentrated couples Fa·offset in each plane
      out.Cv = out.Fa * r * dirs.meshU[0] / 1000;               // N·m
      out.Ch = out.Fa * r * dirs.meshU[1] / 1000;
    }
    out.T = tSign * MtEl;
  } else if (el.type === 'coupling') {
    out.T = tSign * MtEl;
  } else if (el.type === 'force') {
    out.Fv = el.Fv || 0; out.Fh = el.Fh || 0; out.Fa = el.Fa || 0;
    out.Ch = out.Fa * (el.e || 0) / 1000;
  }
  return out;
}

/**
 * Beam solution.
 * inp = { xA, xB, elements: [...], Mt, theta, axialBearing: 'A'|'B' }
 */
function shaftBeam({ xA, xB, elements, Mt, theta = 20, axialBearing = 'A', L = null, rotation = 'ccw' }) {
  const loads = (elements || []).filter(e => e && e.type && e.type !== 'none').map(e => ({ ...shaftElementLoads(e, Mt, theta, rotation), el: e }));
  const span = xB - xA;
  if (!(span > 0)) return { ok: false, reason: 'supports' };
  const shaftLen = L > 0 ? L : null;     // shaft ends at x = 0 and x = L (optional)

  // equilibrium in each plane: RA + RB + ΣF = 0 and RA·xA + RB·xB + ΣF·x − ΣC = 0 (moments in N·mm, C in N·m)
  const solve = (fKey, cKey) => {
    const F = loads.reduce((s, l) => s + l[fKey], 0);
    const Mx = loads.reduce((s, l) => s + l[fKey] * l.x, 0) - loads.reduce((s, l) => s + l[cKey], 0) * 1000;
    const RB = (-Mx + F * xA) / span;
    const RA = -F - RB;
    return { RA, RB };
  };
  const V = solve('Fv', 'Cv'), H = solve('Fh', 'Ch');
  const FaSum = loads.reduce((s, l) => s + l.Fa, 0);
  const RaA = axialBearing === 'A' ? -FaSum : 0, RaB = axialBearing === 'B' ? -FaSum : 0;

  const pts = [
    { x: xA, Fv: V.RA, Fh: H.RA, Cv: 0, Ch: 0, T: 0, Fa: RaA, support: 'A' },
    { x: xB, Fv: V.RB, Fh: H.RB, Cv: 0, Ch: 0, T: 0, Fa: RaB, support: 'B' },
    ...loads
  ];
  const xs0 = pts.map(p => p.x).concat(shaftLen ? [0, shaftLen] : []);
  const xmin = Math.min(...xs0), xmax = Math.max(...xs0);

  // internal actions at x (loads on the left; 'side' = -1 just left of a point, +1 just right).
  // Mv, Mh, Mf, T in N·m; N in N (tension > 0)
  const at = (x, side = 1) => {
    let Mv = 0, Mh = 0, T = 0, N = 0, Vv = 0, Vh = 0;
    for (const p of pts) {
      const left = side > 0 ? p.x <= x + 1e-9 : p.x < x - 1e-9;
      if (!left) continue;
      Mv += p.Fv * (x - p.x) / 1000 + p.Cv;       // N·m
      Mh += p.Fh * (x - p.x) / 1000 + p.Ch;
      Vv += p.Fv; Vh += p.Fh;
      T += p.T;
      N -= p.Fa;                                   // internal normal force, positive = tension
    }
    return { x, Mv, Mh, Mf: Math.hypot(Mv, Mh), T, N, Vv, Vh };
  };

  // sample: every load point (both sides) plus a fine grid
  const xs = new Set();
  for (const p of pts) xs.add(p.x);
  const n = 200;
  for (let i = 0; i <= n; i++) xs.add(xmin + (xmax - xmin) * i / n);
  const samples = [];
  for (const x of [...xs].sort((a, b) => a - b)) { samples.push(at(x, -1)); samples.push(at(x, 1)); }

  // critical section: largest resultant bending moment (ties -> larger torque)
  let crit = samples[0];
  for (const s of samples) if (s.Mf > crit.Mf + 1e-6 || (Math.abs(s.Mf - crit.Mf) <= 1e-6 && Math.abs(s.T) > Math.abs(crit.T))) crit = s;

  return {
    ok: true, loads, xmin, xmax, L: shaftLen,
    labels: shaftPointLabels(xA, xB, loads.map(l => l.x), shaftLen),
    RA: { V: V.RA, H: H.RA, R: Math.hypot(V.RA, H.RA), axial: RaA },
    RB: { V: V.RB, H: H.RB, R: Math.hypot(V.RB, H.RB), axial: RaB },
    at, samples, critical: crit
  };
}

/**
 * Check of several real sections along the shaft (diameter, shoulder, fillet, keyway), with the loads of the beam.
 * The most stressed section is the one with the lowest safety factor, not the one with the largest Mf
 * (a small groove can be worse than a bearing seat with a higher moment).
 * beam = result of shaftBeam; sections = [{ x, d, D, r, keyway }]; mat = { sigmaR, sigmaS, sigmaLF, cycles, finish,
 * bendingCycle, torsionCycle, key: { key, condition, keyKe, keyKeT } }.
 * Returns { rows: [{ x, d, D, r, keyway, Mf, Mt, N, check, X }], worst } (worst = row with the lowest X).
 */
function shaftSectionsCheck(beam, sections, mat) {
  const rows = (sections || []).filter(s => s && s.d > 0 && Number.isFinite(s.x)).map(sec => {
    const l = beam.at(sec.x, -1), r = beam.at(sec.x, 1);
    const side = r.Mf >= l.Mf ? r : l;
    const T = Math.abs(l.T) > Math.abs(r.T) ? l.T : r.T;
    const shoulder = sec.D > sec.d && sec.r > 0;
    const key = mat.key || { key: 'sled', condition: 'annealed' };
    const notch = shoulder
      ? (sec.keyway ? { type: 'combined', Dd: sec.D / sec.d, r: sec.r, ...key } : { type: 'shoulder', Dd: sec.D / sec.d, r: sec.r })
      : (sec.keyway ? { type: 'keyway', ...key } : { type: 'none' });
    const check = shaftCheck({ loads: { Mf: side.Mf, bendingCycle: mat.bendingCycle || 'rotating', Mt: Math.abs(T),
      torsionCycle: mat.torsionCycle || 'static', N: side.N }, sigmaR: mat.sigmaR, sigmaS: mat.sigmaS, sigmaLF: mat.sigmaLF,
      cycles: mat.cycles || 0, finish: mat.finish, notch }, sec.d);
    return { ...sec, Mf: side.Mf, Mt: Math.abs(T), N: side.N, notch, check, X: Math.min(check.Xfatigue, check.Xyield) };
  });
  const worst = rows.reduce((w, r) => (!w || r.X < w.X ? r : w), null);
  return { rows, worst };
}

/**
 * Point names as in the course solutions: A and B are the shaft ends (x = 0 and x = L),
 * then C, D, E, ... are the bearings and the elements from left to right.
 * A bearing or element exactly at an end takes the name of that end; points at the same x share a name.
 * Returns { bearing1, bearing2, elements: [names in input order], points: [{ x, name }] sorted by x }.
 */
function shaftPointLabels(xA, xB, elementXs, L = null) {
  const tol = 1e-6;
  const named = [];                                      // { x, name }
  if (L > 0) { named.push({ x: 0, name: 'A' }); named.push({ x: L, name: 'B' }); }
  const inner = [xA, xB, ...elementXs].filter(Number.isFinite);
  const uniq = [...new Set(inner.map(x => Math.round(x / tol) * tol))].sort((a, b) => a - b);
  let next = L > 0 ? 2 : 0;                              // 'C' when the ends are named, otherwise 'A'
  for (const x of uniq) {
    if (named.some(p => Math.abs(p.x - x) <= tol)) continue;
    named.push({ x, name: String.fromCharCode(65 + next++) });
  }
  const nameAt = x => (named.find(p => Math.abs(p.x - x) <= tol) || {}).name || '?';
  return {
    bearing1: nameAt(xA), bearing2: nameAt(xB),
    elements: elementXs.map(nameAt),
    points: named.slice().sort((a, b) => a.x - b.x)
  };
}

// Bearing life with a catalog rating: L = (C/P)^p million revolutions; hours at n rpm = L·10⁶ / (60 n)
function shaftBearingLife(C, P, type = 'ball', n = 0) {
  const p = type === 'roller' ? 10 / 3 : 3;
  const L = P > 0 ? Math.pow(C / P, p) : Infinity;
  return { L, hours: n > 0 ? L * 1e6 / (60 * n) : null };
}

// Required dynamic load rating C = P · L^(1/p), L in millions of revolutions (p = 3 ball, 10/3 roller).
// P is taken as the radial reaction (axial load not combined: preliminary choice).
function shaftBearingC(P, Lmillions, type = 'ball') {
  const p = type === 'roller' ? 10 / 3 : 3;
  return P * Math.pow(Math.max(Lmillions, 0), 1 / p);
}
