// src/ui/controls.js
// UI control handlers for sliders, dropdowns, and buttons.
// Connects DOM events to state mutations.

import { state, setDelta, setPref, setDroop, setFaultOn, setRunning } from '../state.js';

// Initialize all UI controls and attach event listeners.
export function initControls() {
  const els = {
    pmSlider: document.getElementById('pm-slider'),
    pmValue: document.getElementById('pm-value'),
    droopSlider: document.getElementById('droop-slider'),
    droopValue: document.getElementById('droop-value'),
    faultSelect: document.getElementById('fault-select'),
    deltaSlider: document.getElementById('delta-slider'),
    deltaValue: document.getElementById('delta-value'),
    btnStart: document.getElementById('btn-start'),
    btnStop: document.getElementById('btn-stop'),
    btnReset: document.getElementById('btn-reset'),
  };

  // Initialize display values
  els.pmValue.textContent = `${state.Pref.toFixed(2)} pu`;
  els.droopValue.textContent = `${(state.droop * 100).toFixed(0)}%`;
  els.deltaValue.textContent = `${(state.delta * 180 / Math.PI).toFixed(0)}°`;

  // PM slider handler
  els.pmSlider.addEventListener('input', (e) => {
    const pm = parseFloat(e.target.value);
    setPref(pm);
    els.pmValue.textContent = `${pm.toFixed(2)} pu`;
  });

  // Droop slider handler
  els.droopSlider.addEventListener('input', (e) => {
    const droop = parseFloat(e.target.value);
    setDroop(droop); // Update state instead of mutating CONSTANTS
    els.droopValue.textContent = `${(droop * 100).toFixed(0)}%`;
  });

  // Delta slider handler (initial condition)
  els.deltaSlider.addEventListener('input', (e) => {
    const deltaDeg = parseFloat(e.target.value);
    const deltaRad = (deltaDeg * Math.PI) / 180;
    setDelta(deltaRad);
    els.deltaValue.textContent = `${deltaDeg}°`;
  });

  // Fault select handler
  els.faultSelect.addEventListener('change', (e) => {
    switch (e.target.value) {
      case 'none':
        setFaultOn(false);
        break;
      case '3ph':
        // Apply 3-phase fault at t = 5s (simulated)
        setFaultOn(true);
        setTimeout(() => setFaultOn(false), 100); // brief fault
        break;
      case 'lg':
        // Line-to-ground fault
        setFaultOn(true);
        setTimeout(() => setFaultOn(false), 100);
        break;
    }
  });

  // Start button
  els.btnStart.addEventListener('click', () => {
    setRunning(true);
  });

  // Stop button
  els.btnStop.addEventListener('click', () => {
    setRunning(false);
  });

  // Reset button
  els.btnReset.addEventListener('click', () => {
    setRunning(false);
    // Reset state to initial values
    state.delta = 0.524; // ~30° default
    state.omega = 0.0;   // sync speed in relative convention
    state.Pe = 0.0;
    state.Pm = 0.0;
    state.Pref = 1.0;
    state.droop = 0.05;  // 5% default droop
    state.faultOn = false;
    state.faultStart = 0;
    state.faultClear = 0;
    state.simTime = 0;
    state.rlrTime = 0;
    state.stabilityMargin = 0;
  });

  return els;
}

// Update status panel displays.
// Called by render loop after each simulation step.
export function updateStatusDisplay(state) {
  const els = {
    statusDelta: document.getElementById('status-delta'),
    statusOmega: document.getElementById('status-omega'),
    statusPe: document.getElementById('status-pe'),
    statusStability: document.getElementById('status-stability'),
  };

  const deltaDeg = (state.delta % (2 * Math.PI)) * 180 / Math.PI;
  els.statusDelta.textContent = `${deltaDeg.toFixed(1)}°`;
  els.statusOmega.textContent = `${state.omega.toFixed(3)} pu`;
  els.statusPe.textContent = `${state.Pe.toFixed(3)} pu`;
  els.statusStability.textContent = state.stabilityMargin > 0.1 ? 'Stabil' : 'Tidak stabil';
  els.statusStability.style.color = state.stabilityMargin > 0.1 ? 'green' : 'red';
}

// Update all control values from state (for sync after reset).
export function syncControls() {
  const els = {
    pmSlider: document.getElementById('pm-slider'),
    pmValue: document.getElementById('pm-value'),
    droopSlider: document.getElementById('droop-slider'),
    droopValue: document.getElementById('droop-value'),
    deltaSlider: document.getElementById('delta-slider'),
    deltaValue: document.getElementById('delta-value'),
  };

  els.pmSlider.value = state.Pref.toFixed(2);
  els.pmValue.textContent = `${state.Pref.toFixed(2)} pu`;
  els.droopSlider.value = state.droop.toFixed(2);
  els.droopValue.textContent = `${(state.droop * 100).toFixed(0)}%`;
  els.deltaSlider.value = ((state.delta * 180 / Math.PI) % 180).toFixed(0);
  els.deltaValue.textContent = `${((state.delta * 180 / Math.PI) % 180).toFixed(0)}°`;
}
