// ============================================================================
// STRUCTURES (2D FEM): frames and trusses
// Generalizes Luigi's 2D truss solver (notebook "Ottimizzazione peso", torre radio) to plane frames:
// 3 dof per node (u, v, θ), Euler-Bernoulli beam elements, moment releases (hinges) at member ends,
// so a member hinged at both ends is exactly the truss bar of the notebook (EA/L only).
// Units: mm, N, MPa (N/mm²), N·mm; density in kg/m³, masses in kg.
// Pure functions, no DOM.
// ============================================================================

// ---- small dense linear algebra --------------------------------------------------------------
function frMatZeros(n, m = n) { return Array.from({ length: n }, () => new Float64Array(m)); }

// Gaussian elimination with partial pivoting. Returns null if the matrix is singular (mechanism).
function frSolve(A, b) {
  const n = b.length;
  const M = A.map(r => Float64Array.from(r)), x = Float64Array.from(b);
  let scale = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) scale = Math.max(scale, Math.abs(M[i][j]));
  const eps = scale * 1e-12;
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
    if (Math.abs(M[p][k]) <= eps) return null;
    if (p !== k) { [M[p], M[k]] = [M[k], M[p]]; [x[p], x[k]] = [x[k], x[p]]; }
    for (let i = k + 1; i < n; i++) {
      const f = M[i][k] / M[k][k];
      if (f === 0) continue;
      for (let j = k; j < n; j++) M[i][j] -= f * M[k][j];
      x[i] -= f * x[k];
    }
  }
  for (let k = n - 1; k >= 0; k--) {
    let s = x[k];
    for (let j = k + 1; j < n; j++) s -= M[k][j] * x[j];
    x[k] = s / M[k][k];
  }
  return x;
}

// ---- element ---------------------------------------------------------------------------------
// Local stiffness of a plane frame element (Euler-Bernoulli), dofs [u1 v1 θ1 u2 v2 θ2]
function frLocalK(E, A, I, L) {
  const a = E * A / L, b = 12 * E * I / L ** 3, c = 6 * E * I / L ** 2, d = 4 * E * I / L, e = 2 * E * I / L;
  return [
    [a, 0, 0, -a, 0, 0],
    [0, b, c, 0, -b, c],
    [0, c, d, 0, -c, e],
    [-a, 0, 0, a, 0, 0],
    [0, -b, -c, 0, b, -c],
    [0, c, e, 0, -c, d]
  ];
}

// Fixed-end forces (acting on the element) for uniform loads qx (axial) and qy (transverse), local axes
function frLocalFEF(qx, qy, L) {
  return [-qx * L / 2, -qy * L / 2, -qy * L * L / 12, -qx * L / 2, -qy * L / 2, qy * L * L / 12];
}

// Member geometry and local load components
function frMemberGeom(model, i) {
  const m = model.members[i], p1 = model.nodes[m.n1], p2 = model.nodes[m.n2];
  const dx = p2.x - p1.x, dy = p2.y - p1.y, L = Math.hypot(dx, dy);
  return { L, c: dx / L, s: dy / L };
}

function frMemberLoads(model, i, g) {
  let qx = 0, qy = 0;
  for (const dl of model.dloads || []) {
    if (dl.member !== i) continue;
    if (dl.dir === 'perp') qy += dl.q;                           // perpendicular to the member (local y)
    else { qx += dl.q * g.s; qy += dl.q * g.c; }                 // global Y, per unit length of member
  }
  return { qx, qy };
}

