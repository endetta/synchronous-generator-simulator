// tools/lens-harness.js
// DOM stub harness for Node.js testing (jsdom-like environment)
// Desktop-only: 1920x1080 viewport

import { JSDOM } from 'jsdom';

export function createDOM() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    runScripts: 'outside-only',
    resources: 'usable',
  });

  const { window } = dom;
  const { document } = window;

  // Setup viewport (desktop)
  window.resizeTo(1920, 1080);

  // Mock window.matchMedia
  window.matchMedia = (query) => ({
    matches: query.includes('min-width: 1024px') || query.includes('min-width: 768px'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });

  // Mock devicePixelRatio
  Object.defineProperty(window, 'devicePixelRatio', {
    value: 1,
    configurable: false,
    writable: false,
  });

  return { dom, window, document };
}

// Create a mock SVG element
export function createSVGElement(name, attrs = {}) {
  const { document } = this;
  const el = document.createElementNS('http://www.w3.org/2000/svg', name);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

// Create a mock Canvas element
export function createCanvasElement(attrs = {}) {
  const { document } = this;
  const canvas = document.createElement('canvas');
  Object.entries(attrs).forEach(([k, v]) => canvas.setAttribute(k, v));
  // Mock context
  canvas.getContext = (type) => ({
    fillRect: () => {},
    fillText: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    setTransform: () => {},
    drawImage: () => {},
  });
  return canvas;
}

// Wait for DOM ready
export async function waitForDOMContentLoaded() {
  return new Promise(resolve => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      document.addEventListener('DOMContentLoaded', resolve);
    }
  });
}

// Wait for element to exist
export async function waitForElement(selector, timeout = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const el = document.querySelector(selector);
    if (el) return el;
    await new Promise(r => setTimeout(r, 50));
  }
  throw new Error(`Element not found: ${selector}`);
}

export default { createDOM, createSVGElement, createCanvasElement, waitForDOMContentLoaded, waitForElement };