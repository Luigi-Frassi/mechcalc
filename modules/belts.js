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
  const totalHeightMm = Math.max(dp1, dp2) * 1.3;

  const scaleX = 480 / totalWidthMm;
  const scaleY = 180 / totalHeightMm;
  const scale = Math.min(scaleX, scaleY, 1.2);

  const cx1 = 60 + r1 * scale;
  const cy1 = 120;
  const cx2 = cx1 + C * scale;
  const cy2 = 120;

  const R1 = r1 * scale;
  const R2 = r2 * scale;

  // Centerline & Dimension
  svg.innerHTML += `
    <line x1="${cx1 - R1 - 20}" y1="${cy1}" x2="${cx2 + R2 + 20}" y2="${cy2}" stroke="#334155" stroke-dasharray="6 4" stroke-width="1.5" />
    <line x1="${cx1}" y1="${cy1 + Math.max(R1, R2) + 25}" x2="${cx2}" y2="${cy2 + Math.max(R1, R2) + 25}" stroke="#38bdf8" stroke-width="1.2" />
    <line x1="${cx1}" y1="${cy1}" x2="${cx1}" y2="${cy1 + Math.max(R1, R2) + 30}" stroke="#38bdf8" stroke-width="0.8" stroke-dasharray="2 2" />
    <line x1="${cx2}" y1="${cy2}" x2="${cx2}" y2="${cy2 + Math.max(R1, R2) + 30}" stroke="#38bdf8" stroke-width="0.8" stroke-dasharray="2 2" />
    <text x="${(cx1 + cx2)/2}" y="${cy1 + Math.max(R1, R2) + 40}" fill="#38bdf8" font-size="11" font-weight="bold" font-family="monospace" text-anchor="middle">
      C = ${currentUnit === 'metric' ? C.toFixed(2) + ' mm' : (C / 25.4).toFixed(3) + ' in'}
    </text>
  `;

  // Tangent Calculations
  const alpha = Math.asin(Math.max(-0.999, Math.min(0.999, (r2 - r1) / C)));
  const cosA = Math.cos(alpha);
  const sinA = Math.sin(alpha);

  const t1x_top = cx1 - R1 * sinA;
  const t1y_top = cy1 - R1 * cosA;
  const t2x_top = cx2 - R2 * sinA;
  const t2y_top = cy2 - R2 * cosA;

  const t1x_bot = cx1 - R1 * sinA;
  const t1y_bot = cy1 + R1 * cosA;
  const t2x_bot = cx2 - R2 * sinA;
  const t2y_bot = cy2 + R2 * cosA;

  const beltPath = `
    M ${t1x_top} ${t1y_top}
    L ${t2x_top} ${t2y_top}
    A ${R2} ${R2} 0 0 1 ${t2x_bot} ${t2y_bot}
    L ${t1x_bot} ${t1y_bot}
    A ${R1} ${R1} 0 0 1 ${t1x_top} ${t1y_top}
    Z
  `;

  svg.innerHTML += `
    <path d="${beltPath}" fill="rgba(56, 189, 248, 0.05)" stroke="#38bdf8" stroke-width="3" stroke-linejoin="round" />
    <circle cx="${cx1}" cy="${cy1}" r="${R1}" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" stroke-width="2" />
    <circle cx="${cx1}" cy="${cy1}" r="3" fill="#fbbf24" />
    <text x="${cx1}" y="${cy1 - R1 - 8}" fill="#fbbf24" font-size="11" font-weight="bold" text-anchor="middle">z₁</text>

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

  const L0 = 2 * C0_mm + (Math.PI / 2) * (dp1 + dp2) + Math.pow(dp2 - dp1, 2) / (4 * C0_mm);
  const zb0 = L0 / p;
  const zb = Math.max(z1 + z2 + 2, Math.round(zb0));
  const Lp = zb * p;

  const B = 4 * Lp - 2 * Math.PI * (dp1 + dp2);
  const rad = Math.pow(B, 2) - 32 * Math.pow(dp2 - dp1, 2);
  let exactC_mm = C0_mm;

  if (rad >= 0) {
    exactC_mm = (B + Math.sqrt(rad)) / 16;
  }

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
