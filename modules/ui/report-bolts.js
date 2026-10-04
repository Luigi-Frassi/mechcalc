// ============================================================================
// Calculation report of the bolted joints module (method of the Machine Elements notes)
// ============================================================================

const REPORT_BT_TXT = {
  it: {
    disclaimer: 'Dimensionamento di massima con il metodo degli appunti di Elementi Costruttivi delle Macchine (giunzione ad attrito, precarico da N/A_res = σs/X, coppia di serraggio con attrito su filetto e sottotesta, rigidezze con il cono a 30°). Per il progetto esecutivo verificare con VDI 2230 o EN 1993-1-8 e con i dati del produttore delle viti (coefficienti d\'attrito reali, dispersione del serraggio).',
    title: 'Collegamento bullonato — dimensionamento di massima', titleScrew: 'Vite di manovra — coppia e verifica',
    s1: 'Dati di progetto', s2: 'Carico da trasmettere e precarico', s3: 'Numero di viti', s4: 'Coppia di serraggio', s5: 'Verifica della vite', s6: 'Carico esterno assiale', s7: 'Confronto delle misure', s8: 'Ipotesi e note',
    s2t: 'Precarico dalla coppia di serraggio', s3t: 'Carico trasmissibile',
    load: 'Carico', bolt: 'Vite', cls: 'Classe', fJoint: 'Attrito tra le piastre', fThread: 'Attrito filetto e sottotesta', mInt: 'Superfici di attrito', X: 'Coefficiente di sicurezza', geo: 'Geometria della vite',
    ext: 'Carico esterno', h: 'Spessore serrato', E: 'Modulo elastico', sep: 'Il giunto si apre: le flange si staccano.', opt: 'Precarico ottimale',
    screwData: 'Dati della vite', profile: 'Profilo', selfLock: 'autobloccante', notSelfLock: 'non autobloccante',
    hyp: [
      'Giunzione ad attrito: il carico tangenziale è affidato all\'attrito tra le piastre, $T = \\frac{F}{m_{viti}\\, m_{int}}$, precarico $N = \\frac{T}{f}\\,X$; le viti non lavorano a taglio.',
      'Geometria come negli appunti: $d_m = 0{,}9\\,d$, $d_{noc} = 0{,}8\\,d$, $A_{res} = \\pi d_{noc}^2/4$, $D_m = (D_c + d)/2$ con $D_c$ chiave della testa; filettatura metrica ISO $\\beta = 30°$.',
      'Numero di viti dalla condizione $N/A_{res} = \\sigma_s/X$; sulla corona al massimo $\\pi D/D_c$ viti.',
      'Carico esterno: rigidezze $K_v = E\\,(\\pi d^2/4)/h$ e $K_f = E\\,A_{eq}/h$ con il cono di pressione a 30°; la vite prende $\\Delta F_v = P_e\\,K_v/(K_v + K_f)$, le flange $\\Delta F_f = P_e\\,K_f/(K_v+K_f)$.',
      'Il von Mises con la torsione del serraggio è riportato per informazione: negli appunti la verifica è $N/A_{res} \\le \\sigma_s/X$.'
    ]
  },
  en: {
    disclaimer: 'Preliminary sizing with the method of the Machine Elements notes (friction joint, preload from N/A_res = σy/X, tightening torque with thread and under-head friction, stiffnesses with the 30° cone). For the final design check with VDI 2230 or EN 1993-1-8 and the bolt manufacturer\'s data (actual friction coefficients, tightening scatter).',
    title: 'Bolted joint — preliminary sizing', titleScrew: 'Power screw — torque and check',
    s1: 'Design data', s2: 'Load to transmit and preload', s3: 'Number of bolts', s4: 'Tightening torque', s5: 'Bolt check', s6: 'External axial load', s7: 'Comparison of sizes', s8: 'Assumptions and notes',
    s2t: 'Preload from the tightening torque', s3t: 'Transmissible load',
    load: 'Load', bolt: 'Bolt', cls: 'Class', fJoint: 'Friction between plates', fThread: 'Thread and under-head friction', mInt: 'Friction surfaces', X: 'Safety factor', geo: 'Bolt geometry',
    ext: 'External load', h: 'Clamped thickness', E: 'Young\'s modulus', sep: 'The joint opens: the flanges separate.', opt: 'Optimal preload',
    screwData: 'Screw data', profile: 'Profile', selfLock: 'self-locking', notSelfLock: 'not self-locking',
    hyp: [
      'Friction joint: the tangential load is carried by friction between the plates, $T = \\frac{F}{m_{bolts}\\, m_{int}}$, preload $N = \\frac{T}{f}\\,X$; the bolts do not work in shear.',
      'Geometry as in the notes: $d_m = 0.9\\,d$, $d_{core} = 0.8\\,d$, $A_{res} = \\pi d_{core}^2/4$, $D_m = (D_c + d)/2$ with $D_c$ the head across-flats; ISO metric thread $\\beta = 30°$.',
      'Number of bolts from $N/A_{res} = \\sigma_y/X$; at most $\\pi D/D_c$ bolts on the circle.',
      'External load: stiffnesses $K_v = E\\,(\\pi d^2/4)/h$ and $K_f = E\\,A_{eq}/h$ with the 30° pressure cone; the bolt takes $\\Delta F_v = P_e\\,K_v/(K_v + K_f)$, the flanges $\\Delta F_f = P_e\\,K_f/(K_v+K_f)$.',
      'Von Mises with the tightening torsion is given for information: in the notes the check is $N/A_{res} \\le \\sigma_y/X$.'
    ]
  }
};