// Condense the released rotations (hinges): returns the 6x6 stiffness and fixed-end forces
// with zero rows/columns on the released dofs, and the data to recover the released rotations.
function frCondense(k, f0, rel) {
  const r = [], kept = [];
  for (let j = 0; j < 6; j++) (rel.includes(j) ? r : kept).push(j);
  if (!r.length) return { k, f0, r };
  // k_rr^-1 for 1x1 or 2x2
  const krr = r.map(i => r.map(j => k[i][j]));
  let inv;
  if (r.length === 1) inv = [[1 / krr[0][0]]];
  else { const det = krr[0][0] * krr[1][1] - krr[0][1] * krr[1][0]; inv = [[krr[1][1] / det, -krr[0][1] / det], [-krr[1][0] / det, krr[0][0] / det]]; }
  const kc = k.map(row => row.slice()), fc = f0.slice();
  for (const i of kept) {
    for (const j of kept) {
      let s = 0;
      for (let a = 0; a < r.length; a++) for (let b = 0; b < r.length; b++) s += k[i][r[a]] * inv[a][b] * k[r[b]][j];
      kc[i][j] = k[i][j] - s;
    }
    let s = 0;
    for (let a = 0; a < r.length; a++) for (let b = 0; b < r.length; b++) s += k[i][r[a]] * inv[a][b] * f0[r[b]];
    fc[i] = f0[i] - s;
  }
  for (const i of r) { for (let j = 0; j < 6; j++) { kc[i][j] = 0; kc[j][i] = 0; } fc[i] = 0; }
  return { k: kc, f0: fc, r, inv };
}

function frT(c, s) {   // global -> local transformation (6x6)
  const T = frMatZeros(6);
  for (const o of [0, 3]) { T[o][o] = c; T[o][o + 1] = s; T[o + 1][o] = -s; T[o + 1][o + 1] = c; T[o + 2][o + 2] = 1; }
  return T;
}

const FR_SUPPORTS = {
  pin: [1, 1, 0],        // cerniera
  fixed: [1, 1, 1],      // incastro
  rollerX: [0, 1, 0],    // carrello che scorre lungo x (blocca v)
  rollerY: [1, 0, 0],    // carrello che scorre lungo y (blocca u)
  guide: [0, 1, 1]       // bipendolo / pattino: blocca v e θ
};

