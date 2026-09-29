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

// Fattore di forma di Lewis y(z', x) dal diagramma del corso (dentatura 20°, c = 0.25 mn).
// Curve per spostamento x = -0.6 ... +0.6 (passo 0.1), z' = numero di denti (equivalente
// per le elicoidali, z' = z / cos³α) su scala logaritmica 10-200.
// Digitalizzate dalla scansione del diagramma: scarto tipico 0.0003, massimo stimato 0.002.
// Ogni riga: [x, z' di inizio curva, valori di y ai z' di LEWIS_CHART_Z] (null = prima dell'inizio curva)
const LEWIS_CHART_Z = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 30, 32, 35, 40, 45, 50, 60, 70, 80, 90, 100, 120, 150, 200];
const LEWIS_CHART = [
    [-0.6, 28.4, [null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.2840, 0.2921, 0.3031, 0.3189, 0.3326, 0.3445, 0.3642, 0.3797, 0.3921, 0.4020, 0.4100, 0.4222, 0.4346, 0.4506]],
    [-0.5, 26.6, [null, null, null, null, null, null, null, null, null, null, null, null, null, 0.2912, 0.2997, 0.3073, 0.3177, 0.3327, 0.3456, 0.3567, 0.3751, 0.3895, 0.4009, 0.4100, 0.4173, 0.4283, 0.4395, 0.4541]],
    [-0.4, 24.6, [null, null, null, null, null, null, null, null, null, null, null, null, 0.2987, 0.3080, 0.3164, 0.3241, 0.3344, 0.3491, 0.3613, 0.3717, 0.3882, 0.4007, 0.4104, 0.4182, 0.4246, 0.4343, 0.4445, 0.4564]],
    [-0.3, 22.6, [null, null, null, null, null, null, null, null, null, null, null, 0.3095, 0.3187, 0.3269, 0.3344, 0.3413, 0.3507, 0.3641, 0.3753, 0.3849, 0.4001, 0.4116, 0.4204, 0.4274, 0.4330, 0.4413, 0.4499, 0.4609]],
    [-0.2, 20.6, [null, null, null, null, null, null, null, null, null, null, 0.3198, 0.3306, 0.3399, 0.3481, 0.3553, 0.3617, 0.3703, 0.3822, 0.3920, 0.4001, 0.4131, 0.4229, 0.4304, 0.4363, 0.4410, 0.4481, 0.4550, 0.4631]],
    [-0.1, 18.6, [null, null, null, null, null, null, null, null, 0.3232, 0.3303, 0.3424, 0.3522, 0.3605, 0.3675, 0.3737, 0.3791, 0.3863, 0.3963, 0.4045, 0.4115, 0.4227, 0.4312, 0.4379, 0.4431, 0.4473, 0.4534, 0.4594, 0.4666]],
    [+0.0, 16.4, [null, null, null, null, null, null, 0.3334, 0.3412, 0.3479, 0.3540, 0.3642, 0.3725, 0.3796, 0.3857, 0.3910, 0.3957, 0.4018, 0.4104, 0.4174, 0.4233, 0.4328, 0.4399, 0.4455, 0.4499, 0.4534, 0.4587, 0.4639, 0.4703]],
    [+0.1, 14.4, [null, null, null, null, 0.3479, 0.3552, 0.3617, 0.3674, 0.3724, 0.3770, 0.3850, 0.3918, 0.3976, 0.4027, 0.4072, 0.4112, 0.4166, 0.4241, 0.4302, 0.4353, 0.4434, 0.4494, 0.4539, 0.4575, 0.4603, 0.4644, 0.4685, 0.4739]],
    [+0.2, 12.9, [null, null, 0.3594, 0.3681, 0.3755, 0.3817, 0.3872, 0.3920, 0.3962, 0.4000, 0.4065, 0.4119, 0.4165, 0.4205, 0.4241, 0.4273, 0.4314, 0.4373, 0.4421, 0.4461, 0.4525, 0.4573, 0.4611, 0.4640, 0.4664, 0.4700, 0.4739, 0.4790]],
    [+0.3, 11.4, [null, 0.3883, 0.3946, 0.4001, 0.4048, 0.4090, 0.4128, 0.4161, 0.4192, 0.4219, 0.4268, 0.4308, 0.4344, 0.4375, 0.4402, 0.4426, 0.4458, 0.4502, 0.4538, 0.4567, 0.4614, 0.4650, 0.4678, 0.4701, 0.4720, 0.4750, 0.4782, 0.4816]],
    [+0.4, 11.2, [0.4102, 0.4153, 0.4197, 0.4236, 0.4270, 0.4301, 0.4329, 0.4354, 0.4377, 0.4397, 0.4434, 0.4466, 0.4493, 0.4517, 0.4538, 0.4556, 0.4581, 0.4615, 0.4642, 0.4665, 0.4701, 0.4729, 0.4751, 0.4769, 0.4784, 0.4807, 0.4832, 0.4855]],
    [+0.5, 11.2, [0.4396, 0.4430, 0.4459, 0.4484, 0.4505, 0.4524, 0.4541, 0.4556, 0.4570, 0.4582, 0.4605, 0.4624, 0.4641, 0.4655, 0.4669, 0.4681, 0.4697, 0.4719, 0.4738, 0.4754, 0.4779, 0.4798, 0.4813, 0.4826, 0.4836, 0.4852, 0.4870, 0.4893]],
    [+0.6, 11.2, [0.4704, 0.4716, 0.4727, 0.4738, 0.4747, 0.4755, 0.4763, 0.4770, 0.4776, 0.4782, 0.4792, 0.4800, 0.4807, 0.4813, 0.4819, 0.4823, 0.4829, 0.4837, 0.4844, 0.4849, 0.4859, 0.4867, 0.4875, 0.4882, 0.4888, 0.4899, 0.4911, 0.4916]],
];

