// ============================================================================
// MODULE 3: CYLINDRICAL GEARS (HERTZ & LEWIS)
// Core: analytical engine. Pure functions, no DOM access.
// Conforme al formulario di Costruzione di Macchine
// Convenzione formale: tau = z1 / z2 < 1.0 (Rapporto cinematico)
// Curvatura Hertz: (1 + tau) = (1 + z1 / z2)
// Ottimizzazione combinazioni (z1, z2) con filtri meccanici e chiusura interasse
// Unità: mm, N, N/mm², rad/s, W (N·mm/s dove indicato)
// ============================================================================

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

// Angolo di pressione θ = 20°
const GEAR_THETA = (20.0 * Math.PI) / 180.0;

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

// ========================================================
// MODALITÀ 2: VERIFICA INVERSA (W_MAX)
// ========================================================
/**
 * Potenza e coppia massime trasmissibili da una geometria esistente.
 * alphaDeg = 0 per denti diritti.
 */
function computeGearWmax({ toothType, m_input, L_mm, z1, z2, n1, alphaDeg, Ke_GPa, sigmaH_lim, sigmaL_lim, xr1 }) {
  const Ke_N_mm2 = Ke_GPa * 1000.0;
  const omega1 = (2 * Math.PI * n1) / 60.0;
  const theta = GEAR_THETA;
  const tau = z1 / z2;

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
    P_kW_H, P_kW_L, P_kW_max, M1_max,
    limitedBy: (P_kW_H <= P_kW_L) ? 'hertz' : 'lewis',
    dp1, dp2, a_center, Fc_max, yLewis,
    phi: L_mm / dp1
  };
}

// ========================================================
// MODALITÀ 1: PROGETTO DIRETTO (SINTESI)
// ========================================================

// Carico: da potenza [kW] o da coppia [Nm], con velocità [rpm]
function computeGearLoad(loadMode, { P_kW, M1_input, n1_rpm }) {
  const omega1 = (2 * Math.PI * n1_rpm) / 60.0;
  let W_watt, M1_Nm;
  if (loadMode === 'power') {
    W_watt = P_kW * 1000.0;
    M1_Nm = W_watt / Math.max(omega1, 0.001);
  } else {
    M1_Nm = M1_input;
    W_watt = M1_Nm * omega1;
  }
  return { n1_rpm, omega1, W_watt, M1_Nm };
}

// Rapporto nella convenzione tau = z1/z2 <= 1
function normalizeGearTau(targetTau) {
  if (targetTau > 1.0) targetTau = 1.0 / targetTau;
  return targetTau;
}

// z_min teorico di sottotaglio, arrotondato e limitato a 14
function gearZminRounded(xr1) {
  let z_min = Math.ceil((2 * (1 - xr1)) / Math.pow(Math.sin(GEAR_THETA), 2));
  if (z_min < 14) z_min = 14;
  return z_min;
}

// z2 dal rapporto desiderato (targetTau già normalizzato)
function gearZ2FromTau(z1, targetTau) {
  const z2 = Math.max(10, Math.round(z1 / targetTau));
  const tau = z1 / z2;
  const errPct = ((tau - targetTau) / targetTau) * 100.0;
  return { z2, tau, errPct };
}

/**
 * MOTORE DI OTTIMIZZAZIONE (Priorità a z1 minimo e moduli standard)
 * Restituisce fino a 8 combinazioni, la migliore per ogni coppia (z1, z2), ordinate per punteggio.
 */
