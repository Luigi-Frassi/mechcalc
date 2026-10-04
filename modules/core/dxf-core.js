// ============================================================================
// DXF WRITER (AutoCAD R12 / AC1009, ASCII) — opens in every CAD (AutoCAD, SolidWorks, Inventor,
// Fusion, FreeCAD, LibreCAD, DraftSight, QCAD). Model space in millimetres, 1:1.
// Layers with colors and linetypes (CONTINUOUS, CENTER, HIDDEN), lines, arcs, circles, polylines with
// bulges (arcs inside a closed outline), filled arrowheads, text, linear dimensions drawn as geometry,
// and an ISO 7200 style title block scaled around the drawing.
// Pure functions, no DOM.
// ============================================================================

class DxfWriter {
  constructor() {
    this.ents = [];
    this.layers = new Map();
    this.ext = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    this.layer('0', 7, 'CONTINUOUS');
  }
  layer(name, color = 7, ltype = 'CONTINUOUS') { if (!this.layers.has(name)) this.layers.set(name, { color, ltype }); return this; }
  _grow(x, y) { if (Number.isFinite(x) && Number.isFinite(y)) { this.ext.x0 = Math.min(this.ext.x0, x); this.ext.y0 = Math.min(this.ext.y0, y); this.ext.x1 = Math.max(this.ext.x1, x); this.ext.y1 = Math.max(this.ext.y1, y); } }
  static n(v) { const r = Math.round(v * 1e6) / 1e6; return Object.is(r, -0) ? '0' : String(r); }
  static txt(s) {
    // R12 text: Ø ° ± as control codes, any other non-ASCII character as \U+XXXX
    return String(s).replace(/Ø|⌀/g, '%%c').replace(/°/g, '%%d').replace(/±/g, '%%p').replace(/ ?· ?/g, ' - ').replace(/[\r\n]+/g, ' ')
      .replace(/[^\x20-\x7e]/g, c => '\\U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'));
  }
  _push(type, layer, pairs) { this.layer(layer); this.ents.push([type, layer, pairs]); return this; }
  line(x1, y1, x2, y2, layer = '0') { this._grow(x1, y1); this._grow(x2, y2); return this._push('LINE', layer, [[10, x1], [20, y1], [30, 0], [11, x2], [21, y2], [31, 0]]); }
  circle(x, y, r, layer = '0') { this._grow(x - r, y - r); this._grow(x + r, y + r); return this._push('CIRCLE', layer, [[10, x], [20, y], [30, 0], [40, r]]); }
  // arc counter-clockwise from a0 to a1 (degrees)
  arc(x, y, r, a0, a1, layer = '0') {
    for (let a = a0; a <= (a1 < a0 ? a1 + 360 : a1); a += 15) this._grow(x + r * Math.cos(a * Math.PI / 180), y + r * Math.sin(a * Math.PI / 180));
    return this._push('ARC', layer, [[10, x], [20, y], [30, 0], [40, r], [50, a0], [51, a1]]);
  }
  // pts: [{x, y, b}] with b = bulge of the segment that starts at that vertex (tan(θ/4), positive = CCW)
  poly(pts, closed = false, layer = '0') {
    if (pts.length < 2) return this;
    pts.forEach(p => this._grow(p.x, p.y));
    this.layer(layer);
    this.ents.push(['POLYLINE', layer, [[66, 1], [10, 0], [20, 0], [30, 0], [70, closed ? 1 : 0]], pts]);
    return this;
  }
  rect(x0, y0, x1, y1, layer = '0') { return this.poly([{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }], true, layer); }
  solid(pts, layer = '0') {
    const p = pts.length === 3 ? [pts[0], pts[1], pts[2], pts[2]] : pts;
    p.forEach(q => this._grow(q.x, q.y));
    return this._push('SOLID', layer, [[10, p[0].x], [20, p[0].y], [30, 0], [11, p[1].x], [21, p[1].y], [31, 0], [12, p[3].x], [22, p[3].y], [32, 0], [13, p[2].x], [23, p[2].y], [33, 0]]);
  }
  // align: 'left' | 'center' | 'right'; valign: 'base' | 'middle' | 'top'
  text(x, y, h, s, { layer = 'TESTI', align = 'left', valign = 'base', rot = 0 } = {}) {
    const ha = { left: 0, center: 1, right: 2 }[align] || 0, va = { base: 0, bottom: 1, middle: 2, top: 3 }[valign] || 0;
    const w = String(s).length * h * 0.6;
    this._grow(x - (ha === 1 ? w / 2 : ha === 2 ? w : 0), y - h); this._grow(x + (ha === 0 ? w : ha === 1 ? w / 2 : 0), y + h);
    const pairs = [[10, x], [20, y], [30, 0], [40, h], [1, DxfWriter.txt(s)]];
    if (rot) pairs.push([50, rot]);
    if (ha || va) { pairs.push([72, ha], [11, x], [21, y], [31, 0]); if (va) pairs.push([73, va]); }
    return this._push('TEXT', layer, pairs);
  }
  arrow(xTip, yTip, dirX, dirY, len, layer = 'QUOTE') {
    const L = Math.hypot(dirX, dirY) || 1, ux = dirX / L, uy = dirY / L, w = len / 3;
    return this.solid([{ x: xTip, y: yTip }, { x: xTip - ux * len - uy * w / 2, y: yTip - uy * len + ux * w / 2 }, { x: xTip - ux * len + uy * w / 2, y: yTip - uy * len - ux * w / 2 }], layer);
  }
  // Linear dimension between (x1,y1) and (x2,y2), offset along the normal; h = text height (drawing scale applied by the caller)
  dim(x1, y1, x2, y2, off, txt, h, layer = 'QUOTE') {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const a1 = { x: x1 + nx * off, y: y1 + ny * off }, a2 = { x: x2 + nx * off, y: y2 + ny * off }, ext = Math.sign(off) * h * 0.6;
    this.line(x1 + nx * Math.sign(off) * h * 0.3, y1 + ny * Math.sign(off) * h * 0.3, a1.x + nx * ext, a1.y + ny * ext, layer);
    this.line(x2 + nx * Math.sign(off) * h * 0.3, y2 + ny * Math.sign(off) * h * 0.3, a2.x + nx * ext, a2.y + ny * ext, layer);
    this.line(a1.x, a1.y, a2.x, a2.y, layer);
    const al = Math.min(h * 1.1, L / 3);
    this.arrow(a1.x, a1.y, -ux, -uy, al, layer); this.arrow(a2.x, a2.y, ux, uy, al, layer);
    let rot = Math.atan2(dy, dx) * 180 / Math.PI;
    if (rot > 90.001 || rot <= -90) rot += 180;
    const tx = (a1.x + a2.x) / 2 + nx * h * 0.35 * Math.sign(off || 1), ty = (a1.y + a2.y) / 2 + ny * h * 0.35 * Math.sign(off || 1);
    return this.text(tx, ty, h, txt, { layer, align: 'center', valign: off >= 0 ? 'bottom' : 'top', rot });
  }
  toString() {
    const o = [];
    const g = (c, v) => { o.push(String(c)); o.push(typeof v === 'number' ? DxfWriter.n(v) : String(v)); };
    const e = this.ext, ok = Number.isFinite(e.x0);
    g(0, 'SECTION'); g(2, 'HEADER');
    g(9, '$ACADVER'); g(1, 'AC1009');
    g(9, '$DWGCODEPAGE'); g(3, 'ANSI_1252');
    g(9, '$INSBASE'); g(10, 0); g(20, 0); g(30, 0);
    g(9, '$EXTMIN'); g(10, ok ? e.x0 : 0); g(20, ok ? e.y0 : 0); g(30, 0);
    g(9, '$EXTMAX'); g(10, ok ? e.x1 : 100); g(20, ok ? e.y1 : 100); g(30, 0);
    g(9, '$LIMMIN'); g(10, ok ? e.x0 : 0); g(20, ok ? e.y0 : 0);
    g(9, '$LIMMAX'); g(10, ok ? e.x1 : 100); g(20, ok ? e.y1 : 100);
    g(9, '$LTSCALE'); g(40, this.ltscale || 1);
    g(9, '$MEASUREMENT'); g(70, 1);
    g(0, 'ENDSEC');
    g(0, 'SECTION'); g(2, 'TABLES');
    const lts = [['CONTINUOUS', 'Solid line', []], ['CENTER', 'Center ____ _ ____ _', [12.7, -2.54, 2.54, -2.54]], ['HIDDEN', 'Hidden __ __ __', [6.35, -3.175]]];
    g(0, 'TABLE'); g(2, 'LTYPE'); g(70, lts.length);
    for (const [nm, ds, pat] of lts) {
      g(0, 'LTYPE'); g(2, nm); g(70, 0); g(3, ds); g(72, 65); g(73, pat.length); g(40, pat.reduce((s, v) => s + Math.abs(v), 0));
      pat.forEach(v => g(49, v));
    }
    g(0, 'ENDTAB');
    g(0, 'TABLE'); g(2, 'LAYER'); g(70, this.layers.size);
    for (const [nm, l] of this.layers) { g(0, 'LAYER'); g(2, nm); g(70, 0); g(62, l.color); g(6, l.ltype); }
    g(0, 'ENDTAB');
    g(0, 'TABLE'); g(2, 'STYLE'); g(70, 1); g(0, 'STYLE'); g(2, 'STANDARD'); g(70, 0); g(40, 0); g(41, 1); g(50, 0); g(71, 0); g(42, 2.5); g(3, 'txt'); g(4, ''); g(0, 'ENDTAB');
    g(0, 'ENDSEC');
    g(0, 'SECTION'); g(2, 'ENTITIES');
    for (const [type, layer, pairs, pts] of this.ents) {
      g(0, type); g(8, layer);
      for (const [c, v] of pairs) g(c, v);
      if (type === 'POLYLINE') {
        for (const p of pts) { g(0, 'VERTEX'); g(8, layer); g(10, p.x); g(20, p.y); g(30, 0); if (p.b) g(42, p.b); }
        g(0, 'SEQEND'); g(8, layer);
      }
    }
    g(0, 'ENDSEC'); g(0, 'EOF');
    return o.join('\r\n') + '\r\n';
  }
}