// ---- analysis --------------------------------------------------------------------------------
// model: { nodes:[{x,y}], members:[{n1,n2,relStart,relEnd}], supports:[{node,type}], loads:[{node,Fx,Fy,M}], dloads:[{member,q,dir}] }
// props: per member { E, A, I }
function frameAnalyze(model, props) {
  const nN = model.nodes.length, nM = model.members.length, nd = 3 * nN;
  if (!nN || !nM) return { ok: false, reason: 'empty' };
  const K = frMatZeros(nd), F = new Float64Array(nd);
  const el = [];
  for (let i = 0; i < nM; i++) {
    const m = model.members[i], g = frMemberGeom(model, i);
    if (!(g.L > 1e-9)) return { ok: false, reason: 'zeroLength', member: i };
    const { E, A, I } = props[i];
    const ld = frMemberLoads(model, i, g);
    const k = frLocalK(E, A, I, g.L), f0 = frLocalFEF(ld.qx, ld.qy, g.L);
    const rel = [];
    if (m.relStart) rel.push(2);
    if (m.relEnd) rel.push(5);
    const cd = frCondense(k, f0, rel);
    const T = frT(g.c, g.s);
    // global: Kg = Tᵀ k T, fg = Tᵀ f0
    const kg = frMatZeros(6), fg = new Float64Array(6);
    for (let a = 0; a < 6; a++) for (let b = 0; b < 6; b++) {
      let s = 0;
      for (let p = 0; p < 6; p++) { if (!T[p][a]) continue; for (let q = 0; q < 6; q++) if (T[q][b]) s += T[p][a] * cd.k[p][q] * T[q][b]; }
      kg[a][b] = s;
    }
    for (let a = 0; a < 6; a++) { let s = 0; for (let p = 0; p < 6; p++) s += T[p][a] * cd.f0[p]; fg[a] = s; }
    const dofs = [3 * m.n1, 3 * m.n1 + 1, 3 * m.n1 + 2, 3 * m.n2, 3 * m.n2 + 1, 3 * m.n2 + 2];
    for (let a = 0; a < 6; a++) { F[dofs[a]] -= fg[a]; for (let b = 0; b < 6; b++) K[dofs[a]][dofs[b]] += kg[a][b]; }
    el.push({ g, ld, k, f0, cd, T, dofs, E, A, I });
  }
  for (const l of model.loads || []) {
    if (l.node < 0 || l.node >= nN) continue;
    F[3 * l.node] += l.Fx || 0; F[3 * l.node + 1] += l.Fy || 0; F[3 * l.node + 2] += l.M || 0;
  }
  const fixed = new Uint8Array(nd);
  for (const s of model.supports || []) {
    const pat = FR_SUPPORTS[s.type];
    if (!pat || s.node < 0 || s.node >= nN) continue;
    pat.forEach((v, j) => { if (v) fixed[3 * s.node + j] = 1; });
  }
  // rotations with no rotational stiffness (only hinged members at that node): not part of the problem
  const autoFixed = [];
  for (let n = 0; n < nN; n++) {
    const d = 3 * n + 2;
    if (!fixed[d] && Math.abs(K[d][d]) < 1e-12) {
      if (Math.abs(F[d]) > 1e-9) return { ok: false, reason: 'momentOnHinge', node: n };
      fixed[d] = 1; autoFixed.push(d);
    }
  }
  const free = [];
  for (let d = 0; d < nd; d++) if (!fixed[d]) free.push(d);
  const Kff = free.map(i => free.map(j => K[i][j])), Ff = free.map(i => F[i]);
  const uf = free.length ? frSolve(Kff, Ff) : new Float64Array(0);
  if (!uf) return { ok: false, reason: 'mechanism' };
  const u = new Float64Array(nd);
  free.forEach((d, i) => { u[d] = uf[i]; });

  // member end forces (local, acting on the member) and released rotations
  const members = el.map((e, i) => {
    const ug = e.dofs.map(d => u[d]);
    const ul = new Float64Array(6);
    for (let a = 0; a < 6; a++) { let s = 0; for (let b = 0; b < 6; b++) s += e.T[a][b] * ug[b]; ul[a] = s; }
    if (e.cd.r.length) {   // u_r = -k_rr⁻¹ (k_rc u_c + f0_r), with the full (uncondensed) k and f0
      const r = e.cd.r, rhs = r.map(ri => { let s = e.f0[ri]; for (let j = 0; j < 6; j++) if (!r.includes(j)) s += e.k[ri][j] * ul[j]; return s; });
      r.forEach((ri, a) => { let s = 0; for (let b = 0; b < r.length; b++) s += e.cd.inv[a][b] * rhs[b]; ul[ri] = -s; });
    }
    const f = new Float64Array(6);
    for (let a = 0; a < 6; a++) { let s = e.f0[a]; for (let b = 0; b < 6; b++) s += e.k[a][b] * ul[b]; f[a] = s; }
    return { L: e.g.L, c: e.g.c, s: e.g.s, qx: e.ld.qx, qy: e.ld.qy, ul, f, E: e.E, A: e.A, I: e.I, member: model.members[i] };
  });

  // reactions: sum of member end forces at the support dofs minus the applied nodal loads
  const Rg = new Float64Array(nd);
  el.forEach((e, i) => {
    const f = members[i].f;
    for (let a = 0; a < 6; a++) { let s = 0; for (let p = 0; p < 6; p++) s += e.T[p][a] * f[p]; Rg[e.dofs[a]] += s; }
  });
  for (const l of model.loads || []) {
    if (l.node < 0 || l.node >= nN) continue;
    Rg[3 * l.node] -= l.Fx || 0; Rg[3 * l.node + 1] -= l.Fy || 0; Rg[3 * l.node + 2] -= l.M || 0;
  }
  const reactions = [];
  for (const s of model.supports || []) {
    const pat = FR_SUPPORTS[s.type];
    if (!pat || s.node < 0 || s.node >= nN) continue;
    const b = 3 * s.node;
    reactions.push({ node: s.node, type: s.type, Rx: pat[0] ? Rg[b] : 0, Ry: pat[1] ? Rg[b + 1] : 0, M: pat[2] ? Rg[b + 2] : 0 });
  }
  return { ok: true, u, members, reactions, nd, autoFixed };
}

// Internal actions at x along a member (sign convention: N > 0 tension, M > 0 sagging, i.e. tension on the local -y side)
function frameMemberActions(mr, x) {
  const f = mr.f;
  return { N: -(f[0] + mr.qx * x), V: f[1] + mr.qy * x, M: -f[2] + f[1] * x + mr.qy * x * x / 2 };
}

