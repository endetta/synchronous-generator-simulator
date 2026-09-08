// src/renderers/governorGauge.js
// Governor dynamics visualization showing valve position, tracking, and droop action.
//
// Components:
// 1. Valve position gauge (semicircular, 0-100%)
// 2. Pref vs Pm tracking plot (last 10 seconds)
// 3. Droop indicator (steady-state error visualization)

/**
 * Render governor valve position gauge.
 *
 * @param {SVGSVGElement} svg - SVG element for gauge
 * @param {Object} state - Simulation state { valvePosition, Pm, Pref }
 * @param {Object} params - Parameters { R (droop), Pmax }
 */
export function renderGovernorGauge(svg, state, params = {}) {
  if (!svg) {
    console.error('renderGovernorGauge: SVG element not found');
    return '';
  }

  const { valvePosition = 1.0, Pm = 1.0, Pref = 1.0 } = state;
  const { R = 0.05, Pmax = 2.0 } = params;

  // SVG viewBox: 200x150 (compact gauge)
  const cx = 100;
  const cy = 110;
  const radius = 70;

  // Clear SVG
  svg.innerHTML = '';

  // Background arc (0% to 100%)
  const startAngle = Math.PI; // 180°
  const endAngle = 0; // 0°

  // Gauge background (gray arc)
  svg.innerHTML += `
    <path d="M ${cx - radius},${cy} A ${radius},${radius} 0 0 1 ${cx + radius},${cy}"
          fill="none" stroke="#e1e4e8" stroke-width="12" stroke-linecap="round"/>
  `;

  // Valve position (percentage)
  const valvePercent = Math.max(0, Math.min(100, (valvePosition / Pmax) * 100));
  const valveAngle = startAngle + (endAngle - startAngle) * (valvePercent / 100);

  // Valve position arc (colored based on position)
  let valveColor = '#28a745'; // Green (normal)
  if (valvePercent > 80) valveColor = '#ffc107'; // Yellow (high)
  if (valvePercent > 95) valveColor = '#dc3545'; // Red (limit)

  const valveX = cx + radius * Math.cos(valveAngle);
  const valveY = cy + radius * Math.sin(valveAngle);

  const largeArc = valvePercent > 50 ? 1 : 0;

  svg.innerHTML += `
    <path d="M ${cx - radius},${cy} A ${radius},${radius} 0 ${largeArc} 1 ${valveX},${valveY}"
          fill="none" stroke="${valveColor}" stroke-width="12" stroke-linecap="round"/>
  `;

  // Valve indicator (moving pointer)
  const pointerLength = radius - 20;
  const pointerX = cx + pointerLength * Math.cos(valveAngle);
  const pointerY = cy + pointerLength * Math.sin(valveAngle);

  svg.innerHTML += `
    <line x1="${cx}" y1="${cy}" x2="${pointerX}" y2="${pointerY}"
          stroke="#24292e" stroke-width="3" stroke-linecap="round"/>
    <circle cx="${pointerX}" cy="${pointerY}" r="5" fill="${valveColor}" stroke="#24292e" stroke-width="2"/>
  `;

  // Center circle
  svg.innerHTML += `
    <circle cx="${cx}" cy="${cy}" r="8" fill="#24292e"/>
  `;

  // Gauge labels (0%, 50%, 100%)
  const labels = [
    { percent: 0, text: '0%', angle: Math.PI },
    { percent: 50, text: '50%', angle: Math.PI / 2 },
    { percent: 100, text: '100%', angle: 0 },
  ];

  labels.forEach((label) => {
    const labelRadius = radius + 15;
    const lx = cx + labelRadius * Math.cos(label.angle);
    const ly = cy + labelRadius * Math.sin(label.angle) + 4;
    svg.innerHTML += `
      <text x="${lx}" y="${ly}" text-anchor="middle" fill="#586069" font-size="10" font-weight="600">${label.text}</text>
    `;
  });

  // Valve position value (center display)
  svg.innerHTML += `
    <text x="${cx}" y="${cy + 30}" text-anchor="middle" fill="#24292e" font-size="16" font-weight="bold">${valvePercent.toFixed(1)}%</text>
    <text x="${cx}" y="${cy + 45}" text-anchor="middle" fill="#586069" font-size="10">Posisi Katup</text>
  `;

  // Droop indicator (steady-state error)
  const droopError = (Pref - Pm) / R;
  const errorText = droopError > 0.01 ? `+${droopError.toFixed(2)}` : droopError < -0.01 ? `${droopError.toFixed(2)}` : '0.00';

  svg.innerHTML += `
    <text x="${cx}" y="20" text-anchor="middle" fill="#586069" font-size="9">Droop Error (pu):</text>
    <text x="${cx}" y="32" text-anchor="middle" fill="#0366d6" font-size="11" font-weight="600">${errorText}</text>
  `;

  return svg.innerHTML;
}