// ---- drawing sheet: frame + ISO 7200 style title block, scaled around the model-space drawing ------
const DXF_FORMATS = [['A4', 297, 210], ['A3', 420, 297], ['A2', 594, 420], ['A1', 841, 594], ['A0', 1189, 841]];
const DXF_SCALES = [1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];   // 1:n (reductions)
const DXF_ENLARGE = [10, 5, 2];                                             // n:1 for small parts

// Choose format and scale so that the box (model mm) fits the sheet above the title block
function dxfFitSheet(w, h) {
  const tbH = 40;
  // prefer the largest scale on A4 or A3 (a drawing at 1:1 on A3 reads better than 1:2 on A4), then bigger sheets
  const room = (W, H) => [W - 20 - 10 - 20, H - 20 - tbH - 25];   // margins, title block, room for dimensions
  for (const k of DXF_ENLARGE) for (const [fmt, W, H] of DXF_FORMATS.slice(0, 2)) { const [aw, ah] = room(W, H); if (w * k <= aw && h * k <= ah) return { fmt, W, H, s: 1 / k, label: `${k}:1` }; }
  for (const n of DXF_SCALES) for (const [fmt, W, H] of DXF_FORMATS.slice(0, 2)) { const [aw, ah] = room(W, H); if (w / n <= aw && h / n <= ah) return { fmt, W, H, s: n, label: `1:${n}` }; }
  for (const [fmt, W, H] of DXF_FORMATS.slice(2)) { const [aw, ah] = room(W, H); for (const n of DXF_SCALES) if (w / n <= aw && h / n <= ah) return { fmt, W, H, s: n, label: `1:${n}` }; }
  const [fmt, W, H] = DXF_FORMATS[DXF_FORMATS.length - 1];
  const n = DXF_SCALES.find(q => w / q <= W - 50 && h / q <= H - 90) || 1000;
  return { fmt, W, H, s: n, label: `1:${n}` };
}

