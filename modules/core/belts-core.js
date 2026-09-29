// ==========================================
// MODULE 2: SYNCHRONOUS TIMING BELTS (ISO 5296 / DIN 7721)
// Core: analytical engine. Pure functions, no DOM access.
// All lengths in mm, power in kW, speed in rpm.
// ==========================================

const catalogWidths = {
  '2': [6, 9, 12],            // GT2
  '3': [6, 9, 15],            // HTD 3M
  '5': [9, 15, 25],           // HTD 5M
  '5_T5': [10, 16, 25],       // T5
  '8': [20, 30, 50, 85]       // HTD 8M
};

const baseAllowableForce = {
  '2': 7.0,     // N per mm di larghezza
  '3': 12.0,    // N per mm di larghezza
  '5': 24.0,    // N per mm di larghezza
  '5_T5': 22.0, // N per mm di larghezza
  '8': 48.0     // N per mm di larghezza
};

// z2 dal rapporto di trasmissione desiderato
function beltZ2FromTau(z1, targetTau) {
  const z2 = Math.max(10, Math.round(z1 * targetTau));
  const actualTau = z2 / z1;
  const errPct = ((actualTau - targetTau) / targetTau) * 100;
  return { z2, actualTau, errPct };
}

/**
 * Dimensionamento trasmissione a cinghia sincrona.
 * @param {object} inp
 *   profKey  chiave profilo ('2', '3', '5', '5_T5', '8')
 *   z1, z2   denti pulegge
 *   C0_mm    interasse desiderato [mm]
 *   P_kW     potenza motore [kW]
 *   n1_rpm   velocità puleggia motrice [rpm]
 *   c0       fattore di servizio
 * @returns {object} risultati; valid === false se l'interasse è troppo piccolo
 */
function computeBelts({ profKey, z1, z2, C0_mm, P_kW, n1_rpm, c0 }) {
  const p = parseFloat(profKey);

  const dp1 = (z1 * p) / Math.PI;
  const dp2 = (z2 * p) / Math.PI;
  const ratio = z2 / z1;

  // Cinematica e carichi di calcolo
  const omega1 = (2 * Math.PI * n1_rpm) / 60;
  const torqueNm = (P_kW * 1000) / Math.max(omega1, 0.001);
  const beltSpeed = (Math.PI * dp1 * n1_rpm) / 60000;
  const Pc_kW = P_kW * c0;

  const base = { p, dp1, dp2, ratio, torqueNm, beltSpeed, Pc_kW };

  const minTheoreticalC = (dp1 + dp2) / 2 + 2;
  if (C0_mm <= minTheoreticalC) {
    return { ...base, valid: false, reason: 'centerTooSmall' };
  }

  // 1. Sviluppo primitivo teorico
  const L0 = 2 * C0_mm + (Math.PI / 2) * (dp1 + dp2) + Math.pow(dp2 - dp1, 2) / (4 * C0_mm);
  const zb0 = L0 / p;
  const zb = Math.max(z1 + z2 + 2, Math.round(zb0));
  const Lp = zb * p;

  // 2. Risoluzione quadratica esatta dell'interasse C
  const B = 4 * Lp - 2 * Math.PI * (dp1 + dp2);
  const rad = Math.pow(B, 2) - 32 * Math.pow(dp2 - dp1, 2);
  let exactC_mm = C0_mm;

  if (rad >= 0) {
    exactC_mm = (B + Math.sqrt(rad)) / 16;
  }

  // 3. Denti in presa e fattori correttivi da catalogo
  const wrapRad1 = Math.PI - 2 * Math.asin(Math.min(1, Math.abs(dp2 - dp1) / (2 * exactC_mm)));
  const wrapDeg1 = (wrapRad1 * 180) / Math.PI;
  const z_mesh = (z1 * (wrapDeg1 / 360));

  let c1 = 1.0;
  if (z_mesh < 6 && z_mesh >= 5) c1 = 0.8;
  else if (z_mesh < 5 && z_mesh >= 4) c1 = 0.6;
  else if (z_mesh < 4) c1 = 0.4;

  let c2 = 1.0;
  if (zb < 70) c2 = 0.9;
  else if (zb > 150) c2 = 1.1;

  // 4. Sforzo tangenziale e selezione larghezza commerciale
  const Ft = (Pc_kW * 1000) / Math.max(beltSpeed, 0.1);
  const fAllowable = (baseAllowableForce[profKey] || 20.0) * c1 * c2;
  const reqWidthMm = Ft / fAllowable;

  const widths = catalogWidths[profKey] || [9, 15, 25];
  let chosenWidth = widths[widths.length - 1];
  for (let w of widths) {
    if (w >= reqWidthMm) {
      chosenWidth = w;
      break;
    }
  }

  return {
    ...base,
    valid: true,
    Lp, zb,
    exactC_mm,
    cDiff: exactC_mm - C0_mm,
    wrapDeg1, z_mesh,
    c0, c1, c2,
    Ft, reqWidthMm, chosenWidth,
    widthOk: chosenWidth >= reqWidthMm,
    meshOk: z_mesh >= 6
  };
}
