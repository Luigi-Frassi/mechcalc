// ==========================================
// MODULE 2: TIMING BELTS & PULLEYS (ISO 5296 / DIN 7721)
// ==========================================

function drawBeltScheme(dp1, dp2, C) {
  const svg = document.getElementById('beltChart');
  if (!svg) return;
  svg.innerHTML = '';

  const r1 = dp1 / 2;
  const r2 = dp2 / 2;
  const totalWidthMm = C + r1 + r2;
  const totalHeightMm = Math.max(dp1, dp2) * 1.4;

  const scaleX = 460 / totalWidthMm;
  const scaleY = 150 / totalHeightMm;
  const scale = Math.min(scaleX, scaleY, 1.1);

  const cx1 = 70 + r1 * scale;
  const cy1 = 110;
  const cx2 = cx1 + C * scale;
  const cy2 = 110;

  const R1 = r1 * scale;
  const R2 = r2 * scale;

  // Angolo di inclinazione del tratto tangente comune
  // sin(gamma) = (R2 - R1) / (C * scale)
  const sinG = Math.max(-0.999, Math.min(0.999, (R2 - R1) / (cx2 - cx1)));
  const gamma = Math.asin(sinG);
  const cosG = Math.cos(gamma);

  // Punti di tangenza geometrici esatti
  // Puleggia 1 (sinistra): tangente stacca verso l'alto/basso con inclinazione gamma
  const p1_top_x = cx1 - R1 * sinG;
  const p1_top_y = cy1 - R1 * cosG;
  const p1_bot_x = cx1 - R1 * sinG;
  const p1_bot_y = cy1 + R1 * cosG;

  // Puleggia 2 (destra): tangente tocca verso l'alto/basso con inclinazione gamma
  const p2_top_x = cx2 - R2 * sinG;
  const p2_top_y = cy2 - R2 * cosG;
  const p2_bot_x = cx2 - R2 * sinG;
  const p2_bot_y = cy2 + R2 * cosG;

  // Arco puleggia 1: angolo < 180° se R1 < R2 (large-arc-flag = 0)
  // Arco puleggia 2: angolo > 180° se R2 > R1 (large-arc-flag = 1)
  const largeArc1 = (R1 >= R2) ? 1 : 0;
  const largeArc2 = (R2 >= R1) ? 1 : 0;

  // Percorso continuo chiuso:
  // 1. Linea retta tangente superiore (da P1 a P2)
  // 2. Arco attorno a Puleggia 2 (senso orario)
  // 3. Linea retta tangente inferiore (da P2 a P1)
  // 4. Arco attorno a Puleggia 1 (senso orario)
  const beltPath = `
    M ${p1_top_x} ${p1_top_y}
    L ${p2_top_x} ${p2_top_y}
    A ${R2} ${R2} 0 ${largeArc2} 1 ${p2_bot_x} ${p2_bot_y}
    L ${p1_bot_x} ${p1_bot_y}
    A ${R1} ${R1} 0 ${largeArc1} 1 ${p1_top_x} ${p1_top_y}
    Z
  `;

  // 1. Asse mediano e quotatura interasse
  const dimY = cy1 + Math.max(R1, R2) + 26;
  svg.innerHTML += `
    <line x1="${cx1 - R1 - 25}" y1="${cy1}" x2="${cx2 + R2 + 25}" y2="${cy2}" stroke="#334155" stroke-dasharray="6 4" stroke-width="1.2" />
    <line x1="${cx1}" y1="${cy1}" x2="${cx1}" y2="${dimY + 8}" stroke="#0284c7" stroke-width="0.8" stroke-dasharray="2 2" />
    <line x1="${cx2}" y1="${cy2}" x2="${cx2}" y2="${dimY + 8}" stroke="#0284c7" stroke-width="0.8" stroke-dasharray="2 2" />
    <line x1="${cx1}" y1="${dimY}" x2="${cx2}" y2="${dimY}" stroke="#38bdf8" stroke-width="1.2" />
    <polygon points="${cx1},${dimY} ${cx1+6},${dimY-3} ${cx1+6},${dimY+3}" fill="#38bdf8" />
    <polygon points="${cx2},${dimY} ${cx2-6},${dimY-3} ${cx2-6},${dimY+3}" fill="#38bdf8" />
    <text x="${(cx1 + cx2)/2}" y="${dimY + 18}" fill="#38bdf8" font-size="11" font-weight="bold" font-family="monospace" text-anchor="middle">
      C = ${currentUnit === 'metric' ? C.toFixed(2) + ' mm' : (C / 25.4).toFixed(3) + ' in'}
    </text>
  `;

  // 2. Cinghia (anello teso esterno)
  svg.innerHTML += `
    <path d="${beltPath}" fill="rgba(56, 189, 248, 0.08)" stroke="#38bdf8" stroke-width="3" stroke-linejoin="round" />
  `;

  // 3. Puleggia 1 (Motrice z1)
  svg.innerHTML += `
    <circle cx="${cx1}" cy="${cy1}" r="${R1}" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" stroke-width="2" />
    <circle cx="${cx1}" cy="${cy1}" r="3" fill="#fbbf24" />
    <text x="${cx1}" y="${cy1 - R1 - 8}" fill="#fbbf24" font-size="11" font-weight="bold" text-anchor="middle">z₁</text>
  `;

  // 4. Puleggia 2 (Condotta z2)
  svg.innerHTML += `
    <circle cx="${cx2}" cy="${cy2}" r="${R2}" fill="rgba(168, 85, 247, 0.15)" stroke="#a855f7" stroke-width="2" />
    <circle cx="${cx2}" cy="${cy2}" r="3" fill="#a855f7" />
    <text x="${cx2}" y="${cy2 - R2 - 8}" fill="#a855f7" font-size="11" font-weight="bold" text-anchor="middle">z₂</text>
  `;
}

