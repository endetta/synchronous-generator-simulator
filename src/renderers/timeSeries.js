// src/renderers/timeSeries.js
// Canvas-based time series renderer for δ, ω, Pe, Pm.
// Supports single signal view with signal selector.
// Supports DPR (device pixel ratio) scaling for retina displays.
// Features sliding window for smooth visualization over time.

const WINDOW_SIZE = 10; // Show last 10 seconds of data

// Signal configuration
const SIGNALS = {
  delta: { name: 'δ (sudut)', color: '#0366D6', range: [0, Math.PI], unit: 'rad', description: 'Sudut rotor relatif terhadap bus' },
  omega: { name: 'ω (kecepatan)', color: '#D73A49', range: [0.95, 1.05], unit: 'pu', description: 'Kecepatan sudut relatif terhadap sinkron' },
  Pe: { name: 'Pe (daya listrik)', color: '#28A745', range: [0, 2.0], unit: 'pu', description: 'Daya listrik output generator' },
  Pm: { name: 'Pm (daya mekanik)', color: '#F9821C', range: [0, 2.0], unit: 'pu', description: 'Daya mekanik input turbin' },
};

// Current selected signal (default: delta)
let currentSignal = 'delta';

// Listen for signal changes from controls.js
if (typeof window !== 'undefined') {
  window.addEventListener('signal-change', (e) => {
    currentSignal = e.detail.signal;
  });
}

// Compute layout dimensions based on canvas and DPR.
export function getLayout(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 600;
  const height = canvas.clientHeight || 350;

  // Set canvas backing store size
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  return { dpr, width, height };
}

// Render time series for the currently selected signal.
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

  // Clear canvas
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Get current signal configuration
  const signalConfig = SIGNALS[currentSignal];
  const signalData = data[currentSignal];

  if (!signalData || signalData.length === 0) {
    // Fallback to delta if current signal has no data
    if (currentSignal !== 'delta' && data.delta && data.delta.length > 0) {
      // Silent fallback for tests
      return renderTimeSeries(canvas, data);
    }
    console.warn('renderTimeSeries: No data for signal', currentSignal);
    return;
  }

  // Layout constants
  const padding = { top: 40, right: 20, bottom: 50, left: 70 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Determine time range with sliding window
  let tMin = Infinity;
  let tMax = -Infinity;
  signalData.forEach(p => {
    if (p.t < tMin) tMin = p.t;
    if (p.t > tMax) tMax = p.t;
  });
  if (!isFinite(tMin)) { tMin = 0; tMax = 1; }

  // Apply sliding window: show only last WINDOW_SIZE seconds
  const windowMax = tMax;
  const windowMin = Math.max(tMin, tMax - WINDOW_SIZE);
  const tRange = windowMax - windowMin || 1;

  // Value range
  const [vMin, vMax] = signalConfig.range;
  const vRange = vMax - vMin || 1;

  // Draw plot background
  ctx.fillStyle = '#FAFBFC';
  ctx.fillRect(padding.left, padding.top, plotWidth, plotHeight);
  ctx.strokeStyle = '#E1E4E8';
  ctx.lineWidth = 1;
  ctx.strokeRect(padding.left, padding.top, plotWidth, plotHeight);

  // Draw grid lines (major)
  ctx.strokeStyle = '#E1E4E8';
  ctx.lineWidth = 1;

  // Horizontal grid lines (value)
  const numHGrid = 5;
  for (let i = 0; i <= numHGrid; i++) {
    const y = padding.top + (plotHeight * i) / numHGrid;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + plotWidth, y);
    ctx.stroke();
  }

  // Vertical grid lines (time)
  const numVGrid = 10;
  for (let i = 0; i <= numVGrid; i++) {
    const x = padding.left + (plotWidth * i) / numVGrid;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + plotHeight);
    ctx.stroke();
  }

  // Draw minor grid lines
  ctx.strokeStyle = '#F6F8FA';
  ctx.lineWidth = 0.5;
  for (let i = 0.5; i < numVGrid; i++) {
    const x = padding.left + (plotWidth * i) / numVGrid;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + plotHeight);
    ctx.stroke();
  }

  // Draw signal label (title)
  ctx.fillStyle = '#24292E';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(signalConfig.name, padding.left, 12);

  // Draw signal description
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = '#586069';
  ctx.fillText(signalConfig.description, padding.left, 30);

  // Draw Y-axis labels
  ctx.fillStyle = '#24292E';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= numHGrid; i++) {
    const v = vMax - (vRange * i) / numHGrid;
    const y = padding.top + (plotHeight * i) / numHGrid;
    ctx.fillText(v.toFixed(3) + ' ' + signalConfig.unit, padding.left - 8, y);
  }

  // Draw X-axis labels (time)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const numTimeLabels = 5;
  for (let i = 0; i <= numTimeLabels; i++) {
    const t = windowMin + (tRange * i) / numTimeLabels;
    const x = padding.left + (plotWidth * i) / numTimeLabels;
    ctx.fillText(t.toFixed(1) + 's', x, padding.top + plotHeight + 8);
  }

  // Draw axis label
  ctx.fillStyle = '#586069';
  ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Waktu (s)', padding.left + plotWidth / 2, height - 10);

  // Filter data to sliding window
  const windowData = signalData.filter(p => p.t >= windowMin && p.t <= windowMax);

  if (windowData.length < 2) return;

  // Draw filled area under curve
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + plotHeight);
  windowData.forEach((p, i) => {
    const x = padding.left + ((p.t - windowMin) / tRange) * plotWidth;
    const y = padding.top + plotHeight - ((p.v - vMin) / vRange) * plotHeight;
    if (i === 0) ctx.lineTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight);
  ctx.closePath();
  ctx.fillStyle = signalConfig.color + '20'; // 12.5% opacity
  ctx.fill();

  // Draw the line
  ctx.beginPath();
  ctx.strokeStyle = signalConfig.color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  windowData.forEach((p, i) => {
    const x = padding.left + ((p.t - windowMin) / tRange) * plotWidth;
    const y = padding.top + plotHeight - ((p.v - vMin) / vRange) * plotHeight;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Draw reference line (steady state or middle value)
  const refValue = (vMin + vMax) / 2;
  const refY = padding.top + plotHeight - ((refValue - vMin) / vRange) * plotHeight;
  ctx.strokeStyle = '#D73A4940'; // Red with 25% opacity
  ctx.lineWidth = 1;

  // Check if setLineDash exists (not available in all test harnesses)
  if (ctx.setLineDash) {
    ctx.setLineDash([5, 5]);
  }

  ctx.beginPath();
  ctx.moveTo(padding.left, refY);
  ctx.lineTo(padding.left + plotWidth, refY);
  ctx.stroke();

  if (ctx.setLineDash) {
    ctx.setLineDash([]);
  }

  // Draw current value indicator (dot with glow at the end)
  if (windowData.length > 0) {
    const lastPoint = windowData[windowData.length - 1];
    const x = padding.left + ((lastPoint.t - windowMin) / tRange) * plotWidth;
    const y = padding.top + plotHeight - ((lastPoint.v - vMin) / vRange) * plotHeight;

    // Glow effect (larger circle)
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = signalConfig.color + '30'; // 19% opacity
    ctx.fill();

    // Inner dot
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = signalConfig.color;
    ctx.fill();

    // Draw current value label
    ctx.fillStyle = '#24292E';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const valueText = lastPoint.v.toFixed(4) + ' ' + signalConfig.unit;
    const labelX = Math.min(x + 12, padding.left + plotWidth - 60);
    ctx.fillText(valueText, labelX, y);
  }
}
