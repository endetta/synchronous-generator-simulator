// src/ui/panels.js
// Toggle visibility for panels (phasor, pdelta, timeSeries).
// Uses CSS class toggle for smooth collapse.

export function initPanels() {
  const panelToggles = [
    { btnId: 'phasor-toggle', panelId: 'phasor-panel' },
    { btnId: 'pdelta-toggle', panelId: 'pdelta-panel' },
    { btnId: 'timeseries-toggle', panelId: 'timeseries-panel' },
    { btnId: 'controls-toggle', panelId: 'controls-panel' },
    { btnId: 'status-toggle', panelId: 'status-panel' },
  ];

  panelToggles.forEach(({ btnId, panelId }) => {
    const btn = document.getElementById(btnId);
    const panel = document.getElementById(panelId);

    if (!btn || !panel) return;

    btn.addEventListener('click', () => {
      const isVisible = !panel.classList.contains('collapsed');
      panel.classList.toggle('collapsed');
      btn.innerHTML = isVisible ? '▼ ' + btn.innerHTML.slice(2) : '▲ ' + btn.innerHTML.slice(2);
    });
  });
}

// Collapse all panels
export function collapseAllPanels() {
  document.querySelectorAll('.panel').forEach(p => p.classList.add('collapsed'));
  document.querySelectorAll('.toggle-btn').forEach(b => {
    if (b.innerHTML.startsWith('▲')) return;
    b.innerHTML = '▼ ' + b.innerHTML.slice(2);
  });
}

// Expand all panels
export function expandAllPanels() {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('collapsed'));
  document.querySelectorAll('.toggle-btn').forEach(b => {
    if (b.innerHTML.startsWith('▼')) return;
    b.innerHTML = '▲ ' + b.innerHTML.slice(2);
  });
}
