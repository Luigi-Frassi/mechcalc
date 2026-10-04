// ============================================================================
// MODULE 3: CYLINDRICAL GEARS (HERTZ & LEWIS)
// UI: reads inputs, keeps the selection state, calls the core (core/gears-core.js),
// writes results, builds the optimizer table and draws the SVG scheme.
// ============================================================================

let selectedAlternativeModule = null;
let autoOptCombos = [];
let selectedComboIdx = 0;
let lastGearState = null;   // inputs and results of the last calculation, read by the calculation report

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

  svg.innerHTML += `<line x1="${cx1 - R1 - 20}" y1="${cy}" x2="${cx2 + R2 + 20}" y2="${cy}" stroke="#334155" stroke-dasharray="6 4" stroke-width="1.2" />`;
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
  svg.innerHTML += `<circle cx="${contactX}" cy="${cy}" r="3.5" fill="#38bdf8" />`;
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

// ========================================================
// MODALITÀ 2: VERIFICA INVERSA (W_MAX)
// ========================================================
function renderGearWmax(isIt) {
  const toothType = document.getElementById('gwToothType')?.value || 'spur';
  const params = {
    toothType,
    m_input: parseFloat(document.getElementById('gwModule')?.value) || 5.0,
    L_mm: parseFloat(document.getElementById('gwFaceWidth')?.value) || 60.0,
    z1: parseInt(document.getElementById('gwZ1')?.value) || 23,
    z2: parseInt(document.getElementById('gwZ2')?.value) || 39,
    n1: parseFloat(document.getElementById('gwSpeed')?.value) || 650.0,
    alphaDeg: (toothType === 'helical') ? (parseFloat(document.getElementById('gwAlpha')?.value) || 15.0) : 0.0,
    Ke_GPa: parseFloat(document.getElementById('gwKe')?.value) || 35.0,
    sigmaH_lim: parseFloat(document.getElementById('gwSigmaH')?.value) || 721.52,
    sigmaL_lim: parseFloat(document.getElementById('gwSigmaL')?.value) || 400.0,
    xr1: parseFloat(document.getElementById('gwXr1')?.value) || 0.0
  };
  const r = computeGearWmax(params);
  lastGearState = { mode: 'wmax', params, r };

  const pDisp = document.getElementById('gwPmaxDisp');
  if (pDisp) pDisp.innerText = `${r.P_kW_max.toFixed(2)} kW`;

  const pLimStatus = document.getElementById('gwLimitingFactor');
  if (pLimStatus) {
    if (r.limitedBy === 'hertz') {
      pLimStatus.innerText = isIt ? 'Limitato da Usura (Hertz)' : 'Limited by Pitting (Hertz)';
      pLimStatus.className = 'text-[11px] text-amber-400 font-semibold';
    } else {
      pLimStatus.innerText = isIt ? 'Limitato da Flessione (Lewis)' : 'Limited by Bending (Lewis)';
      pLimStatus.className = 'text-[11px] text-sky-400 font-semibold';
    }
  }

  const tqDisp = document.getElementById('gwTorqueMaxDisp');
  if (tqDisp) tqDisp.innerText = `${r.M1_max.toFixed(1)} Nm`;

  const hertzLimitDisp = document.getElementById('gwHertzCapDisp');
  if (hertzLimitDisp) hertzLimitDisp.innerText = `${r.P_kW_H.toFixed(2)} kW`;

  const lewisLimitDisp = document.getElementById('gwLewisCapDisp');
  if (lewisLimitDisp) lewisLimitDisp.innerText = `${r.P_kW_L.toFixed(2)} kW`;

  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  setTxt('gwBkDp1', `${r.dp1.toFixed(1)} mm`);
  setTxt('gwBkDp2', `${r.dp2.toFixed(1)} mm`);
  setTxt('gwBkCenter', `${r.a_center.toFixed(2)} mm`);
  setTxt('gwBkFcMax', `${Math.round(r.Fc_max)} N`);
  setTxt('gwBkY', `${r.yLewis.toFixed(3)}`);
  setTxt('gwBkPhi', `${r.phi.toFixed(2)}`);

  drawGearScheme(r.dp1, r.dp2, r.a_center);
}

