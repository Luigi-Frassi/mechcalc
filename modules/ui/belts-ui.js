/**
 * belts-ui.js - View Layer & SVG Visualization for Timing Belts
 * Consumes pure analytical data from belts-core.js
 */
import { calculateTimingBelt } from '../core/belts-core.js';

export function renderBeltsModule(containerId, inputParams) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const data = calculateTimingBelt(inputParams);

  container.innerHTML = `
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-100">
      <div class="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
        <div>
          <h3 class="text-lg font-bold text-emerald-400">Timing Belt Drive (${data.profile})</h3>
          <span class="text-xs text-slate-400">Pitch: ${data.pitch} mm | Ratio: ${data.pulleys.ratio.toFixed(2)}:1</span>
        </div>
        <span class="px-2.5 py-1 text-xs rounded-full font-semibold ${data.kinematics.isUndermeshed ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">
          ${data.kinematics.teethInMesh} Teeth in Mesh
        </span>
      </div>

      <!-- Schede Dati Numerici -->
      <div class="grid grid-cols-3 gap-3 mb-4 text-xs font-mono">
        <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span class="text-slate-400">Pitch Diameters</span>
          <div class="text-sm font-bold text-sky-300 mt-1">
            Ø${data.pulleys.driver.pitchDiameter.toFixed(1)} / Ø${data.pulleys.driven.pitchDiameter.toFixed(1)} mm
          </div>
        </div>

        <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span class="text-slate-400">Standard Belt (zb)</span>
          <div class="text-sm font-bold text-amber-300 mt-1">
            ${data.belt.teethCount} teeth (${data.belt.pitchLength.toFixed(0)} mm)
          </div>
        </div>

        <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span class="text-slate-400">Exact Center Dist. (C)</span>
          <div class="text-sm font-bold text-emerald-300 mt-1">
            ${data.belt.exactCenterDistance.toFixed(2)} mm
          </div>
        </div>
      </div>

      <!-- Renderer Dinamico SVG -->
      <div class="w-full bg-slate-950 rounded-lg p-3 border border-slate-800 flex justify-center overflow-hidden">
        ${renderBeltPathSVG(data)}
      </div>
    </div>
  `;
}

function renderBeltPathSVG(data) {
  const d1 = data.pulleys.driver.pitchDiameter;
  const d2 = data.pulleys.driven.pitchDiameter;
  const a = data.belt.exactCenterDistance;

  // Scala grafica di adattamento per far rientrare la trasmissione in un box 380x160
  const maxSpan = a + (d1 + d2) / 2;
  const svgScale = 300 / Math.max(maxSpan, 1);

  const r1 = Math.max(12, (d1 / 2) * svgScale);
  const r2 = Math.max(12, (d2 / 2) * svgScale);
  const cDist = Math.max(60, a * svgScale);

  const cx1 = 40 + r1;
  const cy1 = 80;
  const cx2 = cx1 + cDist;
  const cy2 = 80;

  return `
    <svg width="400" height="160" viewBox="0 0 400 160" class="font-mono text-[10px]">
      <!-- Linea d'asse interasse -->
      <line x1="${cx1}" y1="${cy1}" x2="${cx2}" y2="${cy2}" stroke="#475569" stroke-dasharray="3 3" stroke-width="1.2"/>
      
      <!-- Cinghia (Ramo teso e molle stilizzato) -->
      <line x1="${cx1}" y1="${cy1 - r1}" x2="${cx2}" y2="${cy2 - r2}" stroke="#10b981" stroke-width="3"/>
      <line x1="${cx1}" y1="${cy1 + r1}" x2="${cx2}" y2="${cy2 + r2}" stroke="#10b981" stroke-width="3"/>

      <!-- Puleggia 1 -->
      <circle cx="${cx1}" cy="${cy1}" r="${r1}" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5"/>
      <circle cx="${cx1}" cy="${cy1}" r="3" fill="#38bdf8"/>
      <text x="${cx1}" y="${cy1 + r1 + 14}" fill="#94a3b8" text-anchor="middle">z1=${data.pulleys.driver.teeth}</text>

      <!-- Puleggia 2 -->
      <circle cx="${cx2}" cy="${cy2}" r="${r2}" fill="#0f172a" stroke="#fbbf24" stroke-width="2.5"/>
      <circle cx="${cx2}" cy="${cy2}" r="3" fill="#fbbf24"/>
      <text x="${cx2}" y="${cy2 + r2 + 14}" fill="#94a3b8" text-anchor="middle">z2=${data.pulleys.driven.teeth}</text>
    </svg>
  `;
}
