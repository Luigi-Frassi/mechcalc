// ============================================================================
// DXF EXPORT (UI): one drawing per module, with the project title block
//  • shafts: the whole shaft profile, proposed from the calculation (bearing seats at the designed bore,
//    gear seats at the shoulder diameter, collars between them, UNI 6604 keyways) and editable in a table
//  • structures: members, nodes, supports, loads, section names, and the outline of every chosen section
//  • gears: tip, pitch and root circles of the pair at the centre distance
//  • belts: pitch circles of the pulleys and the belt on the pitch line, at the actual centre distance
// ============================================================================

const DXF_TXT = {
  it: {
    card: 'Disegno dell\'albero per il CAD', cardHint: 'Profilo proposto dal calcolo: sedi dei cuscinetti al foro scelto, sedi delle ruote al diametro dello spallamento, collari tra le sedi, cave UNI 6604 dove c\'è una ruota o un giunto. Modifica la tabella come vuoi: il DXF segue la tabella.',
    from: 'da x [mm]', to: 'a x [mm]', dia: 'Ø [mm]', key: 'Cava', add: 'Aggiungi tratto', regen: 'Rigenera dal calcolo', download: 'Scarica DXF', manual: 'modificato a mano', auto: 'proposto dal calcolo',
    noDesign: 'Il diametro di progetto non è disponibile: il profilo usa d = 30 mm. Completa la scheda "Progetto sezione".',
    title: { shafts: 'Albero', frames: 'Struttura', gears: 'Coppia di ruote dentate', belts: 'Trasmissione a cinghia' },
    key: 'Cava', fillets: 'Raccordi non quotati', chamfers: 'smussi', bearing: 'Cuscinetto', gear: 'Ruota', coupling: 'Giunto', force: 'Carico',
    sections: 'Sezioni', pinion: 'Pignone', wheel: 'Ruota', tip: 'testa', pitch: 'primitivo', root: 'piede', centre: 'Interasse', belt: 'Cinghia', teeth: 'denti', pulley: 'Puleggia',
    none: 'Niente da disegnare: completa prima il calcolo.'
  },
  en: {
    card: 'Shaft drawing for CAD', cardHint: 'Profile proposed from the calculation: bearing seats at the chosen bore, gear seats at the shoulder diameter, collars between seats, UNI 6604 keyways where there is a gear or a coupling. Edit the table as you like: the DXF follows the table.',
    from: 'from x [mm]', to: 'to x [mm]', dia: 'Ø [mm]', key: 'Key', add: 'Add segment', regen: 'Regenerate from the calculation', download: 'Download DXF', manual: 'edited by hand', auto: 'proposed from the calculation',
    noDesign: 'The design diameter is not available: the profile uses d = 30 mm. Complete the "Design section" tab.',
    title: { shafts: 'Shaft', frames: 'Structure', gears: 'Gear pair', belts: 'Belt drive' },
    key: 'Key', fillets: 'Undimensioned fillets', chamfers: 'chamfers', bearing: 'Bearing', gear: 'Gear', coupling: 'Coupling', force: 'Load',
    sections: 'Sections', pinion: 'Pinion', wheel: 'Wheel', tip: 'tip', pitch: 'pitch', root: 'root', centre: 'Centre distance', belt: 'Belt', teeth: 'teeth', pulley: 'Pulley',
    none: 'Nothing to draw yet: complete the calculation first.'
  }
};
function dxfT() { return DXF_TXT[currentLang] || DXF_TXT.en; }
function dxfTB() {
  const t = typeof prjT === 'function' ? prjT().tb : {};
  const x = dxfT();
  return { ...x, titles: x.title, title: t.title || 'Title', project: t.project || 'Project', code: t.code || 'Job', client: t.client || 'Client', drawn: t.drawn || 'Drawn', checked: t.checked || 'Checked',
    approved: t.approved || 'Approved', scale: t.scale || 'Scale', format: t.format || 'Size', rev: t.rev || 'Rev.', date: t.date || 'Date' };
}
function dxfProject(title) { return typeof projectTitleData === 'function' ? projectTitleData(title) : { rev: '0', date: new Date().toLocaleDateString() }; }

// ---- shaft profile state -------------------------------------------------------------------------
let shaftProfile = { auto: true, segs: [], r: 1, info: '' };

