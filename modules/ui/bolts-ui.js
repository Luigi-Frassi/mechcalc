// ============================================================================
// BOLTED JOINTS — UI (three tabs: friction joint design, check from a tightening torque, power screw)
// Inputs in kN, kN·m, N·m, mm; the core works in N and mm.
// ============================================================================

const BT_TXT = {
  it: {
    tabs: { design: '1 · Progetto giunzione ad attrito', torque: '2 · Verifica da coppia di serraggio', screw: '3 · Vite di manovra' },
    load: 'Carico da trasmettere', loadF: 'Forza tangenziale F', loadMt: 'Momento torcente su una corona di viti', F: 'Forza F', Mt: 'Momento torcente Mt', Dcircle: 'Ø della corona di viti',
    mInt: 'Superfici di attrito', f: 'Attrito tra le piastre f', X: 'Coefficiente di sicurezza X', cls: 'Classe di resistenza', size: 'Vite', auto: 'scelta automatica',
    fThread: 'Attrito filetto e sottotesta', m: 'Numero di viti', mAuto: '0 = calcolato', Ms: 'Coppia di serraggio Ms',
    ext: 'Carico esterno assiale (sistema vite-flangia)', Pe: 'Carico esterno totale Pe', PeHint: '+ trazione (apre il giunto), − compressione', h: 'Spessore serrato h', E: 'Modulo elastico E',
    res: 'Risultato', perBolt: 'per vite', total: 'totale', bolts: 'viti', needed: 'viti necessarie', maxCircle: 'al massimo sulla corona (π·D/Dc)',
    preload: 'Precarico per vite N', torque: 'Coppia di serraggio Ms', thread: 'filetto M1', head: 'sottotesta M2', stress: 'Tensione nella vite', Xeff: 'X effettivo',
    vm: 'von Mises con la torsione del serraggio (informativo)', tooMany: n => `Servono più viti di quante ne stanno sulla corona (${n}): scegli una vite più grande o una classe più alta.`,
    options: 'Confronto delle misure (stessa classe)', colSize: 'Vite', colM: 'viti', colN: 'N per vite [kN]', colMs: 'Ms [N·m]', colFit: 'corona', choose: 'Clicca una riga per sceglierla.',
    fromTorque: 'Dalla coppia al carico trasmissibile', Tbolt: 'Forza tangenziale per vite T = N·f/X', Fmax: 'Forza tangenziale massima', Mtmax: 'Momento torcente massimo',
    diagram: 'Diagramma di serraggio', Kv: 'Rigidezza della vite Kv', Kf: 'Rigidezza delle flange Kf', Aeq: 'Area equivalente delle flange Aeq', dFv: 'Variazione di carico della vite ΔFv', dFf: 'Variazione di carico delle flange ΔFf',
    boltLoad: 'Carico sulla vite', clamp: 'Forza di serraggio residua', sep: 'Il giunto si apre: le flange si staccano. Aumenta il precarico o il numero di viti.', newF: 'Forza trasmissibile con il carico esterno', newMt: 'Momento trasmissibile con il carico esterno',
    opt: 'Precarico ottimale Pam·Kf/(Kv+Kf)', optHint: 'il giunto si apre proprio quando la vite arriva al carico ammissibile', Pam: 'Carico ammissibile della vite Pam = σs·A_res/X', Psep: 'Carico esterno per vite che apre il giunto',
    screw: 'Vite di manovra', d: 'Diametro nominale d', p: 'Passo p', hT: 'Altezza del filetto', beta: 'Profilo del filetto', betas: { 0: 'rettangolare (β = 0°)', 15: 'trapezoidale (β = 15°)', 30: 'metrico ISO (β = 30°)' },
    fScrew: 'Attrito vite-madrevite f', N: 'Forza assiale N', sy: 'Snervamento della vite σs', selfLock: 'autobloccante (α < φ)', notSelfLock: 'NON autobloccante (α ≥ φ): la vite torna indietro sotto carico', eta: 'Rendimento', pressure: 'Pressione × area (aiuto)',
    roundDown: 'per difetto, X −0,5 % al massimo', ok: 'VERIFICATO', ko: 'NON VERIFICATO', method: 'Metodo degli appunti di Elementi Costruttivi delle Macchine: dm = 0,9·d, d_noc = 0,8·d, A_res = π·d_noc²/4, β = 30°, Dm = (Dc + d)/2, Dc = chiave della testa.'
  },
  en: {
    tabs: { design: '1 · Friction joint design', torque: '2 · Check from tightening torque', screw: '3 · Power screw' },
    load: 'Load to transmit', loadF: 'Tangential force F', loadMt: 'Torque on a bolt circle', F: 'Force F', Mt: 'Torque Mt', Dcircle: 'Bolt circle Ø',
    mInt: 'Friction surfaces', f: 'Friction between plates f', X: 'Safety factor X', cls: 'Strength class', size: 'Bolt', auto: 'automatic choice',
    fThread: 'Thread and under-head friction', m: 'Number of bolts', mAuto: '0 = calculated', Ms: 'Tightening torque Ms',
    ext: 'External axial load (bolt-flange system)', Pe: 'Total external load Pe', PeHint: '+ tension (opens the joint), − compression', h: 'Clamped thickness h', E: 'Young\'s modulus E',
    res: 'Result', perBolt: 'per bolt', total: 'total', bolts: 'bolts', needed: 'bolts needed', maxCircle: 'at most on the circle (π·D/Dc)',
    preload: 'Preload per bolt N', torque: 'Tightening torque Ms', thread: 'thread M1', head: 'under head M2', stress: 'Bolt stress', Xeff: 'actual X',
    vm: 'von Mises with the tightening torsion (for information)', tooMany: n => `More bolts are needed than fit on the circle (${n}): choose a larger bolt or a higher class.`,
    options: 'Comparison of sizes (same class)', colSize: 'Bolt', colM: 'bolts', colN: 'N per bolt [kN]', colMs: 'Ms [N·m]', colFit: 'circle', choose: 'Click a row to choose it.',
    fromTorque: 'From the torque to the transmissible load', Tbolt: 'Tangential force per bolt T = N·f/X', Fmax: 'Maximum tangential force', Mtmax: 'Maximum torque',
    diagram: 'Tightening diagram', Kv: 'Bolt stiffness Kv', Kf: 'Flange stiffness Kf', Aeq: 'Equivalent flange area Aeq', dFv: 'Bolt load change ΔFv', dFf: 'Flange load change ΔFf',
    boltLoad: 'Bolt load', clamp: 'Residual clamping force', sep: 'The joint opens: the flanges separate. Increase the preload or the number of bolts.', newF: 'Transmissible force with the external load', newMt: 'Transmissible torque with the external load',
    opt: 'Optimal preload Pam·Kf/(Kv+Kf)', optHint: 'the joint opens exactly when the bolt reaches its allowable load', Pam: 'Allowable bolt load Pam = σy·A_res/X', Psep: 'External load per bolt that opens the joint',
    screw: 'Power screw', d: 'Nominal diameter d', p: 'Pitch p', hT: 'Thread depth', beta: 'Thread profile', betas: { 0: 'square (β = 0°)', 15: 'trapezoidal (β = 15°)', 30: 'ISO metric (β = 30°)' },
    fScrew: 'Screw-nut friction f', N: 'Axial force N', sy: 'Screw yield strength σy', selfLock: 'self-locking (α < φ)', notSelfLock: 'NOT self-locking (α ≥ φ): the screw backs off under load', eta: 'Efficiency', pressure: 'Pressure × area (helper)',
    roundDown: 'rounded down, X −0.5 % at most', ok: 'VERIFIED', ko: 'NOT VERIFIED', method: 'Method of the Machine Elements notes: dm = 0.9·d, d_core = 0.8·d, A_res = π·d_core²/4, β = 30°, Dm = (Dc + d)/2, Dc = head across-flats.'
  }
};
function btT() { return BT_TXT[currentLang] || BT_TXT.en; }
function btEl(id) { return document.getElementById(id); }
function btV(id, d) { const v = parseFloat(btEl(id)?.value); return Number.isFinite(v) ? v : d; }
function btNum(x, n = 2) { if (!Number.isFinite(x)) return x === Infinity ? '∞' : '—'; if (Math.abs(x) < 0.5 * Math.pow(10, -n)) x = 0; return x.toLocaleString(currentLang === 'it' ? 'it-IT' : 'en-GB', { minimumFractionDigits: n, maximumFractionDigits: n }); }

