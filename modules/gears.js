// ==========================================
// MODULE 3: CYLINDRICAL GEARS (HERTZ & LEWIS)
// Basato sul formulario di Costruzione di Macchine
// ==========================================

// Moduli unificati normati con classificazione di preferenza
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

// Interpolazione del fattore di Lewis Y (Figura 1)
function getLewisFactor(z, xr = 0) {
  const zClamped = Math.max(z, 9);
  const yBase = 0.4715 - (2.84 / zClamped);
  return Math.max(0.20, yBase + 0.25 * xr);
}

// Interpolazione coefficienti correttivi elicoidali (Figura 2)
function getHelicalFactors(alphaDeg, z1, z2) {
  const a = Math.max(0, Math.min(45, alphaDeg));
  
  // Curva Phi (rossa)
  const Phi = 1.0 - 0.0139 * a - 0.000014 * Math.pow(a, 2);

  // Curva Psi (verde)
  const Psi = 1.0 + 0.000089 * Math.pow(a, 2);

  // Fattore di curvatura albero/profilo Gamma_T
  const g0_1 = 1.05 - (1.2 / Math.sqrt(Math.max(z1, 9)));
  const g0_2 = 1.05 - (1.2 / Math.sqrt(Math.max(z2, 9)));
  const decay = 1.0 - 0.006 * a - 0.00015 * Math.pow(a, 2);

  const Gamma_T1 = g0_1 * decay;
  const Gamma_T2 = g0_2 * decay;
  const Gamma_T = Gamma_T1 + Gamma_T2;

  return { Phi, Psi, Gamma_T };
}

// Disegno cinematico 2D delle ruote dentate in SVG
function drawGearScheme(d1, d2, a) {
  const svg = document.getElementById('gearChart');
  if (!svg) return;
  svg.innerHTML = '';

  const r1 = d1 / 2;
  const r2 = d2 / 2;
  const totalWidth = d1 + d2 + 40;
  const maxDiameter = Math.max(d1, d2);

  const scale = Math.min(480 / totalWidth, 150 / (maxDiameter * 1.15), 1.5);

  const R1 = r1 * scale;
  const R2 = r2 * scale;
  const cx1 = 60 + R1;
  const cy = 115;
  const cx2 = cx1 + a * scale;

  const dimY = cy + Math.max(R1, R2) + 24;

  // Asse primitivo tratteggiato
  svg.innerHTML += `
    <line x1="${cx1 - R1 - 20}" y1="${cy}" x2="${cx2 + R2 + 20}" y2="${cy}" stroke="#334155" stroke-dasharray="6 4" stroke-width="1.2" />
  `;

  // Ruota 1 (Pignone z1)
  svg.innerHTML += `
    <circle cx="${cx1}" cy="${cy}" r="${R1}" fill="rgba(251, 191, 36, 0.12)" stroke="#fbbf24" stroke-width="2" />
    <circle cx="${cx1}" cy="${cy}" r="4" fill="#fbbf24" />
    <text x="${cx1}" y="${cy - R1 - 8}" fill="#fbbf24" font-size="11" font-weight="bold" font-family="monospace" text-anchor="middle">z₁ (dp=${d1.toFixed(1)})</text>
  `;

  // Ruota 2 (Condotta z2)
  svg.innerHTML += `
    <circle cx="${cx2}" cy="${cy}" r="${R2}" fill="rgba(168, 85, 247, 0.12)" stroke="#a855f7" stroke-width="2" />
    <circle cx="${cx2}" cy="${cy}" r="4" fill="#a855f7" />
    <text x="${cx2}" y="${cy - R2 - 8}" fill="#a855f7" font-size="11" font-weight="bold" font-family="monospace" text-anchor="middle">z₂ (dp=${d2.toFixed(1)})</text>
  `;

  // Punto di contatto tangenziale (Polo d'ingranamento C)
  const contactX = cx1 + R1;
  svg.innerHTML += `
    <circle cx="${contactX}" cy="${cy}" r="3.5" fill="#38bdf8" />
  `;

  // Linea di quota dell'interasse
  svg.innerHTML += `
    <line x1="${cx1}" y1="${cy}" x2="${cx1}" y2="${dimY + 8}" stroke="#0284c7" stroke-width="0.8" stroke-dasharray="2 2" />
    <line x1="${cx2}" y1="${cy}" x2="${cx2}" y2="${dimY + 8}" stroke="#0284c7" stroke-width="0.8" stroke-dasharray="2 2" />
    <line x1="${cx1}" y1="${dimY}" x2="${cx2}" y2="${dimY}" stroke="#38bdf8" stroke-width="1.2" />
    <polygon points="${cx1},${dimY} ${cx1+6},${dimY-3} ${cx1+6},${dimY+3}" fill="#38bdf8" />
    <polygon points="${cx2},${dimY} ${cx2-6},${dimY-3} ${cx2-6},${dimY+3}" fill="#38bdf8" />
    <text x="${(cx1 + cx2)/2}" y="${dimY + 16}" fill="#38bdf8" font-size="11" font-weight="bold" font-family="monospace" text-anchor="middle">
      a = ${a.toFixed(2)} mm
    </text>
  `;
}

