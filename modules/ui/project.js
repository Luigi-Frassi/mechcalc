// ============================================================================
// PROJECTS
// Project data (company, project, job number, client, drawn / checked / approved by, revisions, logo)
// used by every calculation report and every DXF title block; a project file (.torsio.json) keeps
// the inputs of all the modules together, so a whole job can be saved and reopened.
// The project data (not the calculations) are also remembered in this browser.
// ============================================================================

const PRJ_TXT = {
  it: {
    btn: 'Progetto', title: 'Dati del progetto', hint: 'Compaiono nell\'intestazione e nel cartiglio di ogni relazione e di ogni DXF. Restano salvati in questo browser.',
    company: 'Azienda / studio', project: 'Progetto', code: 'Commessa / n. documento', client: 'Cliente', drawnBy: 'Redatto da', checkedBy: 'Verificato da', approvedBy: 'Approvato da',
    rev: 'Revisione', revDesc: 'Descrizione della revisione', newRev: 'Nuova revisione', history: 'Storico delle revisioni', noHistory: 'Nessuna revisione precedente.',
    logo: 'Logo', logoHint: 'PNG, JPG o SVG. Senza logo si usa il marchio Torsio.', logoLoad: 'Carica logo', logoRemove: 'Rimuovi',
    file: 'File di progetto', fileHint: 'Il file contiene i dati del progetto e gli input di tutti i moduli.', save: 'Salva progetto', open: 'Apri progetto…', clear: 'Svuota i dati del progetto',
    close: 'Chiudi', opened: n => `Progetto aperto: ${n}`, saved: 'Progetto salvato', bad: 'Il file non è un progetto di Torsio Engineering.', logoBig: 'Immagine troppo grande (max 2 MB).',
    date: 'Data', by: 'Autore', initialRev: 'Prima emissione',
    tb: { desc: 'Descrizione', title: 'Titolo', project: 'Progetto', code: 'Commessa', client: 'Cliente', drawn: 'Redatto', checked: 'Verificato', approved: 'Approvato', rev: 'Rev.', date: 'Data', scale: 'Scala', sheet: 'Foglio', format: 'Formato', signature: 'firma' }
  },
  en: {
    btn: 'Project', title: 'Project data', hint: 'They appear in the header and in the title block of every report and every DXF. They are kept in this browser.',
    company: 'Company / office', project: 'Project', code: 'Job / document no.', client: 'Client', drawnBy: 'Drawn by', checkedBy: 'Checked by', approvedBy: 'Approved by',
    rev: 'Revision', revDesc: 'Revision description', newRev: 'New revision', history: 'Revision history', noHistory: 'No previous revisions.',
    logo: 'Logo', logoHint: 'PNG, JPG or SVG. Without a logo the Torsio mark is used.', logoLoad: 'Upload logo', logoRemove: 'Remove',
    file: 'Project file', fileHint: 'The file holds the project data and the inputs of every module.', save: 'Save project', open: 'Open project…', clear: 'Clear the project data',
    close: 'Close', opened: n => `Project opened: ${n}`, saved: 'Project saved', bad: 'The file is not a Torsio Engineering project.', logoBig: 'Image too large (max 2 MB).',
    date: 'Date', by: 'Author', initialRev: 'First issue',
    tb: { desc: 'Description', title: 'Title', project: 'Project', code: 'Job no.', client: 'Client', drawn: 'Drawn', checked: 'Checked', approved: 'Approved', rev: 'Rev.', date: 'Date', scale: 'Scale', sheet: 'Sheet', format: 'Size', signature: 'signature' }
  }
};

const PRJ_FIELDS = ['company', 'project', 'code', 'client', 'drawnBy', 'checkedBy', 'approvedBy', 'rev', 'revDesc'];
const PRJ_STORE = 'torsioProject';
const PRJ_MODULES = ['fits', 'belts', 'gears', 'shafts', 'frames', 'bolts'];

function prjEmpty() { return { company: '', project: '', code: '', client: '', drawnBy: '', checkedBy: '', approvedBy: '', rev: '0', revDesc: '', revisions: [], logo: null }; }
let projectMeta = prjEmpty();

function prjT() { return PRJ_TXT[currentLang] || PRJ_TXT.en; }
function prjEsc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function prjToday() { return new Date().toLocaleDateString(currentLang === 'it' ? 'it-IT' : 'en-GB'); }

