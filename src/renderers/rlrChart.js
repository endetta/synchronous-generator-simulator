// src/renderers/rlrChart.js
// Canvas-based 24-hour Real Load Response (RLR) chart renderer.
// Displays hourly load profile with period labels (Malam/Pagi/Siang/Sore).

const CHART_HEIGHT = 150;
const LABEL_HEIGHT = 20;

// Render the RLR 24-hour profile chart.
// data: array of { hour, load, period }
// currentHour: highlighted hour (optional)
export function renderRLRChart(canvas, data, currentHour) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 600;
  const height = canvas.clientHeight || (CHART_HEIGHT + LABEL_HEIGHT);

  // Set canvas backing store
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Clear
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  const plotX = 40;
  const plotY = 10;
  const plotW = width - plotX - 10;
  const plotH = CHART_HEIGHT;

  // Draw axes
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotX, plotY);
  ctx.lineTo(plotX, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.stroke();

  // Y-axis labels (load 0.5 to 1.0 pu)
  ctx.fillStyle = '#666';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'right';
  const yTicks = [0.5, 0.75, 1.0];
  yTicks.forEach(val => {
    const y = plotY + plotH * (1 - (val - 0.5) / 0.5);
    ctx.fillText(val.toFixed(2), plotX - 5, y + 3);
    ctx.beginPath();
    ctx.moveTo(plotX - 3, y);
    ctx.lineTo(plotX, y);
    ctx.stroke();
  });

  // Plot bars for each hour
  const barWidth = plotW / 24;
  data.forEach((d, i) => {
    const x = plotX + i * barWidth;
    const h = (d.load - 0.5) / 0.5 * plotH;
    const y = plotY + plotH - h;

    // Color by period
    let color = '#1E90FF'; // default blue
    if (d.period === 'Pagi') color = '#FFD700'; // gold
    else if (d.period === 'Siang') color = '#FF6347'; // tomato
    else if (d.period === 'Sore') color = '#FF8C00'; // orange
    else if (d.period === 'Malam') color = '#4B0082'; // indigo

    // Highlight current hour
    if (i === currentHour) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y - 2, barWidth - 1, h + 4);
    }

    // Draw bar
    ctx.fillStyle = color;
    ctx.fillRect(x, y, barWidth - 1, h);
  });

  // X-axis labels (every 3 hours)
  ctx.fillStyle = '#666';
  ctx.textAlign = 'center';
  for (let i = 0; i < 24; i += 3) {
    const x = plotX + (i + 0.5) * barWidth;
    ctx.fillText(i.toString(), x, plotY + plotH + 12);
  }

  // Title
  ctx.fillStyle = '#000';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('24-Hour Load Profile (RLR)', width / 2, height - 5);
}

// Compute load statistics
export function computeRLRStats(data) {
  const loads = data.map(d => d.load);
  const minLoad = Math.min(...loads);
  const maxLoad = Math.max(...loads);
  const avgLoad = loads.reduce((a, b) => a + b, 0) / loads.length;

  return { minLoad, maxLoad, avgLoad };
}
