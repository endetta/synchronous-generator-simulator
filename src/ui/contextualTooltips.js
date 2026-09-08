/**
 * contextualTooltips.js - Contextual tooltips for interactive elements
 *
 * Menampilkan tooltip dengan penjelasan teknis saat hover
 * pada elemen interaktif di UI.
 */

// Tooltip content untuk setiap elemen
const TOOLTIP_CONTENT = {
  // Phasor panel
  'phasor-svg': {
    title: 'Diagram Phasor Generator',
    content: 'Menunjukkan hubungan sudut antara tegangan terminal (V), tegangan internal (E\'), dan arus (I). Sudut δ adalah sudut rotor relatif terhadap bus.',
  },
  'status-delta-inline': {
    title: 'Sudut Rotor (δ)',
    content: 'Sudut rotor relatif terhadap bus referensi. Nilai stabil ~30° menunjukkan operasi normal. δ > 90° mengindikasikan ketidakstabilan.',
  },
  'status-omega-inline': {
    title: 'Kecepatan Sudut (ω)',
    content: 'Kecepatan sudut rotor dalam per-unit relatif terhadap kecepatan sinkron. ω = 1.0 pu adalah kecepatan sinkron (3000 rpm untuk 2-pole, 50 Hz).',
  },
  'status-pe-inline': {
    title: 'Daya Listrik (Pe)',
    content: 'Daya listrik output generator dalam per-unit. Pe = Pmax·sin(δ), di mana Pmax adalah daya maksimum transfer.',
  },

  // Controls
  'pm-slider': {
    title: 'Daya Mekanik Input (Pm)',
    content: 'Daya mekanik input dari turbin ke generator. Mengatur nilai referensi untuk governor. Range 0-2 pu.',
  },
  'scenario-select': {
    title: 'Skenario Simulasi',
    content: 'Pilih skenario preset untuk simulasi:\n• Startup: Mulai dari kondisi awal\n• Steady State: Operasi steady-state\n• Fault Response: Respons terhadap gangguan\n• Swing Test: Uji osilasi rotor',
  },
  'droop-slider': {
    title: 'Droop Governor (R)',
    content: 'Karakteristik droop governor dalam persen. Menentukan perubahan kecepatan per perubahan beban. R = 5% adalah standar IEEE.',
  },
  'fault-select': {
    title: 'Jenis Gangguan',
    content: 'Tipe gangguan yang akan disimulasikan:\n• Tidak Ada: Operasi normal\n• 3-Phasa: Gangguan tiga fasa (paling berat)\n• L-G: Gangguan line-to-ground',
  },
  'fault-duration-slider': {
    title: 'Durasi Gangguan',
    content: 'Durasi gangguan dalam siklus (1 siklus = 20 ms untuk 50 Hz). Gangguan > 10 siklus berisiko menyebabkan ketidakstabilan.',
  },
  'delta-slider': {
    title: 'Sudut Awal (δ₀)',
    content: 'Kondisi awal sudut rotor. Digunakan untuk mengatur starting point simulasi. δ₀ = 30° adalah kondisi operasi normal.',
  },
  'omega-slider': {
    title: 'Kecepatan Awal (ω₀)',
    content: 'Kondisi awal kecepatan rotor dalam pu. ω₀ = 1.0 pu adalah kecepatan sinkron. Perbedaan dari 1.0 menyebabkan osilasi.',
  },
  'btn-start': {
    title: 'Mulai Simulasi',
    content: 'Memulai simulasi dinamik. Integrator RK4 akan berjalan dengan step time Δt = 10 ms.',
  },
  'btn-stop': {
    title: 'Hentikan Simulasi',
    content: 'Menghentikan simulasi. State terakhir dipertahankan untuk analisis.',
  },
  'btn-reset': {
    title: 'Reset Simulasi',
    content: 'Mereset semua state ke kondisi awal. Gunakan untuk memulai simulasi baru.',
  },

  // P-delta panel
  'pdelta-svg': {
    title: 'Kurva P-δ (Equal Area Criterion)',
    content: 'Menunjukkan kurva daya P = Pmax·sin(δ) dengan Equal Area Criterion. Area A1 (accelerating) harus < A2 (decelerating) untuk stabilitas.',
  },

  // Time series
  'timeseries-canvas': {
    title: 'Respon Waktu',
    content: 'Menunjukkan respons dinamik variabel state terhadap waktu. Gunakan slider untuk memilih sinyal yang ditampilkan.',
  },
  'signal-selector': {
    title: 'Pemilih Sinyal',
    content: 'Pilih sinyal yang akan ditampilkan di grafik:\n• δ: Sudut rotor\n• ω: Kecepatan sudut\n• Pe: Daya listrik\n• Pm: Daya mekanik',
  },
};