/**
 * Render governor tracking plot (Pref vs Pm over time).
 *
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} data - { time: [t], Pref: [Pref], Pm: [Pm] }
 * @param {Object} params - Parameters { windowSize }
 */
export function renderGovernorTracking(canvas, data, params = {}) {
  if (!canvas) {
    console.error('renderGovernorTracking: Canvas element not found');
    return;
  }

  const { time = [], Pref = [], Pm = [] } = data;
  const { windowSize = 10 } = params; // Last 10 seconds

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // Set canvas size
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // If no data, show placeholder
  if (time.length === 0) {
    ctx.fillStyle = '#586069';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Tracking plot akan muncul saat simulasi berjalan', width / 2, height / 2);
    return;
  }

  // Get last windowSize seconds
  const now = time[time.length - 1];
  const startTime = now - windowSize;

  const indices = time.map((t, i) => ({ t, i })).filter((d) => d.t >= startTime);
  if (indices.length === 0) return;

  const timeWindow = indices.map((d) => time[d.i]);
  const PrefWindow = indices.map((d) => Pref[d.i]);
  const PmWindow = indices.map((d) => Pm[d.i]);

  // Margins
  const margin = { top: 15, right: 10, bottom: 25, left: 40 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Scales
  const tMin = startTime;
  const tMax = now;
  const PMin = 0;
  const PMax = Math.max(2.0, ...PrefWindow, ...PmWindow);

  const xScale = (t) => margin.left + ((t - tMin) / (tMax - tMin)) * plotWidth;
  const yScale = (p) => margin.top + plotHeight - ((p - PMin) / (PMax - PMin)) * plotHeight;

  // Draw background
  ctx.fillStyle = '#f6f8fa';
  ctx.fillRect(margin.left, margin.top, plotWidth, plotHeight);

  // Draw grid
  ctx.strokeStyle = '#e1e4e8';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = margin.top + (i / 4) * plotHeight;
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(margin.left + plotWidth, y);
    ctx.stroke();
  }

  // Draw axes
  ctx.strokeStyle = '#24292e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, margin.top + plotHeight);
  ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
  ctx.stroke();

  // Draw Pref line (dashed, blue)
  ctx.strokeStyle = '#0366d6';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  timeWindow.forEach((t, i) => {
    const x = xScale(t);
    const y = yScale(PrefWindow[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw Pm line (solid, green)
  ctx.strokeStyle = '#28a745';
  ctx.lineWidth = 2;
  ctx.beginPath();
  timeWindow.forEach((t, i) => {
    const x = xScale(t);
    const y = yScale(PmWindow[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Y-axis labels
  ctx.fillStyle = '#24292e';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const p = PMin + (i / 4) * (PMax - PMin);
    const y = margin.top + plotHeight - (i / 4) * plotHeight;
    ctx.fillText(p.toFixed(1), margin.left - 5, y + 3);
  }

  // X-axis label
  ctx.textAlign = 'center';
  ctx.fillText('Waktu (detik terakhir)', width / 2, height - 5);

  // Y-axis label
  ctx.save();
  ctx.translate(10, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Daya (pu)', 0, 0);
  ctx.restore();

  // Legend
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0366d6';
  ctx.fillRect(margin.left + 10, margin.top + 5, 15, 2);
  ctx.fillText('Pref', margin.left + 30, margin.top + 8);

  ctx.fillStyle = '#28a745';
  ctx.fillRect(margin.left + 70, margin.top + 5, 15, 2);
  ctx.fillText('Pm', margin.left + 90, margin.top + 8);
}
