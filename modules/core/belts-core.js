/**
 * belts-core.js - ISO 5296 / DIN 7721 Pure Analytical Engine
 * Zero DOM dependencies / Headless calculation module
 */

// Profili commerciali standard e passi nominali p (mm)
export const BELT_PROFILES = {
  'GT2': { pitch: 2.0, minTeeth: 16, description: 'PowerGrip GT2 2mm' },
  'HTD-3M': { pitch: 3.0, minTeeth: 18, description: 'HTD 3M' },
  'HTD-5M': { pitch: 5.0, minTeeth: 14, description: 'HTD 5M' },
  'HTD-8M': { pitch: 8.0, minTeeth: 22, description: 'HTD 8M' },
  'T5': { pitch: 5.0, minTeeth: 15, description: 'Trapezoidal T5 DIN 7721' }
};

/**
 * Calcola diametro primitivo: d = (z * p) / PI
 */
export function calculatePitchDiameter(teeth, pitch) {
  return (teeth * pitch) / Math.PI;
}

/**
 * Calcolo analitico completo della trasmissione a cinghia sincrona
 * @param {Object} params
 * @param {string} params.profile - Codice profilo ('GT2', 'HTD-5M', ecc.)
 * @param {number} params.z1 - Denti puleggia motrice
 * @param {number} params.z2 - Denti puleggia condotta
 * @param {number} params.nominalCenterDistance - Interasse teorico desiderato (mm)
 * @param {number} params.rpm - Velocità puleggia motrice (giri/min)
 * @param {number} params.power - Potenza da trasmettere (kW)
 * @returns {Object} Geometria analitica, interasse ricalcolato e tensioni
 */
export function calculateTimingBelt({
  profile = 'HTD-5M',
  z1 = 24,
  z2 = 48,
  nominalCenterDistance = 250,
  rpm = 1450,
  power = 1.5
}) {
  const beltSpec = BELT_PROFILES[profile];
  if (!beltSpec) throw new Error(`Profilo sconosciuto: ${profile}`);

  const p = beltSpec.pitch;
  const d1 = calculatePitchDiameter(z1, p);
  const d2 = calculatePitchDiameter(z2, p);
  const transmissionRatio = z2 / z1;

  // 1. Sviluppo teorico primitivo continuo con interasse nominale a0
  const a0 = nominalCenterDistance;
  const L0 = 2 * a0 + (Math.PI * (d1 + d2)) / 2 + Math.pow(d2 - d1, 2) / (4 * a0);

  // 2. Discretizzazione: numero di denti intero normalizzato (zb)
  const zb = Math.round(L0 / p);
  const nominalBeltLength = zb * p;

  // 3. Ricalcolo esatto dell'interasse effettivo chiuso sul passo discreto
  // Formula esatta ISO quadratica: a = (b + sqrt(b^2 - 8*(d2 - d1)^2)) / 4
  // con b = 2*L - PI*(d1 + d2)
  const bParam = 2 * nominalBeltLength - Math.PI * (d1 + d2);
  const delta = Math.pow(bParam, 2) - 8 * Math.pow(d2 - d1, 2);

  if (delta < 0) {
    throw new Error('Geometria impossibile: sviluppo cinghia insufficiente per le pulegge scelte');
  }

  const exactCenterDistance = (bParam + Math.sqrt(delta)) / 8;

  // 4. Verifiche cinematiche
  // Angolo di avvolgimento puleggia minore theta1 (rad e gradi)
  const theta1Rad = Math.PI - 2 * Math.asin(Math.min(1, Math.max(-1, (d2 - d1) / (2 * exactCenterDistance))));
  const theta1Deg = (theta1Rad * 180) / Math.PI;

  // Denti in presa sulla puleggia minore
  const teethInMesh = Math.floor((z1 * theta1Deg) / 360);

  // Velocità periferica (m/s)
  const pitchSpeed = (Math.PI * d1 * rpm) / 60000;

  // Forza tangenziale trasmissibile Ft (N) = P / v
  const tangentialForce = pitchSpeed > 0 ? (power * 1000) / pitchSpeed : 0;

  return {
    profile,
    pitch: p,
    pulleys: {
      driver: { teeth: z1, pitchDiameter: d1, rpm },
      driven: { teeth: z2, pitchDiameter: d2, rpm: rpm / transmissionRatio },
      ratio: transmissionRatio
    },
    belt: {
      teethCount: zb,
      pitchLength: nominalBeltLength,
      nominalCenterDistance: a0,
      exactCenterDistance: exactCenterDistance,
      centerDistanceDelta: exactCenterDistance - a0
    },
    kinematics: {
      wrapAngleDeg: theta1Deg,
      teethInMesh: teethInMesh,
      pitchSpeed: pitchSpeed,
      tangentialForce: tangentialForce,
      isUndermeshed: teethInMesh < 6 // Allarme da catalogo se z_mesh < 6
    }
  };
}
