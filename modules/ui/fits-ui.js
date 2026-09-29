/**
 * fits-ui.js - View Layer & SVG Visualization for Fits Module
 * Consumes pure analytical data from fits-core.js
 */
import { calculateFit } from '../core/fits-core.js';

export function renderFitsModule(containerId, initialD = 30, initialShaft = 'k6') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Calcola i risultati matematici tramite il Core headless
  const data = calculateFit(initialD, 'H7', initialShaft);

  // Genera la vista grafica
  container.innerHTML = `
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-100">
      <div class="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
        <h3 class="text-lg font-bold text-teal-400">ISO 286 Fits & Tolerance Zone</h3>
        <span class="px-2.5 py-1 text-xs rounded-full font-semibold ${getBadgeColor(data.clearance.type)}">
          ${data.clearance.type} Fit
        </span>
      </div>

      <!-- Risultati Numerici -->
      <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div class="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <div class="text-xs text-slate-400 font-mono">Hole H7 (Base)</div>
          <div class="text-base font-bold text-amber-300">
            ${data.hole.nominal.toFixed(3)} 
            <span class="text-xs text-slate-400">+${data.hole.es}/+${data.hole.ei} µm</span>
          </div>
          <div class="text-xs text-slate-500">Ø ${data.hole.min.toFixed(3)} - ${data.hole.max.toFixed(3)} mm</div>
        </div>

        <div class="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <div class="text-xs text-slate-400 font-mono">Shaft ${initialShaft}</div>
          <div class="text-base font-bold text-sky-300">
            ${data.shaft.nominal.toFixed(3)} 
            <span class="text-xs text-slate-400">${data.shaft.es >= 0 ? '+' : ''}${data.shaft.es}/${data.shaft.ei >= 0 ? '+' : ''}${data.shaft.ei} µm</span>
          </div>
          <div class="text-xs text-slate-500">Ø ${data.shaft.min.toFixed(3)} - ${data.shaft.max.toFixed(3)} mm</div>
        </div>
      </div>

      <!-- Renderer SVG -->
      <div class="w-full bg-slate-950 rounded-lg p-3 border border-slate-800 flex justify-center">
        ${renderToleranceSVG(data)}
      </div>
    </div>
  `;
}

function getBadgeColor(type) {
  if (type === 'Clearance') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  if (type === 'Interference') return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
  return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
}

function renderToleranceSVG(data) {
  const zeroY = 90;
  const scale = 1.2; // 1 µm = 1.2 px

  const holeY = zeroY - (data.hole.es * scale);
  const holeH = (data.hole.es - data.hole.ei) * scale;

  const shaftY = zeroY - (data.shaft.es * scale);
  const shaftH = Math.max(8, (data.shaft.es - data.shaft.ei) * scale);

  return `
    <svg width="340" height="180" viewBox="0 0 340 180" class="overflow-visible font-mono text-xs">
      <!-- Linea dello Zero -->
      <line x1="20" y1="${zeroY}" x2="320" y2="${zeroY}" stroke="#64748b" stroke-dasharray="4 4" stroke-width="1.5"/>
      <text x="25" y="${zeroY - 6}" fill="#94a3b8" font-size="10">Zero Line (Nominal Ø)</text>

      <!-- Zona Foro (H7) -->
      <rect x="100" y="${holeY}" width="50" height="${holeH}" fill="#fbbf24" fill-opacity="0.25" stroke="#f59e0b" stroke-width="2" rx="4"/>
      <text x="125" y="${holeY - 8}" fill="#f59e0b" text-anchor="middle" font-weight="bold">H7</text>

      <!-- Zona Albero -->
      <rect x="190" y="${shaftY}" width="50" height="${shaftH}" fill="#38bdf8" fill-opacity="0.25" stroke="#0ea5e9" stroke-width="2" rx="4"/>
      <text x="215" y="${shaftY - 8}" fill="#38bdf8" text-anchor="middle" font-weight="bold">Shaft</text>
    </svg>
  `;
}
