// ============================================================================
// Calculation report of the Structures module (2D FEM)
// model → method (stiffness matrix, assembly, hinges, checks) → results of the chosen family
// (reactions, N/V/M diagrams, deformed shape) → comparison of the section families → worked check
// of the most loaded member → notebook comparison for trusses → assumptions.
// ============================================================================

const REPORT_FR_TXT = {
  it: {
    title: 'Struttura piana — analisi FEM e dimensionamento delle sezioni',
    s1: 'Dati di progetto', s2: 'Modello della struttura', s3: 'Metodo di calcolo', s4: 'Risultati dell\'analisi', s5: 'Confronto delle famiglie di sezioni',
    s6: 'Sezioni scelte', s7: 'Verifica delle aste', s8: 'Esempio di verifica: asta più sollecitata', s9: 'Confronto con l\'FSD continuo (notebook)', s10: 'Ipotesi e note',
    mat: 'Materiale', crit: 'Criteri', fams: 'Famiglie confrontate', mode: 'Sezioni', geom: 'Geometria', nodes: 'Nodi', members: 'Aste', supports: 'Vincoli', loads: 'Carichi',
    hinges: 'cerniere', none: 'nessuna', both: 'entrambe le estremità (asta di traliccio)', start: 'inizio', end: 'fine', len: 'L [mm]',
    chosen: 'Famiglia scelta', lightest: 'la più leggera tra quelle verificate', of: 'di',
    figModel: 'Schema statico con vincoli e carichi', figN: 'Sforzo normale N [kN] (trazione positiva)', figV: 'Taglio T [kN]', figM: 'Momento flettente M [kN·m] (disegnato dal lato teso)', figD: 'Deformata (amplificata)',
    reac: 'Reazioni vincolari', dmax: 'Spostamento massimo',
    m1: 'Rigidezza dell\'elemento trave nel riferimento locale (gradi di libertà u, v, θ ai due estremi):',
    m2: 'Rotazione nel riferimento globale e assemblaggio; i carichi distribuiti entrano come forze nodali equivalenti (reazioni di incastro perfetto cambiate di segno):',
    m3: 'Cerniere interne: le rotazioni rilasciate sono condensate staticamente (momento nullo all\'estremo). Un\'asta con due cerniere ha solo la rigidezza assiale EA/L: è l\'asta di traliccio del notebook.',
    m4: 'Vincoli: si eliminano i gradi di libertà bloccati e si risolve il sistema; le reazioni si ricavano dalle forze di estremità delle aste.',
    m5: 'Verifica di ogni asta (punto per punto lungo l\'asta) e instabilità di Eulero delle aste compresse:',
    m6: 'Dimensionamento (Fully Stressed Design a catalogo): per ogni asta si sceglie la sezione più leggera che rispetta le due verifiche con le sollecitazioni correnti; nelle strutture iperstatiche la rigidezza cambia e si ripete l\'analisi fino a convergenza. Se c\'è un limite di freccia, si aumentano le sezioni finché è rispettato.',
    family: 'Famiglia', secs: 'Sezioni', mass: 'Massa [kg]', Xmin: 'X min', Xb: 'X inst. min', defl: 'Freccia max [mm]', res: 'Esito', ok: 'VERIFICATA', ko: 'NON VERIFICATA',
    sec: 'Sezione', N: 'N [kN]', M: '|M| max [kN·m]', sig: 'σ [MPa]', X: 'X', XbC: 'X inst.', U: 'Utilizzo',
    worst: 'Asta', nb1: 'Aree libere, σamm = σs/X; aggiornamento', nb2: 'Peso finale', nb3: 'aste compresse instabili come tondo pieno (σ > σcr)',
    hyp: [
      'Travi di Eulero-Bernoulli (deformabilità a taglio trascurata), piccoli spostamenti, materiale elastico lineare.',
      'Flessione nel piano della struttura attorno all\'asse forte della sezione; instabilità con il momento d\'inerzia minimo (anche fuori piano) e lunghezza libera $\\beta L$ tra i nodi.',
      'Verifica di resistenza con $\\sigma = |N|/A + |M|/W$ (somma dei valori assoluti, a favore di sicurezza); taglio e torsione non verificati.',
      'Peso proprio delle aste trascurato. Sezioni da catalogo: tubi EN 10219 (D/t tra 10 e 50), scatolati quadri con raggi esterni 2t, IPE e HEA con i raccordi.',
      'Risultati di massima: per strutture reali verificare con le norme (es. Eurocodice 3: classi delle sezioni, instabilità flesso-torsionale, collegamenti).'
    ]
  },
  en: {
    title: 'Plane structure — FEM analysis and section sizing',
    s1: 'Design data', s2: 'Structural model', s3: 'Method', s4: 'Analysis results', s5: 'Comparison of the section families',
    s6: 'Chosen sections', s7: 'Member checks', s8: 'Worked check: most loaded member', s9: 'Comparison with the continuous FSD (notebook)', s10: 'Assumptions and notes',
    mat: 'Material', crit: 'Criteria', fams: 'Families compared', mode: 'Sections', geom: 'Geometry', nodes: 'Nodes', members: 'Members', supports: 'Supports', loads: 'Loads',
    hinges: 'hinges', none: 'none', both: 'both ends (truss bar)', start: 'start', end: 'end', len: 'L [mm]',
    chosen: 'Chosen family', lightest: 'the lightest among the verified ones', of: 'of',
    figModel: 'Structural scheme with supports and loads', figN: 'Axial force N [kN] (tension positive)', figV: 'Shear V [kN]', figM: 'Bending moment M [kN·m] (drawn on the tension side)', figD: 'Deformed shape (magnified)',
    reac: 'Support reactions', dmax: 'Maximum displacement',
    m1: 'Stiffness of the beam element in local axes (dofs u, v, θ at both ends):',
    m2: 'Rotation to global axes and assembly; distributed loads enter as equivalent nodal forces (fixed-end reactions with opposite sign):',
    m3: 'Internal hinges: the released rotations are condensed statically (zero end moment). A member with two hinges keeps only the axial stiffness EA/L: the truss bar of the notebook.',
    m4: 'Supports: the blocked dofs are removed and the system is solved; reactions come from the member end forces.',
    m5: 'Check of every member (point by point along the member) and Euler buckling of the compressed members:',
    m6: 'Sizing (fully stressed design on catalogs): for every member the lightest section that passes both checks with the current actions is chosen; in hyperstatic structures the stiffness changes, so the analysis is repeated until convergence. With a deflection limit, sections are increased until it is met.',
    family: 'Family', secs: 'Sections', mass: 'Mass [kg]', Xmin: 'Min X', Xb: 'Min buckling X', defl: 'Max deflection [mm]', res: 'Result', ok: 'VERIFIED', ko: 'NOT VERIFIED',
    sec: 'Section', N: 'N [kN]', M: '|M| max [kN·m]', sig: 'σ [MPa]', X: 'X', XbC: 'Buckl. X', U: 'Utilization',
    worst: 'Member', nb1: 'Free areas, σallow = σy/X; update', nb2: 'Final weight', nb3: 'compressed bars that buckle as solid rounds (σ > σcr)',
    hyp: [
      'Euler-Bernoulli beams (shear deformation neglected), small displacements, linear elastic material.',
      'Bending in the plane of the structure about the strong axis; buckling with the minimum moment of inertia (also out of plane) and effective length $\\beta L$ between nodes.',
      'Strength check with $\\sigma = |N|/A + |M|/W$ (sum of absolute values, conservative); shear and torsion not checked.',
      'Self-weight neglected. Catalog sections: EN 10219 tubes (D/t from 10 to 50), square hollow sections with outer radius 2t, IPE and HEA with fillets.',
      'Preliminary results: real structures must be checked with the standards (e.g. Eurocode 3: section classes, lateral-torsional buckling, connections).'
    ]
  }
};

