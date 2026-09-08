// Debug script for TGOV1
import { CONSTANTS } from '../src/constants.js';
import { makeTgov1State, tgov1Step } from '../src/physics/tgov1.js';

console.log('TGOV1 Debug Test');
console.log('Parameters: T1 =', CONSTANTS.T1, 's, T2 =', CONSTANTS.T2, 's, R =', CONSTANTS.R);
console.log('');

const state = makeTgov1State();
const Pref = 1.5;
const R = CONSTANTS.R;
const dt = 0.01;
let Pm = 0.0;

console.log('Initial: Pref =', Pref, ', Pm =', Pm);
console.log('');

for (let i = 0; i < 10; i++) {
  const error = Pref - Pm;
  const u = error / R;

  console.log(`Step ${i}:`);
  console.log('  error =', error.toFixed(4));
  console.log('  u = error/R =', u.toFixed(4));
  console.log('  state.x =', state.x.toFixed(4));

  const newState = tgov1Step(state, Pref, Pm, R, dt);
  Object.assign(state, newState);

  console.log('  y (valve) =', state.valvePosition.toFixed(4));
  console.log('  x_new =', state.x.toFixed(4));

  Pm = newState.valvePosition;
  console.log('  Pm (next) =', Pm.toFixed(4));
  console.log('');

  if (i === 0 || i === 4 || i === 9) {
    console.log('---');
  }
}

console.log('After 10 steps:');
console.log('Final valve position:', state.valvePosition);
console.log('Final Pm:', Pm);
