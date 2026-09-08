// src/constants.js
// Physical constants and default parameters for the Synchronous Generator Simulator
// All values are in per-unit (pu) unless otherwise noted.

export const CONSTANTS = {
  // System frequency (Hz) – used for ωs = 2π·F0
  F0: 60,

  // Inertia constant H (seconds of kinetic energy at rated speed)
  H: 5.0,

  // Damping coefficient (pu) – linear damping term in swing equation
  D: 2.0,

  // Maximum electrical power (pu) – sinusoidal P‑e curve amplitude
  Pmax: 2.0,

  // TGOV1 governor parameters
  R: 0.05,    // droop (5%)
  T1: 0.5,    // time constant T1 (s)
  T2: 3.5,    // time constant T2 (s)

  // Integration timestep (seconds) – RK4 step size
  DT: 0.01,

  // Real‑Load‑Response speed‑up factor (simulation runs 2400× real time)
  SPEED: 2400,

  // Initial rotor angle δ₀ (radians) – 30° default for demo
  DELTA_INIT: Math.PI / 6,

  // AVR parameters (IEEE Type 1 simplified)
  AVR_KA: 200,      // Regulator gain (pu)
  AVR_TA: 0.02,     // Regulator time constant (s)
  AVR_KE: 1.0,      // Exciter gain (pu)
  AVR_TE: 0.5,      // Exciter time constant (s)
  AVR_VRMIN: -6.5,  // Regulator output lower limit (pu)
  AVR_VRMAX: 7.0,   // Regulator output upper limit (pu)
  AVR_EFDMIN: 0.0,  // Field voltage lower limit (pu)
  AVR_EFDMAX: 6.0,  // Field voltage upper limit (pu)
  AVR_VREF: 1.0,    // Voltage reference setpoint (pu)
};
