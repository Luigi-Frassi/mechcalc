// ============================================================================
// BOLTED JOINTS — method of Luigi's notes (Elementi Costruttivi delle Macchine)
//  • friction joint: T = F / (m_bolts · m_interfaces), preload N = T · X / f
//  • number of bolts from N / A_res = σs / X with A_res = π (0.8 d)² / 4; on a bolt circle F = Mt / (D/2),
//    at most π·D / Dc bolts (Dc = across-flats of the head)
//  • tightening torque Ms = N·dm/2·(cosβ sinα + f cosα)/(cosβ cosα − f sinα) + N/2·Dm·f
//    with dm = 0.9 d, tanα = p / (π dm), β = 30° (ISO), Dm = (Dc + d)/2
//  • external axial load: Kv = E·(π d²/4)/h, Kf = E·Aeq/h, Aeq = π/4·[((Dmax + Dc)/2)² − d²], Dmax = Dc + h·tg30°,
//    ΔFv = Pe·Kv/(Kv + Kf), ΔFf = Pe·Kf/(Kv + Kf); optimal preload Pam·Kf/(Kv + Kf) with Pam = σs·A_res/X
//  • power screw (vise): rectangular / trapezoidal / ISO thread, dm = d − h/2, d_core = d − h
// Units: mm, N, MPa, N·mm. Pure functions, no DOM.
// ============================================================================

// ISO coarse thread [d, pitch, across-flats S = Dc, head height K] (tables of the notes, UNI hexagon heads)
const BOLT_SIZES = [[4, 0.7, 7, 2.8], [5, 0.8, 8, 3.5], [6, 1, 10, 4], [8, 1.25, 13, 5.3], [10, 1.5, 16, 6.4], [12, 1.75, 18, 7.5], [14, 2, 21, 8.8],
  [16, 2, 24, 10], [18, 2.5, 27, 11.5], [20, 2.5, 30, 12.5], [22, 2.5, 34, 14], [24, 3, 36, 15], [27, 3, 41, 17], [30, 3.5, 46, 18.7], [33, 3.5, 50, 21],
  [36, 4, 55, 22.5], [39, 4, 60, 25], [42, 4.5, 65, 26], [45, 4.5, 70, 28], [48, 5, 75, 30], [56, 5.5, 85, 35], [64, 6, 95, 40]]
  .map(([d, p, S, K]) => ({ name: 'M' + d, d, p, Dc: S, K }));

// strength classes: [σR, σs] MPa (x.y → σR = 100·x, σs = σR·y/10)
const BOLT_CLASSES = { '4.6': [400, 240], '5.6': [500, 300], '6.8': [600, 480], '8.8': [800, 640], '10.8': [1000, 800], '10.9': [1000, 900], '12.9': [1200, 1080] };

function boltSize(name) { return BOLT_SIZES.find(s => s.name === name) || null; }

function boltGeom(size) {
  const d = size.d, p = size.p, dm = 0.9 * d, dc = 0.8 * d;
  return { d, p, Dc: size.Dc, dm, dCore: dc, A: Math.PI * d * d / 4, Ares: Math.PI * dc * dc / 4, alpha: Math.atan(p / (Math.PI * dm)), Dm: (size.Dc + d) / 2 };
}

// thread torque factor: M1 = N · dm/2 · k1
function boltThreadFactor(alpha, f, betaDeg) {
  const cb = Math.cos(betaDeg * Math.PI / 180);
  return (cb * Math.sin(alpha) + f * Math.cos(alpha)) / (cb * Math.cos(alpha) - f * Math.sin(alpha));
}

// Tightening torque for a preload N. g = boltGeom; fHead = 0 drops the under-head friction (power screws)
function boltTorque(N, g, f, { beta = 30, fHead = f } = {}) {
  const k1 = boltThreadFactor(g.alpha, f, beta);
  const M1 = N * g.dm / 2 * k1, M2 = N / 2 * g.Dm * fHead;
  return { M1, M2, Ms: M1 + M2, k1 };
}

// Bolt stress after tightening: axial on A_res, torsion of the thread torque on the core (von Mises, notes "VM bulloni")
function boltStress(N, M1, g) {
  const sigma = N / g.Ares, tau = 16 * M1 / (Math.PI * g.dCore ** 3);
  return { sigma, tau, sigmaId: Math.sqrt(sigma * sigma + 3 * tau * tau) };
}