let currentBoltMode = 'design';
let lastBoltState = null;

const BT_IN = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none';
const BT_LBL = 'block text-xs font-semibold text-slate-300 tracking-wide mb-1.5';
const BT_CARD = 'bg-slate-800/60 p-5 rounded-xl border border-slate-700/60 mb-4';
function btInput(id, val, unit, attrs = '') { return `<div class="relative"><input type="number" id="${id}" value="${val}" step="any" ${attrs} class="${BT_IN}">${unit ? `<span class="absolute right-3 top-2 text-slate-400 font-medium text-xs">${unit}</span>` : ''}</div>`; }
function btField(id, lblKey, inner, hintId = '') { return `<div><label class="${BT_LBL}" id="${id}Lbl" data-bt="${lblKey}"></label>${inner}${hintId ? `<p class="text-[11px] text-slate-500 mt-1" id="${hintId}"></p>` : ''}</div>`; }

function btBuild() {
  const sec = btEl('moduleBoltsSection');
  if (!sec || sec.dataset.built) return;
  sec.dataset.built = '1';
  const sizeOpts = `<option value="auto"></option>` + BOLT_SIZES.filter(s => s.d >= 4 && s.d <= 64).map(s => `<option value="${s.name}">${s.name} × ${s.p}</option>`).join('');
  const clsOpts = Object.keys(BOLT_CLASSES).map(c => `<option value="${c}">${c}</option>`).join('');
  sec.innerHTML = `
  <div class="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-3" id="btTabs"></div>
  <div id="btJoint">
    <div class="${BT_CARD}">
      <h3 class="text-sm font-semibold text-white mb-3" data-bt="load"></h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="col-span-2" id="btLoadCol"><label class="${BT_LBL}" data-bt="load"></label><select id="btLoad" class="${BT_IN}"><option value="torque"></option><option value="force"></option></select></div>
        <div id="btFCol">${btField('btF', 'F', btInput('btF', 200, 'kN'))}</div>
        <div id="btMtCol">${btField('btMt', 'Mt', btInput('btMt', 32, 'kN·m'))}</div>
        <div id="btDcCol">${btField('btDc', 'Dcircle', btInput('btDc', 210, 'mm', 'min="1"'))}</div>
        <div id="btMsCol" class="hidden">${btField('btMs', 'Ms', btInput('btMs', 105, 'N·m', 'min="0"'))}</div>
        ${btField('btMint', 'mInt', btInput('btMint', 1, '', 'min="1" step="1"'))}
        ${btField('btF0', 'f', btInput('btF0', 0.14, ''))}
        ${btField('btX', 'X', btInput('btX', 1.5, ''))}
      </div>
    </div>
    <div class="${BT_CARD}">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        ${btField('btCls', 'cls', `<select id="btCls" class="${BT_IN}">${clsOpts}</select>`)}
        ${btField('btSize', 'size', `<select id="btSize" class="${BT_IN}">${sizeOpts}</select>`)}
        ${btField('btFt', 'fThread', btInput('btFt', 0.14, ''))}
        ${btField('btM', 'm', btInput('btM', 0, '', 'min="0" step="1"'), 'btMHint')}
      </div>
    </div>
    <div class="${BT_CARD}" id="btResCard"><h3 class="text-sm font-semibold text-white mb-3" data-bt="res"></h3><div id="btRes"></div></div>
    <div class="${BT_CARD} overflow-x-auto" id="btOptCard"><h3 class="text-sm font-semibold text-white mb-1" data-bt="options"></h3><p class="text-[11px] text-slate-500 mb-2" data-bt="choose"></p><div id="btOpts"></div></div>
    <div class="${BT_CARD}">
      <h3 class="text-sm font-semibold text-white mb-3" data-bt="ext"></h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        ${btField('btPe', 'Pe', btInput('btPe', 0, 'kN'), 'btPeHint')}
        ${btField('btH', 'h', btInput('btH', 65, 'mm', 'min="1"'))}
        ${btField('btE', 'E', btInput('btE', 200, 'GPa', 'min="1"'))}
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4"><div id="btExt"></div><div class="rounded-lg bg-slate-950/70 border border-slate-800 p-2"><svg id="btDiagram" viewBox="0 0 420 260" class="w-full h-auto" font-family="Archivo, Arial, sans-serif"></svg></div></div>
    </div>
  </div>
  <div id="btScrew" class="hidden">
    <div class="${BT_CARD}">
      <h3 class="text-sm font-semibold text-white mb-3" data-bt="screw"></h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        ${btField('bsD', 'd', btInput('bsD', 25, 'mm', 'min="1"'))}
        ${btField('bsP', 'p', btInput('bsP', 5, 'mm', 'min="0.1"'))}
        ${btField('bsH', 'hT', btInput('bsH', 2, 'mm', 'min="0"'))}
        ${btField('bsBeta', 'beta', `<select id="bsBeta" class="${BT_IN}"><option value="0"></option><option value="15"></option><option value="30"></option></select>`)}
        ${btField('bsF', 'fScrew', btInput('bsF', 0.08, ''))}
        ${btField('bsN', 'N', btInput('bsN', 80, 'kN', 'min="0"'))}
        ${btField('bsSy', 'sy', btInput('bsSy', 640, 'MPa', 'min="0"'))}
      </div>
      <div class="mt-4" id="bsRes"></div>
    </div>
  </div>
  <p class="text-[11px] text-slate-500 -mt-1 mb-6" data-bt="method"></p>`;
  btEl('btTabs').addEventListener('click', ev => { const b = ev.target.closest('button[data-mode]'); if (b) setBoltMode(b.dataset.mode); });
  sec.addEventListener('input', btSchedule);
  sec.addEventListener('change', btSchedule);
  btEl('btOpts').addEventListener('click', ev => { const tr = ev.target.closest('tr[data-size]'); if (tr) { btEl('btSize').value = tr.dataset.size; btEl('btM').value = 0; calculateBolts(); if (typeof syncShareUrl === 'function') syncShareUrl(); } });
  btEl('btCls').value = '12.9'; btEl('btSize').value = 'M30';
}
let btTimer = null;
function btSchedule() { clearTimeout(btTimer); btTimer = setTimeout(calculateBolts, 60); }

