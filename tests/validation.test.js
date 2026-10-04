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
for (const f of ['core/gears-core.js', 'core/fits-core.js', 'core/belts-core.js', 'core/shafts-core.js', 'core/frames-core.js']) {
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
// ---------------------------------------------------------------------------
// ALBERI — Esame dell'11 aprile 2003, soluzione ufficiale (dattiloscritta) del docente
// Albero intermedio, sezione C: flessione rotante Mf = 1887 N·m, torsione statica da 30 kW a 200 rpm,
// σR = 1080, σs = 800, σLF = 520 MPa, X = 1.75, sgrossatura buona.
// ---------------------------------------------------------------------------
{
  const S = vm.runInContext('({ shaftKt, shaftQ, shaftB1, shaftB2, shaftCheck, shaftDesign, shaftDesignFixedCoefficients, shaftFatigueStrength })', ctx);
  const Mt = 30000 / omega(200);
  rel('2003-04-11  alberi: momento torcente [N·m]', Mt, 1432, 0.002);

  // coefficienti di primo tentativo (d = 50, D = 55, r = 1) vs. valori letti dal docente
  abs('2003-04-11  diagramma Kt flessione D/d=1.10 r/d=0.02', S.shaftKt('bending', 0.02, 1.10), 2.5, 0.1, 'formula del corso B(r/d)^a: lettura a occhio del docente');
  abs('2003-04-11  diagramma q flessione r=1 σR=1080', S.shaftQ('bending', 1, 1080), 0.85, 0.015);
  abs('2003-04-11  diagramma b1 d=50', S.shaftB1(50), 0.77, 0.01);
  abs('2003-04-11  diagramma b2 sgrossatura buona σR=1080', S.shaftB2('e', 1080), 0.75, 0.01);

  // passo di progetto con gli stessi coefficienti della soluzione: Wf -> d
  const fixed = S.shaftDesignFixedCoefficients({ Mf: 1887, Mt, ke: 2.27, b1: 0.77, b2: 0.75, sigmaN: 520, sigmaR: 1080, X: 1.75 });
  rel('2003-04-11  progetto: Wf [mm³] (coefficienti del docente)', fixed.Wf, 26100, 0.01);
  rel('2003-04-11  progetto: d [mm] (coefficienti del docente)', fixed.d, 64.3, 0.005);

  // verifica a d = 65, D = 76, r = 2
  abs('2003-04-11  diagramma Kt flessione D/d=1.17 r/d=0.03', S.shaftKt('bending', 2 / 65, 76 / 65), 2.3, 0.1, 'formula del corso: lettura a occhio del docente');
  abs('2003-04-11  diagramma q flessione r=2 σR=1080', S.shaftQ('bending', 2, 1080), 0.87, 0.015);
  abs('2003-04-11  diagramma b1 d=65', S.shaftB1(65), 0.73, 0.005);
  const base = { loads: { Mf: 1887, bendingCycle: 'rotating', Mt, torsionCycle: 'static', N: 0 }, sigmaR: 1080, sigmaS: 800, sigmaLF: 520, cycles: 0, finish: 'e' };
  const v = S.shaftCheck({ ...base, notch: { type: 'manual', ke: 2.13 }, b1Override: 0.73, b2Override: 0.75 }, 65);
  rel('2003-04-11  verifica a fatica: solo termine di flessione [X]', 1 / (v.sigmaAeq / (0.73 * 0.75 * 520)), 1.91, 0.01,
    'la soluzione ufficiale scrive X = 1.91 ma omette il termine di torsione');
  rel('2003-04-11  verifica a fatica completa (Goodman) [X]', v.Xfatigue, 1.824, 0.005, 'con torsione: 1.82 > 1.75, verifica comunque positiva');
  rel('2003-04-11  verifica a snervamento [X]', v.Xyield, 4.5, 0.02);
  // stessa verifica con i coefficienti ricavati dai diagrammi del corso
  const vc = S.shaftCheck({ ...base, notch: { type: 'shoulder', Dd: 76 / 65, r: 2 } }, 65);
  rel('2003-04-11  verifica con i coefficienti dei diagrammi [X]', vc.Xfatigue, 1.824, 0.04, 'Kt dalla formula 2.22 invece di 2.3 letto a occhio');

  // ---- trave 1D dello stesso esame: appoggi A (x=0) e C (x=240), ruota B (x=67.5, Ø210), pignone D a sbalzo (x=305, Ø105)
  const B = vm.runInContext('({ shaftBeam, shaftBearingC })', ctx);
  const beam = (FtB, FrB, FtD, FrD) => B.shaftBeam({ xA: 0, xB: 240, Mt, theta: 20, elements: [
    { type: 'gear', x: 67.5, d: 210, FtDir: FtB, FrDir: FrB, torque: 'in' },
    { type: 'gear', x: 305, d: 105, FtDir: FtD, FrDir: FrD, torque: 'out' }] });
  // versi della soluzione ufficiale: Fr (piano verticale) opposte, Fc (piano orizzontale) concordi
  const bd = beam('-H', '+V', '-H', '-V');
  rel('2003-04-11  trave: forza tangenziale su B [N]', bd.loads[0].Ft, 13642, 0.001);
  rel('2003-04-11  trave: forza radiale su D [N]', bd.loads[1].Fr, 9930.5, 0.001);
  rel('2003-04-11  trave: reazione in C, piano verticale [kN]', Math.abs(bd.RB.V) / 1000, 11.2, 0.01);
  rel('2003-04-11  trave: reazione in C, piano orizzontale [kN]', Math.abs(bd.RB.H) / 1000, 38.5, 0.01);
  rel('2003-04-11  trave: reazione in C [kN]', bd.RB.R / 1000, 40.1, 0.005);
  rel('2003-04-11  trave: reazione in A, piano orizzontale [kN]', Math.abs(bd.RA.H) / 1000, 2.4, 0.015);
  rel('2003-04-11  trave: reazione in A [kN]', bd.RA.R / 1000, 6.7, 0.005, 'la soluzione scrive 6.22 kN sul piano verticale: 4965 + 11224 − 9930 = 6259 N');
  rel('2003-04-11  trave: momento flettente risultante in C [N·m]', bd.at(240).Mf, 1887, 0.001);
  rel('2003-04-11  trave: sezione critica trovata = C (x = 240 mm)', bd.critical.x, 240, 1e-9);
  rel('2003-04-11  cuscinetto C: C richiesto per 10⁷ cicli [N]', B.shaftBearingC(bd.RB.R, 10), 86400, 0.002);
  rel('2003-04-11  cuscinetto A: C richiesto per 10⁷ cicli [N]', B.shaftBearingC(bd.RA.R, 10), 14400, 0.005);
  // soluzione a mano di Luigi (stessa configurazione, piani chiamati al contrario)
  const bl = beam('-V', '-H', '-V', '+H');
  rel('2003-04-11  trave (Luigi): momento in C, piano verticale [N·m]', Math.abs(bl.at(240).Mv), 1774, 0.002);
  rel('2003-04-11  trave (Luigi): momento in C, piano orizzontale [N·m]', Math.abs(bl.at(240).Mh), 645.5, 0.002);
  rel('2003-04-11  trave (Luigi): momento in B, piano orizzontale [N·m]', Math.abs(bl.at(67.5).Mh), 422.43, 0.002);
  rel('2003-04-11  trave (Luigi): momento in B, piano verticale [N·m]', Math.abs(bl.at(67.5).Mv), 161, 0.015, 'a mano 0.0133 invece di 0.0183 nel secondo termine');
  rel('2003-04-11  trave (Luigi): momento risultante in B [N·m]', bl.at(67.5).Mf, 452.1, 0.002);
  rel('2003-04-11  trave: torcente fra B e D [N·m]', bl.at(150).T, 1432.4, 0.001);

  // equilibrio con una ruota elicoidale (coppia concentrata Fa·r): la trave deve chiudersi a momento nullo
  const bh = B.shaftBeam({ xA: 0, xB: 200, Mt: 100, theta: 20, elements: [
    { type: 'gear', x: 100, d: 100, helix: 20, FtDir: '+H', FrDir: '-V', FaDir: '+x', torque: 'in' },
    { type: 'coupling', x: 260, torque: 'out' }] });
  const endM = bh.at(bh.xmax + 1);
  abs('trave elicoidale: momento nullo oltre l\'ultimo carico [N·m]', Math.hypot(endM.Mv, endM.Mh), 0, 1e-9);
  abs('trave elicoidale: salto di momento in x=100 = Fa·r [N·m]', bh.at(100, 1).Mv - bh.at(100, -1).Mv, 2000 * Math.tan(20 * Math.PI / 180) * 0.05, 1e-9);
  abs('trave elicoidale: reazione assiale = −ΣFa [N]', bh.RA.axial, -2000 * Math.tan(20 * Math.PI / 180), 1e-9);

  // ---- esame del 9 dicembre 2002 (soluzione a mano di Luigi): 14 kW a 115 giri/min, X = 1.25, vita infinita
  // albero L = 270: estremità A (0) e B (270), cuscinetti C (10) e F (260), ruota D Ø170 (40), pignone E Ø90 (160)
  const P = vm.runInContext('({ shaftBeam, shaftPointLabels, shaftNotchFactors, shaftDesign, shaftDesignFixedCoefficients })', ctx);
  const Mt02 = 14000 / (115 * 2 * Math.PI / 60);
  const b02 = P.shaftBeam({ xA: 10, xB: 260, L: 270, Mt: Mt02, theta: 20, elements: [
    { type: 'gear', x: 40, d: 170, FtDir: '+H', FrDir: '-V', torque: 'in' },
    { type: 'gear', x: 160, d: 90, FtDir: '-H', FrDir: '-V', torque: 'out' }] });
  rel('2002-12-09  trave: momento torcente [N·m]', Mt02, 1162, 0.001);
  rel('2002-12-09  trave: forza tangenziale ruota Ø170 [kN]', b02.loads[0].Ft / 1000, 13.68, 0.001);
  rel('2002-12-09  trave: forza radiale pignone Ø90 [kN]', b02.loads[1].Fr / 1000, 9.4, 0.001);
  rel('2002-12-09  trave: momento in E, piano verticale [N·m]', b02.at(160).Mv, 624, 0.001);
  rel('2002-12-09  trave: momento in E, risultante [N·m]', b02.at(160).Mf, 1520, 0.001);
  rel('2002-12-09  trave: sezione critica = pignone (x = 160 mm)', b02.critical.x, 160, 1e-9);
  const lb02 = b02.labels;
  abs('2002-12-09  nomi: A, B estremità; C, D, E, F da sx a dx', [lb02.bearing1, lb02.elements[0], lb02.elements[1], lb02.bearing2].join('') === 'CDEF'
    && lb02.points.map(p => p.name).join('') === 'ACDEFB' ? 1 : 0, 1, 0);
  // intaglio combinato spallamento (D/d = 1.2, r = 2) × cava linguetta (ke = 1.4 dal testo)
  const nf02 = P.shaftNotchFactors({ type: 'combined', Dd: 1.2, r: 2, key: 'given', keyKe: 1.4 }, 50, 880);
  rel('2002-12-09  Ke combinato / Ke spallamento = ke linguetta', nf02.ke / nf02.shoulderKe, 1.4, 1e-12);
  rel('2002-12-09  Ke combinato a d = 50 (soluzione: 1.9 × 1.4 = 2.66)', nf02.ke, 2.66, 0.02, 'Kt 2.09 e q 0.85 dai diagrammi invece di 2 e 0.9');
  // formula chiusa con i coefficienti della soluzione a mano (b1 0.77, b2 0.78, σR → 720 nel termine medio)
  const h02 = P.shaftDesignFixedCoefficients({ Mf: 1520, Mt: Mt02, ke: 2.66, b1: 0.77, b2: 0.78, sigmaN: 390, sigmaR: 720, X: 1.25 });
  rel('2002-12-09  d con i coefficienti della soluzione a mano [mm]', h02.d, 61, 0.01, 'b2 = 0.78 e σs al posto di σR come nel quaderno');
  const d02 = P.shaftDesign({ loads: { Mf: 1520, bendingCycle: 'rotating', Mt: Mt02, torsionCycle: 'static', N: 0 },
    sigmaR: 880, sigmaS: 720, sigmaLF: 390, cycles: 0, finish: 'd', notch: { type: 'combined', Dd: 1.2, r: 2, key: 'given', keyKe: 1.4 } }, 1.25);
  rel('2002-12-09  progetto con intaglio combinato, coefficienti dai diagrammi [mm]', d02.dMin, 61, 0.01,
    'Kt 2.09, q 0.85, b2 0.876 dai diagrammi: 60.8 mm');

  // ==== Altri esami sugli alberi del PDF degli esercizi svolti (soluzioni a mano di Luigi), verificati il 3/10/2026.
  // Per ogni esame: stessi dati nel motore del tool, prima con i coefficienti di Luigi (per isolare aritmetica e metodo),
  // poi con i diagrammi del corso. Le note spiegano ogni scarto: svista a mano, lettura del diagramma o scelta di metodo.
  // ---- esame dell'11 giugno 2004 (soluzione a mano di Luigi): 60 W a 7.5 giri/min (50 %) e 9 giri/min (50 %), 2000 h, X = 1.5
  // albero L = 243: ruota Ø120 a sbalzo (x=0), cuscinetti B (x=44) e C (x=183), ruota per catena Ø200 a sbalzo (x=243)
  // sezione verificata: Ø19 (spallamento 20/19, r = 1) con cava linguetta ke = 1.4 dal testo, rettifica media, momento di B
  {
    const A04 = vm.runInContext('({ shaftBeam, shaftCheck, shaftFatigueStrength })', ctx);
    const Mt04 = 60 / (7.5 * 2 * Math.PI / 60);
    const b04 = A04.shaftBeam({ xA: 44, xB: 183, L: 243, Mt: Mt04, theta: 20, elements: [
      { type: 'gear', x: 0, d: 120, FtDir: '+H', FrDir: '+V', torque: 'in' },
      { type: 'force', x: 243, Fv: 0, Fh: Mt04 * 1000 / 100 },        // tiro catena = Mt / r, stesso verso di Ft (piano O.)
      { type: 'coupling', x: 243, torque: 'out' }] });
    rel('2004-06-11  momento torcente a 7.5 giri/min [N·m]', Mt04, 76.43, 0.002);
    rel('2004-06-11  trave: forza tangenziale ruota Ø120 [N]', b04.loads[0].Ft, 1273.8, 0.002);
    rel('2004-06-11  trave: forza radiale ruota Ø120 [N]', b04.loads[0].Fr, 463.6, 0.002);
    rel('2004-06-11  trave: tiro catena [N]', b04.loads[1].Fh, 764.3, 0.002);
    rel('2004-06-11  trave: momento in B, piano orizzontale [N·m]', Math.abs(b04.at(44).Mh), 56, 0.002);
    rel('2004-06-11  trave: momento in B, piano verticale [N·m]', Math.abs(b04.at(44).Mv), 20.4, 0.002);
    rel('2004-06-11  trave: momento risultante in B [N·m]', b04.at(44).Mf, 59.6, 0.002);
    rel('2004-06-11  trave: momento in C (solo catena) [N·m]', b04.at(183).Mf, 45.9, 0.002);
    rel('2004-06-11  trave: sezione critica = cuscinetto B (x = 44)', b04.critical.x, 44, 1e-9);
    const n1 = 7.5 * 60 * 1000;                                            // 450 000 cicli nella fase a 7.5 giri/min
    const chk = (R, S, LF, extra) => A04.shaftCheck({ loads: { Mf: 59.6, bendingCycle: 'rotating', Mt: Mt04, torsionCycle: 'static', N: 0 },
      sigmaR: R, sigmaS: S, sigmaLF: LF, cycles: n1, finish: 'd', ...extra }, 19);
    // σN richiesto per X = 1.5 e vita corrispondente sulla retta di Wöhler (procedimento di Luigi)
    const sNreq = (v, R) => (v.sigmaAeq / (v.b1 * v.b2)) / (1 / 1.5 - v.sigmaMeq / R);
    const life = (sN, R, LF) => 1e6 * Math.pow(LF / sN, 3 / Math.log10(R / LF));
    const c40 = chk(710, 500, 280, { notch: { type: 'manual', ke: 1.616 * 1.4, keT: 1.16 }, b1Override: 0.9, b2Override: 0.88 });
    rel('2004-06-11  C40: σa,eq [MPa] (coefficienti di Luigi)', c40.sigmaAeq, 199.4, 0.015, 'σa = 88.6 MPa, a mano arrotondato a 89');
    rel('2004-06-11  C40: σm,eq = τm [MPa]', c40.sigmaMeq, 56.6, 0.005, 'ω arrotondato a 0.785 e Wf a 6.7e-7 nella soluzione');
    rel('2004-06-11  C40: σN richiesto per X = 1.5 [MPa]', sNreq(c40, 710), 429, 0.01);
    rel('2004-06-11  C40: vita ammissibile [cicli]', life(sNreq(c40, 710), 710, 280), 42177, 0.06, 'esponente 7.42: 0.5 % su σN -> 4 % sulla vita');
    const c60 = chk(850, 600, 390, { notch: { type: 'manual', ke: 1.64 * 1.4, keT: 1.16 }, b1Override: 0.9, b2Override: 0.87 });
    rel('2004-06-11  C60: σN richiesto per X = 1.5 [MPa]', sNreq(c60, 850), 436.6, 0.01,
      'esatto 432.6: a mano σm,eq/σR arrotondato a 0.07 invece di 0.0666 (vita 368 000 invece di 396 000)');
    abs('2004-06-11  C60: vita < 450 000 cicli (scartato)', life(sNreq(c60, 850), 850, 390) < n1 ? 1 : 0, 1, 0, 'a mano 367 867; esatto 396 000');
    const ni = chk(1050, 900, 550, { notch: { type: 'manual', ke: 1.672 * 1.4, keT: 1.16 }, b1Override: 0.9, b2Override: 0.86 });
    rel('2004-06-11  40NiCrMo7: σN richiesto per X = 1.5 [MPa]', sNreq(ni, 1050), 439, 0.01);
    abs('2004-06-11  40NiCrMo7: σN richiesto < σLF -> vita infinita', sNreq(ni, 1050) < 550 ? 1 : 0, 1, 0);
    // stesse verifiche con i coefficienti dei diagrammi (spallamento × cava ke = 1.4)
    const notch04 = { type: 'combined', Dd: 20 / 19, r: 1, key: 'given', keyKe: 1.4 };
    const t40 = chk(710, 500, 280, { notch: notch04 }), t60 = chk(850, 600, 390, { notch: notch04 }), tni = chk(1050, 900, 550, { notch: notch04 });
    abs('2004-06-11  diagramma Kt flessione D/d=1.05 r/d=0.053', t40.KtB, 1.8, 0.02);
    abs('2004-06-11  diagramma b2 rettifica media σR=710', t40.b2, 0.88, 0.01);
    abs('2004-06-11  diagramma b2 rettifica media σR=1050', tni.b2, 0.86, 0.01);
    rel('2004-06-11  C40 (diagrammi): X a 450 000 cicli', t40.Xfatigue, 1.137, 0.01, 'non verificato');
    rel('2004-06-11  C60 (diagrammi): X a 450 000 cicli', t60.Xfatigue, 1.50, 0.01, 'al limite: Luigi lo scarta con 0.07 arrotondato');
    rel('2004-06-11  40NiCrMo7 (diagrammi): X a 450 000 cicli', tni.Xfatigue, 1.995, 0.01, 'scelta: 40NiCrMo7');
  }

  // ---------------------------------------------------------------------------
  // ALBERI — Appello del 20 settembre 2004, soluzione a mano di Luigi (pp. 27-29)
  // Albero intermedio: ruota A Ø120 (x=15, verso U1), cuscinetto B (x=90), ruota C Ø300 (x=180, dal motore),
  // cuscinetto D (x=340), ruota E Ø120 (x=415, verso U2). 1200 N·m per utilizzatore, rapporto 180/120 -> 800 N·m.
  // Piano V = tangenziale, piano H = radiale. σR=1250, σs=980, σLF=590, X=2, vita infinita, rettifica media (b2=0.86).
  // Casi: I solo U1, II solo U2, III entrambi (C trasmette 1600 N·m -> forza generica).
  // ---------------------------------------------------------------------------
  {
    const B = vm.runInContext('({ shaftBeam })', ctx);
    const S = vm.runInContext('({ shaftKt, shaftQ, shaftB1, shaftB2, shaftCheck, shaftDesign, shaftDesignFixedCoefficients })', ctx);
    const gA = { type: 'gear', x: 15, d: 120, FtDir: '+V', FrDir: '+H', torque: 'out' };
    const gC = { type: 'gear', x: 180, d: 300, FtDir: '+V', FrDir: '-H', torque: 'in' };
    const gE = { type: 'gear', x: 415, d: 120, FtDir: '-V', FrDir: '-H', torque: 'out' };
    const tn = Math.tan(20 * Math.PI / 180), FtC3 = 2 * 1600 / 0.3;
    const b1c = B.shaftBeam({ xA: 90, xB: 340, L: 430, Mt: 800, elements: [gA, gC] });
    const b2c = B.shaftBeam({ xA: 90, xB: 340, L: 430, Mt: 800, elements: [gC, gE] });
    const b3c = B.shaftBeam({ xA: 90, xB: 340, L: 430, Mt: 800, elements: [gA, { type: 'force', x: 180, Fv: FtC3, Fh: -FtC3 * tn }, gE] });
    rel('2004-09-20  forza tangenziale ruota A Ø120 [N]', b1c.loads[0].Ft, 13333, 0.002);
    rel('2004-09-20  forza radiale ruota A [N]', b1c.loads[0].Fr, 4852, 0.002);
    rel('2004-09-20  forza tangenziale ruota C Ø300, una utenza [N]', b1c.loads[1].Ft, 5333, 0.002);
    rel('2004-09-20  caso I: Mv in B [N·m]', b1c.at(90).Mv, 1000, 0.002);
    rel('2004-09-20  caso I: Mh in B [N·m]', b1c.at(90).Mh, 364, 0.005);
    rel('2004-09-20  caso I: Mf in B [N·m]', b1c.at(90).Mf, 1064, 0.002);
    rel('2004-09-20  caso I: |Mv| in C [N·m]', Math.abs(b1c.at(180).Mv), 333, 0.005);
    rel('2004-09-20  caso I: |Mh| in C [N·m]', Math.abs(b1c.at(180).Mh), 345, 0.005);
    rel('2004-09-20  caso I: Mf in C [N·m]', b1c.at(180).Mf, 479.2, 0.005, 'Luigi scrive 379.5: errore di trascrizione, sqrt(345²+333²)=479.5');
    rel('2004-09-20  caso II: Mf in D [N·m]', b2c.at(340).Mf, 1064, 0.002);
    rel('2004-09-20  caso II: |Mv| in C [N·m]', Math.abs(b2c.at(180).Mv), 667, 0.002);
    rel('2004-09-20  caso II: |Mh| in C [N·m]', Math.abs(b2c.at(180).Mh), 19, 0.02);
    rel('2004-09-20  caso II: Mf in C [N·m]', b2c.at(180).Mf, 667, 0.002);
    rel('2004-09-20  caso III: |Mv| in C [N·m]', Math.abs(b3c.at(180).Mv), 334, 0.005);
    rel('2004-09-20  caso III: |Mh| in C [N·m]', Math.abs(b3c.at(180).Mh), 326, 0.005);
    rel('2004-09-20  caso III: Mf in C [N·m]', b3c.at(180).Mf, 466.7, 0.002);
    rel('2004-09-20  caso III: Mf in B e D [N·m]', Math.max(b3c.at(90).Mf, b3c.at(340).Mf), 1064, 0.002);

    // sezione D (spallamento cuscinetto, D/d = 1.5, r = 2): Mf = 1064, Mt = 800 statico
    abs('2004-09-20  diagramma Kt flessione D/d=1.5 r/d=0.033', S.shaftKt('bending', 2 / 60, 1.5), 2.4, 0.15, 'formula 2.26: lettura a occhio 2.4');
    abs('2004-09-20  diagramma q flessione r=2 σR=1250', S.shaftQ('bending', 2, 1250), 0.91, 0.01);
    abs('2004-09-20  diagramma b1 d=60', S.shaftB1(60), 0.74, 0.005);
    abs('2004-09-20  diagramma b2 rettifica media σR=1250', S.shaftB2('d', 1250), 0.86, 0.005);
    const fx = S.shaftDesignFixedCoefficients({ Mf: 1064, Mt: 800, torsionCycle: 'static', ke: 2.27, b1: 0.74, b2: 0.86, sigmaN: 590, sigmaR: 1250, X: 2 });
    rel('2004-09-20  progetto: d [mm] (coefficienti di Luigi)', fx.d, 51.6, 0.005);
    abs('2004-09-20  diagramma Kt flessione D/d=1.5 r/d=0.036', S.shaftKt('bending', 2 / 55, 1.5), 2.3, 0.1, 'formula 2.21: lettura a occhio 2.3');
    abs('2004-09-20  diagramma b1 d=55', S.shaftB1(55), 0.75, 0.005);
    const base = { loads: { Mf: 1064, bendingCycle: 'rotating', Mt: 800, torsionCycle: 'static', N: 0 }, sigmaR: 1250, sigmaS: 980, sigmaLF: 590, cycles: 0, finish: 'd' };
    const v = S.shaftCheck({ ...base, notch: { type: 'manual', ke: 2.18 }, b1Override: 0.75, b2Override: 0.86 }, 55);
    rel('2004-09-20  verifica a fatica d=55 (coefficienti di Luigi) [X]', v.Xfatigue, 2.546, 0.005, 'Luigi: 1/X = 0.39 -> X = 2.5 (arrotondato)');
    rel('2004-09-20  verifica a snervamento d=55 [(σa+σm)/σs]', 1 / v.Xyield, 0.17, 0.01);
    const vc = S.shaftCheck({ ...base, notch: { type: 'shoulder', Dd: 1.5, r: 2 } }, 55);
    rel('2004-09-20  verifica d=55 con i coefficienti dei diagrammi [X]', vc.Xfatigue, 2.546, 0.04, 'Kt dalla formula 2.21 invece di 2.3 letto a occhio -> X 2.64');
    const des = S.shaftDesign({ ...base, notch: { type: 'shoulder', Dd: 1.5, r: 2 } }, 2);
    rel('2004-09-20  progetto automatico con i diagrammi: dMin [mm]', des.dMin, 49.46, 0.005, 'Luigi 51.6 -> 55 con Kt=2.4 letto a d=60; con la formula dMin<50 -> foro 50');
  }

  // ---- esame del 7 gennaio 2005 (soluzione a mano di Luigi): verricello, ruota elicoidale Ø80 (x=15) + puleggia catena r=40 (x=55)
  // cuscinetti A (x=0) e C (x=35); 40NiCrMo7 σR=1050 σS=910 σLF=580, rettifica media, r=0.25, X=1.5, 10⁷ giri. Problema inverso: P max.
  {
    const A05 = vm.runInContext('({ shaftBeam, shaftCheck, shaftBearingC })', ctx);
    const beam05 = P => A05.shaftBeam({ xA: 0, xB: 35, L: 55, Mt: 0.04 * P, theta: 20, elements: [
      { type: 'gear', x: 15, d: 80, helix: 0, FtDir: '-H', FrDir: '+V', torque: 'in' },   // vite sotto la ruota: Fr verso l'alto
      { type: 'force', x: 55, Fv: -P, Fh: 0 },                                             // carico appeso
      { type: 'coupling', x: 55, torque: 'out' }] });
    const u = beam05(1);
    rel('2005-01-07  trave: Mf in B, piano orizzontale [·P N·m]', Math.abs(u.at(15).Mh), 8.6e-3, 0.005);
    rel('2005-01-07  trave: Mf in B, piano verticale [·P N·m]', Math.abs(u.at(15).Mv), 0.0117, 0.005, 'a mano arrotondato a 0.012');
    rel('2005-01-07  trave: Mf in B [·P N·m]', u.at(15).Mf, 0.0145, 0.005, 'a mano arrotondato a 0.015');
    rel('2005-01-07  trave: Mf in C [·P N·m]', u.at(35).Mf, 0.02, 1e-9);
    rel('2005-01-07  trave: sezione critica = cuscinetto C (x = 35)', u.critical.x, 35, 1e-9);
    // problema inverso: X ∝ 1/P, quindi P max = P0 · X(P0) / 1.5
    const chk = (P, notch, extra = {}) => A05.shaftCheck({ loads: { Mf: 0.02 * P, bendingCycle: extra.bc || 'rotating', Mt: 0.04 * P, torsionCycle: 'static', N: 0 },
      sigmaR: 1050, sigmaS: 910, sigmaLF: 580, cycles: 1e7, finish: 'd', notch, ...extra.ov }, 15);
    const vL = chk(1000, { type: 'manual', ke: 2.3 }, { ov: { b1Override: 0.95, b2Override: 0.97 } });
    rel('2005-01-07  fatica C: σa [MPa/kN]', vL.sigmaBa, 60.36, 0.001);
    rel('2005-01-07  fatica C: P max [N] (coefficienti di Luigi)', 1000 * vL.Xfatigue / 1.5, 2101, 0.002,
      'a mano 2205 N: 1/1.5 scritto 0.7 (+5 %)');
    const vC = chk(1000, { type: 'shoulder', Dd: 18 / 15, r: 0.25 });
    rel('2005-01-07  fatica C: P max [N] (diagrammi)', 1000 * vC.Xfatigue / 1.5, 2002, 0.01,
      'Kt 2.60 (r/d = 0.017 fuori diagramma) invece di 2.75, b2 rettifica media 0.867 invece di 0.97');
    rel('2005-01-07  statica C: P max [N] (von Mises, come a mano)', 910 / 1.5 / (Math.hypot(vL.sigmaBa, Math.sqrt(3) * vL.tauM) / 1000), 5025, 0.002);
    rel('2005-01-07  statica C: P max [N] (formula del corso σm,eq, flessione statica)', 1000 * chk(1000, { type: 'none' }, { bc: 'static' }).Xyield / 1.5, 6212, 0.002,
      'σm,eq = σ/2 + sqrt(σ²/4+τ²) è meno conservativa di von Mises (1.618σ vs 2σ con τ = σ)');
    // cuscinetti con P = 2300 N, 10⁷ giri
    const b = beam05(2300);
    rel('2005-01-07  cuscinetto A: reazione piano orizzontale [N]', Math.abs(b.RA.H), 1314, 0.002);
    rel('2005-01-07  cuscinetto A: reazione piano verticale [N]', Math.abs(b.RA.V), 1793, 0.002, 'a mano 1464: formula giusta, aritmetica sbagliata');
    rel('2005-01-07  cuscinetto C: reazione piano orizzontale [N]', Math.abs(b.RB.H), 985, 0.002);
    rel('2005-01-07  cuscinetto C: reazione piano verticale [N]', Math.abs(b.RB.V), 3256, 0.002, 'a mano 955: 3614 − 359 = 3255');
    rel('2005-01-07  cuscinetto A: C richiesto [N]', A05.shaftBearingC(b.RA.R, 10), 4789, 0.002, 'a mano 4237 (6001, C = 5.4 kN: va bene comunque)');
    rel('2005-01-07  cuscinetto C: C richiesto [N]', A05.shaftBearingC(b.RB.R, 10), 7328, 0.002, 'a mano 2956: il 61902 (C = 4.36 kN) non basta');
    rel('2005-01-07  shaftBearingC con la reazione di Luigi (solo formula) [N]', A05.shaftBearingC(1372, 10), 2956, 0.002);
  }

  // ---- esame del 14 giugno 2005 (soluzione a mano di Luigi): albero intermedio da tondo Ø50, soluzione 5 (ruote a sbalzo)
  // ruota A Ø180 condotta (x=0), cuscinetti B (x=50) e C (x=250), ruota D Ø90 motrice (x=300); sezione C d=45, D=50, r=1
  // σR=1150, σs=950, σLF=540, rettifica media, 5·10⁵ cicli, X = 2. Problema inverso: Mt max (X ∝ 1/Mt).
  {
    const S = vm.runInContext('({ shaftBeam, shaftCheck, shaftKt, shaftQ, shaftB1, shaftB2, shaftFatigueStrength, shaftBearingC })', ctx);
    const beam = Mt => S.shaftBeam({ xA: 50, xB: 250, Mt, theta: 20, elements: [
      { type: 'gear', x: 0, d: 180, FtDir: '+V', FrDir: '-H', torque: 'in' },
      { type: 'gear', x: 300, d: 90, FtDir: '-V', FrDir: '-H', torque: 'out' }] });
    rel('2005-06-14  trave: Mf in C per unità di Mt', beam(1).at(250, 1).Mf, 1.18, 0.005);
    rel('2005-06-14  σN a 5·10⁵ cicli [MPa]', S.shaftFatigueStrength(1150, 540, 5e5).sigmaN, 582, 0.002);
    abs('2005-06-14  diagramma q flessione r=1 σR=1150', S.shaftQ('bending', 1, 1150), 0.85, 0.015);
    abs('2005-06-14  diagramma b1 d=45', S.shaftB1(45), 0.77, 0.01);
    abs('2005-06-14  diagramma b2 rettifica media σR=1150', S.shaftB2('d', 1150), 0.87, 0.01);
    abs('2005-06-14  diagramma Kt flessione D/d=1.11 r/d=0.022', S.shaftKt('bending', 1 / 45, 50 / 45), 2.6, 0.25, 'Luigi legge 2.6, la formula del corso dà 2.36');
    const base = { loads: { Mf: beam(1).at(250, 1).Mf, bendingCycle: 'rotating', Mt: 1, torsionCycle: 'static', N: 0 },
      sigmaR: 1150, sigmaS: 950, sigmaLF: 540, cycles: 5e5, finish: 'd' };
    const vL = S.shaftCheck({ ...base, notch: { type: 'manual', ke: 2.36 }, b1Override: 0.77, b2Override: 0.87 }, 45);
    rel('2005-06-14  Mt massimo, coefficienti di Luigi [N·m]', vL.Xfatigue / 2, 590, 0.005);
    const vC = S.shaftCheck({ ...base, notch: { type: 'shoulder', Dd: 50 / 45, r: 1 } }, 45);
    rel('2005-06-14  Mt massimo, diagrammi [N·m]', vC.Xfatigue / 2, 590, 0.10, 'Kt 2.36 (formula) invece di 2.6: 638 N·m');
    const b = beam(590);
    rel('2005-06-14  reazione cuscinetto C [N]', b.RB.R, 18810, 0.005, 'Luigi 14859: bracci sbagliati nell\'equazione dei momenti');
    rel('2005-06-14  reazione cuscinetto B [N]', b.RA.R, 11610, 0.005, 'Luigi 13310: stesso errore');
    rel('2005-06-14  C richiesto cuscinetto C, 0.5·10⁶ giri [N]', S.shaftBearingC(b.RB.R, 0.5), 14930, 0.005, 'Luigi 11793; il 6009 (20.8 kN) resta adeguato');
  }

  // ---- esame del 13 gennaio 2006 (soluzione a mano di Luigi): albero simmetrico, sedi d=32 (linguetta + spallamento 40/32, r=2)
  // cuscinetti x=0 e 208, ruota Ø135 (x=47, dal pignone motore Ø80), ruota Ø145 (x=161); 30 giri/min, X=1.75, 450 000 cicli
  {
    const S = vm.runInContext('({ shaftBeam, shaftCheck, shaftKt, shaftQ, shaftB1, shaftB2, shaftFatigueStrength })', ctx);
    const b = S.shaftBeam({ xA: 0, xB: 208, Mt: 135 / 80, theta: 20, elements: [      // per Mmot = 1 N·m
      { type: 'gear', x: 47, d: 135, FtDir: '-V', FrDir: '-H', torque: 'in' },
      { type: 'gear', x: 161, d: 145, FtDir: '+H', FrDir: '+V', torque: 'out' }] });
    rel('2006-01-13  Ft ruota Ø135 per Mmot [N/N·m]', b.loads[0].Ft, 25, 0.002);
    rel('2006-01-13  Ft ruota Ø145 per Mmot [N/N·m]', b.loads[1].Ft, 23.27, 0.002);
    const MB = b.at(47, 1), MC = b.at(161, -1);
    rel('2006-01-13  Mf sezione B per Mmot', MB.Mf, 0.81, 0.025, 'Luigi arrotonda AB·CD/AD = 10.6 mm a 10 mm: 0.824');
    rel('2006-01-13  Mf sezione C per Mmot', MC.Mf, 0.75, 0.005);
    rel('2006-01-13  σN a 450 000 cicli [MPa]', S.shaftFatigueStrength(1180, 450, 450000).sigmaN, 502.71, 0.002);
    abs('2006-01-13  diagramma b1 d=32', S.shaftB1(32), 0.83, 0.01, 'Luigi scrive 0.76 ma usa 0.83');
    abs('2006-01-13  diagramma b2 rettifica media σR=1180', S.shaftB2('d', 1180), 0.86, 0.01);
    abs('2006-01-13  diagramma q flessione r=2 σR=1180', S.shaftQ('bending', 2, 1180), 0.9, 0.015);
    abs('2006-01-13  diagramma Kt flessione D/d=1.25 r/d=0.0625', S.shaftKt('bending', 0.0625, 1.25), 2.2, 0.35, 'Luigi legge 2.2; formula 1.88, diagramma del corso ≈ 1.85');
    const mk = (Mf, Mt, extra) => ({ loads: { Mf, bendingCycle: 'rotating', Mt, torsionCycle: 'static', N: 0 },
      sigmaR: 1180, sigmaS: 940, sigmaLF: 450, cycles: 450000, finish: 'd', ...extra });
    const vL = S.shaftCheck(mk(0.81, 1.68, { notch: { type: 'manual', ke: 3.328 }, b1Override: 0.83, b2Override: 0.86 }), 32);
    rel('2006-01-13  Mmot massimo, coefficienti di Luigi [N·m]', vL.Xfatigue / 1.75, 224, 0.005, 'Luigi scrive 234: errore aritmetico');
    const notch = { type: 'combined', Dd: 1.25, r: 2, key: 'sled', condition: 'annealed' };
    const vC = S.shaftCheck(mk(MB.Mf, MB.T, { notch }), 32);
    rel('2006-01-13  Mmot massimo, diagrammi [N·m]', vC.Xfatigue / 1.75, 250.7, 0.005, 'Kt 1.88 invece di 2.2');
    const Mm = vC.Xfatigue / 1.75;
    const c2 = S.shaftCheck(mk(MC.Mf * Mm, MC.T * Mm, { notch }), 32);
    const sN2 = c2.sigmaAeq / (c2.b1 * c2.b2 * (1 / 1.75 - c2.sigmaMeq / 1180));
    rel('2006-01-13  σN sezione meno sollecitata [MPa]', sN2, 458.8, 0.003);
    const m = 3 / Math.log10(1180 / 450), N2 = 1e3 * Math.pow(1180 / sN2, m);
    rel('2006-01-13  vita sezione meno sollecitata [cicli]', N2, 870350, 0.005);
    const n2 = Math.min(N2 * (1 - 270000 / 450000), 450000 * (1 - 270000 / N2));
    rel('2006-01-13  durata seconda fase (Miner) [h]', n2 / 1800, 172.5, 0.005);
  }

  // ---- esame del 12 aprile 2006 (soluzione a mano di Luigi): rinvio AD, flessione e torsione alterne simmetriche
  // P in A (x=0, leva 70), cuscinetti x=40 e 200, leva CF=85 a 30° in C (x=145); sezione C d=20, spallamento 25/20 r=1 + linguetta
  {
    const S = vm.runInContext('({ shaftBeam, shaftCheck, shaftKt, shaftQ, shaftB1, shaftFatigueStrength })', ctx);
    const R = 70 / 85;                                                     // per P = 1 N
    const b = S.shaftBeam({ xA: 40, xB: 200, Mt: 0.070, elements: [
      { type: 'force', x: 0, Fh: 1, Fv: 0 }, { type: 'coupling', x: 0, torque: 'in' },
      { type: 'force', x: 145, Fh: -0.5 * R, Fv: -Math.sqrt(3) / 2 * R }, { type: 'coupling', x: 145, torque: 'out' }] });
    const C = b.at(145, -1);
    rel('2006-04-12  Mf in C per unità di P [m]', C.Mf, 0.038, 0.015);
    rel('2006-04-12  Mf in B per unità di P [m]', b.at(40, 1).Mf, 0.04, 0.002);
    abs('2006-04-12  torcente tra C e D [N·m]', b.at(170, 1).T, 0, 1e-9, 'Luigi disegna −P·AE tra C e D: svista senza effetto');
    abs('2006-04-12  diagramma Kt flessione D/d=1.25 r/d=0.05', S.shaftKt('bending', 0.05, 1.25), 1.9, 0.12);
    abs('2006-04-12  diagramma Kt torsione D/d=1.25 r/d=0.05', S.shaftKt('torsion', 0.05, 1.25), 1.65, 0.06);
    abs('2006-04-12  diagramma b1 d=20', S.shaftB1(20), 0.88, 0.015);
    const base = { loads: { Mf: C.Mf, bendingCycle: 'rotating', Mt: C.T, torsionCycle: 'alternating', N: 0 },
      sigmaR: 1150, sigmaS: 950, sigmaLF: 540, cycles: 5e5, finish: 'd' };
    const vL = S.shaftCheck({ ...base, loads: { ...base.loads, Mf: 0.038, Mt: 0.070 },
      notch: { type: 'manual', ke: 1.6 * 1.765, keT: 1.6 * 1.572 }, b1Override: 0.88, b2Override: 0.86 }, 20);
    rel('2006-04-12  σa,eq per unità di P [MPa/N]', vL.sigmaAeq, 0.237388, 0.003);
    rel('2006-04-12  P massima, coefficienti di Luigi [N]', vL.Xfatigue / 2.5, 743, 0.003);
    const vC = S.shaftCheck({ ...base, notch: { type: 'combined', Dd: 1.25, r: 1, key: 'given', keyKe: 1.6, keyKeT: 1.6 } }, 20);
    rel('2006-04-12  P massima, diagrammi (linguetta 1.6/1.6) [N]', vC.Xfatigue / 2.5, 743, 0.01);
  }

  // ---- esame del 21 settembre 2006 (soluzione a mano di Luigi): ruota di rinvio a sbalzo, Ø130, θ=20°, ingranamenti a ±45°
  // ruota x=12, cuscinetti x=70 e 180; albero scarico a torsione. Forze per Mt ruota = 1 N·m. Problema inverso: Mt e P max.
  {
    const S = vm.runInContext('({ shaftBeam, shaftCheck, shaftKt, shaftQ, shaftB1, shaftB2 })', ctx);
    const Ft = 1000 / 65, Fr = Ft * Math.tan(20 * Math.PI / 180), s = Math.SQRT1_2;
    const idler = sgn => S.shaftBeam({ xA: 70, xB: 180, L: 200, Mt: 0, elements: [   // sgn=+1 antiorario (caso II), -1 orario (caso I)
      { type: 'force', x: 12, Fh: -s * Ft * sgn - s * Fr, Fv:  s * Ft * sgn - s * Fr },   // ingranamento con la motrice (+45°)
      { type: 'force', x: 12, Fh: -s * Ft * sgn - s * Fr, Fv: -s * Ft * sgn + s * Fr }] }); // ingranamento con la condotta (−45°)
    rel('2006-09-21  rinvio caso I: Mf sul cuscinetto [·Mt]', idler(-1).at(70).Mf, 0.8, 0.01);
    rel('2006-09-21  rinvio caso II: Mf sul cuscinetto [·Mt]', idler(+1).at(70).Mf, 1.72, 0.002);
    abs('2006-09-21  rinvio: torsione nell\'albero', idler(+1).at(65).T, 0, 1e-9);
    abs('2006-09-21  diagramma Kt flessione D/d=1.14 r/d=0.057', S.shaftKt('bending', 2 / 35, 40 / 35), 1.8, 0.1, 'lettura a occhio 1.8; formula 1.90');
    abs('2006-09-21  diagramma q flessione r=2 σR=1180', S.shaftQ('bending', 2, 1180), 0.9, 0.01);
    abs('2006-09-21  diagramma b1 d=35', S.shaftB1(35), 0.82, 0.01);
    abs('2006-09-21  diagramma b2 rettifica media σR=1180', S.shaftB2('d', 1180), 0.86, 0.005);
    const base = { loads: { Mf: 1.72, bendingCycle: 'rotating', Mt: 0, torsionCycle: 'static', N: 0 }, sigmaR: 1180, sigmaS: 940, sigmaLF: 450, cycles: 0, finish: 'd' };
    const vL = S.shaftCheck({ ...base, notch: { type: 'manual', ke: 1.72, keT: 1 }, b1Override: 0.82, b2Override: 0.86 }, 35);
    rel('2006-09-21  Mt massimo, coefficienti di Luigi [N·m]', vL.Xfatigue / 2.5, 180.6, 0.002);
    rel('2006-09-21  potenza massima [W]', vL.Xfatigue / 2.5 * omega(200), 3782.6, 0.002, 'Luigi scrive 3792.6 W con ω arrotondata a 21 rad/s');
    const vC = S.shaftCheck({ ...base, notch: { type: 'shoulder', Dd: 40 / 35, r: 2 } }, 35);
    rel('2006-09-21  Mt massimo con i diagrammi [N·m]', vC.Xfatigue / 2.5, 180.6, 0.07, 'Ke 1.81 dalla formula contro 1.72 letto a occhio: 170 N·m');
  }

  // ---- esame dell'11 gennaio 2010 (soluzione a mano di Luigi): ruota A Ø240 (x=20, mossa dal pignone motore in alto),
  // cuscinetto a sfere B x=117.5, pignone C Ø150 (x=290, linguetta ke=1.6), cuscinetto a rulli D x=342.5
  // σR=1250, σs=850, σLF=650, rettifica media, X=1.5, 210 giri/min. Diametro di A: 240 come nella soluzione (quota tagliata nella scansione)
  {
    const S = vm.runInContext('({ shaftBeam, shaftCheck, shaftKt, shaftQ, shaftB1, shaftB2 })', ctx);
    const beam10 = (FtA, FtC, Mt = 1) => S.shaftBeam({ xA: 117.5, xB: 342.5, Mt, elements: [
      { type: 'gear', x: 20, d: 240, FtDir: FtA, FrDir: '-V', torque: 'in' },
      { type: 'gear', x: 290, d: 150, FtDir: FtC, FrDir: '-H', torque: 'out' }] });
    const cw = beam10('+H', '+V'), ccw = beam10('-H', '-V');
    rel('2010-01-11  Mf in B, entrambi i versi [·Mt]', cw.at(117.5).Mf, 0.85, 0.02, 'Luigi arrotonda H=0.8 e V=0.3 (esatti 0.8125 e 0.2957)');
    rel('2010-01-11  Mf in C, senso orario [·Mt]', cw.at(290, -1).Mf, 0.7176, 0.002, 'Luigi scrive 0.68: Fc^C·CD·BC/BD vale 0.537, non 0.50');
    rel('2010-01-11  Mf in C, senso antiorario [·Mt]', ccw.at(290, -1).Mf, 0.4677, 0.002, 'Luigi scrive 0.43 (stesso errore)');
    abs('2010-01-11  diagramma Kt flessione D/d=1.2 r/d=0.03', S.shaftKt('bending', 0.03, 1.2), 2.4, 0.16, 'lettura a occhio 2.4; formula 2.25, diagramma ≈ 2.2');
    abs('2010-01-11  diagramma Kt flessione D/d=1.167 r/d=0.025', S.shaftKt('bending', 0.025, 70 / 60), 2.3, 0.05);
    abs('2010-01-11  diagramma q flessione r=1.5 σR=1250', S.shaftQ('bending', 1.5, 1250), 0.9, 0.01);
    abs('2010-01-11  diagramma b1 d=50', S.shaftB1(50), 0.77, 0.01);
    abs('2010-01-11  diagramma b2 rettifica media σR=1250', S.shaftB2('d', 1250), 0.86, 0.005);
    const mat = { sigmaR: 1250, sigmaS: 850, sigmaLF: 650, cycles: 0, finish: 'd' };
    const vL = S.shaftCheck({ ...mat, loads: { Mf: 0.68, bendingCycle: 'rotating', Mt: 1, torsionCycle: 'static', N: 0 },
      notch: { type: 'manual', ke: 2.26 * 1.6, keT: 1 }, b1Override: 0.77, b2Override: 0.86 }, 50);
    rel('2010-01-11  sezione C\': σa,eq [Pa per N·m] (valori di Luigi)', vL.sigmaAeq * 1e6, 200366, 0.001);
    rel('2010-01-11  Mt massimo (Mf e coefficienti di Luigi) [N·m]', vL.Xfatigue / 1.5, 1338, 0.002);
    const vT = S.shaftCheck({ ...mat, loads: { Mf: cw.at(290, -1).Mf, bendingCycle: 'rotating', Mt: 1, torsionCycle: 'static', N: 0 },
      notch: { type: 'combined', Dd: 1.2, r: 1.5, key: 'given', keyKe: 1.6 } }, 50);
    rel('2010-01-11  Mt massimo (Mf esatto, diagrammi) [N·m]', vT.Xfatigue / 1.5, 1338, 0.01, 'coincidenza: Mf −5.5 % e Ke +6.9 % di Luigi si compensano');
    rel('2010-01-11  potenza massima [kW]', 1338 * omega(210) / 1000, 29.43, 0.005);
    const b = beam10('+H', '+V', 1338);
    rel('2010-01-11  reazione cuscinetto B [N]', b.RA.R, 14450, 0.01);
    rel('2010-01-11  reazione cuscinetto D [N]', b.RB.R, 18197, 0.01);
    rel('2010-01-11  durata sfere B [10⁶ giri]', (108000 / b.RA.R) ** 3, 417, 0.03, 'Luigi usa R arrotondata 10.8·Mt');
    rel('2010-01-11  durata rulli D [10⁶ giri]', (112000 / b.RB.R) ** (10 / 3), 427, 0.02);
  }

  // ---------------------------------------------------------------------------
  // ALBERI — Appello del 9 gennaio 2015 (pp. 54-56), soluzione a mano di Luigi
  // Albero intermedio a sbalzo: ruota A Ø260 (x=20, entra Mt, ruota motrice sul lato +H),
  // ruota B Ø170 (x=77.5, esce Mt, condotta sul lato +V), cuscinetti C (x=124.5, 55x120x29) e D (x=330).
  // Senso di rotazione orario nella vista: Fr_A e Ft_B concordi, Ft_A e Fr_B concordi (come Luigi).
  // 160 rpm, σR=980, σs=800, σLF=550, rettifica media, r=1.5, X=1.5. Problema inverso: Mt max.
  // ---------------------------------------------------------------------------
  {
    const S = vm.runInContext('({ shaftBeam, shaftCheck, shaftNotchFactors, shaftB1, shaftB2, shaftBearingC })', ctx);
    const beam = Mt => S.shaftBeam({ xA: 124.5, xB: 330, Mt, theta: 20, elements: [
      { type: 'gear', x: 20, d: 260, FtDir: '-V', FrDir: '-H', torque: 'in' },
      { type: 'gear', x: 77.5, d: 170, FtDir: '-H', FrDir: '-V', torque: 'out' }] });
    const b1 = beam(1);   // per unit Mt
    rel('2015-01-09  trave: Ft ruota A [N per N·m]', b1.loads[0].Ft, 7.7, 0.002);
    rel('2015-01-09  trave: Fr ruota A [N per N·m]', b1.loads[0].Fr, 2.8, 0.001);
    rel('2015-01-09  trave: Ft ruota B [N per N·m]', b1.loads[1].Ft, 11.76, 0.001, 'a mano 11.7 (arrotondato)');
    rel('2015-01-09  trave: Mf in B, piano Ft_A [·Mt]', Math.abs(b1.at(77.5).Mv), 0.44, 0.01);
    rel('2015-01-09  trave: Mf in B, piano Fr_A [·Mt]', Math.abs(b1.at(77.5).Mh), 0.16, 0.01);
    rel('2015-01-09  trave: Mf risultante in B [·Mt]', b1.at(77.5).Mf, 0.47, 0.005);
    rel('2015-01-09  trave: Mf in C, piano Ft_A + Fr_B [·Mt]', Math.abs(b1.at(124.5).Mv), 1.0, 0.01);
    rel('2015-01-09  trave: Mf in C, piano Fr_A + Ft_B [·Mt]', Math.abs(b1.at(124.5).Mh), 0.84, 0.01);
    rel('2015-01-09  trave: Mf risultante in C [·Mt]', b1.at(124.5).Mf, 1.313, 0.002, 'a mano 1.3 (coefficienti arrotondati)');
    rel('2015-01-09  trave: sezione critica = cuscinetto C', b1.critical.x, 124.5, 1e-9);
    rel('2015-01-09  trave: torcente nullo fra B e C', Math.abs(b1.at(100).T) + 1, 1, 1e-9);
    // sezione C: d=55, D=60 (spallamento), r=1.5, solo flessione rotante
    const nC = S.shaftNotchFactors({ type: 'shoulder', Dd: 60 / 55, r: 1.5 }, 55, 980);
    abs('2015-01-09  diagramma Kt flessione D/d=1.09 r/d=0.027', nC.KtB, 2.2, 0.05);
    abs('2015-01-09  diagramma q flessione r=1.5 σR=980', nC.qB, 0.85, 0.01);
    abs('2015-01-09  diagramma b1 d=55', S.shaftB1(55), 0.75, 0.01);
    abs('2015-01-09  diagramma b2 rettifica media σR=980', S.shaftB2('d', 980), 0.87, 0.01);
    const base = { sigmaR: 980, sigmaS: 800, sigmaLF: 550, cycles: 0, finish: 'd' };
    const vL = S.shaftCheck({ ...base, loads: { Mf: 1300, bendingCycle: 'rotating', Mt: 0, torsionCycle: 'static', N: 0 },
      notch: { type: 'manual', ke: 2.02 }, b1Override: 0.75, b2Override: 0.87 }, 55);
    rel('2015-01-09  Mt max a vita infinita [N·m] (coefficienti di Luigi, Mf=1.3 Mt)', 1000 * vL.Xfatigue / 1.5, 1488, 0.002);
    const vC = S.shaftCheck({ ...base, loads: { Mf: 1000 * b1.at(124.5).Mf, bendingCycle: 'rotating', Mt: 0, torsionCycle: 'static', N: 0 },
      notch: { type: 'shoulder', Dd: 60 / 55, r: 1.5 } }, 55);
    rel('2015-01-09  Mt max a vita infinita [N·m] (diagrammi)', 1000 * vC.Xfatigue / 1.5, 1488, 0.02, 'tool 1466: Mf 1.313 invece di 1.3 e Ke 2.03 invece di 2.02');
    rel('2015-01-09  potenza massima [kW] (diagrammi)', 1000 * vC.Xfatigue / 1.5 * omega(160) / 1000, 24.9, 0.02);
    // reazioni a Mt = 1488 N·m e cuscinetti
    const b = beam(1488);
    rel('2015-01-09  reazione in C, piano Fr_A/Ft_B [N]', Math.abs(b.RA.H), 27676, 0.005);
    rel('2015-01-09  reazione in C, piano Ft_A/Fr_B [N]', Math.abs(b.RA.V), 25146, 0.003);
    rel('2015-01-09  reazione in C [N]', b.RA.R, 37393, 0.002);
    rel('2015-01-09  reazione in D, piano Ft_A/Fr_B [N]', Math.abs(b.RB.V), 7230, 0.01);
    rel('2015-01-09  reazione in D, piano Fr_A/Ft_B [N]', Math.abs(b.RB.H), 6122, 0.002, 'a mano 5951: errore aritmetico (con le sue forze 4166+17410 vale 6100)');
    rel('2015-01-09  reazione in D [N]', b.RB.R, 9510, 0.002, 'a mano "9410" (prima cifra incerta); dai suoi componenti 9364');
    const L = Math.pow(156000 / b.RA.R, 10 / 3);
    rel('2015-01-09  durata cuscinetto C (C=156 kN, rulli) [10⁶ giri]', L, 117, 0.01);
    rel('2015-01-09  cuscinetto D a sfere: C richiesto [kN]', S.shaftBearingC(b.RB.R, L, 'ball') / 1000, 46, 0.01);
    rel('2015-01-09  cuscinetto D a rulli: C richiesto [kN]', S.shaftBearingC(b.RB.R, L, 'roller') / 1000, 40, 0.015);
  }

  // ---------------------------------------------------------------------------
  // ALBERI — variante dell'Appello del 4 febbraio 2019 (pp. 59-63), soluzione a mano di Luigi
  // P=50 kW a 220 rpm entra dalla ruota C (Ø150, x=132.5, motrice sopra) ed esce metà per ruota
  // verso due utilizzatori: A (Ø60, x=20) ed E (Ø60, x=195), entrambi sul lato +H.
  // Cuscinetti scelti da Luigi: B (x=70) e D (x=163.75). σR=1080, σs=800, σLF=520, X=2, ke linguetta 1.4.
  // Le ruote A ed E trasmettono Mt/2: si usano elementi 'force' (le ruote del tool portano tutte lo stesso Mt).
  // ---------------------------------------------------------------------------
  {
    const S = vm.runInContext('({ shaftBeam, shaftCheck, shaftDesign, shaftNotchFactors, shaftB1, shaftB2, shaftDesignFixedCoefficients })', ctx);
    const Mt = 50000 / omega(220);
    rel('2019-02-04v  momento torcente [N·m]', Mt, 2170, 0.001);
    const t20 = Math.tan(20 * Math.PI / 180);
    const FtC = Mt * 1000 / 75, FtA = Mt / 2 * 1000 / 30;
    rel('2019-02-04v  Ft ruota C [N]', FtC, 28933, 0.001);
    rel('2019-02-04v  Fr ruota C [N]', FtC * t20, 10531, 0.001);
    rel('2019-02-04v  Ft ruote A, E [N]', FtA, 36167, 0.001);
    rel('2019-02-04v  Fr ruote A, E [N]', FtA * t20, 13163, 0.001);
    // versi fisici: Fr_A, Fr_E verso -H... (qui +H come Luigi), Ft_C opposta; Ft_A e Ft_E concordi, Fr_C opposta a esse
    const beam = sE => S.shaftBeam({ xA: 70, xB: 163.75, Mt, theta: 20, elements: [
      { type: 'force', x: 20, Fh: FtA * t20, Fv: FtA },
      { type: 'force', x: 132.5, Fh: -FtC, Fv: -FtC * t20 },
      { type: 'force', x: 195, Fh: FtA * t20, Fv: sE * FtA }] });
    const b = beam(+1);
    rel('2019-02-04v  Mf in B, piano orizzontale [N·m]', Math.abs(b.at(70).Mh), 658, 0.002);
    rel('2019-02-04v  Mf in B, piano verticale [N·m]', Math.abs(b.at(70).Mv), 1808, 0.002);
    rel('2019-02-04v  Mf risultante in B [N·m]', b.at(70).Mf, 1924, 0.002);
    rel('2019-02-04v  Mf in C, piano orizzontale [N·m]', Math.abs(b.at(132.5).Mh), 1096, 0.002);
    rel('2019-02-04v  Mf in C, piano verticale [N·m]', Math.abs(b.at(132.5).Mv), 1576, 0.002,
      'a mano 379 = 229 + 753 − 603: Ft_A presa con verso opposto a Ft_E nel diagramma (ma concorde nel calcolo delle reazioni)');
    rel('2019-02-04v  Mf risultante in C [N·m]', b.at(132.5).Mf, 1920, 0.002, 'a mano 1160 (vedi sopra)');
    rel('2019-02-04v  Mf in D, piano verticale [N·m]', Math.abs(b.at(163.75).Mv), 1130, 0.002);
    rel('2019-02-04v  Mf risultante in D [N·m]', b.at(163.75).Mf, 1202, 0.002);
    rel('2019-02-04v  reazione in B [N]', b.RA.R, 40361, 0.002, 'a mano etichettata R_D');
    rel('2019-02-04v  reazione in D [N]', b.RB.R, 23598, 0.002, 'a mano etichettata R_B e scritta 23538');
    rel('2019-02-04v  reazione in D, piano orizzontale [N]', Math.abs(b.RB.H), 8758, 0.001);
    rel('2019-02-04v  reazione in D, piano verticale [N]', Math.abs(b.RB.V), 21913, 0.001);
    // sezione B': spallamento cuscinetto, torcente Mt/2 statico
    const base = { sigmaR: 1080, sigmaS: 800, sigmaLF: 520, cycles: 0, finish: 'd' };
    const loads = Mf => ({ Mf, bendingCycle: 'rotating', Mt: Mt / 2, torsionCycle: 'static', N: 0 });
    const fx = S.shaftDesignFixedCoefficients({ Mf: 1924, Mt: Mt / 2, ke: 1.88, b1: 0.74, b2: 0.87, sigmaN: 520, sigmaR: 1080, X: 2 });
    rel("2019-02-04v  progetto B': d [mm] (coefficienti di Luigi)", fx.d, 61.3, 0.003);
    abs("2019-02-04v  diagramma Kt flessione D/d=1.167 r/d=0.033", S.shaftNotchFactors({ type: 'shoulder', Dd: 70 / 60, r: 2 }, 60, 1080).KtB, 2.0, 0.2,
      'tool 2.17; Luigi legge 2.0 (il docente nel 2003 legge 2.3 per D/d=1.17 r/d=0.03)');
    abs('2019-02-04v  diagramma q flessione r=2 σR=1080', S.shaftNotchFactors({ type: 'shoulder', Dd: 70 / 60, r: 2 }, 60, 1080).qB, 0.88, 0.01);
    abs('2019-02-04v  diagramma b2 rettifica media σR=1080', S.shaftB2('d', 1080), 0.87, 0.01);
    const d = S.shaftDesign({ ...base, loads: loads(1924), notch: { type: 'shoulder', Dd: 70 / 60, r: 2 } }, 2);
    rel("2019-02-04v  progetto B': d scelto [mm]", d.d, 65, 1e-9, 'tool dMin 63.5 (Ke 2.06) invece di 61.3 (Ke 1.88): stesso foro');
    const vL = S.shaftCheck({ ...base, loads: loads(1924), notch: { type: 'manual', ke: 1.88 }, b1Override: 0.73, b2Override: 0.87 }, 65);
    rel("2019-02-04v  verifica B' a d=65 [X fatica] (coefficienti di Luigi)", vL.Xfatigue, 2.35, 0.003);
    rel("2019-02-04v  verifica B' a d=65 [X snervamento]", vL.Xyield, 5.2, 0.005);
    const vC = S.shaftCheck({ ...base, loads: loads(1924), notch: { type: 'shoulder', Dd: 75.4 / 65, r: 2 } }, 65);
    rel("2019-02-04v  verifica B' a d=65, D=75.4 [X fatica] (diagrammi)", vC.Xfatigue, 2.13, 0.005, 'a mano 2.35 con Kt=2.0 letto a occhio (tool 2.21)');
    // sezione C' (D=75.4, spallamento D'/D=1.16 + linguetta ke=1.4) con il momento corretto
    const vK = S.shaftCheck({ ...base, loads: loads(1920), notch: { type: 'combined', Dd: 87.5 / 75.4, r: 2, key: 'given', keyKe: 1.4, keyKeT: 1.4 } }, 75.4);
    rel("2019-02-04v  verifica C' (Mf corretto 1920) [X fatica]", vK.Xfatigue, 2.27, 0.01, "con Mf=1920 C' resta meno critica di B': la scelta d=65 regge");
  }

  // ---------------------------------------------------------------------------
  // ALBERI — Appello del 18 gennaio 2023 (pp. 68-70), soluzione a mano di Luigi
  // Albero in pezzo unico: cuscinetti A (x=8) e B (x=120), ruota C Ø120 (x=150, entra Mt, ingrana sopra),
  // gola di scarico D (x=173, d=40, r=8), pignone E Ø52 a sbalzo (x=202, esce Mt, ingrana sotto).
  // σR=1200, σs=900, σLF=550, rettifica media, X1=2 per 300 h a 7.5 rpm (N1 = 135000 cicli).
  // ---------------------------------------------------------------------------
  {
    const S = vm.runInContext('({ shaftBeam, shaftCheck, shaftNotchFactors, shaftB1, shaftB2, shaftFatigueStrength })', ctx);
    const b = S.shaftBeam({ xA: 8, xB: 120, Mt: 1, theta: 20, elements: [
      { type: 'gear', x: 150, d: 120, FtDir: '-H', FrDir: '-V', torque: 'in' },
      { type: 'gear', x: 202, d: 52, FtDir: '-H', FrDir: '+V', torque: 'out' }] });
    rel('2023-01-18  Ft pignone E [N per N·m]', b.loads[1].Ft, 38.5, 0.002);
    rel('2023-01-18  Fr pignone E [N per N·m]', b.loads[1].Fr, 14.0, 0.001);
    rel('2023-01-18  Mf in D, piano Ft [·Mt]', Math.abs(b.at(173).Mh), 1.12, 0.005);
    rel('2023-01-18  Mf in D, piano Fr [·Mt]', Math.abs(b.at(173).Mv), 0.41, 0.01);
    rel('2023-01-18  Mf risultante in D [·Mt]', b.at(173).Mf, 1.187, 0.002, 'a mano 1.2 (arrotondato)');
    rel('2023-01-18  torcente nella gola [·Mt]', Math.abs(b.at(173).T), 1, 1e-9);
    const fs = S.shaftFatigueStrength(1200, 550, 7.5 * 60 * 300);
    rel('2023-01-18  esponente di Wöhler m', fs.m, 8.85, 0.002);
    rel('2023-01-18  σN a 135000 cicli [MPa]', fs.sigmaN, 689.4, 0.001);
    abs('2023-01-18  diagramma b1 d=40', S.shaftB1(40), 0.79, 0.005);
    abs('2023-01-18  diagramma b2 rettifica media σR=1200', S.shaftB2('d', 1200), 0.86, 0.005);
    const nf = S.shaftNotchFactors({ type: 'shoulder', Dd: 3, r: 8 }, 40, 1200);
    abs('2023-01-18  diagramma Kt flessione D/d=3 r/d=0.2', nf.KtB, 1.43, 0.05);
    abs('2023-01-18  diagramma q flessione r=8 σR=1200', nf.qB, 0.93, 0.02, 'r=8 fuori diagramma: Luigi usa la curva a r=5, il tool estrapola Neuber (0.948)');
    const base = { sigmaR: 1200, sigmaS: 900, sigmaLF: 550, finish: 'd' };
    const chk = (Mf, Mt, notch, cycles, ov = {}) => S.shaftCheck({ ...base, loads: { Mf, bendingCycle: 'rotating', Mt, torsionCycle: 'static', N: 0 }, cycles, notch, ...ov }, 40);
    const lu = { b1Override: 0.79, b2Override: 0.86 }, keL = { type: 'manual', ke: 1.4 };
    rel('2023-01-18  Mt max (X1=2, 135000 cicli) [N·m] (coefficienti di Luigi)', 1000 * chk(1200, 1000, keL, 135000, lu).Xfatigue / 2, 784.7, 0.002);
    const MtC = 1000 * chk(1000 * b.at(173).Mf, 1000, { type: 'shoulder', Dd: 3, r: 8 }, 135000).Xfatigue / 2;
    rel('2023-01-18  Mt max (X1=2) [N·m] (diagrammi, D/d=3)', MtC, 784.7, 0.02, 'tool 771: Ke 1.44 (q 0.948, Kt 1.47) invece di 1.40');
    rel('2023-01-18  potenza massima W1 [W] (coefficienti di Luigi)', 1000 * chk(1200, 1000, keL, 135000, lu).Xfatigue / 2 * omega(7.5), 616.3, 0.003);
    // fase 2: stesso carico, X2=1.8 -> N2; fase 3: carico -5%, X3=1.8 -> N3 (verifica diretta: X deve tornare 1.8)
    const Mt1 = 784.7;
    rel('2023-01-18  X a N2=376240 cicli, carico iniziale', chk(1.2 * Mt1, Mt1, keL, 376240, lu).Xfatigue, 1.8, 0.003, 'N2 esatto 381000: Luigi arrotonda σa,eq=210');
    rel('2023-01-18  X a N3=607766 cicli, carico −5%', chk(1.2 * 0.95 * Mt1, 0.95 * Mt1, keL, 607766, lu).Xfatigue, 1.8, 0.005, 'N3 esatto 628000: arrotondamenti amplificati da m=8.85');
  }

  // quota di coppia per elemento (share) e ruote folli: gli stessi esami senza ricorrere alle forze generiche
  {
    const Q = vm.runInContext('({ shaftBeam })', ctx);
    const Mt19 = 50000 / omega(220);
    const b19 = Q.shaftBeam({ xA: 70, xB: 163.75, Mt: Mt19, theta: 20, elements: [
      { type: 'gear', x: 20, d: 60, FtDir: '+V', FrDir: '+H', torque: 'out', share: 0.5 },
      { type: 'gear', x: 132.5, d: 150, FtDir: '-H', FrDir: '-V', torque: 'in' },
      { type: 'gear', x: 195, d: 60, FtDir: '+V', FrDir: '+H', torque: 'out', share: 0.5 }] });
    rel('2019-02-04v  ruote con quota 50 %: Ft ruota A [N]', b19.loads[0].Ft, 36167, 0.001);
    rel('2019-02-04v  ruote con quota 50 %: Mf in B [N·m]', b19.at(70).Mf, 1924, 0.002);
    rel('2019-02-04v  ruote con quota 50 %: Mf in C [N·m]', b19.at(132.5).Mf, 1920, 0.002);
    rel('2019-02-04v  ruote con quota 50 %: Mf in D [N·m]', b19.at(163.75).Mf, 1202, 0.002);
    rel('2019-02-04v  torcente tra A e C = −Mt/2 [N·m]', b19.at(100).T, -Mt19 / 2, 1e-9);
    rel('2019-02-04v  torcente tra C ed E = +Mt/2 [N·m]', b19.at(150).T, Mt19 / 2, 1e-9);
    abs('2019-02-04v  torcente oltre E = 0 [N·m]', b19.at(200).T, 0, 1e-9);
    const b04 = Q.shaftBeam({ xA: 90, xB: 340, L: 430, Mt: 800, elements: [
      { type: 'gear', x: 15, d: 120, FtDir: '+V', FrDir: '+H', torque: 'out' },
      { type: 'gear', x: 180, d: 300, FtDir: '+V', FrDir: '-H', torque: 'in', share: 2 },
      { type: 'gear', x: 415, d: 120, FtDir: '-V', FrDir: '-H', torque: 'out' }] });
    rel('2004-09-20  caso III con quota 200 % sulla ruota C: Mf in C [N·m]', b04.at(180).Mf, 466.7, 0.002);
    rel('2004-09-20  caso III: torcente tra C ed E = +800 N·m', b04.at(300).T, 800, 1e-9);
    const idl = Q.shaftBeam({ xA: 0, xB: 100, Mt: 100, elements: [{ type: 'gear', x: 50, d: 100, FtDir: '+V', FrDir: '+H', torque: 'none' }] });
    rel('ruota folle: Ft dalla coppia della ruota [N]', idl.loads[0].Ft, 2000, 1e-9);
    abs('ruota folle: nessuna torsione nell\'albero [N·m]', idl.at(50, 1).T, 0, 1e-12);
  }

  // durata dei cuscinetti con il C di catalogo (11/1/2010: sfere 108 kN in B, rulli 112 kN in D, Mt = 1338 N·m, 210 giri/min)
  {
    const Q = vm.runInContext('({ shaftBeam, shaftBearingLife })', ctx);
    const b = Q.shaftBeam({ xA: 117.5, xB: 342.5, Mt: 1338, elements: [
      { type: 'gear', x: 20, d: 240, FtDir: '+H', FrDir: '-V', torque: 'in' },
      { type: 'gear', x: 290, d: 150, FtDir: '+V', FrDir: '-H', torque: 'out' }] });
    const lB = Q.shaftBearingLife(108000, b.RA.R, 'ball', 210), lD = Q.shaftBearingLife(112000, b.RB.R, 'roller', 210);
    rel('2010-01-11  shaftBearingLife: sfere B [10⁶ giri]', lB.L, 417, 0.03, 'Luigi usa R arrotondata 10.8·Mt');
    rel('2010-01-11  shaftBearingLife: rulli D [10⁶ giri]', lD.L, 427, 0.02);
    rel('2010-01-11  shaftBearingLife: rulli D [h]', lD.hours, 33900, 0.02, 'Luigi scrive 33 000 h: 427·10⁶/(60·210) = 33 900');
  }

  // vita a fatica con X richiesto (shaftLifeAtX) e danno cumulato di Miner (shaftMinerDamage): 13/1/2006, parte (b)
  // l'albero lavora 150 h (270 000 cicli), poi viene girato: la sezione C passa dal carico minore (MC) a quello maggiore (MB)
  {
    const S = vm.runInContext('({ shaftBeam, shaftCheck, shaftLifeAtX, shaftMinerDamage })', ctx);
    const b = S.shaftBeam({ xA: 0, xB: 208, Mt: 135 / 80, theta: 20, elements: [
      { type: 'gear', x: 47, d: 135, FtDir: '-V', FrDir: '-H', torque: 'in' },
      { type: 'gear', x: 161, d: 145, FtDir: '+H', FrDir: '+V', torque: 'out' }] });
    const MB = b.at(47, 1), MC = b.at(161, -1);
    const notch = { type: 'combined', Dd: 1.25, r: 2, key: 'sled', condition: 'annealed' };
    const mk = (Mf, Mt) => ({ loads: { Mf, bendingCycle: 'rotating', Mt, torsionCycle: 'static', N: 0 },
      sigmaR: 1180, sigmaS: 940, sigmaLF: 450, cycles: 450000, finish: 'd', notch });
    const Mm = S.shaftCheck(mk(MB.Mf, MB.T), 32).Xfatigue / 1.75;                 // coppia motrice massima (parte a)
    const full = mk(MB.Mf * Mm, MB.T * Mm);
    rel('2006-01-13  shaftLifeAtX: sezione più sollecitata alla coppia massima [cicli]', S.shaftLifeAtX(full, 32, 1.75).N, 450000, 1e-6);
    const lo = S.shaftLifeAtX(mk(MC.Mf * Mm, MC.T * Mm), 32, 1.75);
    rel('2006-01-13  shaftLifeAtX: σN richiesta sezione meno sollecitata [MPa]', lo.sigmaNreq, 458.8, 0.003);
    rel('2006-01-13  shaftLifeAtX: vita sezione meno sollecitata [cicli]', lo.N, 870350, 0.005);
    const mi = S.shaftMinerDamage(full, 32, 1.75, [{ Mf: MC.Mf * Mm, Mt: MC.T * Mm, cycles: 270000 }]);
    const mp = S.shaftMinerDamage(full, 32, 1.75, [{ factor: 0.5, cycles: 1e5 }]);
    abs('Miner: una fase sotto il limite di fatica non fa danno', mp.D, 0, 0);
    rel('2006-01-13  Miner: danno della prima fase sulla sezione C', mi.D, 0.31, 0.005);
    rel('2006-01-13  Miner: durata residua dopo l\'inversione [h]', mi.remaining / 1800, 172.5, 0.005);
    const inf = S.shaftLifeAtX(mk(MB.Mf * Mm * 0.5, MB.T * Mm * 0.5), 32, 1.75);
    abs('vita con X richiesto: a metà carico la vita è infinita', inf.infinite ? 1 : 0, 1, 0);
  }

  // versi delle forze dalla posizione della ruota coniugata e dal senso di rotazione (dirMode 'mesh')
  {
    const Q = vm.runInContext('({ shaftBeam })', ctx);
    const Mt03 = 30000 / omega(200);
    const man = Q.shaftBeam({ xA: 0, xB: 240, Mt: Mt03, theta: 20, elements: [
      { type: 'gear', x: 67.5, d: 210, FtDir: '-H', FrDir: '+V', torque: 'in' },
      { type: 'gear', x: 305, d: 105, FtDir: '-H', FrDir: '-V', torque: 'out' }] });
    const mesh = Q.shaftBeam({ xA: 0, xB: 240, Mt: Mt03, theta: 20, rotation: 'ccw', elements: [
      { type: 'gear', x: 67.5, d: 210, dirMode: 'mesh', meshAngle: 180, torque: 'in' },     // ruota coniugata sotto
      { type: 'gear', x: 305, d: 105, dirMode: 'mesh', meshAngle: 0, torque: 'out' }] });   // ruota coniugata sopra
    rel('2003-04-11  versi da ingranamento (antiorario visto da B): Mf in C come i versi manuali', mesh.at(240).Mf, man.at(240).Mf, 1e-12);
    rel('2003-04-11  versi da ingranamento: reazione in A come i versi manuali', mesh.RA.R, man.RA.R, 1e-12);
    // ruota di rinvio del 21/9/2006: due ingranamenti sulla stessa ruota a ±45°, motrice (coppia entrante) e condotta (uscente)
    const idler = rot => Q.shaftBeam({ xA: 70, xB: 180, L: 200, Mt: 1, theta: 20, rotation: rot, elements: [
      { type: 'gear', x: 12, d: 130, dirMode: 'mesh', meshAngle: 45, torque: 'in' },
      { type: 'gear', x: 12, d: 130, dirMode: 'mesh', meshAngle: -45, torque: 'out' }] });
    rel('2006-09-21  rinvio a ±45° con gli angoli: Mf sul cuscinetto, verso sfavorevole [·Mt]', idler('ccw').at(70).Mf, 1.72, 0.002);
    rel('2006-09-21  rinvio a ±45° con gli angoli: Mf sul cuscinetto, verso favorevole [·Mt]', idler('cw').at(70).Mf, 0.8, 0.01);
    abs('2006-09-21  rinvio con gli angoli: nessuna torsione nell\'albero', idler('ccw').at(40).T, 0, 1e-12);
  }

  // sezione critica sulle sezioni reali (shaftSectionsCheck): 18/1/2023, la gola di scarico D (Ø40, r=8) è più critica
  // della sede del cuscinetto B (Ø70), anche se in B il momento flettente è più alto
  {
    const Q = vm.runInContext('({ shaftBeam, shaftSectionsCheck })', ctx);
    const b = Q.shaftBeam({ xA: 8, xB: 120, L: 222, Mt: 784.7, theta: 20, elements: [
      { type: 'gear', x: 150, d: 120, FtDir: '-H', FrDir: '-V', torque: 'in' },
      { type: 'gear', x: 202, d: 52, FtDir: '-H', FrDir: '+V', torque: 'out' }] });
    const mat = { sigmaR: 1200, sigmaS: 900, sigmaLF: 550, cycles: 135000, finish: 'd' };
    const sc = Q.shaftSectionsCheck(b, [{ x: 120, d: 70 }, { x: 173, d: 40, D: 120, r: 8 }], mat);
    abs('2023-01-18  trave: Mf massimo sul cuscinetto B', b.critical.x, 120, 1e-9);
    abs('2023-01-18  sezioni reali: la più critica è la gola D (x = 173)', sc.worst.x, 173, 1e-9);
    rel('2023-01-18  sezioni reali: X nella gola alla coppia massima della soluzione', sc.worst.check.Xfatigue, 2.0, 0.02, 'Ke dai diagrammi 1.44 invece di 1.40');
    abs('2023-01-18  sezioni reali: la sede del cuscinetto B ha X molto più alto', sc.rows[0].X > 2 * sc.worst.X ? 1 : 0, 1, 0);
  }

  // regola di Manson (doppia lineare, N_II = 14·N^0.6) con le vite della soluzione del 18/1/2023, e von Mises statico del 7/1/2005
  {
    const Q = vm.runInContext('({ shaftMansonFromLives, shaftStaticVonMises })', ctx);
    const m = Q.shaftMansonFromLives([{ n: 135000, N: 376240 }, { n: 120620, N: 376240 }], 607766);
    rel('2023-01-18  Manson: danno di nucleazione delle prime due fasi', m.DI, 0.74, 0.01, 'Luigi: 0.39 + 0.35');
    rel('2023-01-18  Manson: vita residua nella terza fase [cicli]', m.remaining, 188611, 0.005, 'Luigi 182946: usa 0.25 invece di 1 − 0.74 = 0.26 (566426·0.26 + 41340)');
    rel('2023-01-18  Manson: vita residua [h] a 7.5 giri/min', m.remaining / 450, 419.1, 0.005, 'Luigi 406.5 h, stessa svista');
    abs('Manson: senza fasi precedenti la vita residua è la vita intera', Q.shaftMansonFromLives([], 1e5).remaining, 1e5, 1e-6);
    // 7/1/2005: albero fermo, sezione C d = 15, Mf = 0.02·P, Mt = 0.04·P, σs = 910, X = 1.5 -> P max con von Mises = 5025 N
    const vmC = Q.shaftStaticVonMises({ loads: { Mf: 20, bendingCycle: 'static', Mt: 40, torsionCycle: 'static', N: 0 }, sigmaS: 910 }, 15);
    rel('2005-01-07  von Mises statico: P max [N] (Luigi 5025)', 1000 * vmC.X / 1.5, 5025, 0.002);
  }

  // carico massimo a d assegnato (shaftMaxLoad): stesso risultato del ridimensionamento X ∝ 1/carico usato negli esami
  {
    const M = vm.runInContext('({ shaftMaxLoad, shaftCheck })', ctx);
    const inp = { loads: { Mf: 1.72, bendingCycle: 'rotating', Mt: 0, torsionCycle: 'static', N: 0 }, sigmaR: 1180, sigmaS: 940, sigmaLF: 450,
      cycles: 0, finish: 'd', notch: { type: 'manual', ke: 1.72, keT: 1 }, b1Override: 0.82, b2Override: 0.86 };
    const ml = M.shaftMaxLoad(inp, 35, 2.5);
    rel('2006-09-21  shaftMaxLoad: Mt massimo della ruota di rinvio [N·m]', ml.lambda, 180.6, 0.002);
    const back = M.shaftCheck({ ...inp, loads: { ...inp.loads, Mf: ml.Mf } }, 35);
    rel('carico massimo: con i carichi scalati X = X richiesto', back.Xfatigue, 2.5, 1e-9);
    const inp10 = { loads: { Mf: 0.68 * 1000, bendingCycle: 'rotating', Mt: 1000, torsionCycle: 'static', N: 0 }, sigmaR: 1250, sigmaS: 850, sigmaLF: 650,
      cycles: 0, finish: 'd', notch: { type: 'manual', ke: 2.26 * 1.6, keT: 1 }, b1Override: 0.77, b2Override: 0.86 };
    rel('2010-01-11  shaftMaxLoad: Mt massimo partendo da 1000 N·m [N·m]', M.shaftMaxLoad(inp10, 50, 1.5).Mt, 1338, 0.002);
  }

  // Wöhler: estremi della retta
  rel('Wöhler: σN a 10³ cicli = σR', S.shaftFatigueStrength(1080, 520, 1e3).sigmaN, 1080, 1e-9);
  rel('Wöhler: σN a 10⁶ cicli = σLF', S.shaftFatigueStrength(1080, 520, 1e6 - 1).sigmaN, 520, 1e-4);
}


// ---------------------------------------------------------------------------
// Strutture (FEM 2D telaio/traliccio): soluzioni chiuse di Scienza delle Costruzioni,
// torre radio del notebook di Luigi (Ottimizzazione_peso_corretto.ipynb), profilati da catalogo
// ---------------------------------------------------------------------------
{
  const F = vm.runInContext('({ frameAnalyze, frameMemberSummary, frSecI, frSecBox, frameFSDContinuous, frameSize, frameCatalog })', ctx);
  const E = 210000, I = 1e7, A = 1e4, L = 4000, q = -10, P = { E, A, I };
  const beam = (supports, extra = {}) => ({ nodes: [{ x: 0, y: 0 }, { x: L, y: 0 }], members: [{ n1: 0, n2: 1 }], supports, loads: [], dloads: [{ member: 0, q, dir: 'gy' }], ...extra });
  let m = beam([{ node: 0, type: 'pin' }, { node: 1, type: 'rollerX' }]);
  let an = F.frameAnalyze(m, [P]), s = F.frameMemberSummary(an.members[0], m);
  rel('FEM trave appoggiata, q: M max = qL²/8 [N·mm]', s.Mabs, 10 * L * L / 8, 1e-9);
  rel('FEM trave appoggiata, q: freccia = 5qL⁴/384EI [mm]', s.dmax, 5 * 10 * L ** 4 / (384 * E * I), 1e-9);
  m = beam([{ node: 0, type: 'fixed' }, { node: 1, type: 'fixed' }]);
  an = F.frameAnalyze(m, [P]); s = F.frameMemberSummary(an.members[0], m);
  rel('FEM trave incastrata, q: M incastro = qL²/12', an.reactions[0].M, 10 * L * L / 12, 1e-9);
  rel('FEM trave incastrata, q: freccia = qL⁴/384EI', s.dmax, 10 * L ** 4 / (384 * E * I), 1e-9);
  m = beam([{ node: 0, type: 'fixed' }, { node: 1, type: 'rollerX' }]);
  an = F.frameAnalyze(m, [P]);
  rel('FEM incastro-appoggio, q: reazione appoggio = 3qL/8', an.reactions[1].Ry, 3 * 10 * L / 8, 1e-9);
  m = { nodes: [0, 1, 2].map(k => ({ x: k * L, y: 0 })), members: [{ n1: 0, n2: 1 }, { n1: 1, n2: 2 }],
    supports: [{ node: 0, type: 'pin' }, { node: 1, type: 'rollerX' }, { node: 2, type: 'rollerX' }], loads: [], dloads: [{ member: 0, q, dir: 'gy' }, { member: 1, q, dir: 'gy' }] };
  an = F.frameAnalyze(m, [P, P]);
  rel('FEM trave continua 2 campate: reazione centrale = 5qL/4', an.reactions[1].Ry, 1.25 * 10 * L, 1e-9);
  m = { nodes: [{ x: 0, y: 0 }, { x: L, y: 0 }], members: [{ n1: 0, n2: 1 }], supports: [{ node: 0, type: 'fixed' }], loads: [{ node: 1, Fy: -1000 }], dloads: [] };
  an = F.frameAnalyze(m, [P]);
  rel('FEM mensola, P in punta: freccia = PL³/3EI', -an.u[4], 1000 * L ** 3 / (3 * E * I), 1e-9);
  m = { nodes: [{ x: 0, y: 0 }, { x: 2000, y: 0 }, { x: 5000, y: 0 }], members: [{ n1: 0, n2: 1, relEnd: true }, { n1: 1, n2: 2 }],
    supports: [{ node: 0, type: 'fixed' }, { node: 2, type: 'rollerX' }], loads: [], dloads: [{ member: 1, q: -10, dir: 'gy' }] };
  an = F.frameAnalyze(m, [P, P]);
  rel('FEM trave Gerber (cerniera interna): M incastro = R·a', an.reactions[0].M, 15000 * 2000, 1e-9);
  // portale incastrato con forza orizzontale in sommità, ritti e traverso uguali: M base = 2/7·F·h... verifica di equilibrio globale
  m = { nodes: [{ x: 0, y: 0 }, { x: 0, y: 3000 }, { x: 4000, y: 3000 }, { x: 4000, y: 0 }], members: [{ n1: 0, n2: 1 }, { n1: 1, n2: 2 }, { n1: 2, n2: 3 }],
    supports: [{ node: 0, type: 'fixed' }, { node: 3, type: 'fixed' }], loads: [{ node: 1, Fx: 10000 }], dloads: [] };
  an = F.frameAnalyze(m, [P, P, P]);
  const R = an.reactions;
  abs('FEM portale: equilibrio orizzontale ΣRx + F = 0 [N]', R[0].Rx + R[1].Rx + 10000, 0, 1e-6);
  abs('FEM portale: equilibrio alla rotazione attorno alla base sx [N·mm]', R[0].M + R[1].M + R[1].Ry * 4000 - 10000 * 3000, 0, 1e-3);
  // torre radio del notebook: alluminio E = 70 GPa, aste incernierate di 40 cm², vento 4 × 60 kN
  const nodes = [[0, 0], [5, 0], [0.5, 5], [4.5, 5], [1, 10], [4, 10], [1.5, 15], [3.5, 15], [2, 20], [3, 20]].map(([x, y]) => ({ x: x * 1000, y: y * 1000 }));
  const els = [[0, 2], [2, 3], [2, 4], [4, 5], [4, 6], [6, 7], [6, 8], [8, 9], [1, 3], [3, 5], [5, 7], [7, 9], [0, 3], [2, 5], [4, 7], [6, 9], [2, 1], [4, 3], [6, 5], [8, 7]];
  const tower = { nodes, members: els.map(([a, b]) => ({ n1: a, n2: b, relStart: true, relEnd: true })), supports: [{ node: 0, type: 'pin' }, { node: 1, type: 'pin' }],
    loads: [2, 4, 6, 8].map(n => ({ node: n, Fx: 60000 })), dloads: [] };
  an = F.frameAnalyze(tower, els.map(() => ({ E: 70000, A: 4000, I: 4000 ** 2 / (4 * Math.PI) })));
  rel('Torre radio (notebook): σ max iniziale con 40 cm² [MPa]', Math.max(...an.members.map(mr => Math.abs(mr.f[0]) / 4000)), 132.62, 1e-4);
  const fsd = F.frameFSDContinuous(tower, { E: 70000, rho: 2770, sigmaAllow: 170, Amin: 500, Amax: 22600, Ainit: 4000, eta: 0.5, maxIter: 60, tol: 1e-4 });
  rel('Torre radio (notebook): peso iniziale [kg]', fsd.history[0].W, 1080.08, 1e-5);
  rel('Torre radio (notebook): peso FSD [kg]', fsd.W, 284.96, 1e-4);
  abs('Torre radio (notebook): iterazioni FSD', fsd.iterations, 27, 0);
  rel('Torre radio (notebook): area FSD asta 0 [cm²]', fsd.A[0] / 100, 31.89, 1e-3);
  // FSD con instabilità come nel metodo col gradiente del notebook (tondo pieno, |σ| ≤ 0,8·σcr): ogni asta verificata,
  // massa vicina ai 1453,6 kg del gradiente (che lasciava 7 aste di poco oltre il margine 0,8)
  const fsdB = F.frameFSDContinuous(tower, { E: 70000, rho: 2770, sigmaAllow: 170, Amin: 500, Amax: 22600, Ainit: 4000, eta: 0.5, maxIter: 120, tol: 1e-4, buckling: 0.8 });
  abs('Torre radio, FSD con instabilità: max |σ|/(0,8·σcr) delle aste compresse', Math.max(...fsdB.sigma.map((sg, i) => sg < 0 ? -sg / (0.8 * fsdB.sigCr[i]) : 0)), 1, 2e-3);
  rel('Torre radio, FSD con instabilità vs gradiente del notebook (1453,6 kg) [kg]', fsdB.W, 1453.59, 0.015, 'il gradiente viola di poco il margine 0,8');
  // profilati: proprietà dalla geometria nominale (raccordi inclusi) contro i valori di catalogo
  const ipe200 = F.frSecI('IPE', 'IPE 200', 200, 100, 5.6, 8.5, 12), ipe300 = F.frSecI('IPE', 'IPE 300', 300, 150, 7.1, 10.7, 15), hea200 = F.frSecI('HEA', 'HEA 200', 190, 200, 6.5, 10, 18);
  rel('IPE 200: A = 28,5 cm²', ipe200.A / 100, 28.5, 0.003); rel('IPE 200: Iy = 1943 cm⁴', ipe200.Iy / 1e4, 1943, 0.003); rel('IPE 200: Iz = 142 cm⁴', ipe200.Iz / 1e4, 142, 0.005);
  rel('IPE 300: Iy = 8356 cm⁴', ipe300.Iy / 1e4, 8356, 0.003); rel('IPE 300: Wy = 557 cm³', ipe300.Wy / 1e3, 557, 0.003);
  rel('HEA 200: A = 53,8 cm²', hea200.A / 100, 53.8, 0.003); rel('HEA 200: Iy = 3692 cm⁴', hea200.Iy / 1e4, 3692, 0.003); rel('HEA 200: Iz = 1336 cm⁴', hea200.Iz / 1e4, 1336, 0.003);
  // dimensionamento a catalogo della torre con l'instabilità: ogni asta verificata
  const mat = { E: 70000, rho: 2770, sigmaS: 255, X: 1.5, Xb: 2, beta: 1, deflMax: 0 };
  const tube = F.frameSize(tower, 'tube', mat);
  abs('Torre radio, tubi a catalogo: tutte le aste verificate (resistenza e Eulero)', tube.ok && tube.ev.rows.every(r => r.chk.Xs >= 1.5 - 1e-9 && r.chk.Xb >= 2 - 1e-9) ? 1 : 0, 1, 0);
}

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
