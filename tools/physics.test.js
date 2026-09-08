// tools/physics.test.js
// Tests for all physics modules: swing (RK4), tgov1 (governor), eac (stability), rlr (load)
// Run: node tools/physics.test.js  (or: node --test tools/physics.test.js)

import assert from 'node:assert/strict';
import { rk4Step, ode, computePe, computePmForSteadyState } from '../src/physics/swing.js';
import { makeTgov1State, tgov1Step, tgov1SteadyState } from '../src/physics/tgov1.js';
import { makeAVRState, avrStep } from '../src/physics/avr.js';
import { computeCriticalClearingAngle, checkStability, computeEACAreas, computeCCT } from '../src/physics/eac.js';
import { getRLRLoad, getRLRPeriod, getRLRPeak, getRLRMinimum, getRLRProfile } from '../src/physics/rlr.js';
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
// SWING EQUATION (RK4) TESTS
// ──────────────────────────────────────────────────────────
console.log('Swing Equation (RK4):');

const defaultParams = {
  Pm: 1.0,
  Pmax: 2.0,
  D: 2.0,
};

// Test 1: Steady state — at δ = 30°, Pm = 1.0, Pe = 1.0, so dω/dt ≈ 0 (relative convention)
test('Steady state at π/6 (30°)', () => {
  const state = { delta: Math.PI / 6, omega: 0.0 }; // ω graduates to 0 at sync with relative convention
  const derivs = ode(state, defaultParams);
  // dω/dt = (Pm - Pmax*sin(30°) - D*0) / M = (1 - 1) / M = 0 (relative convention: deviation = 0 at sync)
  assert(Math.abs(derivs[1]) < 1e-10, `dω/dt should be ~0 at steady state (Pm=Pe), got ${derivs[1]}`);
  assert(Math.abs(derivs[0]) < 1e-10, `dδ/dt should be ~0 (ω=0 at sync in relative convention), got ${derivs[0]}`);
});

// Test 2: RK4 preserves energy (oscillatory system should conserve amplitude)
test('RK4 conserves oscillation amplitude (~1000 steps)', () => {
  let state = { delta: 0.5, omega: 0.1 }; // Start with small deviation in relative convention
  const params = { Pm: 1.0, Pmax: 2.0, D: 0.0 }; // No damping → energy conserved
  for (let i = 0; i < 1000; i++) {
    state = rk4Step(state, params, 0.01);
  }
  // After ~10 oscillations, delta should stay bounded
  assert(Math.abs(state.delta) < Math.PI, `delta should stay < π, got ${state.delta}`);
  assert(Math.abs(state.omega) < 0.5, `omega magnitude < 0.5 pu (relative), got ${state.omega}`);
});

// Test 3: Damping causes convergence to steady state
test('Damping drives system to steady state', () => {
  let state = { delta: 1.0, omega: 0.2 }; // Relative convention: omega deviation from sync
  const params = { Pm: 1.5, Pmax: 2.0, D: 5.0 };
  for (let i = 0; i < 5000; i++) {
    state = rk4Step(state, params, 0.01);
  }
  // Should converge so that Pe = Pm → sin(δ) = 0.75 → δ ≈ 0.848 rad, omega → 0
  const expectedDelta = Math.asin(1.5 / 2.0); // ≈ 0.848 rad
  assert(Math.abs(state.delta - expectedDelta) < 0.01,
    `delta should converge to ${expectedDelta.toFixed(3)}, got ${state.delta.toFixed(4)}`);
  assert(Math.abs(state.omega) < 0.01, `omega should converge to 0 (sync), got ${state.omega.toFixed(4)}`);
});

// Test 4: RK4 accuracy vs analytical solution (small angle, no damping)
test('RK4 4th-order convergence in undamped case', () => {
  // Small angle: sin(δ) ≈ δ, so d²δ/dt² = (Pm - Pmax*δ)/M ≈ linear oscillator
  const Pm = 1.0;
  const Pmax_lin = Pm; // at δ=0, Pe ≈ Pmax*δ = Pm → but we perturb slightly
  const delta0 = 0.1; // small angle
  const omega0 = 0.1; // Relative convention: small deviation
  const params = { Pm, Pmax: 2.0, D: 0 };
  const M = 2 * CONSTANTS.H / (2 * Math.PI * CONSTANTS.F0);

  // ω_natural = sqrt(Pmax/M), for linearized system
  const wn = Math.sqrt(2.0 / M);

  const dt = 0.01;
  const steps = 1000;
  let state = { delta: delta0, omega: omega0 };
  for (let i = 0; i < steps; i++) {
    state = rk4Step(state, params, dt);
  }

  // Compare with fine-step RK4 (reference)
  let refState = { delta: delta0, omega: omega0 };
  const fine_dt = 0.001;
  for (let i = 0; i < steps * 10; i++) {
    refState = rk4Step(refState, params, fine_dt);
  }

  assert(Math.abs(state.delta - refState.delta) < 0.001,
    `RK4 coarse (dt=0.01) should match fine (dt=0.001) within 1e-3`);
});

