// src/renderers/phasor.js
// SVG phasor diagram renderer for the synchronous generator simulator.
// Renders E' (generator internal EMF), V (infinite bus voltage), I (armature current),
// and the torque angle δ between them.

// Render the phasor diagram into the provided SVG element.
// state: { delta, Pe, Pm, Pref, ... }
// params: { V, Ea, X } (pu)
// svg: DOM element (or mock with viewBox attribute)
export function renderPhasor(svg, state, params) {
  const { delta } = state;
  const { V = 1.0, Ea = 1.2, X = 0.3 } = params;

  const width = svg.clientWidth || 300;
  const height = svg.clientHeight || 300;
  const cx = width / 2;
  const cy = height / 2;
  const scale = Math.min(width, height) / 2.5;

  // Clear SVG
  svg.innerHTML = '';

  // Define center
  const center = { x: cx, y: cy };

  // Phasor coordinates (Y-axis flipped in SVG)
  // V is reference (horizontal, angle 0)
  const vEnd = {
    x: cx + V * scale,
    y: cy,
  };

  // E' leads V by angle δ
  const eEnd = {
    x: cx + Ea * scale * Math.cos(delta),
    y: cy - Ea * scale * Math.sin(delta),
  };

  // Compute I: I = (E' - V) / jX  →  I lags E' by angle (90° - δ) roughly
  // More precisely: I = (E'∠δ - V∠0) / (X∠90°)
  const ix = (Ea * Math.sin(delta)) / X * scale;
  const iy = (Ea * Math.cos(delta) - V) / X * scale;
  const iEnd = {
    x: cx + ix,
    y: cy + iy,
  };

  // Draw reference circle (pu scale)
  svg.innerHTML += `<circle cx="${cx}" cy="${cy}" r="${scale}" fill="none" stroke="#ccc" stroke-dasharray="4,2"/>`;

  // Draw V phasor (red)
  svg.innerHTML += `<line x1="${cx}" y1="${cy}" x2="${vEnd.x}" y2="${vEnd.y}" stroke="red" stroke-width="2"/>`;
  svg.innerHTML += `<text x="${vEnd.x + 5}" y="${vEnd.y - 5}" fill="red" font-size="12">V</text>`;

  // Draw E' phasor (blue)
  svg.innerHTML += `<line x1="${cx}" y1="${cy}" x2="${eEnd.x}" y2="${eEnd.y}" stroke="blue" stroke-width="2"/>`;
  svg.innerHTML += `<text x="${eEnd.x + 5}" y="${eEnd.y - 5}" fill="blue" font-size="12">E'</text>`;

  // Draw I phasor (green)
  svg.innerHTML += `<line x1="${cx}" y1="${cy}" x2="${iEnd.x}" y2="${iEnd.y}" stroke="green" stroke-width="2"/>`;
  svg.innerHTML += `<text x="${iEnd.x + 5}" y="${iEnd.y - 5}" fill="green" font-size="12">I</text>`;

  // Draw angle arc δ
  const arcRadius = scale * 0.3;
  const startAngle = 0;
  const endAngle = delta;
  const largeArc = delta > Math.PI ? 1 : 0;
  const x1 = cx + arcRadius * Math.cos(startAngle);
  const y1 = cy - arcRadius * Math.sin(startAngle);
  const x2 = cx + arcRadius * Math.cos(endAngle);
  const y2 = cy - arcRadius * Math.sin(endAngle);

  svg.innerHTML += `<path d="M${x1},${y1} A${arcRadius},${arcRadius} 0 ${largeArc} 1 ${x2},${y2}" fill="none" stroke="purple" stroke-width="1"/>`;
  svg.innerHTML += `<text x="${cx + arcRadius + 5}" y="${cy - arcRadius}" fill="purple" font-size="10">δ</text>`;

  // Draw center dot
  svg.innerHTML += `<circle cx="${cx}" cy="${cy}" r="2" fill="black"/>`;

  // Status text
  const deltaDeg = delta * 180 / Math.PI;
  svg.innerHTML += `<text x="${cx}" y="${cy + scale + 20}" fill="black" font-size="12" text-anchor="middle">δ = ${deltaDeg.toFixed(1)}°</text>`;

  return svg.innerHTML;
}

// Compute phasor coordinates for testing (pure function, no DOM)
export function computePhasorCoords(state, params) {
  const { delta } = state;
  const { V = 1.0, Ea = 1.2, X = 0.3 } = params;

  return {
    V_end: { x: V * Math.cos(0), y: V * Math.sin(0) },
    E_end: { x: Ea * Math.cos(delta), y: Ea * Math.sin(delta) },
    I_end: {
      x: (Ea * Math.sin(delta)) / X,
      y: (Ea * Math.cos(delta) - V) / X,
    },
  };
}
