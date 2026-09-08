/**
 * infoPanel.js - Info panel for stability margin, time elapsed, scenario
 *
 * Menampilkan informasi real-time tentang status simulasi.
 */

let infoPanelElement = null;
let updateInterval = null;

/**
 * Initialize info panel
 * @param {Object} state - Simulation state reference
 */
export function initInfoPanel(state) {
  // Create info panel element
  infoPanelElement = document.createElement('div');
  infoPanelElement.id = 'info-panel';
  infoPanelElement.style.cssText = `
    position: fixed;
    top: 70px;
    right: 10px;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #E1E4E8;
    border-radius: 6px;
    padding: 12px 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    font-size: 12px;
    z-index: 900;
    min-width: 200px;
  `;

  document.body.appendChild(infoPanelElement);

  // Update panel every 100ms
  updateInterval = setInterval(() => {
    updateInfoPanel(state);
  }, 100);
}

/**
 * Update info panel content
 * @param {Object} state - Current simulation state
 */
function updateInfoPanel(state) {
  if (!infoPanelElement) return;

  // Format time elapsed
  const minutes = Math.floor(state.simTime / 60);
  const seconds = (state.simTime % 60).toFixed(1);
  const timeStr = `${minutes}:${seconds.padStart(4, '0')}`;

  // Stability status
  const isStable = state.stabilityMargin > 0.1;
  const stabilityText = isStable ? 'Stabil' : 'Tidak Stabil';
  const stabilityColor = isStable ? '#28A745' : '#D73A49';

  // Current scenario (from window.__app if available)
  let scenarioText = 'Steady State';
  if (typeof window !== 'undefined' && window.__app && window.__app.currentScenario) {
    scenarioText = window.__app.currentScenario;
  }

  // Running status
  const runningText = state.running ? 'Berjalan' : 'Dihentikan';
  const runningColor = state.running ? '#28A745' : '#959DA5';

  infoPanelElement.innerHTML = `
    <div style="font-weight: 600; color: #24292E; margin-bottom: 8px; font-size: 13px;">
      Status Simulasi
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px;">
      <!-- Running Status -->
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #586069;">Status:</span>
        <span style="color: ${runningColor}; font-weight: 600;">
          ${runningText}
        </span>
      </div>

      <!-- Time Elapsed -->
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #586069;">Waktu:</span>
        <span style="font-family: 'Consolas', monospace; font-weight: 600; color: #24292E;">
          ${timeStr}
        </span>
      </div>

      <!-- Stability Margin -->
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #586069;">Stabilitas:</span>
        <span style="color: ${stabilityColor}; font-weight: 600;">
          ${stabilityText}
        </span>
      </div>

      <!-- Margin Value -->
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #586069;">Margin:</span>
        <span style="font-family: 'Consolas', monospace; color: #24292E;">
          ${state.stabilityMargin.toFixed(3)}
        </span>
      </div>

      <!-- Current Scenario -->
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #586069;">Skenario:</span>
        <span style="color: #24292E; font-weight: 600;">
          ${scenarioText}
        </span>
      </div>

      <!-- Fault Status -->
      ${state.faultOn ? `
        <div style="
          margin-top: 6px;
          padding: 4px 8px;
          background: #F8D7DA;
          border-left: 3px solid #D73A49;
          border-radius: 3px;
          color: #C62828;
          font-weight: 600;
          text-align: center;
        ">
          ⚠ GANGGUAN AKTIF
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Cleanup info panel
 */
export function cleanupInfoPanel() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }

  if (infoPanelElement && infoPanelElement.parentNode) {
    infoPanelElement.parentNode.removeChild(infoPanelElement);
    infoPanelElement = null;
  }
}