function prjStore() { try { localStorage.setItem(PRJ_STORE, JSON.stringify(projectMeta)); } catch (e) { /* storage unavailable: data stay for this session */ } }
function prjLoadStored() {
  try { const s = JSON.parse(localStorage.getItem(PRJ_STORE) || 'null'); if (s && typeof s === 'object') projectMeta = prjSanitize(s); } catch (e) { /* ignore */ }
}
function prjSanitize(o) {
  const m = prjEmpty();
  for (const k of PRJ_FIELDS) if (typeof o[k] === 'string') m[k] = o[k].slice(0, 200);
  if (Array.isArray(o.revisions)) m.revisions = o.revisions.slice(0, 50).filter(r => r && typeof r === 'object').map(r => ({ rev: String(r.rev ?? '').slice(0, 10), date: String(r.date ?? '').slice(0, 20), desc: String(r.desc ?? '').slice(0, 200), by: String(r.by ?? '').slice(0, 80) }));
  if (typeof o.logo === 'string' && /^data:image\/(png|jpeg|gif|webp|svg\+xml);base64,/.test(o.logo) && o.logo.length < 3e6) m.logo = o.logo;
  return m;
}

// Next revision label: 0 → 1, A → B, 1.2 → 1.3
function prjNextRev(r) {
  r = String(r || '').trim();
  if (/^\d+$/.test(r)) return String(+r + 1);
  if (/^[A-Y]$/i.test(r)) return String.fromCharCode(r.charCodeAt(0) + 1);
  const m = r.match(/^(.*?)(\d+)$/);
  return m ? m[1] + (+m[2] + 1) : (r ? r + '1' : '1');
}

// ---- panel -------------------------------------------------------------------------------------
const PRJ_IN = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none';
const PRJ_LBL = 'block text-xs font-semibold text-slate-300 mb-1';
const PRJ_BTN = 'px-3 py-2 rounded-lg text-xs font-semibold border border-slate-700 text-slate-200 hover:bg-slate-800';

function prjBuildPanel() {
  let p = document.getElementById('prjPanel');
  if (p) return p;
  p = document.createElement('div');
  p.id = 'prjPanel';
  p.className = 'hidden fixed inset-0 z-[60] flex items-start justify-center bg-black/60 p-3 overflow-y-auto';
  p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('aria-labelledby', 'prjTitle');
  p.innerHTML = `<div class="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-5 my-6 text-slate-200">
    <div class="flex items-start justify-between gap-4 mb-1"><h2 id="prjTitle" class="text-lg font-bold text-white"></h2><button type="button" id="prjClose" class="${PRJ_BTN}"></button></div>
    <p class="text-xs text-slate-400 mb-4" id="prjHint"></p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="prjFields"></div>
    <div class="grid grid-cols-1 sm:grid-cols-[120px_1fr_auto] gap-3 mt-3 items-end">
      <div><label class="${PRJ_LBL}" for="prj_rev" id="prjRevLbl"></label><input id="prj_rev" class="${PRJ_IN}" maxlength="10"></div>
      <div><label class="${PRJ_LBL}" for="prj_revDesc" id="prjRevDescLbl"></label><input id="prj_revDesc" class="${PRJ_IN}" maxlength="200"></div>
      <button type="button" id="prjNewRev" class="${PRJ_BTN}"></button>
    </div>
    <div class="mt-3"><div class="text-xs font-semibold text-slate-300 mb-1" id="prjHistLbl"></div><div id="prjHist" class="text-xs text-slate-400"></div></div>
    <div class="mt-5 border-t border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div><div class="${PRJ_LBL}" id="prjLogoLbl"></div>
        <div class="flex items-center gap-3"><div class="w-24 h-14 rounded-md bg-white flex items-center justify-center overflow-hidden" id="prjLogoPrev"></div>
          <div class="flex flex-col gap-1.5"><label class="${PRJ_BTN} cursor-pointer text-center"><span id="prjLogoLoad"></span><input type="file" id="prjLogoFile" accept="image/png,image/jpeg,image/svg+xml,image/webp" class="hidden"></label>
          <button type="button" id="prjLogoRemove" class="${PRJ_BTN}"></button></div></div>
        <p class="text-[11px] text-slate-500 mt-1" id="prjLogoHint"></p></div>
      <div><div class="${PRJ_LBL}" id="prjFileLbl"></div>
        <div class="flex flex-wrap gap-2"><button type="button" id="prjSave" class="px-3 py-2 rounded-lg text-xs font-bold bg-[#e8b321] text-slate-950 hover:bg-[#f0c241]"></button>
          <label class="${PRJ_BTN} cursor-pointer"><span id="prjOpen"></span><input type="file" id="prjFile" accept=".json,application/json" class="hidden"></label></div>
        <p class="text-[11px] text-slate-500 mt-1" id="prjFileHint"></p>
        <button type="button" id="prjClear" class="mt-2 text-[11px] text-slate-400 hover:text-rose-300 underline"></button></div>
    </div>
    <p class="text-xs text-amber-300 mt-3 min-h-[1em]" id="prjMsg" role="status"></p>
  </div>`;
  document.body.appendChild(p);
  p.addEventListener('click', ev => { if (ev.target === p) prjClosePanel(); });
  p.addEventListener('keydown', ev => { if (ev.key === 'Escape') prjClosePanel(); });
  document.getElementById('prjClose').addEventListener('click', prjClosePanel);
  p.addEventListener('input', ev => {
    const k = ev.target.id && ev.target.id.startsWith('prj_') ? ev.target.id.slice(4) : null;
    if (k && PRJ_FIELDS.includes(k)) { projectMeta[k] = ev.target.value; prjStore(); }
  });
  document.getElementById('prjNewRev').addEventListener('click', () => {
    projectMeta.revisions.push({ rev: projectMeta.rev || '0', date: prjToday(), desc: projectMeta.revDesc || (projectMeta.revisions.length ? '' : prjT().initialRev), by: projectMeta.drawnBy || '' });
    projectMeta.rev = prjNextRev(projectMeta.rev);
    projectMeta.revDesc = '';
    prjStore(); prjFill();
  });
  document.getElementById('prjLogoFile').addEventListener('change', ev => { const f = ev.target.files[0]; ev.target.value = ''; if (f) prjReadLogo(f); });
  document.getElementById('prjLogoRemove').addEventListener('click', () => { projectMeta.logo = null; prjStore(); prjFill(); });
  document.getElementById('prjSave').addEventListener('click', projectSaveFile);
  document.getElementById('prjFile').addEventListener('change', ev => { const f = ev.target.files[0]; ev.target.value = ''; if (f) projectOpenFile(f); });
  document.getElementById('prjClear').addEventListener('click', () => { projectMeta = prjEmpty(); prjStore(); prjFill(); });
  return p;
}