function buildBoltReportHtml() {
  calculateBolts();
  const st = lastBoltState; if (!st) return null;
  const R = REPORT_TXT[currentLang] || REPORT_TXT.en, B = REPORT_BT_TXT[currentLang] || REPORT_BT_TXT.en, t = btT(), N_ = reportNum, T = texNum;
  let body = '', sec = 0;
  const H = title => `<h3><span class="n">${++sec}.</span>${title}</h3>`;
  if (st.mode === 'screw') {
    const i = st.inp, r = st.r;
    body += H(B.screwData) + reportKV([[t.d, `${N_(i.d, 1)} mm`], [t.p, `${N_(i.p, 2)} mm`], [t.hT, `${N_(i.hT, 2)} mm`], [B.profile, t.betas[i.beta] || i.beta], [t.fScrew, N_(i.f, 3)], [t.N, `${N_(i.N / 1000, 2)} kN`], [t.sy, `${N_(i.sigmaS, 0)} MPa`]]);
    body += H(B.s4) + reportEq([
      `d_m = d - \\frac{h}{2} = ${T(r.dm, 2)}\\ \\text{mm},\\qquad d_{noc} = d - h = ${T(r.dCore, 2)}\\ \\text{mm}`,
      `\\tan\\alpha = \\frac{p}{\\pi\\, d_m} = \\frac{${T(i.p, 2)}}{\\pi \\cdot ${T(r.dm, 2)}} \\;\\Rightarrow\\; \\alpha = ${T(r.alpha * 180 / Math.PI, 2)}^\\circ,\\qquad \\tan\\varphi = \\frac{f}{\\cos\\beta} \\;\\Rightarrow\\; \\varphi = ${T(r.phi * 180 / Math.PI, 2)}^\\circ`,
      `M_s = N\\,\\frac{d_m}{2}\\,\\frac{\\cos\\beta\\sin\\alpha + f\\cos\\alpha}{\\cos\\beta\\cos\\alpha - f\\sin\\alpha} = ${T(i.N, 0)} \\cdot \\frac{${T(r.dm, 2)}}{2} \\cdot ${T(r.k1, 4)} = ${T(r.Ms / 1000, 2)}\\ \\text{N}\\cdot\\text{m}`,
      `\\eta = \\frac{\\tan\\alpha}{${T(r.k1, 4)}} = ${T(r.eta * 100, 1)}\\,\\%`]) +
      `<div class="res"><div>M<sub>s</sub> = <span class="big">${N_(r.Ms / 1000, 1)} N·m</span> · ${r.selfLocking ? B.selfLock : B.notSelfLock} (α ${r.selfLocking ? '<' : '≥'} φ)</div></div>`;
    body += H(B.s5) + reportEq([`\\sigma = \\frac{N}{\\pi d_{noc}^2/4} = ${T(r.sigma, 1)}\\ \\text{MPa},\\qquad \\tau = \\frac{16\\, M_s}{\\pi\\, d_{noc}^3} = ${T(r.tau, 1)}\\ \\text{MPa},\\qquad \\sigma_{id} = \\sqrt{\\sigma^2 + 3\\tau^2} = ${T(r.sigmaId, 1)}\\ \\text{MPa}` + (r.X ? `\\;\\Rightarrow\\; X = ${T(r.X, 2)}` : '')]);
    return reportShell(B.titleScrew, `Ø${N_(i.d, 0)} × ${N_(i.p, 1)} · Ms = ${N_(r.Ms / 1000, 1)} N·m`, body, R, B.disclaimer);
  }
  const i = st.inp, r = st.r, g = r.g, sz = st.size, ex = st.ex, design = st.mode === 'design';
  body += H(B.s1) + reportKV([
    [B.load, i.load === 'torque' ? `Mt = ${N_(i.Mt / 1e6, 2)} kN·m · Ø ${N_(i.Dcircle, 0)} mm` : `F = ${N_(i.F / 1000, 2)} kN`],
    [B.bolt, `${sz.name} × ${sz.p} · ${B.cls} ${st.cls} (σR = ${st.sR} MPa, σs = ${st.sS} MPa)`],
    [B.geo, `d = ${sz.d} · dm = ${N_(g.dm, 1)} · d_noc = ${N_(g.dCore, 1)} · Dc = ${sz.Dc} mm · A_res = ${N_(g.Ares, 1)} mm²`],
    [B.fJoint, N_(i.f, 3)], [B.fThread, N_(i.fThread, 3)], [B.mInt, i.mInt], [B.X, N_(i.X, 2)]
  ]);
  if (design) {
    body += H(B.s2) + reportEq([
      i.load === 'torque' ? `F = \\frac{M_t}{D/2} = \\frac{${T(i.Mt, 0)}}{${T(i.Dcircle / 2, 1)}} = ${T(r.Ft, 0)}\\ \\text{N}` : `F = ${T(r.Ft, 0)}\\ \\text{N}`,
      `T = \\frac{F}{m_{viti}\\, m_{int}},\\qquad N = \\frac{T}{f}\\,X \\;\\Rightarrow\\; N_{tot} = \\frac{F\\, X}{f\\, m_{int}} = \\frac{${T(r.Ft, 0)} \\cdot ${T(i.X, 2)}}{${T(i.f, 3)} \\cdot ${i.mInt}} = ${T(r.Ntot, 0)}\\ \\text{N}`]);
    body += H(B.s3) + reportEq([
      `\\frac{N}{A_{res}} = \\frac{\\sigma_s}{X} \\;\\Rightarrow\\; m_{viti} = \\frac{N_{tot}}{A_{res}\\,\\sigma_s/X} = \\frac{${T(r.Ntot, 0)}}{${T(g.Ares, 1)} \\cdot ${T(st.sS, 0)}/${T(i.X, 2)}} = ${T(r.mReq, 3)} \\;\\to\\; ${st.m}`,
      i.load === 'torque' ? `m_{max} = \\frac{\\pi\\, D}{D_c} = \\frac{\\pi \\cdot ${T(i.Dcircle, 0)}}{${T(sz.Dc, 0)}} = ${T(Math.PI * i.Dcircle / sz.Dc, 1)} \\;\\to\\; ${r.nMax}` : '',
      `N = \\frac{N_{tot}}{m_{viti}} = ${T(r.N, 0)}\\ \\text{N}`]);
  } else {
    body += H(B.s2t) + reportEq([
      `M_s = N\\left(\\frac{d_m}{2}\\,k_1 + \\frac{D_m}{2}\\,f\\right) \\;\\Rightarrow\\; N = \\frac{${T(i.Ms, 0)}}{${T(g.dm / 2, 2)} \\cdot ${T(r.k1, 4)} + ${T(g.Dm / 2, 2)} \\cdot ${T(i.fThread, 3)}} = ${T(r.N, 0)}\\ \\text{N}`]);
    body += H(B.s3t) + reportEq([
      `T = \\frac{N\\, f}{X} = ${T(r.Tbolt, 0)}\\ \\text{N},\\qquad F_{max} = \\frac{m_{viti}\\, N\\, f\\, m_{int}}{X} = ${T(r.Fmax, 0)}\\ \\text{N}` + (r.Mtmax ? `,\\qquad M_{t,max} = F_{max}\\,\\frac{D}{2} = ${T(r.Mtmax / 1e6, 2)}\\ \\text{kN}\\cdot\\text{m}` : '')]);
  }
  body += H(B.s4) + reportEq([
    `\\tan\\alpha = \\frac{p}{\\pi\\, d_m} = \\frac{${T(sz.p, 2)}}{\\pi \\cdot ${T(g.dm, 1)}} \\;\\Rightarrow\\; \\alpha = ${T(g.alpha * 180 / Math.PI, 2)}^\\circ,\\qquad D_m = \\frac{D_c + d}{2} = ${T(g.Dm, 1)}\\ \\text{mm}`,
    `M_s = N\\,\\frac{d_m}{2}\\,\\frac{\\cos\\beta\\sin\\alpha + f\\cos\\alpha}{\\cos\\beta\\cos\\alpha - f\\sin\\alpha} + \\frac{N}{2}\\,D_m\\, f = ${T(r.N, 0)} \\cdot ${T(g.dm / 2, 1)} \\cdot ${T(r.k1, 4)} + \\frac{${T(r.N, 0)}}{2} \\cdot ${T(g.Dm, 1)} \\cdot ${T(i.fThread, 3)}`,
    `M_s = ${T(r.M1 / 1000, 1)} + ${T(r.M2 / 1000, 1)} = ${T(r.Ms / 1000, 1)}\\ \\text{N}\\cdot\\text{m}`]) +
    `<div class="res"><div><span class="big">${st.m} × ${sz.name} ${st.cls}</span> · N = ${N_(r.N / 1000, 2)} kN · M<sub>s</sub> = <span class="big">${N_(r.Ms / 1000, 0)} N·m</span></div></div>`;
  body += H(B.s5) + reportEq([
    `\\sigma = \\frac{N}{A_{res}} = \\frac{${T(r.N, 0)}}{${T(g.Ares, 1)}} = ${T(r.sigma, 1)}\\ \\text{MPa} \\;\\Rightarrow\\; X = \\frac{\\sigma_s}{\\sigma} = ${T(r.Xbolt, 2)}`,
    `\\tau = \\frac{16\\, M_1}{\\pi\\, d_{noc}^3} = ${T(r.tau, 1)}\\ \\text{MPa},\\qquad \\sigma_{id} = \\sqrt{\\sigma^2 + 3\\tau^2} = ${T(r.sigmaId, 1)}\\ \\text{MPa}\\quad (X = ${T(r.Xvm, 2)})`]);
  body += H(B.s6) + reportKV([[B.ext, `Pe = ${N_(i.Pe / 1000, 2)} kN (${N_(st.PeBolt / 1000, 2)} kN ${t.perBolt})`], [B.h, `${N_(i.h, 1)} mm`], [B.E, `${N_(i.E / 1000, 0)} GPa`]]) + reportEq([
    `K_v = \\frac{E\\,\\pi d^2/4}{h} = ${T(ex.Kv, 0)}\\ \\text{N/mm},\\qquad D_{max} = D_c + h\\tan 30^\\circ = ${T(ex.Dmax, 1)}\\ \\text{mm}`,
    `A_{eq} = \\frac{\\pi}{4}\\left[\\left(\\frac{D_{max} + D_c}{2}\\right)^2 - d^2\\right] = ${T(ex.Aeq, 0)}\\ \\text{mm}^2,\\qquad K_f = \\frac{E\\, A_{eq}}{h} = ${T(ex.Kf, 0)}\\ \\text{N/mm}`,
    i.Pe ? `\\Delta F_v = P_e\\,\\frac{K_v}{K_v + K_f} = ${T(ex.dFv, 0)}\\ \\text{N},\\qquad \\Delta F_f = P_e\\,\\frac{K_f}{K_v + K_f} = ${T(ex.dFf, 0)}\\ \\text{N}` : '',
    i.Pe ? `F_{vite} = N + \\Delta F_v = ${T(ex.bolt, 0)}\\ \\text{N}\\;(X = ${T(ex.Xbolt, 2)}),\\qquad F_{flange} = N - \\Delta F_f = ${T(ex.clamp, 0)}\\ \\text{N}` : '',
    `P_{am} = \\frac{\\sigma_s\\, A_{res}}{X} = ${T(ex.Pam, 0)}\\ \\text{N},\\qquad N_{ott} = P_{am}\\,\\frac{K_f}{K_v + K_f} = ${T(ex.Popt, 0)}\\ \\text{N}`]);
  const svg = document.getElementById('btDiagram');
  if (svg) body += `<div class="fig">${reportSvgForPrint(svg.outerHTML)}<div class="cap">${t.diagram}</div></div>`;
  if (i.Pe) body += ex.separated ? `<div class="res ko">${B.sep}</div>` : `<div class="res"><div>${ex.Mtmax ? `${t.newMt}: <span class="big">${N_(ex.Mtmax / 1e6, 2)} kN·m</span>` : `${t.newF}: <span class="big">${N_(ex.Fmax / 1000, 2)} kN</span>`}</div></div>`;
  if (design && st.opts) {
    body += H(B.s7) + reportTable([t.colSize, t.colM, t.colN, t.colMs, ...(i.load === 'torque' ? [t.colFit] : [])], st.opts.map(o => ({ cls: o.size.name === sz.name ? 'hl' : '',
      cells: [o.size.name, `${N_(o.r.mReq, 2)} → ${o.r.m}`, N_(o.r.N / 1000, 1), N_(o.r.Ms / 1000, 0), ...(i.load === 'torque' ? [`${o.r.m} / ${o.r.nMax}`] : [])] })));
  }
  body += H(B.s8) + '<ul>' + B.hyp.map(h => `<li>${reportTexify(h)}</li>`).join('') + '</ul>';
  return reportShell(B.title, `${st.m} × ${sz.name} ${st.cls} · Ms = ${N_(r.Ms / 1000, 0)} N·m`, body, R, B.disclaimer);
}
