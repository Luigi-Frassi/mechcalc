// ==========================================
// MODULE 1: ISO FITS & TOLERANCES (UI LAYER)
// ==========================================

const fitsRa = {
  'H7/f7': { shaftRa: 'Ra 1.6 µm / 63 µin', holeRa: 'Ra 1.6-3.2 µm / 63-125 µin' },
  'H7/g6': { shaftRa: 'Ra 0.8 µm / 32 µin', holeRa: 'Ra 1.6 µm / 63 µin' },
  'H7/h6': { shaftRa: 'Ra 0.8 µm / 32 µin', holeRa: 'Ra 1.6 µm / 63 µin' },
  'H7/js6': { shaftRa: 'Ra 0.8 µm / 32 µin', holeRa: 'Ra 1.6 µm / 63 µin' },
  'H7/k6': { shaftRa: 'Ra 0.8 µm / 32 µin', holeRa: 'Ra 1.6 µm / 63 µin' },
  'H7/p6': { shaftRa: 'Ra 0.4-0.8 µm / 16-32 µin', holeRa: 'Ra 0.8-1.6 µm / 32-63 µin' }
};

function populateSelect() {
  const select = document.getElementById('fitType');
  if (!select) return;
  const cur = select.value || 'H7/g6';
  select.innerHTML = '';
  const t = translations[currentLang].fits;
  for (const [key, val] of Object.entries(t)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.innerText = val.label;
    if (key === cur) opt.selected = true;
    select.appendChild(opt);
  }
}

function formatDeviation(valMicron) {
  if (currentUnit === 'metric') {
    return (valMicron >= 0 ? `+${valMicron}` : `${valMicron}`) + " µm";
  } else {
    const thou = (valMicron / 25.4).toFixed(2);
    return (valMicron >= 0 ? `+${thou}` : `${thou}`) + " thou";
  }
}

function formatDim(dMm, devMicron) {
  if (currentUnit === 'metric') {
    return (dMm + devMicron / 1000).toFixed(3) + " mm";
  } else {
    return ((dMm + devMicron / 1000) / 25.4).toFixed(4) + " in";
  }
}

function drawToleranceChart(es_h, ei_h, es_s, ei_s) {
  const svg = document.getElementById('toleranceChart');
  if (!svg) return;
  svg.innerHTML = '';

  const minVal = Math.min(ei_s, ei_h);
  const maxVal = Math.max(es_s, es_h);
  const span = Math.max(Math.abs(minVal), Math.abs(maxVal), 25);
  const padding = span * 0.35;
  const totalRange = span + padding;

  const zeroY = 120;
  const scale = 85 / totalRange;
  const yForVal = (v) => zeroY - (v * scale);

  svg.innerHTML += `
    <line x1="50" y1="${zeroY}" x2="550" y2="${zeroY}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4 4" />
    <text x="555" y="${zeroY + 4}" fill="#94a3b8" font-size="11" font-family="monospace">0</text>
  `;

  const hTop = yForVal(es_h);
  const hBottom = yForVal(ei_h);
  const hHeight = Math.max(Math.abs(hBottom - hTop), 2);
  const holeText = currentLang === 'it' ? 'FORO' : 'HOLE';
  svg.innerHTML += `
    <rect x="180" y="${hTop}" width="100" height="${hHeight}" fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" stroke-width="2" rx="4" />
    <text x="230" y="${hTop - 8}" fill="#38bdf8" font-size="11" font-weight="bold" text-anchor="middle">${formatDeviation(es_h)}</text>
    <text x="230" y="${hBottom + 16}" fill="#38bdf8" font-size="11" text-anchor="middle">${formatDeviation(0)}</text>
    <text x="230" y="${hTop + (hHeight / 2) + 4}" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">${holeText} (H7)</text>
  `;

  const sTop = yForVal(es_s);
  const sBottom = yForVal(ei_s);
  const sHeight = Math.max(Math.abs(sBottom - sTop), 2);
  const shaftClass = document.getElementById('shaftClassLabel').innerText.toUpperCase();
  const shaftText = currentLang === 'it' ? 'ALBERO' : 'SHAFT';
  svg.innerHTML += `
    <rect x="320" y="${sTop}" width="100" height="${sHeight}" fill="rgba(251, 191, 36, 0.25)" stroke="#fbbf24" stroke-width="2" rx="4" />
    <text x="370" y="${sTop - 8}" fill="#fbbf24" font-size="11" font-weight="bold" text-anchor="middle">${formatDeviation(es_s)}</text>
    <text x="370" y="${sBottom + 16}" fill="#fbbf24" font-size="11" text-anchor="middle">${formatDeviation(ei_s)}</text>
    <text x="370" y="${sTop + (sHeight / 2) + 4}" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">${shaftText} (${shaftClass})</text>
  `;
}