function renderGearOptTable(gearType, isIt) {
  const tbody = document.getElementById('fixedOptTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (autoOptCombos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-slate-500">${isIt ? 'Nessuna combinazione valida trovata entro i limiti di resistenza (Lewis) e α ≤ 40°.' : 'No valid combinations found within Lewis bending limits and α ≤ 40°.'}</td></tr>`;
    return;
  }
  autoOptCombos.forEach((c, idx) => {
    const isSelected = (idx === selectedComboIdx);
    const isOptimalPhi = (c.phi >= 0.50 && c.phi <= 1.00);
    const phiBadgeClass = isOptimalPhi ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold';
    const lewisBadgeClass = (c.sigmaL <= 800) ? 'text-emerald-400' : 'text-rose-400';

    const tr = document.createElement('tr');
    tr.className = `cursor-pointer transition-colors ${isSelected ? 'bg-blue-900/40 text-white font-semibold' : 'hover:bg-slate-800/60 text-slate-300'}`;
    tr.onclick = () => {
      selectedComboIdx = idx;
      calculateGears();
    };

    const toothInfo = (gearType === 'helical')
      ? `<span class="text-amber-400 font-bold">z₁=${c.z1}</span>, <span class="text-purple-400 font-bold">z₂=${c.z2}</span> <span class="text-[10px] text-slate-400">(mn=${c.m}, α=${c.alpha.toFixed(1)}°)</span>`
      : `<span class="text-blue-400 font-bold">z₁=${c.z1}</span>, <span class="text-purple-400 font-bold">z₂=${c.z2}</span> <span class="text-[10px] text-slate-400">(m=${c.m})</span>`;

    tr.innerHTML = `
            <td class="p-2.5 font-mono">${toothInfo}</td>
            <td class="p-2.5 font-mono">${c.tau.toFixed(3)}</td>
            <td class="p-2.5 font-mono ${c.err < 1.0 ? 'text-emerald-400' : 'text-slate-300'}">±${c.err.toFixed(2)}%</td>
            <td class="p-2.5 font-mono text-slate-300">i = ${c.i.toFixed(1)} mm</td>
            <td class="p-2.5 font-mono ${phiBadgeClass}">ϕ = ${c.phi.toFixed(2)} (${c.L.toFixed(1)} mm)</td>
            <td class="p-2.5 font-mono ${lewisBadgeClass}">${Math.round(c.sigmaL)} MPa</td>
            <td class="p-2.5 text-right font-mono text-xs">
              <span class="px-2 py-0.5 rounded text-[10px] ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}">
                ${isSelected ? (isIt ? '✓ Attiva' : '✓ Active') : (isIt ? 'Seleziona' : 'Select')}
              </span>
            </td>
          `;
    tbody.appendChild(tr);
  });
}

