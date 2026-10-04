// ============================================================================
// LINKS BETWEEN MODULES
// A "Continue with" bar at the bottom of each module carries its results into the next module:
//   belt → gears (speed and power of the driven pulley)        gears → shaft (pinion or wheel shaft)
//   shaft → fits (diameter)  shaft → bolts (flanged coupling)    frames → bolts (support reactions)
// The target fields are filled in, the target module opens and a banner says what was imported
// (the changed fields blink once). Everything goes through the normal inputs, so share links,
// projects and reports keep working unchanged.
// ============================================================================

const LINK_TXT = {
  it: {
    bar: 'Prosegui con questi risultati',
    beltGears: 'Ruote dentate a valle', beltGearsSub: (P, n) => `pignone a ${n} rpm · ${P} kW`, beltGeom: 'Serve il calcolo con la potenza (modalità "Potenza")',
    beltShaft: 'Albero della puleggia condotta', beltShaftSub: (P, n) => `${P} kW · ${n} rpm (la forza della cinghia va aggiunta come forza generica)`,
    gearPinion: 'Albero del pignone', gearWheel: 'Albero della ruota', gearSub: (P, n, d, b) => `${P} kW · ${n} rpm · Ø primitivo ${d} mm` + (b ? ` · elica ${b}°` : ''),
    shaftFits: 'Accoppiamento sul diametro', shaftFitsSub: d => `Ø ${d} mm (foro base H7)`, shaftNoD: 'Calcola prima la sezione (passo 2 o 3)',
    shaftBolts: 'Giunto a flange bullonato', shaftBoltsSub: Mt => `Mt = ${Mt} N·m da trasmettere per attrito`,
    frameBolts: n => `Bulloni al vincolo del nodo ${n}`, frameBoltsSub: (T, Pe, M) => `taglio ${T} kN · sollevamento ${Pe} kN` + (M ? ' · momento escluso' : ''), frameNone: 'Nessuna reazione: calcola prima la struttura',
    from: 'Dati presi da', close: 'Chiudi',
    src: { beltGears: 'Cinghia sincrona → ruote', beltShaft: 'Cinghia sincrona → albero', gearPinion: 'Ruote dentate → albero del pignone', gearWheel: 'Ruote dentate → albero della ruota',
      shaftFits: 'Albero → accoppiamento', shaftBolts: 'Albero → giunto a flange', frameBolts: n => `Strutture → vincolo del nodo ${n}` },
    noteBeltShaft: 'La forza della cinghia sull\'albero non è trasferita: inseriscila come forza generica nella posizione della puleggia.',
    noteGear: 'Posizione della ruota, cuscinetti e lunghezza restano quelli dell\'albero: controllali.',
    noteBolts: 'Diametro della corona, classe e attriti restano quelli del modulo Bulloni: controllali.',
    noteFrameM: M => `Il vincolo trasmette anche un momento di ${M} kN·m, che la giunzione ad attrito non considera: va verificato a parte (piastra di base).`,
    noteFrame: 'Taglio = |Rx| (piastra orizzontale); il sollevamento (Ry < 0) diventa il carico esterno assiale Pe.'
  },
  en: {
    bar: 'Continue with these results',
    beltGears: 'Gears downstream', beltGearsSub: (P, n) => `pinion at ${n} rpm · ${P} kW`, beltGeom: 'Needs the power calculation ("Power" mode)',
    beltShaft: 'Driven pulley shaft', beltShaftSub: (P, n) => `${P} kW · ${n} rpm (add the belt pull as a generic force)`,
    gearPinion: 'Pinion shaft', gearWheel: 'Wheel shaft', gearSub: (P, n, d, b) => `${P} kW · ${n} rpm · pitch Ø ${d} mm` + (b ? ` · helix ${b}°` : ''),
    shaftFits: 'Fit on the diameter', shaftFitsSub: d => `Ø ${d} mm (hole basis H7)`, shaftNoD: 'Calculate the section first (step 2 or 3)',
    shaftBolts: 'Bolted flange coupling', shaftBoltsSub: Mt => `Mt = ${Mt} N·m transmitted by friction`,
    frameBolts: n => `Bolts at the support of node ${n}`, frameBoltsSub: (T, Pe, M) => `shear ${T} kN · uplift ${Pe} kN` + (M ? ' · moment excluded' : ''), frameNone: 'No reactions: calculate the structure first',
    from: 'Data taken from', close: 'Close',
    src: { beltGears: 'Timing belt → gears', beltShaft: 'Timing belt → shaft', gearPinion: 'Gears → pinion shaft', gearWheel: 'Gears → wheel shaft',
      shaftFits: 'Shaft → fit', shaftBolts: 'Shaft → flange coupling', frameBolts: n => `Frames → support of node ${n}` },
    noteBeltShaft: 'The belt pull on the shaft is not transferred: add it as a generic force at the pulley position.',
    noteGear: 'Gear position, bearings and length stay those of the shaft: check them.',
    noteBolts: 'Bolt circle diameter, class and friction stay those of the Bolts module: check them.',
    noteFrameM: M => `The support also carries a moment of ${M} kN·m, which the friction joint does not consider: check it separately (base plate).`,
    noteFrame: 'Shear = |Rx| (horizontal plate); the uplift (Ry < 0) becomes the external axial load Pe.'
  }
};
function linkT() { return LINK_TXT[currentLang] || LINK_TXT.en; }
function linkNum(x, n = 1) { return Number.isFinite(x) ? x.toLocaleString(currentLang === 'it' ? 'it-IT' : 'en-GB', { minimumFractionDigits: n, maximumFractionDigits: n }) : '—'; }
function linkEl(id) { return document.getElementById(id); }
function linkNice(x, n) { return Math.round(x * Math.pow(10, n)) / Math.pow(10, n); }

