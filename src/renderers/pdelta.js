// src/renderers/pdelta.js
// SVG P-δ curve renderer with Equal Area Criterion shading.
// Renders the sinusoidal power-angle curve Pe = Pmax*sin(δ),
// current operating point, and EAC areas (A1, A2) when available.
//
// OPTIMIZED: Separates static and dynamic elements to avoid DOM thrashing.
// Static elements are created once; dynamic elements updated via attributes.

const VIEWBOX_W = 360;
const VIEWBOX_H = 200;
const PADDING = { left: 30, right: 20, top: 20, bottom: 30 };

// Cache for static elements (initialized once)
let staticElementsCache = null;
let dynamicElements = null;

// Convert (delta, Pe) in physical units to SVG coordinates.
function toSvg(delta, pe, scaleX, scaleY) {
  return {
    x: PADDING.left + delta * scaleX,
    y: PADDING.top + (VIEWBOX_H - PADDING.top - PADDING.bottom) * (1 - pe / (scaleY > 0 ? scaleY * 1.0 : 1)),
  };
}

// Create static elements (grid, axes, labels, curves) once
function createStaticElements(svg, params) {
  const { Pmax = 2.0, deltaMax = Math.PI } = params;
  const plotW = VIEWBOX_W - PADDING.left - PADDING.right;
  const plotH = VIEWBOX_H - PADDING.top - PADDING.bottom;
  const scaleX = plotW / deltaMax;
  const scaleY = plotH / (Pmax * 1.1);

  // Use DocumentFragment for batch insert (no reflow until appended)
  const fragment = document.createDocumentFragment();

  // Create a group for static elements
  const staticGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  staticGroup.setAttribute('id', 'static-layer');

  // Draw grid lines (static - never changes)
  const gridColor = '#F0F0F0';
  for (let i = 0; i <= 10; i++) {
    const x = PADDING.left + (plotW * i) / 10;
    const y = PADDING.top + (plotH * i) / 10;

    // Vertical grid line
    const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    vLine.setAttribute('x1', x);
    vLine.setAttribute('y1', PADDING.top);
    vLine.setAttribute('x2', x);
    vLine.setAttribute('y2', VIEWBOX_H - PADDING.bottom);
    vLine.setAttribute('stroke', gridColor);
    vLine.setAttribute('stroke-width', '0.5');
    staticGroup.appendChild(vLine);

    // Horizontal grid line
    const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hLine.setAttribute('x1', PADDING.left);
    hLine.setAttribute('y1', y);
    hLine.setAttribute('x2', VIEWBOX_W - PADDING.right);
    hLine.setAttribute('y2', y);
    hLine.setAttribute('stroke', gridColor);
    hLine.setAttribute('stroke-width', '0.5');
    staticGroup.appendChild(hLine);
  }

  // Draw axes (static)
  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('x1', PADDING.left);
  xAxis.setAttribute('y1', VIEWBOX_H - PADDING.bottom);
  xAxis.setAttribute('x2', VIEWBOX_W - PADDING.right);
  xAxis.setAttribute('y2', VIEWBOX_H - PADDING.bottom);
  xAxis.setAttribute('stroke', '#24292E');
  xAxis.setAttribute('stroke-width', '1.5');
  staticGroup.appendChild(xAxis);

  const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  yAxis.setAttribute('x1', PADDING.left);
  yAxis.setAttribute('y1', PADDING.top);
  yAxis.setAttribute('x2', PADDING.left);
  yAxis.setAttribute('y2', VIEWBOX_H - PADDING.bottom);
  yAxis.setAttribute('stroke', '#24292E');
  yAxis.setAttribute('stroke-width', '1.5');
  staticGroup.appendChild(yAxis);

  // Build sinusoidal curve path (static - same curve every frame)
  const N = 100;
  let pathD = '';
  for (let i = 0; i <= N; i++) {
    const d = (deltaMax * i) / N;
    const p = Pmax * Math.sin(d);
    const svg_x = PADDING.left + d * scaleX;
    const svg_y = PADDING.top + plotH * (1 - p / (Pmax * 1.1));
    pathD += (i === 0 ? 'M' : 'L') + svg_x.toFixed(2) + ',' + svg_y.toFixed(2) + ' ';
  }

  const curve = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  curve.setAttribute('d', pathD);
  curve.setAttribute('fill', 'none');
  curve.setAttribute('stroke', '#0366D6');
  curve.setAttribute('stroke-width', '2.5');
  staticGroup.appendChild(curve);

  // X-axis tick marks and labels (static)
  const ticks = [
    { d: 0, label: '0' },
    { d: Math.PI / 2, label: 'π/2' },
    { d: Math.PI, label: 'π' },
  ];

  ticks.forEach(({ d, label }) => {
    const x = PADDING.left + d * scaleX;

    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tick.setAttribute('x1', x);
    tick.setAttribute('y1', VIEWBOX_H - PADDING.bottom);
    tick.setAttribute('x2', x);
    tick.setAttribute('y2', VIEWBOX_H - PADDING.bottom + 4);
    tick.setAttribute('stroke', '#24292E');
    tick.setAttribute('stroke-width', '1.5');
    staticGroup.appendChild(tick);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', VIEWBOX_H - PADDING.bottom + 14);
    text.setAttribute('fill', '#24292E');
    text.setAttribute('font-size', '9');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-weight', '600');
    text.textContent = label;
    staticGroup.appendChild(text);
  });

  // Y-axis tick marks and labels (static)
  const yTicks = [
    { p: 0, label: '0' },
    { p: Pmax / 2, label: (Pmax / 2).toFixed(1) },
    { p: Pmax, label: Pmax.toFixed(1) },
  ];

  yTicks.forEach(({ p, label }) => {
    const y = PADDING.top + plotH * (1 - p / (Pmax * 1.1));

    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tick.setAttribute('x1', PADDING.left - 4);
    tick.setAttribute('y1', y);
    tick.setAttribute('x2', PADDING.left);
    tick.setAttribute('y2', y);
    tick.setAttribute('stroke', '#24292E');
    tick.setAttribute('stroke-width', '1.5');
    staticGroup.appendChild(tick);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', PADDING.left - 8);
    text.setAttribute('y', y + 3);
    text.setAttribute('fill', '#24292E');
    text.setAttribute('font-size', '9');
    text.setAttribute('text-anchor', 'end');
    text.setAttribute('font-weight', '600');
    text.textContent = label;
    staticGroup.appendChild(text);
  });

  // Axis labels (static)
  const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  xLabel.setAttribute('x', VIEWBOX_W / 2);
  xLabel.setAttribute('y', VIEWBOX_H - 5);
  xLabel.setAttribute('fill', '#24292E');
  xLabel.setAttribute('font-size', '10');
  xLabel.setAttribute('text-anchor', 'middle');
  xLabel.setAttribute('font-weight', '600');
  xLabel.textContent = 'δ (rad)';
  staticGroup.appendChild(xLabel);

  const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  yLabel.setAttribute('x', '5');
  yLabel.setAttribute('y', VIEWBOX_H / 2);
  yLabel.setAttribute('fill', '#24292E');
  yLabel.setAttribute('font-size', '10');
  yLabel.setAttribute('text-anchor', 'middle');
  yLabel.setAttribute('transform', `rotate(-90, 10, ${VIEWBOX_H / 2})`);
  yLabel.setAttribute('font-weight', '600');
  yLabel.textContent = 'Pe (pu)';
  staticGroup.appendChild(yLabel);

  fragment.appendChild(staticGroup);

  return { fragment, scaleX, scaleY, plotH, Pmax };
}

