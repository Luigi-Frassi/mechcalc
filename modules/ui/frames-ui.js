// ============================================================================
// STRUCTURES (2D FEM) — editor, tables, results
// Draw nodes and members on a snapped grid, click to add supports, loads and hinges; the tables below
// hold the exact numbers. Every change re-solves the frame and sizes it with every section family.
// Input units: mm, kN, kN/m (= N/mm), kN·m; the core works in N and mm.
// ============================================================================

const FR_TXT = {
  it: {
    tools: { member: 'Asta', support: 'Vincolo', load: 'Forza', dload: 'Carico distribuito', hinge: 'Cerniera interna', del: 'Elimina' },
    toolHelp: {
      member: 'Trascina da un punto all\'altro (o clicca due punti) per creare un\'asta. I nodi si agganciano alla griglia e ai nodi esistenti.',
      support: 'Clicca un nodo per cambiare vincolo: cerniera → carrello orizzontale → carrello verticale → incastro → pattino → nessuno.',
      load: 'Clicca un nodo per aggiungere una forza (poi correggi i valori nella tabella).',
      dload: 'Clicca un\'asta per aggiungere un carico distribuito (verticale, per unità di lunghezza).',
      hinge: 'Clicca un\'asta vicino a un estremo per mettere o togliere la cerniera (momento nullo) in quel punto.',
      del: 'Clicca un nodo o un\'asta per eliminarli.'
    },
    grid: 'Griglia', fit: 'Adatta vista', clear: 'Svuota', preset: 'Esempi', presetPick: 'Carica un esempio…',
    presets: { beam: 'Trave appoggiata, carico distribuito', cant: 'Mensola con forza in punta', cont: 'Trave continua su 3 appoggi', portal: 'Portale incastrato', truss: 'Capriata reticolare', tower: 'Torre radio (notebook)' },
    view: 'Mostra', views: { model: 'Modello', def: 'Deformata', N: 'Sforzo normale N', V: 'Taglio T', M: 'Momento flettente M', util: 'Utilizzo delle aste' },
    nodes: 'Nodi', members: 'Aste', supports: 'Vincoli', loads: 'Forze nei nodi', dloads: 'Carichi distribuiti', add: 'Aggiungi',
    node: 'Nodo', member: 'Asta', start: 'inizio', end: 'fine', hingeAt: 'Cerniera', type: 'Tipo', dir: 'Direzione',
    sup: { pin: 'Cerniera', rollerX: 'Carrello (scorre in x)', rollerY: 'Carrello (scorre in y)', fixed: 'Incastro', guide: 'Pattino (blocca y e rotazione)' },
    dirs: { gy: 'Verticale (globale y)', perp: 'Perpendicolare all\'asta' },
    matTitle: 'Materiale e criteri', material: 'Materiale', custom: 'Personalizzato',
    mats: { s235: 'Acciaio S235', s355: 'Acciaio S355', c40: 'C40 bonificato', al6061: 'Alluminio 6061-T6', al_nb: 'Alluminio (notebook: σamm 170 MPa)' },
    E: 'Modulo elastico E', sy: 'Snervamento σs', rho: 'Densità ρ', X: 'X statico', Xb: 'X instabilità', beta: 'Lunghezza libera β·L', defl: 'Freccia ammissibile', deflHint: '0 = nessun limite',
    mode: 'Sezioni', modeMember: 'una per asta (minimo peso)', modeUniform: 'una sola per tutte le aste',
    families: 'Famiglie di sezioni', fam: { round: 'Tondo pieno', tube: 'Tubo tondo', rect: 'Rettangolare pieno (h = 2b)', box: 'Scatolato quadro', IPE: 'IPE', HEA: 'HEA' },
    resTitle: 'Dimensionamento: confronto delle sezioni', family: 'Famiglia', sections: 'Sezioni', mass: 'Massa', Xmin: 'X min', Xbmin: 'X inst. min', dmax: 'Freccia max', status: 'Esito',
    ok: 'verificata', ko: 'non verificata', best: 'più leggera', saving: 'risparmio', vsRound: 'rispetto al tondo pieno',
    reasons: { catalogTooSmall: 'nemmeno la sezione più grande del catalogo basta (asta {m})', deflection: 'freccia oltre il limite anche con le sezioni più grandi', strength: 'resistenza o instabilità non verificate', mechanism: 'struttura labile: aggiungi vincoli o aste', momentOnHinge: 'momento applicato su un nodo con sole cerniere', zeroLength: 'asta di lunghezza nulla', empty: 'disegna almeno un\'asta' },
    pick: 'Clicca una riga per vedere quella famiglia sul disegno e nella tabella delle aste.',
    secTitle: 'Sezioni scelte (la più grande per famiglia, quote in mm)',
    memTitle: 'Aste — famiglia', colSec: 'Sezione', colL: 'L [mm]', colN: 'N [kN]', colM: '|M| max [kN·m]', colS: 'σ max [MPa]', colX: 'X', colXb: 'X inst.', colU: 'Utilizzo',
    reacTitle: 'Reazioni vincolari', colRx: 'Rx [kN]', colRy: 'Ry [kN]', colRM: 'M [kN·m]',
    nbTitle: 'Confronto con il notebook (aree continue, aste solo assiali, stessi limiti 5–226 cm²)',
    nbRows: { fsd: 'FSD del notebook, senza instabilità', fsdB: 'FSD con instabilità, tondo pieno (|σ| ≤ 0,8·σcr come nel tuo gradiente)', grad: 'Gradiente del notebook (L-BFGS-B con penalità, tondo pieno)', cat: 'Torsio, sezioni a catalogo con Eulero' },
    nbCols: ['Metodo', 'Massa', 'Note'], nbUnstable: n => `${n} aste compresse instabili (σ > σcr)`, nbAllOk: 'resistenza e instabilità verificate',
    nbGradNote: 'risultato del notebook: |σ| < σcr in tutte le aste compresse, 7 oltre il margine 0,8 (penalità, non vincolo)', nbCatNote: f => `famiglia ${f}`,
    nbText: (W, nInst, sAmm) => `Con le aree libere (5–226 cm², come nel notebook) e σamm = σs/X = ${sAmm} MPa l'FSD del notebook arriva a ${W} kg, ma ${nInst} aste compresse risultano instabili se fatte a tondo pieno (σ > σcr). Il dimensionamento a catalogo qui sopra tiene conto di Eulero.`,
    nbOk: (W, sAmm) => `Con le aree libere (5–226 cm², come nel notebook) e σamm = σs/X = ${sAmm} MPa l'FSD del notebook arriva a ${W} kg: è il limite inferiore teorico, senza instabilità né sezioni commerciali.`,
    hyp: 'Ipotesi: travi di Eulero-Bernoulli, piccoli spostamenti, flessione nel piano attorno all\'asse forte; σ = |N|/A + |M|/W; instabilità di Eulero con il momento d\'inerzia minimo e lunghezza libera β·L; peso proprio trascurato; taglio non verificato.',
    empty: 'Disegna una struttura: scegli "Asta" e trascina sulla griglia, oppure carica un esempio.',
    scale: 'scala', drawHint: 'Trascina per disegnare'
  },
  en: {
    tools: { member: 'Member', support: 'Support', load: 'Force', dload: 'Distributed load', hinge: 'Internal hinge', del: 'Delete' },
    toolHelp: {
      member: 'Drag from one point to another (or click two points) to create a member. Nodes snap to the grid and to existing nodes.',
      support: 'Click a node to change its support: pin → horizontal roller → vertical roller → fixed → guide → none.',
      load: 'Click a node to add a force (then correct the values in the table).',
      dload: 'Click a member to add a distributed load (vertical, per unit length).',
      hinge: 'Click a member near one end to add or remove a hinge (zero moment) there.',
      del: 'Click a node or a member to delete it.'
    },
    grid: 'Grid', fit: 'Fit view', clear: 'Clear', preset: 'Examples', presetPick: 'Load an example…',
    presets: { beam: 'Simply supported beam, distributed load', cant: 'Cantilever with tip force', cont: 'Continuous beam on 3 supports', portal: 'Fixed portal frame', truss: 'Roof truss', tower: 'Radio tower (notebook)' },
    view: 'Show', views: { model: 'Model', def: 'Deformed shape', N: 'Axial force N', V: 'Shear V', M: 'Bending moment M', util: 'Member utilization' },
    nodes: 'Nodes', members: 'Members', supports: 'Supports', loads: 'Nodal forces', dloads: 'Distributed loads', add: 'Add',
    node: 'Node', member: 'Member', start: 'start', end: 'end', hingeAt: 'Hinge', type: 'Type', dir: 'Direction',
    sup: { pin: 'Pin', rollerX: 'Roller (slides in x)', rollerY: 'Roller (slides in y)', fixed: 'Fixed', guide: 'Guide (blocks y and rotation)' },
    dirs: { gy: 'Vertical (global y)', perp: 'Perpendicular to the member' },
    matTitle: 'Material and criteria', material: 'Material', custom: 'Custom',
    mats: { s235: 'Steel S235', s355: 'Steel S355', c40: 'C40 Q&T', al6061: 'Aluminium 6061-T6', al_nb: 'Aluminium (notebook: σallow 170 MPa)' },
    E: 'Young\'s modulus E', sy: 'Yield strength σy', rho: 'Density ρ', X: 'Static X', Xb: 'Buckling X', beta: 'Effective length β·L', defl: 'Allowable deflection', deflHint: '0 = no limit',
    mode: 'Sections', modeMember: 'one per member (minimum weight)', modeUniform: 'one for all members',
    families: 'Section families', fam: { round: 'Solid round', tube: 'Round tube', rect: 'Solid rectangle (h = 2b)', box: 'Square hollow', IPE: 'IPE', HEA: 'HEA' },
    resTitle: 'Sizing: comparison of the sections', family: 'Family', sections: 'Sections', mass: 'Mass', Xmin: 'Min X', Xbmin: 'Min buckling X', dmax: 'Max deflection', status: 'Result',
    ok: 'verified', ko: 'not verified', best: 'lightest', saving: 'saving', vsRound: 'compared with the solid round',
    reasons: { catalogTooSmall: 'not even the largest section of the catalog is enough (member {m})', deflection: 'deflection over the limit even with the largest sections', strength: 'strength or buckling not verified', mechanism: 'unstable structure: add supports or members', momentOnHinge: 'moment applied on a node with hinges only', zeroLength: 'zero-length member', empty: 'draw at least one member' },
    pick: 'Click a row to show that family on the drawing and in the members table.',
    secTitle: 'Chosen sections (the largest per family, dimensions in mm)',
    memTitle: 'Members — family', colSec: 'Section', colL: 'L [mm]', colN: 'N [kN]', colM: '|M| max [kN·m]', colS: 'σ max [MPa]', colX: 'X', colXb: 'Buckl. X', colU: 'Utilization',
    reacTitle: 'Support reactions', colRx: 'Rx [kN]', colRy: 'Ry [kN]', colRM: 'M [kN·m]',
    nbTitle: 'Comparison with the notebook (continuous areas, axial bars only, same bounds 5–226 cm²)',
    nbRows: { fsd: 'Notebook FSD, no buckling', fsdB: 'FSD with buckling, solid round (|σ| ≤ 0.8·σcr as in your gradient method)', grad: 'Notebook gradient (L-BFGS-B with penalties, solid round)', cat: 'Torsio, catalog sections with Euler' },
    nbCols: ['Method', 'Mass', 'Notes'], nbUnstable: n => `${n} compressed bars buckle (σ > σcr)`, nbAllOk: 'strength and buckling verified',
    nbGradNote: 'notebook result: |σ| < σcr in every compressed bar, 7 above the 0.8 margin (penalty, not a constraint)', nbCatNote: f => `${f} family`,
    nbText: (W, nInst, sAmm) => `With free areas (5–226 cm², as in the notebook) and σallow = σy/X = ${sAmm} MPa the notebook FSD reaches ${W} kg, but ${nInst} compressed bars buckle if made as solid rounds (σ > σcr). The catalog sizing above includes Euler buckling.`,
    nbOk: (W, sAmm) => `With free areas (5–226 cm², as in the notebook) and σallow = σy/X = ${sAmm} MPa the notebook FSD reaches ${W} kg: the theoretical lower bound, without buckling or commercial sections.`,
    hyp: 'Assumptions: Euler-Bernoulli beams, small displacements, in-plane bending about the strong axis; σ = |N|/A + |M|/W; Euler buckling with the minimum moment of inertia and effective length β·L; self-weight neglected; shear not checked.',
    empty: 'Draw a structure: pick "Member" and drag on the grid, or load an example.',
    scale: 'scale', drawHint: 'Drag to draw'
  }
};

