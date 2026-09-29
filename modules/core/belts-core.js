/**
 * belts-core.js - ISO 5296 / DIN 7721 Pure Analytical Engine
 * Zero DOM dependencies / Headless calculation module
 */

const CATALOG_WIDTHS = {
  '2': [6, 9, 12],            // GT2
  '3': [6, 9, 15],            // HTD 3M
  '5': [9, 15, 25],           // HTD 5M
  '5_T5': [10, 16, 25],       // T5
  '8': [20, 30, 50, 85]       // HTD 8M
};

const BASE_ALLOWABLE_FORCE = {
  '2': 7.0,     // N per mm di larghezza
  '3': 12.0,    // N per mm di larghezza
  '5': 24.0,    // N per mm di larghezza
  '5_T5': 22.0, // N per mm di larghezza
  '8': 48.0     // N per mm di larghezza
};

function parsePitch(profKey) {
  if (profKey === '5_T5') return 5.0;
  return parseFloat(profKey) || 5.0;
}

function calculatePitchDiameter(teeth, pitch) {
  return (teeth * pitch) / Math.PI;
}

function computeDrivenTeeth(z1, targetTau) {
  return Math.max(10, Math.round(z1 * targetTau));
}

function calculateBeltAnalytical({
  profKey = '5',
  z1 = 24,
  z2 = 48,
  C0_mm = 200,
  P_kW = 1.5,
  n1_rpm = 1500,
  c0 = 1.5
}) {
  const p = parsePitch(profKey);
  const dp1 = calculatePitchDiameter(z1, p);
  const dp2 = calculatePitchDiameter(z2, p);
  const ratio = z2 / z1;

  const minTheoreticalC = (dp1 + dp2) / 2 + 2;
  if (C0_mm <= minTheoreticalC) {
    return {
      isValid: false,
      reason: 'centerTooSmall',
      minTheoreticalC,
      dp1,
      dp2,
      ratio
    };
  }

  const L0 = 2 * C0_mm + (Math.PI / 2) * (dp1 + dp2) + Math.pow(dp2 - dp1, 2) / (4 * C0_mm);
  const zb0 = L0 / p;
  const zb = Math.max(z1 + z2 + 2, Math.round(zb0));
  const Lp = zb * p;

  const B = 4 * Lp - 2 * Math.PI * (dp1 + dp2);
  const rad = Math.pow(B, 2) - 32 * Math.pow(dp2 - dp1, 2);
  let exactC_mm = C0_mm;
  if (rad >= 0) {
    exactC_mm = (B + Math.sqrt(rad)) / 16;
  }

  const omega1 = (2 * Math.PI * n1_rpm) / 60;
  const torqueNm = (P_kW * 1000) / Math.max(omega1, 0.001);
  const beltSpeed = (Math.PI * dp1 * n1_rpm) / 60000;
  const Pc_kW = P_kW * c0;

  const wrapRad1 = Math.PI - 2 * Math.asin(Math.min(1, Math.abs(dp2 - dp1) / (2 * exactC_mm)));
  const wrapDeg1 = (wrapRad1 * 180) / Math.PI;
  const z_mesh = z1 * (wrapDeg1 / 360);

  let c1 = 1.0;
  if (z_mesh < 6 && z_mesh >= 5) c1 = 0.8;
  else if (z_mesh < 5 && z_mesh >= 4) c1 = 0.6;
  else if (z_mesh < 4) c1 = 0.4;

  let c2 = 1.0;
  if (zb < 70) c2 = 0.9;
  else if (zb > 150) c2 = 1.1;

  const Ft = (Pc_kW * 1000) / Math.max(beltSpeed, 0.1);
  const fAllowable = (BASE_ALLOWABLE_FORCE[profKey] || 20.0) * c1 * c2;
  const reqWidthMm = Ft / fAllowable;

  const widths = CATALOG_WIDTHS[profKey] || [9, 15, 25];
  let chosenWidth = widths[widths.length - 1];
  for (let w of widths) {
    if (w >= reqWidthMm) {
      chosenWidth = w;
      break;
    }
  }

  return {
    isValid: true,
    profKey,
    pitch: p,
    z1,
    z2,
    dp1,
    dp2,
    ratio,
    C0_mm,
    exactC_mm,
    deltaC_mm: exactC_mm - C0_mm,
    zb,
    Lp,
    kinematics: {
      n1_rpm,
      omega1,
      torqueNm,
      beltSpeed,
      wrapDeg1,
      z_mesh
    },
    powerCheck: {
      P_kW,
      c0,
      c1,
      c2,
      Pc_kW,
      Ft,
      fAllowable,
      reqWidthMm,
      chosenWidth,
      isVerified: chosenWidth >= reqWidthMm,
      isMeshOptimal: z_mesh >= 6
    }
  };
}

window.MechCalcBeltsCore = {
  CATALOG_WIDTHS,
  BASE_ALLOWABLE_FORCE,
  parsePitch,
  calculatePitchDiameter,
  computeDrivenTeeth,
  calculateBeltAnalytical
};