function updateComparisonTable(dMm, step, activeFit) {
  const tbody = document.getElementById('comparisonTableBody');
  if (!tbody || !window.MechCalcFitsCore) return;
  tbody.innerHTML = '';
  
  const fitsKeys = window.MechCalcFitsCore.STANDARD_FITS;
  const t = translations[currentLang];
  const ES_H = step.it7;

  fitsKeys.forEach(fitKey => {
    const sClass = fitKey.split('/')[1];
    const devs = window.MechCalcFitsCore.getShaftDeviations(step, sClass);
    const maxPlay = ES_H - devs.ei;
    const minPlay = 0 - devs.es;
    
    let typeStr = "", minMaxStr = "", badgeColor = "";
    if (minPlay >= 0) {
      typeStr = t.clearanceFit;
      badgeColor = "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30";
      minMaxStr = `${formatDeviation(minPlay)} / ${formatDeviation(maxPlay)}`;
    } else if (maxPlay <= 0) {
      typeStr = t.interferenceFit;
      badgeColor = "text-rose-400 bg-rose-500/10 border border-rose-500/30";
      minMaxStr = `${formatDeviation(Math.abs(maxPlay))} / ${formatDeviation(Math.abs(minPlay))}`;
    } else {
      typeStr = t.transitionFit;
      badgeColor = "text-amber-400 bg-amber-500/10 border border-amber-500/30";
      minMaxStr = `-${formatDeviation(Math.abs(minPlay))} / +${formatDeviation(maxPlay)}`;
    }

    const isSelected = (fitKey === activeFit);
    const row = document.createElement('tr');
    row.className = `cursor-pointer transition-colors ${isSelected ? 'bg-blue-600/20 text-white font-bold' : 'hover:bg-slate-800/60'}`;
    row.innerHTML = `
      <td class="p-2.5 font-sans font-semibold">${fitKey}</td>
      <td class="p-2.5">${formatDeviation(devs.es)} / ${formatDeviation(devs.ei)}</td>
      <td class="p-2.5 font-sans"><span class="px-2 py-0.5 rounded text-[10px] ${badgeColor}">${typeStr}</span></td>
      <td class="p-2.5">${minMaxStr}</td>
      <td class="p-2.5 text-right font-sans">
        <button class="px-2 py-1 bg-slate-800 hover:bg-blue-600 rounded text-[11px] text-slate-300 hover:text-white transition-colors">
          ${isSelected ? t.btnActive : t.btnSelect}
        </button>
      </td>
    `;
    row.addEventListener('click', () => {
      document.getElementById('fitType').value = fitKey;
      if (currentMode === 'reverse') setMode('direct');
      calculateFits();
    });
    tbody.appendChild(row);
  });
}