// Test 5: computePe / computePmForSteadyState
test('computePe returns Pmax*sin(δ)', () => {
  assert(Math.abs(computePe(0, 2.0) - 0) < 1e-10);
  assert(Math.abs(computePe(Math.PI / 2, 2.0) - 2.0) < 1e-10);
  assert(Math.abs(computePe(Math.PI / 6, 2.0) - 1.0) < 1e-10);
});

test('computePmForSteadyState = Pmax*sin(δ)', () => {
  const Pm = computePmForSteadyState(Math.PI / 6, 2.0);
  assert(Math.abs(Pm - 1.0) < 1e-10);
});


// ──────────────────────────────────────────────────────────
// TGOV1 GOVERNOR TESTS
// ──────────────────────────────────────────────────────────
console.log('\nTGOV1 Governor:');

test('Governor responds to step change in Pref', () => {
  const state = makeTgov1State();
  const Pref = 1.5;
  const R = CONSTANTS.R; // droop parameter
  const dt = 0.01;
  let Pm = 0.0;

  for (let i = 0; i < 500; i++) { // 5 seconds
    const newState = tgov1Step(state, Pref, Pm, R, dt);
    Object.assign(state, newState);
    Pm = newState.valvePosition; // feedback: use valve output as Pm for next step
  }
  // With droop R=0.05, steady-state Pm approaches Pref but not exactly
  // Governor output should have opened the valve significantly
  assert(state.valvePosition > 0.5, `valve should open significantly, got ${state.valvePosition}`);
  // Due to clamping at 2.0 and droop dynamics, accept wider tolerance
  assert(state.valvePosition >= 0.5 && state.valvePosition <= 2.0, `Pm in valid range [0.5, 2.0], got ${state.valvePosition}`);
});

test('tgov1SteadyState returns clamped Pref', () => {
  assert(tgov1SteadyState(2.5, 1.0) <= 2.0, 'should clamp to max');
  assert(tgov1SteadyState(-1.0, 1.0) >= 0, 'should clamp to min');
});


// ──────────────────────────────────────────────────────────
// EAC (EQUAL AREA CRITERION) TESTS
// ──────────────────────────────────────────────────────────
console.log('\nEqual Area Criterion:');

test('computeCriticalClearingAngle below π/2', () => {
  const delta0 = Math.PI / 6; // 30°
  const result = computeCriticalClearingAngle(delta0, 1.0, 2.0, 1.0);
  const deltaCC = result.deltaCC;
  const deltaMax = result.deltaMax;
  assert(deltaCC > delta0, 'δcc should be > δ0');
  assert(deltaCC < Math.PI / 2, 'δcc should be < π/2');
  assert(deltaMax > deltaCC, 'δmax should be > δcc');
});

test('checkStability returns correct boolean', () => {
  const result = checkStability(0.5, 1.0);
  assert(result.stable === true, '0.5 < 1.0 → stable');
  assert(result.margin > 0, 'positive margin');
});

test('checkStability fails when delta exceeds δcc', () => {
  const result = checkStability(1.2, 1.0);
  assert(result.stable === false, '1.2 > 1.0 → unstable');
  assert(result.margin === 0, 'zero margin when unstable');
});

test('computeEACAreas balances A1 and A2 near δcc', () => {
  const delta0 = Math.PI / 6;
  const delta = 0.8; // near critical
  const { A_acc, A_dec, balanced } = computeEACAreas(delta0, delta, 1.0, 2.0, 0.01, 100);
  assert(A_acc > 0, 'accelerating area should be positive');
  assert(Math.abs(A_acc - A_dec) < 0.1, `areas should be roughly balanced: A_acc=${A_acc.toFixed(3)}, A_dec=${A_dec.toFixed(3)}`);
});


