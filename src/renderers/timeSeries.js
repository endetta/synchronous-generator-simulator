// src/renderers/timeSeries.js
// Canvas-based 4-stack time series renderer for δ, ω, Pe, Pm.
// Supports DPR (device pixel ratio) scaling for retina displays.

const STACK_HEIGHT = 50;
const STACK_GAP = 5;
const STACK_COUNT = 4;

// Compute layout dimensions based on canvas and DPR.
export function getLayout(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 600;
  const height = canvas.clientHeight || (STACK_HEIGHT * STACK_COUNT + STACK_GAP * (STACK_COUNT - 1) + 10);

  // Set canvas backing store size
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  return { dpr, width, height };
}

// Render time series stack into the canvas.
// data: { delta: [{t, v}], omega: [{t, v}], Pe: [{t, v}], Pm: [{t, v}] }
export function renderTimeSeries(canvas, data) {
  if (!canvas) {
    console.error('renderTimeSeries: Canvas element not found');
    return;
  }

  const { dpr, width, height } = getLayout(canvas);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    console.error('renderTimeSeries: Could not get 2D context');
    return;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  console.log('renderTimeSeries:', { width, height, dpr, points: data.delta.length });

  // Clear
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  const stacks = [
    { name: 'δ (rad)', data: data.delta, color: 'blue', range: [0, Math.PI] },
    { name: 'ω (pu)', data: data.omega, color: 'red', range: [0.9, 1.1] },
    { name: 'Pe (pu)', data: data.Pe, color: 'green', range: [0, 2.0] },
    { name: 'Pm (pu)', data: data.Pm, color: 'orange', range: [0, 2.0] },
  ];

  // Determine global time range
  let tMin = Infinity;
  let tMax = -Infinity;
  stacks.forEach(s => {
    s.data.forEach(p => {
      if (p.t < tMin) tMin = p.t;
      if (p.t > tMax) tMax = p.t;
    });
  });
  if (!isFinite(tMin)) { tMin = 0; tMax = 1; }

  const stackWidth = width - 30;
  const stackX = 30;

  stacks.forEach((s, idx) => {
    const yTop = idx * (STACK_HEIGHT + STACK_GAP);

    // Draw stack background
    ctx.fillStyle = '#F8F8F8';
    ctx.fillRect(stackX, yTop, stackWidth, STACK_HEIGHT);
    ctx.strokeStyle = '#DDD';
    ctx.strokeRect(stackX, yTop, stackWidth, STACK_HEIGHT);

    // Draw label
    ctx.fillStyle = '#333';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(s.name, stackX - 3, yTop + 3);

    // Draw range
    ctx.textAlign = 'left';
    ctx.fillText(s.range[0].toFixed(2), stackX - 28, yTop + STACK_HEIGHT - 12);
    ctx.fillText(s.range[1].toFixed(2), stackX - 28, yTop + 3);

    // Plot data
    if (s.data.length < 2) return;

    const [vMin, vMax] = s.range;
    const vRange = vMax - vMin || 1;

    ctx.beginPath();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 1.5;
    s.data.forEach((p, i) => {
      const x = stackX + ((p.t - tMin) / (tMax - tMin)) * stackWidth;
      const y = yTop + STACK_HEIGHT - ((p.v - vMin) / vRange) * STACK_HEIGHT;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
}
