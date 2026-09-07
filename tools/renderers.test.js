// tools/renderers.test.js
// Tests for all renderer modules: phasor, pdelta, timeSeries, rlrChart
// Run: node tools/renderers.test.js

import assert from 'node:assert/strict';
import { computePhasorCoords, renderPhasor } from '../src/renderers/phasor.js';
import { renderPDelta } from '../src/renderers/pdelta.js';
import { renderTimeSeries, getLayout } from '../src/renderers/timeSeries.js';
import { renderRLRChart, computeRLRStats } from '../src/renderers/rlrChart.js';

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

// Stub DOM environment for testing in Node
const stubElements = {
  svg: (innerHTML = '', attrs = {}) => ({
    innerHTML: innerHTML,
    clientWidth: 300,
    clientHeight: 300,
    ...attrs,
    setAttribute() {},
  }),
  canvas: (ctx = {}, width = 600, height = 250) => ({
    clientWidth: width,
    clientHeight: height,
    width, height,
    getContext() { return ctx; },
    setTransform() {},
  }),
};

// ──────────────────────────────────────────────────────────
// PHASOR RENDERER TESTS
// ──────────────────────────────────────────────────────────
console.log('Phasor Renderer:');

test('computePhasorCoords: V at angle 0', () => {
  const state = { delta: 0, Pe: 0 };
  const coords = computePhasorCoords(state, { V: 1, Ea: 1.2, X: 0.3 });
  assert(Math.abs(coords.V_end.x - 1) < 1e-10, 'V_x = 1.0');
  assert(Math.abs(coords.V_end.y) < 1e-10, 'V_y = 0');
});

test('computePhasorCoords: E at angle δ', () => {
  const delta = Math.PI / 6;
  const coords = computePhasorCoords({ delta }, { V: 1, Ea: 1.2, X: 0.3 });
  assert(Math.abs(coords.E_end.x - 1.2 * Math.cos(delta)) < 1e-10);
  assert(Math.abs(coords.E_end.y - 1.2 * Math.sin(delta)) < 1e-10);
});

test('computePhasorCoords: I computed from E-V/X', () => {
  const { delta } = Math.PI / 6;
  const coords = computePhasorCoords(
    { delta: Math.PI / 6 },
    { V: 1.0, Ea: 1.2, X: 0.3 }
  );
  const expected_x = (1.2 * Math.sin(Math.PI / 6)) / 0.3;
  const expected_y = (1.2 * Math.cos(Math.PI / 6) - 1.0) / 0.3;
  assert(Math.abs(coords.I_end.x - expected_x) < 1e-10, `I_x = ${expected_x}`);
  assert(Math.abs(coords.I_end.y - expected_y) < 1e-10, `I_y = ${expected_y}`);
});

test('renderPhasor: generates SVG with key elements', () => {
  const svg = stubElements.svg();
  const result = renderPhasor(svg, { delta: 0.5, Pe: 1.0 }, { V: 1, Ea: 1.2, X: 0.3 });
  assert(result.includes('circle'), 'should include reference circle');
  assert(result.includes('line'), 'should include phasor lines');
  assert(result.includes('δ'), 'should include angle label');
});


// ──────────────────────────────────────────────────────────
// P-DELTA RENDERER TESTS
// ──────────────────────────────────────────────────────────
console.log('\nP-δ Curve Renderer:');

test('renderPDelta: generates sinusoidal path', () => {
  const svg = stubElements.svg('', { clientWidth: 360, clientHeight: 200 });
  const result = renderPDelta(svg,
    { delta: 0.5, Pe: 1.0, Pm: 1.0 },
    { Pmax: 2.0 }
  );
  assert(result.includes('M'), 'should start path with M');
  assert(result.includes('circle'), 'should include operating point marker');
  assert(result.includes('δ (rad)'), 'should include x-axis label');
  assert(result.includes('Pe (pu)'), 'should include y-axis label');
});

test('renderPDelta: includes Pm line', () => {
  const svg = stubElements.svg('', { clientWidth: 360, clientHeight: 200 });
  const result = renderPDelta(svg,
    { delta: 0.5, Pe: 1.0, Pm: 1.0 },
    { Pmax: 2.0 }
  );
  assert(result.includes('Pm'), 'should include Pm label');
  assert(result.includes('dasharray'), 'should use dashed line for Pm');
});