function calculateGears() {
  const gearType = document.getElementById('gearToothType').value; // 'spur' | 'helical'
  const P_kW = parseFloat(document.getElementById('gearPower').value) || 5.0;
  const n1_rpm = parseFloat(document.getElementById('gearSpeed').value) || 1450;
  const targetTau = parseFloat(document.getElementById('gearTargetTau').value) || 2.0;
  const z1 = parseInt(document.getElementById('gearZ1').value) || 20;
  const xr1 = parseFloat(document.getElementById('gearXr1').value) || 0.0;
  const sigmaH_lim = parseFloat(document.getElementById('gearSigmaH').value) || 550.0; // MPa

  const W_watt = P_kW * 1000.0;
  const omega1 = (2 * Math.PI * n1_rpm) / 60.0;
  const theta = (20.0 * Math.PI) / 180.0; // Angolo di pressione 20°
  const Ke_MPa = 35000.0; // 35 GPa = 35000 MPa

  // 1. Vincolo sul rapporto di trasmissione
  const z2 = Math.max(10, Math.round(z1 * targetTau));
  const tauEff = z2 / z1;
  const tauErrPct = ((tauEff - targetTau) / targetTau) * 100.0;
  const signErr = tauErrPct >= 0 ? '+' : '';
  document.getElementById('gearTauFeedback').innerText = `z₂: ${z2} (τ: ${tauEff.toFixed(2)}, Δ: ${signErr}${tauErrPct.toFixed(1)}%)`;

  let chosenModuleObj = STANDARD_MODULES[4]; // Default m=1.5
  let m_calc = 1.5;
  let mt = 1.5;
  let mn = 1.5;
  let alphaDeg = 0.0;
  let phi = 1.0;
  let z_min = 17;

  if (gearType === 'spur') {
    // === DENTI DIRITTI ===
    document.getElementById('helicalInputsCol').classList.add('hidden');

    // z_min per evitare sottotaglio
    z_min = (2 * (1 - xr1)) / Math.pow(Math.sin(theta), 2);

    // Passo 2: Hertz con phi = 1
    const numHertz = 8 * Ke_MPa * W_watt * (1 + tauEff);
    const denHertz = 1.0 * omega1 * Math.sin(2 * theta) * Math.pow(z1, 3) * Math.pow(sigmaH_lim, 2);
    const m_min = Math.cbrt(numHertz / denHertz);

    // Passo 3: Scelta del modulo unificato
    chosenModuleObj = STANDARD_MODULES.find(item => item.m >= m_min) || STANDARD_MODULES[STANDARD_MODULES.length - 1];
    m_calc = chosenModuleObj.m;
    mn = m_calc;
    mt = m_calc;

    // Reiterazione Hertz per trovare phi al limite
    phi = (8 * Ke_MPa * W_watt * (1 + tauEff)) / (omega1 * Math.sin(2 * theta) * Math.pow(z1, 3) * Math.pow(m_calc, 3) * Math.pow(sigmaH_lim, 2));

  } else {
    // === DENTI ELICOIDALI ===
    document.getElementById('helicalInputsCol').classList.remove('hidden');

    // Passo 1: Predimensionamento Hertz con stima (Phi / Gamma_T) ≈ 0.6 e phi = 1
    const numHertzHel = 8 * Ke_MPa * W_watt * (1 + tauEff) * 0.6;
    const denHertzHel = 1.0 * omega1 * Math.sin(2 * theta) * Math.pow(z1, 3) * Math.pow(sigmaH_lim, 2);
    const mt_min = Math.cbrt(numHertzHel / denHertzHel);

    // Passo 2: Selezione di un mn unificato inferiore o prossimo a mt_min per avere alpha congruo
    const candidateModules = STANDARD_MODULES.filter(item => item.m <= mt_min * 1.02 && item.m >= mt_min * 0.75);
    chosenModuleObj = candidateModules.length > 0 ? candidateModules[candidateModules.length - 1] : STANDARD_MODULES[4];
    mn = chosenModuleObj.m;

    // Calcolo angolo d'elica alpha
    const cosAlpha = Math.min(1.0, Math.max(0.707, mn / mt_min));
    alphaDeg = (Math.acos(cosAlpha) * 180.0) / Math.PI;
    mt = mn / Math.cos((alphaDeg * Math.PI) / 180.0);
    m_calc = mn;

    // Passo 3: z_min per denti elicoidali
    const cosA = Math.cos((alphaDeg * Math.PI) / 180.0);
    const sinA = Math.sin((alphaDeg * Math.PI) / 180.0);
    const cosTh = Math.cos(theta);
    const sinTh = Math.sin(theta);
    z_min = (2 * (1 - xr1) / Math.pow(sinTh, 2)) * cosA * (1 - Math.pow(sinA, 2) * Math.pow(cosTh, 2));

    // Passo 4 & 5: Fattori correttivi e calcolo di phi al limite
    const factors = getHelicalFactors(alphaDeg, z1, z2);
    phi = (8 * Ke_MPa * W_watt * (1 + tauEff) / (omega1 * Math.sin(2 * theta) * Math.pow(z1, 3) * Math.pow(mt, 3) * Math.pow(sigmaH_lim, 2))) * (factors.Phi / factors.Gamma_T);
  }

  // Geometria ruote
  const dp1 = mt * z1;
  const dp2 = mt * z2;
  const a_center = mt * ((z1 + z2) / 2.0 + xr1);
  const L_face = phi * dp1;

  // Passo 4: Verifica a flessione di Lewis
  const Fc = (2 * W_watt) / (omega1 * (dp1 / 1000.0)); // N
  let sigma_L = 0;

  if (gearType === 'spur') {
    const yLewis = getLewisFactor(z1, xr1);
    sigma_L = Fc / (L_face * m_calc * yLewis);
  } else {
    const cosA = Math.cos((alphaDeg * Math.PI) / 180.0);
    const z_eq = z1 / Math.pow(cosA, 3);
    const y_eq = getLewisFactor(z_eq, xr1);
    const factors = getHelicalFactors(alphaDeg, z1, z2);
    sigma_L = (Fc / (L_face * mn * y_eq)) * (factors.Psi / factors.Gamma_T);
  }

  // Aggiornamento interfaccia
  document.getElementById('gearModuleDisp').innerText = `m = ${m_calc.toFixed(2)} mm`;
  
  // Badge categoria modulo
  const catEl = document.getElementById('gearModuleCategory');
  if (chosenModuleObj.cat === 'green') {
    catEl.innerText = currentLang === 'it' ? 'Serie 1: Consigliato (UNI)' : 'Series 1: Recommended';
    catEl.className = 'text-[11px] text-emerald-400 font-medium';
  } else if (chosenModuleObj.cat === 'orange') {
    catEl.innerText = currentLang === 'it' ? 'Serie 2: Sconsigliato' : 'Series 2: Discouraged';
    catEl.className = 'text-[11px] text-amber-400 font-medium';
  } else {
    catEl.innerText = currentLang === 'it' ? 'Serie 3: Fortemente Sconsigliato' : 'Series 3: Strongly Discouraged';
    catEl.className = 'text-[11px] text-rose-400 font-medium';
  }

  // Card Phi
  document.getElementById('gearPhiDisp').innerText = `ϕ = ${phi.toFixed(2)}`;
  const phiStatus = document.getElementById('gearPhiStatus');
  if (phi >= 0.5 && phi <= 1.0) {
    phiStatus.innerText = currentLang === 'it' ? `Ottimale (L = ${L_face.toFixed(1)} mm)` : `Optimal (L = ${L_face.toFixed(1)} mm)`;
    phiStatus.className = 'text-[11px] text-emerald-400 font-medium';
  } else {
    phiStatus.innerText = currentLang === 'it' ? `Fuori range (L = ${L_face.toFixed(1)} mm)` : `Out of range (L = ${L_face.toFixed(1)} mm)`;
    phiStatus.className = 'text-[11px] text-amber-400 font-medium';
  }

  // Card Lewis
  document.getElementById('gearLewisDisp').innerText = `${Math.round(sigma_L)} MPa`;
  const lewisStatus = document.getElementById('gearLewisStatus');
  if (sigma_L >= 300 && sigma_L <= 800) {
    lewisStatus.innerText = currentLang === 'it' ? '✓ Conforme (300-800 MPa)' : '✓ In Range (300-800 MPa)';
    lewisStatus.className = 'text-[11px] text-emerald-400 font-semibold';
  } else {
    lewisStatus.innerText = currentLang === 'it' ? '⚠ Fuori range consigliato' : '⚠ Out of recommended bounds';
    lewisStatus.className = 'text-[11px] text-amber-400 font-semibold';
  }

  // Card Geometria & Interasse
  document.getElementById('gearCenterDisp').innerText = `${a_center.toFixed(2)} mm`;
  document.getElementById('gearCenterSub').innerText = `dp₁: ${dp1.toFixed(1)} | dp₂: ${dp2.toFixed(1)}`;

  // Info sottotaglio
  const underEl = document.getElementById('gearUndercutInfo');
  if (underEl) {
    if (z1 >= z_min) {
      underEl.innerText = `z₁ ≥ z_min (${z_min.toFixed(1)}) → Nessun sottotaglio`;
      underEl.className = 'text-xs text-emerald-400 mt-1 font-mono';
    } else {
      underEl.innerText = `⚠ z₁ < z_min (${z_min.toFixed(1)}) → Necessario spostamento xr > 0`;
      underEl.className = 'text-xs text-amber-400 mt-1 font-mono';
    }
  }

  if (gearType === 'helical') {
    document.getElementById('gearAlphaDisp').innerText = `α = ${alphaDeg.toFixed(1)}° (mt = ${mt.toFixed(2)})`;
  }

  drawGearScheme(dp1, dp2, a_center);
}