// ---- sources: what each module can hand over (null = not available now, string = reason) -----------------
function linkBeltData() {
  if (typeof currentBeltMode !== 'undefined' && currentBeltMode === 'geom') return null;
  const z1 = parseInt(linkEl('pulleyZ1')?.value) || 20;
  let z2 = parseInt(linkEl('pulleyZ2')?.value) || 40;
  if (typeof currentRatioMethod !== 'undefined' && currentRatioMethod !== 'teeth') z2 = beltZ2FromTau(z1, parseFloat(linkEl('targetTau')?.value) || 2).z2;
  const P = parseFloat(linkEl('motorPower')?.value) || 0, n1 = parseFloat(linkEl('driverSpeed')?.value) || 0;
  if (!(P > 0 && n1 > 0)) return null;
  return { P, n2: n1 * z1 / z2 };
}

function linkGearData() {
  if (typeof calculateGears === 'function' && !lastGearState) calculateGears();
  const g = typeof lastGearState !== 'undefined' ? lastGearState : null;
  if (!g || !g.r) return null;
  if (g.mode === 'design') {
    const helical = g.gearType === 'helical';
    return { P: g.load.W_watt / 1000, n1: g.load.n1_rpm, n2: g.load.n1_rpm * g.tau, dp1: g.r.dp1, dp2: g.r.dp2, helix: helical ? g.r.alphaDeg : 0 };
  }
  const p = g.params || {};
  if (!(g.r.P_kW_max > 0)) return null;
  return { P: g.r.P_kW_max, n1: p.n1, n2: p.n1 * p.z1 / p.z2, dp1: g.r.dp1, dp2: g.r.dp2, helix: p.toothType === 'helical' ? p.alphaDeg || 0 : 0 };
}

function linkShaftData() {
  const Mt = typeof readShaftTorque === 'function' ? readShaftTorque().Mt : 0;
  const s = typeof lastShaftSection !== 'undefined' ? lastShaftSection : null;
  return { Mt, d: s && s.d > 0 ? s.d : null };
}

