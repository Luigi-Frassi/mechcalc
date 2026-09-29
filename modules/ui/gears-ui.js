/**
 * gears-ui.js - View Layer & SVG Visualization for Gear Synthesis
 * Pure presentation: consumes analytical data from gears-core.js
 */
import { calculateGearPair } from '../core/gears-core.js';

export function renderGearsModule(containerId, inputParams) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const data = calculateGearPair(inputParams);

  container.innerHTML = `
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-100">
      <div class="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
        <div>
          <h3 class="text-lg font-bold text-sky-400">Cylindrical Gear Synthesis</h3>
          <span class="text-xs text-slate-400">mn = ${data.module.toFixed(2)} mm | Helix β = ${data.helixAngleDeg.toFixed(2)}°</span>
        </div>
        <span class="px-2.5 py-1 text-xs rounded-full font-semibold ${data.stress.isBendingSafe ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}">
          ${data.stress.isBendingSafe ? 'Strength Verified (Lewis OK)' : 'Overstress Warning'}
        </span>
      </div>

      <!-- Notifiche e Warning Serie 3 -->
      ${data.warnings.isSeries3Warning ? `
        <div class="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
          ⚠️ ${data.warnings.message}
        </div>
      ` : ''}

      <!-- Metriche di Sintesi -->
      <div class="grid grid-cols-4 gap-2 mb-4 text-xs font-mono">
        <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <div class="text-slate-400">Teeth (z1 / z2)</div>
          <div class="text-sm font-bold text-sky-300 mt-1">${data.teeth.z1} / ${data.teeth.z2}</div>
          <div class="text-[10px] text-slate-500">z_min = ${data.teeth.zMin}</div>
        </div>

        <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <div class="text-slate-400">Pitch Diameters</div>
          <div class="text-sm font-bold text-amber-300 mt-1">Ø${data.pitchDiameters.d1.toFixed(1)} / Ø${data.pitchDiameters.d2.toFixed(1)}</div>
          <div class="text-[10px] text-slate-500">Face Width b = ${data.faceWidth.toFixed(0)} mm</div>
        </div>

        <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <div class="text-slate-400">Center Dist. (a)</div>
          <div class="text-sm font-bold text-emerald-300 mt-1">${data.centerDistance.toFixed(2)} mm</div>
          <div class="text-[10px] text-slate-500">${data.isLockedCenterActive ? 'Locked (Closed on β)' : 'Spur Nominal'}</div>
        </div>

        <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <div class="text-slate-400">Tooth Root Bending</div>
          <div class="text-sm font-bold ${data.stress.isBendingSafe ? 'text-emerald-300' : 'text-rose-400'} mt-1">
            ${data.stress.sigmaBendingMPa.toFixed(1)} MPa
          </div>
          <div class="text-[10px] text-slate-500">Limit: ${data.stress.sigmaLimitMPa} MPa</div>
        </div>
      </div>

      <!-- Renderer Dinamico Ingranaggi SVG -->
      <div class="w-full bg-slate-950 rounded-lg p-3 border border-slate-800 flex justify-center overflow-hidden">
        ${renderGearsSVG(data)}
      </div>
    </div>
  `;
}

function renderGearsSVG(data) {
  const d1 = data.pitchDiameters.d1;
  const d2 = data.pitchDiameters.d2;
  const a = data.centerDistance;

  // Adattamento scala in viewBox 380x180
  const totalSpan = (d1 + d2) * 1.15;
  const scale = 280 / Math.max(totalSpan, 1);

  const r1 = Math.max(12, (d1 / 2) * scale);
  const r2 = Math.max(12, (d2 / 2) * scale);
  const dist = a * scale;

  const cx1 = 70 + r1;
  const cy1 = 90;
  const cx2 = cx1 + dist;
  const cy2 = 90;

  return `
    <svg width="400" height="180" viewBox="0 0 400 180" class="font-mono text-[10px]">
      <!-- Linea d'asse -->
      <line x1="${cx1}" y1="${cy1}" x2="${cx2}" y2="${cy2}" stroke="#475569" stroke-dasharray="3 3" stroke-width="1.2"/>

      <!-- Pignone (Driver) -->
      <circle cx="${cx1}" cy="${cy1}" r="${r1}" fill="#0284c7" fill-opacity="0.1" stroke="#38bdf8" stroke-width="2"/>
      <circle cx="${cx1}" cy="${cy1}" r="${r1 * 0.85}" fill="none" stroke="#0369a1" stroke-dasharray="2 2" stroke-width="1"/>
      <circle cx="${cx1}" cy="${cy1}" r="3" fill="#38bdf8"/>
      <text x="${cx1}" y="${cy1 + r1 + 14}" fill="#94a3b8" text-anchor="middle">Pinion (z1=${data.teeth.z1})</text>

      <!-- Ruota (Driven) -->
      <circle cx="${cx2}" cy="${cy2}" r="${r2}" fill="#d97706" fill-opacity="0.1" stroke="#fbbf24" stroke-width="2"/>
      <circle cx="${cx2}" cy="${cy2}" r="${r2 * 0.92}" fill="none" stroke="#b45309" stroke-dasharray="2 2" stroke-width="1"/>
      <circle cx="${cx2}" cy="${cy2}" r="3" fill="#fbbf24"/>
      <text x="${cx2}" y="${cy2 + r2 + 14}" fill="#94a3b8" text-anchor="middle">Wheel (z2=${data.teeth.z2})</text>

      <!-- Punto di contatto primitivo -->
      <circle cx="${cx1 + r1}" cy="${cy1}" r="4" fill="#10b981"/>
    </svg>
  `;
}
