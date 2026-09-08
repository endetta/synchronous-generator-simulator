# UI Redesign Tasks - Synchronous Generator Simulator

**Tanggal Mulai:** 2026-09-08  
**Status:** IN PROGRESS  
**Referensi:** plan-ui-redesign-layout.md

---

## Phase 1: Core Layout Structure

### Tasks
- [x] **P1.1** - Update `index.html` dengan struktur grid baru
  - Header fixed (60px)
  - Left panel 40% width (phasor + controls + status)
  - Right panel 60% width (p-delta + time-series + timeline)
  - All panels dengan explicit heights

- [x] **P1.2** - Update `src/styles.css` untuk viewport layout
  - `body { height: 100vh; overflow: hidden; }`
  - `#main-content { height: calc(100vh - 60px); }`
  - Internal scroll untuk controls panel

- [x] **P1.3** - Define component dimensions (2K resolution)
  - Phasor: 500x500px
  - P-δ curve: 450px height
  - Time series: 350px height
  - Timeline log: 200px height

- [x] **P1.4** - Color scheme update (merah aksen)
  - `--accent-red: #D73A49` (actions/warnings)
  - `--accent-red-light: #F8D7DA`
  - `--accent-red-dark: #C62828`
  - Biru tetap untuk phasor (engineering standard)

---

## Phase 2: Controls Panel Redesign

### Tasks
- [x] **P2.1** - Accordion sections
  - Mechanical Power (Pm slider, Scenario) ✅
  - Governor (Droop R) ✅
  - Fault Conditions (Type, Duration) ✅
  - Initial Conditions (δ₀, ω₀) ✅
  - Simulation Control (Start/Stop/Reset) ✅

- [x] **P2.2** - Live value display
  - Slider dengan inline value ✅
  - Real-time feedback ✅

- [x] **P2.3** - Signal selector integration
  - Radio buttons horizontal ✅
  - Update time series render berdasarkan selection ✅
  - Single signal view dengan grid lines ✅

- [x] **P2.4** - Status values multiple locations
  - Inline di phasor panel ✅

### Files Modified
- `src/renderers/timeSeries.js` - Single signal rendering dengan signal selector
- `tools/lens-harness.js` - Added setLineDash stub for tests

---

## Phase 3: Time Series Refactor

### Tasks
- [x] **P3.1** - Signal selector integration
  - Toggle based on radio button selection ✅
  - Render single signal chart ✅

- [x] **P3.2** - Chart enhancements
  - Grid lines (major/minor) ✅
  - Reference line (steady state value) ✅
  - Current value indicator (dot + glow) ✅
  - Time axis dengan tick marks ✅

- [x] **P3.3** - Signal metadata
  - Add description per signal ✅
  - Contextual info display ✅

### Status
Phase 3 **SELESAI** - Semua fitur time series sudah diimplementasikan di Phase 2

---

## Phase 4: Measurement Tools

### Tasks
- [x] **P4.1** - Cursor sync
  - Hover di 1 chart → vertical line di semua charts ✅
  - Sync time reference ✅

- [x] **P4.2** - Crosshair readout
  - Show (t, value) saat hover ✅
  - Floating tooltip dengan signal info ✅

- [x] **P4.3** - Hover effects
  - Cursor change (crosshair) ✅
  - Highlight active element ✅

### Files Created/Modified
- `src/ui/cursorSync.js` - NEW: Cursor tracking module
- `src/ui/tooltipManager.js` - NEW: Tooltip manager for cursor readout
- `src/renderers/timeSeries.js` - MODIFIED: Integrated cursor tracking & crosshair
- `src/main.js` - MODIFIED: Added tooltipManager initialization
- `src/styles.css` - MODIFIED: Added cursor tooltip styles
- `index.html` - MODIFIED: Added cursor-tooltip element
- `tools/renderers.test.js` - MODIFIED: Added addEventListener stub

### Status
Phase 4 **SELESAI** - Cursor sync & crosshair readout implemented

---

## Phase 5: Help & Documentation

### Tasks
- [x] **P5.1** - Contextual tooltips
  - Hover di semua interactive elements ✅
  - Technical explanation ✅

- [x] **P5.2** - Tutorial overlay
  - First visit only (localStorage) ✅
  - 5 step guided tour ✅

- [x] **P5.3** - Info panel
  - Stability margin ✅
  - Time elapsed ✅
  - Current scenario ✅
  - Running status ✅
  - Fault indicator ✅

### Files Created/Modified
- `src/ui/contextualTooltips.js` - NEW: Contextual tooltips for all interactive elements
- `src/ui/tutorialOverlay.js` - NEW: 5-step tutorial for first-time users
- `src/ui/infoPanel.js` - NEW: Real-time status info panel
- `src/main.js` - MODIFIED: Integrated all Phase 5 modules

### Status
Phase 5 **SELESAI** - Help & documentation implemented

---

## Phase 6: Visual Polish

### Tasks
- [ ] **P6.1** - Color consistency
  - Merah untuk actions/warnings
  - Biru elektrik untuk phasor (E', V, I)
  - Hijau untuk operating point (stable)

- [ ] **P6.2** - Typography scale
  - Headers: 14-16px
  - Body: 12-13px
  - Monospace untuk values

- [ ] **P6.3** - Spacing consistency
  - 8px base unit
  - 16px section gaps

---

## Phase 7: Testing & Validation

### Tasks
- [ ] **P7.1** - Performance test
  - 60 FPS verification
  - No layout shift

- [ ] **P7.2** - No page scroll
  - Body overflow hidden
  - Internal scroll only

- [ ] **P7.3** - Functionality check
  - All controls work
  - Animation smooth
  - No regression

- [ ] **P7.4** - Multi-resolution
  - 1920x1080 tested
  - 2560x1440 tested

---

## Progress Summary

| Phase | Status | Progress |
|-------|--------|----------|
| P1 - Core Layout | ✅ Completed | 100% |
| P2 - Controls | ✅ Completed | 100% |
| P3 - Time Series | ✅ Completed | 100% |
| P4 - Measurement | ✅ Completed | 100% |
| P5 - Help | ✅ Completed | 100% |
| P6 - Polish | ⏳ Not Started | 0% |
| P7 - Testing | ⏳ Not Started | 0% |

**Overall: 71% (5/7 phases complete)**

---

## Notes

- Merah aksen (#D73A49) untuk semua action buttons dan warnings
- Phasor tetap biru (#0366D6) untuk V, E', I - ini adalah standar engineering
- Time series grid lines untuk readability