const FR_MATS = {
  s235: { E: 210000, sy: 235, rho: 7850 }, s355: { E: 210000, sy: 355, rho: 7850 }, c40: { E: 206000, sy: 430, rho: 7850 },
  al6061: { E: 69000, sy: 240, rho: 2700 }, al_nb: { E: 70000, sy: 255, rho: 2770 }
};
const FR_SUP_CYCLE = ['pin', 'rollerX', 'rollerY', 'fixed', 'guide', null];
const FR_W = 900, FR_H = 460;

let frModel = null;
let frTool = 'member';
let frGrid = 500;
let frView = { x0: -500, y0: -1500, x1: 8500, y1: 3500 };
let frShow = 'M';
let frPending = null;       // first point of a member drawn with two clicks
let frDrag = null;          // { a: {x,y}, b: {x,y} } while dragging
let frResults = null;       // { byFamily: {fam: sizing}, best, sel }
let frSelFamily = null;
let frCalcTimer = null;

function frT() { return FR_TXT[currentLang] || FR_TXT.en; }
function frEl(id) { return document.getElementById(id); }
function frNum(x, n = 2) { if (Number.isFinite(x) && Math.abs(x) < 0.5 * Math.pow(10, -n)) x = 0; return Number.isFinite(x) ? x.toLocaleString(currentLang === 'it' ? 'it-IT' : 'en-GB', { minimumFractionDigits: n, maximumFractionDigits: n }) : '—'; }
function frClone(m) { return JSON.parse(JSON.stringify(m)); }

// ---- presets (lengths mm, forces N, q N/mm) ----------------------------------------------------------
function frPreset(key) {
  const N = (x, y) => ({ x, y });
  if (key === 'cant') return { nodes: [N(0, 0), N(2000, 0)], members: [{ n1: 0, n2: 1 }], supports: [{ node: 0, type: 'fixed' }], loads: [{ node: 1, Fx: 0, Fy: -5000, M: 0 }], dloads: [] };
  if (key === 'cont') return { nodes: [N(0, 0), N(4000, 0), N(8000, 0)], members: [{ n1: 0, n2: 1 }, { n1: 1, n2: 2 }],
    supports: [{ node: 0, type: 'pin' }, { node: 1, type: 'rollerX' }, { node: 2, type: 'rollerX' }], loads: [], dloads: [{ member: 0, q: -10, dir: 'gy' }, { member: 1, q: -10, dir: 'gy' }] };
  if (key === 'portal') return { nodes: [N(0, 0), N(0, 3000), N(5000, 3000), N(5000, 0)], members: [{ n1: 0, n2: 1 }, { n1: 1, n2: 2 }, { n1: 2, n2: 3 }],
    supports: [{ node: 0, type: 'fixed' }, { node: 3, type: 'fixed' }], loads: [{ node: 1, Fx: 10000, Fy: 0, M: 0 }], dloads: [{ member: 1, q: -15, dir: 'gy' }] };
  if (key === 'truss') {
    const nodes = [N(0, 0), N(2000, 0), N(4000, 0), N(6000, 0), N(8000, 0), N(2000, 1000), N(4000, 2000), N(6000, 1000)];
    const els = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 4], [1, 5], [2, 5], [2, 6], [2, 7], [3, 7]];
    return { nodes, members: els.map(([a, b]) => ({ n1: a, n2: b, relStart: true, relEnd: true })), supports: [{ node: 0, type: 'pin' }, { node: 4, type: 'rollerX' }],
      loads: [5, 6, 7].map(n => ({ node: n, Fx: 0, Fy: -15000, M: 0 })), dloads: [] };
  }
  if (key === 'tower') {
    const nodes = [[0, 0], [5, 0], [0.5, 5], [4.5, 5], [1, 10], [4, 10], [1.5, 15], [3.5, 15], [2, 20], [3, 20]].map(([x, y]) => N(x * 1000, y * 1000));
    const els = [[0, 2], [2, 3], [2, 4], [4, 5], [4, 6], [6, 7], [6, 8], [8, 9], [1, 3], [3, 5], [5, 7], [7, 9], [0, 3], [2, 5], [4, 7], [6, 9], [2, 1], [4, 3], [6, 5], [8, 7]];
    return { nodes, members: els.map(([a, b]) => ({ n1: a, n2: b, relStart: true, relEnd: true })), supports: [{ node: 0, type: 'pin' }, { node: 1, type: 'pin' }],
      loads: [2, 4, 6, 8].map(n => ({ node: n, Fx: 60000, Fy: 0, M: 0 })), dloads: [] };
  }
  return { nodes: [N(0, 0), N(5000, 0)], members: [{ n1: 0, n2: 1 }], supports: [{ node: 0, type: 'pin' }, { node: 1, type: 'rollerX' }], loads: [], dloads: [{ member: 0, q: -10, dir: 'gy' }] };
}

function frLoadPreset(key) {
  frBuildStatic();
  frModel = frPreset(key);
  frRelabelOnce();
  const mat = key === 'tower' ? 'al_nb' : 's235';
  frSetMaterial(mat);
  if (key === 'tower') { frEl('frX').value = 1.5; frEl('frXb').value = 2; frEl('frDefl').value = 0; frGrid = 500; }
  else if (key === 'truss') { frEl('frDefl').value = 0; }
  else { frEl('frDefl').value = key === 'cant' ? 10 : key === 'portal' ? 15 : 20; }
  frEl('frGrid').value = frGrid;
  frShow = key === 'truss' || key === 'tower' ? 'N' : 'M';
  frEl('frShow').value = frShow;
  frFitView();
  frRenderTables();
  calculateFrames();
}

function frSetMaterial(key) {
  const m = FR_MATS[key];
  if (!m) return;
  frEl('frMat').value = key;
  frEl('frE').value = m.E; frEl('frSy').value = m.sy; frEl('frRho').value = m.rho;
}

// ---- static markup (built once, relabelled on language change) ------------------------------------
function frInput(id, val, unit, attrs = '') {
  return `<div class="relative"><input type="number" id="${id}" value="${val}" step="any" ${attrs} class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">${unit ? `<span class="absolute right-3 top-2 text-slate-400 font-medium text-xs">${unit}</span>` : ''}</div>`;
}
const FR_LBL = 'block text-xs font-semibold text-slate-300 tracking-wide mb-1.5';
const FR_CARD = 'bg-slate-800/60 p-5 rounded-xl border border-slate-700/60 mb-4';
const FR_H3 = 'text-sm font-semibold text-white mb-3';

