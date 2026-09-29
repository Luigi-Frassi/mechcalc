/**
 * fits-core.js - ISO 286-2 Pure Analytical Engine
 * Zero DOM dependencies / Headless calculation module
 */

export const ISO_STEPS = [
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

export const STANDARD_FITS = ['H7/f7', 'H7/g6', 'H7/h6', 'H7/js6', 'H7/k6', 'H7/p6'];

export function getISOStep(dMm) {
  if (dMm < 3 || dMm > 500 || isNaN(dMm)) return null;
  return ISO_STEPS.find(s => dMm > s.min && dMm <= s.max) || (dMm <= 3 ? ISO_STEPS[0] : ISO_STEPS[ISO_STEPS.length - 1]);
}

export function getShaftDeviations(step, shaftClass) {
  let es = 0, ei = 0;
  if (shaftClass === 'f7') { es = step.f7_es; ei = es - step.it7; }
  else if (shaftClass === 'g6') { es = step.g6_es; ei = es - step.it6; }
  else if (shaftClass === 'h6') { es = step.h6_es; ei = es - step.it6; }
  else if (shaftClass === 'js6') { es = step.js6_es; ei = -step.js6_es; }
  else if (shaftClass === 'k6') { es = step.k6_es; ei = es - step.it6; }
  else if (shaftClass === 'p6') { es = step.p6_es; ei = es - step.it6; }
  return { es, ei };
}

export function calculateFitAnalytical(dMm, fitKey = 'H7/g6') {
  const step = getISOStep(dMm);
  if (!step) {
    throw new Error('Diametro fuori campo ISO 286 (3 - 500 mm)');
  }

  const shaftClass = fitKey.split('/')[1] || 'g6';
  const ES_H = step.it7;
  const EI_H = 0;
  const shaftDevs = getShaftDeviations(step, shaftClass);

  const maxPlay = ES_H - shaftDevs.ei;
  const minPlay = EI_H - shaftDevs.es;

  let type = 'transition';
  if (minPlay >= 0) type = 'clearance';
  else if (maxPlay <= 0) type = 'interference';

  return {
    nominal: dMm,
    step,
    fitKey,
    shaftClass,
    hole: {
      es: ES_H,
      ei: EI_H,
      maxDim: dMm + (ES_H / 1000),
      minDim: dMm + (EI_H / 1000)
    },
    shaft: {
      es: shaftDevs.es,
      ei: shaftDevs.ei,
      maxDim: dMm + (shaftDevs.es / 1000),
      minDim: dMm + (shaftDevs.ei / 1000)
    },
    fit: {
      type,
      maxPlay,
      minPlay,
      meanPlay: (ES_H - shaftDevs.ei - shaftDevs.es) / 2
    }
  };
}

export function findReverseFit(dMm, targetMicron, nature = 'clearance') {
  const step = getISOStep(dMm);
  if (!step) return null;

  const targetSign = nature === 'interference' ? -Math.abs(targetMicron) : Math.abs(targetMicron);
  let bestFit = STANDARD_FITS[0];
  let minDiff = Infinity;

  STANDARD_FITS.forEach(cand => {
    const sClass = cand.split('/')[1];
    const devs = getShaftDeviations(step, sClass);
    const meanPlay = (step.it7 - devs.ei - devs.es) / 2;
    const diff = Math.abs(meanPlay - targetSign);
    if (diff < minDiff) {
      minDiff = diff;
      bestFit = cand;
    }
  });

  return bestFit;
}

// Supporto per inclusione diretta script browser globale
if (typeof window !== 'undefined') {
  window.MechCalcFitsCore = {
    ISO_STEPS,
    STANDARD_FITS,
    getISOStep,
    getShaftDeviations,
    calculateFitAnalytical,
    findReverseFit
  };
}