function prjFill() {
  const t = prjT();
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('prjTitle', t.title); set('prjClose', t.close); set('prjHint', t.hint); set('prjRevLbl', t.rev); set('prjRevDescLbl', t.revDesc); set('prjNewRev', t.newRev);
  set('prjHistLbl', t.history); set('prjLogoLbl', t.logo); set('prjLogoLoad', t.logoLoad); set('prjLogoRemove', t.logoRemove); set('prjLogoHint', t.logoHint);
  set('prjFileLbl', t.file); set('prjSave', t.save); set('prjOpen', t.open); set('prjFileHint', t.fileHint); set('prjClear', t.clear);
  document.getElementById('prjFields').innerHTML = ['company', 'project', 'code', 'client', 'drawnBy', 'checkedBy', 'approvedBy'].map(k =>
    `<div class="${k === 'company' || k === 'project' ? 'sm:col-span-2' : ''}"><label class="${PRJ_LBL}" for="prj_${k}">${t[k]}</label><input id="prj_${k}" class="${PRJ_IN}" maxlength="200" value="${prjEsc(projectMeta[k])}"></div>`).join('');
  document.getElementById('prj_rev').value = projectMeta.rev;
  document.getElementById('prj_revDesc').value = projectMeta.revDesc;
  document.getElementById('prjHist').innerHTML = projectMeta.revisions.length
    ? `<table class="w-full text-left"><thead><tr class="text-slate-500"><th class="pr-2">${t.tb.rev}</th><th class="pr-2">${t.date}</th><th class="pr-2">${t.revDesc}</th><th>${t.by}</th></tr></thead><tbody>` +
      projectMeta.revisions.map(r => `<tr class="border-t border-slate-800"><td class="pr-2 py-0.5">${prjEsc(r.rev)}</td><td class="pr-2">${prjEsc(r.date)}</td><td class="pr-2">${prjEsc(r.desc)}</td><td>${prjEsc(r.by)}</td></tr>`).join('') + '</tbody></table>'
    : t.noHistory;
  document.getElementById('prjLogoPrev').innerHTML = `<img src="${projectMeta.logo || 'vendor/brand/torsio-mark.svg'}" alt="" class="max-w-full max-h-full object-contain">`;
}

