// src/physics/swing.js
// RK4 integrator for the swing equation:
// M·d²δ/dt² = Pm - Pe - D·(dδ/dt)
// where Pe = Pmax·sin(δ)

import { CONSTANTS } from '../constants.js';

// Compute derivatives for the swing equation state-space form.
// State vector: [δ, ω]
// Returns: [dδ/dt, dω/dt]
export function ode(state, params) {
  const { delta, omega } = state;
  const { Pm, Pmax, D } = params;

  // Pe = Pmax·sin(δ)
  const Pe = Pmax * Math.sin(delta);

  // dδ/dt = ω (angular velocity relative to 1.0 pu sync, consistent convention)
  const dDelta = omega;

  // dω/dt = (Pm - Pe - D·ω) / M
  // Uses relative convention: ω deviation means ω=1.0 at synchronous speed
  const M = 2 * CONSTANTS.H / (2 * Math.PI * CONSTANTS.F0);
  const dOmega = (Pm - Pe - D * omega) / M;

  return [dDelta, dOmega];
}

// Single RK4 step (Runge-Kutta 4th order)
// Returns new state [δ', ω']
export function rk4Step(state, params, dt) {
  const k1 = ode(state, params);

  const state2 = {
    delta: state.delta + 0.5 * dt * k1[0],
    omega: state.omega + 0.5 * dt * k1[1]
  };
  const k2 = ode(state2, params);

  const state3 = {
    delta: state.delta + 0.5 * dt * k2[0],
    omega: state.omega + 0.5 * dt * k2[1]
  };
  const k3 = ode(state3, params);

  const state4 = {
    delta: state.delta + dt * k3[0],
    omega: state.omega + dt * k3[1]
  };
  const k4 = ode(state4, params);

  const deltaNew = state.delta + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
  const omegaNew = state.omega + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);

  return { delta: deltaNew, omega: omegaNew };
}

// Compute electrical power at given angle
export function computePe(delta, Pmax) {
  return Pmax * Math.sin(delta);
}

// Compute mechanical power for steady-state at given angle
export function computePmForSteadyState(delta, Pmax) {
  return Pmax * Math.sin(delta);
}