function frBuildStatic() {
  const sec = frEl('moduleFramesSection');
  if (!sec || sec.dataset.built) return;
  sec.dataset.built = '1';
  sec.innerHTML = `
  <div class="${FR_CARD}">
    <div class="flex flex-wrap items-center gap-2 mb-3" id="frTools"></div>
    <p class="text-xs text-slate-400 mb-3 min-h-[2.5em]" id="frToolHelp"></p>
    <div class="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
      <svg id="frCanvas" viewBox="0 0 ${FR_W} ${FR_H}" class="w-full h-auto block touch-none select-none" style="cursor:crosshair" font-family="Archivo, Arial, sans-serif"></svg>
      <div id="frEmpty" class="absolute inset-0 flex items-center justify-center pointer-events-none text-sm text-slate-400 px-6 text-center"></div>
    </div>
    <div class="flex flex-wrap items-end gap-3 mt-3 text-xs">
      <div><label class="${FR_LBL}" id="frShowLbl"></label><select id="frShow" class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"></select></div>
      <div class="w-28"><label class="${FR_LBL}" id="frGridLbl"></label>${frInput('frGrid', frGrid, 'mm', 'min="10"')}</div>
      <div><label class="${FR_LBL}" id="frPresetLbl"></label><select id="frPreset" class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"></select></div>
      <button type="button" id="frFit" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200"></button>
      <button type="button" id="frClear" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200"></button>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div class="${FR_CARD} overflow-x-auto"><h3 class="${FR_H3}" id="frNodesT"></h3><div id="frNodesTbl"></div></div>
    <div class="${FR_CARD} overflow-x-auto"><h3 class="${FR_H3}" id="frMembersT"></h3><div id="frMembersTbl"></div></div>
    <div class="${FR_CARD} overflow-x-auto"><h3 class="${FR_H3}" id="frSupportsT"></h3><div id="frSupportsTbl"></div></div>
    <div class="${FR_CARD} overflow-x-auto"><h3 class="${FR_H3}" id="frLoadsT"></h3><div id="frLoadsTbl"></div><h3 class="${FR_H3} mt-4" id="frDloadsT"></h3><div id="frDloadsTbl"></div></div>
  </div>

  <div class="${FR_CARD}">
    <h3 class="${FR_H3}" id="frMatT"></h3>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="col-span-2"><label class="${FR_LBL}" id="frMatLbl"></label><select id="frMat" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"></select></div>
      <div><label class="${FR_LBL}" id="frELbl"></label>${frInput('frE', 210000, 'MPa')}</div>
      <div><label class="${FR_LBL}" id="frSyLbl"></label>${frInput('frSy', 235, 'MPa')}</div>
      <div><label class="${FR_LBL}" id="frRhoLbl"></label>${frInput('frRho', 7850, 'kg/m³')}</div>
      <div><label class="${FR_LBL}" id="frXLbl"></label>${frInput('frX', 1.5, '')}</div>
      <div><label class="${FR_LBL}" id="frXbLbl"></label>${frInput('frXb', 2.5, '')}</div>
      <div><label class="${FR_LBL}" id="frBetaLbl"></label>${frInput('frBeta', 1, '')}</div>
      <div><label class="${FR_LBL}" id="frDeflLbl"></label>${frInput('frDefl', 20, 'mm', 'min="0"')}<p class="text-[11px] text-slate-500 mt-1" id="frDeflHint"></p></div>
      <div class="col-span-2 md:col-span-3"><label class="${FR_LBL}" id="frModeLbl"></label><select id="frMode" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"><option value="member"></option><option value="uniform"></option></select></div>
    </div>
    <div class="mt-4"><label class="${FR_LBL}" id="frFamLbl"></label><div id="frFams" class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-200"></div></div>
  </div>

  <div class="${FR_CARD}" id="frResCard">
    <h3 class="${FR_H3}" id="frResT"></h3>
    <div id="frBest" class="mb-3"></div>
    <div class="overflow-x-auto"><table class="w-full text-xs text-left" id="frCmp"></table></div>
    <p class="text-[11px] text-slate-500 mt-2" id="frPick"></p>
    <div id="frNb" class="mt-3"></div>
  </div>
  <div class="${FR_CARD}"><h3 class="${FR_H3}" id="frSecT"></h3><div id="frSecs" class="grid grid-cols-2 md:grid-cols-3 gap-3"></div></div>
  <div class="${FR_CARD} overflow-x-auto"><h3 class="${FR_H3}" id="frMemT"></h3><div id="frMemTbl"></div><h3 class="${FR_H3} mt-4" id="frReacT"></h3><div id="frReacTbl"></div>
    <p class="text-[11px] text-slate-500 mt-3" id="frHyp"></p></div>`;

  frEl('frGrid').addEventListener('change', () => { frGrid = Math.max(10, parseFloat(frEl('frGrid').value) || 500); frDraw(); });
  frEl('frShow').addEventListener('change', () => { frShow = frEl('frShow').value; frDraw(); });
  frEl('frPreset').addEventListener('change', () => { const k = frEl('frPreset').value; if (k) frLoadPreset(k); frEl('frPreset').value = ''; });
  frEl('frFit').addEventListener('click', () => { frFitView(); frDraw(); });
  frEl('frClear').addEventListener('click', () => { frModel = { nodes: [], members: [], supports: [], loads: [], dloads: [] }; frPending = null; frRenderTables(); calculateFrames(); });
  frEl('frMat').addEventListener('change', () => { frSetMaterial(frEl('frMat').value); calculateFrames(); });
  ['frE', 'frSy', 'frRho'].forEach(id => frEl(id).addEventListener('input', () => { frEl('frMat').value = 'custom'; frScheduleCalc(); }));
  ['frX', 'frXb', 'frBeta', 'frDefl', 'frMode'].forEach(id => frEl(id).addEventListener(id === 'frMode' ? 'change' : 'input', frScheduleCalc));
  frEl('frFams').addEventListener('change', frScheduleCalc);
  frEl('frCmp').addEventListener('click', ev => { const tr = ev.target.closest('tr[data-fam]'); if (tr) { frSelFamily = tr.dataset.fam; frRenderResults(); frDraw(); } });
  frInitCanvas();
}

function frRelabel() {
  const t = frT();
  if (!frEl('frTools')) return;
  frEl('frTools').innerHTML = Object.keys(t.tools).map(k =>
    `<button type="button" data-tool="${k}" class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${k === frTool ? 'bg-blue-600/20 text-blue-300 border-blue-500/40' : 'text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800'}">${t.tools[k]}</button>`).join('');
  frEl('frTools').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { frTool = b.dataset.tool; frPending = null; frRelabel(); frDraw(); }));
  frEl('frToolHelp').textContent = t.toolHelp[frTool];
  frEl('frEmpty').textContent = t.empty;
  frEl('frShowLbl').textContent = t.view;
  frEl('frShow').innerHTML = Object.entries(t.views).map(([k, v]) => `<option value="${k}" ${k === frShow ? 'selected' : ''}>${v}</option>`).join('');
  frEl('frGridLbl').textContent = t.grid;
  frEl('frPresetLbl').textContent = t.preset;
  frEl('frPreset').innerHTML = `<option value="">${t.presetPick}</option>` + Object.entries(t.presets).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  frEl('frFit').textContent = t.fit; frEl('frClear').textContent = t.clear;
  frEl('frNodesT').textContent = t.nodes; frEl('frMembersT').textContent = t.members; frEl('frSupportsT').textContent = t.supports;
  frEl('frLoadsT').textContent = t.loads; frEl('frDloadsT').textContent = t.dloads;
  frEl('frMatT').textContent = t.matTitle; frEl('frMatLbl').textContent = t.material;
  const mv = frEl('frMat').value || 's235';
  frEl('frMat').innerHTML = Object.entries(t.mats).map(([k, v]) => `<option value="${k}">${v}</option>`).join('') + `<option value="custom">${t.custom}</option>`;
  frEl('frMat').value = mv;
  frEl('frELbl').textContent = t.E; frEl('frSyLbl').textContent = t.sy; frEl('frRhoLbl').textContent = t.rho; frEl('frXLbl').textContent = t.X; frEl('frXbLbl').textContent = t.Xb;
  frEl('frBetaLbl').textContent = t.beta; frEl('frDeflLbl').textContent = t.defl; frEl('frDeflHint').textContent = t.deflHint;
  frEl('frModeLbl').textContent = t.mode;
  frEl('frMode').options[0].textContent = t.modeMember; frEl('frMode').options[1].textContent = t.modeUniform;
  frEl('frFamLbl').textContent = t.families;
  const checked = frFamiliesChecked(true);
  frEl('frFams').innerHTML = FR_FAMILIES.map(f => `<label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" value="${f}" ${checked.includes(f) ? 'checked' : ''}> ${t.fam[f]}</label>`).join('');
  frEl('frResT').textContent = t.resTitle; frEl('frPick').textContent = t.pick; frEl('frSecT').textContent = t.secTitle;
  frEl('frReacT').textContent = t.reacTitle; frEl('frHyp').textContent = t.hyp;
}

function frFamiliesChecked(fallbackAll = false) {
  const boxes = document.querySelectorAll('#frFams input');
  if (!boxes.length) return fallbackAll ? FR_FAMILIES.slice() : [];
  return [...boxes].filter(b => b.checked).map(b => b.value);
}

// ---- tables -------------------------------------------------------------------------------------------
const FR_TIN = 'w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-white text-xs';
const FR_TSEL = 'bg-slate-900 border border-slate-700 rounded px-1 py-1 text-white text-xs';
const FR_DEL = '<button type="button" class="text-slate-500 hover:text-rose-400 px-1" data-del title="✕">✕</button>';