// Frame + title block. box = drawing extents (model mm); P = project data (projectTitleData); T = labels
// Returns the scale data; text heights in model units = paper mm × s.
function dxfSheet(d, box, P, T, sheetTitle) {
  const w = Math.max(box.x1 - box.x0, 1), h = Math.max(box.y1 - box.y0, 1);
  const sh = dxfFitSheet(w, h), s = sh.s;
  const cx = (box.x0 + box.x1) / 2, cy = (box.y0 + box.y1) / 2;
  // paper origin so that the drawing is centred in the area above the title block
  const ox = cx - (sh.W / 2) * s, oy = cy - ((sh.H + 40 - 5) / 2) * s;
  const X = x => ox + x * s, Y = y => oy + y * s;
  d.layer('CORNICE', 7, 'CONTINUOUS'); d.layer('CARTIGLIO', 7, 'CONTINUOUS');
  d.rect(X(0), Y(0), X(sh.W), Y(sh.H), 'CORNICE');
  d.rect(X(20), Y(10), X(sh.W - 10), Y(sh.H - 10), 'CORNICE');
  // centring marks
  [[sh.W / 2, 10, sh.W / 2, 5], [sh.W / 2, sh.H - 10, sh.W / 2, sh.H - 5], [20, sh.H / 2, 15, sh.H / 2], [sh.W - 10, sh.H / 2, sh.W - 5, sh.H / 2]].forEach(([a, b, c, e]) => d.line(X(a), Y(b), X(c), Y(e), 'CORNICE'));
  // title block 180 × 36 at the bottom right of the inner frame
  const R = sh.W - 10, B = 10, L = R - 180;
  const cell = (x0, y0, x1, y1, label, value, hv = 3) => {
    d.rect(X(x0), Y(y0), X(x1), Y(y1), 'CARTIGLIO');
    d.text(X(x0 + 1.2), Y(y1 - 2.6), 1.8 * s, label, { layer: 'CARTIGLIO' });
    if (value) d.text(X(x0 + 1.2), Y(y0 + 2.2), hv * s, String(value).slice(0, Math.floor((x1 - x0 - 2) / (hv * 0.62))), { layer: 'CARTIGLIO' });
  };
  d.rect(X(L), Y(B), X(R), Y(B + 36), 'CARTIGLIO');
  cell(L, B + 12, L + 50, B + 36, '', '');
  d.text(X(L + 25), Y(B + 27), 4 * s, (P.company || 'Torsio Engineering').slice(0, 22), { layer: 'CARTIGLIO', align: 'center' });
  d.text(X(L + 25), Y(B + 18), 2.2 * s, P.company ? 'Torsio Engineering' : 'torsio-engineering.vercel.app', { layer: 'CARTIGLIO', align: 'center' });
  cell(L, B, L + 50, B + 12, T.date, P.date);
  cell(L + 50, B + 24, R, B + 36, T.title, sheetTitle, 4);
  cell(L + 50, B + 12, L + 100, B + 24, T.project, P.project);
  cell(L + 100, B + 12, L + 140, B + 24, T.code, P.code);
  cell(L + 140, B + 12, R, B + 24, T.client, P.client);
  cell(L + 50, B, L + 76, B + 12, T.drawn, P.drawnBy, 2.5);
  cell(L + 76, B, L + 102, B + 12, T.checked, P.checkedBy, 2.5);
  cell(L + 102, B, L + 128, B + 12, T.approved, P.approvedBy, 2.5);
  cell(L + 128, B, L + 146, B + 12, T.scale, sh.label);
  cell(L + 146, B, L + 163, B + 12, T.format, sh.fmt);
  cell(L + 163, B, R, B + 12, T.rev, P.rev);
  d.ltscale = s;
  return { ...sh, X, Y, ox, oy, th: k => k * s };
}