let btLabelLang = null;
function btRelabel() {
  if (btLabelLang === currentLang) return;
  btLabelLang = currentLang;
  const t = btT();
  document.querySelectorAll('#moduleBoltsSection [data-bt]').forEach(el => { const v = t[el.dataset.bt]; if (typeof v === 'string') el.textContent = v; });
  btEl('btLoad').options[0].textContent = t.loadMt; btEl('btLoad').options[1].textContent = t.loadF;
  btEl('btSize').options[0].textContent = t.auto;
  [...btEl('bsBeta').options].forEach(o => { o.textContent = t.betas[o.value]; });
  btEl('btMHint').textContent = t.mAuto; btEl('btPeHint').textContent = t.PeHint;
  btTabs();
}
function btTabs() {
  const t = btT(), on = 'px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30 transition-all', off = 'px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white border border-transparent transition-all';
  btEl('btTabs').innerHTML = Object.keys(t.tabs).map(k => `<button type="button" data-mode="${k}" id="btMode_${k}" class="${k === currentBoltMode ? on : off}">${t.tabs[k]}</button>`).join('');
}
function setBoltMode(mode) {
  currentBoltMode = ['design', 'torque', 'screw'].includes(mode) ? mode : 'design';
  btBuild(); btTabs();
  calculateBolts();
}