// Create dynamic elements container (will be updated every frame)
function createDynamicElements() {
  const dynamicGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  dynamicGroup.setAttribute('id', 'dynamic-layer');

  // Pm line (dynamic - position changes)
  const pmLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  pmLine.setAttribute('id', 'pm-line');
  pmLine.setAttribute('x1', PADDING.left);
  pmLine.setAttribute('x2', VIEWBOX_W - PADDING.right);
  pmLine.setAttribute('stroke', '#586069');
  pmLine.setAttribute('stroke-width', '1.5');
  pmLine.setAttribute('stroke-dasharray', '4,2');
  dynamicGroup.appendChild(pmLine);

  // Pm label (dynamic)
  const pmLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  pmLabel.setAttribute('id', 'pm-label');
  pmLabel.setAttribute('x', VIEWBOX_W - PADDING.right - 30);
  pmLabel.setAttribute('font-size', '10');
  pmLabel.setAttribute('font-weight', '600');
  dynamicGroup.appendChild(pmLabel);

  // δCC line (dynamic - may not exist)
  const ccLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  ccLine.setAttribute('id', 'cc-line');
  ccLine.setAttribute('stroke', '#F9821C');
  ccLine.setAttribute('stroke-width', '1');
  ccLine.setAttribute('stroke-dasharray', '3,3');
  ccLine.style.display = 'none';
  dynamicGroup.appendChild(ccLine);

  // δCC label (dynamic)
  const ccLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  ccLabel.setAttribute('id', 'cc-label');
  ccLabel.setAttribute('fill', '#F9821C');
  ccLabel.setAttribute('font-size', '9');
  ccLabel.setAttribute('text-anchor', 'middle');
  ccLabel.setAttribute('font-weight', '600');
  ccLabel.style.display = 'none';
  dynamicGroup.appendChild(ccLabel);

  // A1 area (dynamic)
  const a1Area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  a1Area.setAttribute('id', 'a1-area');
  a1Area.setAttribute('fill', 'rgba(255,100,0,0.25)');
  a1Area.setAttribute('stroke', '#F9821C');
  a1Area.setAttribute('stroke-width', '1');
  a1Area.style.display = 'none';
  dynamicGroup.appendChild(a1Area);

  // A2 area (dynamic)
  const a2Area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  a2Area.setAttribute('id', 'a2-area');
  a2Area.setAttribute('fill', 'rgba(40,167,69,0.15)');
  a2Area.setAttribute('stroke', '#28A745');
  a2Area.setAttribute('stroke-width', '1');
  a2Area.style.display = 'none';
  dynamicGroup.appendChild(a2Area);

  // Operating point glow (dynamic)
  const opGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  opGlow.setAttribute('id', 'op-glow');
  opGlow.setAttribute('r', '8');
  opGlow.setAttribute('opacity', '0.3');
  opGlow.style.display = 'none';
  dynamicGroup.appendChild(opGlow);

  // Operating point (dynamic - main dot)
  const opPoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  opPoint.setAttribute('id', 'op-point');
  opPoint.setAttribute('r', '5');
  opPoint.setAttribute('stroke', '#24292E');
  opPoint.setAttribute('stroke-width', '1.5');
  dynamicGroup.appendChild(opPoint);

  // Status text (dynamic)
  const statusText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  statusText.setAttribute('id', 'status-text');
  statusText.setAttribute('x', VIEWBOX_W / 2);
  statusText.setAttribute('y', '12');
  statusText.setAttribute('font-size', '10');
  statusText.setAttribute('text-anchor', 'middle');
  statusText.setAttribute('font-weight', '600');
  dynamicGroup.appendChild(statusText);

  // CCT text (dynamic - shown when deltaCC is valid)
  const cctText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  cctText.setAttribute('id', 'cct-text');
  cctText.setAttribute('x', VIEWBOX_W - PADDING.right - 5);
  cctText.setAttribute('y', VIEWBOX_H - PADDING.bottom - 5);
  cctText.setAttribute('font-size', '9');
  cctText.setAttribute('text-anchor', 'end');
  cctText.setAttribute('fill', '#0366D6');
  cctText.setAttribute('font-weight', '600');
  cctText.style.display = 'none';
  dynamicGroup.appendChild(cctText);

  return { dynamicGroup, pmLine, pmLabel, ccLine, ccLabel, a1Area, a2Area, opGlow, opPoint, statusText, cctText };
}

