// src/physics/eac.js
// Equal Area Criterion (EAC) analysis
// Computes critical clearing angle (δcc) for stability assessment.

import { CONSTANTS } from '../constants.js';

// Compute critical clearing angle using Equal Area Criterion.
// Assumes post-fault Pmax_post < Pmax_normal (fault reduces transfer capability).
// Parameters:
//   - delta0: initial rotor angle (rad)
//   - Pm: mechanical power (pu)
//   - Pmax_normal: Pmax before fault (pu)
//   - Pmax_post: Pmax during/after fault (pu)
// Returns: δcc in radians
export function computeCriticalClearingAngle(delta0, Pm, Pmax_normal, Pmax_post) {
  // Find δ_max (unstable equilibrium point) for post-fault condition
  // Pe = Pmax_post * sin(δ) = Pm
  // sin(δ_max) = Pm / Pmax_post
  const sin_delta_max = Math.min(1, Math.max(-1, Pm / Pmax_post));
  const delta_max = Math.asin(sin_delta_max);

  // For simplicity, use the approximation:
  // A1 (accelerating area) = A2 (decelerating area)
  // A1 ≈ (Pm)*(δ_cc - delta0)
  // A2 ≈ ∫[δ_cc..δ_max] (Pmax_post*sin(δ) - Pm) dδ

  // Numerical integration for A2
  const n = 100;
  let A2 = 0;
  const dδ = (delta_max - delta0) / n;

  for (let i = 0; i < n; i++) {
    const δ = delta0 + i * dδ;
    const Pe = Pmax_post * Math.sin(δ);
    A2 += (Pe - Pm) * dδ;
  }

  // Iteratively solve for δ_cc where A1 = A2
  let δ_cc = delta0 + 0.1;
  for (let iter = 0; iter < 50; iter++) {
    // Recompute A2 from δ_cc to δ_max
    A2 = 0;
    const n2 = 100;
    const dδ2 = (delta_max - δ_cc) / n2;
    for (let i = 0; i < n2; i++) {
      const d = δ_cc + i * dδ2;
      A2 += (Pmax_post * Math.sin(d) - Pm) * dδ2;
    }

    // A1 = Pm * (δ_cc - delta0)
    const A1 = Pm * (δ_cc - delta0);

    const diff = A1 - A2;
    if (Math.abs(diff) < 1e-6) break;

    // Newton-like correction
    δ_cc += diff / (Pm + Pmax_post * Math.sin(δ_cc) - Pm) * 0.1;
    δ_cc = Math.max(delta0, Math.min(δ_max - 0.01, δ_cc));
  }

  return Math.min(δ_cc, Math.PI / 2);
}

// Check stability using EAC
// Returns: { stable: boolean, deltaCC: number, margin: number }
export function checkStability(delta, deltaCC) {
  const stable = delta < deltaCC;
  const margin = stable ? (deltaCC - delta) / deltaCC : 0;
  return { stable, deltaCC, margin };
}

// Compute accelerating/decelerating areas for P-δ plot highlighting
export function computeEACAreas(delta0, delta, Pm, Pmax, dt, steps) {
  // Simple numerical integration
  let A_acc = 0;  // accelerating area (Pm - Pe)
  let A_dec = 0;  // decelerating area (Pe - Pm)

  const dδ = (delta - delta0) / steps;
  for (let i = 0; i < steps; i++) {
    const d = delta0 + i * dδ;
    const Pe = Pmax * Math.sin(d);
    const diff = Pm - Pe;
    if (diff > 0) {
      A_acc += diff * dδ;
    } else {
      A_dec += -diff * dδ;
    }
  }

  return { A_acc, A_dec, balanced: Math.abs(A_acc - A_dec) < 0.01 };
}
