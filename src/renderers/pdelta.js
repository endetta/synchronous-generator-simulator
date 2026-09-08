// src/renderers/pdelta.js
// SVG P-δ curve renderer with Equal Area Criterion shading.
// Renders the sinusoidal power-angle curve Pe = Pmax*sin(δ),
// current operating point, and EAC areas (A1, A2) when available.
// Now with real-time visual feedback and animated operating point.

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
// state: { delta, Pe, Pm, deltaCC?, running, stabilityMargin }
// params: { Pmax, deltaMax? }
export function renderPDelta(svg, state, params) {
  const { delta, Pe, Pm, deltaCC = 0, running, stabilityMargin = 0 } = state;
  const { Pmax = 2.0, deltaMax = Math.PI } = params;

  const plotW = VIEWBOX_W - PADDING.left - PADDING.right;
  const plotH = VIEWBOX_H - PADDING.top - PADDING.bottom;
  const scaleX = plotW / deltaMax;
  const scaleY = plotH / (Pmax * 1.1);

  svg.innerHTML = '';

  // Draw grid lines for better visualization
  const gridColor = '#F0F0F0';
  for (let i = 0; i <= 10; i++) {
    const x = PADDING.left + (plotW * i) / 10;
    const y = PADDING.top + (plotH * i) / 10;
    svg.innerHTML += `<line x1="${x}" y1="${PADDING.top}" x2="${x}" y2="${VIEWBOX_H - PADDING.bottom}" stroke="${gridColor}" stroke-width="0.5"/>`;
    svg.innerHTML += `<line x1="${PADDING.left}" y1="${y}" x2="${VIEWBOX_W - PADDING.right}" y2="${y}" stroke="${gridColor}" stroke-width="0.5"/>`;
  }

  // Draw axes
  svg.innerHTML += `<line x1="${PADDING.left}" y1="${VIEWBOX_H - PADDING.bottom}" x2="${VIEWBOX_W - PADDING.right}" y2="${VIEWBOX_H - PADDING.bottom}" stroke="#24292E" stroke-width="1.5"/>`;
  svg.innerHTML += `<line x1="${PADDING.left}" y1="${PADDING.top}" x2="${PADDING.left}" y2="${VIEWBOX_H - PADDING.bottom}" stroke="#24292E" stroke-width="1.5"/>`;

  // Build sinusoidal curve path with gradient coloring
  const N = 100;
  let pathD = '';
  for (let i = 0; i <= N; i++) {
    const d = (deltaMax * i) / N;
    const p = Pmax * Math.sin(d);
    const svg_x = PADDING.left + d * scaleX;
    const svg_y = PADDING.top + plotH * (1 - p / (Pmax * 1.1));
    pathD += (i === 0 ? 'M' : 'L') + svg_x.toFixed(2) + ',' + svg_y.toFixed(2) + ' ';
  }
  svg.innerHTML += `<path d="${pathD}" fill="none" stroke="#0366D6" stroke-width="2.5"/>`;

  // Draw Pm horizontal line with animation when running
  if (Pm !== undefined) {
    const pmY = PADDING.top + plotH * (1 - Pm / (Pmax * 1.1));
    const pmColor = running ? '#28A745' : '#586069';
    const dashArray = running ? '6,3' : '4,2';
    svg.innerHTML += `<line x1="${PADDING.left}" y1="${pmY.toFixed(2)}" x2="${VIEWBOX_W - PADDING.right}" y2="${pmY.toFixed(2)}" stroke="${pmColor}" stroke-width="1.5" stroke-dasharray="${dashArray}"/>`;
    svg.innerHTML += `<text x="${VIEWBOX_W - PADDING.right - 30}" y="${(pmY - 3).toFixed(2)}" fill="${pmColor}" font-size="10" font-weight="600">Pm=${Pm.toFixed(2)}</text>`;
  }

  // Draw EAC shading if deltaCC is provided and > 0
  if (deltaCC > 0 && deltaCC < deltaMax && Pm !== undefined) {
    const pmY = PADDING.top + plotH * (1 - Pm / (Pmax * 1.1));
    const ccX = PADDING.left + deltaCC * scaleX;
    const ccY = PADDING.top + plotH * (1 - Pmax * Math.sin(deltaCC) / (Pmax * 1.1));

    // A1 shading: accelerating area (delta0 to deltaCC, between Pm and curve)
    const a1Path = `M${PADDING.left},${pmY} ` +
      `L${ccX.toFixed(2)},${pmY} ` +
      `L${ccX.toFixed(2)},${ccY.toFixed(2)} ` +
      `Z`;
    svg.innerHTML += `<path d="${a1Path}" fill="rgba(255,100,0,0.25)" stroke="#F9821C" stroke-width="1"/>`;

    // A2 shading: decelerating area (deltaCC to deltaMax, between curve and Pm)
    // Build path from deltaCC to deltaMax along the curve
    let a2Path = `M${ccX.toFixed(2)},${ccY.toFixed(2)} `;
    const N_a2 = 50;
    for (let i = 0; i <= N_a2; i++) {
      const d = deltaCC + ((deltaMax - deltaCC) * i) / N_a2;
      const p = Pmax * Math.sin(d);
      const svg_x = PADDING.left + d * scaleX;
      const svg_y = PADDING.top + plotH * (1 - p / (Pmax * 1.1));
      a2Path += `L${svg_x.toFixed(2)},${svg_y.toFixed(2)} `;
    }
    // Close back along Pm line
    const maxX = PADDING.left + deltaMax * scaleX;
    a2Path += `L${maxX.toFixed(2)},${pmY} L${ccX.toFixed(2)},${pmY} Z`;
    svg.innerHTML += `<path d="${a2Path}" fill="rgba(40,167,69,0.15)" stroke="#28A745" stroke-width="1"/>`;

    // Draw δCC marker
    svg.innerHTML += `<line x1="${ccX}" y1="${PADDING.top}" x2="${ccX}" y2="${VIEWBOX_H - PADDING.bottom}" stroke="#F9821C" stroke-width="1" stroke-dasharray="3,3"/>`;
    svg.innerHTML += `<text x="${ccX}" y="${PADDING.top + 10}" fill="#F9821C" font-size="9" text-anchor="middle" font-weight="600">δcc</text>`;
  }

  // Draw current operating point with pulsing animation when running
  const pointX = PADDING.left + delta * scaleX;
  const pointY = PADDING.top + plotH * (1 - Pe / (Pmax * 1.1));

  // Operating point color based on stability
  let pointColor = '#D73A49'; // red default
  let pointSize = 5;
  if (stabilityMargin > 0.1) {
    pointColor = '#28A745'; // green - stable
  } else if (stabilityMargin > 0) {
    pointColor = '#F9821C'; // orange - marginal
  }

  // Glow effect for running state
  if (running) {
    svg.innerHTML += `<circle cx="${pointX.toFixed(2)}" cy="${pointY.toFixed(2)}" r="8" fill="${pointColor}" opacity="0.3"/>`;
  }

  svg.innerHTML += `<circle cx="${pointX.toFixed(2)}" cy="${pointY.toFixed(2)}" r="${pointSize}" fill="${pointColor}" stroke="#24292E" stroke-width="1.5"/>`;

  // Real-time values display
  const statusColor = running ? '#28A745' : '#586069';
  const statusText = running ? '● RUNNING' : '○ STOPPED';
  svg.innerHTML += `<text x="${VIEWBOX_W / 2}" y="12" fill="${statusColor}" font-size="10" text-anchor="middle" font-weight="600">${statusText}</text>`;

  // Axis labels
  svg.innerHTML += `<text x="${VIEWBOX_W / 2}" y="${VIEWBOX_H - 5}" fill="#24292E" font-size="10" text-anchor="middle" font-weight="600">δ (rad)</text>`;
  svg.innerHTML += `<text x="5" y="${VIEWBOX_H / 2}" fill="#24292E" font-size="10" text-anchor="middle" transform="rotate(-90, 10, ${VIEWBOX_H / 2})" font-weight="600">Pe (pu)</text>`;

  // Tick marks on x-axis (0, π/2, π)
  const ticks = [
    { d: 0, label: '0' },
    { d: Math.PI / 2, label: 'π/2' },
    { d: Math.PI, label: 'π' },
  ];
  ticks.forEach(({ d, label }) => {
    const x = PADDING.left + d * scaleX;
    svg.innerHTML += `<line x1="${x}" y1="${VIEWBOX_H - PADDING.bottom}" x2="${x}" y2="${VIEWBOX_H - PADDING.bottom + 4}" stroke="#24292E" stroke-width="1.5"/>`;
    svg.innerHTML += `<text x="${x}" y="${VIEWBOX_H - PADDING.bottom + 14}" fill="#24292E" font-size="9" text-anchor="middle" font-weight="600">${label}</text>`;
  });

  // Y-axis ticks (0, Pmax/2, Pmax)
  const yTicks = [
    { p: 0, label: '0' },
    { p: Pmax / 2, label: (Pmax / 2).toFixed(1) },
    { p: Pmax, label: Pmax.toFixed(1) },
  ];
  yTicks.forEach(({ p, label }) => {
    const y = PADDING.top + plotH * (1 - p / (Pmax * 1.1));
    svg.innerHTML += `<line x1="${PADDING.left - 4}" y1="${y}" x2="${PADDING.left}" y2="${y}" stroke="#24292E" stroke-width="1.5"/>`;
    svg.innerHTML += `<text x="${PADDING.left - 8}" y="${y + 3}" fill="#24292E" font-size="9" text-anchor="end" font-weight="600">${label}</text>`;
  });

  return svg.innerHTML;
}
