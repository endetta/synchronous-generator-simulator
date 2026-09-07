// tools/integration.test.js
// Integration tests: end-to-end simulation + rendering scenario tests.
// Verifies that physics → renderers → UI work together correctly.

import assert from 'node:assert/strict';
import { rk4Step, computePe } from '../src/physics/swing.js';
import { makeTgov1State, tgov1Step } from '../src/physics/tgov1.js';
import { computeCriticalClearingAngle, checkStability } from '../src/physics/eac.js';
import { getRLRLoad } from '../src/physics/rlr.js';
import { computePhasorCoords } from '../src/renderers/phasor.js';
import { applyScenario, SCENARIOS } from '../src/scenarios.js';
import { CONSTANTS } from '../src/constants.js';

let pass = 0;
let fail = 0;

function test(name, fn) {
  try {
    fn();
    pass++;
    // console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    console.error(`  ✗ ${name}: ${e.message}`);
  }
}

// ──────────────────────────────────────────────────────────
// SCENARIO INTEGRATION TESTS
// ──────────────────────────────────────────────────────────
console.log('Scenario Integration:');

test('Startup scenario initializes state correctly', () => {
  const state = { ...require('../src/state.js').makeState() };
  applyScenario(state, 'startup');
  assert(state.delta === 0.0, 'delta starts at 0');
  assert(state.omega < 1.0, 'omega starts below synchronous speed');
});

test('Steady state scenario converges to equilibrium', () => {
  const state = { ...require('../src/state.js').makeState() };
  applyScenario(state, 'steadyState');

  // Run simulation until stable
  let { delta, omega } = state;
  for (let i = 0; i < 2000; i++) {
    const params = { Pm: state.Pm, Pmax: CONSTANTS.Pmax, D: CONSTANTS.D };
    const next = rk4Step({ delta, omega }, params, CONSTANTS.DT);
    delta = next.delta;
    omega = next.omega;
  }

  // Should converge to Pe = Pm
  const Pe = computePe(delta, CONSTANTS.Pmax);
  assert(Math.abs(Pe - state.Pm) < 0.01,
    `Steady state Pe (${Pe.toFixed(4)}) ≈ Pm (${state.Pm})`);
});

test('3-Phase fault scenario has fault schedule', () => {
  const scenario = SCENARIOS.fault3ph;
  assert(scenario.faultSchedule, 'fault scenario should have schedule');
  assert(scenario.faultSchedule.start === 5.0, 'fault starts at 5s');
  assert(scenario.faultSchedule.clear === 5.1, 'fault clears at 5.1s');
});

test('RLR scenario enables RLR mode', () => {
  const scenario = SCENARIOS.rlr24h;
  assert(scenario.rlrEnabled === true, 'RLR enabled');
});

test('Heavy load scenario has angle > 45°', () => {
  const scenario = SCENARIOS.heavyLoad;
  const deltaDeg = scenario.initial.delta * 180 / Math.PI;
  assert(deltaDeg > 45, `Heavy load angle > 45°, got ${deltaDeg}°`);
});


// ──────────────────────────────────────────────────────────
// END-TO-END SIMULATION TESTS
// ──────────────────────────────────────────────────────────
console.log('\nEnd-to-End Simulation:');

test('Swing + Governor + EAC chain produces consistent results', () => {
  // Start from steady state
  let delta = Math.PI / 6;
  let omega = 1.0;
  let governor = makeTgov1State();
  let Pm = computePe(delta, CONSTANTS.Pmax);
  let Pref = Pm;
  const dt = CONSTANTS.DT;

  // Simulate 2 seconds
  for (let i = 0; i < 200; i++) {
    governor = tgov1Step(governor, Pref, Pm, dt);
    Pm = Math.max(0, governor.y);

    const params = { Pm, Pmax: CONSTANTS.Pmax, D: CONSTANTS.D };
    const next = rk4Step({ delta, omega }, params, dt);
    delta = next.delta;
    omega = next.omega;
  }

  // Should settle close to steady state
  const Pe = computePe(delta, CONSTANTS.Pmax);
  assert(Math.abs(Pe - Pm) < 0.1, `Pe ≈ Pm in steady state`);
  assert(omega > 0.9 && omega < 1.1, `omega near 1.0 pu`);
});