function shaftProfileFromCalc() {
  const { Mt } = readShaftTorque();
  const bi = readShaftBeamInputs(Mt);
  const active = bi.elements.filter(e => e.type !== 'none');
  const { inp, Xreq } = readShaftInputs();
  let d = null, D = null, info = '';
  if (currentShaftMode === 'check') { d = shaftVal('shaftDcheck', 0); D = shaftVal('shaftDDcheck', 0); }
  else { try { const des = shaftDesign(inp, Xreq); if (des.ok) { d = des.d; D = des.D; } } catch (e) { /* keep null */ } }
  if (!(d > 0)) { d = 30; info = dxfT().noDesign; }
  if (!(D > d)) D = dxfCeil5(d * Math.max(1.1, inp.notch && inp.notch.Dd ? inp.notch.Dd : 1.2));
  const xs = [bi.xA, bi.xB, ...active.map(e => e.x)];
  const L = bi.L > 0 ? bi.L : Math.max(...xs) + 20;
  const features = [{ x: bi.xA, kind: 'bearing' }, { x: bi.xB, kind: 'bearing' }, ...active.map(e => ({ x: e.x, kind: e.type }))];
  const pr = shaftProfileProposal({ L, xA: bi.xA, xB: bi.xB, features, d, D, r: inp.notch && inp.notch.r ? inp.notch.r : shaftVal('shaftR', 1) });
  return { ...pr, info };
}

function shaftProfileLabels() {
  const t = dxfT();
  const { Mt } = readShaftTorque();
  const bi = readShaftBeamInputs(Mt);
  const active = bi.elements.filter(e => e.type !== 'none');
  const lab = shaftPointLabels(bi.xA, bi.xB, active.map(e => e.x), bi.L);
  const out = [{ x: bi.xA, text: `${t.bearing} ${lab.bearing1}` }, { x: bi.xB, text: `${t.bearing} ${lab.bearing2}` }];
  active.forEach((e, i) => out.push({ x: e.x, text: `${{ gear: t.gear, coupling: t.coupling, force: t.force }[e.type] || ''} ${lab.elements[i]}${e.type === 'gear' ? ` Ø${e.d}` : ''}` }));
  return out;
}

function shaftProfileRefresh() {
  if (shaftProfile.auto) { const p = shaftProfileFromCalc(); shaftProfile = { auto: true, ...p }; }
  shaftProfileRender();
}

function shaftProfileCard() {
  let c = document.getElementById('shaftProfileCard');
  if (c) return c;
  const sec = document.getElementById('moduleShaftsSection');
  if (!sec) return null;
  c = document.createElement('div');
  c.id = 'shaftProfileCard';
  c.className = 'bg-slate-800/60 p-5 rounded-xl border border-slate-700/60 mb-6';
  sec.appendChild(c);
  c.addEventListener('change', ev => {
    const tr = ev.target.closest('tr[data-i]'); if (!tr) return;
    const i = +tr.dataset.i, f = ev.target.dataset.f, sg = shaftProfile.segs[i];
    if (!sg || !f) return;
    if (f === 'key') sg.key = ev.target.checked;
    else { const v = parseFloat(ev.target.value); if (Number.isFinite(v)) sg[f] = Math.max(0, v); }
    if (f === 'x1' && shaftProfile.segs[i + 1]) shaftProfile.segs[i + 1].x0 = sg.x1;
    if (f === 'x0' && shaftProfile.segs[i - 1]) shaftProfile.segs[i - 1].x1 = sg.x0;
    shaftProfile.auto = false;
    shaftProfileRender(); shareProfileSync();
  });
  c.addEventListener('click', ev => {
    const b = ev.target.closest('button[data-act]'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'regen') { shaftProfile.auto = true; shaftProfileRefresh(); shareProfileSync(); return; }
    if (act === 'add') { const last = shaftProfile.segs[shaftProfile.segs.length - 1]; const x0 = last ? last.x1 : 0; shaftProfile.segs.push({ x0, x1: x0 + 20, d: last ? last.d : 30, key: false }); shaftProfile.auto = false; }
    if (act === 'del') { shaftProfile.segs.splice(+b.dataset.i, 1); for (let i = 1; i < shaftProfile.segs.length; i++) shaftProfile.segs[i].x0 = shaftProfile.segs[i - 1].x1; shaftProfile.auto = false; }
    if (act === 'dxf') { exportDxf('shafts'); return; }
    shaftProfileRender(); shareProfileSync();
  });
  return c;
}
function shareProfileSync() { if (typeof syncShareUrl === 'function') syncShareUrl(); }

