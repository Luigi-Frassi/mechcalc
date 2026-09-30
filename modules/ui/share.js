// ==========================================
// SHAREABLE LINKS
// The current calculation is kept in the page URL (?m=gears&gearPower=11&...),
// so a link reopens the same module, inputs, modes and language.
// Only values that differ from the defaults are written, to keep links short.
// ==========================================

const SHARE_FIELDS = {
  fits: ['nominalDiameter', 'fitType', 'reverseFitNature', 'reverseTargetVal'],
  belts: ['beltProfile', 'pulleyZ1', 'pulleyZ2', 'targetTau', 'desiredCenter', 'motorPower', 'driverSpeed', 'serviceFactor'],
  gears: ['gearToothType', 'gearPower', 'gearTorqueInput', 'gearSpeed', 'gearTargetTau', 'gearTauTolVal',
    'gearLockedMVal', 'gearLockedLVal', 'gearZ1', 'gearZ2', 'gearTargetCenter', 'gearXr1', 'gearKeInput', 'gearSigmaH',
    'gwToothType', 'gwModule', 'gwFaceWidth', 'gwZ1', 'gwZ2', 'gwSpeed', 'gwAlpha', 'gwXr1', 'gwKe', 'gwSigmaH', 'gwSigmaL'],
  shafts: ['shaftMf', 'shaftBendCycle', 'shaftTorqueInput', 'shaftPower', 'shaftSpeed', 'shaftMt', 'shaftTorsionCycle', 'shaftAxial',
    'shaftSecTorque', 'shaftSigmaR', 'shaftSigmaS', 'shaftSigmaLF', 'shaftLife', 'shaftCycles', 'shaftNotchType', 'shaftDcheck', 'shaftDd', 'shaftDDcheck',
    'shaftR', 'shaftKeyType', 'shaftKeyCond', 'shaftKe', 'shaftKeT', 'shaftFinish', 'shaftX',
    'shaftXA', 'shaftXB', 'shaftAxialBearing', 'shaftTheta', 'shaftBearingLife', 'shaftBearingType', 'shaftSecX',
    ...[1, 2, 3, 4].flatMap(i => ['Type', 'X', 'D', 'Helix', 'Torque', 'FtDir', 'FrDir', 'FaDir', 'Fv', 'Fh', 'Fa', 'E'].map(f => 'shaftEl' + i + f))]
};
// Inputs whose value depends on the unit system: always written when the unit is not metric
const SHARE_UNIT_FIELDS = ['nominalDiameter', 'reverseTargetVal', 'desiredCenter'];
const SHARE_TOGGLES = { autoZ: 'toggleAutoZ', lockM: 'toggleLockM', lockL: 'toggleLockL' };

let shareDefaults = null;
let shareSyncEnabled = false;

function shareEl(id) { return document.getElementById(id); }

function shareCheckedRadio(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : null;
}

// Snapshot of everything a link can carry
function readShareState() {
  const s = { m: activeModule, lang: currentLang, unit: currentUnit };
  for (const id of SHARE_FIELDS[activeModule] || []) {
    const el = shareEl(id);
    if (el) s[id] = el.type === 'checkbox' ? (el.checked ? '1' : '0') : String(el.value);
  }
  if (activeModule === 'fits') {
    s.mode = currentMode;
  } else if (activeModule === 'belts') {
    s.bmode = currentBeltMode;
    s.ratio = currentRatioMethod;
  } else if (activeModule === 'gears') {
    s.gop = currentGearOpMode;
    s.load = shareCheckedRadio('gearLoadMode') || 'power';
    s.geom = shareCheckedRadio('gearGeomMode') || 'tau';
    for (const [k, id] of Object.entries(SHARE_TOGGLES)) s[k] = shareEl(id)?.checked ? '1' : '0';
    s.combo = String(typeof selectedComboIdx !== 'undefined' ? selectedComboIdx : 0);
    s.s3 = (typeof selectedAlternativeModule !== 'undefined' && selectedAlternativeModule) || 'strict';
  } else if (activeModule === 'shafts') {
    s.smode = typeof currentShaftMode !== 'undefined' ? currentShaftMode : 'design';
  }
  return s;
}

function buildShareQuery() {
  const s = readShareState();
  const d = shareDefaults || {};
  const q = new URLSearchParams();
  q.set('m', s.m);
  for (const [k, v] of Object.entries(s)) {
    if (k === 'm') continue;
    const keepForUnit = s.unit !== 'metric' && SHARE_UNIT_FIELDS.includes(k);
    if (keepForUnit || d[k] === undefined || d[k] !== v) q.set(k, v);
  }
  // the selected optimizer row only matters when the optimizer is on
  if (s.m === 'gears' && s.autoZ !== '1') q.delete('combo');
  return q.toString();
}

function shareUrl() {
  const u = new URL(window.location.href);
  u.search = buildShareQuery();
  u.hash = '';
  return u.toString();
}