function calculateFits() {
  const inputEl = document.getElementById('nominalDiameter');
  if (!inputEl || !window.MechCalcFitsCore) return;

  let dVal = parseFloat(inputEl.value.trim());
  const t = translations[currentLang];
  const stepInfoEl = document.getElementById('stepInfo');

  let dMm = currentUnit === 'metric' ? dVal : dVal * 25.4;
  const step = window.MechCalcFitsCore.getISOStep(dMm);

  if (!step) {
    inputEl.classList.add('border-rose-500', 'focus:ring-rose-500');
    inputEl.classList.remove('border-slate-700', 'focus:ring-blue-500');
    stepInfoEl.className = "text-xs text-rose-400 mt-1.5 font-medium";
    stepInfoEl.innerText = t.outOfRange;

    document.getElementById('holeDisp').innerText = "--";
    document.getElementById('holeDims').innerText = "--";
    document.getElementById('shaftDisp').innerText = "--";
    document.getElementById('shaftDims').innerText = "--";
    document.getElementById('fitResult').innerText = "--";
    document.getElementById('fitCategory').innerText = t.invalidInput;
    document.getElementById('toleranceChart').innerHTML = '';
    document.getElementById('comparisonTableBody').innerHTML = '';
    return;
  }

  inputEl.classList.remove('border-rose-500', 'focus:ring-rose-500');
  inputEl.classList.add('border-slate-700', 'focus:ring-blue-500');
  stepInfoEl.className = "text-xs text-slate-500 mt-1.5";

  const stepLabel = currentUnit === 'metric'
    ? `${t.stepOver} ${step.min} ${t.stepUpTo} ${step.max} mm`
    : `${t.stepOver} ${(step.min / 25.4).toFixed(3)} ${t.stepUpTo} ${(step.max / 25.4).toFixed(3)} in`;
  stepInfoEl.innerText = stepLabel;

  let fit = document.getElementById('fitType').value;

  // Ricerca inversa delegata al Core analitico
  if (currentMode === 'reverse') {
    const nature = document.getElementById('reverseFitNature').value;
    let targetVal = parseFloat(document.getElementById('reverseTargetVal').value) || 0;
    let targetMicron = currentUnit === 'metric' ? targetVal : targetVal * 25.4;

    fit = window.MechCalcFitsCore.findReverseFit(dMm, targetMicron, nature);
    document.getElementById('fitType').value = fit;

    const feedbackEl = document.getElementById('reverseMatchFeedback');
    const bestDevs = window.MechCalcFitsCore.getShaftDeviations(step, fit.split('/')[1]);
    const matchedMean = (step.it7 - bestDevs.ei - bestDevs.es) / 2;
    feedbackEl.innerText = `${t.closestMatch} ${fit} (${t.meanPlay} ${formatDeviation(matchedMean)})`;
  }

  // Chiamata analitica al Core
  const result = window.MechCalcFitsCore.calculateFitAnalytical(dMm, fit);

  document.getElementById('shaftClassLabel').innerText = result.shaftClass;
  document.getElementById('holeDisp').innerText = `${formatDeviation(result.hole.es)} / ${formatDeviation(result.hole.ei)}`;
  document.getElementById('holeDims').innerText = `${formatDim(dMm, result.hole.ei)} / ${formatDim(dMm, result.hole.es)}`;

  document.getElementById('shaftDisp').innerText = `${formatDeviation(result.shaft.es)} / ${formatDeviation(result.shaft.ei)}`;
  document.getElementById('shaftDims').innerText = `${formatDim(dMm, result.shaft.ei)} / ${formatDim(dMm, result.shaft.es)}`;

  const resElem = document.getElementById('fitResult');
  const catElem = document.getElementById('fitCategory');

  if (result.fit.type === 'clearance') {
    resElem.className = "text-lg font-bold text-emerald-400 mt-1";
    resElem.innerText = `${t.clearanceText} ${formatDeviation(result.fit.minPlay)} - ${formatDeviation(result.fit.maxPlay)}`;
    catElem.innerText = t.clearanceFit;
  } else if (result.fit.type === 'interference') {
    resElem.className = "text-lg font-bold text-rose-400 mt-1";
    resElem.innerText = `${t.interferenceText} ${formatDeviation(Math.abs(result.fit.maxPlay))} - ${formatDeviation(Math.abs(result.fit.minPlay))}`;
    catElem.innerText = t.interferenceFit;
  } else {
    resElem.className = "text-lg font-bold text-amber-400 mt-1";
    resElem.innerText = `${t.maxClearance} ${formatDeviation(result.fit.maxPlay)} / ${t.maxInterference} ${formatDeviation(Math.abs(result.fit.minPlay))}`;
    catElem.innerText = t.transitionFit;
  }

  const fitData = t.fits[fit];
  document.getElementById('shaftProcess').innerText = fitData.shaftProc;
  document.getElementById('shaftRa').innerText = fitsRa[fit].shaftRa;
  document.getElementById('holeProcess').innerText = fitData.holeProc;
  document.getElementById('holeRa').innerText = fitsRa[fit].holeRa;

  drawToleranceChart(result.hole.es, result.hole.ei, result.shaft.es, result.shaft.ei);
  updateComparisonTable(dMm, step, fit);
}