// Initialize the SVG with static and dynamic layers
function initSvg(svg, params) {
  // Clear everything
  svg.innerHTML = '';

  // Create and append static elements
  const { fragment, scaleX, scaleY, plotH, Pmax } = createStaticElements(svg, params);
  svg.appendChild(fragment);

  // Create and append dynamic elements
  dynamicElements = createDynamicElements();
  svg.appendChild(dynamicElements.dynamicGroup);

  staticElementsCache = { scaleX, scaleY, plotH, Pmax, deltaMax: params.deltaMax || Math.PI };

  return staticElementsCache;
}

// Render the P-δ curve into the SVG element.
// state: { delta, Pe, Pm, deltaCC?, running, stabilityMargin }
// params: { Pmax, deltaMax? }
export function renderPDelta(svg, state, params) {
  const { delta, Pe, Pm, deltaCC = 0, running, stabilityMargin = 0 } = state;
  const { Pmax = 2.0, deltaMax = Math.PI } = params;

  // Initialize if not cached or params changed
  if (!staticElementsCache || staticElementsCache.Pmax !== Pmax || staticElementsCache.deltaMax !== deltaMax) {
    initSvg(svg, params);
  }

  const { scaleX, scaleY, plotH } = staticElementsCache;

  // Update dynamic elements via attributes (no innerHTML!)

  // Update Pm line position
  if (Pm !== undefined && dynamicElements) {
    const pmY = PADDING.top + plotH * (1 - Pm / (Pmax * 1.1));
    const pmColor = running ? '#28A745' : '#586069';
    const dashArray = running ? '6,3' : '4,2';

    dynamicElements.pmLine.setAttribute('y1', pmY.toFixed(2));
    dynamicElements.pmLine.setAttribute('y2', pmY.toFixed(2));
    dynamicElements.pmLine.setAttribute('stroke', pmColor);
    dynamicElements.pmLine.setAttribute('stroke-dasharray', dashArray);

    dynamicElements.pmLabel.setAttribute('y', (pmY - 3).toFixed(2));
    dynamicElements.pmLabel.setAttribute('fill', pmColor);
    dynamicElements.pmLabel.textContent = `Pm=${Pm.toFixed(2)}`;
  }

  // Update EAC areas and δCC marker
  if (dynamicElements) {
    if (deltaCC > 0 && deltaCC < deltaMax && Pm !== undefined) {
      const pmY = PADDING.top + plotH * (1 - Pm / (Pmax * 1.1));
      const ccX = PADDING.left + deltaCC * scaleX;
      const ccY = PADDING.top + plotH * (1 - Pmax * Math.sin(deltaCC) / (Pmax * 1.1));

      // A1 area
      const a1Path = `M${PADDING.left},${pmY} L${ccX.toFixed(2)},${pmY} L${ccX.toFixed(2)},${ccY.toFixed(2)} Z`;
      dynamicElements.a1Area.setAttribute('d', a1Path);
      dynamicElements.a1Area.style.display = 'block';

      // A2 area - build path along curve
      let a2Path = `M${ccX.toFixed(2)},${ccY.toFixed(2)} `;
      const N_a2 = 50;
      for (let i = 0; i <= N_a2; i++) {
        const d = deltaCC + ((deltaMax - deltaCC) * i) / N_a2;
        const p = Pmax * Math.sin(d);
        const svg_x = PADDING.left + d * scaleX;
        const svg_y = PADDING.top + plotH * (1 - p / (Pmax * 1.1));
        a2Path += `L${svg_x.toFixed(2)},${svg_y.toFixed(2)} `;
      }
      const maxX = PADDING.left + deltaMax * scaleX;
      a2Path += `L${maxX.toFixed(2)},${pmY} L${ccX.toFixed(2)},${pmY} Z`;
      dynamicElements.a2Area.setAttribute('d', a2Path);
      dynamicElements.a2Area.style.display = 'block';

      // δCC line and label
      dynamicElements.ccLine.setAttribute('x1', ccX);
      dynamicElements.ccLine.setAttribute('x2', ccX);
      dynamicElements.ccLine.setAttribute('y1', PADDING.top);
      dynamicElements.ccLine.setAttribute('y2', VIEWBOX_H - PADDING.bottom);
      dynamicElements.ccLine.style.display = 'block';

      dynamicElements.ccLabel.setAttribute('x', ccX);
      dynamicElements.ccLabel.setAttribute('y', PADDING.top + 10);
      dynamicElements.ccLabel.textContent = 'δcc';
      dynamicElements.ccLabel.style.display = 'block';
    } else {
      // Hide EAC elements when not needed
      dynamicElements.a1Area.style.display = 'none';
      dynamicElements.a2Area.style.display = 'none';
      dynamicElements.ccLine.style.display = 'none';
      dynamicElements.ccLabel.style.display = 'none';
    }

    // Update operating point
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
      dynamicElements.opGlow.setAttribute('cx', pointX.toFixed(2));
      dynamicElements.opGlow.setAttribute('cy', pointY.toFixed(2));
      dynamicElements.opGlow.setAttribute('fill', pointColor);
      dynamicElements.opGlow.style.display = 'block';
    } else {
      dynamicElements.opGlow.style.display = 'none';
    }

    dynamicElements.opPoint.setAttribute('cx', pointX.toFixed(2));
    dynamicElements.opPoint.setAttribute('cy', pointY.toFixed(2));
    dynamicElements.opPoint.setAttribute('r', pointSize);
    dynamicElements.opPoint.setAttribute('fill', pointColor);

    // Update status text
    const statusColor = running ? '#28A745' : '#586069';
    const statusText = running ? '● RUNNING' : '○ STOPPED';
    dynamicElements.statusText.setAttribute('fill', statusColor);
    dynamicElements.statusText.textContent = statusText;

    // Update CCT text if available
    if (state.cct !== undefined && state.cct > 0 && state.cct < Infinity) {
      dynamicElements.cctText.textContent = `CCT = ${state.cct.toFixed(3)} s`;
      dynamicElements.cctText.style.display = 'block';
    } else {
      dynamicElements.cctText.style.display = 'none';
    }
  }

  return svg.innerHTML;
}

// Export for testing
export { staticElementsCache, dynamicElements };