function btReadJoint() {
  const size = btEl('btSize').value, cls = btEl('btCls').value, load = btEl('btLoad').value;
  return {
    load, cls, sizeName: size,
    F: btV('btF', 0) * 1000, Mt: load === 'torque' ? btV('btMt', 0) * 1e6 : 0, Dcircle: load === 'torque' ? Math.max(1, btV('btDc', 210)) : 0,
    mInt: Math.max(1, Math.round(btV('btMint', 1))), f: Math.max(0.01, btV('btF0', 0.14)), X: Math.max(0.1, btV('btX', 1.5)), fThread: Math.max(0, btV('btFt', 0.14)),
    mChosen: Math.max(0, Math.round(btV('btM', 0))), Ms: Math.max(0, btV('btMs', 0)) * 1000,
    Pe: btV('btPe', 0) * 1000, h: Math.max(0.1, btV('btH', 65)), E: Math.max(1, btV('btE', 200)) * 1000
  };
}

// automatic size: the smallest bolt that fits on the circle (or needs at most 12 bolts without a circle)
function btAutoSize(inp) {
  const opts = boltOptions({ F: inp.F, Mt: inp.Mt, Dcircle: inp.Dcircle, mInt: inp.mInt, f: inp.f, X: inp.X, cls: inp.cls, fThread: inp.fThread });
  const okOpt = opts.find(o => (inp.Dcircle > 0 ? o.r.fitsCircle && o.r.m >= 3 : o.r.m <= 12));
  return { opts, size: (okOpt || opts[opts.length - 1]).size };
}