// y lungo una curva (riga della tabella), interpolando in log z'.
// Prima dell'inizio della curva si estrapola con la pendenza iniziale (y più basso: a favore di sicurezza);
// oltre z' = 200 si usa il valore a 200.
function lewisCurveAt(row, z) {
  const zs = LEWIS_CHART_Z, ys = row[2];
  let first = ys.findIndex(v => v !== null);
  const u = Math.log(Math.min(z, zs[zs.length - 1]));
  if (z <= zs[first]) {
    const u0 = Math.log(zs[first]), u1 = Math.log(zs[first + 1]);
    return ys[first] + (ys[first + 1] - ys[first]) * (u - u0) / (u1 - u0);
  }
  let i = first;
  while (i < zs.length - 2 && z > zs[i + 1]) i++;
  const u0 = Math.log(zs[i]), u1 = Math.log(zs[i + 1]);
  return ys[i] + (ys[i + 1] - ys[i]) * (u - u0) / (u1 - u0);
}

// Fattore di Lewis y per z' denti (equivalenti) e spostamento di profilo x:
// interpolazione lineare tra le curve in x, x limitato a [-0.6, +0.6].
function getLewisFactor(z, xr = 0) {
  const x = Math.max(-0.6, Math.min(0.6, xr));
  const k = Math.min(LEWIS_CHART.length - 2, Math.max(0, Math.floor((x + 0.6) / 0.1 + 1e-9)));
  const r0 = LEWIS_CHART[k], r1 = LEWIS_CHART[k + 1];
  const t = (x - r0[0]) / (r1[0] - r0[0]);
  const y = lewisCurveAt(r0, z) + (lewisCurveAt(r1, z) - lewisCurveAt(r0, z)) * t;
  return Math.max(0.20, y);
}

