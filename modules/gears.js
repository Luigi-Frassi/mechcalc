// ==========================================
// MODULE 3: CYLINDRICAL GEARS (HERTZ & LEWIS)
// Conforme al formulario di Costruzione di Macchine
// ==========================================

const STANDARD_MODULES = [
  { m: 1.0, cat: 'green' },
  { m: 1.125, cat: 'orange' },
  { m: 1.25, cat: 'green' },
  { m: 1.375, cat: 'orange' },
  { m: 1.5, cat: 'green' },
  { m: 1.75, cat: 'orange' },
  { m: 2.0, cat: 'green' },
  { m: 2.25, cat: 'orange' },
  { m: 2.5, cat: 'green' },
  { m: 2.75, cat: 'orange' },
  { m: 3.0, cat: 'green' },
  { m: 3.25, cat: 'red' },
  { m: 3.5, cat: 'orange' },
  { m: 3.75, cat: 'red' },
  { m: 4.0, cat: 'green' },
  { m: 4.5, cat: 'orange' },
  { m: 5.0, cat: 'green' },
  { m: 5.5, cat: 'orange' },
  { m: 6.0, cat: 'green' },
  { m: 6.5, cat: 'red' },
  { m: 7.0, cat: 'orange' },
  { m: 8.0, cat: 'green' },
  { m: 9.0, cat: 'orange' },
  { m: 10.0, cat: 'green' },
  { m: 11.0, cat: 'orange' },
  { m: 12.0, cat: 'green' },
  { m: 14.0, cat: 'orange' },
  { m: 16.0, cat: 'green' },
  { m: 18.0, cat: 'orange' },
  { m: 20.0, cat: 'green' }
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

  const Gamma_T1 = Math.max(0.2, g0_1 * decay);
  const Gamma_T2 = Math.max(0.2, g0_2 * decay);
  const Gamma_T = Gamma_T1 + Gamma_T2;

  return { Phi, Psi, Gamma_T1, Gamma_T2, Gamma_T };
}

function drawGearScheme(d1, d2, a) {
  const svg = document.getElementById('gearChart');
  if (!svg) return;
  svg.innerHTML = '';

  const r1 = d1 / 2;
  const r2 = d2 / 2;
  const totalWidth = d1 + d2 + 40;
  const maxDiameter = Math.max(d1, d2);

  const scale = Math.min(480 / Math.max(totalWidth, 1), 150 / Math.max(maxDiameter * 1.15, 1), 1.5);

  const R1 = r1 * scale;
  const R2 = r2 * scale;
  const cx1 = 60 + R1;
  const cy = 115;
  const cx2 = cx1 + a * scale;

  const dimY = cy + Math.max(R1, R2) + 24;

  svg.innerHTML += `
    <line x1="${cx1 - R1 - 20}" y1="${cy}" x2="${cx2 + R2 + 20}" y2="${cy}" stroke="#334155" stroke-dasharray="6 4" stroke-width="1.2" />
  `;

  svg.innerHTML += `
    <circle cx="${cx1}" cy="${cy}" r="${R1}" fill="rgba(251, 191, 36, 0.12)" stroke="#fbbf24" stroke-width="2" />
    <circle cx="${cx1}" cy="${cy}" r="4" fill="#fbbf24" />
    <text x="${cx1}" y="${cy - R1 - 8}" fill="#fbbf24" font-size="11" font-weight="bold" font-family="monospace" text-anchor="middle">z₁ (dp=${d1.toFixed(1)})</text>
  `;

  svg.innerHTML += `
    <circle cx="${cx2}" cy="${cy}" r="${R2}" fill="rgba(168, 85, 247, 0.12)" stroke="#a855f7" stroke-width="2" />
    <circle cx="${cx2}" cy="${cy}" r="4" fill="#a855f7" />
    <text x="${cx2}" y="${cy - R2 - 8}" fill="#a855f7" font-size="11" font-weight="bold" font-family="monospace" text-anchor="middle">z₂ (dp=${d2.toFixed(1)})</text>
  `;

  const contactX = cx1 + R1;
  svg.innerHTML += `
    <circle cx="${contactX}" cy="${cy}" r="3.5" fill="#38bdf8" />
  `;

  svg.innerHTML += `
    <line x1="${cx1}" y1="${cy}" x2="${cx1}" y2="${dimY + 8}" stroke="#0284c7" stroke-width="0.8" stroke-dasharray="2 2" />
    <line x1="${cx2}" y1="${cy}" x2="${cx2}" y2="${dimY + 8}" stroke="#0284c7" stroke-width="0.8" stroke-dasharray="2 2" />
    <line x1="${cx1}" y1="${dimY}" x2="${cx2}" y2="${dimY}" stroke="#38bdf8" stroke-width="1.2" />
    <polygon points="${cx1},${dimY} ${cx1+6},${dimY-3} ${cx1+6},${dimY+3}" fill="#38bdf8" />
    <polygon points="${cx2},${dimY} ${cx2-6},${dimY-3} ${cx2-6},${dimY+3}" fill="#38bdf8" />
    <text x="${(cx1 + cx2)/2}" y="${dimY + 16}" fill="#38bdf8" font-size="11" font-weight="bold" font-family="monospace" text-anchor="middle">
      i = ${a.toFixed(2)} mm
    </text>
  `;
}

