// src/physics/avr.js
// IEEE Type 1 Excitation System (Simplified AC4C Model)
// Automatic Voltage Regulator (AVR) for synchronous generator.
//
// Block diagram (simplified):
//
//   Vref ──(+)──[Ka/(1+Ta·s)]──(+)──[1/(1+Te·s)]──► Efd ──► E'
//          -                    -                    │
//          │                    │                    │
//          └── Vt ◄─────────────┴────────────────────┘
//                     (terminal voltage feedback)
//
// Key components:
//   1. Voltage comparator: error = Vref - Vt
//   2. Regulator (amplifier): gain Ka, time constant Ta
//   3. Exciter: gain Ke, time constant Te
//   4. Output limits: Efdmin to Efdmax
//
// Physical interpretation:
//   - Vref: desired terminal voltage (setpoint)
//   - Vt: actual terminal voltage (feedback)
//   - Efd: field voltage applied to rotor winding
//   - E': internal EMF magnitude (proportional to Efd)
//
// Parameters based on IEEE Std 421.5-2016 AC4C model.

import { CONSTANTS } from '../constants.js';

/**
 * Create initial AVR state.
 * @returns {Object} Initial state { Vr, Efd }
 */
export function makeAVRState() {
  return {
    Vr: 0.0,    // Regulator output (internal state)
    Efd: 1.0,   // Field voltage (pu) - start at nominal
  };
}

/**
 * Compute one AVR timestep.
 *
 * Simplified IEEE Type 1 model:
 *   1. Voltage error: Verr = Vref - Vt
 *   2. Regulator: dVr/dt = (Ka·Verr - Vr) / Ta
 *   3. Exciter: dEfd/dt = (Vr - Ke·Efd) / Te
 *   4. Apply limits
 *
 * @param {Object} state - Current AVR state { Vr, Efd }
 * @param {number} Vref - Voltage reference setpoint (pu, typically 1.0)
 * @param {number} Vt - Terminal voltage (pu, from power flow)
 * @param {Object} params - AVR parameters { Ka, Ta, Ke, Te, Vrmin, Vrmax, Efdmin, Efdmax }
 * @param {number} dt - Timestep (s)
 * @returns {Object} New state { Vr, Efd }
 */
export function avrStep(state, Vref, Vt, params, dt) {
  const {
    Ka = 200,      // Regulator gain (pu)
    Ta = 0.02,     // Regulator time constant (s)
    Ke = 1.0,      // Exciter gain (pu)
    Te = 0.5,      // Exciter time constant (s)
    Vrmin = -6.5,  // Regulator output lower limit (pu)
    Vrmax = 7.0,   // Regulator output upper limit (pu)
    Efdmin = 0.0,  // Field voltage lower limit (pu)
    Efdmax = 6.0,  // Field voltage upper limit (pu)
  } = params;

  const { Vr, Efd } = state;

  // Step 1: Compute voltage error
  const Verr = Vref - Vt;

  // Step 2: Regulator dynamics (first-order lag with gain)
  // dVr/dt = (Ka·Verr - Vr) / Ta
  const dVr = (Ka * Verr - Vr) / Ta;
  const Vr_unclamped = Vr + dVr * dt;

  // Apply regulator output limits (ceiling)
  const Vr_new = Math.max(Vrmin, Math.min(Vrmax, Vr_unclamped));

  // Step 3: Exciter dynamics (first-order lag)
  // dEfd/dt = (Vr - Ke·Efd) / Te
  const dEfd = (Vr_new - Ke * Efd) / Te;
  const Efd_unclamped = Efd + dEfd * dt;

  // Apply field voltage limits (important for transient stability)
  const Efd_new = Math.max(Efdmin, Math.min(Efdmax, Efd_unclamped));

  return {
    Vr: Vr_new,
    Efd: Efd_new,
  };
}

/**
 * Compute internal EMF magnitude from field voltage.
 * E' = Efd · (Xad / Xf) ≈ Efd · Kex
 *
 * For simplified model, assume Kex ≈ 1 (unity exciter gain)
 *
 * @param {number} Efd - Field voltage (pu)
 * @returns {number} Internal EMF magnitude (pu)
 */
export function computeEprime(Efd) {
  // Simplified: E' ≈ Efd
  // In detailed model: E' = Efd · (Xad / Xf)
  // where Xad = d-axis mutual reactance, Xf = field reactance
  return Efd;
}

/**
 * Compute terminal voltage from power flow.
 * Simplified infinite bus model: Vt = |V| = 1.0 pu
 *
 * In detailed model:
 *   Vt = |V + jX·I| (voltage at generator terminals)
 *
 * @param {number} delta - Rotor angle (rad)
 * @param {number} Ea - Internal EMF magnitude (pu)
 * @param {number} V - Infinite bus voltage (pu)
 * @param {number} X - Reactance (pu)
 * @returns {number} Terminal voltage magnitude (pu)
 */
export function computeTerminalVoltage(delta, Ea, V, X) {
  // Simplified: assume terminal voltage ≈ bus voltage
  // In reality: Vt depends on internal impedance and current
  // Vt = √[(V + X·I·sin(δ))² + (X·I·cos(δ))²]
  // For educational purposes, keep it simple:
  return V;
}

/**
 * AVR parameter presets for different scenarios.
 */
export const AVR_PRESETS = {
  default: {
    Ka: 200,     // High gain for fast response
    Ta: 0.02,    // Fast regulator
    Ke: 1.0,     // Unity exciter gain
    Te: 0.5,     // Moderate exciter response
    Vrmin: -6.5,
    Vrmax: 7.0,
    Efdmin: 0.0,
    Efdmax: 6.0,
  },
  slow: {
    Ka: 50,      // Low gain
    Ta: 0.1,     // Slow regulator
    Ke: 1.0,
    Te: 1.0,     // Slow exciter
    Vrmin: -3.0,
    Vrmax: 4.0,
    Efdmin: 0.0,
    Efdmax: 4.0,
  },
  fast: {
    Ka: 400,     // Very high gain
    Ta: 0.01,    // Very fast regulator
    Ke: 1.0,
    Te: 0.2,     // Fast exciter
    Vrmin: -8.0,
    Vrmax: 10.0,
    Efdmin: 0.0,
    Efdmax: 8.0,
  },
};