// ---- section outlines (for frames) -----------------------------------------------------------------
const DXF_B90 = Math.tan(Math.PI / 8);   // bulge of a 90° arc
function dxfRoundedRect(cx, cy, w, h, r) {
  if (r <= 0) return [{ x: cx - w / 2, y: cy - h / 2 }, { x: cx + w / 2, y: cy - h / 2 }, { x: cx + w / 2, y: cy + h / 2 }, { x: cx - w / 2, y: cy + h / 2 }];
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  return [{ x: x0 + r, y: y0 }, { x: x1 - r, y: y0, b: DXF_B90 }, { x: x1, y: y0 + r }, { x: x1, y: y1 - r, b: DXF_B90 }, { x: x1 - r, y: y1 },
    { x: x0 + r, y: y1, b: DXF_B90 }, { x: x0, y: y1 - r }, { x: x0, y: y0 + r, b: DXF_B90 }];
}
// I / H section outline centred at (cx, cy), web vertical, fillets r between web and flanges (concave → negative bulge)
function dxfIOutline(cx, cy, h, b, tw, tf, r) {
  const x0 = cx - b / 2, x1 = cx + b / 2, y0 = cy - h / 2, y1 = cy + h / 2, wl = cx - tw / 2, wr = cx + tw / 2;
  return [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y0 + tf }, { x: wr + r, y: y0 + tf, b: -DXF_B90 }, { x: wr, y: y0 + tf + r },
    { x: wr, y: y1 - tf - r, b: -DXF_B90 }, { x: wr + r, y: y1 - tf }, { x: x1, y: y1 - tf }, { x: x1, y: y1 }, { x: x0, y: y1 }, { x: x0, y: y1 - tf },
    { x: wl - r, y: y1 - tf, b: -DXF_B90 }, { x: wl, y: y1 - tf - r }, { x: wl, y: y0 + tf + r, b: -DXF_B90 }, { x: wl - r, y: y0 + tf }, { x: x0, y: y0 + tf }];
}
function dxfSection(d, sec, cx, cy, layer = 'SEZIONI') {
  const g = sec.dims;
  if (sec.family === 'round') d.circle(cx, cy, g.d / 2, layer);
  else if (sec.family === 'tube') { d.circle(cx, cy, g.D / 2, layer); d.circle(cx, cy, g.D / 2 - g.t, layer); }
  else if (sec.family === 'rect') d.rect(cx - g.b / 2, cy - g.h / 2, cx + g.b / 2, cy + g.h / 2, layer);
  else if (sec.family === 'box') { d.poly(dxfRoundedRect(cx, cy, g.B, g.B, 2 * g.t), true, layer); d.poly(dxfRoundedRect(cx, cy, g.B - 2 * g.t, g.B - 2 * g.t, g.t), true, layer); }
  else d.poly(dxfIOutline(cx, cy, g.h, g.b, g.tw, g.tf, g.r), true, layer);
}

