// src/physics/cct.js
// Critical Clearing Time (CCT) calculation
// Integrates swing equation during fault to find time when δ reaches δcc

import { rk4Step } from './swing.js';
import { computeCriticalClearingAngle } from './eac.js';

/**
 * Compute Critical Clearing Time by integrating swing equation during fault.
 *
 * @param {number} delta0 - Initial rotor angle (rad)
 * @param {number} Pm - Mechanical power (pu)
 * @param {number} Pmax_normal - Pmax before/after fault (pu)
 * @param {number} Pmax_fault - Pmax during fault (pu, typically lower)
 * @param {number} dt - Integration timestep (s)
 * @returns {{ cct: number, converged: boolean, deltaFinal: number }}
 */
export function computeCCT(delta0, Pm, Pmax_normal, Pmax_fault, dt) {
  // First, compute critical clearing angle
  const { deltaCC } = computeCriticalClearingAngle(delta0, Pm, Pmax_normal, Pmax_fault);

  // Integrate swing equation during fault until δ reaches δcc
  // Fault condition: Pmax is reduced (Pmax_fault < Pmax_normal)
  // During fault: Pe = Pmax_fault * sin(δ), which is < Pm typically

  let delta = delta0;
  let omega = 0.0; // Start at synchronous speed (relative convention)
  const M = 2 * 5.0 / (2 * Math.PI * 60); // H=5.0, F0=60 (default constants)
  const D = 2.0; // damping

  const maxTime = 5.0; // Maximum simulation time (5 seconds)
  const maxSteps = Math.floor(maxTime / dt);

  for (let step = 0; step < maxSteps; step++) {
    const state = { delta, omega };
    const params = {
      Pm,
      Pmax: Pmax_fault, // Use fault Pmax during fault
      D
    };

    const newState = rk4Step(state, params, dt);
    delta = newState.delta;
    omega = newState.omega;

    // Check if we've reached or exceeded critical clearing angle
    if (delta >= deltaCC) {
      const cct = step * dt;
      return {
        cct,
        converged: true,
        deltaFinal: delta,
        deltaCC
      };
    }
  }

  // Did not reach δcc within max time - system is very stable
  return {
    cct: maxTime,
    converged: false,
    deltaFinal: delta,
    deltaCC
  };
}