function frTable(head, rows) {
  return `<table class="text-xs text-left w-full"><thead><tr class="text-slate-400">${head.map(h => `<th class="font-semibold pb-1 pr-2">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

function frRenderTables() {
  const t = frT(), m = frModel;
  const nodeOpts = sel => m.nodes.map((n, i) => `<option value="${i}" ${i === sel ? 'selected' : ''}>${i + 1}</option>`).join('');
  const memOpts = sel => m.members.map((n, i) => `<option value="${i}" ${i === sel ? 'selected' : ''}>${i + 1}</option>`).join('');
  frEl('frNodesTbl').innerHTML = frTable(['#', 'x [mm]', 'y [mm]', ''], m.nodes.map((n, i) =>
    `<tr data-k="nodes" data-i="${i}"><td class="pr-2 text-slate-400">${i + 1}</td><td class="pr-2"><input class="${FR_TIN}" type="number" step="any" data-f="x" value="${n.x}"></td><td class="pr-2"><input class="${FR_TIN}" type="number" step="any" data-f="y" value="${n.y}"></td><td>${FR_DEL}</td></tr>`));
  frEl('frMembersTbl').innerHTML = frTable(['#', t.node + ' 1', t.node + ' 2', `${t.hingeAt} ${t.start}`, `${t.hingeAt} ${t.end}`, ''], m.members.map((mm, i) =>
    `<tr data-k="members" data-i="${i}"><td class="pr-2 text-slate-400">${i + 1}</td><td class="pr-2"><select class="${FR_TSEL}" data-f="n1">${nodeOpts(mm.n1)}</select></td><td class="pr-2"><select class="${FR_TSEL}" data-f="n2">${nodeOpts(mm.n2)}</select></td>` +
    `<td class="pr-2"><input type="checkbox" data-f="relStart" ${mm.relStart ? 'checked' : ''}></td><td class="pr-2"><input type="checkbox" data-f="relEnd" ${mm.relEnd ? 'checked' : ''}></td><td>${FR_DEL}</td></tr>`));
  frEl('frSupportsTbl').innerHTML = frTable([t.node, t.type, ''], m.supports.map((s, i) =>
    `<tr data-k="supports" data-i="${i}"><td class="pr-2"><select class="${FR_TSEL}" data-f="node">${nodeOpts(s.node)}</select></td><td class="pr-2"><select class="${FR_TSEL}" data-f="type">${Object.entries(t.sup).map(([k, v]) => `<option value="${k}" ${k === s.type ? 'selected' : ''}>${v}</option>`).join('')}</select></td><td>${FR_DEL}</td></tr>`)) +
    (m.nodes.length ? `<button type="button" class="mt-2 text-xs text-blue-300 hover:text-blue-200" data-add="supports">+ ${t.add}</button>` : '');
  frEl('frLoadsTbl').innerHTML = frTable([t.node, 'Fx [kN]', 'Fy [kN]', 'M [kN·m]', ''], m.loads.map((l, i) =>
    `<tr data-k="loads" data-i="${i}"><td class="pr-2"><select class="${FR_TSEL}" data-f="node">${nodeOpts(l.node)}</select></td>` +
    `<td class="pr-2"><input class="${FR_TIN}" type="number" step="any" data-f="Fx" data-s="1000" value="${+(l.Fx / 1000).toFixed(4)}"></td><td class="pr-2"><input class="${FR_TIN}" type="number" step="any" data-f="Fy" data-s="1000" value="${+(l.Fy / 1000).toFixed(4)}"></td>` +
    `<td class="pr-2"><input class="${FR_TIN}" type="number" step="any" data-f="M" data-s="1000000" value="${+((l.M || 0) / 1e6).toFixed(4)}"></td><td>${FR_DEL}</td></tr>`)) +
    (m.nodes.length ? `<button type="button" class="mt-2 text-xs text-blue-300 hover:text-blue-200" data-add="loads">+ ${t.add}</button>` : '');
  frEl('frDloadsTbl').innerHTML = frTable([t.member, 'q [kN/m]', t.dir, ''], m.dloads.map((d, i) =>
    `<tr data-k="dloads" data-i="${i}"><td class="pr-2"><select class="${FR_TSEL}" data-f="member">${memOpts(d.member)}</select></td><td class="pr-2"><input class="${FR_TIN}" type="number" step="any" data-f="q" value="${d.q}"></td>` +
    `<td class="pr-2"><select class="${FR_TSEL}" data-f="dir">${Object.entries(t.dirs).map(([k, v]) => `<option value="${k}" ${k === d.dir ? 'selected' : ''}>${v}</option>`).join('')}</select></td><td>${FR_DEL}</td></tr>`)) +
    (m.members.length ? `<button type="button" class="mt-2 text-xs text-blue-300 hover:text-blue-200" data-add="dloads">+ ${t.add}</button>` : '');
}

function frTableEvent(ev) {
  const add = ev.target.closest('[data-add]');
  if (add && ev.type === 'click') {
    const k = add.dataset.add;
    if (k === 'supports') frModel.supports.push({ node: 0, type: 'pin' });
    if (k === 'loads') frModel.loads.push({ node: Math.max(0, frModel.nodes.length - 1), Fx: 0, Fy: -10000, M: 0 });
    if (k === 'dloads') frModel.dloads.push({ member: 0, q: -10, dir: 'gy' });
    frRenderTables(); calculateFrames(); return;
  }
  const tr = ev.target.closest('tr[data-k]');
  if (!tr) return;
  const k = tr.dataset.k, i = +tr.dataset.i;
  if (ev.target.closest('[data-del]') && ev.type === 'click') {
    if (k === 'nodes') frDeleteNode(i);
    else if (k === 'members') frDeleteMember(i);
    else frModel[k].splice(i, 1);
    frRenderTables(); calculateFrames(); return;
  }
  const f = ev.target.dataset.f;
  if (!f || ev.type !== 'change') return;
  const obj = frModel[k][i];
  if (ev.target.type === 'checkbox') obj[f] = ev.target.checked;
  else if (ev.target.tagName === 'SELECT') obj[f] = ['node', 'n1', 'n2', 'member'].includes(f) ? +ev.target.value : ev.target.value;
  else { const v = parseFloat(ev.target.value); if (Number.isFinite(v)) obj[f] = v * (parseFloat(ev.target.dataset.s) || 1); }
  calculateFrames();
}

function frDeleteNode(i) {
  const m = frModel;
  const gone = new Set(m.members.map((mm, k) => (mm.n1 === i || mm.n2 === i) ? k : -1).filter(k => k >= 0));
  [...gone].sort((a, b) => b - a).forEach(k => frDeleteMember(k));
  m.nodes.splice(i, 1);
  const fix = n => n > i ? n - 1 : n;
  m.members.forEach(mm => { mm.n1 = fix(mm.n1); mm.n2 = fix(mm.n2); });
  m.supports = m.supports.filter(s => s.node !== i).map(s => ({ ...s, node: fix(s.node) }));
  m.loads = m.loads.filter(l => l.node !== i).map(l => ({ ...l, node: fix(l.node) }));
}
function frDeleteMember(k) {
  const m = frModel;
  m.members.splice(k, 1);
  m.dloads = m.dloads.filter(d => d.member !== k).map(d => ({ ...d, member: d.member > k ? d.member - 1 : d.member }));
}

// ---- canvas -------------------------------------------------------------------------------------------
function frScale() { return Math.min(FR_W / (frView.x1 - frView.x0), FR_H / (frView.y1 - frView.y0)); }
function frToScreen(p) {
  const s = frScale(), cx = (frView.x0 + frView.x1) / 2, cy = (frView.y0 + frView.y1) / 2;
  return { X: FR_W / 2 + (p.x - cx) * s, Y: FR_H / 2 - (p.y - cy) * s };
}
function frToModel(X, Y) {
  const s = frScale(), cx = (frView.x0 + frView.x1) / 2, cy = (frView.y0 + frView.y1) / 2;
  return { x: cx + (X - FR_W / 2) / s, y: cy - (Y - FR_H / 2) / s };
}
function frFitView() {
  const ns = frModel.nodes;
  if (!ns.length) { frView = { x0: -500, y0: -1500, x1: 8500, y1: 3500 }; return; }
  let x0 = Math.min(...ns.map(n => n.x)), x1 = Math.max(...ns.map(n => n.x)), y0 = Math.min(...ns.map(n => n.y)), y1 = Math.max(...ns.map(n => n.y));
  const span = Math.max(x1 - x0, y1 - y0, 1000), pad = span * 0.14;
  frView = { x0: x0 - pad, x1: x1 + pad, y0: y0 - pad, y1: y1 + pad };
}

function frEventPoint(ev) {
  const svg = frEl('frCanvas'), r = svg.getBoundingClientRect();
  const X = (ev.clientX - r.left) * FR_W / r.width, Y = (ev.clientY - r.top) * FR_H / r.height;
  return { X, Y };
}
function frNearestNode(X, Y, tolPx = 14) {
  let best = -1, bd = tolPx;
  frModel.nodes.forEach((n, i) => { const p = frToScreen(n), d = Math.hypot(p.X - X, p.Y - Y); if (d < bd) { bd = d; best = i; } });
  return best;
}
function frNearestMember(X, Y, tolPx = 10) {
  let best = -1, bd = tolPx, tAt = 0;
  frModel.members.forEach((mm, i) => {
    const a = frToScreen(frModel.nodes[mm.n1]), b = frToScreen(frModel.nodes[mm.n2]);
    const dx = b.X - a.X, dy = b.Y - a.Y, L2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((X - a.X) * dx + (Y - a.Y) * dy) / L2));
    const d = Math.hypot(a.X + t * dx - X, a.Y + t * dy - Y);
    if (d < bd) { bd = d; best = i; tAt = t; }
  });
  return { i: best, t: tAt };
}
function frSnap(X, Y) {
  const n = frNearestNode(X, Y);
  if (n >= 0) return { ...frModel.nodes[n], node: n };
  const p = frToModel(X, Y);
  return { x: Math.round(p.x / frGrid) * frGrid, y: Math.round(p.y / frGrid) * frGrid };
}
function frNodeAt(p) {
  if (p.node !== undefined) return p.node;
  const i = frModel.nodes.findIndex(n => Math.abs(n.x - p.x) < 1e-6 && Math.abs(n.y - p.y) < 1e-6);
  if (i >= 0) return i;
  frModel.nodes.push({ x: p.x, y: p.y });
  return frModel.nodes.length - 1;
}
function frAddMember(a, b) {
  if (Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6) return false;
  const n1 = frNodeAt(a), n2 = frNodeAt(b);
  if (frModel.members.some(mm => (mm.n1 === n1 && mm.n2 === n2) || (mm.n1 === n2 && mm.n2 === n1))) return false;
  frModel.members.push({ n1, n2, relStart: false, relEnd: false });
  return true;
}