function calculateBelts() {
  const pRaw = document.getElementById('beltProfile').value;
  const p = parseFloat(pRaw);
  const z1 = parseInt(document.getElementById('pulleyZ1').value) || 20;
  const z2 = parseInt(document.getElementById('pulleyZ2').value) || 40;
  const c0Input = parseFloat(document.getElementById('desiredCenter').value) || 150;
  const t = translations[currentLang];

  const C0_mm = currentUnit === 'metric' ? c0Input : c0Input * 25.4;

  const dp1 = (z1 * p) / Math.PI;
  const dp2 = (z2 * p) / Math.PI;

  const dp1Str = currentUnit === 'metric' ? `${dp1.toFixed(2)} mm` : `${(dp1 / 25.4).toFixed(3)} in`;
  const dp2Str = currentUnit === 'metric' ? `${dp2.toFixed(2)} mm` : `${(dp2 / 25.4).toFixed(3)} in`;
  document.getElementById('dp1Info').innerText = `dp₁: ${dp1Str}`;
  document.getElementById('dp2Info').innerText = `dp₂: ${dp2Str}`;

  const ratio = z2 / z1;
  document.getElementById('ratioInfo').innerText = `Ratio: 1 : ${ratio.toFixed(2)}`;
  document.getElementById('ratioCardDisp').innerText = `Reduction: ${ratio.toFixed(3)}`;

  const minTheoreticalC = (dp1 + dp2) / 2 + 2;
  if (C0_mm <= minTheoreticalC) {
    document.getElementById('exactCenterDisp').innerText = "--";
    document.getElementById('centerDiffDisp').innerText = t.centerTooSmall;
    document.getElementById('centerDiffDisp').className = "text-[11px] text-rose-400 mt-0.5 font-medium";
    document.getElementById('beltTeethDisp').innerText = "--";
    document.getElementById('teethInMeshDisp').innerText = "--";
    document.getElementById('wrapAngleDisp').innerText = "--";
    document.getElementById('beltChart').innerHTML = '';
    return;
  }

  document.getElementById('centerDiffDisp').className = "text-[11px] text-slate-500 mt-0.5";

  // 1. Sviluppo primitivo teorico L0
  const L0 = 2 * C0_mm + (Math.PI / 2) * (dp1 + dp2) + Math.pow(dp2 - dp1, 2) / (4 * C0_mm);

  // 2. Numero denti commerciale arrotondato
  const zb0 = L0 / p;
  const zb = Math.max(z1 + z2 + 2, Math.round(zb0));
  const Lp = zb * p;

  // 3. Risoluzione quadratica esatta dell'interasse C
  const B = 4 * Lp - 2 * Math.PI * (dp1 + dp2);
  const rad = Math.pow(B, 2) - 32 * Math.pow(dp2 - dp1, 2);
  let exactC_mm = C0_mm;

  if (rad >= 0) {
    exactC_mm = (B + Math.sqrt(rad)) / 16;
  }

  // 4. Angolo di contatto e denti in presa sulla puleggia minore
  const wrapRad1 = Math.PI - 2 * Math.asin(Math.min(1, Math.abs(dp2 - dp1) / (2 * exactC_mm)));
  const wrapDeg1 = (wrapRad1 * 180) / Math.PI;
  const z_mesh = (z1 * (wrapDeg1 / 360));

  const cDiff = exactC_mm - C0_mm;
  const signDiff = cDiff >= 0 ? `+` : ``;

  if (currentUnit === 'metric') {
    document.getElementById('exactCenterDisp').innerText = `${exactC_mm.toFixed(2)} mm`;
    document.getElementById('centerDiffDisp').innerText = `Δ: ${signDiff}${cDiff.toFixed(2)} mm vs target`;
    document.getElementById('beltPitchLengthDisp').innerText = `Lp: ${Lp.toFixed(2)} mm`;
  } else {
    document.getElementById('exactCenterDisp').innerText = `${(exactC_mm / 25.4).toFixed(3)} in`;
    document.getElementById('centerDiffDisp').innerText = `Δ: ${signDiff}${(cDiff / 25.4).toFixed(3)} in vs target`;
    document.getElementById('beltPitchLengthDisp').innerText = `Lp: ${(Lp / 25.4).toFixed(3)} in`;
  }

  document.getElementById('beltTeethDisp').innerText = `${zb} ${currentLang === 'it' ? 'denti' : 'teeth'}`;
  document.getElementById('wrapAngleDisp').innerText = `${wrapDeg1.toFixed(1)}°`;
  document.getElementById('teethInMeshDisp').innerText = `${z_mesh.toFixed(1)} ${currentLang === 'it' ? 'denti' : 'teeth'}`;

  const meshStatusEl = document.getElementById('teethInMeshStatus');
  if (z_mesh >= 6) {
    meshStatusEl.innerText = t.meshOptimal;
    meshStatusEl.className = "text-[11px] text-emerald-400 mt-0.5 font-medium";
  } else {
    meshStatusEl.innerText = t.meshWarning;
    meshStatusEl.className = "text-[11px] text-amber-400 mt-0.5 font-medium";
  }

  drawBeltScheme(dp1, dp2, exactC_mm);
}
