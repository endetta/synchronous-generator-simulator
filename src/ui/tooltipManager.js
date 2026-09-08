/**
 * tooltipManager.js - Manages cursor tooltip for time series
 *
 * Subscribes to cursor sync events and updates tooltip display
 */

// Signal metadata (match with timeSeries.js)
const SIGNALS = {
  delta: { name: 'δ (sudut)', unit: 'rad', description: 'Sudut rotor relatif terhadap bus' },
  omega: { name: 'ω (kecepatan)', unit: 'pu', description: 'Kecepatan sudut relatif terhadap sinkron' },
  Pe: { name: 'Pe (daya listrik)', unit: 'pu', description: 'Daya listrik output generator' },
  Pm: { name: 'Pm (daya mekanik)', unit: 'pu', description: 'Daya mekanik input turbin' },
};

let currentSignal = 'delta';
let tooltipElement = null;

/**
 * Initialize tooltip manager
 */
export function initTooltipManager() {
  tooltipElement = document.getElementById('cursor-tooltip');
  if (!tooltipElement) {
    console.warn('tooltipManager: cursor-tooltip element not found');
    return;
  }

  // Listen for cursor sync events from timeSeries.js
  window.addEventListener('cursor-sync', (e) => {
    updateTooltip(e.detail);
  });

  // Listen for signal changes
  window.addEventListener('signal-change', (e) => {
    currentSignal = e.detail.signal;
  });
}

/**
 * Update tooltip based on cursor state
 * @param {Object} cursorState - Current cursor state from cursorSync
 */
function updateTooltip(cursorState) {
  if (!tooltipElement) return;

  if (!cursorState.active) {
    tooltipElement.style.opacity = '0';
    return;
  }

  const signal = SIGNALS[currentSignal];
  if (!signal) return;

  // Update tooltip content
  tooltipElement.innerHTML = `
    <div style="color: #6A737D; margin-bottom: 4px; font-size: 10px;">${signal.name}</div>
    <div style="display: flex; gap: 16px;">
      <div>
        <span style="color: #6A737D;">t = </span>
        <span style="color: #24292E; font-weight: 600;">${cursorState.time.toFixed(3)}s</span>
      </div>
      <div>
        <span style="color: #6A737D;">value = </span>
        <span style="color: #D73A49; font-weight: 600;">${cursorState.value.toFixed(4)} ${signal.unit}</span>
      </div>
    </div>
  `;

  tooltipElement.style.opacity = '1';

  // Position tooltip near cursor (relative to timeseries-container)
  const container = document.getElementById('timeseries-container');
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const tooltipRect = tooltipElement.getBoundingClientRect();

  let left = cursorState.x + 15;
  let top = cursorState.y - tooltipRect.height - 10;

  // Keep within bounds
  if (left + tooltipRect.width > rect.width) {
    left = cursorState.x - tooltipRect.width - 15;
  }
  if (top < 0) {
    top = cursorState.y + 20;
  }

  tooltipElement.style.left = `${left}px`;
  tooltipElement.style.top = `${top}px`;
}