// ---- friction joint design ----------------------------------------------------------------------------
// load: { F } tangential force [N], or { Mt, Dcircle } torque [N·mm] on a bolt circle [mm]
function boltFrictionDesign({ F = 0, Mt = 0, Dcircle = 0, mInt = 1, f = 0.2, X = 1.5, size, cls = '8.8', fThread = 0.15, beta = 30, mChosen = 0 }) {
  const g = boltGeom(size), [sR, sS] = BOLT_CLASSES[cls] || BOLT_CLASSES['8.8'];
  const Ft = Mt > 0 && Dcircle > 0 ? Mt / (Dcircle / 2) : F;
  const Ntot = Ft * X / (f * Math.max(1, mInt));             // total preload needed: Σ N · f · m_int = T_tot · X
  const Nadm = sS * g.Ares / X;                               // allowable preload per bolt: N / A_res = σs / X
  const mReq = Ntot / Nadm;
  // like the hand solutions, 8.03 → 8 is accepted when the safety factor drops by at most 0.5 %
  const mDown = Math.max(1, Math.floor(mReq)), roundedDown = mChosen <= 0 && mReq > mDown && mReq / mDown <= 1.005;
  const m = mChosen > 0 ? Math.round(mChosen) : roundedDown ? mDown : Math.max(1, Math.ceil(mReq - 1e-9));
  const nMax = Dcircle > 0 ? Math.floor(Math.PI * Dcircle / g.Dc) : Infinity;
  const N = Ntot / m;                                         // preload per bolt
  const tq = boltTorque(N, g, fThread, { beta });
  const st = boltStress(N, tq.M1, g);
  return { g, sR, sS, Ft, Ntot, Nadm, mReq, m, roundedDown, nMax, fitsCircle: m <= nMax, N, ...tq, ...st, Xbolt: sS / st.sigma, Xvm: sS / st.sigmaId, Tbolt: Ft / (m * Math.max(1, mInt)) };
}

// Options over the sizes: bolts needed and torque for each size of the class
function boltOptions(params) {
  return BOLT_SIZES.filter(s => s.d >= 6 && s.d <= 48).map(size => ({ size, r: boltFrictionDesign({ ...params, size, mChosen: 0 }) }));
}

// ---- check from a given tightening torque -------------------------------------------------------------
function boltFromTorque({ Ms, m = 1, mInt = 1, f = 0.2, X = 1.5, size, cls = '8.8', fThread = 0.15, beta = 30, Dcircle = 0 }) {
  const g = boltGeom(size), [sR, sS] = BOLT_CLASSES[cls] || BOLT_CLASSES['8.8'];
  const k1 = boltThreadFactor(g.alpha, fThread, beta);
  const N = Ms / (g.dm / 2 * k1 + g.Dm / 2 * fThread);
  const tq = boltTorque(N, g, fThread, { beta });
  const st = boltStress(N, tq.M1, g);
  const Ntot = m * N, Tbolt = N * f / X, Fmax = Ntot * f * Math.max(1, mInt) / X;
  return { g, sR, sS, N, Ntot, Tbolt, Fmax, Mtmax: Dcircle > 0 ? Fmax * Dcircle / 2 : null, ...tq, ...st, Xbolt: sS / st.sigma, Xvm: sS / st.sigmaId };
}

// ---- external axial load: tightening diagram ------------------------------------------------------------
// Pe = external load per bolt (> 0 tension that separates the flanges, < 0 compression), h = clamped length
function boltExternal({ N, Pe, h, size, E = 200000, cls = '8.8', X = 1.5, f = 0.2, mInt = 1, m = 1, Dcircle = 0 }) {
  const g = boltGeom(size), [, sS] = BOLT_CLASSES[cls] || BOLT_CLASSES['8.8'];
  const Kv = E * g.A / h;
  const Dmax = g.Dc + h * Math.tan(Math.PI / 6);
  const Aeq = Math.PI / 4 * (((Dmax + g.Dc) / 2) ** 2 - g.d ** 2);
  const Kf = E * Aeq / h;
  const dFv = Pe * Kv / (Kv + Kf), dFf = Pe * Kf / (Kv + Kf);
  const bolt = N + dFv, clamp = N - dFf;                      // bolt load and residual clamping force (per bolt)
  const separated = clamp <= 0;
  const Psep = N * (Kv + Kf) / Kf;                            // external load per bolt that opens the joint
  const Pam = sS * g.Ares / X;                                // allowable bolt load
  const Popt = Pam * Kf / (Kv + Kf);                          // optimal preload: the joint opens exactly when the bolt reaches Pam
  const Fmax = separated ? 0 : m * clamp * f * Math.max(1, mInt) / X;
  return { g, Kv, Kf, Aeq, Dmax, dFv, dFf, bolt, clamp, separated, Psep, Pam, Popt, PeMax: Pam, Xbolt: sS / (bolt / g.Ares),
    Fmax, Mtmax: Dcircle > 0 ? Fmax * Dcircle / 2 : null, deltaV: N / Kv, deltaF: N / Kf };
}

// ---- power screw (vise, jack) ---------------------------------------------------------------------------
// thread: beta 0 rectangular, 15 trapezoidal, 30 ISO; hT = thread depth; N = axial force
function powerScrew({ d, p, hT, f, beta = 0, N, sigmaS = 0 }) {
  const dm = d - hT / 2, dCore = d - hT, alpha = Math.atan(p / (Math.PI * dm));
  const k1 = boltThreadFactor(alpha, f, beta);
  const Ms = N * dm / 2 * k1;
  const phi = Math.atan(f / Math.cos(beta * Math.PI / 180));   // apparent friction angle
  const eta = Math.tan(alpha) / k1;                              // efficiency (raising the load)
  const A = Math.PI * dCore * dCore / 4, sigma = N / A, tau = 16 * Ms / (Math.PI * dCore ** 3), sigmaId = Math.sqrt(sigma * sigma + 3 * tau * tau);
  return { dm, dCore, alpha, phi, k1, Ms, eta, selfLocking: alpha < phi, A, sigma, tau, sigmaId, X: sigmaS > 0 ? sigmaS / sigmaId : null };
}
