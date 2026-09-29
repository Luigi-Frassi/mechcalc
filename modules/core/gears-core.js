/**
 * gears-core.js - ISO Cylindrical Gear Synthesis & Rating Engine (Hertz & Lewis)
 * Pure mathematical calculations: Headless, zero DOM dependencies.
 */

const STANDARD_MODULES = [
  { m: 1.0, cat: 'green', serie: 1 },
  { m: 1.125, cat: 'orange', serie: 2 },
  { m: 1.25, cat: 'green', serie: 1 },
  { m: 1.375, cat: 'orange', serie: 2 },
  { m: 1.5, cat: 'green', serie: 1 },
  { m: 1.75, cat: 'orange', serie: 2 },
  { m: 2.0, cat: 'green', serie: 1 },
  { m: 2.25, cat: 'orange', serie: 2 },
  { m: 2.5, cat: 'green', serie: 1 },
  { m: 2.75, cat: 'orange', serie: 2 },
  { m: 3.0, cat: 'green', serie: 1 },
  { m: 3.25, cat: 'red', serie: 3 },
  { m: 3.5, cat: 'orange', serie: 2 },
  { m: 3.75, cat: 'red', serie: 3 },
  { m: 4.0, cat: 'green', serie: 1 },
  { m: 4.5, cat: 'orange', serie: 2 },
  { m: 5.0, cat: 'green', serie: 1 },
  { m: 5.5, cat: 'orange', serie: 2 },
  { m: 6.0, cat: 'green', serie: 1 },
  { m: 6.5, cat: 'red', serie: 3 },
  { m: 7.0, cat: 'orange', serie: 2 },
  { m: 8.0, cat: 'green', serie: 1 },
  { m: 9.0, cat: 'orange', serie: 2 },
  { m: 10.0, cat: 'green', serie: 1 },
  { m: 11.0, cat: 'orange', serie: 2 },
  { m: 12.0, cat: 'green', serie: 1 },
  { m: 14.0, cat: 'orange', serie: 2 },
  { m: 16.0, cat: 'green', serie: 1 },
  { m: 18.0, cat: 'orange', serie: 2 },
  { m: 20.0, cat: 'green', serie: 1 }
];

function getLewisFactor(z, xr = 0) {
  const zClamped = Math.max(z, 9);
  const yBase = 0.4715 - (2.84 / zClamped);
  return Math.max(0.20, yBase + 0.25 * xr);
}

function getHelicalFactors(alphaDeg, z1, z2) {
  const a = Math.max(0, Math.min(45, alphaDeg));
  const Phi = 1.0 - 0.0139 * a - 0.000014 * Math.pow(a, 2);
  const Psi = 1.0 + 0.000089 * Math.pow(a, 2);

  const g0_1 = 1.05 - (1.2 / Math.sqrt(Math.max(z1, 9)));
  const g0_2 = 1.05 - (1.2 / Math.sqrt(Math.max(z2, 9)));
  const decay = 1.0 - 0.006 * a - 0.00015 * Math.pow(a, 2);

  const Gamma_T1 = Math.max(0.15, g0_1 * decay);
  const Gamma_T2 = Math.max(0.15, g0_2 * decay);
  const Gamma_T = Gamma_T1 + Gamma_T2;

  return { Phi, Psi, Gamma_T1, Gamma_T2, Gamma_T };
}