// ---- shaft profile: proposal from the calculation ------------------------------------------------------
// UNI 6604 / DIN 6885 parallel keys: [d over, d up to, b, t1 (depth in the shaft)]
const DXF_KEYS = [[6, 8, 2, 1.2], [8, 10, 3, 1.8], [10, 12, 4, 2.5], [12, 17, 5, 3], [17, 22, 6, 3.5], [22, 30, 8, 4], [30, 38, 10, 5], [38, 44, 12, 5],
  [44, 50, 14, 5.5], [50, 58, 16, 6], [58, 65, 18, 7], [65, 75, 20, 7.5], [75, 85, 22, 9], [85, 95, 25, 9], [95, 110, 28, 10], [110, 130, 32, 11],
  [130, 150, 36, 12], [150, 170, 40, 13], [170, 200, 45, 15], [200, 230, 50, 17]];
function dxfKeyFor(d) { const k = DXF_KEYS.find(([a, b]) => d > a && d <= b) || (d <= 6 ? DXF_KEYS[0] : DXF_KEYS[DXF_KEYS.length - 1]); return { b: k[2], t1: k[3] }; }

const dxfCeil5 = v => Math.ceil(v / 5 - 1e-9) * 5, dxfFloor5 = v => Math.floor(v / 5 + 1e-9) * 5;

// features: [{x, kind: 'bearing'|'gear'|'coupling'|'force'}]; returns segments [{x0, x1, d, key}]
function shaftProfileProposal({ L, xA, xB, features, d, D, r }) {
  d = Math.max(5, d); D = Math.max(d, D || dxfCeil5(d * 1.2));
  const inside = x => x > Math.min(xA, xB) - 1e-6 && x < Math.max(xA, xB) + 1e-6;
  const dOut = Math.max(5, dxfFloor5(d - 3));
  const collar = dxfCeil5(D * 1.1 + 4);
  const bw = Math.max(10, Math.round(0.2 * d + 10)), hub = dd => Math.max(20, dxfCeil5(1.2 * dd));
  // one seat per position: a bearing wins, then a gear, a coupling, a generic force
  const prio = { bearing: 0, gear: 1, coupling: 2, force: 3 };
  const byX = new Map();
  for (const f of features) { const k = Math.round(f.x * 1000) / 1000, o = byX.get(k); if (!o || (prio[f.kind] ?? 9) < (prio[o.kind] ?? 9)) byX.set(k, f); }
  features = [...byX.values()];
  const feats = features.map(f => {
    const dia = f.kind === 'bearing' ? d : inside(f.x) ? D : dOut;
    const w = f.kind === 'bearing' ? bw : f.kind === 'force' ? Math.max(10, Math.round(0.6 * dia)) : hub(dia);
    return { x: f.x, dia, w, key: f.kind === 'gear' || f.kind === 'coupling' };
  }).sort((a, b) => a.x - b.x);
  // intervals, clipped to the shaft and split at the midpoint when two seats overlap
  const iv = feats.map(f => ({ a: Math.max(0, f.x - f.w / 2), b: Math.min(L, f.x + f.w / 2), d: f.dia, key: f.key }));
  for (let i = 0; i + 1 < iv.length; i++) if (iv[i].b > iv[i + 1].a) { const m = (iv[i].b + iv[i + 1].a) / 2; iv[i].b = m; iv[i + 1].a = m; }
  const segs = [];
  let x = 0;
  const gapDia = (a, b) => inside((a + b) / 2) ? collar : dOut;
  for (const v of iv) {
    if (v.b - v.a < 1e-6) continue;
    if (v.a > x + 1e-6) segs.push({ x0: x, x1: v.a, d: gapDia(x, v.a), key: false });
    segs.push({ x0: v.a, x1: v.b, d: v.d, key: v.key });
    x = v.b;
  }
  if (L > x + 1e-6) segs.push({ x0: x, x1: L, d: gapDia(x, L), key: false });
  // merge equal neighbours (keyways stay on their own seat)
  const out = [];
  for (const sg of segs) {
    const p = out[out.length - 1];
    if (p && Math.abs(p.d - sg.d) < 1e-9 && !p.key && !sg.key) p.x1 = sg.x1;
    else out.push({ ...sg, x0: Math.round(sg.x0 * 10) / 10, x1: Math.round(sg.x1 * 10) / 10 });
  }
  for (let i = 1; i < out.length; i++) out[i].x0 = out[i - 1].x1;
  return { segs: out, r: Math.max(0.2, r || 1) };
}