function frInitCanvas() {
  const svg = frEl('frCanvas');
  svg.addEventListener('pointerdown', ev => {
    const { X, Y } = frEventPoint(ev);
    if (frTool === 'member') {
      frDrag = { a: frSnap(X, Y), b: frSnap(X, Y), moved: false };
      svg.setPointerCapture(ev.pointerId);
      return;
    }
    let changed = false;
    if (frTool === 'support') {
      const n = frNearestNode(X, Y);
      if (n >= 0) {
        const k = frModel.supports.findIndex(s => s.node === n);
        const cur = k >= 0 ? frModel.supports[k].type : null;
        const nxt = FR_SUP_CYCLE[(FR_SUP_CYCLE.indexOf(cur) + 1) % FR_SUP_CYCLE.length];
        if (k >= 0) { if (nxt) frModel.supports[k].type = nxt; else frModel.supports.splice(k, 1); }
        else frModel.supports.push({ node: n, type: nxt });
        changed = true;
      }
    } else if (frTool === 'load') {
      const n = frNearestNode(X, Y);
      if (n >= 0) { frModel.loads.push({ node: n, Fx: 0, Fy: -10000, M: 0 }); changed = true; }
    } else if (frTool === 'dload') {
      const { i } = frNearestMember(X, Y);
      if (i >= 0) { frModel.dloads.push({ member: i, q: -10, dir: 'gy' }); changed = true; }
    } else if (frTool === 'hinge') {
      const { i, t } = frNearestMember(X, Y, 16);
      if (i >= 0) { const mm = frModel.members[i]; if (t < 0.5) mm.relStart = !mm.relStart; else mm.relEnd = !mm.relEnd; changed = true; }
    } else if (frTool === 'del') {
      const n = frNearestNode(X, Y);
      if (n >= 0) { frDeleteNode(n); changed = true; }
      else { const { i } = frNearestMember(X, Y); if (i >= 0) { frDeleteMember(i); changed = true; } }
    }
    if (changed) { frRenderTables(); calculateFrames(); }
  });
  svg.addEventListener('pointermove', ev => {
    const { X, Y } = frEventPoint(ev);
    if (frDrag) {
      const b = frSnap(X, Y);
      if (b.x !== frDrag.b.x || b.y !== frDrag.b.y) { frDrag.b = b; frDrag.moved = true; frDraw(); }
    } else if (frTool === 'member' && frPending) {
      frPending.hover = frSnap(X, Y); frDraw();
    }
  });
  svg.addEventListener('pointerup', ev => {
    if (!frDrag) return;
    const d = frDrag; frDrag = null;
    const same = Math.abs(d.a.x - d.b.x) < 1e-6 && Math.abs(d.a.y - d.b.y) < 1e-6;
    if (!same) { if (frAddMember(d.a, d.b)) { frPending = null; frRenderTables(); calculateFrames(); return; } }
    else if (frPending) {   // second click
      if (frAddMember(frPending, d.a)) { frPending = null; frRenderTables(); calculateFrames(); return; }
      frPending = null;
    } else frPending = { ...d.a };
    frDraw();
  });
  const tbl = ['frNodesTbl', 'frMembersTbl', 'frSupportsTbl', 'frLoadsTbl', 'frDloadsTbl'];
  tbl.forEach(id => { frEl(id).addEventListener('change', frTableEvent); frEl(id).addEventListener('click', frTableEvent); });
}

// ---- drawing ------------------------------------------------------------------------------------------
const FRC = { grid: '#334155', grid2: '#475569', str: '#e2e8f0', node: '#cbd5e1', sup: '#94a3b8', load: '#fbbf24', N: '#38bdf8', V: '#34d399', M: '#f43f5e', def: '#a855f7', ok: '#34d399', mid: '#fbbf24', bad: '#f43f5e' };

function frSupportSvg(p, type) {
  const { X, Y } = p, c = FRC.sup;
  if (type === 'fixed') return `<line x1="${X - 14}" y1="${Y + 1}" x2="${X + 14}" y2="${Y + 1}" stroke="${c}" stroke-width="3"/>` +
    [-12, -6, 0, 6, 12].map(d => `<line x1="${X + d}" y1="${Y + 2}" x2="${X + d - 6}" y2="${Y + 9}" stroke="${c}" stroke-width="1.2"/>`).join('');
  if (type === 'guide') return `<line x1="${X - 12}" y1="${Y + 3}" x2="${X + 12}" y2="${Y + 3}" stroke="${c}" stroke-width="2.5"/><circle cx="${X - 7}" cy="${Y + 8}" r="3" fill="none" stroke="${c}"/><circle cx="${X + 7}" cy="${Y + 8}" r="3" fill="none" stroke="${c}"/><line x1="${X - 14}" y1="${Y + 12}" x2="${X + 14}" y2="${Y + 12}" stroke="${c}"/>`;
  if (type === 'rollerY') return `<path d="M ${X} ${Y} L ${X - 13} ${Y - 8} L ${X - 13} ${Y + 8} Z" fill="none" stroke="${c}" stroke-width="1.6"/><circle cx="${X - 17}" cy="${Y - 4}" r="3" fill="none" stroke="${c}"/><circle cx="${X - 17}" cy="${Y + 4}" r="3" fill="none" stroke="${c}"/><line x1="${X - 21}" y1="${Y - 10}" x2="${X - 21}" y2="${Y + 10}" stroke="${c}"/>`;
  const tri = `<path d="M ${X} ${Y} L ${X - 9} ${Y + 13} L ${X + 9} ${Y + 13} Z" fill="none" stroke="${c}" stroke-width="1.6"/>`;
  if (type === 'rollerX') return tri + `<circle cx="${X - 5}" cy="${Y + 17}" r="3" fill="none" stroke="${c}"/><circle cx="${X + 5}" cy="${Y + 17}" r="3" fill="none" stroke="${c}"/><line x1="${X - 12}" y1="${Y + 21}" x2="${X + 12}" y2="${Y + 21}" stroke="${c}"/>`;
  return tri + `<line x1="${X - 12}" y1="${Y + 13}" x2="${X + 12}" y2="${Y + 13}" stroke="${c}" stroke-width="1.6"/>` + [-9, -3, 3, 9].map(d => `<line x1="${X + d}" y1="${Y + 14}" x2="${X + d - 5}" y2="${Y + 19}" stroke="${c}"/>`).join('');
}

function frArrow(x1, y1, x2, y2, color, w = 1.8) {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}"/><path d="M ${x2} ${y2} L ${x2 - h * Math.cos(a - 0.4)} ${y2 - h * Math.sin(a - 0.4)} L ${x2 - h * Math.cos(a + 0.4)} ${y2 - h * Math.sin(a + 0.4)} Z" fill="${color}"/>`;
}