let tooltipElement = null;
let currentTimeout = null;

/**
 * Initialize contextual tooltips
 */
export function initContextualTooltips() {
  tooltipElement = document.getElementById('tooltip');
  if (!tooltipElement) {
    console.warn('contextualTooltips: tooltip element not found');
    return;
  }

  // Setup hover handlers for all elements with tooltip content
  Object.keys(TOOLTIP_CONTENT).forEach(elementId => {
    const element = document.getElementById(elementId);
    if (element) {
      setupHoverHandlers(element, TOOLTIP_CONTENT[elementId]);
    }
  });

  // Setup hover handlers for signal radio buttons
  const signalRadios = document.querySelectorAll('.signal-radio');
  signalRadios.forEach(radio => {
    const input = radio.querySelector('input');
    if (input) {
      setupHoverHandlers(radio, {
        title: 'Pemilih Sinyal',
        content: 'Klik untuk menampilkan sinyal ini di grafik respon waktu.',
      });
    }
  });

  // Setup hover handlers for accordion headers
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    setupHoverHandlers(header, {
      title: 'Section Control',
      content: 'Klik untuk expand/collapse section ini.',
    });
  });
}

/**
 * Setup hover handlers for an element
 * @param {HTMLElement} element - Target element
 * @param {Object} content - Tooltip content {title, content}
 */
function setupHoverHandlers(element, content) {
  element.addEventListener('mouseenter', (e) => {
    showTooltip(element, content);
  });

  element.addEventListener('mouseleave', () => {
    hideTooltip();
  });

  // Add cursor style
  element.style.cursor = 'help';
}

/**
 * Show tooltip near element
 * @param {HTMLElement} element - Target element
 * @param {Object} content - Tooltip content
 */
function showTooltip(element, content) {
  if (!tooltipElement) return;

  // Clear any existing timeout
  if (currentTimeout) {
    clearTimeout(currentTimeout);
  }

  // Small delay before showing
  currentTimeout = setTimeout(() => {
    // Format content with line breaks
    const formattedContent = content.content.replace(/\n/g, '<br>');

    tooltipElement.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px; color: #24292E;">${content.title}</div>
      <div style="color: #586069; font-size: 11px; line-height: 1.5;">${formattedContent}</div>
    `;

    // Position tooltip
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();

    let left = rect.right + 10;
    let top = rect.top;

    // Keep within viewport
    if (left + 250 > window.innerWidth) {
      left = rect.left - 260;
    }
    if (top + tooltipRect.height > window.innerHeight) {
      top = window.innerHeight - tooltipRect.height - 10;
    }

    tooltipElement.style.left = `${left}px`;
    tooltipElement.style.top = `${top}px`;
    tooltipElement.style.opacity = '1';
    tooltipElement.style.pointerEvents = 'none';
  }, 300);
}

/**
 * Hide tooltip
 */
function hideTooltip() {
  if (currentTimeout) {
    clearTimeout(currentTimeout);
    currentTimeout = null;
  }

  if (tooltipElement) {
    tooltipElement.style.opacity = '0';
  }
}