function calculateGears() {
  const gearType = document.getElementById('gearToothType').value;
  const loadMode = document.querySelector('input[name="gearLoadMode"]:checked').value;
  const geomMode = document.querySelector('input[name="gearGeomMode"]:checked').value;

  // 1. Carico motore / coppia
  let W_watt = 5500.0;
  let n1_rpm = 1450.0;
  let omega1 = (2 * Math.PI * n1_rpm) / 60.0;
  let M1_Nm = 0.0;

  if (loadMode === 'power') {
    const P_kW = parseFloat(document.getElementById('gearPower').value) || 5.5;
    n1_rpm = parseFloat(document.getElementById('gearSpeed').value) || 1450.0;
    omega1 = (2 * Math.PI * n1_rpm) / 60.0;
    W_watt = P_kW * 1000.0;
    M1_Nm = W_watt / omega1;
    document.getElementById('gearOmegaCalc').innerText = `ω₁ = ${omega1.toFixed(1)} rad/s | M₁ = ${M1_Nm.toFixed(1)} Nm`;
  } else {
    M1_Nm = parseFloat(document.getElementById('gearTorqueInput').value) || 36.2;
    n1_rpm = parseFloat(document.getElementById('gearSpeed').value) || 1450.0;
    omega1 = (2 * Math.PI * n1_rpm) / 60.0;
    W_watt = M1_Nm * omega1;
    document.getElementById('gearOmegaCalc').innerText = `P = ${(W_watt / 1000).toFixed(2)} kW | ω₁ = ${omega1.toFixed(1)} rad/s`;
  }

  // 2. Geometria (z1, z2, tau o interasse i)
  let z1 = parseInt(document.getElementById('gearZ1').value) || 20;
  let z2 = 40;
  let tauEff = 2.0;

  if (geomMode === 'tau') {
    const targetTau = parseFloat(document.getElementById('gearTargetTau').value) || 2.0;
    z2 = Math.max(10, Math.round(z1 * targetTau));
    tauEff = z2 / z1;
    const errPct = ((tauEff - targetTau) / targetTau) * 100.0;
    const signErr = errPct >= 0 ? '+' : '';
    document.getElementById('gearGeomFeedback').innerText = `z₂ = ${z2} (τ_eff = ${tauEff.toFixed(2)}, err: ${signErr}${errPct.toFixed(1)}%)`;
  } else if (geomMode === 'teeth') {
    z2 = parseInt(document.getElementById('gearZ2').value) || 40;
    tauEff = z2 / z1;
    document.getElementById('gearGeomFeedback').innerText = `τ_eff = ${tauEff.toFixed(2)} (rapporto 1 : ${tauEff.toFixed(2)})`;
  } else {
    // geomMode === 'center'
    const targetCenter = parseFloat(document.getElementById('gearTargetCenter').value) || 100.0;
    const targetTau = parseFloat(document.getElementById('gearTargetTau').value) || 2.0;
    z2 = Math.max(10, Math.round(z1 * targetTau));
    tauEff = z2 / z1;
    document.getElementById('gearGeomFeedback').innerText = `z₂ = ${z2} | i_target = ${targetCenter.toFixed(1)} mm`;
  }

  // Costanti materiale e angoli
  const theta = (20.0 * Math.PI) / 180.0;
  const Ke_GPa = parseFloat(document.getElementById('gearKeInput').value) || 35.0;
  const Ke_N_mm2 = Ke_GPa * 1000.0; // Conversione corretta in MPa (N/mm^2)
  const sigmaH_lim = parseFloat(document.getElementById('gearSigmaH').value) || 550.0;
  const xr1 = parseFloat(document.getElementById('gearXr1').value) || 0.0;

  let m_min = 1.0;
  let chosenModuleObj = STANDARD_MODULES[4];
  let m_norm = 1.5;
  let mt = 1.5;
  let mn = 1.5;
  let alphaDeg = 0.0;
  let phi = 1.0;
  let z_min = 17;
  let factors = { Phi: 1, Psi: 1, Gamma_T1: 1, Gamma_T2: 1, Gamma_T: 2 };

  if (gearType === 'spur') {
    document.getElementById('helicalStepDetails').classList.add('hidden');
    z_min = (2 * (1 - xr1)) / Math.pow(Math.sin(theta), 2);

    // FORMULA DI HERTZ RIGOROSA CON UNITÀ COERENTI IN MILLIMETRI:
    // W in N*mm/s -> W_watt * 1000
    const W_N_mm_s = W_watt * 1000.0;
    const numHertz = 8 * Ke_N_mm2 * W_N_mm_s * (1 + tauEff);
    const denHertz = 1.0 * omega1 * Math.sin(2 * theta) * Math.pow(z1, 3) * Math.pow(sigmaH_lim, 2);
    m_min = Math.cbrt(numHertz / denHertz);

    // Seleziona modulo unificato superiore
    chosenModuleObj = STANDARD_MODULES.find(item => item.m >= m_min) || STANDARD_MODULES[STANDARD_MODULES.length - 1];
    m_norm = chosenModuleObj.m;
    mn = m_norm;
    mt = m_norm;

    // Calcolo di phi per lavorare esattamente al limite (sigmaH = sigmaH_lim)
    phi = (8 * Ke_N_mm2 * W_N_mm_s * (1 + tauEff)) / (omega1 * Math.sin(2 * theta) * Math.pow(z1, 3) * Math.pow(m_norm, 3) * Math.pow(sigmaH_lim, 2));

  } else {
    document.getElementById('helicalStepDetails').classList.remove('hidden');

    // Denti elicoidali: stima con (Phi / Gamma_T) ≈ 0.6
    const W_N_mm_s = W_watt * 1000.0;
    const numHertzHel = 8 * Ke_N_mm2 * W_N_mm_s * (1 + tauEff) * 0.6;
    const denHertzHel = 1.0 * omega1 * Math.sin(2 * theta) * Math.pow(z1, 3) * Math.pow(sigmaH_lim, 2);
    const mt_min = Math.cbrt(numHertzHel / denHertzHel);
    m_min = mt_min;

    // Sceglie mn <= mt_min per ottenere un angolo alpha reale
    const candidates = STANDARD_MODULES.filter(item => item.m <= mt_min * 1.01 && item.m >= mt_min * 0.70);
    chosenModuleObj = candidates.length > 0 ? candidates[candidates.length - 1] : STANDARD_MODULES.find(item => item.m >= mt_min) || STANDARD_MODULES[4];
    mn = chosenModuleObj.m;

    const cosAlpha = Math.min(0.999, Math.max(0.707, mn / mt_min));
    alphaDeg = (Math.acos(cosAlpha) * 180.0) / Math.PI;
    mt = mn / Math.cos((alphaDeg * Math.PI) / 180.0);
    m_norm = mn;

    const cosA = Math.cos((alphaDeg * Math.PI) / 180.0);
    const sinA = Math.sin((alphaDeg * Math.PI) / 180.0);
    const cosTh = Math.cos(theta);
    const sinTh = Math.sin(theta);
    z_min = (2 * (1 - xr1) / Math.pow(sinTh, 2)) * cosA * (1 - Math.pow(sinA, 2) * Math.pow(cosTh, 2));

    factors = getHelicalFactors(alphaDeg, z1, z2);
    phi = (8 * Ke_N_mm2 * W_N_mm_s * (1 + tauEff) / (omega1 * Math.sin(2 * theta) * Math.pow(z1, 3) * Math.pow(mt, 3) * Math.pow(sigmaH_lim, 2))) * (factors.Phi / factors.Gamma_T);
  }

  // Geometria ruote
  const dp1 = mt * z1;
  const dp2 = mt * z2;
  const a_center = mt * ((z1 + z2) / 2.0 + xr1);
  const L_face = phi * dp1;

  // VERIFICA LEWIS
  // Fc = 2 * M1 / dp1 = 2 * (M1_Nm * 1000) / dp1
  const Fc = (2 * M1_Nm * 1000.0) / dp1; // in Newton [N]
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

  // Output Cards
  document.getElementById('gearModuleDisp').innerText = `${gearType === 'spur' ? 'm' : 'mn'} = ${m_norm.toFixed(2)} mm`;
  const catEl = document.getElementById('gearModuleCategory');
  if (chosenModuleObj.cat === 'green') {
    catEl.innerText = 'Serie 1: Consigliato (UNI)';
    catEl.className = 'text-[11px] text-emerald-400 font-medium';
  } else if (chosenModuleObj.cat === 'orange') {
    catEl.innerText = 'Serie 2: Sconsigliato';
    catEl.className = 'text-[11px] text-amber-400 font-medium';
  } else {
    catEl.innerText = 'Serie 3: Fortemente Sconsigliato';
    catEl.className = 'text-[11px] text-rose-400 font-medium';
  }

  document.getElementById('gearPhiDisp').innerText = `ϕ = ${phi.toFixed(2)}`;
  const phiStatus = document.getElementById('gearPhiStatus');
  if (phi >= 0.5 && phi <= 1.0) {
    phiStatus.innerText = `Ottimale (L = ${L_face.toFixed(1)} mm)`;
    phiStatus.className = 'text-[11px] text-emerald-400 font-medium';
  } else {
    phiStatus.innerText = `⚠ Fuori range [0.5, 1.0] (L = ${L_face.toFixed(1)} mm)`;
    phiStatus.className = 'text-[11px] text-amber-400 font-medium';
  }

  document.getElementById('gearLewisDisp').innerText = `${Math.round(sigma_L)} MPa`;
  const lewisStatus = document.getElementById('gearLewisStatus');
  if (sigma_L >= 300 && sigma_L <= 800) {
    lewisStatus.innerText = '✓ Nel range (300 ÷ 800 MPa)';
    lewisStatus.className = 'text-[11px] text-emerald-400 font-semibold';
  } else {
    lewisStatus.innerText = '⚠ Fuori range consigliato (300 ÷ 800 MPa)';
    lewisStatus.className = 'text-[11px] text-amber-400 font-semibold';
  }

  document.getElementById('gearCenterDisp').innerText = `${a_center.toFixed(2)} mm`;
  document.getElementById('gearCenterSub').innerText = `dp₁: ${dp1.toFixed(1)} | dp₂: ${dp2.toFixed(1)} mm`;

  // Output Breakdown Step-by-Step
  document.getElementById('bkMmin').innerText = `${m_min.toFixed(2)} mm`;
  document.getElementById('bkMnorm').innerText = `${m_norm.toFixed(2)} mm`;
  document.getElementById('bkPhiLim').innerText = `${phi.toFixed(3)}`;
  document.getElementById('bkLface').innerText = `${L_face.toFixed(1)} mm`;
  document.getElementById('bkFc').innerText = `${Math.round(Fc)} N`;
  document.getElementById('bkYlewis').innerText = `${yLewis.toFixed(3)}`;
  document.getElementById('bkSigmaL').innerText = `${Math.round(sigma_L)} MPa`;

  const bkUnder = document.getElementById('bkUndercut');
  if (z1 >= z_min) {
    bkUnder.innerText = `z₁ ≥ z_min (${z_min.toFixed(1)}) → Ok`;
    bkUnder.className = 'text-emerald-400 font-bold';
  } else {
    bkUnder.innerText = `z₁ < z_min (${z_min.toFixed(1)}) → Sottotaglio!`;
    bkUnder.className = 'text-amber-400 font-bold';
  }

  if (gearType === 'helical') {
    document.getElementById('bkAlpha').innerText = `${alphaDeg.toFixed(1)}°`;
    document.getElementById('bkPhiCorr').innerText = `${factors.Phi.toFixed(3)}`;
    document.getElementById('bkPsiCorr').innerText = `${factors.Psi.toFixed(3)}`;
    document.getElementById('bkGammaT').innerText = `${factors.Gamma_T.toFixed(3)} (${factors.Gamma_T1.toFixed(2)}+${factors.Gamma_T2.toFixed(2)})`;
  }

  drawGearScheme(dp1, dp2, a_center);
}