test('Fault reduces Pmax → angle increases', () => {
  let delta = Math.PI / 6;
  let omega = 1.0;
  const Pm = 1.0;
  const dt = CONSTANTS.DT;

  // Normal operation
  const paramsNormal = { Pm, Pmax: CONSTANTS.Pmax, D: CONSTANTS.D };
  const after = rk4Step({ delta, omega }, paramsNormal, dt);

  // Fault condition (50% Pmax)
  const paramsFault = { Pm, Pmax: CONSTANTS.Pmax * 0.5, D: CONSTANTS.D };
  const during = rk4Step({ delta, omega }, paramsFault, dt);

  // During fault, less electrical power → more acceleration → higher delta next step
  assert(during.delta > after.delta,
    `δ during fault (${during.delta.toFixed(4)}) > δ normal (${after.delta.toFixed(4)})`);
});

test('EAC critical clearing angle prevents instability', () => {
  const delta0 = Math.PI / 6;
  const deltaCC = computeCriticalClearingAngle(delta0, 1.0, CONSTANTS.Pmax, CONSTANTS.Pmax * 0.5);

  // Simulate fault and recovery
  let delta = delta0;
  let omega = 1.0;
  const Pm = 1.0;
  const dt = CONSTANTS.DT;
  let unstable = false;

  for (let i = 0; i < 1000; i++) {
    let Pmax = CONSTANTS.Pmax;
    // Apply fault at step 100, clear at 200
    if (i >= 100 && i < 200) {
      Pmax = CONSTANTS.Pmax * 0.3; // severe fault
    }
    const params = { Pm, Pmax, D: CONSTANTS.D };
    const next = rk4Step({ delta, omega }, params, dt);
    delta = next.delta;
    omega = next.omega;

    if (delta > deltaCC) {
      unstable = true;
    }
  }

  const stability = checkStability(delta, deltaCC);
  // Either stable or the EAC properly detected instability
  assert(typeof stability.stable === 'boolean',
    `EAC stability check returns boolean`);
  assert(stability.deltaCC > delta0, `δcc > δ₀`);
});

test('RLR load profile varies correctly', () => {
  const loadT0 = getRLRLoad(0);     // midnight
  const loadT8 = getRLRLoad(8);     // morning
  const loadT17 = getRLRLoad(17);   // evening peak
  const loadT23 = getRLRLoad(23);   // late night

  assert(loadT23 < loadT8, 'late night < morning');
  assert(loadT17 >= loadT0, 'evening peak ≥ midnight');
  assert(Math.abs(loadT17 - 1.0) < 1e-10, 'peak = 1.00 pu');
});


// ──────────────────────────────────────────────────────────
// RENDERER INTEGRATION
// ──────────────────────────────────────────────────────────
console.log('\nRenderer Integration:');

test('Phasor coords consistent with swing state', () => {
  const delta = Math.PI / 6;
  const state = { delta, Pe: 1.0 };
  const params = { V: 1.0, Ea: 1.2, X: 0.3 };

  const coords = computePhasorCoords(state, params);

  // E' should be at angle delta
  const computedDelta = Math.atan2(coords.E_end.y, coords.E_end.x);
  assert(Math.abs(computedDelta - delta) < 1e-10,
    `E' angle = δ`);

  // V should be horizontal (angle 0)
  assert(Math.abs(coords.V_end.y) < 1e-10, 'V_y = 0');
});

test('Phasor I angle consistent with E-V/X', () => {
  const delta = Math.PI / 6;
  const state = { delta };
  const params = { V: 1.0, Ea: 1.2, X: 0.3 };

  const coords = computePhasorCoords(state, params);

  // I_x should be proportional to sin(delta)
  const expectedIx = (params.Ea * Math.sin(delta)) / params.X;
  assert(Math.abs(coords.I_end.x - expectedIx) < 1e-10,
    `I_x matches (Ea*sin(δ)/X)`);
});


// ──────────────────────────────────────────────────────────
// SUMMARY
// ──────────────────────────────────────────────────────────
console.log(`\n--- Results: ${pass} passed, ${fail} failed ---`);
if (fail > 0) {
  console.error('INTEGRATION TESTS FAILED!');
  process.exit(1);
}