function calculateWmax({
  toothType = 'spur',
  m_input = 5.0,
  L_mm = 60.0,
  z1 = 23,
  z2 = 39,
  n1 = 650.0,
  alphaDeg = 0.0,
  Ke_GPa = 35.0,
  sigmaH_lim = 721.52,
  sigmaL_lim = 400.0,
  xr1 = 0.0
}) {
  const omega1 = (2 * Math.PI * n1) / 60.0;
  const theta = (20.0 * Math.PI) / 180.0;
  const tau = z1 / z2;
  const Ke_N_mm2 = Ke_GPa * 1000.0;

  let mt = m_input;
  let mn = m_input;
  let factors = { Phi: 1, Psi: 1, Gamma_T1: 1, Gamma_T2: 1, Gamma_T: 2 };
  let yLewis = 0.32;

  if (toothType === 'spur') {
    mt = m_input;
    mn = m_input;
    yLewis = getLewisFactor(z1, xr1);
  } else {
    mn = m_input;
    const cosA = Math.cos((alphaDeg * Math.PI) / 180.0);
    mt = mn / cosA;
    const z_eq = z1 / Math.pow(cosA, 3);
    yLewis = getLewisFactor(z_eq, xr1);
    factors = getHelicalFactors(alphaDeg, z1, z2);
  }

  const factorHelHertz = (toothType === 'helical') ? (factors.Gamma_T / factors.Phi) : 1.0;
  const W_N_mm_s_H = (Math.pow(sigmaH_lim, 2) * L_mm * omega1 * Math.sin(2 * theta) * Math.pow(mt, 2) * Math.pow(z1, 2) * factorHelHertz) / (8 * Ke_N_mm2 * (1.0 + tau));
  const P_kW_H = W_N_mm_s_H / 1e6;

  const factorHelLewis = (toothType === 'helical') ? (factors.Gamma_T / factors.Psi) : 1.0;
  const W_N_mm_s_L = (sigmaL_lim * omega1 * L_mm * mt * mn * z1 * yLewis * factorHelLewis) / 2.0;
  const P_kW_L = W_N_mm_s_L / 1e6;

  const P_kW_max = Math.min(P_kW_H, P_kW_L);
  const W_watt_max = P_kW_max * 1000.0;
  const M1_max = W_watt_max / Math.max(omega1, 0.001);

  const dp1 = mt * z1;
  const dp2 = mt * z2;
  const a_center = mt * ((z1 + z2) / 2.0 + xr1);
  const Fc_max = (2 * M1_max * 1000.0) / dp1;

  return {
    P_kW_max,
    P_kW_H,
    P_kW_L,
    isHertzLimited: P_kW_H <= P_kW_L,
    M1_max,
    dp1,
    dp2,
    a_center,
    Fc_max,
    yLewis,
    phiRatio: L_mm / dp1
  };
}

