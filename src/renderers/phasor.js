// src/renderers/phasor.js
// SVG phasor diagram renderer for the synchronous generator simulator.
// Renders E' (generator internal EMF), V (infinite bus voltage), I (armature current),
// and the torque angle δ between them.

// Render the phasor diagram into the provided SVG element.
// state: { delta, Pe, Pm, Pref, ... }
// params: { V, Ea, X } (pu)
// svg: DOM element (or mock with viewBox attribute)
export function renderPhasor(svg, state, params) {
  if (!svg) {
    console.error('renderPhasor: SVG element not found');
    return '';
  }

  const { delta } = state;
  const { V = 1.0, Ea = 1.2, X = 0.3 } = params;

  // SVG viewBox="-150 -150 300 300" means:
  // - Center is at (0, 0) in viewBox coordinates
  // - X ranges from -150 to 150
  // - Y ranges from -150 to 150 (Y-axis points DOWN in SVG)
  const cx = 0;
  const cy = 0;
  const scale = 100; // Use viewBox units directly

  console.log('renderPhasor:', { cx, cy, delta: delta * 180 / Math.PI, scale });

  // Clear SVG
  svg.innerHTML = '';

  // Phasor coordinates (Y-axis flipped in SVG)
  // V is reference (horizontal, angle 0, pointing right)
  const vEnd = {
    x: V * scale,
    y: 0,
  };

  // E' leads V by angle δ (counterclockwise in math, clockwise in SVG Y-down)
  const eEnd = {
    x: Ea * scale * Math.cos(delta),
    y: -Ea * scale * Math.sin(delta), // negative because SVG Y-axis points down
  };

  // Compute I: I = (E' - V) / jX  →  I lags E' by angle (90° - δ) roughly
  // More precisely: I = (E'∠δ - V∠0) / (X∠90°)
  const ix = (Ea * Math.sin(delta)) / X * scale;
  const iy = (Ea * Math.cos(delta) - V) / X * scale;
  const iEnd = {
    x: ix,
    y: iy,
  };

  // Draw reference circle (pu scale)
  svg.innerHTML += `<circle cx="${cx}" cy="${cy}" r="${scale}" fill="none" stroke="#ccc" stroke-dasharray="4,2"/>`;

  // Draw V phasor (red)
  svg.innerHTML += `<line x1="${cx}" y1="${cy}" x2="${vEnd.x}" y2="${vEnd.y}" stroke="red" stroke-width="2"/>`;
  svg.innerHTML += `<text x="${vEnd.x + 10}" y="${vEnd.y + 5}" fill="red" font-size="14">V</text>`;

  // Draw E' phasor (blue)
  svg.innerHTML += `<line x1="${cx}" y1="${cy}" x2="${eEnd.x}" y2="${eEnd.y}" stroke="blue" stroke-width="2"/>`;
  svg.innerHTML += `<text x="${eEnd.x + 10}" y="${eEnd.y - 10}" fill="blue" font-size="14">E'</text>`;

  // Draw I phasor (green)
  svg.innerHTML += `<line x1="${cx}" y1="${cy}" x2="${iEnd.x}" y2="${iEnd.y}" stroke="green" stroke-width="2"/>`;
  svg.innerHTML += `<text x="${iEnd.x + 10}" y="${iEnd.y + 5}" fill="green" font-size="14">I</text>`;

  // Draw angle arc δ
  const arcRadius = scale * 0.3;
  const startAngle = 0;
  const endAngle = delta;
  const largeArc = delta > Math.PI ? 1 : 0;
  const x1 = arcRadius * Math.cos(startAngle);
  const y1 = -arcRadius * Math.sin(startAngle);
  const x2 = arcRadius * Math.cos(endAngle);
  const y2 = -arcRadius * Math.sin(endAngle);

  svg.innerHTML += `<path d="M${x1},${y1} A${arcRadius},${arcRadius} 0 ${largeArc} 1 ${x2},${y2}" fill="none" stroke="purple" stroke-width="1"/>`;
  svg.innerHTML += `<text x="${arcRadius + 10}" y="${-arcRadius}" fill="purple" font-size="12">δ</text>`;

  // Draw center dot
  svg.innerHTML += `<circle cx="${cx}" cy="${cy}" r="3" fill="black"/>`;

  // Draw axes
  svg.innerHTML += `<line x1="-140" y1="0" x2="140" y2="0" stroke="#ddd" stroke-width="1"/>`;
  svg.innerHTML += `<line x1="0" y1="-140" x2="0" y2="140" stroke="#ddd" stroke-width="1"/>`;

  // Status text
  const deltaDeg = delta * 180 / Math.PI;
  svg.innerHTML += `<text x="0" y="130" fill="black" font-size="12" text-anchor="middle">δ = ${deltaDeg.toFixed(1)}°</text>`;

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