test('renderPDelta: EAC shading when deltaCC provided', () => {
  const svg = stubElements.svg('', { clientWidth: 360, clientHeight: 200 });
  const result = renderPDelta(svg,
    { delta: 0.5, Pe: 1.0, Pm: 1.0, deltaCC: 1.0 },
    { Pmax: 2.0 }
  );
  assert(result.includes('rgba'), 'should include shaded area (rgba)');
  assert(result.includes('path'), 'should include area path');
});


// ──────────────────────────────────────────────────────────
// TIMESERIES RENDERER TESTS
// ──────────────────────────────────────────────────────────
console.log('\nTime Series Renderer:');

test('getLayout: respects DPR', () => {
  const canvas = stubElements.canvas({}, 600, 250);
  // Note: DPR test in Node requires window mock
  const layout = getLayout(canvas);
  assert(layout.width === 600, `width = ${layout.width}`);
  assert(layout.height === 250, `height = ${layout.height}`);
  assert(layout.dpr >= 1, `dpr >= 1`);
});

test('renderTimeSeries: handles empty data gracefully', () => {
  const canvas = stubElements.canvas(
    { fillRect() {}, fillText() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {} },
    600, 250
  );
  const emptyData = {
    delta: [], omega: [], Pe: [], Pm: [],
  };
  assert.doesNotThrow(() => {
    renderTimeSeries(canvas, emptyData);
  });
});

test('renderTimeSeries: plots data points', () => {
  const draws = [];
  const canvas = stubElements.canvas(
    {
      fillRect() {},
      fillText() {},
      beginPath() { draws.push('beginPath'); },
      moveTo(x, y) { draws.push(`moveTo(${x.toFixed(1)},${y.toFixed(1)})`); },
      lineTo(x, y) { draws.push(`lineTo`); },
      stroke() { draws.push('stroke'); },
      setTransform() {},
    },
    600, 250
  );
  const data = {
    delta: [{ t: 0, v: 0.5 }, { t: 0.1, v: 0.6 }, { t: 0.2, v: 0.7 }],
    omega: [{ t: 0, v: 1.0 }, { t: 0.1, v: 1.02 }, { t: 0.2, v: 1.03 }],
    Pe: [{ t: 0, v: 1.0 }, { t: 0.1, v: 0.9 }, { t: 0.2, v: 0.8 }],
    Pm: [{ t: 0, v: 1.0 }, { t: 0.1, v: 1.0 }, { t: 0.2, v: 1.0 }],
  };
  renderTimeSeries(canvas, data);
  assert(draws.includes('beginPath'), 'should begin path');
  assert(draws.some(d => d.includes('moveTo')), 'should move to data point');
  assert(draws.includes('stroke'), 'should stroke path');
});


// ──────────────────────────────────────────────────────────
// RLR CHART RENDERER TESTS
// ──────────────────────────────────────────────────────────
console.log('\nRLR Chart Renderer:');

test('computeRLRStats: finds correct min/max/avg', () => {
  const data = [{ hour: 0, load: 0.65, period: 'Malam' }, { hour: 1, load: 1.0, period: 'Pagi' }];
  const stats = computeRLRStats(data);
  assert(Math.abs(stats.minLoad - 0.65) < 1e-10);
  assert(Math.abs(stats.maxLoad - 1.0) < 1e-10);
  assert(Math.abs(stats.avgLoad - 0.825) < 1e-10);
});

test('renderRLRChart: generates canvas content', () => {
  const ctx = {
    fillRect() {},
    fillText() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    setTransform() {},
  };
  const canvas = stubElements.canvas(ctx, 600, 170);
  const data = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    load: 0.5 + i / 24,
    period: 'Pagi',
  }));
  assert.doesNotThrow(() => {
    renderRLRChart(canvas, data, 5);
  });
});


// ──────────────────────────────────────────────────────────
// SUMMARY
// ──────────────────────────────────────────────────────────
console.log(`\n--- Results: ${pass} passed, ${fail} failed ---`);
if (fail > 0) {
  console.error('RENDERER TESTS FAILED!');
  process.exit(1);
}