function calculateBolts() {
  btBuild(); btRelabel();
  const t = btT();
  const joint = currentBoltMode !== 'screw';
  btEl('btJoint').classList.toggle('hidden', !joint);
  btEl('btScrew').classList.toggle('hidden', joint);
  if (!joint) return calculatePowerScrew();
  const inp = btReadJoint(), torqueMode = currentBoltMode === 'torque';
  btEl('btLoadCol').classList.toggle('hidden', false);
  btEl('btFCol').classList.toggle('hidden', torqueMode || inp.load !== 'force');
  btEl('btMtCol').classList.toggle('hidden', torqueMode || inp.load !== 'torque');
  btEl('btDcCol').classList.toggle('hidden', inp.load !== 'torque');
  btEl('btMsCol').classList.toggle('hidden', !torqueMode);
  btEl('btOptCard').classList.toggle('hidden', torqueMode);
  let opts = null, size = boltSize(inp.sizeName);
  if (!size || inp.sizeName === 'auto') { const a = btAutoSize(inp); size = a.size; opts = a.opts; }
  const cls = inp.cls, [sR, sS] = BOLT_CLASSES[cls];
  let r, N, m;
  const T = (k, v) => `<div class="flex justify-between gap-3 py-1 border-b border-slate-700/40"><span class="text-slate-400">${k}</span><span class="text-white font-semibold text-right">${v}</span></div>`;
  if (!torqueMode) {
    r = boltFrictionDesign({ F: inp.F, Mt: inp.Mt, Dcircle: inp.Dcircle, mInt: inp.mInt, f: inp.f, X: inp.X, size, cls, fThread: inp.fThread, mChosen: inp.mChosen });
    N = r.N; m = r.m;
    const okS = r.Xbolt >= inp.X - 1e-9;
    btEl('btRes').innerHTML = `<div class="flex flex-wrap items-baseline gap-x-5 gap-y-1 mb-3"><span class="text-2xl font-bold text-white">${m} × ${size.name} ${cls}</span>
        <span class="text-lg text-blue-300 font-semibold">Ms = ${btNum(r.Ms / 1000, 0)} N·m</span><span class="${okS ? 'text-emerald-400' : 'text-amber-300'} text-sm font-semibold">${okS ? t.ok : t.ko}</span></div>` +
      `<div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 text-xs">` +
      T(inp.load === 'torque' ? 'F = Mt / (D/2)' : 'F', `${btNum(r.Ft / 1000, 2)} kN`) +
      T('N_tot = F·X / (f·m_int)', `${btNum(r.Ntot / 1000, 1)} kN`) +
      T(`${t.needed} (N_tot / (σs·A_res/X))`, `${btNum(r.mReq, 2)} → ${m}${r.roundedDown ? ` <span class="text-slate-400 font-normal">(${t.roundDown})</span>` : ''}`) +
      (inp.Dcircle > 0 && inp.load === 'torque' ? T(t.maxCircle, `${r.nMax}`) : '') +
      T(t.preload, `${btNum(N / 1000, 2)} kN`) +
      T(`${t.stress} N/A_res`, `${btNum(r.sigma, 0)} MPa · ${t.Xeff} ${btNum(r.Xbolt, 2)}`) +
      T(`tan α = p/(π·dm)`, `α = ${btNum(r.g.alpha * 180 / Math.PI, 2)}°`) +
      T(`${t.torque} (${t.thread} + ${t.head})`, `${btNum(r.M1 / 1000, 1)} + ${btNum(r.M2 / 1000, 1)} = ${btNum(r.Ms / 1000, 1)} N·m`) +
      T(t.vm, `${btNum(r.sigmaId, 0)} MPa · X ${btNum(r.Xvm, 2)}`) + `</div>` +
      (!r.fitsCircle && inp.load === 'torque' ? `<p class="text-xs text-amber-300 mt-2">${t.tooMany(r.nMax)}</p>` : '');
    if (!opts) opts = boltOptions({ F: inp.F, Mt: inp.Mt, Dcircle: inp.Dcircle, mInt: inp.mInt, f: inp.f, X: inp.X, cls, fThread: inp.fThread });
    btEl('btOpts').innerHTML = `<table class="w-full text-xs text-left"><thead><tr class="text-slate-400"><th class="pb-1 pr-2">${t.colSize}</th><th class="pr-2">${t.colM}</th><th class="pr-2">${t.colN}</th><th class="pr-2">${t.colMs}</th>${inp.load === 'torque' ? `<th>${t.colFit}</th>` : ''}</tr></thead><tbody>` +
      opts.map(o => `<tr data-size="${o.size.name}" class="cursor-pointer border-t border-slate-700/50 ${o.size.name === size.name ? 'bg-blue-600/15' : 'hover:bg-slate-800/60'}"><td class="py-1 pr-2 text-white font-semibold">${o.size.name}</td><td class="pr-2">${btNum(o.r.mReq, 2)} → ${o.r.m}</td><td class="pr-2">${btNum(o.r.N / 1000, 1)}</td><td class="pr-2">${btNum(o.r.Ms / 1000, 0)}</td>${inp.load === 'torque' ? `<td class="${o.r.fitsCircle ? 'text-emerald-400' : 'text-amber-300'}">${o.r.m} / ${o.r.nMax}</td>` : ''}</tr>`).join('') + '</tbody></table>';
  } else {
    m = Math.max(1, inp.mChosen || 1);
    r = boltFromTorque({ Ms: inp.Ms, m, mInt: inp.mInt, f: inp.f, X: inp.X, size, cls, fThread: inp.fThread, Dcircle: inp.load === 'torque' ? inp.Dcircle : 0 });
    N = r.N;
    const okS = r.Xbolt >= inp.X - 1e-9;
    btEl('btRes').innerHTML = `<div class="flex flex-wrap items-baseline gap-x-5 gap-y-1 mb-3"><span class="text-2xl font-bold text-white">${r.Mtmax ? `Mt max = ${btNum(r.Mtmax / 1e6, 2)} kN·m` : `F max = ${btNum(r.Fmax / 1000, 1)} kN`}</span>
        <span class="text-sm text-slate-300">${m} × ${size.name} ${cls} · Ms = ${btNum(inp.Ms / 1000, 0)} N·m</span><span class="${okS ? 'text-emerald-400' : 'text-amber-300'} text-sm font-semibold">${okS ? t.ok : t.ko}</span></div>` +
      `<div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 text-xs">` +
      T('N = Ms / (dm/2·k1 + Dm/2·f)', `${btNum(N / 1000, 2)} kN`) + T('N_tot', `${btNum(r.Ntot / 1000, 1)} kN`) + T(t.Tbolt, `${btNum(r.Tbolt / 1000, 2)} kN`) +
      T(t.Fmax, `${btNum(r.Fmax / 1000, 2)} kN`) + (r.Mtmax ? T(t.Mtmax, `${btNum(r.Mtmax / 1e6, 2)} kN·m`) : '') +
      T(`${t.stress} N/A_res`, `${btNum(r.sigma, 0)} MPa · ${t.Xeff} ${btNum(r.Xbolt, 2)}`) + T(t.vm, `${btNum(r.sigmaId, 0)} MPa · X ${btNum(r.Xvm, 2)}`) + `</div>`;
  }
  // external axial load
  const PeBolt = inp.Pe / m;
  const ex = boltExternal({ N, Pe: PeBolt, h: inp.h, size, E: inp.E, cls, X: inp.X, f: inp.f, mInt: inp.mInt, m, Dcircle: inp.load === 'torque' ? inp.Dcircle : 0 });
  const okB = ex.Xbolt >= inp.X - 1e-9;
  btEl('btExt').innerHTML = `<div class="text-xs">` +
    T(t.Kv + ' = E·(π d²/4)/h', `${btNum(ex.Kv / 1000, 0)} kN/mm`) + T(`${t.Aeq} (Dmax = Dc + h·tg30° = ${btNum(ex.Dmax, 1)} mm)`, `${btNum(ex.Aeq, 0)} mm²`) + T(t.Kf + ' = E·Aeq/h', `${btNum(ex.Kf / 1000, 0)} kN/mm`) +
    (inp.Pe ? T(`Pe ${t.perBolt}`, `${btNum(PeBolt / 1000, 2)} kN`) + T(t.dFv, `${btNum(ex.dFv / 1000, 2)} kN`) + T(t.dFf, `${btNum(ex.dFf / 1000, 2)} kN`) +
      T(t.boltLoad, `${btNum(ex.bolt / 1000, 2)} kN · X ${btNum(ex.Xbolt, 2)} <span class="${okB ? 'text-emerald-400' : 'text-amber-300'}">${okB ? t.ok : t.ko}</span>`) +
      T(t.clamp, `${btNum(ex.clamp / 1000, 2)} kN`) + (ex.separated ? '' : (ex.Mtmax ? T(t.newMt, `${btNum(ex.Mtmax / 1e6, 2)} kN·m`) : T(t.newF, `${btNum(ex.Fmax / 1000, 2)} kN`))) : '') +
    T(t.Psep, `${btNum(ex.Psep / 1000, 2)} kN`) + T(t.Pam, `${btNum(ex.Pam / 1000, 2)} kN`) + T(t.opt, `${btNum(ex.Popt / 1000, 2)} kN`) + `</div>` +
    `<p class="text-[11px] text-slate-500 mt-1">${t.optHint}</p>` + (ex.separated ? `<p class="text-xs text-amber-300 mt-2">${t.sep}</p>` : '');
  btDrawDiagram(N, ex, PeBolt, t);
  lastBoltState = { mode: currentBoltMode, inp, size, cls, sR, sS, r, N, m, ex, PeBolt, opts };
}

