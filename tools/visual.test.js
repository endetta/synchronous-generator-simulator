// Playwright Visual Regression Tests
// Tests SVG/Canvas rendering untuk mencegah visual bugs

import { test, expect } from '@playwright/test';

test.describe('Phasor Diagram Renderer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('renders phasor diagram with default state', async ({ page }) => {
    // Wait for phasor SVG to render
    const phasor = page.locator('#phasor-svg');
    await expect(phasor).toBeVisible();

    // Take screenshot for baseline
    await expect(page).toHaveScreenshot('phasor-default.png', {
      clip: { x: 0, y: 0, width: 400, height: 400 },
      maxDiffPixels: 100,
    });
  });

  test('updates phasor when delta changes', async ({ page }) => {
    // Change delta slider
    const deltaSlider = page.locator('input[name="delta"]');
    await deltaSlider.fill('30');

    // Wait for re-render
    await page.waitForTimeout(100);

    // Verify visual change
    await expect(page).toHaveScreenshot('phasor-delta-30.png', {
      clip: { x: 0, y: 0, width: 400, height: 400 },
      maxDiffPixels: 100,
    });
  });
});

test.describe('P-Delta Curve Renderer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('renders P-delta curve with EAC shading', async ({ page }) => {
    const pdelta = page.locator('#pdelta-svg');
    await expect(pdelta).toBeVisible();

    await expect(page).toHaveScreenshot('pdelta-curve.png', {
      clip: { x: 0, y: 0, width: 600, height: 300 },
      maxDiffPixels: 150,
    });
  });
});

test.describe('Time Series Canvas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('renders 4-stack time series', async ({ page }) => {
    const canvas = page.locator('canvas#time-series');
    await expect(canvas).toBeVisible();

    // Start simulation
    const playButton = page.locator('button#play');
    await playButton.click();

    // Wait for data points
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('time-series-running.png', {
      clip: { x: 0, y: 0, width: 800, height: 600 },
      maxDiffPixels: 200,
    });
  });
});

test.describe('Swing Equation Physics', () => {
  test('swing equation integrates correctly', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Set known initial conditions
    await page.locator('input[name="delta"]').fill('0.5');
    await page.locator('input[name="omega"]').fill('1.0');
    await page.locator('input[name="Pm"]').fill('1.0');

    // Start simulation
    await page.locator('button#play').click();

    // Wait 1 second real time
    await page.waitForTimeout(1000);

    // Read state from DOM
    const deltaValue = await page.locator('#delta-readout').textContent();
    const omegaValue = await page.locator('#omega-readout').textContent();

    // Verify swing equation behavior (delta should increase)
    expect(parseFloat(deltaValue)).toBeGreaterThan(0.5);
    expect(parseFloat(omegaValue)).toBeCloseTo(1.0, 1);
  });
});
