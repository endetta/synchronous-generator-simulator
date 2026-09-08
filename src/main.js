// src/main.js
// Main orchestrator: imports physics, renderers, UI, and starts the simulation loop.

import { state, onChange, commit } from './state.js';
import { CONSTANTS } from './constants.js';
import { rk4Step, computePe } from './physics/swing.js';
import { makeTgov1State, tgov1Step } from './physics/tgov1.js';
import { computeCriticalClearingAngle, checkStability } from './physics/eac.js';
import { getRLRLoad } from './physics/rlr.js';
import { renderPhasor } from './renderers/phasor.js';
import { renderPDelta } from './renderers/pdelta.js';
import { renderTimeSeries } from './renderers/timeSeries.js';
import { renderRLRChart } from './renderers/rlrChart.js';
import { initControls, updateStatusDisplay } from './ui/controls.js';
import { initPanels } from './ui/panels.js';
import { initTooltip } from './ui/tooltip.js';
import { checkOOS } from './ui/oosAlarm.js';
import { applyScenario, SCENARIOS } from './scenarios.js';

// ──────────────────────────────────────────────────────────
// INITIALIZATION
// ──────────────────────────────────────────────────────────

let governorState = makeTgov1State();
let lastFrameTime = 0;
let history = {
  delta: [], omega: [], Pe: [], Pm: [], simTime: [],
};

// Initialize DOM elements and event handlers
function initializeApp() {
  console.log('Initializing Synchronous Generator Simulator...');

  // Apply startup scenario FIRST (before any rendering)
  applyScenario(state, 'steadyState');

  // Compute initial Pe from delta
  state.Pe = computePe(state.delta, CONSTANTS.Pmax);

  // Compute initial δCC for current Pm
  const result = computeCriticalClearingAngle(
    state.delta,
    state.Pm,
    CONSTANTS.Pmax,
    CONSTANTS.Pmax * 0.5 // Reduced Pmax during fault
  );
  state.deltaCC = result.deltaCC;
  state.deltaMax = result.deltaMax;

  // Add initial data point to history for timeSeries
  history.delta.push({ t: 0, v: state.delta });
  history.omega.push({ t: 0, v: state.omega });
  history.Pe.push({ t: 0, v: state.Pe });
  history.Pm.push({ t: 0, v: state.Pm });

  // Setup control panels
  initControls();
  initPanels();

  // Setup tooltip
  const phasorSvg = document.getElementById('phasor-svg');
  const tooltip = document.getElementById('tooltip');
  initTooltip(phasorSvg, tooltip);

  // Subscribe to state changes for re-rendering
  onChange(() => {
    renderAll();
  });

  // Initial render
  renderAll();

  console.log('Initialization complete. Ready to simulate.');
  console.log('State:', state);
  console.log('History:', history);
}

// ──────────────────────────────────────────────────────────
// SIMULATION LOOP
// ──────────────────────────────────────────────────────────

