/**
 * tooltipManager.js - Manages cursor tooltip for time series
 *
 * Subscribes to cursor sync events and updates tooltip display
 * OPTIMIZED: Cache DOM elements, use textContent instead of innerHTML, rAF throttle
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
let containerElement = null;

// Cached DOM elements for tooltip content (avoid innerHTML)
let signalNameEl = null;
let timeValueEl = null;
let dataValueEl = null;

// rAF throttling
let tooltipRafId = null;
let pendingCursorState = null;

// Cached layout (invalidate on resize)
let cachedContainerRect = null;

/**
 * Initialize tooltip manager
 */
export function initTooltipManager() {
  tooltipElement = document.getElementById('cursor-tooltip');
  containerElement = document.getElementById('timeseries-container');

  if (!tooltipElement) {
    console.warn('tooltipManager: cursor-tooltip element not found');
    return;
  }

  // Create cached DOM structure once
  buildTooltipStructure();

  // Listen for cursor sync events from timeSeries.js
  window.addEventListener('cursor-sync', (e) => {
    // Throttle with rAF - skip if already pending
    if (tooltipRafId) {
      pendingCursorState = e.detail;
      return;
    }

    tooltipRafId = requestAnimationFrame(() => {
      tooltipRafId = null;
      const state = pendingCursorState || e.detail;
      pendingCursorState = null;
      updateTooltip(state);
    });
  });

  // Listen for signal changes
  window.addEventListener('signal-change', (e) => {
    currentSignal = e.detail.signal;
    // Update signal name immediately
    if (signalNameEl && SIGNALS[currentSignal]) {
      signalNameEl.textContent = SIGNALS[currentSignal].name;
    }
  });

  // Invalidate container rect cache on resize
  window.addEventListener('resize', () => {
    cachedContainerRect = null;
  });
}

/**
 * Build tooltip DOM structure once (avoid innerHTML every frame)
 */
function buildTooltipStructure() {
  tooltipElement.innerHTML = `
    <div id="tt-signal-name" style="color: #6A737D; margin-bottom: 4px; font-size: 10px;"></div>
    <div style="display: flex; gap: 16px;">
      <div>
        <span style="color: #6A737D;">t = </span>
        <span id="tt-time-value" style="color: #24292E; font-weight: 600;"></span>
      </div>
      <div>
        <span style="color: #6A737D;">value = </span>
        <span id="tt-data-value" style="color: #D73A49; font-weight: 600;"></span>
      </div>
    </div>
  `;

  // Cache references to dynamic elements
  signalNameEl = document.getElementById('tt-signal-name');
  timeValueEl = document.getElementById('tt-time-value');
  dataValueEl = document.getElementById('tt-data-value');
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

  // Update text content only (no innerHTML)
  if (signalNameEl) signalNameEl.textContent = signal.name;
  if (timeValueEl) timeValueEl.textContent = `${cursorState.time.toFixed(3)}s`;
  if (dataValueEl) dataValueEl.textContent = `${cursorState.value.toFixed(4)} ${signal.unit}`;

  tooltipElement.style.opacity = '1';

  // Get container rect (cached)
  if (!cachedContainerRect && containerElement) {
    cachedContainerRect = containerElement.getBoundingClientRect();
  }

  if (!cachedContainerRect) return;

  // Use fixed tooltip size instead of getBoundingClientRect (avoid reflow)
  const tooltipWidth = 200;  // Approximate width
  const tooltipHeight = 50;  // Approximate height

  let left = cursorState.x + 15;
  let top = cursorState.y - tooltipHeight - 10;

  // Keep within bounds
  if (left + tooltipWidth > cachedContainerRect.width) {
    left = cursorState.x - tooltipWidth - 15;
  }
  if (top < 0) {
    top = cursorState.y + 20;
  }

  tooltipElement.style.left = `${left}px`;
  tooltipElement.style.top = `${top}px`;
}