function linkFrameReactions() {
  if (typeof frResults === 'undefined' || !frResults) return [];
  const sel = frSelFamily && frResults.byFamily[frSelFamily];
  const ev = sel && sel.ev && sel.ev.ok ? sel.ev : frResults.base;
  return ev && ev.an && ev.an.reactions ? ev.an.reactions : [];
}

// ---- the bar ---------------------------------------------------------------------------------------------
const LINK_SECTIONS = { belts: 'moduleBeltsSection', gears: 'moduleGearsSection', shafts: 'moduleShaftsSection', frames: 'moduleFramesSection' };

function linkButton(action, arg, title, sub, enabled = true) {
  const cls = enabled
    ? 'text-left px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/60 hover:border-amber-400/70 hover:bg-slate-800 transition-colors'
    : 'text-left px-3 py-2 rounded-lg border border-slate-800 bg-slate-900/30 opacity-60 cursor-not-allowed';
  return `<button type="button" class="${cls}" data-link="${action}" data-arg="${arg}" ${enabled ? '' : 'disabled'}>` +
    `<span class="block text-sm font-semibold text-white">${title} <span class="text-amber-400">→</span></span>` +
    `<span class="block text-[11px] text-slate-400 mt-0.5">${sub}</span></button>`;
}

function linkBarHtml(mod) {
  const t = linkT(), b = [];
  if (mod === 'belts') {
    const d = linkBeltData();
    b.push(d ? linkButton('beltGears', '', t.beltGears, t.beltGearsSub(linkNum(d.P, 2), linkNum(d.n2, 0))) : linkButton('beltGears', '', t.beltGears, t.beltGeom, false));
    b.push(d ? linkButton('beltShaft', '', t.beltShaft, t.beltShaftSub(linkNum(d.P, 2), linkNum(d.n2, 0))) : linkButton('beltShaft', '', t.beltShaft, t.beltGeom, false));
  } else if (mod === 'gears') {
    const d = linkGearData();
    if (!d) return '';
    const hb = d.helix > 0 ? linkNum(d.helix, 1) : '';
    b.push(linkButton('gearShaft', 'pinion', t.gearPinion, t.gearSub(linkNum(d.P, 2), linkNum(d.n1, 0), linkNum(d.dp1, 1), hb)));
    b.push(linkButton('gearShaft', 'wheel', t.gearWheel, t.gearSub(linkNum(d.P, 2), linkNum(d.n2, 0), linkNum(d.dp2, 1), hb)));
  } else if (mod === 'shafts') {
    const d = linkShaftData();
    b.push(d.d ? linkButton('shaftFits', '', t.shaftFits, t.shaftFitsSub(linkNum(d.d, 0))) : linkButton('shaftFits', '', t.shaftFits, t.shaftNoD, false));
    b.push(linkButton('shaftBolts', '', t.shaftBolts, t.shaftBoltsSub(linkNum(d.Mt, 0)), d.Mt > 0));
  } else if (mod === 'frames') {
    const R = linkFrameReactions();
    if (!R.length) b.push(linkButton('frameBolts', '', t.frameBolts('—'), t.frameNone, false));
    R.forEach((r, i) => b.push(linkButton('frameBolts', i, t.frameBolts(r.node + 1),
      t.frameBoltsSub(linkNum(Math.abs(r.Rx) / 1000, 2), linkNum(Math.max(0, -r.Ry) / 1000, 2), Math.abs(r.M) > 1)))); // M in N·mm
  }
  if (!b.length) return '';
  return `<div class="bg-slate-800/40 rounded-xl border border-slate-700/60 p-4 mt-6 mb-6">` +
    `<h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">${t.bar}</h3>` +
    `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">${b.join('')}</div></div>`;
}