function shaftProfilePreviewSvg(p) {
  const segs = p.segs; if (!segs.length) return '';
  const L = segs[segs.length - 1].x1, dmax = Math.max(...segs.map(s => s.d)), W = 640, H = 150, k = Math.min((W - 40) / L, (H - 40) / dmax), x0 = 20, cy = H / 2;
  let g = `<line x1="${x0 - 8}" y1="${cy}" x2="${x0 + L * k + 8}" y2="${cy}" stroke="#ef4444" stroke-dasharray="10 3 2 3" stroke-width="0.8"/>`;
  segs.forEach(s => {
    g += `<rect x="${x0 + s.x0 * k}" y="${cy - s.d / 2 * k}" width="${Math.max(0.5, (s.x1 - s.x0) * k)}" height="${s.d * k}" fill="#475569" fill-opacity="0.55" stroke="#e2e8f0" stroke-width="1"/>`;
    if (s.key) { const kk = dxfKeyFor(s.d), len = (s.x1 - s.x0) * 0.8; g += `<rect x="${x0 + ((s.x0 + s.x1) / 2 - len / 2) * k}" y="${cy - s.d / 2 * k}" width="${len * k}" height="${kk.t1 * k}" fill="#fbbf24" fill-opacity="0.8"/>`; }
    if ((s.x1 - s.x0) * k > 26) g += `<text x="${x0 + (s.x0 + s.x1) / 2 * k}" y="${cy + 4}" text-anchor="middle" font-size="10.5" fill="#f8fafc" font-weight="600">Ø${dxfFmt(s.d)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="w-full h-auto" font-family="Archivo, Arial, sans-serif">${g}</svg>`;
}

function shaftProfileRender() {
  const c = shaftProfileCard(); if (!c) return;
  const t = dxfT(), p = shaftProfile, IN = 'w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-white text-xs';
  c.innerHTML = `<div class="flex flex-wrap items-start justify-between gap-3 mb-2"><div><h3 class="text-sm font-semibold text-white">${t.card}</h3>
      <p class="text-[11px] text-slate-400 mt-0.5">${p.auto ? t.auto : t.manual}</p></div>
      <div class="flex flex-wrap gap-2"><button type="button" data-act="regen" class="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 text-slate-200 hover:bg-slate-800">${t.regen}</button>
      <button type="button" data-act="dxf" id="shaftDxfBtn" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#e8b321] text-slate-950 hover:bg-[#f0c241]">📐 ${t.download}</button></div></div>
    <p class="text-xs text-slate-400 mb-3 max-w-3xl">${t.cardHint}</p>${p.info ? `<p class="text-xs text-amber-300 mb-2">${p.info}</p>` : ''}
    <div class="rounded-lg bg-slate-950/70 border border-slate-800 p-2 mb-3">${shaftProfilePreviewSvg(p)}</div>
    <div class="overflow-x-auto"><table class="text-xs text-left" id="shaftProfileTbl"><thead><tr class="text-slate-400"><th class="pr-2 pb-1">#</th><th class="pr-2">${t.from}</th><th class="pr-2">${t.to}</th><th class="pr-2">${t.dia}</th><th class="pr-2">${t.key}</th><th></th></tr></thead><tbody>` +
    p.segs.map((s, i) => `<tr data-i="${i}"><td class="pr-2 text-slate-400">${i + 1}</td><td class="pr-2"><input class="${IN}" type="number" step="any" data-f="x0" value="${s.x0}"></td><td class="pr-2"><input class="${IN}" type="number" step="any" data-f="x1" value="${s.x1}"></td>` +
      `<td class="pr-2"><input class="${IN}" type="number" step="any" min="1" data-f="d" value="${s.d}"></td><td class="pr-2"><input type="checkbox" data-f="key" ${s.key ? 'checked' : ''}>${s.key ? ` <span class="text-slate-400">${dxfKeyFor(s.d).b}×${dxfKeyFor(s.d).t1}</span>` : ''}</td>` +
      `<td><button type="button" data-act="del" data-i="${i}" class="text-slate-500 hover:text-rose-400 px-1">✕</button></td></tr>`).join('') +
    `</tbody></table></div><button type="button" data-act="add" class="mt-2 text-xs text-blue-300 hover:text-blue-200">+ ${t.add}</button>`;
}

// compact encoding for links and project files: "x0:x1:d:k;..."
function shaftProfileEncode() { return shaftProfile.auto ? '' : shaftProfile.segs.map(s => [s.x0, s.x1, s.d, s.key ? 1 : 0].join(':')).join(';') + '|' + shaftProfile.r; }
function shaftProfileDecode(str) {
  if (!str) return;
  const [segStr, rStr] = String(str).split('|');
  const segs = segStr.split(';').map(q => q.split(':').map(Number)).filter(a => a.length >= 3 && a.slice(0, 3).every(Number.isFinite)).slice(0, 40)
    .map(([x0, x1, d, k]) => ({ x0, x1, d: Math.max(1, d), key: k === 1 }));
  if (segs.length) shaftProfile = { auto: false, segs, r: Math.max(0.1, parseFloat(rStr) || 1), info: '' };
  shaftProfileRender();
}

// ---- builders --------------------------------------------------------------------------------------
function dxfBuildShaft() {
  const t = dxfTB();
  if (shaftProfile.auto) shaftProfileRefresh();
  if (!shaftProfile.segs.length) return null;
  const dmax = Math.max(...shaftProfile.segs.map(s => s.d));
  const title = `${t.titles.shafts} Ø${dxfFmt(dmax)} × ${dxfFmt(shaftProfile.segs[shaftProfile.segs.length - 1].x1)}`;
  return shaftDxf(shaftProfile, shaftProfileLabels(), dxfProject(title), t, title);
}

function dxfBuildFrames() {
  if (typeof frModel === 'undefined' || !frModel || !frModel.members.length) return null;
  const t = dxfTB(), m = frModel, R = frResults, fam = frSelFamily, z = fam && R ? R.byFamily[fam] : null;
  const d = new DxfWriter();
  d.layer('ASTE', 7, 'CONTINUOUS').layer('ASSI', 1, 'CENTER').layer('NODI', 7, 'CONTINUOUS').layer('VINCOLI', 4, 'CONTINUOUS').layer('CARICHI', 2, 'CONTINUOUS').layer('SEZIONI', 7, 'CONTINUOUS').layer('TESTI', 2, 'CONTINUOUS').layer('QUOTE', 3, 'CONTINUOUS');
  const xs = m.nodes.map(n => n.x), ys = m.nodes.map(n => n.y);
  const sx0 = Math.min(...xs), sx1 = Math.max(...xs), sy0 = Math.min(...ys), sy1 = Math.max(...ys), span = Math.max(sx1 - sx0, sy1 - sy0, 500);
  const secs = z && z.secs ? z.secs : null;
  const uniq = secs ? [...new Map(secs.map(s => [s.name, s])).values()] : [];
  const secMax = uniq.length ? Math.max(...uniq.map(s => Math.max(s.dims.h || s.dims.D || s.dims.d || s.dims.B || 0, s.dims.b || 0))) : 0;
  const rowY = sy0 - span * 0.12 - secMax;      // sections below the structure, at real size
  const box = { x0: sx0 - span * 0.06, x1: Math.max(sx1 + span * 0.06, sx0 + uniq.length * (secMax * 1.8 + 50)), y0: (uniq.length ? rowY - secMax * 0.9 - span * 0.05 : sy0 - span * 0.1), y1: sy1 + span * 0.08 };
  const title = `${t.titles.frames}${fam && z && z.ok ? ' · ' + (FR_TXT[currentLang] || FR_TXT.en).fam[fam] : ''}`;
  const sh = dxfSheet(d, box, dxfProject(title), t, title);
  const th = sh.th(2.5), sym = sh.th(4);
  // members as centre lines (the axis of each member, as in the model)
  m.members.forEach((mm, i) => {
    const a = m.nodes[mm.n1], b = m.nodes[mm.n2];
    d.line(a.x, a.y, b.x, b.y, 'ASTE');
    const L = Math.hypot(b.x - a.x, b.y - a.y), ux = (b.x - a.x) / L, uy = (b.y - a.y) / L;
    let rot = Math.atan2(uy, ux) * 180 / Math.PI; if (rot > 90.001 || rot <= -90) rot += 180;
    const lbl = `${i + 1}${secs ? ' · ' + secs[i].name : ''}`;
    d.text((a.x + b.x) / 2 - uy * th * 0.8, (a.y + b.y) / 2 + ux * th * 0.8, th, lbl, { align: 'center', rot });
    if (mm.relStart) d.circle(a.x + ux * sym * 0.8, a.y + uy * sym * 0.8, sym * 0.25, 'NODI');
    if (mm.relEnd) d.circle(b.x - ux * sym * 0.8, b.y - uy * sym * 0.8, sym * 0.25, 'NODI');
  });
  m.nodes.forEach((n, i) => { d.circle(n.x, n.y, sym * 0.15, 'NODI'); d.text(n.x + sym * 0.4, n.y + sym * 0.4, th * 0.85, String(i + 1), { layer: 'NODI' }); });
  // supports
  m.supports.forEach(s => {
    const n = m.nodes[s.node]; if (!n) return;
    const { x, y } = n, h = sym;
    if (s.type === 'fixed') { d.line(x - h, y, x + h, y, 'VINCOLI'); for (let k = -1; k <= 1; k += 0.5) d.line(x + k * h, y, x + k * h - h * 0.35, y - h * 0.4, 'VINCOLI'); return; }
    if (s.type === 'rollerY') { d.poly([{ x, y }, { x: x - h, y: y + h * 0.6 }, { x: x - h, y: y - h * 0.6 }], true, 'VINCOLI'); d.line(x - h * 1.4, y - h * 0.8, x - h * 1.4, y + h * 0.8, 'VINCOLI'); return; }
    d.poly([{ x, y }, { x: x - h * 0.6, y: y - h }, { x: x + h * 0.6, y: y - h }], true, 'VINCOLI');
    if (s.type === 'rollerX' || s.type === 'guide') d.line(x - h * 0.9, y - h * 1.35, x + h * 0.9, y - h * 1.35, 'VINCOLI');
    else for (let k = -0.6; k <= 0.6; k += 0.3) d.line(x + k * h, y - h, x + k * h - h * 0.3, y - h * 1.35, 'VINCOLI');
  });
  // loads
  const Fmax = Math.max(1, ...m.loads.map(l => Math.hypot(l.Fx || 0, l.Fy || 0)));
  m.loads.forEach(l => {
    const n = m.nodes[l.node], F = Math.hypot(l.Fx || 0, l.Fy || 0); if (!n || !F) return;
    const len = sym * (2 + 2 * F / Fmax), ux = (l.Fx || 0) / F, uy = (l.Fy || 0) / F;
    d.line(n.x - ux * len, n.y - uy * len, n.x - ux * sym * 0.3, n.y - uy * sym * 0.3, 'CARICHI');
    d.arrow(n.x - ux * sym * 0.3, n.y - uy * sym * 0.3, ux, uy, sym * 0.6, 'CARICHI');
    d.text(n.x - ux * (len + th), n.y - uy * (len + th), th, `${dxfFmt(F / 1000)} kN`, { layer: 'CARICHI', align: 'center', valign: 'middle' });
  });
  m.dloads.forEach(dl => {
    const mm = m.members[dl.member]; if (!mm) return;
    const a = m.nodes[mm.n1], b = m.nodes[mm.n2];
    d.text((a.x + b.x) / 2, Math.max(a.y, b.y) + sym * 2.2, th, `q = ${dxfFmt(Math.abs(dl.q))} kN/m`, { layer: 'CARICHI', align: 'center' });
  });
  // overall dimensions
  if (sx1 - sx0 > 1) d.dim(sx0, sy0, sx1, sy0, -sym * 3, dxfFmt(sx1 - sx0), th);
  if (sy1 - sy0 > 1) d.dim(sx1, sy0, sx1, sy1, -sym * 3, dxfFmt(sy1 - sy0), th);
  // sections at real size, in a row
  if (uniq.length) {
    d.text(sx0, rowY + secMax * 0.8 + th, th * 1.2, `${t.sections} (1:1)`, { layer: 'TESTI' });
    let x = sx0 + secMax / 2;
    uniq.forEach(sc => { dxfSection(d, sc, x, rowY, 'SEZIONI'); d.line(x - secMax * 0.7, rowY, x + secMax * 0.7, rowY, 'ASSI'); d.line(x, rowY - secMax * 0.7, x, rowY + secMax * 0.7, 'ASSI'); d.text(x, rowY - secMax * 0.75 - th, th, sc.name, { align: 'center', valign: 'top' }); x += secMax * 1.8 + 50; });
  }
  return d;
}

function dxfBuildGears() {
  if (typeof calculateGears === 'function') calculateGears();
  const st = typeof lastGearState !== 'undefined' ? lastGearState : null;
  if (!st) return null;
  let z1, z2, mn, mt, x1, a, alpha = 0, L = 0;
  if (st.mode === 'wmax') { const p = st.params; z1 = p.z1; z2 = p.z2; mn = p.m_input; alpha = p.toothType === 'helical' ? p.alphaDeg : 0; mt = alpha ? mn / Math.cos(alpha * Math.PI / 180) : mn; x1 = p.xr1 || 0; a = st.r.a_center; L = p.L_mm; }
  else { const r = st.r; z1 = st.z1; z2 = st.z2; mn = r.mn; mt = r.mt; x1 = st.xr1 || 0; a = r.a_center; alpha = st.gearType === 'helical' ? r.alphaDeg : 0; L = r.L_face; }
  const t = dxfTB(), dp1 = mt * z1, dp2 = mt * z2;
  const g = [{ cx: 0, dp: dp1, tip: dp1 + 2 * mn * (1 + x1), root: dp1 - 2 * mn * (1.25 - x1), z: z1, nm: t.pinion }, { cx: a, dp: dp2, tip: dp2 + 2 * mn, root: dp2 - 2.5 * mn, z: z2, nm: t.wheel }];
  const d = new DxfWriter();
  d.layer('CONTORNO', 7, 'CONTINUOUS').layer('PRIMITIVI', 1, 'CENTER').layer('PIEDE', 8, 'HIDDEN').layer('ASSI', 1, 'CENTER').layer('QUOTE', 3, 'CONTINUOUS').layer('TESTI', 2, 'CONTINUOUS');
  const R2 = g[1].tip / 2, R1 = g[0].tip / 2;
  const box = { x0: -R1 - 10, x1: a + R2 + 10, y0: -Math.max(R1, R2) - 30, y1: Math.max(R1, R2) + 15 };
  const title = `${t.titles.gears} z${z1}/z${z2} ${alpha ? 'mn' : 'm'} ${dxfFmt(mn)}`;
  const sh = dxfSheet(d, box, dxfProject(title), t, title), th = sh.th(3);
  g.forEach(w => {
    d.circle(w.cx, 0, w.tip / 2, 'CONTORNO'); d.circle(w.cx, 0, w.dp / 2, 'PRIMITIVI'); d.circle(w.cx, 0, w.root / 2, 'PIEDE');
    const e = w.tip / 2 + 6; d.line(w.cx - e, 0, w.cx + e, 0, 'ASSI'); d.line(w.cx, -e, w.cx, e, 'ASSI');
    d.text(w.cx, w.tip / 2 + th * 1.2, th, `${w.nm} z = ${w.z}`, { align: 'center' });
    d.text(w.cx, -w.tip / 2 - th * 1.6, th * 0.85, `Ø${dxfFmt(w.tip)} ${t.tip} · Ø${dxfFmt(w.dp)} ${t.pitch} · Ø${dxfFmt(w.root)} ${t.root}`, { align: 'center', valign: 'top' });
  });
  d.dim(0, 0, a, 0, -Math.max(R1, R2) - th * 4, `${dxfFmt(a)}`, th);
  d.text(sh.X(25), sh.Y(sh.H - 17), sh.th(3), `${alpha ? `mn = ${dxfFmt(mn)} · mt = ${dxfFmt(mt)} · α = ${dxfFmt(alpha)}°` : `m = ${dxfFmt(mn)}`} · θ = 20° · x1 = ${dxfFmt(x1)} · L = ${dxfFmt(L)} mm`, { layer: 'TESTI' });
  return d;
}

function dxfBuildBelts() {
  if (typeof calculateBelts === 'function') calculateBelts();
  const sel = document.getElementById('beltProfile'); if (!sel) return null;
  const profKey = sel.value, profName = sel.options[sel.selectedIndex].text.split(' (')[0];
  const z1 = parseInt(document.getElementById('pulleyZ1').value) || 20;
  let z2 = parseInt(document.getElementById('pulleyZ2').value) || 40;
  if (currentRatioMethod !== 'teeth') z2 = beltZ2FromTau(z1, parseFloat(document.getElementById('targetTau').value) || 2).z2;
  const c0In = parseFloat(document.getElementById('desiredCenter').value) || 150, C0 = currentUnit === 'metric' ? c0In : c0In * 25.4;
  const r = computeBelts({ profKey, z1, z2, C0_mm: C0, P_kW: parseFloat(document.getElementById('motorPower').value) || 1, n1_rpm: parseFloat(document.getElementById('driverSpeed').value) || 1000, c0: parseFloat(document.getElementById('serviceFactor').value) || 1.5 });
  if (!r.valid) return null;
  const t = dxfTB(), C = r.exactC_mm, r1 = r.dp1 / 2, r2 = r.dp2 / 2;
  const d = new DxfWriter();
  d.layer('PRIMITIVI', 1, 'CENTER').layer('CINGHIA', 7, 'CONTINUOUS').layer('ASSI', 1, 'CENTER').layer('QUOTE', 3, 'CONTINUOUS').layer('TESTI', 2, 'CONTINUOUS');
  const box = { x0: -r1 - 10, x1: C + r2 + 10, y0: -Math.max(r1, r2) - 30, y1: Math.max(r1, r2) + 18 };
  const title = `${t.titles.belts} ${profName} ${z1}/${z2}`;
  const sh = dxfSheet(d, box, dxfProject(title), t, title), th = sh.th(3);
  const beta = Math.asin((r2 - r1) / C), sb = Math.sin(beta), cb = Math.cos(beta), deg = beta * 180 / Math.PI;
  [[0, r1, z1], [C, r2, z2]].forEach(([cx, rr, z], k) => {
    d.circle(cx, 0, rr, 'PRIMITIVI');
    const e = rr + 6; d.line(cx - e, 0, cx + e, 0, 'ASSI'); d.line(cx, -e, cx, e, 'ASSI');
    d.text(cx, rr + th * 1.4, th, `${t.pulley} z = ${z} · Ø${dxfFmt(rr * 2)}`, { align: 'center' });
  });
  // belt on the pitch line: two tangents and the wrap arcs
  d.line(-r1 * sb, r1 * cb, C - r2 * sb, r2 * cb, 'CINGHIA');
  d.line(-r1 * sb, -r1 * cb, C - r2 * sb, -r2 * cb, 'CINGHIA');
  d.arc(0, 0, r1, 90 + deg, 270 - deg, 'CINGHIA');
  d.arc(C, 0, r2, -90 - deg, 90 + deg, 'CINGHIA');
  d.dim(0, 0, C, 0, -Math.max(r1, r2) - th * 4, dxfFmt(C), th);
  d.text(sh.X(25), sh.Y(sh.H - 17), sh.th(3), `${t.belt} ${profName} · Lp = ${dxfFmt(r.Lp)} mm · ${r.zb} ${t.teeth}`, { layer: 'TESTI' });
  return d;
}

function exportDxf(mod = activeModule) {
  const b = { shafts: dxfBuildShaft, frames: dxfBuildFrames, gears: dxfBuildGears, belts: dxfBuildBelts }[mod];
  if (!b) return null;
  let d = null;
  try { d = b(); } catch (e) { console.error(e); }
  if (!d) { alertDxf(dxfT().none); return null; }
  const text = d.toString();
  const name = (typeof prjFileName === 'function' ? prjFileName('') : 'torsio') + '_' + ({ shafts: 'albero', frames: 'struttura', gears: 'ruote', belts: 'cinghia' }[mod]) + '.dxf';
  if (typeof prjDownload === 'function') prjDownload(name, text, 'application/dxf');
  window.lastDxf = { name, text };   // for tests
  return text;
}
function alertDxf(msg) {
  const el = document.getElementById('moduleSubtitle');
  if (!el) return;
  const old = el.textContent; el.textContent = msg; el.classList.add('text-amber-300');
  setTimeout(() => { el.textContent = old; el.classList.remove('text-amber-300'); }, 3500);
}

function initDxf() {
  if (typeof window.calculateShafts === 'function' && !window.calculateShafts._dxf) {
    const orig = window.calculateShafts;
    window.calculateShafts = function () { const r = orig.apply(this, arguments); try { shaftProfileRefresh(); } catch (e) { console.error(e); } return r; };
    window.calculateShafts._dxf = true;
  }
  shaftProfileRefresh();
}
