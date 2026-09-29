// ==========================================
// MODULE 2: SYNCHRONOUS TIMING BELTS (ISO 5296 / DIN 7721)
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

function drawBeltScheme(dp1, dp2, C) {
  const svg = document.getElementById('beltChart');
  if (!svg) return;
  svg.innerHTML = '';

  const r1 = dp1 / 2;
  const r2 = dp2 / 2;

  // Dimensionamento box SVG (600 x 240)
  const maxR = Math.max(r1, r2);
  const totalW = C + r1 + r2 + 40;
  const totalH = maxR * 2 + 80;

  const scale = Math.min(500 / totalW, 140 / totalH, 1.2);

  const cx1 = 50 + r1 * scale;
  const cy = 105;
  const cx2 = cx1 + C * scale;

  const R1 = Math.max(r1 * scale, 2);
  const R2 = Math.max(r2 * scale, 2);
  const dist = cx2 - cx1;

  // Angolo del tratto tangente comune rispetto all'orizzontale
  // sin(theta) = (R2 - R1) / dist
  const sinTheta = Math.max(-0.999, Math.min(0.999, (R2 - R1) / dist));
  const cosTheta = Math.sqrt(1 - sinTheta * sinTheta);

  // Vettori perpendicolari alla retta tangente:
  // Normale verso l'alto: (-sinTheta, -cosTheta)
  // Normale verso il basso: (-sinTheta, cosTheta)

  // Tangenti Puleggia 1 (sinistra)
  const t1_top_x = cx1 - R1 * sinTheta;
  const t1_top_y = cy - R1 * cosTheta;
  const t1_bot_x = cx1 - R1 * sinTheta;
  const t1_bot_y = cy + R1 * cosTheta;

  // Tangenti Puleggia 2 (destra)
  const t2_top_x = cx2 - R2 * sinTheta;
  const t2_top_y = cy - R2 * cosTheta;
  const t2_bot_x = cx2 - R2 * sinTheta;
  const t2_bot_y = cy + R2 * cosTheta;

  // large-arc-flag:
  // Puleggia 2 (grande a destra): l'arco esterno supera 180° se R2 > R1 -> largeArc = 1
  // Puleggia 1 (piccola a sinistra): l'arco esterno è minore di 180° se R1 < R2 -> largeArc = 0
  const largeArc2 = (R2 >= R1) ? 1 : 0;
  const largeArc1 = (R1 >= R2) ? 1 : 0;

  // Path SVG continuo e chiuso:
  // 1. Linea da Puleggia 1 top a Puleggia 2 top
  // 2. Arco su Puleggia 2 (senso orario: sweep=1) fino a Puleggia 2 bot
  // 3. Linea da Puleggia 2 bot a Puleggia 1 bot
  // 4. Arco su Puleggia 1 (senso orario: sweep=1) fino a Puleggia 1 top
  const beltPath = [
    `M ${t1_top_x.toFixed(1)},${t1_top_y.toFixed(1)}`,
    `L ${t2_top_x.toFixed(1)},${t2_top_y.toFixed(1)}`,
    `A ${R2.toFixed(1)},${R2.toFixed(1)} 0 ${largeArc2},1 ${t2_bot_x.toFixed(1)},${t2_bot_y.toFixed(1)}`,
    `L ${t1_bot_x.toFixed(1)},${t1_bot_y.toFixed(1)}`,
    `A ${R1.toFixed(1)},${R1.toFixed(1)} 0 ${largeArc1},1 ${t1_top_x.toFixed(1)},${t1_top_y.toFixed(1)}`,
    'Z'
  ].join(' ');

  const dimY = cy + Math.max(R1, R2) + 28;

  // 1. Asse mediano tratteggiato
  svg.innerHTML += `
    <line x1="${cx1 - R1 - 20}" y1="${cy}" x2="${cx2 + R2 + 20}" y2="${cy}" stroke="#334155" stroke-dasharray="6 4" stroke-width="1.2" />
  `;

  // 2. Nastro Cinghia (tracciato azzurro con riempimento trasparente)
  svg.innerHTML += `
    <path d="${beltPath}" fill="rgba(56, 189, 248, 0.08)" stroke="#38bdf8" stroke-width="3" stroke-linejoin="round" />
  `;

  // 3. Puleggia 1 (Motrice z1)
  svg.innerHTML += `
    <circle cx="${cx1}" cy="${cy}" r="${R1}" fill="rgba(251, 191, 36, 0.12)" stroke="#fbbf24" stroke-width="2" />
    <circle cx="${cx1}" cy="${cy}" r="4" fill="#fbbf24" />
    <text x="${cx1}" y="${cy - R1 - 8}" fill="#fbbf24" font-size="11" font-weight="bold" font-family="monospace" text-anchor="middle">z₁</text>
  `;

  // 4. Puleggia 2 (Condotta z2)
  svg.innerHTML += `
    <circle cx="${cx2}" cy="${cy}" r="${R2}" fill="rgba(168, 85, 247, 0.12)" stroke="#a855f7" stroke-width="2" />
    <circle cx="${cx2}" cy="${cy}" r="4" fill="#a855f7" />
    <text x="${cx2}" y="${cy - R2 - 8}" fill="#a855f7" font-size="11" font-weight="bold" font-family="monospace" text-anchor="middle">z₂</text>
  `;

  // 5. Linea di quota dell'interasse
  svg.innerHTML += `
    <line x1="${cx1}" y1="${cy}" x2="${cx1}" y2="${dimY + 8}" stroke="#0284c7" stroke-width="0.8" stroke-dasharray="2 2" />
    <line x1="${cx2}" y1="${cy}" x2="${cx2}" y2="${dimY + 8}" stroke="#0284c7" stroke-width="0.8" stroke-dasharray="2 2" />
    <line x1="${cx1}" y1="${dimY}" x2="${cx2}" y2="${dimY}" stroke="#38bdf8" stroke-width="1.2" />
    <polygon points="${cx1},${dimY} ${cx1+6},${dimY-3} ${cx1+6},${dimY+3}" fill="#38bdf8" />
    <polygon points="${cx2},${dimY} ${cx2-6},${dimY-3} ${cx2-6},${dimY+3}" fill="#38bdf8" />
    <text x="${(cx1 + cx2)/2}" y="${dimY + 16}" fill="#38bdf8" font-size="11" font-weight="bold" font-family="monospace" text-anchor="middle">
      C = ${currentUnit === 'metric' ? C.toFixed(2) + ' mm' : (C / 25.4).toFixed(3) + ' in'}
    </text>
  `;
}

