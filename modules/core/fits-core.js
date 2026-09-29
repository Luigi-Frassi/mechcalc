// ==========================================
// MODULE 1: ISO FITS & TOLERANCES (ISO 286-2)
// Core: tolerance tables and analytical engine. Pure functions, no DOM access.
// Diameters in mm, deviations in µm.
// ==========================================

const isoTable = [
  { min: 3, max: 6, it6: 8, it7: 12, f7_es: -10, g6_es: -4, h6_es: 0, js6_es: 4, k6_es: 9, p6_es: 20 },
  { min: 6, max: 10, it6: 9, it7: 15, f7_es: -13, g6_es: -5, h6_es: 0, js6_es: 4.5, k6_es: 10, p6_es: 24 },
  { min: 10, max: 18, it6: 11, it7: 18, f7_es: -16, g6_es: -6, h6_es: 0, js6_es: 5.5, k6_es: 12, p6_es: 29 },
  { min: 18, max: 30, it6: 13, it7: 21, f7_es: -20, g6_es: -7, h6_es: 0, js6_es: 6.5, k6_es: 15, p6_es: 35 },
  { min: 30, max: 50, it6: 16, it7: 25, f7_es: -25, g6_es: -9, h6_es: 0, js6_es: 8, k6_es: 18, p6_es: 42 },
  { min: 50, max: 80, it6: 19, it7: 30, f7_es: -30, g6_es: -10, h6_es: 0, js6_es: 9.5, k6_es: 21, p6_es: 51 },
  { min: 80, max: 120, it6: 22, it7: 35, f7_es: -36, g6_es: -12, h6_es: 0, js6_es: 11, k6_es: 25, p6_es: 59 },
  { min: 120, max: 180, it6: 25, it7: 40, f7_es: -43, g6_es: -14, h6_es: 0, js6_es: 12.5, k6_es: 28, p6_es: 68 },
  { min: 180, max: 250, it6: 29, it7: 46, f7_es: -50, g6_es: -15, h6_es: 0, js6_es: 14.5, k6_es: 33, p6_es: 79 },
  { min: 250, max: 315, it6: 32, it7: 52, f7_es: -56, g6_es: -17, h6_es: 0, js6_es: 16, k6_es: 36, p6_es: 88 },
  { min: 315, max: 400, it6: 36, it7: 57, f7_es: -62, g6_es: -18, h6_es: 0, js6_es: 18, k6_es: 40, p6_es: 98 },
  { min: 400, max: 500, it6: 40, it7: 63, f7_es: -68, g6_es: -20, h6_es: 0, js6_es: 20, k6_es: 45, p6_es: 108 }
];

const fitsRa = {
  'H7/f7': { shaftRa: 'Ra 1.6 µm / 63 µin', holeRa: 'Ra 1.6-3.2 µm / 63-125 µin' },
  'H7/g6': { shaftRa: 'Ra 0.8 µm / 32 µin', holeRa: 'Ra 1.6 µm / 63 µin' },
  'H7/h6': { shaftRa: 'Ra 0.8 µm / 32 µin', holeRa: 'Ra 1.6 µm / 63 µin' },
  'H7/js6': { shaftRa: 'Ra 0.8 µm / 32 µin', holeRa: 'Ra 1.6 µm / 63 µin' },
  'H7/k6': { shaftRa: 'Ra 0.8 µm / 32 µin', holeRa: 'Ra 1.6 µm / 63 µin' },
  'H7/p6': { shaftRa: 'Ra 0.4-0.8 µm / 16-32 µin', holeRa: 'Ra 0.8-1.6 µm / 32-63 µin' }
};

const fitKeys = ['H7/f7', 'H7/g6', 'H7/h6', 'H7/js6', 'H7/k6', 'H7/p6'];

// Diametro nominale nel campo coperto (3 - 500 mm)
function isFitDiameterValid(dMm) {
  return !(isNaN(dMm) || dMm < 3 || dMm > 500);
}

// Scaglione ISO 286 per il diametro nominale
function findIsoStep(dMm) {
  return isoTable.find(s => dMm > s.min && dMm <= s.max) || (dMm <= 3 ? isoTable[0] : isoTable[isoTable.length - 1]);
}

// Scostamenti superiore (es) e inferiore (ei) dell'albero [µm]
function getShaftDevs(step, shaftClass) {
  let es_s = 0, ei_s = 0;
  if (shaftClass === 'f7') { es_s = step.f7_es; ei_s = es_s - step.it7; }
  else if (shaftClass === 'g6') { es_s = step.g6_es; ei_s = es_s - step.it6; }
  else if (shaftClass === 'h6') { es_s = step.h6_es; ei_s = es_s - step.it6; }
  else if (shaftClass === 'js6') { es_s = step.js6_es; ei_s = -step.js6_es; }
  else if (shaftClass === 'k6') { es_s = step.k6_es; ei_s = es_s - step.it6; }
  else if (shaftClass === 'p6') { es_s = step.p6_es; ei_s = es_s - step.it6; }
  return { es: es_s, ei: ei_s };
}

// Natura dell'accoppiamento dai giochi minimo e massimo [µm]
function classifyFit(minPlay, maxPlay) {
  if (minPlay >= 0) return 'clearance';
  if (maxPlay <= 0) return 'interference';
  return 'transition';
}

/**
 * Analisi di un accoppiamento H7/xx su uno scaglione ISO.
 * Foro H7: EI = 0, ES = IT7.
 */
function analyzeFit(step, fit) {
  const shaftClass = fit.split('/')[1];
  const EI_H = 0;
  const ES_H = step.it7;
  const devs = getShaftDevs(step, shaftClass);
  const maxPlay = ES_H - devs.ei;
  const minPlay = EI_H - devs.es;
  return { fit, shaftClass, ES_H, EI_H, devs, maxPlay, minPlay, kind: classifyFit(minPlay, maxPlay) };
}

// Gioco medio dell'accoppiamento [µm] (negativo = interferenza)
function meanPlayOf(step, fit) {
  const devs = getShaftDevs(step, fit.split('/')[1]);
  return (step.it7 - devs.ei - devs.es) / 2;
}

/**
 * Ricerca inversa: accoppiamento col gioco medio più vicino al target.
 * targetMicron: gioco desiderato [µm], negativo per interferenza.
 */
function reverseLookupFit(step, targetMicron) {
  let bestFit = fitKeys[0];
  let minDiff = Infinity;

  fitKeys.forEach(cand => {
    const meanPlay = meanPlayOf(step, cand);
    const diff = Math.abs(meanPlay - targetMicron);
    if (diff < minDiff) {
      minDiff = diff;
      bestFit = cand;
    }
  });

  return { fit: bestFit, meanPlay: meanPlayOf(step, bestFit) };
}
