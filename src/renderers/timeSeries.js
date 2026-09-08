// src/renderers/timeSeries.js
// Canvas-based 4-stack time series renderer for δ, ω, Pe, Pm.
// Supports DPR (device pixel ratio) scaling for retina displays.
// Features sliding window for smooth visualization over time.

const STACK_HEIGHT = 50;
const STACK_GAP = 5;
const STACK_COUNT = 4;
const WINDOW_SIZE = 10; // Show last 10 seconds of data

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
    { name: 'δ (rad)', data: data.delta, color: '#0366D6', range: [0, Math.PI], unit: 'rad' },
    { name: 'ω (pu)', data: data.omega, color: '#D73A49', range: [0.95, 1.05], unit: 'pu' },
    { name: 'Pe (pu)', data: data.Pe, color: '#28A745', range: [0, 2.0], unit: 'pu' },
    { name: 'Pm (pu)', data: data.Pm, color: '#F9821C', range: [0, 2.0], unit: 'pu' },
  ];

  // Determine time range with sliding window
  let tMin = Infinity;
  let tMax = -Infinity;
  stacks.forEach(s => {
    s.data.forEach(p => {
      if (p.t < tMin) tMin = p.t;
      if (p.t > tMax) tMax = p.t;
    });
  });
  if (!isFinite(tMin)) { tMin = 0; tMax = 1; }

  // Apply sliding window: show only last WINDOW_SIZE seconds
  const windowMax = tMax;
  const windowMin = Math.max(tMin, tMax - WINDOW_SIZE);
  const tRange = windowMax - windowMin;

  const stackWidth = width - 50;
  const stackX = 50;

  // Draw time axis at bottom
  const axisY = STACK_COUNT * (STACK_HEIGHT + STACK_GAP) + 5;
  ctx.strokeStyle = '#24292E';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(stackX, axisY);
  ctx.lineTo(stackX + stackWidth, axisY);
  ctx.stroke();

  // Draw time tick marks
  const numTicks = 5;
  ctx.fillStyle = '#24292E';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i <= numTicks; i++) {
    const t = windowMin + (tRange * i) / numTicks;
    const x = stackX + (stackWidth * i) / numTicks;
    ctx.beginPath();
    ctx.moveTo(x, axisY);
    ctx.lineTo(x, axisY + 4);
    ctx.stroke();
    ctx.fillText(t.toFixed(1) + 's', x, axisY + 6);
  }

  stacks.forEach((s, idx) => {
    const yTop = idx * (STACK_HEIGHT + STACK_GAP);

    // Draw stack background with gradient
    const gradient = ctx.createLinearGradient(stackX, yTop, stackX, yTop + STACK_HEIGHT);
    gradient.addColorStop(0, '#FAFBFC');
    gradient.addColorStop(1, '#F8F9FA');
    ctx.fillStyle = gradient;
    ctx.fillRect(stackX, yTop, stackWidth, STACK_HEIGHT);
    ctx.strokeStyle = '#E1E4E8';
    ctx.lineWidth = 1;
    ctx.strokeRect(stackX, yTop, stackWidth, STACK_HEIGHT);

    // Draw grid lines
    ctx.strokeStyle = '#F0F0F0';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 4; i++) {
      const gridY = yTop + (STACK_HEIGHT * i) / 4;
      ctx.beginPath();
      ctx.moveTo(stackX, gridY);
      ctx.lineTo(stackX + stackWidth, gridY);
      ctx.stroke();
    }

    // Draw label with better styling
    ctx.fillStyle = '#24292E';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.name, stackX - 8, yTop + STACK_HEIGHT / 2);

    // Draw range values
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#586069';
    ctx.fillText(s.range[1].toFixed(2), stackX - 8, yTop + 8);
    ctx.fillText(s.range[0].toFixed(2), stackX - 8, yTop + STACK_HEIGHT - 8);

    // Filter data to sliding window
    const windowData = s.data.filter(p => p.t >= windowMin && p.t <= windowMax);

    // Plot data with smooth anti-aliasing
    if (windowData.length < 2) return;

    const [vMin, vMax] = s.range;
    const vRange = vMax - vMin || 1;

    // Draw filled area under curve for better visibility
    ctx.beginPath();
    ctx.moveTo(stackX, yTop + STACK_HEIGHT);
    windowData.forEach((p, i) => {
      const x = stackX + ((p.t - windowMin) / tRange) * stackWidth;
      const y = yTop + STACK_HEIGHT - ((p.v - vMin) / vRange) * STACK_HEIGHT;
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(stackX + stackWidth, yTop + STACK_HEIGHT);
    ctx.closePath();
    ctx.fillStyle = s.color + '20'; // 20 = 12.5% opacity
    ctx.fill();

    // Draw the line
    ctx.beginPath();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    windowData.forEach((p, i) => {
      const x = stackX + ((p.t - windowMin) / tRange) * stackWidth;
      const y = yTop + STACK_HEIGHT - ((p.v - vMin) / vRange) * STACK_HEIGHT;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw current value indicator (dot at the end)
    if (windowData.length > 0) {
      const lastPoint = windowData[windowData.length - 1];
      const x = stackX + ((lastPoint.t - windowMin) / tRange) * stackWidth;
      const y = yTop + STACK_HEIGHT - ((lastPoint.v - vMin) / vRange) * STACK_HEIGHT;

      // Glow effect
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = s.color + '40'; // 40 = 25% opacity
      ctx.fill();

      // Dot
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = s.color;
      ctx.fill();
    }
  });
}
