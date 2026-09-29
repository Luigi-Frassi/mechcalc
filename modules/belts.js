// ==========================================
// MODULE 2: SYNCHRONOUS TIMING BELTS (UI LAYER)
// ==========================================

function drawBeltScheme(dp1, dp2, C) {
  const svg = document.getElementById('beltChart');
  if (!svg) return;
  svg.innerHTML = '';

  const r1 = dp1 / 2;
  const r2 = dp2 / 2;

  // Box SVG: 600 x 240
  const maxR = Math.max(r1, r2);
  const totalW = C + r1 + r2 + 60;
  const totalH = maxR * 2 + 80;

  // Scala grafica di adattamento
  const scale = Math.min(500 / Math.max(totalW, 1), 140 / Math.max(totalH, 1), 1.2);

  const R1 = Math.max(r1 * scale, 3);
  const R2 = Math.max(r2 * scale, 3);
  const scaledDist = Math.max(C * scale, R1 + R2 + 4);

  // Centratura orizzontale e verticale nello spazio 600x240
  const cx1 = (600 - (scaledDist + R1 + R2)) / 2 + R1;
  const cy = 110;
  const cx2 = cx1 + scaledDist;

  // Angolo del tratto tangente comune esterno
  // sin(gamma) = (R2 - R1) / d
  const deltaR = R2 - R1;
  const sinGamma = Math.max(-0.999, Math.min(0.999, deltaR / scaledDist));
  const cosGamma = Math.sqrt(1 - sinGamma * sinGamma);

  // Punti di tangenza Puleggia 1 (sinistra)
  const t1_top_x = cx1 - R1 * sinGamma;
  const t1_top_y = cy - R1 * cosGamma;
  const t1_bot_x = cx1 - R1 * sinGamma;
  const t1_bot_y = cy + R1 * cosGamma;

  // Punti di tangenza Puleggia 2 (destra)
  const t2_top_x = cx2 - R2 * sinGamma;
  const t2_top_y = cy - R2 * cosGamma;
  const t2_bot_x = cx2 - R2 * sinGamma;
  const t2_bot_y = cy + R2 * cosGamma;

  // Percorso vettoriale chiuso della cinghia (senso orario)
  // Ramo superiore -> Arco puleggia 2 -> Ramo inferiore -> Arco puleggia 1
  const beltPath = [
    `M ${t1_top_x.toFixed(1)},${t1_top_y.toFixed(1)}`,
    `L ${t2_top_x.toFixed(1)},${t2_top_y.toFixed(1)}`,
    `A ${R2.toFixed(1)},${R2.toFixed(1)} 0 0 1 ${t2_bot_x.toFixed(1)},${t2_bot_y.toFixed(1)}`,
    `L ${t1_bot_x.toFixed(1)},${t1_bot_y.toFixed(1)}`,
    `A ${R1.toFixed(1)},${R1.toFixed(1)} 0 0 1 ${t1_top_x.toFixed(1)},${t1_top_y.toFixed(1)}`,
    'Z'
  ].join(' ');

  const dimY = cy + Math.max(R1, R2) + 26;

  // 1. Asse mediano tratteggiato
  svg.innerHTML += `
    <line x1="${cx1 - R1 - 25}" y1="${cy}" x2="${cx2 + R2 + 25}" y2="${cy}" stroke="#334155" stroke-dasharray="6 4" stroke-width="1.2" />
  `;

  // 2. Anello chiuso della cinghia
  svg.innerHTML += `
    <path d="${beltPath}" fill="rgba(56, 189, 248, 0.08)" stroke="#38bdf8" stroke-width="3" stroke-linejoin="round" />
  `;

  // 3. Puleggia motrice (z1)
  svg.innerHTML += `
    <circle cx="${cx1}" cy="${cy}" r="${R1}" fill="rgba(251, 191, 36, 0.12)" stroke="#fbbf24" stroke-width="2" />
    <circle cx="${cx1}" cy="${cy}" r="3.5" fill="#fbbf24" />
    <text x="${cx1}" y="${cy - R1 - 8}" fill="#fbbf24" font-size="11" font-weight="bold" font-family="monospace" text-anchor="middle">z₁</text>
  `;

  // 4. Puleggia condotta (z2)
  svg.innerHTML += `
    <circle cx="${cx2}" cy="${cy}" r="${R2}" fill="rgba(168, 85, 247, 0.12)" stroke="#a855f7" stroke-width="2" />
    <circle cx="${cx2}" cy="${cy}" r="3.5" fill="#a855f7" />
    <text x="${cx2}" y="${cy - R2 - 8}" fill="#a855f7" font-size="11" font-weight="bold" font-family="monospace" text-anchor="middle">z₂</text>
  `;

  // 5. Quota interasse C
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
  if (!window.MechCalcBeltsCore) return;

  const profKey = document.getElementById('beltProfile').value;
  const z1 = parseInt(document.getElementById('pulleyZ1').value) || 20;
  const c0Input = parseFloat(document.getElementById('desiredCenter').value) || 150;
  const t = translations[currentLang];

  // Gestione puleggia z2: inserimento diretto o calcolo da target tau
  let z2 = 40;
  if (currentRatioMethod === 'teeth') {
    z2 = parseInt(document.getElementById('pulleyZ2').value) || 40;
  } else {
    const targetTau = parseFloat(document.getElementById('targetTau').value) || 2.0;
    z2 = window.MechCalcBeltsCore.computeDrivenTeeth(z1, targetTau);
    window._computedZ2 = z2;
    const actualTau = z2 / z1;
    const errPct = ((actualTau - targetTau) / targetTau) * 100;
    const signErr = errPct >= 0 ? `+` : ``;
    document.getElementById('tauFeedback').innerText = `z₂: ${z2} (${currentLang === 'it' ? 'effettivo' : 'actual'} τ:${actualTau.toFixed(2)}, Δ: ${signErr}${errPct.toFixed(1)}%)`;
  }

  const P_kW = parseFloat(document.getElementById('motorPower').value) || 1.5;
  const n1_rpm = parseFloat(document.getElementById('driverSpeed').value) || 1500;
  const c0 = parseFloat(document.getElementById('serviceFactor').value) || 1.5;
  const C0_mm = currentUnit === 'metric' ? c0Input : c0Input * 25.4;

  // Chiamata analitica headless al Core
  const result = window.MechCalcBeltsCore.calculateBeltAnalytical({
    profKey,
    z1,
    z2,
    C0_mm,
    P_kW,
    n1_rpm,
    c0
  });

  const dp1Str = currentUnit === 'metric' ? `${result.dp1.toFixed(2)} mm` : `${(result.dp1 / 25.4).toFixed(3)} in`;
  const dp2Str = currentUnit === 'metric' ? `${result.dp2.toFixed(2)} mm` : `${(result.dp2 / 25.4).toFixed(3)} in`;
  document.getElementById('dp1Info').innerText = `dp₁: ${dp1Str}`;
  document.getElementById('dp2Info').innerText = `dp₂: ${dp2Str}`;
  document.getElementById('ratioInfo').innerText = `Ratio: 1 : ${result.ratio.toFixed(2)}`;

  if (!result.isValid) {
    document.getElementById('exactCenterDisp').innerText = "--";
    document.getElementById('centerDiffDisp').innerText = t.centerTooSmall || (currentLang === 'it' ? "Interasse troppo corto per le pulegge" : "Center distance too short for pulleys");
    document.getElementById('centerDiffDisp').className = "text-[11px] text-rose-400 mt-0.5 font-medium";
    document.getElementById('beltTeethDisp').innerText = "--";
    document.getElementById('card3Value').innerText = "--";
    document.getElementById('teethInMeshDisp').innerText = "--";
    document.getElementById('beltChart').innerHTML = '';
    return;
  }

  document.getElementById('centerDiffDisp').className = "text-[11px] text-slate-500 mt-0.5";

  // Aggiornamento cinematica e potenza
  document.getElementById('torqueDisp').innerText = `Torque: ${result.kinematics.torqueNm.toFixed(2)} Nm`;
  document.getElementById('beltSpeedDisp').innerText = `Belt speed: ${result.kinematics.beltSpeed.toFixed(2)} m/s`;
  document.getElementById('designPowerDisp').innerText = `Design Power Pc: ${result.powerCheck.Pc_kW.toFixed(2)} kW`;

  // Visualizzazione dati geometrici
  const signDiff = result.deltaC_mm >= 0 ? `+` : ``;
  if (currentUnit === 'metric') {
    document.getElementById('exactCenterDisp').innerText = `${result.exactC_mm.toFixed(2)} mm`;
    document.getElementById('centerDiffDisp').innerText = `Δ: ${signDiff}${result.deltaC_mm.toFixed(2)} mm vs target`;
    document.getElementById('beltPitchLengthDisp').innerText = `Lp: ${result.Lp.toFixed(2)} mm (${currentLang === 'it' ? 'arrotondato ad intero' : 'rounded to int'})`;
  } else {
    document.getElementById('exactCenterDisp').innerText = `${(result.exactC_mm / 25.4).toFixed(3)} in`;
    document.getElementById('centerDiffDisp').innerText = `Δ: ${signDiff}${(result.deltaC_mm / 25.4).toFixed(3)} in vs target`;
    document.getElementById('beltPitchLengthDisp').innerText = `Lp: ${(result.Lp / 25.4).toFixed(3)} in (${currentLang === 'it' ? 'arrotondato ad intero' : 'rounded to int'})`;
  }

  document.getElementById('beltTeethDisp').innerText = `${result.zb} ${currentLang === 'it' ? 'denti' : 'teeth'}`;
  document.getElementById('teethInMeshDisp').innerText = `${result.kinematics.z_mesh.toFixed(1)} ${currentLang === 'it' ? 'denti' : 'teeth'}`;

  // Card 3 Dinamica (Wrap Angle o Larghezza)
  const card3Title = document.getElementById('card3Title');
  const card3Value = document.getElementById('card3Value');
  const card3Sub = document.getElementById('card3Sub');

  if (currentBeltMode === 'geom') {
    card3Title.innerText = t.wrapAngleCard;
    card3Value.innerText = `${result.kinematics.wrapDeg1.toFixed(1)}°`;
    card3Sub.innerText = `Ratio: ${result.ratio.toFixed(2)}`;
  } else {
    const w = result.powerCheck.chosenWidth;
    card3Title.innerText = t.recWidthCard;
    card3Value.innerText = currentUnit === 'metric' ? `${w} mm` : `${(w / 25.4).toFixed(2)} in (${w} mm)`;
    card3Sub.innerText = `Req. min: ${result.powerCheck.reqWidthMm.toFixed(1)} mm`;

    // Aggiornamento breakdown fattori
    document.getElementById('breakdownC0').innerText = result.powerCheck.c0.toFixed(2);
    document.getElementById('breakdownC1').innerText = result.powerCheck.c1.toFixed(2);
    document.getElementById('breakdownC2').innerText = result.powerCheck.c2.toFixed(2);
    document.getElementById('breakdownFt').innerText = `${Math.round(result.powerCheck.Ft)} N`;

    const checkEl = document.getElementById('powerCheckStatus');
    if (result.powerCheck.isVerified) {
      checkEl.innerText = currentLang === 'it' ? '✓ Dimensionamento Valido' : '✓ Capacity Verified';
      checkEl.className = "text-[11px] font-mono text-emerald-400 font-semibold";
    } else {
      checkEl.innerText = currentLang === 'it' ? '⚠ Larghezza Massima Superata' : '⚠ Exceeds Catalog Width';
      checkEl.className = "text-[11px] font-mono text-amber-400 font-semibold";
    }
  }

  const meshStatusEl = document.getElementById('teethInMeshStatus');
  if (result.powerCheck.isMeshOptimal) {
    meshStatusEl.innerText = t.meshOptimal || (currentLang === 'it' ? "Ottimale (> 6 denti)" : "Optimal (> 6 teeth)");
    meshStatusEl.className = "text-[11px] text-emerald-400 mt-0.5 font-medium";
  } else {
    meshStatusEl.innerText = `${t.meshWarning || (currentLang === 'it' ? "Denti in presa ridotti" : "Reduced meshing teeth")} (c₁ = ${result.powerCheck.c1})`;
    meshStatusEl.className = "text-[11px] text-amber-400 mt-0.5 font-medium";
  }

  drawBeltScheme(result.dp1, result.dp2, result.exactC_mm);
}
