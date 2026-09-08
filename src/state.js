// src/state.js
// Centralized simulation state + minimal event bus.
// Physics modules receive plain objects; renderers receive snapshots.
// All mutations go through the exported action functions so UI and
// render loop always see a consistent state.
//
// Convention: omega uses relative measure where 0.0 = synchronous speed (1.0 pu).
// This keeps dω/dt = (Pm - Pe - D·ω) / M mathematically consistent.

export function makeState() {
  return {
    // --- physics ---
    delta: 0.524,      // rotor angle (rad) ~30° default
    omega: 1.0,        // angular velocity (1.0 = synchronous speed in absolute convention)
    Pe: 0.0,           // electrical power (pu) - computed from delta
    Pm: 1.0,           // mechanical power (pu) - initial value

    // --- governor ---
    Pref: 1.0,         // speed/load demand set-point
    valve: 0.0,        // TGOV1 valve position [0..1]
    droop: 0.05,       // droop setting (pu, default 5%)

    // --- AVR ---
    Vref: 1.0,         // voltage reference setpoint (pu)
    Vt: 1.0,           // terminal voltage (pu) - feedback from power flow
    Efd: 1.0,          // field voltage (pu)
    Ea: 1.2,           // internal EMF magnitude E' (pu)
    avrEnabled: true,  // AVR control enabled

    // --- fault ---
    faultOn: false,     // true while three-phase fault is active
    faultStart: 0,     // sim-time when fault applied (s)
    faultClear: 0,     // sim-time when fault cleared (s)

    // --- simulation control ---
    running: false,     // integrator loop active
    simTime: 0,         // elapsed simulated time (s)

    // --- EAC analysis flags ---
    deltaCC: 0,         // critical clearing angle (rad)
    deltaMax: Math.PI,  // unstable angle boundary (rad)
    stabilityMargin: 0, // A1/A2 area margin (pu·rad)
    cct: 0,             // critical clearing time (s)

    // --- RLR mode ---
    rlrEnabled: false,
    rlrTime: 0,         // elapsed RLR time (h)
  };
}

/*
 * Simple event bus – components subscribe to 'change' to re-render.
 * This keeps the render loop decoupled from direct polling.
 */
const listeners = new Set();

export const state = makeState();

export function onChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function commit() {
  // Called after any batch of mutations – notify all subscribers.
  listeners.forEach((l) => l(state));
}

/*
 * Mutation helpers — each updates a field and commits.
 */
export function setDelta(v) { state.delta = v; commit(); }
export function setOmega(v) { state.omega = v; commit(); }
export function setPe(v)     { state.Pe = v;   commit(); }
export function setPm(v)     { state.Pm = v;   commit(); }
export function setPref(v)   { state.Pref = v; commit(); }
export function setDroop(v)  { state.droop = v; commit(); }
export function setVref(v)   { state.Vref = v; commit(); }
export function setAVREnabled(v) { state.avrEnabled = v; commit(); }
export function setFaultOn(v){ state.faultOn = v; commit(); }
export function setRunning(v) { state.running = v; commit(); }
export function setRLREnabled(v) { state.rlrEnabled = v; commit(); }

export function reset() {
  Object.assign(state, makeState());
  commit();
}