function linkRender(mod) {
  const secId = LINK_SECTIONS[mod];
  const sec = secId && linkEl(secId);
  if (!sec) return;
  let bar = linkEl('linkBar_' + mod);
  if (!bar || bar.parentNode !== sec) {
    bar = document.createElement('div');
    bar.id = 'linkBar_' + mod;
    bar.addEventListener('click', linkClick);
  }
  if (sec.lastElementChild !== bar) sec.appendChild(bar);   // always last, also after modules that rebuild their content
  const html = linkBarHtml(mod);
  if (bar.dataset.html !== html) { bar.innerHTML = html; bar.dataset.html = html; }
}

function linkRenderActive() {
  if (typeof activeModule !== 'undefined' && LINK_SECTIONS[activeModule]) linkRender(activeModule);
}

let linkTimer = null;
function linkSchedule() { clearTimeout(linkTimer); linkTimer = setTimeout(linkRenderActive, 250); }

// ---- the banner in the target module ---------------------------------------------------------------------
function linkBanner(mod, src, rows, notes) {
  const sec = linkEl(LINK_SECTIONS[mod] || (mod === 'fits' ? 'moduleFitsSection' : 'moduleBoltsSection'));
  if (!sec) return;
  linkEl('linkBanner')?.remove();
  const t = linkT(), div = document.createElement('div');
  div.id = 'linkBanner';
  div.className = 'mb-4 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm';
  div.innerHTML = `<div class="flex items-start justify-between gap-3"><div><span class="text-amber-300 font-semibold">${t.from}: ${src}</span>` +
    `<div class="text-slate-200 text-xs mt-1 font-mono">${rows.join(' · ')}</div>` +
    notes.map(n => `<div class="text-slate-400 text-[11px] mt-1">${n}</div>`).join('') +
    `</div><button type="button" class="text-slate-400 hover:text-white text-lg leading-none" aria-label="${t.close}" onclick="this.closest('#linkBanner').remove()">×</button></div>`;
  sec.insertBefore(div, sec.firstChild);
}

function linkSet(id, value) {
  const el = linkEl(id);
  if (!el) return;
  el.value = value;
  el.classList.add('ring-2', 'ring-amber-400');
  setTimeout(() => el.classList.remove('ring-2', 'ring-amber-400'), 2500);
}

function linkGo(mod) {
  if (typeof switchModule === 'function') switchModule(mod);
  if (typeof syncShareUrl === 'function') syncShareUrl();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- actions ----------------------------------------------------------------------------------------------
function linkToGears(P, n) {
  const radio = document.querySelector('input[name="gearLoadMode"][value="power"]');
  if (radio && !radio.checked) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); }
  linkSet('gearPower', linkNice(P, 3));
  linkSet('gearSpeed', linkNice(n, 1));
}

function linkToShaftPower(P, n) {
  linkSet('shaftTorqueInput', 'power');
  linkSet('shaftPower', linkNice(P, 3));
  linkSet('shaftSpeed', linkNice(n, 1));
}