function frReportFigure(show, reactions = false) {
  const prev = frShow;
  frShow = show;
  const holder = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  holder.setAttribute('viewBox', `0 0 ${FR_W} ${FR_H}`);
  holder.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  holder.setAttribute('font-family', 'Archivo, Arial, sans-serif');
  frDraw(holder, { print: true, reactions });
  frShow = prev;
  return reportSvgForPrint(holder.outerHTML.replace('<svg ', '<svg class="x" '));
}

function buildFrameReportHtml() {
  calculateFrames();
  const R = REPORT_TXT[currentLang] || REPORT_TXT.en, F = REPORT_FR_TXT[currentLang] || REPORT_FR_TXT.en, t = frT(), N = reportNum, T = texNum;
  const Rs = frResults, m = frModel;
  if (!Rs || !m || !m.members.length) return null;
  let body = '', sec = 0;
  const H = title => `<h3><span class="n">${++sec}.</span>${title}</h3>`;
  const mat = Rs.mat, matName = (t.mats[frEl('frMat').value] || t.custom);
  const fam = frSelFamily, z = fam ? Rs.byFamily[fam] : null, ev = z && z.ev && z.ev.ok ? z.ev : Rs.base;

  // 1. data
  body += H(F.s1) + reportKV([
    [F.mat, `${reportEsc(matName)} · E = ${N(mat.E, 0)} MPa · σs = ${N(mat.sigmaS, 0)} MPa · ρ = ${N(mat.rho, 0)} kg/m³`],
    [F.crit, `X = ${N(mat.X, 2)} (σ ≤ σs/X = ${N(mat.sigmaS / mat.X, 1)} MPa) · X inst. = ${N(mat.Xb, 2)} · β = ${N(mat.beta, 2)}` + (mat.deflMax > 0 ? ` · δ ≤ ${N(mat.deflMax, 1)} mm` : '')],
    [F.mode, Rs.mode === 'uniform' ? t.modeUniform : t.modeMember], [F.fams, Rs.fams.map(f => t.fam[f]).join(', ')]
  ]);

  // 2. model
  body += H(F.s2) + `<div class="fig">${frReportFigure('model')}<div class="cap">${F.figModel}</div></div>`;
  body += `<h4>${F.nodes}</h4>` + reportTable(['#', 'x [mm]', 'y [mm]'], m.nodes.map((n, i) => [i + 1, N(n.x, 0), N(n.y, 0)]));
  body += `<h4>${F.members}</h4>` + reportTable(['#', t.node + ' 1', t.node + ' 2', F.len, F.hinges], m.members.map((mm, i) => {
    const L = Math.hypot(m.nodes[mm.n2].x - m.nodes[mm.n1].x, m.nodes[mm.n2].y - m.nodes[mm.n1].y);
    return [i + 1, mm.n1 + 1, mm.n2 + 1, N(L, 0), mm.relStart && mm.relEnd ? F.both : mm.relStart ? F.start : mm.relEnd ? F.end : F.none];
  }));
  body += `<h4>${F.supports} · ${F.loads}</h4>` + reportTable([t.node, t.type], m.supports.map(s => [s.node + 1, t.sup[s.type]]));
  const lrows = m.loads.map(l => [`${t.node} ${l.node + 1}`, `Fx = ${N((l.Fx || 0) / 1000, 2)} kN · Fy = ${N((l.Fy || 0) / 1000, 2)} kN` + (l.M ? ` · M = ${N(l.M / 1e6, 2)} kN·m` : '')])
    .concat(m.dloads.map(d => [`${t.member} ${d.member + 1}`, `q = ${N(d.q, 2)} kN/m · ${t.dirs[d.dir]}`]));
  if (lrows.length) body += reportTable([F.loads, ''], lrows);

  // 3. method
  body += H(F.s3) + `<p>${F.m1}</p>` + reportEq([
    'k = \\begin{bmatrix} \\frac{EA}{L} & 0 & 0 & -\\frac{EA}{L} & 0 & 0 \\\\ 0 & \\frac{12EI}{L^3} & \\frac{6EI}{L^2} & 0 & -\\frac{12EI}{L^3} & \\frac{6EI}{L^2} \\\\ 0 & \\frac{6EI}{L^2} & \\frac{4EI}{L} & 0 & -\\frac{6EI}{L^2} & \\frac{2EI}{L} \\\\ -\\frac{EA}{L} & 0 & 0 & \\frac{EA}{L} & 0 & 0 \\\\ 0 & -\\frac{12EI}{L^3} & -\\frac{6EI}{L^2} & 0 & \\frac{12EI}{L^3} & -\\frac{6EI}{L^2} \\\\ 0 & \\frac{6EI}{L^2} & \\frac{2EI}{L} & 0 & -\\frac{6EI}{L^2} & \\frac{4EI}{L} \\end{bmatrix}'])
    + `<p>${F.m2}</p>` + reportEq(['K = \\sum_e T_e^{\\mathsf T}\\, k_e\\, T_e, \\qquad K\\,u = F, \\qquad f_{0} = \\left[\\,0,\\ -\\tfrac{qL}{2},\\ -\\tfrac{qL^2}{12},\\ 0,\\ -\\tfrac{qL}{2},\\ \\tfrac{qL^2}{12}\\,\\right]^{\\mathsf T}'])
    + `<p>${F.m3}</p>` + reportEq(['k_c = k_{aa} - k_{ar}\\, k_{rr}^{-1}\\, k_{ra}']) + `<p>${F.m4}</p><p>${F.m5}</p>`
    + reportEq([`\\sigma = \\frac{|N|}{A} + \\frac{|M|}{W} \\le \\frac{\\sigma_s}{X},\\qquad N_{cr} = \\frac{\\pi^2 E\\, I_{min}}{(\\beta L)^2} \\ge X_{inst}\\, |N_c|`]) + `<p>${F.m6}</p>`;

  // 4. analysis results (chosen family)
  if (ev) {
    body += H(F.s4) + (fam && z && z.ok ? `<p>${F.chosen}: <b>${t.fam[fam]}</b>${fam === Rs.best ? ` (${F.lightest})` : ''}</p>` : '');
    body += `<div class="fig">${frReportFigure('model', true)}<div class="cap">${F.reac}</div></div>`;
    body += reportTable([t.node, t.type, t.colRx, t.colRy, t.colRM], ev.an.reactions.map(r => [r.node + 1, t.sup[r.type], N(r.Rx / 1000, 2), N(r.Ry / 1000, 2), N(r.M / 1e6, 2)]));
    const anyM = ev.rows.some(r => r.sum.Mabs > 1);
    body += `<div class="fig">${frReportFigure('N')}<div class="cap">${F.figN}</div></div>`;
    if (anyM) body += `<div class="fig">${frReportFigure('V')}<div class="cap">${F.figV}</div></div><div class="fig">${frReportFigure('M')}<div class="cap">${F.figM}</div></div>`;
    body += `<div class="fig">${frReportFigure('def')}<div class="cap">${F.figD} · ${F.dmax} ${N(ev.dmax, 2)} mm</div></div>`;
  }

  // 5. comparison
  body += H(F.s5) + reportTable([F.family, F.secs, F.mass, F.Xmin, F.Xb, F.defl, F.res], Rs.fams.map(f => {
    const zz = Rs.byFamily[f]; if (!zz) return null;
    const e2 = zz.ev && zz.ev.ok ? zz.ev : null, names = zz.secs ? [...new Set(zz.secs.map(s => s.name))] : [];
    const Xm = e2 ? Math.min(...e2.rows.map(r => r.chk.Xs)) : NaN, Xbm = e2 ? Math.min(...e2.rows.map(r => r.chk.Xb)) : NaN;
    return { cls: f === Rs.best ? 'hl' : '', cells: [t.fam[f], names.slice(0, 6).join(', ') + (names.length > 6 ? '…' : ''), zz.mass ? N(zz.mass, 1) : '—', N(Xm, 2), Number.isFinite(Xbm) ? N(Xbm, 2) : '∞', e2 ? N(e2.dmax, 1) : '—',
      `<span class="${zz.ok ? 'ok' : 'ko'}">${zz.ok ? F.ok : F.ko}</span>` + (zz.ok ? '' : `<br><span class="small">${(t.reasons[zz.reason] || '').replace('{m}', (zz.member ?? 0) + 1)}</span>`)] };
  }).filter(Boolean));
  const best = Rs.best ? Rs.byFamily[Rs.best] : null, round = Rs.byFamily.round && Rs.byFamily.round.ok ? Rs.byFamily.round : null;
  if (best) body += `<div class="res"><div>${F.chosen}: <span class="big">${t.fam[Rs.best]} · ${N(best.mass, 1)} kg</span>${round && Rs.best !== 'round' ? ` · ${t.saving} ${N((1 - best.mass / round.mass) * 100, 0)} % ${t.vsRound}` : ''}</div></div>`;

  // 6. chosen sections, drawn with dimensions
  body += H(F.s6) + '<div class="secs">' + Rs.fams.map(f => {
    const zz = Rs.byFamily[f]; if (!zz || !zz.secs) return '';
    const big = zz.secs.reduce((a, b) => b.A > a.A ? b : a);
    return `<div class="secc"><b>${t.fam[f]} · ${big.name}</b><br><span class="small">A = ${N(big.A / 100, 2)} cm² · I = ${N(big.Iy / 1e4, 1)} cm⁴ · W = ${N(big.Wy / 1e3, 1)} cm³</span>${reportSvgForPrint(frSectionSvg(big, 'white'))}</div>`;
  }).join('') + '</div>';

  // 7. members of the chosen family
  if (z && z.ev && z.ev.ok) {
    body += H(`${F.s7} — ${t.fam[fam]}`) + reportTable(['#', F.sec, F.len, F.N, F.M, F.sig, F.X, F.XbC, F.U], z.ev.rows.map(r => {
      const Nc = Math.abs(r.sum.Nmin) > Math.abs(r.sum.Nmax) ? r.sum.Nmin : r.sum.Nmax;
      return { cls: r.chk.util > 1 + 1e-9 ? 'hl' : '', cells: [r.i + 1, r.sec.name, N(r.L, 0), N(Nc / 1000, 2), N(r.sum.Mabs / 1e6, 2), N(r.chk.sigma, 1), N(r.chk.Xs, 2), Number.isFinite(r.chk.Xb) ? N(r.chk.Xb, 2) : '—', `${N(r.chk.util * 100, 0)} %`] };
    }));
    // 8. worked check of the most loaded member
    const w = z.ev.rows.reduce((a, b) => b.chk.util > a.chk.util ? b : a), s = w.sec, ch = w.chk;
    let pk = w.sum.pts[0];
    for (const p of w.sum.pts) if (Math.abs(p.N) / s.A + Math.abs(p.M) / s.Wy > Math.abs(pk.N) / s.A + Math.abs(pk.M) / s.Wy) pk = p;
    const lines = [`\\sigma = \\frac{|N|}{A} + \\frac{|M|}{W} = \\frac{${T(Math.abs(pk.N), 0)}}{${T(s.A, 1)}} + \\frac{${T(Math.abs(pk.M), 0)}}{${T(s.Wy, 0)}} = ${T(ch.sigma, 1)}\\ \\text{MPa} \\;\\Rightarrow\\; X = \\frac{\\sigma_s}{\\sigma} = \\frac{${T(mat.sigmaS, 0)}}{${T(ch.sigma, 1)}} = ${T(ch.Xs, 2)}`];
    if (ch.Ncomp > 0) lines.push(`N_{cr} = \\frac{\\pi^2 E\\, I_{min}}{(\\beta L)^2} = \\frac{\\pi^2 \\cdot ${T(mat.E, 0)} \\cdot ${T(Math.min(s.Iy, s.Iz), 0)}}{(${T(mat.beta, 2)} \\cdot ${T(w.L, 0)})^2} = ${T(ch.Ncr / 1000, 1)}\\ \\text{kN} \\;\\Rightarrow\\; X_{inst} = \\frac{N_{cr}}{|N_c|} = \\frac{${T(ch.Ncr / 1000, 1)}}{${T(ch.Ncomp / 1000, 1)}} = ${T(ch.Xb, 2)}`);
    body += H(`${F.s8} (${F.worst} ${w.i + 1}, ${s.name})`) + reportEq(lines);
  }

  // 9. notebook comparison
  if (Rs.notebook) {
    const nb = Rs.notebook;
    body += H(F.s9) + reportEq([`A_i \\leftarrow A_i \\left(\\frac{|\\sigma_i|}{\\sigma_{amm}}\\right)^{\\eta},\\qquad \\sigma_{amm} = \\frac{\\sigma_s}{X} = ${T(nb.sAmm, 1)}\\ \\text{MPa},\\quad \\eta = 0{,}5`.replace('0{,}5', currentLang === 'it' ? '0{,}5' : '0.5')])
      + (nb.buck ? reportEq([`|\\sigma_i| \\le 0{,}8\\,\\sigma_{cr,i} = 0{,}8\\,\\frac{\\pi E A_i}{4 L_i^2} \\;\\Rightarrow\\; A_i \\ge \\sqrt{\\frac{4 L_i^2 |N_i|}{0{,}8\\,\\pi E}}`.replace(/0\{,\}8/g, currentLang === 'it' ? '0{,}8' : '0.8')]) : '')
      + reportTable(t.nbCols, frNotebookRows(Rs, t, N))
      + `<p class="small">${nb.nInst ? t.nbText(N(nb.W, 1), nb.nInst, N(nb.sAmm, 1)) : t.nbOk(N(nb.W, 1), N(nb.sAmm, 1))}</p>`;
  }

  // 10. assumptions
  body += H(F.s10) + '<ul>' + F.hyp.map(h => `<li>${reportTexify(h)}</li>`).join('') + '</ul>';
  frDraw();
  const sub = best ? `${t.fam[Rs.best]} · ${N(best.mass, 1)} kg · ${m.members.length} ${t.members.toLowerCase()}` : `${m.members.length} ${t.members.toLowerCase()}`;
  return reportShell(F.title, sub, `<style>.secs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.secc{border:1px solid #cbd5e1;border-radius:6px;padding:6px;break-inside:avoid;font-size:9pt}.secc svg{width:100%;height:auto}</style>` + body, R,
    currentLang === 'it' ? 'Analisi elastica lineare a elementi finiti di una struttura piana e dimensionamento di massima delle sezioni da catalogo. I risultati servono come prime quote: il progetto esecutivo va verificato con le norme (Eurocodice 3) e con un modello completo.'
      : 'Linear elastic finite element analysis of a plane structure and preliminary sizing with catalog sections. The results are first dimensions: the final design must be checked with the standards (Eurocode 3) and a complete model.');
}