function syncShareUrl() {
  if (!shareSyncEnabled) return;
  try {
    let qs = buildShareQuery();
    if (qs === 'm=fits') qs = '';   // initial state: keep the address clean
    const next = window.location.pathname + (qs ? '?' + qs : '');
    if (next !== window.location.pathname + window.location.search) history.replaceState(null, '', next);
  } catch (e) { /* URL sync is a convenience: never break the calculator */ }
}

// Apply a state read from the URL. Unknown keys and invalid values are ignored.
function applyShareState(q) {
  const m = q.get('m');
  if (!['fits', 'belts', 'gears', 'shafts'].includes(m)) return false;

  const lang = q.get('lang');
  if (lang === 'it' || lang === 'en') updateLanguage(lang);
  const unit = q.get('unit');
  if (unit === 'metric' || unit === 'imperial') setUnit(unit);   // converts the defaults first, then values are set

  for (const id of SHARE_FIELDS[m]) {
    if (!q.has(id)) continue;
    const el = shareEl(id), v = q.get(id);
    if (!el) continue;
    if (el.type === 'checkbox') {
      el.checked = v === '1';
    } else if (el.tagName === 'SELECT') {
      if ([...el.options].some(o => o.value === v)) el.value = v;
    } else if (v !== '' && isFinite(Number(v))) {
      el.value = v;
    }
  }

  if (m === 'fits') {
    const mode = q.get('mode');
    if (mode === 'direct' || mode === 'reverse') setMode(mode);
  } else if (m === 'belts') {
    const ratio = q.get('ratio');
    if (ratio === 'teeth' || ratio === 'tau') {
      const radio = shareEl(ratio === 'teeth' ? 'methodTeeth' : 'methodTau');
      if (radio) radio.checked = true;
      setRatioMethod(ratio);
    }
    const bmode = q.get('bmode');
    if (bmode === 'geom' || bmode === 'power') setBeltSubMode(bmode);
  } else if (m === 'gears') {
    // toggles first: the geometry radio handler reads the auto-z toggle
    for (const [k, id] of Object.entries(SHARE_TOGGLES)) {
      if (!q.has(k)) continue;
      const el = shareEl(id);
      if (el) { el.checked = q.get(k) === '1'; el.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    for (const [k, name] of [['load', 'gearLoadMode'], ['geom', 'gearGeomMode']]) {
      if (!q.has(k)) continue;
      const radio = document.querySelector(`input[name="${name}"][value="${CSS.escape(q.get(k))}"]`);
      if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    shareEl('gwToothType')?.dispatchEvent(new Event('change', { bubbles: true }));
    const s3 = q.get('s3');
    if (s3 === 'recommended' || s3 === 'strict') selectedAlternativeModule = s3;
    const combo = parseInt(q.get('combo'), 10);
    if (Number.isInteger(combo) && combo >= 0 && combo < 8) selectedComboIdx = combo;
    const gop = q.get('gop');
    if (gop === 'design' || gop === 'wmax') setGearOpMode(gop);
  } else if (m === 'shafts') {
    const smode = q.get('smode');
    if (smode === 'beam' || smode === 'design' || smode === 'check') currentShaftMode = smode;
    if (typeof setShaftMode === 'function') setShaftMode(currentShaftMode);
  }

  switchModule(m);   // shows the module and recalculates
  return true;
}

function copyShareLink(btn) {
  const url = shareUrl();
  const t = translations[currentLang];
  const done = () => {
    if (!btn) return;
    const label = btn.querySelector('[data-i18n="shareBtn"]');
    if (label) {
      label.innerText = t.shareCopied;
      clearTimeout(btn._shareTimer);
      btn._shareTimer = setTimeout(() => { label.innerText = translations[currentLang].shareBtn; }, 2000);
    }
  };
  // phones: native share sheet; desktop: clipboard
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (coarse && navigator.share) {
    navigator.share({ title: 'MechCalc', url }).catch(() => {});
    return;
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(url).then(done, () => fallbackCopy(url, done));
  } else {
    fallbackCopy(url, done);
  }
}

function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
  document.body.removeChild(ta);
}

// Called once from the boot sequence, after the default calculation
function initShareLinks() {
  shareDefaults = { lang: currentLang, unit: currentUnit, mode: currentMode, bmode: currentBeltMode, ratio: currentRatioMethod, gop: currentGearOpMode,
    smode: typeof currentShaftMode !== 'undefined' ? currentShaftMode : 'beam' };
  const saved = activeModule;
  for (const m of Object.keys(SHARE_FIELDS)) {
    activeModule = m;
    Object.assign(shareDefaults, readShareState());
  }
  activeModule = saved;
  delete shareDefaults.m;

  try {
    const q = new URLSearchParams(window.location.search);
    if (q.has('m')) applyShareState(q);
  } catch (e) { console.error(e); }

  shareSyncEnabled = true;
  let timer = null;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(syncShareUrl, 250); };
  ['input', 'change', 'click'].forEach(ev => document.addEventListener(ev, schedule));
  syncShareUrl();

  document.querySelectorAll('.js-share-btn').forEach(btn => btn.addEventListener('click', () => copyShareLink(btn)));
}