// Sample the member: actions and local transverse deflection (Hermite + uniform-load particular solution)
function frameMemberSample(mr, n = 40) {
  const L = mr.L, ul = mr.ul, pts = [];
  const xs = [];
  for (let i = 0; i <= n; i++) xs.push(L * i / n);
  if (mr.qy) { const x0 = -mr.f[1] / mr.qy; if (x0 > 0 && x0 < L) xs.push(x0); }   // shear zero: extreme moment
  xs.sort((a, b) => a - b);
  for (const x of xs) {
    const t = x / L, h1 = 1 - 3 * t * t + 2 * t ** 3, h2 = L * (t - 2 * t * t + t ** 3), h3 = 3 * t * t - 2 * t ** 3, h4 = L * (-t * t + t ** 3);
    const w = h1 * ul[1] + h2 * ul[2] + h3 * ul[4] + h4 * ul[5] + mr.qy * x * x * (L - x) ** 2 / (24 * mr.E * mr.I);
    const ua = ul[0] + (ul[3] - ul[0]) * t;
    pts.push({ x, w, ua, ...frameMemberActions(mr, x) });
  }
  return pts;
}

// Summary per member: extreme actions, maximum displacement (global), length
function frameMemberSummary(mr, model) {
  const pts = frameMemberSample(mr);
  let Nmax = -Infinity, Nmin = Infinity, Mabs = 0, Vabs = 0, dmax = 0;
  for (const p of pts) {
    Nmax = Math.max(Nmax, p.N); Nmin = Math.min(Nmin, p.N); Mabs = Math.max(Mabs, Math.abs(p.M)); Vabs = Math.max(Vabs, Math.abs(p.V));
    dmax = Math.max(dmax, Math.hypot(p.ua, p.w));
  }
  return { pts, Nmax, Nmin, Mabs, Vabs, dmax };
}

// ---- sections ------------------------------------------------------------------------------------
const FR_FILLET_C = (10 - 3 * Math.PI) / (12 - 3 * Math.PI);   // centroid of a fillet spandrel from its corner, / r
const FR_FILLET_A = 1 - Math.PI / 4;                            // spandrel area / r²

function frSecRound(d) {
  const A = Math.PI * d * d / 4, I = Math.PI * d ** 4 / 64;
  return { family: 'round', name: `Ø${d}`, A, Iy: I, Iz: I, Wy: I / (d / 2), dims: { d } };
}
function frSecTube(D, t) {
  const di = D - 2 * t, A = Math.PI * (D * D - di * di) / 4, I = Math.PI * (D ** 4 - di ** 4) / 64;
  return { family: 'tube', name: `Ø${D}×${t}`, A, Iy: I, Iz: I, Wy: I / (D / 2), dims: { D, t } };
}
function frSecRect(b, h) {
  const A = b * h, Iy = b * h ** 3 / 12, Iz = h * b ** 3 / 12;
  return { family: 'rect', name: `${b}×${h}`, A, Iy, Iz, Wy: Iy / (h / 2), dims: { b, h } };
}
// Square hollow section with corner radii ro = 2t, ri = t (EN 10219, t ≤ 6 mm; approximation above)
function frSecBox(B, t) {
  const ro = 2 * t, ri = t, bi = B - 2 * t;
  const ao = FR_FILLET_A * ro * ro, ai = FR_FILLET_A * ri * ri;
  const A = B * B - bi * bi - 4 * ao + 4 * ai;
  const yo = B / 2 - FR_FILLET_C * ro, yi = bi / 2 - FR_FILLET_C * ri;
  const I = (B ** 4 - bi ** 4) / 12 - 4 * ao * yo * yo + 4 * ai * yi * yi;
  return { family: 'box', name: `□${B}×${t}`, A, Iy: I, Iz: I, Wy: I / (B / 2), dims: { B, t } };
}
// Rolled I and H sections from the nominal geometry (h, b, tw, tf, r), fillets included
function frSecI(family, name, h, b, tw, tf, r) {
  const hw = h - 2 * tf, af = FR_FILLET_A * r * r, cf = FR_FILLET_C * r;
  const A = 2 * b * tf + hw * tw + 4 * af;
  const yf = h / 2 - tf / 2, yfil = h / 2 - tf - cf;
  const Iown = r ** 4 * (1 / 3 - Math.PI / 16 - FR_FILLET_A * (1 - FR_FILLET_C) ** 2);   // spandrel about its own centroid (approx.)
  const Iy = 2 * (b * tf ** 3 / 12 + b * tf * yf * yf) + tw * hw ** 3 / 12 + 4 * (af * yfil * yfil + Math.max(Iown, 0));
  const zfil = tw / 2 + cf;
  const Iz = 2 * tf * b ** 3 / 12 + hw * tw ** 3 / 12 + 4 * (af * zfil * zfil + Math.max(Iown, 0));
  return { family, name, A, Iy, Iz, Wy: Iy / (h / 2), dims: { h, b, tw, tf, r } };
}

