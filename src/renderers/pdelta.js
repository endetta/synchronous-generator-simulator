// src/renderers/pdelta.js
// SVG P-δ curve renderer with Equal Area Criterion shading.
// Renders the sinusoidal power-angle curve Pe = Pmax*sin(δ),
// current operating point, and EAC areas (A1, A2) when available.

const VIEWBOX_W = 360;
const VIEWBOX_H = 200;
const PADDING = { left: 30, right: 20, top: 20, bottom: 30 };

// Convert (delta, Pe) in physical units to SVG coordinates.
function toSvg(delta, pe, scaleX, scaleY) {
  return {
    x: PADDING.left + delta * scaleX,
    y: PADDING.top + (VIEWBOX_H - PADDING.top - PADDING.bottom) * (1 - pe / (scaleY > 0 ? scaleY * 1.0 : 1)),
  };
}

// Render the P-δ curve into the SVG element.
// state: { delta, Pe, Pm, deltaCC?, ... }
// params: { Pmax, deltaMax? }
export function renderPDelta(svg, state, params) {
  const { delta, Pe, Pm, deltaCC = 0 } = state;
  const { Pmax = 2.0, deltaMax = Math.PI } = params;

  const plotW = VIEWBOX_W - PADDING.left - PADDING.right;
  const plotH = VIEWBOX_H - PADDING.top - PADDING.bottom;
  const scaleX = plotW / deltaMax;
  const scaleY = plotH / (Pmax * 1.1);

  svg.innerHTML = '';

  // Draw axes
  svg.innerHTML += `<line x1="${PADDING.left}" y1="${VIEWBOX_H - PADDING.bottom}" x2="${VIEWBOX_W - PADDING.right}" y2="${VIEWBOX_H - PADDING.bottom}" stroke="black" stroke-width="1"/>`;
  svg.innerHTML += `<line x1="${PADDING.left}" y1="${PADDING.top}" x2="${PADDING.left}" y2="${VIEWBOX_H - PADDING.bottom}" stroke="black" stroke-width="1"/>`;

  // Build sinusoidal curve path
  const N = 100;
  let pathD = '';
  for (let i = 0; i <= N; i++) {
    const d = (deltaMax * i) / N;
    const p = Pmax * Math.sin(d);
    const svg_x = PADDING.left + d * scaleX;
    const svg_y = PADDING.top + plotH * (1 - p / (Pmax * 1.1));
    pathD += (i === 0 ? 'M' : 'L') + svg_x.toFixed(2) + ',' + svg_y.toFixed(2) + ' ';
  }
  svg.innerHTML += `<path d="${pathD}" fill="none" stroke="blue" stroke-width="2"/>`;

  // Draw Pm horizontal line
  if (Pm !== undefined) {
    const pmY = PADDING.top + plotH * (1 - Pm / (Pmax * 1.1));
    svg.innerHTML += `<line x1="${PADDING.left}" y1="${pmY.toFixed(2)}" x2="${VIEWBOX_W - PADDING.right}" y2="${pmY.toFixed(2)}" stroke="green" stroke-width="1" stroke-dasharray="4,2"/>`;
    svg.innerHTML += `<text x="${VIEWBOX_W - PADDING.right - 25}" y="${(pmY - 3).toFixed(2)}" fill="green" font-size="10">Pm</text>`;
  }

  // Draw current operating point
  const pointX = PADDING.left + delta * scaleX;
  const pointY = PADDING.top + plotH * (1 - Pe / (Pmax * 1.1));
  svg.innerHTML += `<circle cx="${pointX.toFixed(2)}" cy="${pointY.toFixed(2)}" r="4" fill="red"/>`;

  // Draw EAC shading if deltaCC is provided and > 0
  if (deltaCC > 0 && deltaCC < deltaMax) {
    const ccX = PADDING.left + deltaCC * scaleX;
    // A1 shading: from 0 to deltaCC, between Pm and curve
    const a1Path = `M${PADDING.left},${pmY} ` +
      `L${ccX.toFixed(2)},${pmY} ` +
      `L${ccX.toFixed(2)},${(PADDING.top + plotH * (1 - Pmax * Math.sin(deltaCC) / (Pmax * 1.1))).toFixed(2)} ` +
      `Z`;
    svg.innerHTML += `<path d="${a1Path}" fill="rgba(255,100,0,0.3)"/>`;
  }

  // Axis labels
  svg.innerHTML += `<text x="${VIEWBOX_W / 2}" y="${VIEWBOX_H - 5}" fill="black" font-size="10" text-anchor="middle">δ (rad)</text>`;
  svg.innerHTML += `<text x="5" y="${VIEWBOX_H / 2}" fill="black" font-size="10" text-anchor="middle" transform="rotate(-90, 10, ${VIEWBOX_H / 2})">Pe (pu)</text>`;

  // Tick marks on x-axis (0, π/2, π)
  const ticks = [
    { d: 0, label: '0' },
    { d: Math.PI / 2, label: 'π/2' },
    { d: Math.PI, label: 'π' },
  ];
  ticks.forEach(({ d, label }) => {
    const x = PADDING.left + d * scaleX;
    svg.innerHTML += `<line x1="${x}" y1="${VIEWBOX_H - PADDING.bottom}" x2="${x}" y2="${VIEWBOX_H - PADDING.bottom + 3}" stroke="black"/>`;
    svg.innerHTML += `<text x="${x}" y="${VIEWBOX_H - PADDING.bottom + 12}" fill="black" font-size="9" text-anchor="middle">${label}</text>`;
  });

  return svg.innerHTML;
}