// Shaft side view + keyway top views, with dimensions; returns the writer
function shaftDxf(profile, labels, P, T, title) {
  const d = new DxfWriter();
  d.layer('CONTORNO', 7, 'CONTINUOUS').layer('ASSE', 1, 'CENTER').layer('NASCOSTE', 8, 'HIDDEN').layer('QUOTE', 3, 'CONTINUOUS').layer('TESTI', 2, 'CONTINUOUS');
  const segs = profile.segs, r = profile.r;
  if (!segs.length) return d;
  const L = segs[segs.length - 1].x1, dmax = Math.max(...segs.map(s => s.d));
  const keyRows = segs.filter(s => s.key);
  const box = { x0: -10, x1: L + 10, y0: -dmax / 2 - 30 - (keyRows.length ? dmax * 0.6 + 20 : 0), y1: dmax / 2 + 30 };
  const sh = dxfSheet(d, box, P, T, title);
  const th = sh.th(3.2), ch = c => Math.min(c, 1);
  // outline: upper and lower contours with fillets at the steps and chamfers at the ends
  const stepR = segs.map((sg, i) => { const nx = segs[i + 1]; return nx ? Math.min(r, (Math.abs(nx.d - sg.d) / 2) * 0.9, (sg.x1 - sg.x0) / 3, (nx.x1 - nx.x0) / 3) : 0; });
  for (const sgn of [1, -1]) {
    segs.forEach((sg, i) => {
      const y = sgn * sg.d / 2, prev = segs[i - 1], next = segs[i + 1];
      let xa = sg.x0, xb = sg.x1;
      if (!prev) xa += ch(sg.d > 20 ? 1 : 0.5);
      if (prev && prev.d > sg.d) xa += stepR[i - 1];
      if (next && next.d > sg.d) xb -= stepR[i];
      if (!next) xb -= ch(sg.d > 20 ? 1 : 0.5);
      d.line(xa, y, xb, y, 'CONTORNO');
      // step to the next segment
      if (next) {
        const rr = stepR[i];
        if (next.d > sg.d) {        // fillet on the smaller (left) segment
          const cxf = sg.x1 - rr, cyf = sgn * (sg.d / 2 + rr);
          sgn > 0 ? d.arc(cxf, cyf, rr, 270, 360, 'CONTORNO') : d.arc(cxf, cyf, rr, 0, 90, 'CONTORNO');
          d.line(sg.x1, sgn * (sg.d / 2 + rr), sg.x1, sgn * next.d / 2, 'CONTORNO');
        } else if (next.d < sg.d) { // fillet on the smaller (right) segment
          const cxf = sg.x1 + rr, cyf = sgn * (next.d / 2 + rr);
          sgn > 0 ? d.arc(cxf, cyf, rr, 180, 270, 'CONTORNO') : d.arc(cxf, cyf, rr, 90, 180, 'CONTORNO');
          d.line(sg.x1, sgn * sg.d / 2, sg.x1, sgn * (next.d / 2 + rr), 'CONTORNO');
        }
      }
    });
  }
  // ends with chamfers, and the visible edges of every step
  const first = segs[0], last = segs[segs.length - 1], c0 = ch(first.d > 20 ? 1 : 0.5), c1 = ch(last.d > 20 ? 1 : 0.5);
  d.line(0, -first.d / 2 + c0, 0, first.d / 2 - c0, 'CONTORNO'); d.line(0, first.d / 2 - c0, c0, first.d / 2, 'CONTORNO'); d.line(0, -first.d / 2 + c0, c0, -first.d / 2, 'CONTORNO');
  d.line(L, -last.d / 2 + c1, L, last.d / 2 - c1, 'CONTORNO'); d.line(L, last.d / 2 - c1, L - c1, last.d / 2, 'CONTORNO'); d.line(L, -last.d / 2 + c1, L - c1, -last.d / 2, 'CONTORNO');
  d.line(c0, first.d / 2, c0, -first.d / 2, 'CONTORNO'); d.line(L - c1, last.d / 2, L - c1, -last.d / 2, 'CONTORNO');
  segs.forEach((sg, i) => { const nx = segs[i + 1]; if (nx) { const m = Math.min(sg.d, nx.d) / 2; d.line(sg.x1, m, sg.x1, -m, 'CONTORNO'); } });
  // axis
  d.line(-6, 0, L + 6, 0, 'ASSE');
  // keyways: depth as hidden line on the side view, slot outline in a top view below
  let ky = -dmax / 2 - 22 - dmax * 0.25;
  keyRows.forEach(sg => {
    const k = dxfKeyFor(sg.d), len = Math.max(k.b * 1.5, Math.round((sg.x1 - sg.x0) * 0.8 / 2) * 2), xm = (sg.x0 + sg.x1) / 2, xa = xm - len / 2, xb = xm + len / 2;
    d.line(xa, sg.d / 2 - k.t1, xb, sg.d / 2 - k.t1, 'NASCOSTE'); d.line(xa, sg.d / 2, xa, sg.d / 2 - k.t1, 'NASCOSTE'); d.line(xb, sg.d / 2, xb, sg.d / 2 - k.t1, 'NASCOSTE');
    const rr = k.b / 2;
    d.poly([{ x: xa + rr, y: ky - rr }, { x: xb - rr, y: ky - rr, b: 1 }, { x: xb - rr, y: ky + rr }, { x: xa + rr, y: ky + rr, b: 1 }], true, 'CONTORNO');
    d.line(xa - 3, ky, xb + 3, ky, 'ASSE');
    d.text(xm, ky - rr - th * 0.8, th * 0.85, `${T.key} ${k.b}x${k.t1}x${len} (UNI 6604)`, { align: 'center', valign: 'top' });
  });
  // dimensions: diameters on each segment, chain of lengths below, overall length
  segs.forEach(sg => {
    const xm = (sg.x0 + sg.x1) / 2, w = sg.x1 - sg.x0;
    if (w > th * 1.6) d.dim(xm, -sg.d / 2, xm, sg.d / 2, 0, `Ø${dxfFmt(sg.d)}`, th * 0.9);
    else d.text(xm, sg.d / 2 + th * 0.6, th * 0.8, `Ø${dxfFmt(sg.d)}`, { align: 'center' });
  });
  const yb = -dmax / 2;
  segs.forEach(sg => d.dim(sg.x0, -sg.d / 2, sg.x1, -sg.d / 2, (yb - th * 2.2) - (-sg.d / 2), dxfFmt(sg.x1 - sg.x0), th * 0.85));
  d.dim(0, -first.d / 2, L, -last.d / 2, (yb - th * 4.6) - (-first.d / 2), dxfFmt(L), th);
  // element labels above
  (labels || []).forEach(lb => {
    d.line(lb.x, dmax / 2 + th * 0.6, lb.x, dmax / 2 + th * 2.2, 'TESTI');
    d.text(lb.x, dmax / 2 + th * 2.6, th * 0.85, lb.text, { align: 'center' });
  });
  d.text(sh.X(25), sh.Y(sh.H - 17), sh.th(3), `${T.fillets} r = ${dxfFmt(r)} · ${T.chamfers} 1x45%%d`.replace('%%d', '°'), { layer: 'TESTI' });
  return d;
}

function dxfFmt(v) { return (Math.round(v * 100) / 100).toString(); }