function optimizeGearCombos({ gearType, geomMode, targetTau, tolPct, targetI, moduleScanList, isLockL, lockedL, z_min, xr1, Ke_N_mm2, W_N_mm_s, M1_Nm, omega1, sigmaH_lim }) {
  const theta = GEAR_THETA;
  let combos = [];

  for (let curZ1 = z_min; curZ1 <= 50; curZ1++) {
    const idealZ2 = Math.round(curZ1 / targetTau);
    if (idealZ2 <= curZ1) continue;

    for (let curZ2 of [idealZ2 - 2, idealZ2 - 1, idealZ2, idealZ2 + 1, idealZ2 + 2]) {
      if (curZ2 <= curZ1) continue;
      const curTau = curZ1 / curZ2;
      const errTau = Math.abs((curTau - targetTau) / targetTau) * 100.0;

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
              // Consente alpha fino a 40° (cos(40°) ≈ 0.766)
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
          const L_c = isLockL ? lockedL : (phiVal * dp1_c);
          const phi_eff = L_c / dp1_c;

          const Fc_c = (2 * M1_Nm * 1000.0) / dp1_c;
          const z_eq = (gearType === 'spur') ? curZ1 : (curZ1 / Math.pow(Math.cos((alpha_c * Math.PI) / 180.0), 3));
          const y_c = getLewisFactor(z_eq, xr1);
          const sigL_c = (gearType === 'spur')
            ? (Fc_c / (L_c * candM * y_c))
            : (Fc_c / (L_c * candM * y_c)) * (factors_c.Psi / factors_c.Gamma_T);

          // Filtro resistenza flessione Lewis
          if (sigL_c > 800) continue;

          // 1. Penalità forte se il modulo appartiene alla Serie 3 sconsigliata (rosso)
          const modObj = STANDARD_MODULES.find(item => item.m === candM);
          const seriePenalty = (modObj && modObj.cat === 'red') ? 6.0 : 0.0;

          // 2. Penalità progressiva per angolo d'elica lontano da 20°
          let alphaPenalty = Math.abs(alpha_c - 20.0) * 0.35;
          if (alpha_c > 35.0) alphaPenalty += (alpha_c - 35.0) * 4.0;

          // 3. Penalità per fascia fuori range [0.5, 1.0]
          let phiPenalty = 0;
          if (phi_eff < 0.5) phiPenalty = (0.5 - phi_eff) * 50;
          else if (phi_eff > 1.0) phiPenalty = (phi_eff - 1.0) * 50;

          // Punteggio: Priorità a z1 minimo e precisione su tau
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
            score: score
          });
        }
      }
    }
  }

  combos.sort((a, b) => a.score - b.score);

  // Mantiene una sola combinazione migliore per ogni coppia (z1, z2)
  const uniqueCombos = [];
  const seen = new Set();
  for (const c of combos) {
    const key = `${c.z1}_${c.z2}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueCombos.push(c);
    }
  }
  return uniqueCombos.slice(0, 8); // Fino a 8 righe
}

/**
 * CALCOLO DEFINITIVO DEI RISULTATI DELLA TRASMISSIONE
 * activeCombo: combinazione scelta dall'ottimizzatore, oppure null (progetto manuale).
 * useRecommended: true se l'utente ha scelto il modulo alternativo alla Serie 3.
 */
function computeGearDesign({ gearType, geomMode, z1, z2, tau, z_min, xr1, Ke_N_mm2, W_N_mm_s, M1_Nm, omega1, sigmaH_lim, isLockM, lockedM, isLockL, lockedL, targetI, supportsAutoZ, activeCombo, useRecommended }) {
  const theta = GEAR_THETA;
  let m_min = 1.0;
  let strictModuleObj = STANDARD_MODULES[4];
  let recommendedModuleObj = null;
  let alphaDeg = 0.0;
  let factors = { Phi: 1, Psi: 1, Gamma_T1: 1, Gamma_T2: 1, Gamma_T: 2 };

  if (activeCombo) {
    strictModuleObj = STANDARD_MODULES.find(item => item.m === activeCombo.m) || { m: activeCombo.m, cat: 'green', serie: 1 };
    m_min = activeCombo.m;
    alphaDeg = activeCombo.alpha;
    if (gearType === 'helical') {
      factors = getHelicalFactors(alphaDeg, z1, z2);
    }
  } else {
    if (gearType === 'spur') {
      z_min = (2 * (1 - xr1)) / Math.pow(Math.sin(theta), 2);

      const numHertz = 8 * Ke_N_mm2 * W_N_mm_s * (1.0 + tau);
      const denHertz = 1.0 * omega1 * Math.sin(2 * theta) * Math.pow(z1, 3) * Math.pow(sigmaH_lim, 2);
      m_min = Math.cbrt(numHertz / denHertz);

      if (isLockM) {
        strictModuleObj = STANDARD_MODULES.find(item => item.m === lockedM) || { m: lockedM, cat: 'green', serie: 1 };
      } else {
        strictModuleObj = STANDARD_MODULES.find(item => item.m >= m_min) || STANDARD_MODULES[STANDARD_MODULES.length - 1];
        if (strictModuleObj.cat === 'red') {
          recommendedModuleObj = STANDARD_MODULES.find(item => item.m > strictModuleObj.m && item.cat !== 'red');
        }
      }
    } else {
      const numHertzHel = 8 * Ke_N_mm2 * W_N_mm_s * (1.0 + tau) * 0.6;
      const denHertzHel = 1.0 * omega1 * Math.sin(2 * theta) * Math.pow(z1, 3) * Math.pow(sigmaH_lim, 2);
      const mt_min = Math.cbrt(numHertzHel / denHertzHel);
      m_min = mt_min;

      if (isLockM) {
        strictModuleObj = STANDARD_MODULES.find(item => item.m === lockedM) || { m: lockedM, cat: 'green', serie: 1 };
      } else {
        const candidates = STANDARD_MODULES.filter(item => item.m <= mt_min * 1.01 && item.m >= mt_min * 0.70);
        strictModuleObj = candidates.length > 0 ? candidates[candidates.length - 1] : (STANDARD_MODULES.find(item => item.m >= mt_min) || STANDARD_MODULES[4]);
        if (strictModuleObj.cat === 'red') {
          recommendedModuleObj = STANDARD_MODULES.find(item => item.m > strictModuleObj.m && item.cat !== 'red');
        }
      }

      if (geomMode === 'center') {
        const cosAlphaExact = (strictModuleObj.m * (z1 + z2 + 2.0 * xr1)) / (2.0 * targetI);
        alphaDeg = (cosAlphaExact >= 0.707 && cosAlphaExact <= 0.999) ? ((Math.acos(cosAlphaExact) * 180.0) / Math.PI) : 15.0;
      } else {
        const cosAlpha = Math.min(0.999, Math.max(0.707, strictModuleObj.m / mt_min));
        alphaDeg = (Math.acos(cosAlpha) * 180.0) / Math.PI;
      }

      factors = getHelicalFactors(alphaDeg, z1, z2);
    }
  }

  let activeModuleObj = strictModuleObj;
  if (useRecommended && recommendedModuleObj && !isLockM && !supportsAutoZ) {
    activeModuleObj = recommendedModuleObj;
  }

  let mn = activeModuleObj.m;
  let mt = (gearType === 'spur') ? mn : (mn / Math.cos((alphaDeg * Math.PI) / 180.0));
  let m_norm = mn;
  const dp1 = mt * z1;
  const dp2 = mt * z2;
  const a_center = mt * ((z1 + z2) / 2.0 + xr1);

  let phi = 1.0;
  let L_face = 30.0;

  if (isLockL) {
    L_face = lockedL;
    phi = L_face / dp1;
  } else {
    if (gearType === 'spur') {
      phi = (8 * Ke_N_mm2 * W_N_mm_s * (1.0 + tau)) / (omega1 * Math.sin(2 * theta) * Math.pow(z1, 3) * Math.pow(m_norm, 3) * Math.pow(sigmaH_lim, 2));
    } else {
      phi = (8 * Ke_N_mm2 * W_N_mm_s * (1.0 + tau) / (omega1 * Math.sin(2 * theta) * Math.pow(z1, 3) * Math.pow(mt, 3) * Math.pow(sigmaH_lim, 2))) * (factors.Phi / factors.Gamma_T);
    }
    L_face = phi * dp1;
  }

  const Fc = (2 * M1_Nm * 1000.0) / dp1;
  let yLewis = 0.32;
  let sigma_L = 0.0;

  if (gearType === 'spur') {
    yLewis = getLewisFactor(z1, xr1);
    sigma_L = Fc / (L_face * m_norm * yLewis);
  } else {
    const cosA = Math.cos((alphaDeg * Math.PI) / 180.0);
    const z_eq = z1 / Math.pow(cosA, 3);
    yLewis = getLewisFactor(z_eq, xr1);
    sigma_L = (Fc / (L_face * mn * yLewis)) * (factors.Psi / factors.Gamma_T);
  }

  // Confronto Serie 3: modulo stretto (Serie 3) vs alternativa consigliata
  let series3 = null;
  if (!isLockM && !supportsAutoZ && strictModuleObj.cat === 'red' && recommendedModuleObj) {
    const phiStrict = (gearType === 'spur')
      ? (8 * Ke_N_mm2 * W_N_mm_s * (1.0 + tau)) / (omega1 * Math.sin(2 * theta) * Math.pow(z1, 3) * Math.pow(strictModuleObj.m, 3) * Math.pow(sigmaH_lim, 2))
      : (8 * Ke_N_mm2 * W_N_mm_s * (1.0 + tau) / (omega1 * Math.sin(2 * theta) * Math.pow(z1, 3) * Math.pow(strictModuleObj.m / Math.cos((alphaDeg * Math.PI) / 180.0), 3) * Math.pow(sigmaH_lim, 2))) * (factors.Phi / factors.Gamma_T);

    const phiRec = (gearType === 'spur')
      ? (8 * Ke_N_mm2 * W_N_mm_s * (1.0 + tau)) / (omega1 * Math.sin(2 * theta) * Math.pow(z1, 3) * Math.pow(recommendedModuleObj.m, 3) * Math.pow(sigmaH_lim, 2))
      : (8 * Ke_N_mm2 * W_N_mm_s * (1.0 + tau) / (omega1 * Math.sin(2 * theta) * Math.pow(z1, 3) * Math.pow(recommendedModuleObj.m / Math.cos((alphaDeg * Math.PI) / 180.0), 3) * Math.pow(sigmaH_lim, 2))) * (factors.Phi / factors.Gamma_T);

    series3 = {
      phiStrict,
      LStrict: phiStrict * strictModuleObj.m * z1,
      phiRec,
      LRec: phiRec * recommendedModuleObj.m * z1,
      canWorkAtLimitRec: (phiRec >= 0.50 && phiRec <= 1.0)
    };
  }

  // Verifica sottotaglio
  const z_check = (gearType === 'spur') ? z1 : (z1 / Math.pow(Math.cos((alphaDeg * Math.PI) / 180.0), 3));

  return {
    m_min, strictModuleObj, recommendedModuleObj, activeModuleObj,
    alphaDeg, factors, mn, mt, m_norm,
    dp1, dp2, a_center,
    phi, L_face, Fc, yLewis, sigma_L,
    phiOk: (phi >= 0.5 && phi <= 1.0),
    lewisOk: (sigma_L <= 800),
    z_min, z_check, undercutOk: (z_check >= z_min),
    series3
  };
}
