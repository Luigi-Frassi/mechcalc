// ============================================================================
// MATERIALS — quenched and tempered steels for shafts (EN 10083-2 / EN 10083-3, condition +QT)
// For each grade and diameter range: minimum yield Re and minimum tensile Rm of the standard.
// σR = Rm min (conservative), σs = Re min, σLF ≈ 0.5·Rm min (rotating bending, polished specimen,
// usual estimate for steels with Rm < 1400 MPa: the course gives σLF as data, so this is only a starting value).
// Pure data and functions, no DOM.
// ============================================================================

// [d max (mm), Re min, Rm min, Rm max]
const SHAFT_STEELS = [
  { id: 'C40', std: 'EN 10083-2', rows: [[16, 460, 650, 800], [40, 400, 630, 780], [100, 350, 600, 750]] },
  { id: 'C45', std: 'EN 10083-2', rows: [[16, 490, 700, 850], [40, 430, 650, 800], [100, 370, 630, 780]] },
  { id: 'C55', std: 'EN 10083-2', rows: [[16, 550, 800, 950], [40, 490, 750, 900], [100, 420, 700, 850]] },
  { id: '41Cr4', std: 'EN 10083-3', rows: [[16, 800, 1000, 1200], [40, 660, 900, 1100], [100, 560, 800, 950]] },
  { id: '34CrMo4', std: 'EN 10083-3', rows: [[16, 800, 1000, 1200], [40, 650, 900, 1100], [100, 550, 800, 950]] },
  { id: '42CrMo4', std: 'EN 10083-3', rows: [[16, 900, 1100, 1300], [40, 750, 1000, 1200], [100, 650, 900, 1100]] },
  { id: '39NiCrMo3', std: 'EN 10083-3', rows: [[16, 785, 980, 1180], [40, 735, 930, 1130], [100, 685, 880, 1080]] },
  { id: '34CrNiMo6', std: 'EN 10083-3', rows: [[16, 1000, 1200, 1400], [40, 900, 1100, 1300], [100, 800, 1000, 1200]] }
];

const SHAFT_STEEL_RANGES = [[0, 16], [16, 40], [40, 100]];

// key "42CrMo4|40" → properties for 16 < d ≤ 40
function shaftSteel(key) {
  const [id, dmaxS] = String(key || '').split('|');
  const g = SHAFT_STEELS.find(s => s.id === id);
  const row = g && g.rows.find(r => r[0] === parseInt(dmaxS));
  if (!row) return null;
  const [dmax, Re, Rm, RmMax] = row;
  const dmin = (SHAFT_STEEL_RANGES.find(r => r[1] === dmax) || [0])[0];
  return { key, id, std: g.std, dmin, dmax, sigmaR: Rm, sigmaRmax: RmMax, sigmaS: Re, sigmaLF: Math.round(0.5 * Rm / 5) * 5 };
}

function shaftSteelKeys() {
  const out = [];
  for (const g of SHAFT_STEELS) for (const r of g.rows) out.push(g.id + '|' + r[0]);
  return out;
}

// the diameter range that contains d (for the hint "your diameter is in another range")
function shaftSteelRangeFor(d) {
  const r = SHAFT_STEEL_RANGES.find(([a, b]) => d > a && d <= b);
  return r ? r[1] : null;
}
