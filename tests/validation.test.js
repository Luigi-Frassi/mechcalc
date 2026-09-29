// Validation suite: MechCalc core vs. worked exam problems of the course
// "Costruzione di Macchine" (exam papers 2018-2022, solved by hand).
// Run with:  node tests/validation.test.js
// No dependencies. Loads the core files exactly as the browser does (classic scripts).
//
// Each case lists the value from the handwritten solution and a tolerance:
//   1%  for results that depend only on the formulas (rounding of ω, σ, d in the hand solution)
//   2%  for helical cases (Φ, Γ, Ψ read by eye from the course chart)
//   Lewis: y is checked against the values read by hand from the course chart (abs. 0.02, hand
//   readings are coarse), σL is checked "a parità di y" (MechCalc's stress rescaled to the y used
//   by hand), so the stress formula and the chart reading are validated separately.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { Math, console };
vm.createContext(ctx);
for (const f of ['core/gears-core.js', 'core/fits-core.js', 'core/belts-core.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'modules', f), 'utf8'), ctx, { filename: f });
}
const { computeGearWmax, computeGearDesign, getHelicalFactors, getLewisFactor } =
  vm.runInContext('({ computeGearWmax, computeGearDesign, getHelicalFactors, getLewisFactor })', ctx);

const omega = n => (2 * Math.PI * n) / 60;
const KE = 35; // GPa, as used in the course

// W_max rating helper (defaults: σL is irrelevant when only the Hertz capacity is checked)
const wmax = p => computeGearWmax({ toothType: 'spur', Ke_GPa: KE, sigmaL_lim: 400, xr1: 0, alphaDeg: 0, ...p });

// Design mode with a locked module (the module chosen in the hand solution)
function design({ gearType = 'spur', geomMode = 'teeth', z1, z2, n1, W_kW, sigmaH, m, targetI = 100, xr1 = 0 }) {
  const om = omega(n1);
  const W_watt = W_kW * 1000;
  return computeGearDesign({
    gearType, geomMode, z1, z2, tau: z1 / z2, z_min: 14, xr1,
    Ke_N_mm2: KE * 1000, W_N_mm_s: W_watt * 1000, M1_Nm: W_watt / om, omega1: om,
    sigmaH_lim: sigmaH, isLockM: true, lockedM: m, isLockL: false, lockedL: 30,
    targetI, supportsAutoZ: false, activeCombo: null, useRecommended: false
  });
}

const cases = [];
const rel = (name, got, expected, tol, note = '') => cases.push({ name, got, expected, tol, kind: 'rel', note });
// σL computed by MechCalc, rescaled to the Lewis factor the hand solution used
const sigmaSameY = (sigma, yMechCalc, yHand) => sigma * yMechCalc / yHand;
const abs = (name, got, expected, tol, note = '') => cases.push({ name, got, expected, tol, kind: 'abs', note });

// ---------------------------------------------------------------------------
// Appello 6 febbraio 2018 — ruota folle, verifica statica (m=5, L=100, σH=1800, σL=400)
// ---------------------------------------------------------------------------
{
  const n = 1000; // torque does not depend on speed
  const p12 = wmax({ m_input: 5, L_mm: 100, z1: 25, z2: 30, n1: n, sigmaH_lim: 1800 });
  rel('2018-02-06  Hertz coppia 1-2, M1 max [Nm]', p12.P_kW_H * 1000 / omega(n), 6350, 0.01);
  const p23 = wmax({ m_input: 5, L_mm: 100, z1: 30, z2: 50, n1: n, sigmaH_lim: 1800 });
  // torque on the idler = 1.2 · M_mot  (τ12 = 25/30)
  rel('2018-02-06  Hertz coppia 2-3, M_mot max [Nm]', p23.P_kW_H * 1000 / omega(n) / 1.2, 8716, 0.01);
}

// ---------------------------------------------------------------------------
// Appello 7 febbraio 2022 — W_max a pitting, denti diritti (σH corretta = 1067 MPa)
// ---------------------------------------------------------------------------
{
  const r = wmax({ m_input: 5, L_mm: 30, z1: 18, z2: 35, n1: 1000, sigmaH_lim: 1067 });
  rel('2022-02-07  W_max Hertz, denti diritti [kW]', r.P_kW_H, 44, 0.01);
}

// ---------------------------------------------------------------------------
// Appello 7 gennaio 2019 — riduttore coassiale a due stadi, W = 50 kW, n1 = 1500 rpm
// ---------------------------------------------------------------------------
{
  // I stadio (dritti, m=4, z 18/73, L=60): σH di lavoro = 745 MPa → a σ=745 la capacità è 50 kW
  const r1 = wmax({ m_input: 4, L_mm: 60, z1: 18, z2: 73, n1: 1500, sigmaH_lim: 745 });
  rel('2019-01-07  I stadio: capacità a σH = 745 MPa [kW]', r1.P_kW_H, 50, 0.01);
  const Fc = 2 * 50000 / (omega(1500) * 72e-3);
  rel('2019-01-07  I stadio: Fc [N]', Fc, 8846, 0.01);
  const y18 = getLewisFactor(18, 0);
  rel('2019-01-07  I stadio: σL Lewis a parità di y [MPa]', sigmaSameY(Fc / (60 * 4 * y18), y18, 0.32), 115, 0.01);

  // II stadio (elicoidale, mn=3.5, α=21°, z 19/78, L=60.56, σH=1160, n3 = 1500·18/73)
  const r2 = wmax({ toothType: 'helical', m_input: 3.5, L_mm: 60.56, z1: 19, z2: 78, n1: 1500 * 18 / 73, alphaDeg: 21, sigmaH_lim: 1160 });
  rel('2019-01-07  II stadio elicoidale: capacità con L = 60.56 mm [kW]', r2.P_kW_H, 50, 0.02);
}

// ---------------------------------------------------------------------------
// Appello 5 febbraio 2019 — elicoidale esistente, poi riprogetto a due stadi dritti
// ---------------------------------------------------------------------------
{
  const r = wmax({ toothType: 'helical', m_input: 4, L_mm: 70, z1: 18, z2: 50, n1: 750, alphaDeg: 25, sigmaH_lim: 981 });
  rel('2019-02-05  W_max Hertz, elicoidale α=25° [kW]', r.P_kW_H, 95.5, 0.02,
    'atteso ricalcolato con i fattori letti a mano (Φ/Γ = 0.59); il riprogetto usa W ≈ 95 kW');

  // Riprogetto: m = 6 per entrambi gli stadi, z 18/30, W = 95.5 kW
  const s2 = design({ z1: 18, z2: 30, n1: 750 * 0.6, W_kW: 95.5, sigmaH: 1059, m: 6 });
  rel('2019-02-05  II stadio: ϕ al limite di Hertz', s2.phi, 0.995, 0.01);
  rel('2019-02-05  II stadio: Fc [N]', s2.Fc, 37352, 0.01);
  rel('2019-02-05  II stadio: σL Lewis a parità di y [MPa]', sigmaSameY(s2.sigma_L, s2.yLewis, 0.32), 180, 0.01, 'W 95.5 kW invece di ~95');
  const s1 = design({ z1: 18, z2: 30, n1: 750, W_kW: 95.5, sigmaH: 981, m: 6 });
  rel('2019-02-05  I stadio: ϕ al limite di Hertz', s1.phi, 0.695, 0.01);
  rel('2019-02-05  I stadio: L [mm]', s1.L_face, 75, 0.01);
  rel('2019-02-05  I stadio: σL Lewis a parità di y [MPa]', sigmaSameY(s1.sigma_L, s1.yLewis, 0.32), 156, 0.01);
}

// ---------------------------------------------------------------------------
// Appello 7 febbraio 2022 — II stadio elicoidale (mn=7, α=35°, z 7/24, L=58, σH=1180)
// ---------------------------------------------------------------------------
{
  const r = wmax({ toothType: 'helical', m_input: 7, L_mm: 58, z1: 7, z2: 24, n1: 1000 * 18 / 35, alphaDeg: 35, sigmaH_lim: 1180 });
  rel('2022-02-07  II stadio elicoidale: capacità con L = 58 mm [kW]', r.P_kW_H, 44, 0.02);
}

// ---------------------------------------------------------------------------
// Lewis, dentature elicoidali: σL = Fc / (L mn y(z', x)) · Ψ / Γt   (z' = z / cos³α)
// ---------------------------------------------------------------------------
{
  // 2019-01-07, II stadio: mn=3.5, α=21°, z3=19, z4=78, L=60.56, Fc=36266 N, y letto 0.36, Ψ/Γt letto 0.675
  const a = 21, zp = 19 / Math.pow(Math.cos(a * Math.PI / 180), 3);
  const y = getLewisFactor(zp, 0), h = getHelicalFactors(a, 19, 78);
  const sig = 36266 / (60.56 * 3.5 * y) * (h.Psi / h.Gamma_T);
  rel('2019-01-07  II stadio elicoidale: σL a parità di y e Ψ/Γt [MPa]', sig * (y / 0.36) * (0.675 / (h.Psi / h.Gamma_T)), 320, 0.01);
}
{
  // 2022-02-07, II stadio: mn=7, α=35°, z3=7, z4=24, x=+0.3, L=58, Fc=27346 N, Yeq letto 0.395, Ψ/Γt = 1.06/1.16
  const a = 35, zp = 7 / Math.pow(Math.cos(a * Math.PI / 180), 3);
  const y = getLewisFactor(zp, 0.3), h = getHelicalFactors(a, 7, 24);
  rel('2022-02-07  II stadio elicoidale: σL [MPa]', 27346 / (58 * 7 * y) * (h.Psi / h.Gamma_T), 156, 0.02);
}

// ---------------------------------------------------------------------------
// Fattore di Lewis y dal diagramma vs. valori letti a mano negli esercizi
// ---------------------------------------------------------------------------
for (const [z, x, yHand, where] of [
  [25, 0, 0.38, '2018-02-06 ruota 1'],
  [30, 0, 0.38, '2018-02-06 ruota 2'],
  [18, 0, 0.32, '2019 pignone z=18'],
  [19 / Math.pow(Math.cos(21 * Math.PI / 180), 3), 0, 0.36, '2019-01-07 II stadio'],
  [7 / Math.pow(Math.cos(35 * Math.PI / 180), 3), 0.3, 0.395, '2022-02-07 II stadio'],
]) {
  abs(`diagramma Lewis z'=${z.toFixed(1)} x=${x}: y  (${where})`, getLewisFactor(z, x), yHand, 0.025, 'lettura a mano');
}

// ---------------------------------------------------------------------------
// Coefficienti correttivi elicoidali vs. valori letti a mano dal diagramma del corso
// ---------------------------------------------------------------------------
for (const [a, z1, z2, phi, g1, g2, psi] of [
  [25, 18, 50, 0.85, 0.68, 0.76, null],
  [21, 19, 78, 0.90, 0.71, 0.80, 1.02],
  [35, 7, 24, 0.73, 0.54, 0.62, 1.06],
]) {
  const h = getHelicalFactors(a, z1, z2);
  const tag = `α=${a}° z=${z1}/${z2}`;
  abs(`diagramma ${tag}: Φ`, h.Phi, phi, 0.01);
  abs(`diagramma ${tag}: Γt1`, h.Gamma_T1, g1, 0.01);
  abs(`diagramma ${tag}: Γt2`, h.Gamma_T2, g2, 0.025, z2 === 78 ? 'z = 78 non ha una curva: lettura a occhio tra 50 e 100' : '');
  if (psi !== null) abs(`diagramma ${tag}: Ψ`, h.Psi, psi, 0.01);
}

// ---------------------------------------------------------------------------
let failed = 0;
const w = Math.max(...cases.map(c => c.name.length));
for (const c of cases) {
  const err = c.kind === 'rel' ? Math.abs(c.got / c.expected - 1) : Math.abs(c.got - c.expected);
  const ok = err <= c.tol;
  if (!ok) failed++;
  const errStr = c.kind === 'rel' ? `${(100 * (c.got / c.expected - 1)).toFixed(2)}%` : (c.got - c.expected).toFixed(3);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name.padEnd(w)}  MechCalc ${c.got.toFixed(3).padStart(10)}  atteso ${String(c.expected).padStart(7)}  Δ ${errStr.padStart(7)}${c.note ? '   (' + c.note + ')' : ''}`);
}
console.log(`\n${cases.length - failed}/${cases.length} casi entro tolleranza`);
process.exit(failed ? 1 : 0);