// Catalog geometry (mm): h, b, tw, tf, r
const FR_IPE = [[80, 46, 3.8, 5.2, 5], [100, 55, 4.1, 5.7, 7], [120, 64, 4.4, 6.3, 7], [140, 73, 4.7, 6.9, 7], [160, 82, 5, 7.4, 9], [180, 91, 5.3, 8, 9],
  [200, 100, 5.6, 8.5, 12], [220, 110, 5.9, 9.2, 12], [240, 120, 6.2, 9.8, 15], [270, 135, 6.6, 10.2, 15], [300, 150, 7.1, 10.7, 15], [330, 160, 7.5, 11.5, 18],
  [360, 170, 8, 12.7, 18], [400, 180, 8.6, 13.5, 21], [450, 190, 9.4, 14.6, 21], [500, 200, 10.2, 16, 21], [550, 210, 11.1, 17.2, 24], [600, 220, 12, 19, 24]];
const FR_HEA = [[100, 96, 100, 5, 8, 12], [120, 114, 120, 5, 8, 12], [140, 133, 140, 5.5, 8.5, 12], [160, 152, 160, 6, 9, 15], [180, 171, 180, 6, 9.5, 15],
  [200, 190, 200, 6.5, 10, 18], [220, 210, 220, 7, 11, 18], [240, 230, 240, 7.5, 12, 21], [260, 250, 260, 7.5, 12.5, 24], [280, 270, 280, 8, 13, 24],
  [300, 290, 300, 8.5, 14, 27], [320, 310, 300, 9, 15.5, 27], [340, 330, 300, 9.5, 16.5, 27], [360, 350, 300, 10, 17.5, 27], [400, 390, 300, 11, 19, 27],
  [450, 440, 300, 11.5, 21, 27], [500, 490, 300, 12, 23, 27]];
const FR_ROUND_D = [6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 30, 32, 35, 38, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120, 130, 140, 150, 160, 180, 200, 220, 250, 280, 300];
const FR_CHS_D = [21.3, 26.9, 33.7, 42.4, 48.3, 60.3, 76.1, 88.9, 101.6, 114.3, 139.7, 168.3, 193.7, 219.1, 244.5, 273, 323.9, 355.6, 406.4];
const FR_CHS_T = [2, 2.3, 2.6, 2.9, 3.2, 3.6, 4, 4.5, 5, 5.6, 6.3, 7.1, 8, 8.8, 10, 11, 12.5, 14.2, 16];
const FR_SHS_B = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 150, 160, 180, 200, 220, 250, 260, 300];
const FR_SHS_T = [2, 2.5, 3, 4, 5, 6, 6.3, 8, 10, 12.5];
const FR_RECT_H = [10, 12, 16, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 250, 300];

