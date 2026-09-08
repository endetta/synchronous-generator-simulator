/**
 * tutorialOverlay.js - First-visit tutorial overlay
 *
 * Menampilkan panduan 5 langkah untuk pengguna baru.
 * Hanya muncul sekali (disimpan di localStorage).
 */

// Tutorial steps
const TUTORIAL_STEPS = [
  {
    target: '#phasor-panel',
    title: '1. Diagram Phasor',
    content: 'Diagram ini menunjukkan hubungan sudut antara tegangan terminal (V), tegangan internal (E\'), dan arus (I). Perhatikan sudut δ yang menunjukkan posisi rotor.',
    position: 'right',
  },
  {
    target: '#controls-panel',
    title: '2. Kontrol Simulasi',
    content: 'Atur parameter simulasi di sini:\n• Daya mekanik (Pm)\n• Droop governor\n• Kondisi gangguan\n• Kondisi awal\n\nKlik header untuk expand/collapse section.',
    position: 'right',
  },
  {
    target: '#pdelta-panel',
    title: '3. Kurva P-δ (EAC)',
    content: 'Kurva ini menunjukkan daya vs sudut rotor dengan Equal Area Criterion. Area yang diarsir menunjukkan margin stabilitas. Titik merah adalah titik operasi saat ini.',
    position: 'left',
  },
  {
    target: '#signal-selector',
    title: '4. Pemilih Sinyal',
    content: 'Pilih sinyal yang akan ditampilkan di grafik respon waktu:\n• δ (sudut rotor)\n• ω (kecepatan)\n• Pe (daya listrik)\n• Pm (daya mekanik)',
    position: 'left',
  },
  {
    target: '#timeseries-canvas',
    title: '5. Respon Waktu',
    content: 'Grafik ini menunjukkan respons dinamik sinyal terpilih terhadap waktu. Hover pada grafik untuk melihat nilai (t, value) dengan crosshair. Simulasi berjalan dengan Δt = 10 ms.',
    position: 'left',
  },
];

const STORAGE_KEY = 'sync-gen-simulator-tutorial-seen';
let overlayElement = null;
let currentStep = 0;
let highlightElement = null;

/**
 * Initialize tutorial overlay (only shows on first visit)
 */
export function initTutorialOverlay() {
  // Check if tutorial has been seen
  if (typeof window !== 'undefined' && window.localStorage) {
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (seen === 'true') {
      return; // Already seen, don't show
    }
  }

  // Create overlay
  createOverlay();

  // Show first step
  showStep(0);

  // Mark as seen after completion or skip
  markAsSeen();
}

/**
 * Create overlay elements
 */
function createOverlay() {
  // Overlay backdrop
  overlayElement = document.createElement('div');
  overlayElement.id = 'tutorial-overlay';
  overlayElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;

  // Highlight element (cutout)
  highlightElement = document.createElement('div');
  highlightElement.id = 'tutorial-highlight';
  highlightElement.style.cssText = `
    position: absolute;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
    border: 2px solid #D73A49;
    border-radius: 8px;
    pointer-events: none;
    transition: all 0.3s ease;
  `;

  // Tooltip container
  const tooltipContainer = document.createElement('div');
  tooltipContainer.id = 'tutorial-tooltip';
  tooltipContainer.style.cssText = `
    position: absolute;
    background: white;
    border-radius: 8px;
    padding: 16px 20px;
    max-width: 320px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    z-index: 10001;
  `;

  overlayElement.appendChild(highlightElement);
  overlayElement.appendChild(tooltipContainer);
  document.body.appendChild(overlayElement);

  // Fade in
  setTimeout(() => {
    overlayElement.style.opacity = '1';
  }, 50);
}

/**
 * Show specific tutorial step
 * @param {number} step - Step index (0-based)
 */
function showStep(step) {
  if (!overlayElement || step < 0 || step >= TUTORIAL_STEPS.length) return;

  currentStep = step;
  const stepData = TUTORIAL_STEPS[step];
  const targetElement = document.querySelector(stepData.target);

  if (!targetElement) {
    console.warn(`Tutorial target not found: ${stepData.target}`);
    return;
  }

  // Position highlight
  const rect = targetElement.getBoundingClientRect();
  highlightElement.style.left = `${rect.left - 8}px`;
  highlightElement.style.top = `${rect.top - 8}px`;
  highlightElement.style.width = `${rect.width + 16}px`;
  highlightElement.style.height = `${rect.height + 16}px`;

  // Update tooltip content
  const tooltipContainer = document.getElementById('tutorial-tooltip');
  if (tooltipContainer) {
    const formattedContent = stepData.content.replace(/\n/g, '<br>');

    tooltipContainer.innerHTML = `
      <div style="font-size: 16px; font-weight: 600; color: #24292E; margin-bottom: 8px;">
        ${stepData.title}
      </div>
      <div style="font-size: 13px; color: #586069; line-height: 1.6; margin-bottom: 16px;">
        ${formattedContent}
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 12px; color: #959DA5;">
          Langkah ${step + 1} dari ${TUTORIAL_STEPS.length}
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="tutorial-skip" style="
            background: transparent;
            border: 1px solid #E1E4E8;
            border-radius: 4px;
            padding: 6px 12px;
            font-size: 12px;
            color: #586069;
            cursor: pointer;
          ">Lewati</button>
          <button id="tutorial-next" style="
            background: #D73A49;
            border: none;
            border-radius: 4px;
            padding: 6px 12px;
            font-size: 12px;
            color: white;
            cursor: pointer;
          ">${step === TUTORIAL_STEPS.length - 1 ? 'Selesai' : 'Lanjut'}</button>
        </div>
      </div>
    `;

    // Position tooltip
    let tooltipLeft, tooltipTop;
    if (stepData.position === 'right') {
      tooltipLeft = rect.right + 20;
      tooltipTop = rect.top;
    } else {
      tooltipLeft = rect.left - 340;
      tooltipTop = rect.top;
    }

    // Keep within viewport
    if (tooltipLeft + 340 > window.innerWidth) {
      tooltipLeft = rect.left - 340;
    }
    if (tooltipLeft < 10) {
      tooltipLeft = rect.right + 20;
    }
    if (tooltipTop + 250 > window.innerHeight) {
      tooltipTop = window.innerHeight - 260;
    }
    if (tooltipTop < 10) {
      tooltipTop = 10;
    }

    tooltipContainer.style.left = `${tooltipLeft}px`;
    tooltipContainer.style.top = `${tooltipTop}px`;

    // Setup button handlers
    const skipBtn = document.getElementById('tutorial-skip');
    const nextBtn = document.getElementById('tutorial-next');

    if (skipBtn) {
      skipBtn.addEventListener('click', closeTutorial);
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
          showStep(currentStep + 1);
        } else {
          closeTutorial();
        }
      });
    }
  }
}

/**
 * Close tutorial overlay
 */
function closeTutorial() {
  if (overlayElement) {
    overlayElement.style.opacity = '0';
    setTimeout(() => {
      if (overlayElement && overlayElement.parentNode) {
        overlayElement.parentNode.removeChild(overlayElement);
      }
    }, 300);
  }
}

/**
 * Mark tutorial as seen in localStorage
 */
function markAsSeen() {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(STORAGE_KEY, 'true');
  }
}

/**
 * Reset tutorial (for testing)
 */
export function resetTutorial() {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
