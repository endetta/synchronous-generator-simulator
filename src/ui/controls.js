// src/ui/controls.js
// UI control handlers for sliders, dropdowns, and buttons.
// Connects DOM events to state mutations.

import { state, setDelta, setPref, setDroop, setFaultOn, setRunning } from '../state.js';

// Initialize all UI controls and attach event listeners.
export function initControls() {
  // Initialize accordion sections
  initAccordions();

  const els = {
    pmSlider: document.getElementById('pm-slider'),
    pmValue: document.getElementById('pm-value'),
    droopSlider: document.getElementById('droop-slider'),
    droopValue: document.getElementById('droop-value'),
    faultSelect: document.getElementById('fault-select'),
    faultDurationSlider: document.getElementById('fault-duration-slider'),
    faultDurationValue: document.getElementById('fault-duration-value'),
    deltaSlider: document.getElementById('delta-slider'),
    deltaValue: document.getElementById('delta-value'),
    omegaSlider: document.getElementById('omega-slider'),
    omegaValue: document.getElementById('omega-value'),
    scenarioSelect: document.getElementById('scenario-select'),
    btnStart: document.getElementById('btn-start'),
    btnStop: document.getElementById('btn-stop'),
    btnReset: document.getElementById('btn-reset'),
  };

  // Initialize display values
  if (els.pmValue) els.pmValue.textContent = `${state.Pref.toFixed(2)} pu`;
  if (els.droopValue) els.droopValue.textContent = `${(state.droop * 100).toFixed(0)}%`;
  if (els.deltaValue) els.deltaValue.textContent = `${(state.delta * 180 / Math.PI).toFixed(0)}°`;
  if (els.omegaValue) els.omegaValue.textContent = `${state.omega.toFixed(3)} pu`;
  if (els.faultDurationValue) els.faultDurationValue.textContent = '5 siklus';

  // PM slider handler
  if (els.pmSlider) {
    els.pmSlider.addEventListener('input', (e) => {
      const pm = parseFloat(e.target.value);
      setPref(pm);
      if (els.pmValue) els.pmValue.textContent = `${pm.toFixed(2)} pu`;
    });
  }

  // Scenario select handler
  if (els.scenarioSelect) {
    els.scenarioSelect.addEventListener('change', (e) => {
      const scenario = e.target.value;
      // Apply scenario will be handled by main.js
      if (window.__app && window.__app.applyScenario) {
        window.__app.applyScenario(scenario);
      }
    });
  }

  // Droop slider handler
  if (els.droopSlider) {
    els.droopSlider.addEventListener('input', (e) => {
      const droop = parseFloat(e.target.value);
      setDroop(droop);
      if (els.droopValue) els.droopValue.textContent = `${(droop * 100).toFixed(0)}%`;
    });
  }

  // Delta slider handler (initial condition)
  if (els.deltaSlider) {
    els.deltaSlider.addEventListener('input', (e) => {
      const deltaDeg = parseFloat(e.target.value);
      const deltaRad = (deltaDeg * Math.PI) / 180;
      setDelta(deltaRad);
      if (els.deltaValue) els.deltaValue.textContent = `${deltaDeg}°`;
    });
  }

  // Omega slider handler (initial condition)
  if (els.omegaSlider) {
    els.omegaSlider.addEventListener('input', (e) => {
      const omega = parseFloat(e.target.value);
      state.omega = omega;
      if (els.omegaValue) els.omegaValue.textContent = `${omega.toFixed(3)} pu`;
    });
  }

  // Fault duration slider handler
  if (els.faultDurationSlider) {
    els.faultDurationSlider.addEventListener('input', (e) => {
      const cycles = parseFloat(e.target.value);
      if (els.faultDurationValue) els.faultDurationValue.textContent = `${cycles} siklus`;
    });
  }

  // Fault select handler
  if (els.faultSelect) {
    els.faultSelect.addEventListener('change', (e) => {
      const faultDuration = els.faultDurationSlider ? parseFloat(els.faultDurationSlider.value) : 5;
      const faultDurationMs = faultDuration * 100; // 100ms per cycle approximation

      switch (e.target.value) {
        case 'none':
          setFaultOn(false);
          break;
        case '3ph':
          setFaultOn(true);
          addTimelineEntry('Gangguan 3-fasa diterapkan', 'warning');
          setTimeout(() => {
            setFaultOn(false);
            addTimelineEntry('Gangguan 3-fasa dihapus', 'success');
          }, faultDurationMs);
          break;
        case 'lg':
          setFaultOn(true);
          addTimelineEntry('Gangguan L-G diterapkan', 'warning');
          setTimeout(() => {
            setFaultOn(false);
            addTimelineEntry('Gangguan L-G dihapus', 'success');
          }, faultDurationMs);
          break;
      }
    });
  }

  // Start button
  if (els.btnStart) {
    els.btnStart.addEventListener('click', () => {
      setRunning(true);
      addTimelineEntry('Simulasi dimulai', 'success');
    });
  }

  // Stop button
  if (els.btnStop) {
    els.btnStop.addEventListener('click', () => {
      setRunning(false);
      addTimelineEntry('Simulasi dihentikan', 'warning');
    });
  }

  // Reset button
  if (els.btnReset) {
    els.btnReset.addEventListener('click', () => {
      setRunning(false);
      // Reset state to initial values
      state.delta = 0.524; // ~30° default
      state.omega = 1.0;   // sync speed in relative convention
      state.Pe = 0.0;
      state.Pm = 1.0;
      state.Pref = 1.0;
      state.droop = 0.05;  // 5% default droop
      state.faultOn = false;
      state.faultStart = 0;
      state.faultClear = 0;
      state.simTime = 0;
      state.rlrTime = 0;
      state.stabilityMargin = 0;
      addTimelineEntry('Simulasi direset', 'success');
      syncControls();
    });
  }

  // Signal selector handler
  initSignalSelector();

  return els;
}