// Coefficienti correttivi per le dentature elicoidali (diagramma del corso).
// Curve digitalizzate dal grafico vettoriale originale: errore di lettura < 0.001.
//   phi, psi: valori per alpha = 0, 1, 2, ..., 50°
//   gamma[z]: Γt per alpha = 5, 6, ..., 50° (curve z = 9, 12, 18, 30, 50, 100)
const HELICAL_CHART = {
  phi: [1.0000, 0.9997, 0.9989, 0.9977, 0.9960, 0.9937, 0.9909, 0.9878, 0.9840, 0.9798, 0.9752, 0.9701, 0.9644, 0.9584, 0.9518, 0.9447, 0.9373, 0.9296, 0.9213, 0.9128, 0.9038, 0.8944, 0.8844, 0.8744, 0.8637, 0.8529, 0.8418, 0.8304, 0.8187, 0.8064, 0.7941, 0.7815, 0.7690, 0.7559, 0.7428, 0.7294, 0.7160, 0.7023, 0.6886, 0.6747, 0.6607, 0.6467, 0.6327, 0.6185, 0.6042, 0.5903, 0.5760, 0.5620, 0.5481, 0.5341, 0.5201],
  psi: [1.0000, 1.0000, 1.0000, 1.0003, 1.0006, 1.0009, 1.0012, 1.0017, 1.0023, 1.0029, 1.0037, 1.0043, 1.0051, 1.0063, 1.0071, 1.0083, 1.0097, 1.0108, 1.0123, 1.0137, 1.0154, 1.0171, 1.0191, 1.0211, 1.0231, 1.0254, 1.0277, 1.0302, 1.0331, 1.0359, 1.0391, 1.0422, 1.0456, 1.0493, 1.0530, 1.0573, 1.0616, 1.0665, 1.0713, 1.0767, 1.0824, 1.0884, 1.0947, 1.1018, 1.1089, 1.1170, 1.1255, 1.1347, 1.1445, 1.1549, 1.1663],
  gamma: {
    9: [0.6673, 0.6660, 0.6647, 0.6630, 0.6613, 0.6590, 0.6567, 0.6542, 0.6516, 0.6486, 0.6456, 0.6422, 0.6388, 0.6349, 0.6311, 0.6266, 0.6222, 0.6175, 0.6128, 0.6077, 0.6025, 0.5970, 0.5914, 0.5854, 0.5794, 0.5730, 0.5666, 0.5598, 0.5529, 0.5458, 0.5387, 0.5311, 0.5236, 0.5156, 0.5076, 0.4993, 0.4911, 0.4824, 0.4737, 0.4647, 0.4558, 0.4466, 0.4373, 0.4277, 0.4182, 0.4085],
    12: [0.7070, 0.7055, 0.7041, 0.7022, 0.7003, 0.6979, 0.6955, 0.6925, 0.6895, 0.6862, 0.6830, 0.6790, 0.6750, 0.6707, 0.6664, 0.6616, 0.6567, 0.6514, 0.6461, 0.6403, 0.6345, 0.6284, 0.6222, 0.6155, 0.6088, 0.6017, 0.5946, 0.5870, 0.5794, 0.5715, 0.5635, 0.5551, 0.5467, 0.5380, 0.5293, 0.5202, 0.5112, 0.5016, 0.4920, 0.4822, 0.4724, 0.4623, 0.4521, 0.4418, 0.4315, 0.4209],
    18: [0.7632, 0.7606, 0.7579, 0.7557, 0.7534, 0.7505, 0.7477, 0.7443, 0.7408, 0.7368, 0.7329, 0.7284, 0.7240, 0.7189, 0.7137, 0.7082, 0.7026, 0.6965, 0.6904, 0.6837, 0.6770, 0.6698, 0.6627, 0.6550, 0.6473, 0.6390, 0.6308, 0.6222, 0.6137, 0.6046, 0.5956, 0.5860, 0.5765, 0.5665, 0.5565, 0.5462, 0.5358, 0.5251, 0.5144, 0.5034, 0.4924, 0.4813, 0.4702, 0.4587, 0.4471, 0.4356],
    30: [0.8242, 0.8213, 0.8184, 0.8157, 0.8130, 0.8097, 0.8064, 0.8023, 0.7981, 0.7934, 0.7887, 0.7835, 0.7782, 0.7722, 0.7662, 0.7597, 0.7531, 0.7458, 0.7385, 0.7309, 0.7232, 0.7147, 0.7063, 0.6974, 0.6885, 0.6791, 0.6697, 0.6597, 0.6497, 0.6393, 0.6288, 0.6178, 0.6068, 0.5955, 0.5842, 0.5726, 0.5609, 0.5491, 0.5372, 0.5250, 0.5127, 0.5003, 0.4879, 0.4752, 0.4625, 0.4498],
    50: [0.8741, 0.8709, 0.8677, 0.8646, 0.8614, 0.8576, 0.8537, 0.8492, 0.8446, 0.8392, 0.8338, 0.8276, 0.8215, 0.8148, 0.8081, 0.8006, 0.7930, 0.7849, 0.7768, 0.7679, 0.7591, 0.7497, 0.7404, 0.7304, 0.7204, 0.7098, 0.6992, 0.6881, 0.6769, 0.6654, 0.6539, 0.6417, 0.6296, 0.6172, 0.6048, 0.5921, 0.5794, 0.5665, 0.5535, 0.5402, 0.5270, 0.5136, 0.5002, 0.4868, 0.4734, 0.4598],
    100: [0.9223, 0.9188, 0.9153, 0.9118, 0.9082, 0.9038, 0.8994, 0.8941, 0.8888, 0.8828, 0.8768, 0.8699, 0.8629, 0.8552, 0.8475, 0.8391, 0.8306, 0.8216, 0.8125, 0.8027, 0.7929, 0.7822, 0.7716, 0.7605, 0.7493, 0.7377, 0.7260, 0.7137, 0.7015, 0.6888, 0.6761, 0.6630, 0.6499, 0.6365, 0.6231, 0.6092, 0.5954, 0.5814, 0.5675, 0.5533, 0.5392, 0.5250, 0.5107, 0.4965, 0.4822, 0.4681],
  }
};
const HELICAL_CHART_Z = [9, 12, 18, 30, 50, 100];