function projectOpenPanel() {
  const p = prjBuildPanel();
  prjFill();
  document.getElementById('prjMsg').textContent = '';
  p.classList.remove('hidden');
  setTimeout(() => document.getElementById('prj_company')?.focus(), 0);
}
function prjClosePanel() { document.getElementById('prjPanel')?.classList.add('hidden'); document.getElementById('projectBtn')?.focus(); }

// Logo: scaled down to at most 600 px (raster) so reports and project files stay small
function prjReadLogo(file) {
  const msg = document.getElementById('prjMsg');
  if (file.size > 2e6) { if (msg) msg.textContent = prjT().logoBig; return; }
  const rd = new FileReader();
  rd.onload = () => {
    const url = String(rd.result);
    if (file.type === 'image/svg+xml') { projectMeta.logo = url; prjStore(); prjFill(); return; }
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 600 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      projectMeta.logo = c.toDataURL('image/png');
      prjStore(); prjFill();
    };
    img.src = url;
  };
  rd.readAsDataURL(file);
}

// ---- project file ------------------------------------------------------------------------------
function projectSnapshot() {
  const prev = activeModule, modules = {};
  for (const m of PRJ_MODULES) {
    activeModule = m;
    try { modules[m] = readShareState(); } catch (e) { /* module not available */ }
  }
  activeModule = prev;
  return { app: 'torsio-engineering', version: 1, saved: new Date().toISOString(), active: prev, lang: currentLang, unit: currentUnit, meta: projectMeta, modules };
}

function prjFileName(ext) {
  const base = [projectMeta.code, projectMeta.project].filter(Boolean).join('_') || 'torsio-progetto';
  return base.replace(/[^\w\-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80) + (projectMeta.rev ? `_rev${projectMeta.rev}` : '') + ext;
}

function prjDownload(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function projectSaveFile() {
  prjDownload(prjFileName('.torsio.json'), JSON.stringify(projectSnapshot(), null, 1), 'application/json');
  const msg = document.getElementById('prjMsg');
  if (msg) msg.textContent = prjT().saved;
}

function projectApply(data) {
  if (!data || data.app !== 'torsio-engineering' || typeof data.modules !== 'object') return false;
  if (data.meta) { projectMeta = prjSanitize(data.meta); prjStore(); }
  const wasSync = typeof shareSyncEnabled !== 'undefined' ? shareSyncEnabled : false;
  if (typeof shareSyncEnabled !== 'undefined') shareSyncEnabled = false;
  for (const m of PRJ_MODULES) {
    const st = data.modules[m];
    if (!st || typeof st !== 'object') continue;
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(st)) if (typeof v === 'string' || typeof v === 'number') q.set(k, String(v));
    q.set('m', m);
    try { applyShareState(q); } catch (e) { console.error(e); }
  }
  if (typeof shareSyncEnabled !== 'undefined') shareSyncEnabled = wasSync;
  if (PRJ_MODULES.includes(data.active)) switchModule(data.active);
  if (typeof syncShareUrl === 'function') syncShareUrl();
  return true;
}

function projectOpenFile(file) {
  const rd = new FileReader();
  rd.onload = () => {
    let ok = false;
    try { ok = projectApply(JSON.parse(String(rd.result))); } catch (e) { ok = false; }
    const msg = document.getElementById('prjMsg');
    if (msg) msg.textContent = ok ? prjT().opened(projectMeta.project || file.name) : prjT().bad;
    if (ok) prjFill();
  };
  rd.readAsText(file);
}

// ---- data for the reports and the DXF title blocks ------------------------------------------------
function projectTitleData(title) {
  return { company: projectMeta.company, project: projectMeta.project, code: projectMeta.code, client: projectMeta.client, drawnBy: projectMeta.drawnBy,
    checkedBy: projectMeta.checkedBy, approvedBy: projectMeta.approvedBy, rev: projectMeta.rev || '0', date: prjToday(), title, revisions: projectMeta.revisions, logo: projectMeta.logo };
}

function initProjects() {
  prjLoadStored();
  const b = document.getElementById('projectBtn');
  if (b) b.addEventListener('click', projectOpenPanel);
}
