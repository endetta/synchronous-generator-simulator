// src/scenarios.js
// Preset simulation scenarios for quick demos.
// Each scenario sets initial conditions (δ, ω, Pm, Pref, fault).

import { CONSTANTS } from './constants.js';

export const SCENARIOS = {
  startup: {
    name: 'Generator Startup',
    description: 'Generator energized from standstill',
    initial: {
      delta: 0.0,
      omega: 0.8,
      Pm: 0.0,
      Pref: 1.0,
      faultOn: false,
    },
  },

  steadyState: {
    name: 'Steady State',
    description: 'Balanced operation at 30° angle',
    initial: {
      delta: Math.PI / 6,
      omega: 1.0,
      Pm: CONSTANTS.Pmax * Math.sin(Math.PI / 6),
      Pref: 1.0,
      faultOn: false,
    },
  },

  swingTest: {
    name: 'Swing Oscillation',
    description: 'Small perturbation from steady state',
    initial: {
      delta: Math.PI / 6 + 0.1,
      omega: 1.05,
      Pm: 1.0,
      Pref: 1.0,
      faultOn: false,
    },
  },

  fault3ph: {
    name: '3-Phase Fault',
    description: 'Three-phase fault at t=5s, cleared at t=5.1s',
    initial: {
      delta: Math.PI / 6,
      omega: 1.0,
      Pm: 1.0,
      Pref: 1.0,
      faultOn: false,
    },
    faultSchedule: {
      start: 5.0,
      clear: 5.1,
    },
  },

  heavyLoad: {
    name: 'Heavy Load',
    description: 'High power transfer (δ ≈ 60°)',
    initial: {
      delta: Math.PI / 3,
      omega: 1.0,
      Pm: CONSTANTS.Pmax * Math.sin(Math.PI / 3),
      Pref: 1.7,
      faultOn: false,
    },
  },

  rlr24h: {
    name: 'Real Load Response (24h)',
    description: '24-hour load profile at 2400× speed',
    initial: {
      delta: Math.PI / 6,
      omega: 1.0,
      Pm: 0.65,
      Pref: 0.65,
      faultOn: false,
    },
    rlrEnabled: true,
  },
};

// Apply a scenario to the state.
export function applyScenario(state, scenarioKey) {
  const scenario = SCENARIOS[scenarioKey];
  if (!scenario) {
    console.warn(`Scenario "${scenarioKey}" not found`);
    return;
  }

  Object.assign(state, scenario.initial);
  state.simTime = 0;
  state.rlrTime = 0;
  state.rlrEnabled = scenario.rlrEnabled || false;

  // Schedule fault if specified
  if (scenario.faultSchedule) {
    state.faultStart = scenario.faultSchedule.start;
    state.faultClear = scenario.faultSchedule.clear;
  }

  console.log(`Scenario applied: ${scenario.name}`);
}

// Get list of scenario keys for dropdown
export function getScenarioList() {
  return Object.keys(SCENARIOS).map(key => ({
    key,
    name: SCENARIOS[key].name,
    description: SCENARIOS[key].description,
  }));
}
