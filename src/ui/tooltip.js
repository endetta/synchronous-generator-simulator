// src/ui/tooltip.js
// Interactive tooltip for phasor/SVG hover events.
// Shows δ, Pe, Pm, and stability info near the cursor.

export function initTooltip(svgElement, tooltipElement) {
  if (!tooltipElement) return null;

  svgElement.addEventListener('mousemove', (e) => {
    const rect = svgElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert SVG coordinates to data values (approximate)
    // For phasor diagram: center is reference
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const delta = Math.atan2(y - cy, x - cx);

    // Format tooltip content
    const deltaDeg = (delta * 180 / Math.PI).toFixed(1);
    tooltipElement.innerHTML = `<strong>Phasor Info</strong><br>δ = ${deltaDeg}°`;
    tooltipElement.style.left = `${e.clientX + 10}px`;
    tooltipElement.style.top = `${e.clientY + 10}px`;
    tooltipElement.classList.add('visible');
  });

  svgElement.addEventListener('mouseleave', () => {
    if (tooltipElement) {
      tooltipElement.classList.remove('visible');
    }
  });

  return tooltipElement;
}

// Update tooltip with simulation state
export function updateTooltip(tooltipElement, state, params) {
  if (!tooltipElement) return;

  const deltaDeg = (state.delta * 180 / Math.PI).toFixed(1);
  const content = `
    <strong>Generator State</strong><br>
    δ = ${deltaDeg}°<br>
    ω = ${state.omega.toFixed(3)} pu<br>
    Pe = ${state.Pe.toFixed(3)} pu<br>
    Pm = ${state.Pm.toFixed(3)} pu<br>
    ${state.stabilityMargin > 0 ? 'Stabilitas: <span style="color:green">Stabil</span>' : 'Stabilitas: <span style="color:red">Tidak stabil</span>'}
  `;
  tooltipElement.innerHTML = content;
}

// Position tooltip near an element
export function positionTooltip(tooltipElement, event) {
  if (!tooltipElement) return;

  const x = event.clientX;
  const y = event.clientY;
  tooltipElement.style.left = `${x + 10}px`;
  tooltipElement.style.top = `${y + 10}px`;
  tooltipElement.classList.add('visible');
}
