/**
 * gears-core.js - ISO Cylindrical Gear Synthesis & Rating Engine
 * Pure mathematical calculations: Hertz, Lewis, and analytical center distance closure.
 */

// Moduli unificati standard ISO 54
export const ISO_MODULES = {
  SERIES_1: [1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0],
  SERIES_2: [1.125, 1.375, 1.75, 2.25, 2.75, 3.5, 4.5, 5.5, 7.0, 9.0],
  SERIES_3: [3.25, 3.75, 6.5] // Serie non raccomandata (segnalata con warning)
};

/**
 * Calcolo numero minimo di denti per evitare interferenza/sottotaglio
 * z_min = ceil(2 * (1 - xr) / sin^2(alpha_n))
 */
export function calculateZMin(pressureAngleDeg = 20, profileShift = 0) {
  const alphaRad = (pressureAngleDeg * Math.PI) / 180;
  return Math.ceil((2 * (1 - profileShift)) / Math.pow(Math.sin(alphaRad), 2));
}

/**
 * Sintesi e verifica di una coppia di ruote cilindriche
 * @param {Object} params
 * @param {number} params.power - Potenza da trasmettere (kW)
 * @param {number} params.rpm1 - Velocità pignone (rpm)
 * @param {number} params.targetRatio - Rapporto di trasmissione nominale
 * @param {number} params.module - Modulo normale mn (mm)
 * @param {number|null} params.lockedCenterDistance - Interasse fisso imposto (mm), opzionale
 * @param {number} params.pressureAngleDeg - Angolo di pressione normale (default 20°)
 * @param {number} params.helixAngleDeg - Angolo d'elica iniziale (default 0 per denti diritti)
 * @param {number} params.psiM - Fattore di larghezza b/m (default 10)
 * @param {number} params.sigmaLimit - Tensione ammissibile a flessione Lewis (MPa, default 800)
 */
export function calculateGearPair({
  power = 10,
  rpm1 = 1450,
  targetRatio = 3.0,
  module = 2.5,
  lockedCenterDistance = null,
  pressureAngleDeg = 20,
  helixAngleDeg = 0,
  psiM = 10,
  sigmaLimit = 800
}) {
  const mn = parseFloat(module);
  const zMin = calculateZMin(pressureAngleDeg, 0);
  
  let z1 = zMin;
  let z2 = Math.round(z1 * targetRatio);
  let betaDeg = helixAngleDeg;
  let betaRad = (betaDeg * Math.PI) / 180;

  // Se l'interasse è rigorosamente bloccato, calcoliamo l'angolo d'elica beta analiticamente:
  // a = mn * (z1 + z2) / (2 * cos(beta))  ==>  cos(beta) = mn * (z1 + z2) / (2 * a)
  let isLockedCenterActive = false;
  if (lockedCenterDistance && lockedCenterDistance > 0) {
    const aTarget = parseFloat(lockedCenterDistance);
    const cosBeta = (mn * (z1 + z2)) / (2 * aTarget);

    if (cosBeta > 1.0) {
      throw new Error(`Interasse ${aTarget} mm troppo corto per il modulo mn=${mn} con denti minimi (${z1}+${z2})`);
    } else if (cosBeta < 0.707) {
      // beta > 45°: elica eccessiva per trasmissioni convenzionali
      throw new Error(`Angolo d'elica calcolato > 45° (${(Math.acos(cosBeta)*180/Math.PI).toFixed(1)}°). Scegliere modulo minore o aumentare l'interasse.`);
    }

    betaRad = Math.acos(cosBeta);
    betaDeg = (betaRad * 180) / Math.PI;
    isLockedCenterActive = true;
  }

  // Modulo apparente/frontale: mt = mn / cos(beta)
  const mt = mn / Math.cos(betaRad);

  // Diametri primitivi
  const d1 = z1 * mt;
  const d2 = z2 * mt;

  // Interasse effettivo
  const exactCenterDistance = (d1 + d2) / 2;

  // Larghezza di fascia assiale b = psiM * mn
  const b = psiM * mn;

  // Cinematica e Coppia
  const actualRatio = z2 / z1;
  const rpm2 = rpm1 / actualRatio;
  const omega1 = (2 * Math.PI * rpm1) / 60;
  const torque1 = (power * 1000) / omega1; // Nm sul pignone

  // Forza tangenziale primitivo: Ft = 2000 * T1 / d1 (N)
  const ft = (2000 * torque1) / d1;

  // Verifica a flessione al piede del dente (Lewis)
  // Form factor tipico approssimato Y: Y ~ 0.38 per 20°
  const yLewis = 0.38;
  const sigmaBending = ft / (b * mn * yLewis); // MPa (N/mm^2)
  const isBendingSafe = sigmaBending <= sigmaLimit;

  // Stima fattore di contatto Hertziano semplificato (sigma_H relativo)
  const isSeries3 = ISO_MODULES.SERIES_3.includes(mn);

  return {
    module: mn,
    transverseModule: mt,
    teeth: { z1, z2, zMin, actualRatio },
    helixAngleDeg: betaDeg,
    isLockedCenterActive,
    centerDistance: exactCenterDistance,
    faceWidth: b,
    pitchDiameters: { d1, d2 },
    kinematics: {
      rpm1,
      rpm2,
      torque1Nm: torque1,
      tangentialForceN: ft
    },
    stress: {
      sigmaBendingMPa: sigmaBending,
      sigmaLimitMPa: sigmaLimit,
      isBendingSafe,
      bendingRatio: sigmaBending / sigmaLimit
    },
    warnings: {
      isSeries3Warning: isSeries3,
      message: isSeries3 ? 'Modulo Serie 3 non unificato per produzione standard: preferire Serie 1 o 2.' : null
    }
  };
}
