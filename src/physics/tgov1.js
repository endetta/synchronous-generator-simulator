// src/physics/tgov1.js
// TGOV1 Governor model per IEEE Std 421.5
// Steam turbine governor with lead-lag dynamics and droop.

import { CONSTANTS } from '../constants.js';

// TGOV1 state structure:
// - y: valve position [0, 1] (output)
// - x1: integrator state for T1 (low-pressure reheat)
// - x2: integrator state for T2 (lead-lag)

export function makeTgov1State() {
  return {
    y: 0.0,    // valve position
    x1: 0.0,   // integrator for T1
    x2: 0.0,   // integrator for T2
  };
}

// Compute TGOV1 output for one timestep.
// Parameters: Pref (set-point), Pm (mechanical power), R (droop), dt
// Returns: new valve position y (used as Pm for next swing step)
export function tgov1Step(state, Pref, Pm, R, dt) {
  const { T1, T2 } = CONSTANTS;
  const { y, x1, x2 } = state;

  // Error signal
  const E = Pref - Pm;

  // Proportional term with droop
  const EG = E / R;

  // Lead-lag block: (1 + T2*s) / (1 + T1*s)
  // Discrete-time approximation (backward Euler):
  // X2(z) = (T2*s) / (1 + T1*s) * U(z)
  // => x2_new = x2 + dt/T1 * (T2*EG - x2)

  const x2_new = x2 + (dt / T1) * (T2 * EG - x2);

  // Valve position is sum of proportional and lead-lag
  // y = EG + x2 (ignoring integral term for simplicity - basic TGOV1)
  const y_new = EG + x2_new;

  // Clamp valve position to reasonable range
  const y_clamped = Math.max(0, Math.min(2.0, y_new));

  return {
    y: y_clamped,
    x1: x1,    // not used in minimal TGOV1
    x2: x2_new,
  };
}

// Stabilizing value (steady-state valve position for Pref = Pm)
export function tgov1SteadyState(Pref, Pm) {
  const { R } = CONSTANTS;
  const E = Pref - Pm;
  const EG = E / R;
  // At steady state, x2 = 0 (no dynamics), so y = EG
  // But we want y such that Pm = y at steady state
  // So Pref - Pm = R*Pm => Pref = Pm*(1+R) => Pm = Pref/(1+R)
  // For small droop, Pm ≈ Pref
  return Math.max(0, Math.min(2.0, Pref));
}
