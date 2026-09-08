// src/physics/tgov1.js
// TGOV1 Governor model per IEEE Std 421.5-2016
// Steam turbine governor with droop, lead-lag, and servo dynamics.
//
// Block diagram (simplified TGOV1):
//
//   Pref ──(+)──[K = 1/R]──(+)──[1+T2·s/1+T1·s]──[1/T3·s]──► Pm
//          -               -                        │
//          │               │                        │
//          └─── Pm ◄───────┴────────────────────────┘
//
// Key insight: The governor needs an integrator to track Pref in steady state.
// Without it, there's always steady-state error due to droop.
//
// For educational purposes, we use a simplified but stable model:
//   1. Speed error: e = Pref - Pm
//   2. Proportional: Kp = 1/R (droop gain)
//   3. Lead-lag: (1 + T2·s) / (1 + T1·s) for transient response
//   4. Servo integrator: 1/T3·s to track setpoint
//
// Simplified stable implementation:
//   Valve position changes gradually toward target = Pref

import { CONSTANTS } from '../constants.js';

/**
 * Create initial TGOV1 state.
 * @returns {Object} Initial state { valveTarget, valvePosition }
 */
export function makeTgov1State() {
  return {
    valveTarget: 0.0,     // Target valve position from error signal
    valvePosition: 0.0,   // Actual valve position (rate-limited)
  };
}

/**
 * Compute one TGOV1 governor timestep.
 *
 * Simplified stable model:
 * 1. Compute desired valve position from error
 * 2. Rate-limit the valve movement (servo dynamics)
 * 3. Output = actual valve position
 *
 * @param {Object} state - Current governor state { valveTarget, valvePosition }
 * @param {number} Pref - Power reference setpoint (pu)
 * @param {number} Pm - Current mechanical power (pu)
 * @param {number} R - Droop coefficient (pu, typically 0.05 = 5%)
 * @param {number} dt - Timestep (s)
 * @returns {Object} New state { valveTarget, valvePosition }
 */
export function tgov1Step(state, Pref, Pm, R, dt) {
  const { T1, T2 } = CONSTANTS;
  const { valvePosition } = state;

  // Speed/Power error: positive error = need more power
  const error = Pref - Pm;

  // Droop: determines how much valve movement per unit error
  // R = 0.05 means 5% speed change causes 100% valve travel
  // For stability, we use a gentler response
  // Target valve position: integrate error with droop
  // valveTarget = ∫ (error / R) dt, but with anti-windup

  // For TGOV1, the lead-lag (T1, T2) provides transient gain boost
  // Steady-state gain = 1 (unity feedback)
  // Transient gain = T2/T1 (boost during rapid changes)

  // Simplified model: valve moves toward Pref at rate determined by T2
  // This is more stable and physically meaningful for education

  // Compute valve movement rate
  // Rate = (Pref - valvePosition) / T2
  // This gives exponential approach to setpoint with time constant T2

  const valveRate = (Pref - valvePosition) / T2;

  // Apply lead-lag boost for transient response
  // If error is large (rapid change), boost the rate
  const transientBoost = 1.0 + (T2 / T1) * Math.abs(error) / 2.0;

  // Compute new valve position
  // Clamp rate to reasonable limits (valves can't move infinitely fast)
  const maxRate = 0.5; // 50% per second max valve speed
  const actualRate = Math.max(-maxRate, Math.min(maxRate, valveRate * transientBoost));

  const new_valvePosition = valvePosition + actualRate * dt;

  // Clamp to physical limits
  const clamped_valvePosition = Math.max(0, Math.min(2.0, new_valvePosition));

  return {
    valveTarget: Pref, // Store for visualization
    valvePosition: clamped_valvePosition,
  };
}

/**
 * Compute steady-state valve position for given Pref.
 * At steady state: valvePosition = Pref (unity tracking)
 *
 * @param {number} Pref - Power reference (pu)
 * @returns {number} Steady-state valve position (pu)
 */
export function tgov1SteadyState(Pref) {
  return Math.max(0, Math.min(2.0, Pref));
}

/**
 * Compute expected settling time for governor response.
 * Settling time ≈ 4·T2 (time constant of the servo)
 *
 * @returns {number} Settling time in seconds
 */
export function tgov1SettlingTime() {
  const { T2 } = CONSTANTS;
  return 4 * T2; // T2 = 3.5s, so settling ≈ 14s
}