// Tightening diagram: bolt line (slope Kv) from the origin, flange line (slope −Kf) back to zero; preload point; external load
function btDrawDiagram(N, ex, Pe, t) {
  const svg = btEl('btDiagram'); if (!svg) return;
  const dv = ex.deltaV, df = ex.deltaF, dTot = dv + df;
  const Fmax = Math.max(N, ex.bolt, ex.clamp) * 1.3 || 1;
  const X0 = 40, X1 = 400, Y0 = 225, Y1 = 30, sx = (X1 - X0) / (dTot * 1.08), sy = (Y0 - Y1) / Fmax;
  const P = (d, F) => `${(X0 + d * sx).toFixed(1)},${(Y0 - F * sy).toFixed(1)}`;
  let g = `<line x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y0}" stroke="#64748b"/><line x1="${X0}" y1="${Y0}" x2="${X0}" y2="${Y1 - 8}" stroke="#64748b"/>`;
  g += `<text x="${X1}" y="${Y0 + 16}" text-anchor="end" font-size="11" fill="#94a3b8">δ</text><text x="${X0 - 8}" y="${Y1}" text-anchor="end" font-size="11" fill="#94a3b8">F</text>`;
  const Ftop = Fmax * 0.97, ext = Math.min(Ftop / ex.Kv, dTot * 1.05);
  g += `<polyline points="${P(0, 0)} ${P(ext, ext * ex.Kv)}" fill="none" stroke="#38bdf8" stroke-width="2"/>`;
  const fx = Math.min(Ftop / ex.Kf, dTot);
  g += `<polyline points="${P(dTot, 0)} ${P(dTot - fx, fx * ex.Kf)}" fill="none" stroke="#f43f5e" stroke-width="2"/>`;
  g += `<text x="${X0 + dv * 0.45 * sx}" y="${Y0 - dv * 0.45 * ex.Kv * sy - 8}" font-size="11" fill="#38bdf8" font-weight="600" text-anchor="end">Kv</text>`;
  g += `<text x="${X0 + (dTot - df * 0.35) * sx + 6}" y="${Y0 - N * 0.35 * sy}" font-size="11" fill="#f43f5e" font-weight="600">Kf</text>`;
  g += `<circle cx="${X0 + dv * sx}" cy="${Y0 - N * sy}" r="4" fill="#fbbf24"/><text x="${X0 + dv * sx - 8}" y="${Y0 - N * sy - (Pe ? 22 : 8)}" text-anchor="end" font-size="11" fill="#fbbf24">N = ${btNum(N / 1000, 1)} kN</text>`;
  g += `<line x1="${X0 + dv * sx}" y1="${Y0 - N * sy}" x2="${X0 + dv * sx}" y2="${Y0}" stroke="#fbbf24" stroke-dasharray="3 3"/>`;
  if (Pe) {
    // with Pe the bolt moves along Kv and the flanges along Kf, by the same δ: vertical distance between the two = Pe
    const dd = ex.dFv / ex.Kv, xb = dv + dd;
    g += `<line x1="${X0 + xb * sx}" y1="${Y0 - ex.bolt * sy}" x2="${X0 + xb * sx}" y2="${Y0 - Math.max(0, ex.clamp) * sy}" stroke="#a855f7" stroke-width="2.5"/>`;
    g += `<circle cx="${X0 + xb * sx}" cy="${Y0 - ex.bolt * sy}" r="3.5" fill="#38bdf8"/><circle cx="${X0 + xb * sx}" cy="${Y0 - Math.max(0, ex.clamp) * sy}" r="3.5" fill="#f43f5e"/>`;
    g += `<text x="${X0 + xb * sx + 10}" y="${Y0 - (ex.bolt + Math.max(0, ex.clamp)) / 2 * sy + 4}" font-size="11" fill="#a855f7" font-weight="600">Pe = ${btNum(Pe / 1000, 1)} kN</text>`;
    const hi = Math.max(ex.bolt, ex.clamp), lo = Math.min(ex.bolt, Math.max(0, ex.clamp));
    g += `<text x="${X0 + xb * sx - 8}" y="${Y0 - hi * sy - 6}" text-anchor="end" font-size="10.5" fill="${ex.bolt >= ex.clamp ? '#38bdf8' : '#f43f5e'}">${btNum(hi / 1000, 1)} kN</text>`;
    g += `<text x="${X0 + xb * sx - 8}" y="${Y0 - lo * sy + 15}" text-anchor="end" font-size="10.5" fill="${ex.bolt >= ex.clamp ? '#f43f5e' : '#38bdf8'}">${btNum(lo / 1000, 1)} kN</text>`;
  }
  g += `<text x="${X0 + 6}" y="${Y1 + 4}" font-size="11.5" fill="#e2e8f0" font-weight="600">${t.diagram}</text>`;
  svg.innerHTML = g;
}