function simulate(dt) {
  if (!state.running) return;

  state.simTime += dt;

  // Apply RLR if enabled
  let currentPm = state.Pm;
  let currentPref = state.Pref;

  if (state.rlrEnabled) {
    state.rlrTime += dt / 3600; // convert seconds to hours (in real-time scale)
    const load = getRLRLoad(state.rlrTime * CONSTANTS.SPEED); // scaled to 2400x
    currentPref = load;
    currentPm = load;
  }

  // Governor step (pass droop from state instead of CONSTANTS)
  governorState = tgov1Step(governorState, currentPref, state.Pm, state.droop, dt);

  // Use Pm from governor (mechanical power)
  state.Pm = governorState.y;

  // Compute electrical power
  state.Pe = computePe(state.delta, CONSTANTS.Pmax);

  // Apply fault effect: reduce Pmax during fault
  const effectivePmax = state.faultOn ? CONSTANTS.Pmax * 0.5 : CONSTANTS.Pmax;

  // Swing equation RK4 step
  const newState = rk4Step(
    { delta: state.delta, omega: state.omega },
    { Pm: state.Pm, Pmax: effectivePmax, D: CONSTANTS.D },
    dt
  );

  state.delta = newState.delta;
  state.omega = newState.omega;

  // Compute stability margin
  const stability = checkStability(state.delta, state.deltaCC);
  state.stabilityMargin = stability.margin;

  // Record history
  history.delta.push({ t: state.simTime, v: state.delta });
  history.omega.push({ t: state.simTime, v: state.omega });
  history.Pe.push({ t: state.simTime, v: state.Pe });
  history.Pm.push({ t: state.simTime, v: state.Pm });

  // Keep only last 1000 points for performance
  const maxPoints = 1000;
  if (history.delta.length > maxPoints) {
    history.delta = history.delta.slice(-maxPoints);
    history.omega = history.omega.slice(-maxPoints);
    history.Pe = history.Pe.slice(-maxPoints);
    history.Pm = history.Pm.slice(-maxPoints);
  }

  // Check out-of-step
  checkOOS(state, state.deltaCC);

  // Update status display
  updateStatusDisplay(state);

  // Trigger render
  renderAll();
}

// ──────────────────────────────────────────────────────────
// RENDERING
// ──────────────────────────────────────────────────────────

function renderAll() {
  // Render phasor diagram
  const phasorSvg = document.getElementById('phasor-svg');
  if (phasorSvg) {
    renderPhasor(phasorSvg, state, { V: 1.0, Ea: 1.2, X: 0.3 });
  }

  // Render P-δ curve
  const pdeltaSvg = document.getElementById('pdelta-svg');
  if (pdeltaSvg) {
    renderPDelta(pdeltaSvg, state, { Pmax: CONSTANTS.Pmax });
  }

  // Render time series
  const tsCanvas = document.getElementById('timeseries-canvas');
  if (tsCanvas) {
    renderTimeSeries(tsCanvas, {
      delta: history.delta,
      omega: history.omega,
      Pe: history.Pe,
      Pm: history.Pm,
    });
  }

  // Render RLR chart
  const rlrCanvas = document.getElementById('rlr-canvas');
  if (rlrCanvas && state.rlrEnabled) {
    const profile = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      load: getRLRLoad(hour),
      period: hour < 6 || hour > 20 ? 'Malam' :
              hour < 10 ? 'Pagi' :
              hour < 15 ? 'Siang' : 'Sore',
    }));
    renderRLRChart(rlrCanvas, profile, Math.floor(state.rlrTime * CONSTANTS.SPEED) % 24);
  }
}

// ──────────────────────────────────────────────────────────
// MAIN LOOP
// ──────────────────────────────────────────────────────────

function mainLoop(timestamp) {
  if (!lastFrameTime) lastFrameTime = timestamp;

  const elapsed = (timestamp - lastFrameTime) / 1000; // ms → s
  lastFrameTime = timestamp;

  // Step simulation at fixed dt
  const numSteps = Math.min(10, Math.ceil(elapsed / CONSTANTS.DT));

  for (let i = 0; i < numSteps; i++) {
    simulate(CONSTANTS.DT);
  }

  requestAnimationFrame(mainLoop);
}

// ──────────────────────────────────────────────────────────
// START APPLICATION
// ──────────────────────────────────────────────────────────

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    requestAnimationFrame(mainLoop);
  });
} else {
  initializeApp();
  requestAnimationFrame(mainLoop);
}

// Expose key objects for debugging
window.__app = {
  state,
  CONSTANTS,
  SCENARIOS,
  applyScenario: (key) => {
    applyScenario(state, key);
    governorState = makeTgov1State();
    history = { delta: [], omega: [], Pe: [], Pm: [], simTime: [] };
  },
};

console.log('Module loaded: Synchronous Generator Simulator');
