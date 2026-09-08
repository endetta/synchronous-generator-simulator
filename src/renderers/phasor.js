// src/renderers/phasor.js
// SVG phasor diagram renderer for the synchronous generator simulator.
// Renders E' (generator internal EMF), V (infinite bus voltage), I (armature current),
// and the torque angle δ between them with smooth rotation animation.

// Animation state for smooth phasor rotation
let lastFrameTime = 0;
let animationTime = 0;

// Render the phasor diagram into the provided SVG element.
// state: { delta, Pe, Pm, Pref, running, omega, ... }
// params: { V, Ea, X } (pu)
// svg: DOM element (or mock with viewBox attribute)
export function renderPhasor(svg, state, params) {
  if (!svg) {
    console.error('renderPhasor: SVG element not found');
    return '';
  }

  const { delta, running, omega } = state;
  const { V = 1.0, Ea = 1.2, X = 0.3 } = params;

  // SVG viewBox="-150 -150 300 300" means:
  // - Center is at (0, 0) in viewBox coordinates
  // - X ranges from -150 to 150
  // - Y ranges from -150 to 150 (Y-axis points DOWN in SVG)
  const cx = 0;
  const cy = 0;
  const scale = 100; // Use viewBox units directly

  // Smooth animation using requestAnimationFrame timestamp
  const currentTime = performance.now();
  if (running) {
    const deltaTime = lastFrameTime > 0 ? (currentTime - lastFrameTime) / 1000 : 0.016;
    animationTime += deltaTime * 2 * Math.PI * 0.5; // 0.5 Hz rotation, smooth increment
  }
  lastFrameTime = currentTime;

  // Reference frame rotation angle (simulates synchronous rotation)
  const refAngle = running ? animationTime : 0;

  console.log('renderPhasor:', { cx, cy, delta: delta * 180 / Math.PI, scale, running, refAngle: refAngle * 180 / Math.PI });

  // Clear SVG
  svg.innerHTML = '';

  // Transform all angles by reference frame rotation
  // This makes V (reference) rotate, showing the relative motion
  const transform = (x, y, angle) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: x * cos - y * sin,
      y: x * sin + y * cos,
    };
  };

  // Phasor coordinates (Y-axis flipped in SVG)
  // V is reference (horizontal, angle 0, pointing right) - now rotates
  const vBase = { x: V * scale, y: 0 };
  const vEnd = transform(vBase.x, vBase.y, -refAngle); // negative for SVG Y-down
  vEnd.y = -vEnd.y; // flip Y for SVG

  // E' leads V by angle δ (counterclockwise in math, clockwise in SVG Y-down)
  // Total angle = δ + refAngle (relative to rotating frame)
  const eBase = {
    x: Ea * scale * Math.cos(delta),
    y: Ea * scale * Math.sin(delta),
  };
  const eEnd = transform(eBase.x, eBase.y, -refAngle);
  eEnd.y = -eEnd.y; // flip Y for SVG

  // Compute I: I = (E' - V) / jX  →  I lags E' by angle (90° - δ) roughly
  // More precisely: I = (E'∠δ - V∠0) / (X∠90°)
  const iBase = {
    x: (Ea * Math.sin(delta)) / X * scale,
    y: (Ea * Math.cos(delta) - V) / X * scale,
  };
  const iEnd = transform(iBase.x, iBase.y, -refAngle);
  iEnd.y = -iEnd.y; // flip Y for SVG

  // Draw rotating reference circle (pu scale)
  svg.innerHTML += `<circle cx="${cx}" cy="${cy}" r="${scale}" fill="none" stroke="#ccc" stroke-dasharray="4,2"/>`;

  // Draw rotating axes
  const axesLen = 140;
  const x1 = transform(axesLen, 0, -refAngle);
  const x2 = transform(-axesLen, 0, -refAngle);
  const y1 = transform(0, axesLen, -refAngle);
  const y2 = transform(0, -axesLen, -refAngle);
  x1.y = -x1.y; x2.y = -x2.y; y1.y = -y1.y; y2.y = -y2.y;
  svg.innerHTML += `<line x1="${x1.x}" y1="${x1.y}" x2="${x2.x}" y2="${x2.y}" stroke="#ddd" stroke-width="1"/>`;
  svg.innerHTML += `<line x1="${y1.x}" y1="${y1.y}" x2="${y2.x}" y2="${y2.y}" stroke="#ddd" stroke-width="1"/>`;

  // Draw V phasor (red) with arrowhead
  svg.innerHTML += `<line x1="${cx}" y1="${cy}" x2="${vEnd.x}" y2="${vEnd.y}" stroke="#D73A49" stroke-width="3"/>`;
  svg.innerHTML += `<polygon points="${vEnd.x},${vEnd.y} ${vEnd.x - 8},${vEnd.y - 5} ${vEnd.x - 8},${vEnd.y + 5}" fill="#D73A49" transform="rotate(${-refAngle * 180 / Math.PI}, ${vEnd.x}, ${vEnd.y})"/>`;
  svg.innerHTML += `<text x="${vEnd.x + 10}" y="${vEnd.y + 5}" fill="#D73A49" font-size="14" font-weight="bold">V</text>`;

  // Draw E' phasor (blue) with arrowhead
  svg.innerHTML += `<line x1="${cx}" y1="${cy}" x2="${eEnd.x}" y2="${eEnd.y}" stroke="#0366D6" stroke-width="3"/>`;
  const eArrowAngle = (-refAngle - delta) * 180 / Math.PI;
  svg.innerHTML += `<polygon points="${eEnd.x},${eEnd.y} ${eEnd.x - 8},${eEnd.y - 5} ${eEnd.x - 8},${eEnd.y + 5}" fill="#0366D6" transform="rotate(${eArrowAngle}, ${eEnd.x}, ${eEnd.y})"/>`;
  svg.innerHTML += `<text x="${eEnd.x + 10}" y="${eEnd.y - 10}" fill="#0366D6" font-size="14" font-weight="bold">E'</text>`;

  // Draw I phasor (green) with arrowhead
  svg.innerHTML += `<line x1="${cx}" y1="${cy}" x2="${iEnd.x}" y2="${iEnd.y}" stroke="#28A745" stroke-width="3"/>`;
  svg.innerHTML += `<text x="${iEnd.x + 10}" y="${iEnd.y + 5}" fill="#28A745" font-size="14" font-weight="bold">I</text>`;

  // Draw angle arc δ
  const arcRadius = scale * 0.3;
  const startAngle = 0;
  const endAngle = delta;
  const largeArc = delta > Math.PI ? 1 : 0;
  const x1Arc = arcRadius * Math.cos(startAngle);
  const y1Arc = -arcRadius * Math.sin(startAngle);
  const x2Arc = arcRadius * Math.cos(endAngle);
  const y2Arc = -arcRadius * Math.sin(endAngle);

  svg.innerHTML += `<path d="M${x1Arc},${y1Arc} A${arcRadius},${arcRadius} 0 ${largeArc} 1 ${x2Arc},${y2Arc}" fill="none" stroke="#6F42C1" stroke-width="2"/>`;
  svg.innerHTML += `<text x="${arcRadius + 10}" y="${-arcRadius}" fill="#6F42C1" font-size="12" font-weight="bold">δ</text>`;

  // Draw center dot
  svg.innerHTML += `<circle cx="${cx}" cy="${cy}" r="4" fill="#24292E"/>`;

  // Status text with animation indicator
  const deltaDeg = delta * 180 / Math.PI;
  const omegaDisplay = omega ? omega.toFixed(4) : '1.0000';
  const statusColor = running ? '#28A745' : '#586069';
  svg.innerHTML += `<text x="0" y="120" fill="${statusColor}" font-size="11" text-anchor="middle" font-weight="600">${running ? '● RUNNING' : '○ STOPPED'}</text>`;
  svg.innerHTML += `<text x="0" y="135" fill="#24292E" font-size="12" text-anchor="middle">δ = ${deltaDeg.toFixed(1)}° | ω = ${omegaDisplay} pu</text>`;

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