// Initialize accordion behavior
function initAccordions() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');

  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const section = header.closest('.accordion-section');
      const isExpanded = section.hasAttribute('data-expanded');

      // Toggle current section
      if (isExpanded) {
        section.removeAttribute('data-expanded');
      } else {
        section.setAttribute('data-expanded', 'true');
      }
    });
  });
}

// Initialize signal selector for time series
function initSignalSelector() {
  const radios = document.querySelectorAll('input[name="signal"]');
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      // Signal selection will be handled by timeSeries.js
      // Just trigger a custom event
      window.dispatchEvent(new window.CustomEvent('signal-change', {
        detail: { signal: e.target.value }
      }));
    });
  });
}

// Add entry to timeline log
function addTimelineEntry(message, type = 'info') {
  const timelineLog = document.getElementById('timeline-log');
  if (!timelineLog) return;

  const entry = document.createElement('div');
  entry.className = `timeline-entry ${type}`;
  const timestamp = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  entry.textContent = `[${timestamp}] ${message}`;

  timelineLog.insertBefore(entry, timelineLog.firstChild);

  // Keep only last 50 entries
  while (timelineLog.children.length > 50) {
    timelineLog.removeChild(timelineLog.lastChild);
  }
}

// Update status panel displays.
// Called by render loop after each simulation step.
export function updateStatusDisplay(state) {
  // Update inline status in phasor panel
  const statusDeltaInline = document.getElementById('status-delta-inline');
  const statusOmegaInline = document.getElementById('status-omega-inline');
  const statusPeInline = document.getElementById('status-pe-inline');

  const deltaDeg = (state.delta % (2 * Math.PI)) * 180 / Math.PI;

  if (statusDeltaInline) statusDeltaInline.textContent = `${deltaDeg.toFixed(1)}°`;
  if (statusOmegaInline) statusOmegaInline.textContent = `${state.omega.toFixed(3)} pu`;
  if (statusPeInline) statusPeInline.textContent = `${state.Pe.toFixed(3)} pu`;

  // Update old status panel (backward compatibility)
  const statusDelta = document.getElementById('status-delta');
  const statusOmega = document.getElementById('status-omega');
  const statusPe = document.getElementById('status-pe');
  const statusStability = document.getElementById('status-stability');

  if (statusDelta) statusDelta.textContent = `${deltaDeg.toFixed(1)}°`;
  if (statusOmega) statusOmega.textContent = `${state.omega.toFixed(3)} pu`;
  if (statusPe) statusPe.textContent = `${state.Pe.toFixed(3)} pu`;
  if (statusStability) {
    statusStability.textContent = state.stabilityMargin > 0.1 ? 'Stabil' : 'Tidak stabil';
    statusStability.style.color = state.stabilityMargin > 0.1 ? 'green' : 'red';
  }
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
    omegaSlider: document.getElementById('omega-slider'),
    omegaValue: document.getElementById('omega-value'),
  };

  if (els.pmSlider) els.pmSlider.value = state.Pref.toFixed(2);
  if (els.pmValue) els.pmValue.textContent = `${state.Pref.toFixed(2)} pu`;
  if (els.droopSlider) els.droopSlider.value = state.droop.toFixed(2);
  if (els.droopValue) els.droopValue.textContent = `${(state.droop * 100).toFixed(0)}%`;
  if (els.deltaSlider) els.deltaSlider.value = ((state.delta * 180 / Math.PI) % 180).toFixed(0);
  if (els.deltaValue) els.deltaValue.textContent = `${((state.delta * 180 / Math.PI) % 180).toFixed(0)}°`;
  if (els.omegaSlider) els.omegaSlider.value = state.omega.toFixed(3);
  if (els.omegaValue) els.omegaValue.textContent = `${state.omega.toFixed(3)} pu`;
}

// Export addTimelineEntry for use in other modules
export { addTimelineEntry };