// Interpolazione lineare in una tabella a passo 1° che parte da alpha0
function helicalChartAt(table, alpha0, a) {
  const x = Math.max(0, Math.min(table.length - 1, a - alpha0));
  const i = Math.min(Math.floor(x), table.length - 2);
  return table[i] + (table[i + 1] - table[i]) * (x - i);
}

// Γt per un numero di denti qualsiasi: interpolazione tra le curve in 1/√z,
// che ricostruisce le curve del diagramma con errore < 0.003.
// z fuori dal diagramma: si usa la curva estrema (z < 9 → z = 9, z > 100 → z = 100).
function helicalGammaT(a, z) {
  const zs = HELICAL_CHART_Z;
  const zc = Math.max(zs[0], Math.min(zs[zs.length - 1], z));
  let k = 0;
  while (k < zs.length - 2 && zc > zs[k + 1]) k++;
  const g0 = helicalChartAt(HELICAL_CHART.gamma[zs[k]], 5, a);
  const g1 = helicalChartAt(HELICAL_CHART.gamma[zs[k + 1]], 5, a);
  const u = (1 / Math.sqrt(zc) - 1 / Math.sqrt(zs[k])) / (1 / Math.sqrt(zs[k + 1]) - 1 / Math.sqrt(zs[k]));
  return g0 + (g1 - g0) * u;
}

// Φ, Ψ e Γt1 + Γt2 dal diagramma, con alpha limitato al campo 0-50°
function getHelicalFactors(alphaDeg, z1, z2) {
  const a = Math.max(0, Math.min(50, alphaDeg));
  const Phi = helicalChartAt(HELICAL_CHART.phi, 0, a);
  const Psi = helicalChartAt(HELICAL_CHART.psi, 0, a);

  const Gamma_T1 = helicalGammaT(a, z1);
  const Gamma_T2 = helicalGammaT(a, z2);
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