const FR_FAMILIES = ['round', 'tube', 'rect', 'box', 'IPE', 'HEA'];
const frCatalogCache = {};
// Catalog of a family, sorted by area (lightest first)
function frameCatalog(family) {
  if (frCatalogCache[family]) return frCatalogCache[family];
  let list = [];
  if (family === 'round') list = FR_ROUND_D.map(frSecRound);
  else if (family === 'tube') { for (const D of FR_CHS_D) for (const t of FR_CHS_T) { const r = D / t; if (r >= 10 && r <= 50) list.push(frSecTube(D, t)); } }
  else if (family === 'rect') list = FR_RECT_H.map(h => frSecRect(h / 2, h));
  else if (family === 'box') { for (const B of FR_SHS_B) for (const t of FR_SHS_T) { const r = B / t; if (r >= 10 && r <= 40) list.push(frSecBox(B, t)); } }
  else if (family === 'IPE') list = FR_IPE.map(g => frSecI('IPE', 'IPE ' + g[0], ...g));
  else if (family === 'HEA') list = FR_HEA.map(g => frSecI('HEA', 'HEA ' + g[0], ...g.slice(1)));
  list.sort((a, b) => a.A - b.A || a.Iy - b.Iy);
  // drop sections dominated by a lighter one (same or more area, less stiffness and modulus): keeps the search monotone
  const out = [];
  for (const s of list) if (!out.some(o => o.A <= s.A && o.Wy >= s.Wy && Math.min(o.Iy, o.Iz) >= Math.min(s.Iy, s.Iz))) out.push(s);
  frCatalogCache[family] = out;
  return out;
}

// ---- member check ---------------------------------------------------------------------------------
// σ = |N|/A + |M|/W at every sampled point; Euler buckling (pinned length L·β) with the smallest I.
function frameMemberCheck(sum, sec, L, mat) {
  let sigma = 0;
  for (const p of sum.pts) sigma = Math.max(sigma, Math.abs(p.N) / sec.A + Math.abs(p.M) / sec.Wy);
  const Ncomp = Math.max(0, -sum.Nmin);
  const Ncr = Math.PI ** 2 * mat.E * Math.min(sec.Iy, sec.Iz) / (mat.beta * L) ** 2;
  const Xs = sigma > 0 ? mat.sigmaS / sigma : Infinity;
  const Xb = Ncomp > 1e-9 ? Ncr / Ncomp : Infinity;
  return { sigma, Ncomp, Ncr, Xs, Xb, ok: Xs >= mat.X - 1e-9 && Xb >= mat.Xb - 1e-9, util: Math.max(mat.X / Xs, mat.Xb / Xb) };
}

function frProps(model, secs, E) {
  return model.members.map((m, i) => ({ E, A: secs[i].A, I: secs[i].Iy }));
}

function frMass(model, secs, rho) {
  let m = 0;
  model.members.forEach((mm, i) => { m += rho * secs[i].A * frMemberGeom(model, i).L * 1e-9; });
  return m;
}

// Full analysis + check with given sections
function frameEvaluate(model, secs, mat) {
  const an = frameAnalyze(model, frProps(model, secs, mat.E));
  if (!an.ok) return { ok: false, reason: an.reason, an };
  const rows = an.members.map((mr, i) => {
    const sum = frameMemberSummary(mr, model);
    return { i, sec: secs[i], L: mr.L, sum, chk: frameMemberCheck(sum, secs[i], mr.L, mat) };
  });
  let dmax = 0;
  for (let n = 0; n < model.nodes.length; n++) dmax = Math.max(dmax, Math.hypot(an.u[3 * n], an.u[3 * n + 1]));
  for (const r of rows) dmax = Math.max(dmax, r.sum.dmax);
  return { ok: true, an, rows, dmax, mass: frMass(model, secs, mat.rho), allOk: rows.every(r => r.chk.ok) && (!(mat.deflMax > 0) || dmax <= mat.deflMax + 1e-9) };
}