function calculatePowerScrew() {
  const t = btT();
  const inp = { d: Math.max(1, btV('bsD', 25)), p: Math.max(0.1, btV('bsP', 5)), hT: Math.max(0, btV('bsH', 2)), beta: btV('bsBeta', 0), f: Math.max(0, btV('bsF', 0.08)), N: Math.max(0, btV('bsN', 80)) * 1000, sigmaS: Math.max(0, btV('bsSy', 640)) };
  const r = powerScrew(inp);
  const T = (k, v) => `<div class="flex justify-between gap-3 py-1 border-b border-slate-700/40"><span class="text-slate-400">${k}</span><span class="text-white font-semibold text-right">${v}</span></div>`;
  const ok = r.X === null || r.X >= 1;
  btEl('bsRes').innerHTML = `<div class="flex flex-wrap items-baseline gap-x-5 gap-y-1 mb-3"><span class="text-2xl font-bold text-white">Ms = ${btNum(r.Ms / 1000, 1)} N·m</span>
      <span class="text-sm ${r.selfLocking ? 'text-emerald-400' : 'text-amber-300'} font-semibold">${r.selfLocking ? t.selfLock : t.notSelfLock}</span></div><div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 text-xs">` +
    T('dm = d − h/2 · d_noc = d − h', `${btNum(r.dm, 2)} · ${btNum(r.dCore, 2)} mm`) + T('tan α = p/(π·dm)', `α = ${btNum(r.alpha * 180 / Math.PI, 2)}°`) +
    T('tan φ = f / cos β', `φ = ${btNum(r.phi * 180 / Math.PI, 2)}°`) + T('Ms = N·dm/2·(cosβ sinα + f cosα)/(cosβ cosα − f sinα)', `${btNum(r.Ms / 1000, 2)} N·m`) +
    T(t.eta + ' η = tan α / k', `${btNum(r.eta * 100, 1)} %`) + T('σ = N/A_noc · τ = 16·Ms/(π·d_noc³)', `${btNum(r.sigma, 1)} · ${btNum(r.tau, 1)} MPa`) +
    T('σ_id (von Mises)', `${btNum(r.sigmaId, 1)} MPa${r.X ? ` · X ${btNum(r.X, 2)} <span class="${ok ? 'text-emerald-400' : 'text-amber-300'}">${ok ? t.ok : t.ko}</span>` : ''}`) + '</div>';
  lastBoltState = { mode: 'screw', inp, r };
}