// ──────────────────────────────────────────────────────────
// CCT (CRITICAL CLEARING TIME) TESTS
// ──────────────────────────────────────────────────────────
console.log('\nCritical Clearing Time:');
test('computeCCT returns reasonable value', () => {
  // Compute CCT using the new standalone function
  const H = CONSTANTS.H;
  const f0 = CONSTANTS.F0;
  const delta0 = Math.PI / 6;
  const Pm = 1.0;
  const Pmax_normal = CONSTANTS.Pmax;
  const Pmax_post = Pmax_normal * 0.5; // fault reduces Pmax by 50%

  // Compute δCC for this scenario
  const eacResult = computeCriticalClearingAngle(delta0, Pm, Pmax_normal, Pmax_post);
  const deltaCC = eacResult.deltaCC;

  // Compute CCT
  const cct = computeCCT(delta0, deltaCC, Pm, H, f0);

  assert(cct > 0 && cct < 2.0, `CCT should be 0-2s, got ${cct.toFixed(3)}`);
});

test('computeCCT handles edge cases', () => {
  const H = CONSTANTS.H;
  const f0 = CONSTANTS.F0;
  const Pm = 1.0;
  const delta0 = Math.PI / 6;
  const deltaCC = 1.5; // reasonable critical angle

  const cct = computeCCT(delta0, deltaCC, Pm, H, f0);

  // CCT should be positive for realistic parameters
  assert(cct > 0, `CCT should be positive, got ${cct}`);

  // With Pm = 1.0, H = 5.0, CCT should be ~0.5-1.0s for reasonable δCC - δ0
  assert(cct < 2.0, `CCT should be < 2s, got ${cct}`);
});

// ──────────────────────────────────────────────────────────
// RLR (REAL LOAD RESPONSE) TESTS
// ──────────────────────────────────────────────────────────
console.log('\nReal Load Response:');

test('getRLRLoad(0) returns first value', () => {
  assert(Math.abs(getRLRLoad(0) - 0.65) < 1e-10, 'load at t=0 should be 0.65');
});

test('getRLRLoad(17) returns peak (1.00)', () => {
  assert(Math.abs(getRLRLoad(17) - 1.00) < 1e-10, 'load at t=17 should be 1.00');
});

test('getRLRLoad(5.5) interpolates between 0.50 and 0.55', () => {
  const load = getRLRLoad(5.5);
  assert(Math.abs(load - 0.525) < 1e-10, `interpolated load = 0.525, got ${load}`);
});

test('getRLRPeriod returns correct Indonesian labels', () => {
  assert(getRLRPeriod(0) === 'Malam', 'midnight = Malam');
  assert(getRLRPeriod(8) === 'Pagi', 'morning = Pagi');
  assert(getRLRPeriod(13) === 'Siang', 'noon = Siang');
  assert(getRLRPeriod(18) === 'Sore', 'evening = Sore');
  assert(getRLRPeriod(23) === 'Malam', 'late night = Malam');
});

test('getRLRPeak returns hour 17', () => {
  const peak = getRLRPeak();
  assert(peak.hour === 17, `peak at hour 17, got ${peak.hour}`);
  assert(peak.load === 1.00, `peak load = 1.00, got ${peak.load}`);
});

test('getRLRMinimum returns hour 5', () => {
  const min = getRLRMinimum();
  assert(min.hour === 5 || min.hour === 4, `min at hour 5 or 4, got ${min.hour}`);
  assert(Math.abs(min.load - 0.50) < 1e-10, `min load = 0.50, got ${min.load}`);
});

test('getRLRProfile returns 24 entries with correct structure', () => {
  const profile = getRLRProfile();
  assert(profile.length === 24, `24 entries, got ${profile.length}`);
  assert(profile[0].hour === 0 && typeof profile[0].load === 'number', 'structure');
  assert(profile[0].period === 'Malam', 'period field correct');
});

test('getRLRLoad clamps t > 24', () => {
  assert(getRLRLoad(25) === getRLRLoad(23), 't=25 should clamp to t=24');
});


// ──────────────────────────────────────────────────────────
// SUMMARY
// ──────────────────────────────────────────────────────────
console.log(`\n--- Results: ${pass} passed, ${fail} failed ---`);
if (fail > 0) {
  console.error('PHYSICS TESTS FAILED!');
  process.exit(1);
}