function findOptimalCombos({
  targetTau = 0.5,
  tolPct = 3.0,
  targetI = 100.0,
  z_min = 17,
  isLockM = false,
  lockedMVal = 2.5,
  isLockL = false,
  lockedLVal = 30.0,
  gearType = 'spur',
  geomMode = 'tau',
  xr1 = 0.0,
  W_N_mm_s = 5500000,
  M1_Nm = 36.2,
  omega1 = 151.8,
  Ke_N_mm2 = 35000,
  sigmaH_lim = 550.0,
  theta = (20.0 * Math.PI) / 180.0
}) {
  let tauNorm = targetTau > 1.0 ? 1.0 / targetTau : targetTau;
  const moduleScanList = isLockM ? [lockedMVal] : STANDARD_MODULES.map(item => item.m);
  const combos = [];

  for (let curZ1 = z_min; curZ1 <= 50; curZ1++) {
    const idealZ2 = Math.round(curZ1 / tauNorm);
    if (idealZ2 <= curZ1) continue;

    for (let curZ2 of [idealZ2 - 2, idealZ2 - 1, idealZ2, idealZ2 + 1, idealZ2 + 2]) {
      if (curZ2 <= curZ1) continue;
      const curTau = curZ1 / curZ2;
      const errTau = Math.abs((curTau - tauNorm) / tauNorm) * 100.0;

      if (errTau <= tolPct) {
        const sumZ = curZ1 + curZ2;

        for (let candM of moduleScanList) {
          let alpha_c = 0.0;
          let mt_c = candM;
          let i_c = targetI;
          let factors_c = { Phi: 1, Psi: 1, Gamma_T: 2 };

          if (gearType === 'spur') {
            mt_c = candM;
            i_c = mt_c * (sumZ / 2.0 + xr1);
            if (geomMode === 'center' && Math.abs(i_c - targetI) > 0.5) continue;
          } else {
            if (geomMode === 'center') {
              const cosAlphaExact = (candM * (sumZ + 2.0 * xr1)) / (2.0 * targetI);
              if (cosAlphaExact < 0.766 || cosAlphaExact > 0.999) continue;
              alpha_c = (Math.acos(cosAlphaExact) * 180.0) / Math.PI;
              mt_c = candM / cosAlphaExact;
              i_c = targetI;
            } else {
              const numHel = 8 * Ke_N_mm2 * W_N_mm_s * (1.0 + curTau) * 0.6;
              const denHel = 1.0 * omega1 * Math.sin(2 * theta) * Math.pow(curZ1, 3) * Math.pow(sigmaH_lim, 2);
              const mt_min_c = Math.cbrt(numHel / denHel);
              const cosA = Math.min(0.999, Math.max(0.766, candM / mt_min_c));
              alpha_c = (Math.acos(cosA) * 180.0) / Math.PI;
              mt_c = candM / cosA;
              i_c = mt_c * (sumZ / 2.0 + xr1);
            }
            factors_c = getHelicalFactors(alpha_c, curZ1, curZ2);
          }

          const phiVal = (gearType === 'spur')
            ? (8 * Ke_N_mm2 * W_N_mm_s * (1.0 + curTau)) / (omega1 * Math.sin(2 * theta) * Math.pow(curZ1, 3) * Math.pow(mt_c, 3) * Math.pow(sigmaH_lim, 2))
            : (8 * Ke_N_mm2 * W_N_mm_s * (1.0 + curTau) / (omega1 * Math.sin(2 * theta) * Math.pow(curZ1, 3) * Math.pow(mt_c, 3) * Math.pow(sigmaH_lim, 2))) * (factors_c.Phi / factors_c.Gamma_T);

          const dp1_c = mt_c * curZ1;
          const L_c = isLockL ? lockedLVal : (phiVal * dp1_c);
          const phi_eff = L_c / dp1_c;

          const Fc_c = (2 * M1_Nm * 1000.0) / dp1_c;
          const z_eq = (gearType === 'spur') ? curZ1 : (curZ1 / Math.pow(Math.cos((alpha_c * Math.PI) / 180.0), 3));
          const y_c = getLewisFactor(z_eq, xr1);
          const sigL_c = (gearType === 'spur')
            ? (Fc_c / (L_c * candM * y_c))
            : (Fc_c / (L_c * candM * y_c)) * (factors_c.Psi / factors_c.Gamma_T);

          if (sigL_c > 800) continue;

          const modObj = STANDARD_MODULES.find(item => item.m === candM);
          const seriePenalty = (modObj && modObj.cat === 'red') ? 6.0 : 0.0;

          let alphaPenalty = Math.abs(alpha_c - 20.0) * 0.35;
          if (alpha_c > 35.0) alphaPenalty += (alpha_c - 35.0) * 4.0;

          let phiPenalty = 0;
          if (phi_eff < 0.5) phiPenalty = (0.5 - phi_eff) * 50;
          else if (phi_eff > 1.0) phiPenalty = (phi_eff - 1.0) * 50;

          const score = (curZ1 * 1.5) + (errTau * 1.0) + seriePenalty + alphaPenalty + phiPenalty;

          combos.push({
            z1: curZ1,
            z2: curZ2,
            tau: curTau,
            err: errTau,
            m: candM,
            mt: mt_c,
            alpha: alpha_c,
            i: i_c,
            phi: phi_eff,
            L: L_c,
            sigmaL: sigL_c,
            score
          });
        }
      }
    }
  }

  combos.sort((a, b) => a.score - b.score);

  const uniqueCombos = [];
  const seen = new Set();
  for (const c of combos) {
    const key = `${c.z1}_${c.z2}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueCombos.push(c);
    }
  }

  return uniqueCombos.slice(0, 8);
}

window.MechCalcGearsCore = {
  STANDARD_MODULES,
  getLewisFactor,
  getHelicalFactors,
  calculateWmax,
  findOptimalCombos
};
