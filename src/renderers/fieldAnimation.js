// src/renderers/fieldAnimation.js
// Realistic visualization of rotor and stator magnetic field interaction
// in a synchronous generator.
//
// This renderer shows:
// 1. Stator cross-section with 3-phase windings producing rotating field
// 2. Rotor cross-section with DC field winding
// 3. Air gap flux (resultant of stator and rotor fields)
// 4. Torque production visualization
//
// Physical basis:
// - Stator: 3-phase currents produce rotating magnetic field at ωs = 2πf
// - Rotor: DC-excited field rotates with rotor at ω = ωs + Δω
// - Power angle δ: angle between rotor field and stator field
// - Torque: proportional to sin(δ)

/**
 * Render realistic rotor/stator field animation.
 *
 * @param {SVGSVGElement} svg - SVG element to render into
 * @param {Object} state - Simulation state { delta, omega, running, Efd, Ea }
 * @param {Object} params - Parameters { showFluxLines, showTorque }
 */
export function renderFieldAnimation(svg, state, params = {}) {
  if (!svg) {
    console.error('renderFieldAnimation: SVG element not found');
    return '';
  }

  const { delta, omega, running, Efd = 1.0, Ea = 1.2 } = state;
  const { showFluxLines = true, showTorque = true } = params;

  // Animation time for smooth rotation
  const currentTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const animTime = running ? (currentTime / 1000) * 2 * Math.PI * 0.5 : 0;

  // SVG viewBox: 300x300, center at (150, 150)
  const cx = 150;
  const cy = 150;

  // Stator outer radius
  const statorOuter = 140;
  const statorInner = 110;

  // Rotor outer radius (air gap)
  const rotorOuter = 105;
  const rotorInner = 40;

  // Shaft radius
  const shaftRadius = 20;

  // Clear SVG
  svg.innerHTML = '';

  // Background gradient (stator iron)
  const defs = `
    <defs>
      <radialGradient id="statorGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#e8e8e8"/>
        <stop offset="100%" stop-color="#c0c0c0"/>
      </radialGradient>
      <radialGradient id="rotorGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#d0d0d0"/>
        <stop offset="100%" stop-color="#a0a0a0"/>
      </radialGradient>
      <linearGradient id="fieldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0066cc" stop-opacity="0.3"/>
        <stop offset="50%" stop-color="#0066cc" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#0066cc" stop-opacity="0.3"/>
      </linearGradient>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#0066cc"/>
      </marker>
    </defs>
  `;
  svg.innerHTML += defs;

  // ──────────────────────────────────────────────────────────
  // STATOR (outer ring with 3-phase windings)
  // ──────────────────────────────────────────────────────────

  // Stator iron core (laminated steel)
  svg.innerHTML += `
    <circle cx="${cx}" cy="${cy}" r="${statorOuter}" fill="url(#statorGradient)" stroke="#888" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="${statorInner}" fill="white" stroke="#888" stroke-width="1"/>
  `;

  // 3-phase windings (A, B, C) - 120° apart
  // Each phase has coils in slots distributed around the stator
  const phases = [
    { label: 'A', angle: 0, color: '#D73A49' },      // Phase A - Red
    { label: 'B', angle: 120, color: '#28A745' },    // Phase B - Green
    { label: 'C', angle: 240, color: '#0366D6' },    // Phase C - Blue
  ];

  phases.forEach((phase) => {
    // Draw coil sides for this phase (2 slots, 180° apart)
    for (let i = 0; i < 2; i++) {
      const angleDeg = phase.angle + i * 180;
      const angleRad = (angleDeg * Math.PI) / 180;

      // Coil side position (in stator slots)
      const slotRadius = (statorOuter + statorInner) / 2;
      const x = cx + slotRadius * Math.cos(angleRad);
      const y = cy + slotRadius * Math.sin(angleRad);

      // Coil side marker (circle with phase color)
      svg.innerHTML += `
        <circle cx="${x}" cy="${y}" r="8" fill="${phase.color}" stroke="white" stroke-width="1"/>
        <text x="${x}" y="${y + 3}" text-anchor="middle" fill="white" font-size="9" font-weight="bold">${phase.label}</text>
      `;
    }
  });

  // ──────────────────────────────────────────────────────────
  // ROTOR (inner circle with DC field winding)
  // ──────────────────────────────────────────────────────────

  // Rotor iron core
  svg.innerHTML += `
    <circle cx="${cx}" cy="${cy}" r="${rotorOuter}" fill="url(#rotorGradient)" stroke="#666" stroke-width="1"/>
  `;

  // Rotor field winding (simplified: N and S poles)
  // The rotor rotates by angle δ from the reference frame
  const rotorAngle = delta;

  // N pole (positive field direction)
  const nAngle = rotorAngle;
  const nx = cx + (rotorOuter + rotorInner) / 2 * 0.7 * Math.cos(nAngle);
  const ny = cy + (rotorOuter + rotorInner) / 2 * 0.7 * Math.sin(nAngle);

  // S pole (negative field direction, 180° opposite)
  const sAngle = rotorAngle + Math.PI;
  const sx = cx + (rotorOuter + rotorInner) / 2 * 0.7 * Math.cos(sAngle);
  const sy = cy + (rotorOuter + rotorInner) / 2 * 0.7 * Math.sin(sAngle);

  // Draw poles as rounded rectangles
  const poleWidth = 30;
  const poleHeight = 20;

  // N pole (North)
  svg.innerHTML += `
    <rect x="${nx - poleWidth/2}" y="${ny - poleHeight/2}" width="${poleWidth}" height="${poleHeight}"
          rx="5" fill="#cc3333" stroke="#990000" stroke-width="2"
          transform="rotate(${nAngle * 180 / Math.PI}, ${nx}, ${ny})"/>
    <text x="${nx}" y="${ny + 4}" text-anchor="middle" fill="white" font-size="12" font-weight="bold"
          transform="rotate(${nAngle * 180 / Math.PI}, ${nx}, ${ny})">N</text>
  `;

  // S pole (South)
  svg.innerHTML += `
    <rect x="${sx - poleWidth/2}" y="${sy - poleHeight/2}" width="${poleWidth}" height="${poleHeight}"
          rx="5" fill="#3333cc" stroke="#000099" stroke-width="2"
          transform="rotate(${sAngle * 180 / Math.PI}, ${sx}, ${sy})"/>
    <text x="${sx}" y="${sy + 4}" text-anchor="middle" fill="white" font-size="12" font-weight="bold"
          transform="rotate(${sAngle * 180 / Math.PI}, ${sx}, ${sy})">S</text>
  `;

  // Shaft
  svg.innerHTML += `
    <circle cx="${cx}" cy="${cy}" r="${shaftRadius}" fill="#666" stroke="#444" stroke-width="2"/>
  `;

  // ──────────────────────────────────────────────────────────
  // MAGNETIC FIELD VISUALIZATION
  // ──────────────────────────────────────────────────────────

  if (showFluxLines) {
    // Stator rotating magnetic field direction
    // This rotates at synchronous speed ωs
    const statorFieldAngle = running ? animTime : 0;
    const statorFieldLength = 60;

    // Stator field vector (rotates with time when running)
    const sfx = cx + statorFieldLength * Math.cos(statorFieldAngle);
    const sfy = cy + statorFieldLength * Math.sin(statorFieldAngle);

    // Draw stator field arrow
    svg.innerHTML += `
      <line x1="${cx}" y1="${cy}" x2="${sfx}" y2="${sfy}"
            stroke="#0066cc" stroke-width="4" stroke-opacity="0.7"
            marker-end="url(#arrowhead)"/>
      <text x="${sfx + 10}" y="${sfy}" fill="#0066cc" font-size="11" font-weight="bold">B₁</text>
    `;

    // Rotor magnetic field direction
    // This is aligned with rotor N pole
    const rotorFieldAngle = rotorAngle;
    const rotorFieldLength = 60 * (Efd / 1.0); // Scale with field voltage

    // Rotor field vector
    const rfx = cx + rotorFieldLength * Math.cos(rotorFieldAngle);
    const rfy = cy + rotorFieldLength * Math.sin(rotorFieldAngle);

    // Draw rotor field arrow
    svg.innerHTML += `
      <line x1="${cx}" y1="${cy}" x2="${rfx}" y2="${rfy}"
            stroke="#cc0000" stroke-width="4" stroke-opacity="0.7"/>
      <text x="${rfx + 10}" y="${rfy}" fill="#cc0000" font-size="11" font-weight="bold">Bᵣ</text>
    `;

    // Air gap flux (resultant of stator and rotor fields)
    // Simplified: vector sum
    const resultAngle = (statorFieldAngle + rotorFieldAngle) / 2; // Approximate
    const resultLength = statorFieldLength * 0.8;

    // Draw resultant flux (dashed)
    svg.innerHTML += `
      <line x1="${cx}" y1="${cy}" x2="${cx + resultLength * Math.cos(resultAngle)}"
            y2="${cy + resultLength * Math.sin(resultAngle)}"
            stroke="#9933cc" stroke-width="3" stroke-dasharray="5,3" stroke-opacity="0.8"/>
    `;
  }

  // ──────────────────────────────────────────────────────────
  // TORQUE VISUALIZATION
  // ──────────────────────────────────────────────────────────

  if (showTorque) {
    // Torque direction (perpendicular to rotor field)
    // Torque angle = δ (angle between stator and rotor fields)
    const torqueAngle = delta;

    // Torque arc
    const arcRadius = 70;
    const startAngle = 0;
    const endAngle = torqueAngle;

    if (Math.abs(torqueAngle) > 0.05) {
      // Draw arc showing angle δ
      const x1 = cx + arcRadius * Math.cos(startAngle);
      const y1 = cy + arcRadius * Math.sin(startAngle);
      const x2 = cx + arcRadius * Math.cos(endAngle);
      const y2 = cy + arcRadius * Math.sin(endAngle);

      const largeArc = Math.abs(torqueAngle) > Math.PI ? 1 : 0;
      const sweep = torqueAngle > 0 ? 1 : 0;

      svg.innerHTML += `
        <path d="M${x1},${y1} A${arcRadius},${arcRadius} 0 ${largeArc} ${sweep} ${x2},${y2}"
              fill="none" stroke="#9933cc" stroke-width="3" stroke-opacity="0.8"/>
      `;

      // Torque label
      const midAngle = torqueAngle / 2;
      const labelRadius = arcRadius + 15;
      const labelX = cx + labelRadius * Math.cos(midAngle);
      const labelY = cy + labelRadius * Math.sin(midAngle);

      const torqueValue = Math.sin(delta).toFixed(2);
      svg.innerHTML += `
        <text x="${labelX}" y="${labelY}" fill="#9933cc" font-size="11" font-weight="bold">δ = ${(delta * 180 / Math.PI).toFixed(1)}°</text>
        <text x="${labelX}" y="${labelY + 12}" fill="#666" font-size="9">T ∝ sin(δ) = ${torqueValue}</text>
      `;
    }
  }

  // ──────────────────────────────────────────────────────────
  // STATUS OVERLAY
  // ──────────────────────────────────────────────────────────

  // Running indicator
  const statusColor = running ? '#28A745' : '#586069';
  const statusText = running ? '● RUNNING' : '○ STOPPED';
  svg.innerHTML += `
    <text x="${cx}" y="${cy + statorOuter + 15}" text-anchor="middle"
          fill="${statusColor}" font-size="11" font-weight="600">${statusText}</text>
  `;

  // Field voltage indicator
  svg.innerHTML += `
    <text x="${cx}" y="${cy + statorOuter + 28}" text-anchor="middle"
          fill="#666" font-size="10">Efd = ${Efd.toFixed(2)} pu | E' = ${Ea.toFixed(2)} pu</text>
  `;

  return svg.innerHTML;
}

/**
 * Compute field animation coordinates for testing (pure function).
 */
export function computeFieldCoords(state, params = {}) {
  const { delta, Efd = 1.0 } = state;
  const { statorRadius = 125, rotorRadius = 70 } = params;

  return {
    statorFieldAngle: 0,
    rotorFieldAngle: delta,
    rotorFieldLength: rotorRadius * (Efd / 1.0),
    torque: Math.sin(delta),
  };
}