function frDraw(target = null, opts = {}) {
  const svg = target || frEl('frCanvas');
  if (!svg || !frModel) return;
  const t = frT(), m = frModel, s = frScale();
  let g = '';
  // grid (only in the editor)
  if (!opts.print) {
    const step = frGrid * s >= 8 ? frGrid : frGrid * Math.ceil(8 / (frGrid * s));
    const a = frToModel(0, FR_H), b = frToModel(FR_W, 0);
    for (let x = Math.ceil(a.x / step) * step; x <= b.x; x += step) { const X = frToScreen({ x, y: 0 }).X; g += `<line x1="${X}" y1="0" x2="${X}" y2="${FR_H}" stroke="${Math.abs(x) < 1e-6 ? FRC.grid2 : FRC.grid}" stroke-width="${Math.abs(x) < 1e-6 ? 1 : 0.5}"/>`; }
    for (let y = Math.ceil(a.y / step) * step; y <= b.y; y += step) { const Y = frToScreen({ x: 0, y }).Y; g += `<line x1="0" y1="${Y}" x2="${FR_W}" y2="${Y}" stroke="${Math.abs(y) < 1e-6 ? FRC.grid2 : FRC.grid}" stroke-width="${Math.abs(y) < 1e-6 ? 1 : 0.5}"/>`; }
    g += `<text x="${FR_W - 8}" y="${FR_H - 8}" text-anchor="end" font-size="11" fill="${FRC.sup}">${t.grid} ${step} mm</text>`;
  }
  const sel = frResults && frSelFamily && frResults.byFamily[frSelFamily];
  const ev = sel && sel.ev && sel.ev.ok ? sel.ev : (frResults && frResults.base && frResults.base.ok ? frResults.base : null);
  // distributed loads
  m.dloads.forEach(d => {
    const mm = m.members[d.member]; if (!mm) return;
    const a = frToScreen(m.nodes[mm.n1]), b = frToScreen(m.nodes[mm.n2]);
    const L = Math.hypot(b.X - a.X, b.Y - a.Y) || 1, ux = (b.X - a.X) / L, uy = (b.Y - a.Y) / L;
    const P1 = m.nodes[mm.n1], P2 = m.nodes[mm.n2], Lm = Math.hypot(P2.x - P1.x, P2.y - P1.y) || 1;
    const sg = Math.sign(d.q || -1);
    const dm = d.dir === 'perp' ? { x: -sg * (P2.y - P1.y) / Lm, y: sg * (P2.x - P1.x) / Lm } : { x: 0, y: sg };   // model direction of the load
    const dx = dm.x, dy = -dm.y;   // screen direction
    const off = 26, n = Math.max(3, Math.round(L / 30));
    let pts = '';
    for (let k = 0; k <= n; k++) {
      const X = a.X + (b.X - a.X) * k / n, Y = a.Y + (b.Y - a.Y) * k / n;
      g += frArrow(X - dx * off, Y - dy * off, X - dx * 3, Y - dy * 3, FRC.load, 1);
      pts += `${X - dx * off},${Y - dy * off} `;
    }
    g += `<polyline points="${pts}" fill="none" stroke="${FRC.load}" stroke-width="1"/>`;
    g += `<text x="${(a.X + b.X) / 2 - dx * (off + 8)}" y="${(a.Y + b.Y) / 2 - dy * (off + 8) + 4}" text-anchor="middle" font-size="11" fill="${FRC.load}">${frNum(Math.abs(d.q), 1)} kN/m</text>`;
  });
  // results overlay
  let note = '';
  if (ev && frShow !== 'model') {
    const span = Math.max(frView.x1 - frView.x0, frView.y1 - frView.y0);
    if (frShow === 'def') {
      let umax = 0;
      ev.rows.forEach(r => r.sum.pts.forEach(p => { umax = Math.max(umax, Math.hypot(p.ua, p.w)); }));
      const k = umax > 0 ? 0.07 * span / umax : 0;
      ev.an.members.forEach((mr, i) => {
        const mm = m.members[i], p1 = m.nodes[mm.n1];
        const pts = ev.rows[i].sum.pts.map(p => {
          const lx = p.x + k * p.ua, ly = k * p.w;
          const P = frToScreen({ x: p1.x + lx * mr.c - ly * mr.s, y: p1.y + lx * mr.s + ly * mr.c });
          return `${P.X.toFixed(1)},${P.Y.toFixed(1)}`;
        }).join(' ');
        g += `<polyline points="${pts}" fill="none" stroke="${FRC.def}" stroke-width="2" stroke-dasharray="6 3"/>`;
      });
      note = `${t.views.def} · ${t.scale} ×${frNum(k, k < 10 ? 1 : 0)} · δmax = ${frNum(ev.dmax, 2)} mm`;
    } else if (['N', 'V', 'M'].includes(frShow)) {
      const key = frShow;
      let vmax = 0;
      ev.rows.forEach(r => r.sum.pts.forEach(p => { vmax = Math.max(vmax, Math.abs(p[key])); }));
      const k = vmax > 0 ? 0.09 * span / vmax : 0, col = FRC[key];
      ev.an.members.forEach((mr, i) => {
        const mm = m.members[i], p1 = m.nodes[mm.n1], pts = ev.rows[i].sum.pts;
        const sgn = key === 'M' ? -1 : 1;   // moment drawn on the tension side
        const poly = pts.map(p => { const o = sgn * k * p[key], P = frToScreen({ x: p1.x + p.x * mr.c - o * mr.s, y: p1.y + p.x * mr.s + o * mr.c }); return `${P.X.toFixed(1)},${P.Y.toFixed(1)}`; });
        const A = frToScreen(p1), B = frToScreen(m.nodes[mm.n2]);
        g += `<polygon points="${A.X},${A.Y} ${poly.join(' ')} ${B.X},${B.Y}" fill="${col}" fill-opacity="0.18" stroke="${col}" stroke-width="1.3"/>`;
        // label of the member extreme
        let pk = pts[0];
        pts.forEach(p => { if (Math.abs(p[key]) > Math.abs(pk[key])) pk = p; });
        if (Math.abs(pk[key]) > 0.02 * vmax) {
          const o = sgn * k * pk[key], P = frToScreen({ x: p1.x + pk.x * mr.c - o * mr.s, y: p1.y + pk.x * mr.s + o * mr.c });
          const v = key === 'M' ? pk[key] / 1e6 : pk[key] / 1000;
          g += `<text x="${P.X}" y="${P.Y - 4}" text-anchor="middle" font-size="10.5" fill="${col}" font-weight="600">${frNum(v, 2)}</text>`;
        }
      });
      note = `${t.views[key]} [${key === 'M' ? 'kN·m' : 'kN'}] · max ${frNum(vmax / (key === 'M' ? 1e6 : 1000), 2)}`;
    }
  }
  // members
  m.members.forEach((mm, i) => {
    const a = frToScreen(m.nodes[mm.n1]), b = frToScreen(m.nodes[mm.n2]);
    let col = FRC.str, w = 3;
    if (ev && frShow === 'util' && ev.rows[i]) { const u = ev.rows[i].chk.util; col = u > 1 + 1e-9 ? FRC.bad : u > 0.7 ? FRC.mid : FRC.ok; w = 4; }
    g += `<line x1="${a.X}" y1="${a.Y}" x2="${b.X}" y2="${b.Y}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
    const L = Math.hypot(b.X - a.X, b.Y - a.Y) || 1, ux = (b.X - a.X) / L, uy = (b.Y - a.Y) / L;
    if (mm.relStart) g += `<circle cx="${a.X + ux * 9}" cy="${a.Y + uy * 9}" r="4" fill="${opts.print ? 'white' : '#0b1210'}" stroke="${col}" stroke-width="1.6"/>`;
    if (mm.relEnd) g += `<circle cx="${b.X - ux * 9}" cy="${b.Y - uy * 9}" r="4" fill="${opts.print ? 'white' : '#0b1210'}" stroke="${col}" stroke-width="1.6"/>`;
    const lbl = ev && frShow === 'util' && ev.rows[i] ? `${Math.round(ev.rows[i].chk.util * 100)}%` : (sel && sel.secs ? sel.secs[i].name : `${i + 1}`);
    if (!opts.print || frShow === 'util' || sel) g += `<text x="${(a.X + b.X) / 2 - uy * 11}" y="${(a.Y + b.Y) / 2 + ux * 11 + 4}" text-anchor="middle" font-size="10.5" fill="${FRC.sup}">${reportEscSafe(lbl)}</text>`;
  });
  // supports, nodes, loads
  m.supports.forEach(sp => { const n = m.nodes[sp.node]; if (n) g += frSupportSvg(frToScreen(n), sp.type); });
  m.nodes.forEach((n, i) => { const p = frToScreen(n); g += `<circle cx="${p.X}" cy="${p.Y}" r="4" fill="${FRC.node}"/>` + (opts.print ? '' : `<text x="${p.X + 7}" y="${p.Y - 7}" font-size="10" fill="${FRC.sup}">${i + 1}</text>`); });
  const loadMax = Math.max(1, ...m.loads.map(l => Math.hypot(l.Fx || 0, l.Fy || 0)));
  m.loads.forEach(l => {
    const n = m.nodes[l.node]; if (!n) return;
    const p = frToScreen(n), F = Math.hypot(l.Fx || 0, l.Fy || 0);
    if (F > 0) {
      const len = 22 + 30 * F / loadMax, ux = (l.Fx || 0) / F, uy = -(l.Fy || 0) / F;
      g += frArrow(p.X - ux * len, p.Y - uy * len, p.X - ux * 5, p.Y - uy * 5, FRC.load, 2.2);
      g += `<text x="${p.X - ux * (len + 10)}" y="${p.Y - uy * (len + 10) + 4}" text-anchor="middle" font-size="11" fill="${FRC.load}" font-weight="600">${frNum(F / 1000, 1)} kN</text>`;
    }
    if (l.M) {
      const r = 15, dir = l.M > 0 ? 0 : 1;
      g += `<path d="M ${p.X + r} ${p.Y} A ${r} ${r} 0 1 ${dir} ${p.X} ${p.Y - r}" fill="none" stroke="${FRC.load}" stroke-width="1.8"/><text x="${p.X + r + 4}" y="${p.Y - r}" font-size="11" fill="${FRC.load}">${frNum(Math.abs(l.M) / 1e6, 1)} kN·m</text>`;
    }
  });
  // reactions in print/result views
  if (ev && opts.reactions) {
    ev.an.reactions.forEach(r => {
      const p = frToScreen(m.nodes[r.node]);
      if (Math.abs(r.Ry) > 1e-6) g += frArrow(p.X, p.Y + (r.Ry > 0 ? 58 : -58), p.X, p.Y + (r.Ry > 0 ? 30 : -30), FRC.N, 1.6) + `<text x="${p.X + 5}" y="${p.Y + (r.Ry > 0 ? 70 : -62)}" font-size="10.5" fill="${FRC.N}">${frNum(r.Ry / 1000, 1)} kN</text>`;
      if (Math.abs(r.Rx) > 1e-6) g += frArrow(p.X + (r.Rx > 0 ? -60 : 60), p.Y + 28, p.X + (r.Rx > 0 ? -28 : 28), p.Y + 28, FRC.N, 1.6) + `<text x="${p.X + (r.Rx > 0 ? -60 : 34)}" y="${p.Y + 42}" font-size="10.5" fill="${FRC.N}">${frNum(Math.abs(r.Rx) / 1000, 1)} kN</text>`;
    });
  }
  // member being drawn
  if (frDrag && frDrag.moved) { const a = frToScreen(frDrag.a), b = frToScreen(frDrag.b); g += `<line x1="${a.X}" y1="${a.Y}" x2="${b.X}" y2="${b.Y}" stroke="${FRC.N}" stroke-width="2.5" stroke-dasharray="6 4"/><circle cx="${b.X}" cy="${b.Y}" r="5" fill="none" stroke="${FRC.N}"/>`; }
  if (frPending) {
    const a = frToScreen(frPending);
    g += `<circle cx="${a.X}" cy="${a.Y}" r="6" fill="none" stroke="${FRC.N}" stroke-width="2"/>`;
    if (frPending.hover) { const b = frToScreen(frPending.hover); g += `<line x1="${a.X}" y1="${a.Y}" x2="${b.X}" y2="${b.Y}" stroke="${FRC.N}" stroke-width="2" stroke-dasharray="6 4"/>`; }
  }
  if (note) g += `<text x="10" y="18" font-size="12" fill="${FRC.str}" font-weight="600">${reportEscSafe(note)}</text>`;
  svg.innerHTML = g;
  const empty = frEl('frEmpty');
  if (empty && !target) empty.classList.toggle('hidden', m.members.length > 0);
}

function reportEscSafe(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ---- section drawings with the main dimensions ---------------------------------------------------------
function frSectionSvg(sec, bg = '#0f172a') {
  const W = 220, H = 200, d = sec.dims, c = '#e2e8f0', f = '#475569', q = '#fbbf24';
  let ext = 0;
  if (sec.family === 'round') ext = d.d; else if (sec.family === 'tube') ext = d.D; else if (sec.family === 'rect') ext = Math.max(d.b, d.h);
  else if (sec.family === 'box') ext = d.B; else ext = Math.max(d.h, d.b);
  const k = 120 / ext, cx = 105, cy = 95;
  const dim = (x1, y1, x2, y2, txt, tx, ty, anchor = 'middle') => frArrow(x1, y1, x2, y2, q, 0.9) + frArrow(x2, y2, x1, y1, q, 0.9) + `<text x="${tx}" y="${ty}" text-anchor="${anchor}" font-size="11" fill="${q}" font-weight="600">${txt}</text>`;
  let g = `<line x1="${cx - 75}" y1="${cy}" x2="${cx + 75}" y2="${cy}" stroke="#64748b" stroke-dasharray="8 3 2 3" stroke-width="0.6"/><line x1="${cx}" y1="${cy - 75}" x2="${cx}" y2="${cy + 75}" stroke="#64748b" stroke-dasharray="8 3 2 3" stroke-width="0.6"/>`;
  const fmt = v => (Math.round(v * 10) / 10).toString().replace('.', currentLang === 'it' ? ',' : '.');
  if (sec.family === 'round' || sec.family === 'tube') {
    const R = (sec.family === 'round' ? d.d : d.D) / 2 * k;
    g = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${f}" stroke="${c}" stroke-width="1.4"/>` + (sec.family === 'tube' ? `<circle cx="${cx}" cy="${cy}" r="${R - Math.max(d.t * k, 1.2)}" fill="${bg}" stroke="${c}" stroke-width="1.2"/>` : '') + g;
    g += dim(cx - R, cy + R + 14, cx + R, cy + R + 14, `Ø ${fmt(sec.family === 'round' ? d.d : d.D)}`, cx, cy + R + 28);
    if (sec.family === 'tube') g += `<text x="${cx + R * 0.72 + 6}" y="${cy - R * 0.72 - 4}" font-size="11" fill="${q}" font-weight="600">t = ${fmt(d.t)}</text>`;
  } else if (sec.family === 'rect' || sec.family === 'box') {
    const bw = (sec.family === 'rect' ? d.b : d.B) * k, bh = (sec.family === 'rect' ? d.h : d.B) * k;
    g = `<rect x="${cx - bw / 2}" y="${cy - bh / 2}" width="${bw}" height="${bh}" rx="${sec.family === 'box' ? 2 * d.t * k : 0}" fill="${f}" stroke="${c}" stroke-width="1.4"/>` +
      (sec.family === 'box' ? `<rect x="${cx - bw / 2 + d.t * k}" y="${cy - bh / 2 + d.t * k}" width="${bw - 2 * d.t * k}" height="${bh - 2 * d.t * k}" rx="${d.t * k}" fill="${bg}" stroke="${c}" stroke-width="1.1"/>` : '') + g;
    g += dim(cx - bw / 2, cy + bh / 2 + 14, cx + bw / 2, cy + bh / 2 + 14, fmt(sec.family === 'rect' ? d.b : d.B), cx, cy + bh / 2 + 28);
    g += dim(cx + bw / 2 + 14, cy - bh / 2, cx + bw / 2 + 14, cy + bh / 2, fmt(sec.family === 'rect' ? d.h : d.B), cx + bw / 2 + 20, cy + 4, 'start');
    if (sec.family === 'box') g += `<text x="${cx - bw / 2}" y="${cy - bh / 2 - 6}" font-size="11" fill="${q}" font-weight="600">t = ${fmt(d.t)}</text>`;
  } else {
    const h = d.h * k, b = d.b * k, tw = Math.max(d.tw * k, 1.2), tf = Math.max(d.tf * k, 1.2), r = d.r * k;
    const x0 = cx - b / 2, y0 = cy - h / 2;
    const path = `M ${x0} ${y0} H ${x0 + b} V ${y0 + tf} H ${cx + tw / 2 + r} A ${r} ${r} 0 0 0 ${cx + tw / 2} ${y0 + tf + r} V ${y0 + h - tf - r} A ${r} ${r} 0 0 0 ${cx + tw / 2 + r} ${y0 + h - tf} H ${x0 + b} V ${y0 + h} H ${x0} V ${y0 + h - tf} H ${cx - tw / 2 - r} A ${r} ${r} 0 0 0 ${cx - tw / 2} ${y0 + h - tf - r} V ${y0 + tf + r} A ${r} ${r} 0 0 0 ${cx - tw / 2 - r} ${y0 + tf} H ${x0} Z`;
    g = `<path d="${path}" fill="${f}" stroke="${c}" stroke-width="1.3"/>` + g;
    g += dim(x0, y0 + h + 14, x0 + b, y0 + h + 14, `b ${fmt(d.b)}`, cx, y0 + h + 28);
    g += dim(x0 + b + 14, y0, x0 + b + 14, y0 + h, `h ${fmt(d.h)}`, x0 + b + 20, cy + 4, 'start');
    g += `<text x="${x0 - 4}" y="${y0 + tf + 12}" text-anchor="end" font-size="10.5" fill="${q}">tf ${fmt(d.tf)}</text><text x="${cx + tw / 2 + 4}" y="${cy + 18}" font-size="10.5" fill="${q}">tw ${fmt(d.tw)}</text><text x="${x0 - 4}" y="${y0 + h - tf - 4}" text-anchor="end" font-size="10.5" fill="${q}">r ${fmt(d.r)}</text>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" class="w-full h-auto" font-family="Archivo, Arial, sans-serif">${g}</svg>`;
}

// ---- calculation --------------------------------------------------------------------------------------
function frReadMat() {
  const v = (id, d) => { const x = parseFloat(frEl(id)?.value); return Number.isFinite(x) ? x : d; };
  return { E: Math.max(1, v('frE', 210000)), sigmaS: Math.max(1, v('frSy', 235)), rho: Math.max(0, v('frRho', 7850)), X: Math.max(0.1, v('frX', 1.5)),
    Xb: Math.max(0.1, v('frXb', 2.5)), beta: Math.max(0.1, v('frBeta', 1)), deflMax: Math.max(0, v('frDefl', 0)) };
}

function frScheduleCalc() { clearTimeout(frCalcTimer); frCalcTimer = setTimeout(calculateFrames, 120); }

function calculateFrames() {
  frBuildStatic();
  if (!frModel) { frModel = frPreset('beam'); frFitView(); frRenderTables(); }
  frRelabelOnce();
  const mat = frReadMat(), mode = frEl('frMode').value || 'member';
  const fams = frFamiliesChecked(true);
  frResults = { byFamily: {}, best: null, mat, mode, fams, base: null, notebook: null, error: null };
  if (frModel.members.length) {
    // analysis with a reference section, for the diagrams when no family is feasible
    const ref = frSecRound(50);
    const base = frameEvaluate(frModel, frModel.members.map(() => ref), mat);
    frResults.base = base.ok ? base : null;
    if (!base.ok) frResults.error = base.reason;
    else {
      for (const f of fams) frResults.byFamily[f] = frameSize(frModel, f, mat, mode);
      const feas = fams.filter(f => frResults.byFamily[f].ok);
      frResults.best = feas.sort((a, b) => frResults.byFamily[a].mass - frResults.byFamily[b].mass)[0] || null;
      // the notebook comparison, for pure trusses (every member hinged at both ends, nodal loads only)
      if (frModel.members.every(mm => mm.relStart && mm.relEnd) && !frModel.dloads.length) {
        const sAmm = mat.sigmaS / mat.X;
        const nb = frameFSDContinuous(frModel, { E: mat.E, rho: mat.rho, sigmaAllow: sAmm, Amin: 500, Amax: 22600, Ainit: 4000, eta: 0.5, maxIter: 60, tol: 1e-4 });
        const nbB = frameFSDContinuous(frModel, { E: mat.E, rho: mat.rho, sigmaAllow: sAmm, Amin: 500, Amax: 22600, Ainit: 4000, eta: 0.5, maxIter: 120, tol: 1e-4, buckling: 0.8 });
        if (nb.ok) frResults.notebook = { ...nb, sAmm, nInst: nb.sigma.filter((sg, i) => sg < 0 && -sg > nb.sigCr[i]).length,
          buck: nbB.ok ? nbB : null, tower: frIsNotebookTower() && Math.abs(mat.E - 70000) < 1 && Math.abs(sAmm - 170) < 0.5 && Math.abs(mat.rho - 2770) < 1 };
      }
    }
  } else frResults.error = 'empty';
  if (!frSelFamily || !frResults.byFamily[frSelFamily] || !frResults.byFamily[frSelFamily].ok) frSelFamily = frResults.best || fams[0] || null;
  frRenderResults();
  frDraw();
}

let frLabelLang = null;
function frRelabelOnce() { if (frLabelLang !== currentLang) { frLabelLang = currentLang; frRelabel(); frRenderTables(); } }

function frRenderResults() {
  const t = frT(), R = frResults;
  if (!R) return;
  const best = R.best ? R.byFamily[R.best] : null;
  if (R.error) {
    frEl('frBest').innerHTML = `<p class="text-sm text-amber-300">${t.reasons[R.error] || R.error}</p>`;
    ['frCmp', 'frNb', 'frSecs', 'frMemTbl', 'frReacTbl'].forEach(id => { frEl(id).innerHTML = ''; });
    frEl('frMemT').textContent = t.memTitle;
    return;
  }
  const round = R.byFamily.round && R.byFamily.round.ok ? R.byFamily.round : null;
  frEl('frBest').innerHTML = best
    ? `<div class="flex flex-wrap items-baseline gap-x-4 gap-y-1"><span class="text-2xl font-bold text-white">${t.fam[R.best]}</span><span class="text-lg text-blue-300 font-semibold">${frNum(best.mass, 1)} kg</span>` +
      (round && R.best !== 'round' ? `<span class="text-sm text-slate-300">${t.saving} ${frNum((1 - best.mass / round.mass) * 100, 0)} % ${t.vsRound}</span>` : '') + `</div>`
    : `<p class="text-sm text-amber-300">${t.ko}</p>`;
  const rows = R.fams.map(f => {
    const z = R.byFamily[f];
    if (!z) return '';
    const evz = z.ev && z.ev.ok ? z.ev : null;
    const names = z.secs ? [...new Set(z.secs.map(s => s.name))] : [];
    const Xmin = evz ? Math.min(...evz.rows.map(r => r.chk.Xs)) : NaN, Xb = evz ? Math.min(...evz.rows.map(r => r.chk.Xb)) : NaN;
    const why = z.ok ? '' : (t.reasons[z.reason] || z.reason || '').replace('{m}', (z.member ?? 0) + 1);
    const selCls = f === frSelFamily ? 'bg-blue-600/15' : 'hover:bg-slate-800/60';
    return `<tr data-fam="${f}" class="cursor-pointer border-t border-slate-700/60 ${selCls}"><td class="py-1.5 pr-2 font-semibold text-white">${t.fam[f]}${f === R.best ? ` <span class="text-[10px] text-blue-300">(${t.best})</span>` : ''}</td>` +
      `<td class="pr-2 text-slate-300">${names.length > 4 ? names.slice(0, 4).join(', ') + '…' : names.join(', ') || '—'}</td><td class="pr-2 text-white">${z.mass ? frNum(z.mass, 1) + ' kg' : '—'}</td>` +
      `<td class="pr-2">${frNum(Xmin, 2)}</td><td class="pr-2">${Number.isFinite(Xb) ? frNum(Xb, 2) : '∞'}</td><td class="pr-2">${evz ? frNum(evz.dmax, 1) + ' mm' : '—'}</td>` +
      `<td class="${z.ok ? 'text-emerald-400' : 'text-amber-300'}">${z.ok ? t.ok : t.ko}${why ? `<div class="text-[10px] text-slate-400">${why}</div>` : ''}</td></tr>`;
  }).join('');
  frEl('frCmp').innerHTML = `<thead><tr class="text-slate-400"><th class="pb-1 pr-2">${t.family}</th><th class="pr-2">${t.sections}</th><th class="pr-2">${t.mass}</th><th class="pr-2">${t.Xmin}</th><th class="pr-2">${t.Xbmin}</th><th class="pr-2">${t.dmax}</th><th>${t.status}</th></tr></thead><tbody>${rows}</tbody>`;
  // notebook comparison
  const nb = R.notebook;
  frEl('frNb').innerHTML = nb ? `<div class="text-xs text-slate-300 border-l-2 border-amber-400 pl-3"><b class="text-white">${t.nbTitle}</b>` +
    frTable(t.nbCols, frNotebookRows(R, t, frNum).map(r => `<tr class="border-t border-slate-700/50"><td class="py-1 pr-2">${r[0]}</td><td class="pr-2 text-white font-semibold">${r[1]}</td><td>${r[2]}</td></tr>`)) + `</div>` : '';
  // section drawings
  frEl('frSecs').innerHTML = R.fams.map(f => {
    const z = R.byFamily[f];
    if (!z || !z.secs) return '';
    const big = z.secs.reduce((a, b) => b.A > a.A ? b : a);
    return `<div class="rounded-lg border ${f === R.best ? 'border-blue-500/50' : 'border-slate-700'} bg-slate-900/60 p-2"><div class="text-xs font-semibold text-white">${t.fam[f]} · ${big.name}</div>` +
      `<div class="text-[11px] text-slate-400">A = ${frNum(big.A / 100, 2)} cm² · Iy = ${frNum(big.Iy / 1e4, 1)} cm⁴ · ${frNum(R.mat.rho * big.A * 1e-6, 2)} kg/m</div>${frSectionSvg(big)}</div>`;
  }).join('');
  // members of the selected family
  const z = frSelFamily ? R.byFamily[frSelFamily] : null, evz = z && z.ev && z.ev.ok ? z.ev : null;
  frEl('frMemT').textContent = `${t.memTitle} ${frSelFamily ? t.fam[frSelFamily] : ''}`;
  frEl('frMemTbl').innerHTML = evz ? frTable(['#', t.colSec, t.colL, t.colN, t.colM, t.colS, t.colX, t.colXb, t.colU], evz.rows.map(r => {
    const Nc = Math.abs(r.sum.Nmin) > Math.abs(r.sum.Nmax) ? r.sum.Nmin : r.sum.Nmax, u = r.chk.util;
    return `<tr class="border-t border-slate-700/50"><td class="py-1 pr-2 text-slate-400">${r.i + 1}</td><td class="pr-2 text-white">${r.sec.name}</td><td class="pr-2">${frNum(r.L, 0)}</td><td class="pr-2">${frNum(Nc / 1000, 2)}</td>` +
      `<td class="pr-2">${frNum(r.sum.Mabs / 1e6, 2)}</td><td class="pr-2">${frNum(r.chk.sigma, 1)}</td><td class="pr-2">${frNum(r.chk.Xs, 2)}</td><td class="pr-2">${Number.isFinite(r.chk.Xb) ? frNum(r.chk.Xb, 2) : '—'}</td>` +
      `<td class="${u > 1 + 1e-9 ? 'text-rose-400' : u > 0.7 ? 'text-amber-300' : 'text-emerald-400'}">${frNum(u * 100, 0)} %</td></tr>`;
  })) : '';
  const evr = evz || R.base;
  frEl('frReacTbl').innerHTML = evr ? frTable([t.node, t.type, t.colRx, t.colRy, t.colRM], evr.an.reactions.map(r =>
    `<tr class="border-t border-slate-700/50"><td class="py-1 pr-2">${r.node + 1}</td><td class="pr-2">${t.sup[r.type]}</td><td class="pr-2">${frNum(r.Rx / 1000, 2)}</td><td class="pr-2">${frNum(r.Ry / 1000, 2)}</td><td>${frNum(r.M / 1e6, 2)}</td></tr>`)) : '';
}

// Rows of the notebook comparison: [method, mass, note]
const FR_NB_GRADIENT_KG = 1453.59;   // Luigi's notebook, gradient method on the radio tower (scipy L-BFGS-B), as printed by the notebook
function frNotebookRows(R, t, num) {
  const nb = R.notebook, rows = [];
  if (!nb) return rows;
  rows.push([t.nbRows.fsd, `${num(nb.W, 1)} kg`, nb.nInst ? t.nbUnstable(nb.nInst) : t.nbAllOk]);
  if (nb.buck) rows.push([t.nbRows.fsdB, `${num(nb.buck.W, 1)} kg`, t.nbAllOk]);
  if (nb.tower) rows.push([t.nbRows.grad, `${num(FR_NB_GRADIENT_KG, 1)} kg`, t.nbGradNote]);
  if (R.best) rows.push([t.nbRows.cat, `${num(R.byFamily[R.best].mass, 1)} kg`, t.nbCatNote(t.fam[R.best])]);
  return rows;
}
function frIsNotebookTower() {
  const p = frPreset('tower'), m = frModel;
  const key = o => JSON.stringify({ n: o.nodes.map(n => [n.x, n.y]), m: o.members.map(mm => [mm.n1, mm.n2, !!mm.relStart, !!mm.relEnd]), s: o.supports.map(s => [s.node, s.type]),
    l: o.loads.map(l => [l.node, l.Fx || 0, l.Fy || 0, l.M || 0]), d: o.dloads.length });
  return key(p) === key(m);
}

// ---- share link: the whole model in one compact parameter ------------------------------------------------
function frEncodeModel() {
  if (!frModel) return '';
  const r = v => Math.round(v * 1000) / 1000;
  const o = { n: frModel.nodes.map(n => [r(n.x), r(n.y)]), m: frModel.members.map(mm => [mm.n1, mm.n2, (mm.relStart ? 1 : 0) + (mm.relEnd ? 2 : 0)]),
    s: frModel.supports.map(s => [s.node, s.type]), l: frModel.loads.map(l => [l.node, r(l.Fx || 0), r(l.Fy || 0), r(l.M || 0)]), d: frModel.dloads.map(d => [d.member, r(d.q), d.dir === 'perp' ? 1 : 0]),
    g: frGrid, v: frShow, f: frFamiliesChecked(true).join(',') };
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); } catch (e) { return ''; }
}
function frDecodeModel(str) {
  try {
    const o = JSON.parse(decodeURIComponent(escape(atob(str.replace(/-/g, '+').replace(/_/g, '/')))));
    const num = v => (Number.isFinite(+v) ? +v : 0);
    const nodes = (o.n || []).slice(0, 400).map(([x, y]) => ({ x: num(x), y: num(y) }));
    const ok = i => Number.isInteger(i) && i >= 0 && i < nodes.length;
    const members = (o.m || []).slice(0, 800).filter(([a, b]) => ok(a) && ok(b) && a !== b).map(([a, b, rl]) => ({ n1: a, n2: b, relStart: !!(rl & 1), relEnd: !!(rl & 2) }));
    const model = { nodes, members,
      supports: (o.s || []).filter(([n, tp]) => ok(n) && FR_SUPPORTS[tp]).map(([n, tp]) => ({ node: n, type: tp })),
      loads: (o.l || []).filter(([n]) => ok(n)).map(([n, fx, fy, mz]) => ({ node: n, Fx: num(fx), Fy: num(fy), M: num(mz) })),
      dloads: (o.d || []).filter(([k]) => Number.isInteger(k) && k >= 0 && k < members.length).map(([k, q, p]) => ({ member: k, q: num(q), dir: p ? 'perp' : 'gy' })) };
    frModel = model;
    if (o.g > 0) frGrid = +o.g;
    if (o.v && FR_TXT.en.views[o.v]) frShow = o.v;
    frBuildStatic();
    frEl('frGrid').value = frGrid;
    if (typeof o.f === 'string') { frLabelLang = null; frRelabelOnce(); document.querySelectorAll('#frFams input').forEach(b => { b.checked = o.f.split(',').includes(b.value); }); }
    frFitView();
    frRenderTables();
    return true;
  } catch (e) { return false; }
}