function calculateGears() {
  const isIt = (typeof currentLang !== 'undefined' && currentLang === 'it');
  const gearsOpMode = (typeof currentGearOpMode !== 'undefined') ? currentGearOpMode : 'design';

  if (gearsOpMode === 'wmax') {
    renderGearWmax(isIt);
    return;
  }

  // ========================================================
  // MODALITÀ 1: PROGETTO DIRETTO (SINTESI)
  // ========================================================
  const toothSelect = document.getElementById('gearToothType');
  if (!toothSelect) return;
  const gearType = toothSelect.value;

  const loadModeEl = document.querySelector('input[name="gearLoadMode"]:checked');
  const geomModeEl = document.querySelector('input[name="gearGeomMode"]:checked');
  const loadMode = loadModeEl ? loadModeEl.value : 'power';
  const geomMode = geomModeEl ? geomModeEl.value : 'tau';

  const isAutoZ = document.getElementById('toggleAutoZ')?.checked || false;
  const isLockM = document.getElementById('toggleLockM')?.checked || false;
  const isLockL = document.getElementById('toggleLockL')?.checked || false;

  // Carico
  const load = (loadMode === 'power')
    ? computeGearLoad('power', {
        P_kW: parseFloat(document.getElementById('gearPower')?.value) || 5.5,
        n1_rpm: parseFloat(document.getElementById('gearSpeed')?.value) || 1450.0
      })
    : computeGearLoad('torque', {
        M1_input: parseFloat(document.getElementById('gearTorqueInput')?.value) || 36.2,
        n1_rpm: parseFloat(document.getElementById('gearSpeed')?.value) || 1450.0
      });
  const { omega1, W_watt, M1_Nm } = load;

  const omegaEl = document.getElementById('gearOmegaCalc');
  if (omegaEl) {
    omegaEl.innerText = (loadMode === 'power')
      ? `ω₁ = ${omega1.toFixed(1)} rad/s | M₁ = ${M1_Nm.toFixed(1)} Nm`
      : `P = ${(W_watt / 1000).toFixed(2)} kW | ω₁ = ${omega1.toFixed(1)} rad/s`;
  }

  // Materiale e geometria
  const Ke_GPa = parseFloat(document.getElementById('gearKeInput')?.value) || 35.0;
  const Ke_N_mm2 = Ke_GPa * 1000.0;
  const sigmaH_lim = parseFloat(document.getElementById('gearSigmaH')?.value) || 550.0;
  const xr1 = parseFloat(document.getElementById('gearXr1')?.value) || 0.0;
  const W_N_mm_s = W_watt * 1000.0;
  const lockedM = parseFloat(document.getElementById('gearLockedMVal')?.value) || 2.5;
  const lockedL = parseFloat(document.getElementById('gearLockedLVal')?.value) || 30.0;
  const targetI = parseFloat(document.getElementById('gearTargetCenter')?.value) || 100.0;

  const z_min = gearZminRounded(xr1);

  // Valori di partenza se l'ottimizzatore non trova combinazioni
  let z1 = parseInt(document.getElementById('gearZ1')?.value) || 20;
  let z2 = 40;
  let tau = 0.5;

  const optTableCard = document.getElementById('gearFixedOptTableCard');
  const supportsAutoZ = (geomMode === 'tau' || geomMode === 'center') && isAutoZ;
  let activeCombo = null;

  if (supportsAutoZ) {
    if (optTableCard) optTableCard.classList.remove('hidden');

    autoOptCombos = optimizeGearCombos({
      gearType, geomMode,
      targetTau: normalizeGearTau(parseFloat(document.getElementById('gearTargetTau')?.value) || 0.5),
      tolPct: parseFloat(document.getElementById('gearTauTolVal')?.value) || 3.0,
      targetI,
      moduleScanList: isLockM ? [lockedM] : STANDARD_MODULES.map(item => item.m),
      isLockL, lockedL,
      z_min, xr1, Ke_N_mm2, W_N_mm_s, M1_Nm, omega1, sigmaH_lim
    });

    if (selectedComboIdx >= autoOptCombos.length) selectedComboIdx = 0;

    renderGearOptTable(gearType, isIt);

    if (autoOptCombos.length > 0) {
      activeCombo = autoOptCombos[selectedComboIdx];
      z1 = activeCombo.z1;
      z2 = activeCombo.z2;
      tau = activeCombo.tau;
    }

    // Feedback under the target ratio: the combination currently selected in the table
    const geomElAuto = document.getElementById('gearGeomFeedback');
    if (geomElAuto) {
      geomElAuto.innerText = activeCombo
        ? `z₁ = ${z1}, z₂ = ${z2} (τ = ${tau.toFixed(3)}, err: ±${activeCombo.err.toFixed(2)}%)`
        : '--';
    }
  } else {
    if (optTableCard) optTableCard.classList.add('hidden');

    const geomEl = document.getElementById('gearGeomFeedback');
    if (geomMode === 'teeth') {
      z2 = parseInt(document.getElementById('gearZ2')?.value) || 40;
      tau = z1 / z2;
      if (geomEl) geomEl.innerText = `z₁ = ${z1}, z₂ = ${z2} (τ = ${tau.toFixed(3)})`;
    } else {
      const targetTau = normalizeGearTau(parseFloat(document.getElementById('gearTargetTau')?.value) || 0.5);
      const pair = gearZ2FromTau(z1, targetTau);
      z2 = pair.z2;
      tau = pair.tau;
      if (geomMode === 'tau') {
        const signErr = pair.errPct >= 0 ? '+' : '';
        if (geomEl) geomEl.innerText = `z₁ = ${z1}, z₂ = ${z2} (τ = ${tau.toFixed(3)}, err: ${signErr}${pair.errPct.toFixed(1)}%)`;
      } else {
        if (geomEl) geomEl.innerText = `z₁ = ${z1}, z₂ = ${z2} | i_target = ${targetI.toFixed(1)} mm`;
      }
    }
  }

  // ========================================================
  // CALCOLO DEFINITIVO DEI RISULTATI DELLA TRASMISSIONE
  // ========================================================
  const r = computeGearDesign({
    gearType, geomMode, z1, z2, tau, z_min, xr1,
    Ke_N_mm2, W_N_mm_s, M1_Nm, omega1, sigmaH_lim,
    isLockM, lockedM, isLockL, lockedL, targetI,
    supportsAutoZ, activeCombo,
    useRecommended: selectedAlternativeModule === 'recommended'
  });

  lastGearState = {
    mode: 'design', gearType, loadMode, geomMode, isAutoZ, isLockM, isLockL, load, Ke_GPa, sigmaH_lim, xr1,
    z1, z2, tau, targetI, lockedM, lockedL, supportsAutoZ, activeCombo,
    targetTau: normalizeGearTau(parseFloat(document.getElementById('gearTargetTau')?.value) || 0.5),
    combos: supportsAutoZ ? autoOptCombos.slice() : [], selectedComboIdx, r
  };

  const helicalDetails = document.getElementById('helicalStepDetails');
  if (helicalDetails) {
    if (gearType === 'helical') helicalDetails.classList.remove('hidden');
    else helicalDetails.classList.add('hidden');
  }

  // Box comparativo Serie 3
  const compCard = document.getElementById('gearSeries3ComparisonCard');
  if (compCard) {
    if (r.series3) {
      const s3 = r.series3;
      compCard.classList.remove('hidden');

      document.getElementById('s3ModStrictVal').innerText = `m = ${r.strictModuleObj.m.toFixed(2)} mm`;
      document.getElementById('s3PhiStrictVal').innerText = `ϕ = ${s3.phiStrict.toFixed(2)} (L = ${s3.LStrict.toFixed(1)} mm)`;

      document.getElementById('s3ModRecVal').innerText = `m = ${r.recommendedModuleObj.m.toFixed(2)} mm (${r.recommendedModuleObj.serie === 1 ? 'Serie 1 UNI' : 'Serie 2'})`;
      document.getElementById('s3PhiRecVal').innerText = `ϕ = ${s3.phiRec.toFixed(2)} (L = ${s3.LRec.toFixed(1)} mm)`;

      const recStatusEl = document.getElementById('s3RecLimitStatus');
      if (s3.canWorkAtLimitRec) {
        recStatusEl.innerText = isIt ? '✓ Lavora al limite di Hertz in intervallo ottimale (ϕ ≥ 0.50)' : '✓ Works at Hertz limit in optimal range (ϕ ≥ 0.50)';
        recStatusEl.className = 'text-[11px] text-emerald-400 font-semibold';
      } else {
        recStatusEl.innerText = isIt ? '⚠ Fascia sottile (ϕ < 0.50, denti tozzi)' : '⚠ Narrow face width (ϕ < 0.50)';
        recStatusEl.className = 'text-[11px] text-amber-400 font-semibold';
      }

      const btnStrict = document.getElementById('btnAdoptStrict');
      const btnRec = document.getElementById('btnAdoptRecommended');
      if (r.activeModuleObj === r.strictModuleObj) {
        btnStrict.className = 'px-3 py-1.5 rounded-lg bg-rose-600/30 border border-rose-500 text-rose-300 font-semibold text-xs transition-all';
        btnRec.className = 'px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-xs transition-all';
      } else {
        btnRec.className = 'px-3 py-1.5 rounded-lg bg-emerald-600/30 border border-emerald-500 text-emerald-300 font-semibold text-xs transition-all';
        btnStrict.className = 'px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-xs transition-all';
      }
    } else {
      compCard.classList.add('hidden');
    }
  }

  // Risultati principali UI
  const modDisp = document.getElementById('gearModuleDisp');
  if (modDisp) {
    if (gearType === 'helical') {
      modDisp.innerText = `mn = ${r.mn.toFixed(2)} (α = ${r.alphaDeg.toFixed(1)}°)`;
    } else {
      modDisp.innerText = `m = ${r.m_norm.toFixed(2)} mm`;
    }
  }

  const catEl = document.getElementById('gearModuleCategory');
  if (catEl) {
    const teethInfo = `z₁ = ${z1}, z₂ = ${z2}`;
    if (r.activeModuleObj.cat === 'green') {
      catEl.innerText = isIt ? `Serie 1 Consigliata | ${teethInfo}` : `Series 1 Recommended | ${teethInfo}`;
      catEl.className = 'text-[11px] text-emerald-400 font-medium';
    } else if (r.activeModuleObj.cat === 'orange') {
      catEl.innerText = isIt ? `Serie 2 Sconsigliata | ${teethInfo}` : `Series 2 Discouraged | ${teethInfo}`;
      catEl.className = 'text-[11px] text-amber-400 font-medium';
    } else {
      catEl.innerText = isIt ? `Serie 3 Sconsigliata | ${teethInfo}` : `Series 3 Discouraged | ${teethInfo}`;
      catEl.className = 'text-[11px] text-rose-400 font-medium';
    }
  }

  const phiDisp = document.getElementById('gearPhiDisp');
  if (phiDisp) phiDisp.innerText = `ϕ = ${r.phi.toFixed(2)}`;

  const phiStatus = document.getElementById('gearPhiStatus');
  if (phiStatus) {
    if (r.phiOk) {
      phiStatus.innerText = isIt ? `Ottimale (L = ${r.L_face.toFixed(1)} mm)` : `Optimal (L = ${r.L_face.toFixed(1)} mm)`;
      phiStatus.className = 'text-[11px] text-emerald-400 font-medium';
    } else {
      phiStatus.innerText = isIt ? `⚠ Fuori range [0.5, 1.0] (L = ${r.L_face.toFixed(1)} mm)` : `⚠ Out of range [0.5, 1.0] (L = ${r.L_face.toFixed(1)} mm)`;
      phiStatus.className = 'text-[11px] text-amber-400 font-medium';
    }
  }

  const lewisDisp = document.getElementById('gearLewisDisp');
  if (lewisDisp) lewisDisp.innerText = `${Math.round(r.sigma_L)} MPa`;

  const lewisStatus = document.getElementById('gearLewisStatus');
  if (lewisStatus) {
    if (r.lewisOk) {
      lewisStatus.innerText = isIt ? '✓ Ammissibile (σL ≤ 800 MPa)' : '✓ Verified (σL ≤ 800 MPa)';
      lewisStatus.className = 'text-[11px] text-emerald-400 font-semibold';
    } else {
      lewisStatus.innerText = isIt ? '⚠ Eccessiva (σL > 800 MPa)' : '⚠ High stress (σL > 800 MPa)';
      lewisStatus.className = 'text-[11px] text-amber-400 font-semibold';
    }
  }

  const centerDisp = document.getElementById('gearCenterDisp');
  if (centerDisp) centerDisp.innerText = `${r.a_center.toFixed(2)} mm`;

  const centerSub = document.getElementById('gearCenterSub');
  if (centerSub) centerSub.innerText = `dp₁: ${r.dp1.toFixed(1)} | dp₂: ${r.dp2.toFixed(1)} mm (z₁: ${z1}, z₂: ${z2})`;

  // Breakdown analitico
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  setTxt('bkMmin', `${r.m_min.toFixed(2)} mm`);
  setTxt('bkMnorm', `${r.m_norm.toFixed(2)} mm (z₁: ${z1}, z₂: ${z2})`);
  setTxt('bkPhiLim', `${r.phi.toFixed(3)}`);
  setTxt('bkLface', `${r.L_face.toFixed(1)} mm`);
  setTxt('bkFc', `${Math.round(r.Fc)} N`);
  setTxt('bkYlewis', `${r.yLewis.toFixed(3)}`);
  setTxt('bkSigmaL', `${Math.round(r.sigma_L)} MPa`);

  const bkUnder = document.getElementById('bkUndercut');
  if (bkUnder) {
    if (r.undercutOk) {
      bkUnder.innerText = isIt ? `z_eq ≥ z_min (${r.z_min.toFixed(1)}) → Ok` : `z_eq ≥ z_min (${r.z_min.toFixed(1)}) → Pass`;
      bkUnder.className = 'text-emerald-400 font-bold';
    } else {
      bkUnder.innerText = isIt ? `z_eq < z_min (${r.z_min.toFixed(1)}) → Sottotaglio!` : `z_eq < z_min (${r.z_min.toFixed(1)}) → Undercut!`;
      bkUnder.className = 'text-amber-400 font-bold';
    }
  }

  if (gearType === 'helical') {
    setTxt('bkAlpha', `${r.alphaDeg.toFixed(1)}°`);
    setTxt('bkPhiCorr', `${r.factors.Phi.toFixed(3)}`);
    setTxt('bkPsiCorr', `${r.factors.Psi.toFixed(3)}`);
    setTxt('bkGammaT', `${r.factors.Gamma_T.toFixed(3)} (${r.factors.Gamma_T1.toFixed(2)}+${r.factors.Gamma_T2.toFixed(2)})`);
  }

  drawGearScheme(r.dp1, r.dp2, r.a_center);
}

function selectSeries3Solution(type) {
  selectedAlternativeModule = type;
  calculateGears();
}
