/**
 * cursorSync.js - Cursor sync & crosshair readout for time series
 *
 * Fitur:
 * - Hover di chart → vertical line sync
 * - Crosshair readout (t, value)
 * - Mouse tracking dengan smooth animation
 */

// State untuk cursor sync
const cursorState = {
  active: false,
  x: 0,
  y: 0,
  time: 0,
  value: 0,
  canvasRect: null,
};

// Subscribers untuk sync event
const subscribers = [];

/**
 * Subscribe to cursor updates
 * @param {Function} callback - Function to call on cursor update
 */
export function subscribe(callback) {
  subscribers.push(callback);
  return () => {
    const idx = subscribers.indexOf(callback);
    if (idx >= 0) subscribers.splice(idx, 1);
  };
}

/**
 * Notify all subscribers of cursor update
 */
function notifySubscribers() {
  subscribers.forEach(cb => cb(cursorState));
}

/**
 * Setup cursor tracking pada canvas
 * @param {HTMLCanvasElement} canvas - Target canvas
 * @param {Object} options - Configuration options
 * @param {Function} options.getData - Function to get data array for value lookup
 * @param {Function} options.getTimeRange - Function to get [tMin, tMax] range
 * @param {Function} options.getValueRange - Function to get [vMin, vMax] range
 */
export function setupCursorTracking(canvas, options = {}) {
  const { getData, getTimeRange, getValueRange } = options;

  // Track mouse enter
  canvas.addEventListener('mouseenter', (e) => {
    cursorState.active = true;
    cursorState.canvasRect = canvas.getBoundingClientRect();
    notifySubscribers();
  });

  // Track mouse move
  canvas.addEventListener('mousemove', (e) => {
    if (!cursorState.active) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cursorState.x = x;
    cursorState.y = y;

    // Calculate time from x position
    if (getTimeRange) {
      const [tMin, tMax] = getTimeRange();
      const padding = { left: 60, right: 20 };
      const plotW = canvas.width - padding.left - padding.right;
      const normalizedX = Math.max(0, Math.min(1, (x - padding.left) / plotW));
      cursorState.time = tMin + normalizedX * (tMax - tMin);
    }

    // Calculate value from y position
    if (getValueRange) {
      const [vMin, vMax] = getValueRange();
      const padding = { top: 20, bottom: 30 };
      const plotH = canvas.height - padding.top - padding.bottom;
      const normalizedY = Math.max(0, Math.min(1, (y - padding.top) / plotH));
      cursorState.value = vMax - normalizedY * (vMax - vMin);
    }

    // Find exact value from data if available
    if (getData && cursorState.time > 0) {
      const data = getData();
      if (data && data.length > 0) {
        // Find closest data point
        let closest = data[0];
        let minDist = Math.abs(data[0].t - cursorState.time);

        for (let i = 1; i < data.length; i++) {
          const dist = Math.abs(data[i].t - cursorState.time);
          if (dist < minDist) {
            minDist = dist;
            closest = data[i];
          }
        }

        cursorState.value = closest.v;
      }
    }

    notifySubscribers();
  });

  // Track mouse leave
  canvas.addEventListener('mouseleave', () => {
    cursorState.active = false;
    notifySubscribers();
  });
}

/**
 * Get current cursor state
 * @returns {Object} Current cursor state
 */
export function getCursorState() {
  return { ...cursorState };
}

/**
 * Draw crosshair on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Target canvas
 * @param {Object} options - Drawing options
 */
export function drawCrosshair(ctx, canvas, options = {}) {
  if (!cursorState.active) return;

  const { color = '#D73A49', lineWidth = 1, dashPattern = [4, 4] } = options;
  const padding = { left: 60, right: 20, top: 20, bottom: 30 };

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(dashPattern);

  // Vertical line
  ctx.beginPath();
  ctx.moveTo(cursorState.x, padding.top);
  ctx.lineTo(cursorState.x, canvas.height - padding.bottom);
  ctx.stroke();

  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(padding.left, cursorState.y);
  ctx.lineTo(canvas.width - padding.right, cursorState.y);
  ctx.stroke();

  ctx.restore();
}

/**
 * Create tooltip element for readout
 * @param {HTMLElement} container - Container to append tooltip
 * @returns {HTMLElement} Tooltip element
 */
export function createTooltip(container) {
  const tooltip = document.createElement('div');
  tooltip.className = 'cursor-tooltip';
  tooltip.style.cssText = `
    position: absolute;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #D73A49;
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 12px;
    font-family: 'Consolas', 'Monaco', monospace;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
    z-index: 1000;
  `;
  container.appendChild(tooltip);
  return tooltip;
}

/**
 * Update tooltip content and position
 * @param {HTMLElement} tooltip - Tooltip element
 * @param {Object} state - Cursor state
 * @param {string} signalName - Signal name for display
 * @param {string} unit - Unit for value display
 */
export function updateTooltip(tooltip, state, signalName, unit) {
  if (!state.active) {
    tooltip.style.opacity = '0';
    return;
  }

  tooltip.innerHTML = `
    <div style="color: #6A737D; margin-bottom: 4px;">${signalName}</div>
    <div style="display: flex; gap: 16px;">
      <div>
        <span style="color: #6A737D;">t = </span>
        <span style="color: #24292E; font-weight: 600;">${state.time.toFixed(3)}s</span>
      </div>
      <div>
        <span style="color: #6A737D;">value = </span>
        <span style="color: #D73A49; font-weight: 600;">${state.value.toFixed(4)} ${unit}</span>
      </div>
    </div>
  `;

  tooltip.style.opacity = '1';

  // Position tooltip near cursor
  const rect = tooltip.parentElement.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  let left = state.x + 15;
  let top = state.y - tooltipRect.height - 10;

  // Keep within bounds
  if (left + tooltipRect.width > rect.width) {
    left = state.x - tooltipRect.width - 15;
  }
  if (top < 0) {
    top = state.y + 20;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

/**
 * Draw time marker on canvas (vertical line at specific time)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Target canvas
 * @param {number} time - Time value to mark
 * @param {Object} timeRange - [tMin, tMax] range
 * @param {Object} options - Drawing options
 */
export function drawTimeMarker(ctx, canvas, time, timeRange, options = {}) {
  const [tMin, tMax] = timeRange;
  if (time < tMin || time > tMax) return;

  const { color = '#D73A49', lineWidth = 1, dashPattern = [4, 4] } = options;
  const padding = { left: 60, right: 20, top: 20, bottom: 30 };
  const plotW = canvas.width - padding.left - padding.right;

  const x = padding.left + ((time - tMin) / (tMax - tMin)) * plotW;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(dashPattern);

  ctx.beginPath();
  ctx.moveTo(x, padding.top);
  ctx.lineTo(x, canvas.height - padding.bottom);
  ctx.stroke();

  ctx.restore();
}