// ---- sizing: discrete fully stressed design (Luigi's FSD on catalog sections, with buckling) -------
// mat: { E, rho, sigmaS, X, Xb, beta, deflMax }; mode: 'member' (one section per member) | 'uniform' (same section everywhere)
function frameSize(model, family, mat, mode = 'member') {
  const cat = frameCatalog(family);
  const nM = model.members.length;
  if (!nM) return { ok: false, reason: 'empty' };
  let idx = new Array(nM).fill(Math.floor(cat.length / 3));
  let ev = null, it = 0, history = [];
  const secsOf = ix => ix.map(k => cat[k]);
  const smallestFor = (sum, L) => {   // first catalog entry that satisfies strength and buckling for these actions
    for (let k = 0; k < cat.length; k++) if (frameMemberCheck(sum, cat[k], L, mat).ok) return k;
    return -1;
  };
  for (it = 0; it < 60; it++) {
    ev = frameEvaluate(model, secsOf(idx), mat);
    if (!ev.ok) return { ok: false, reason: ev.reason, family };
    history.push(ev.mass);
    let next = ev.rows.map(r => smallestFor(r.sum, r.L));
    if (next.some(k => k < 0)) {   // even the largest section fails
      const worst = next.findIndex(k => k < 0);
      return { ok: false, reason: 'catalogTooSmall', member: worst, family, ev };
    }
    if (mode === 'uniform') { const k = Math.max(...next); next = next.map(() => k); }
    if (it >= 20) next = next.map((k, i) => Math.max(k, idx[i]));   // avoid oscillations in hyperstatic structures
    if (next.every((k, i) => k === idx[i])) break;
    idx = next;
  }
  // stiffness: raise sections until the deflection limit is met
  let stiff = 0;
  while (mat.deflMax > 0 && ev.dmax > mat.deflMax && stiff < 80) {
    const before = idx.slice();
    // raise the members that bend the most, or all of them in uniform mode
    if (mode === 'uniform') idx = idx.map(k => Math.min(k + 1, cat.length - 1));
    else idx = idx.map(k => Math.min(k + 1, cat.length - 1));
    if (idx.every((k, i) => k === before[i])) break;
    ev = frameEvaluate(model, secsOf(idx), mat);
    if (!ev.ok) return { ok: false, reason: ev.reason, family };
    stiff++;
  }
  const secs = secsOf(idx);
  return { ok: ev.allOk, reason: ev.allOk ? null : (mat.deflMax > 0 && ev.dmax > mat.deflMax ? 'deflection' : 'strength'),
    family, secs, idx, ev, mass: ev.mass, iterations: it + 1, stiffSteps: stiff, history };
}

// ---- continuous FSD on areas, as in the notebook (truss bars, axial stress only) ---------------------
// A ← A · clip(|σ|/σamm, 0.5, 1.5)^η, bounded in [Amin, Amax]; I = A²/(4π) (solid round, used only for buckling info)
function frameFSDContinuous(model, { E, rho, sigmaAllow, Amin, Amax, Ainit, eta = 0.5, maxIter = 60, tol = 1e-4 }) {
  const nM = model.members.length;
  const L = model.members.map((m, i) => frMemberGeom(model, i).L);
  let A = Array.isArray(Ainit) ? Ainit.slice() : new Array(nM).fill(Ainit || (Amin + Amax) / 2);
  const hist = [];
  let iter = 0, converged = false;
  for (iter = 0; iter < maxIter; iter++) {
    const an = frameAnalyze(model, A.map(a => ({ E, A: a, I: a * a / (4 * Math.PI) })));
    if (!an.ok) return { ok: false, reason: an.reason };
    const sig = an.members.map((mr, i) => frameMemberActions(mr, 0).N / A[i]);
    const W = rho * A.reduce((s, a, i) => s + a * L[i], 0) * 1e-9;
    hist.push({ W, smax: Math.max(...sig.map(Math.abs)) });
    const An = A.map((a, i) => Math.min(Amax, Math.max(Amin, a * Math.pow(Math.min(1.5, Math.max(0.5, Math.abs(sig[i]) / sigmaAllow)), eta))));
    const ch = Math.max(...An.map((a, i) => Math.abs(a - A[i]) / Math.max(A[i], 1e-12)));
    A = An;
    if (ch < tol) { converged = true; iter++; break; }
  }
  const an = frameAnalyze(model, A.map(a => ({ E, A: a, I: a * a / (4 * Math.PI) })));
  const sig = an.members.map((mr, i) => frameMemberActions(mr, 0).N / A[i]);
  const W = rho * A.reduce((s, a, i) => s + a * L[i], 0) * 1e-9;
  // buckling of the compressed bars as solid rounds: σcr = π E A / (4 L²)
  const sigCr = A.map((a, i) => Math.PI * E * a / (4 * L[i] ** 2));
  return { ok: true, A, sigma: sig, W, history: hist, iterations: iter, converged, sigCr };
}