function calculateBelts() {
  const profKey = document.getElementById('beltProfile').value;
  const p = parseFloat(profKey);
  const z1 = parseInt(document.getElementById('pulleyZ1').value) || 20;
  const c0Input = parseFloat(document.getElementById('desiredCenter').value) || 150;
  const t = translations[currentLang];

  // Gestione puleggia z2: inserimento diretto oppure da target tau
  let z2 = 40;
  if (currentRatioMethod === 'teeth') {
    z2 = parseInt(document.getElementById('pulleyZ2').value) || 40;
  } else {
    const targetTau = parseFloat(document.getElementById('targetTau').value) || 2.0;
    z2 = Math.max(10, Math.round(z1 * targetTau));
    window._computedZ2 = z2;
    const actualTau = z2 / z1;
    const errPct = ((actualTau - targetTau) / targetTau) * 100;
    const signErr = errPct >= 0 ? `+` : ``;
    document.getElementById('tauFeedback').innerText = `z₂: ${z2} (${currentLang === 'it' ? 'effettivo' : 'actual'} τ: ${actualTau.toFixed(2)}, Δ: ${signErr}${errPct.toFixed(1)}%)`;
  }

  const P_kW = parseFloat(document.getElementById('motorPower').value) || 1.5;
  const n1_rpm = parseFloat(document.getElementById('driverSpeed').value) || 1500;
  const c0 = parseFloat(document.getElementById('serviceFactor').value) || 1.5;

  const C0_mm = currentUnit === 'metric' ? c0Input : c0Input * 25.4;

  const dp1 = (z1 * p) / Math.PI;
  const dp2 = (z2 * p) / Math.PI;

  const dp1Str = currentUnit === 'metric' ? `${dp1.toFixed(2)} mm` : `${(dp1 / 25.4).toFixed(3)} in`;
  const dp2Str = currentUnit === 'metric' ? `${dp2.toFixed(2)} mm` : `${(dp2 / 25.4).toFixed(3)} in`;
  document.getElementById('dp1Info').innerText = `dp₁: ${dp1Str}`;
  document.getElementById('dp2Info').innerText = `dp₂: ${dp2Str}`;

  const ratio = z2 / z1;
  document.getElementById('ratioInfo').innerText = `Ratio: 1 : ${ratio.toFixed(2)}`;

  // Cinematica e carichi di calcolo
  const omega1 = (2 * Math.PI * n1_rpm) / 60;
  const torqueNm = (P_kW * 1000) / Math.max(omega1, 0.001);
  const beltSpeed = (Math.PI * dp1 * n1_rpm) / 60000;
  const Pc_kW = P_kW * c0;

  document.getElementById('torqueDisp').innerText = `Torque: ${torqueNm.toFixed(2)} Nm`;
  document.getElementById('beltSpeedDisp').innerText = `Belt speed: ${beltSpeed.toFixed(2)} m/s`;
  document.getElementById('designPowerDisp').innerText = `Design Power Pc: ${Pc_kW.toFixed(2)} kW`;

  const minTheoreticalC = (dp1 + dp2) / 2 + 2;
  if (C0_mm <= minTheoreticalC) {
    document.getElementById('exactCenterDisp').innerText = "--";
    document.getElementById('centerDiffDisp').innerText = t.centerTooSmall;
    document.getElementById('centerDiffDisp').className = "text-[11px] text-rose-400 mt-0.5 font-medium";
    document.getElementById('beltTeethDisp').innerText = "--";
    document.getElementById('card3Value').innerText = "--";
    document.getElementById('teethInMeshDisp').innerText = "--";
    document.getElementById('beltChart').innerHTML = '';
    return;
  }

  document.getElementById('centerDiffDisp').className = "text-[11px] text-slate-500 mt-0.5";

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

  // Visualizzazione dati geometrici
  const cDiff = exactC_mm - C0_mm;
  const signDiff = cDiff >= 0 ? `+` : ``;

  if (currentUnit === 'metric') {
    document.getElementById('exactCenterDisp').innerText = `${exactC_mm.toFixed(2)} mm`;
    document.getElementById('centerDiffDisp').innerText = `Δ: ${signDiff}${cDiff.toFixed(2)} mm vs target`;
    document.getElementById('beltPitchLengthDisp').innerText = `Lp: ${Lp.toFixed(2)} mm (${currentLang === 'it' ? 'arrotondato ad intero' : 'rounded to int'})`;
  } else {
    document.getElementById('exactCenterDisp').innerText = `${(exactC_mm / 25.4).toFixed(3)} in`;
    document.getElementById('centerDiffDisp').innerText = `Δ: ${signDiff}${(cDiff / 25.4).toFixed(3)} in vs target`;
    document.getElementById('beltPitchLengthDisp').innerText = `Lp: ${(Lp / 25.4).toFixed(3)} in (${currentLang === 'it' ? 'arrotondato ad intero' : 'rounded to int'})`;
  }

  document.getElementById('beltTeethDisp').innerText = `${zb} ${currentLang === 'it' ? 'denti' : 'teeth'}`;
  document.getElementById('teethInMeshDisp').innerText = `${z_mesh.toFixed(1)} ${currentLang === 'it' ? 'denti' : 'teeth'}`;

  // Card 3 dinamica
  const card3Title = document.getElementById('card3Title');
  const card3Value = document.getElementById('card3Value');
  const card3Sub = document.getElementById('card3Sub');

  if (currentBeltMode === 'geom') {
    card3Title.innerText = t.wrapAngleCard;
    card3Value.innerText = `${wrapDeg1.toFixed(1)}°`;
    card3Sub.innerText = `Ratio: ${ratio.toFixed(2)}`;
  } else {
    card3Title.innerText = t.recWidthCard;
    card3Value.innerText = currentUnit === 'metric' ? `${chosenWidth} mm` : `${(chosenWidth / 25.4).toFixed(2)} in (${chosenWidth} mm)`;
    card3Sub.innerText = `Req. min: ${reqWidthMm.toFixed(1)} mm`;

    // Aggiornamento breakdown fattori
    document.getElementById('breakdownC0').innerText = c0.toFixed(2);
    document.getElementById('breakdownC1').innerText = c1.toFixed(2);
    document.getElementById('breakdownC2').innerText = c2.toFixed(2);
    document.getElementById('breakdownFt').innerText = `${Math.round(Ft)} N`;

    const checkEl = document.getElementById('powerCheckStatus');
    if (chosenWidth >= reqWidthMm) {
      checkEl.innerText = currentLang === 'it' ? '✓ Dimensionamento Valido' : '✓ Capacity Verified';
      checkEl.className = "text-[11px] font-mono text-emerald-400 font-semibold";
    } else {
      checkEl.innerText = currentLang === 'it' ? '⚠ Larghezza Massima Superata' : '⚠ Exceeds Catalog Width';
      checkEl.className = "text-[11px] font-mono text-amber-400 font-semibold";
    }
  }

  const meshStatusEl = document.getElementById('teethInMeshStatus');
  if (z_mesh >= 6) {
    meshStatusEl.innerText = t.meshOptimal;
    meshStatusEl.className = "text-[11px] text-emerald-400 mt-0.5 font-medium";
  } else {
    meshStatusEl.innerText = `${t.meshWarning} (c₁ = ${c1})`;
    meshStatusEl.className = "text-[11px] text-amber-400 mt-0.5 font-medium";
  }

  drawBeltScheme(dp1, dp2, exactC_mm);
}