function linkClick(ev) {
  const btn = ev.target.closest('button[data-link]');
  if (!btn || btn.disabled) return;
  const t = linkT(), act = btn.dataset.link, arg = btn.dataset.arg;
  if (act === 'beltGears' || act === 'beltShaft') {
    const d = linkBeltData(); if (!d) return;
    if (act === 'beltGears') {
      linkToGears(d.P, d.n2);
      linkGo('gears');
      linkBanner('gears', t.src.beltGears, [`P = ${linkNum(d.P, 2)} kW`, `n₁ = ${linkNum(d.n2, 1)} rpm`], []);
    } else {
      linkToShaftPower(d.P, d.n2);
      if (typeof setShaftMode === 'function') setShaftMode('beam');
      linkGo('shafts');
      linkBanner('shafts', t.src.beltShaft, [`P = ${linkNum(d.P, 2)} kW`, `n = ${linkNum(d.n2, 1)} rpm`], [t.noteBeltShaft]);
    }
  } else if (act === 'gearShaft') {
    const d = linkGearData(); if (!d) return;
    const pinion = arg === 'pinion', n = pinion ? d.n1 : d.n2, dp = pinion ? d.dp1 : d.dp2;
    linkToShaftPower(d.P, n);
    // the first gear on the shaft (or element 1 turned into a gear)
    const slot = SHAFT_EL_SLOTS.find(i => linkEl('shaftEl' + i + 'Type')?.value === 'gear') || 1;
    const p = 'shaftEl' + slot;
    linkSet(p + 'Type', 'gear');
    linkSet(p + 'D', linkNice(dp, 2));
    linkSet(p + 'Helix', linkNice(d.helix, 2));
    linkSet(p + 'Torque', pinion ? 'out' : 'in');
    linkSet(p + 'Share', 100);
    linkSet('shaftTheta', 20);
    if (typeof setShaftMode === 'function') setShaftMode('beam');
    linkGo('shafts');
    const rows = [`P = ${linkNum(d.P, 2)} kW`, `n = ${linkNum(n, 1)} rpm`, `dp = ${linkNum(dp, 2)} mm`];
    if (d.helix > 0) rows.push(`β = ${linkNum(d.helix, 1)}°`);
    linkBanner('shafts', pinion ? t.src.gearPinion : t.src.gearWheel, rows, [t.noteGear]);
  } else if (act === 'shaftFits') {
    const d = linkShaftData(); if (!d.d) return;
    const imperial = typeof currentUnit !== 'undefined' && currentUnit !== 'metric';
    linkSet('nominalDiameter', imperial ? linkNice(d.d / 25.4, 4) : d.d);
    linkGo('fits');
    linkBanner('fits', t.src.shaftFits, [`Ø = ${linkNum(d.d, 0)} mm`], []);
  } else if (act === 'shaftBolts') {
    const d = linkShaftData(); if (!(d.Mt > 0)) return;
    linkBoltsPrepare();
    linkSet('btLoad', 'torque');
    linkSet('btMt', linkNice(d.Mt / 1000, 4));
    linkSet('btSize', 'auto');
    linkSet('btM', 0);
    linkGo('bolts');
    linkBanner('bolts', t.src.shaftBolts, [`Mt = ${linkNum(d.Mt, 1)} N·m`], [t.noteBolts]);
  } else if (act === 'frameBolts') {
    const r = linkFrameReactions()[parseInt(arg)]; if (!r) return;
    const T = Math.abs(r.Rx) / 1000, Pe = Math.max(0, -r.Ry) / 1000, M = Math.abs(r.M) / 1e6;
    linkBoltsPrepare();
    linkSet('btLoad', 'force');
    linkSet('btF', linkNice(T, 3));
    linkSet('btPe', linkNice(Pe, 3));
    linkSet('btSize', 'auto');
    linkSet('btM', 0);
    linkGo('bolts');
    const notes = [t.noteFrame, t.noteBolts];
    if (M > 1e-6) notes.unshift(t.noteFrameM(linkNum(M, 2)));
    linkBanner('bolts', t.src.frameBolts(r.node + 1), [`Rx = ${linkNum(r.Rx / 1000, 2)} kN`, `Ry = ${linkNum(r.Ry / 1000, 2)} kN`, `F = ${linkNum(T, 2)} kN`, `Pe = ${linkNum(Pe, 2)} kN`], notes);
  }
}

function linkBoltsPrepare() {
  if (typeof setBoltMode === 'function') setBoltMode('design');
}

// ---- hooks ------------------------------------------------------------------------------------------------
(function linkInstall() {
  const sw = window.switchModule;
  if (typeof sw === 'function') {
    window.switchModule = function (mod) {
      if (mod !== activeModule) linkEl('linkBanner')?.remove();
      sw.apply(this, arguments);
      linkRender(mod);
    };
  }
  const ul = window.updateLanguage;
  if (typeof ul === 'function') {
    window.updateLanguage = function () { const r = ul.apply(this, arguments); linkRenderActive(); return r; };
  }
  for (const evName of ['input', 'change', 'click']) document.addEventListener(evName, linkSchedule, true);
})();
