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
- [ ] **P2.1** - Accordion sections
  - Mechanical Power (Pm slider, Scenario)
  - Governor (Droop R)
  - Fault Conditions (Type, Duration)
  - Initial Conditions (δ₀, ω₀)
  - Simulation Control (Start/Stop/Reset)

- [ ] **P2.2** - Live value display
  - Slider dengan inline value
  - Real-time feedback

- [ ] **P2.3** - Signal selector (Radio buttons)
  - Horizontal: [● δ] [ ω] [ Pe] [ Pm]
  - Update time series berdasarkan selection

- [ ] **P2.4** - Status values multiple locations
  - Inline di controls panel
  - Summary di phasor diagram bottom

---

## Phase 3: Time Series Refactor

### Tasks
- [ ] **P3.1** - Signal selector integration
  - Toggle based on radio button selection
  - Render single signal chart

- [ ] **P3.2** - Chart enhancements
  - Grid lines (major/minor)
  - Reference line (steady state value)
  - Current value indicator (dot + glow)
  - Time axis dengan tick marks

- [ ] **P3.3** - Signal metadata
  - Add description per signal
  - Contextual info display

---

## Phase 4: Measurement Tools

### Tasks
- [ ] **P4.1** - Cursor sync
  - Hover di 1 chart → vertical line di semua charts
  - Sync time reference

- [ ] **P4.2** - Crosshair readout
  - Show (t, value) saat hover
  - Floating tooltip atau inline display

- [ ] **P4.3** - Hover effects
  - Cursor change
  - Highlight active element

---

## Phase 5: Help & Documentation

### Tasks
- [ ] **P5.1** - Contextual tooltips
  - Hover di semua interactive elements
  - Technical explanation

- [ ] **P5.2** - Tutorial overlay
  - First visit only
  - 3-5 step guided tour

- [ ] **P5.3** - Info panel
  - Stability margin
  - Time elapsed
  - Current scenario

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
| P2 - Controls | ⏳ In Progress | 80% |
| P3 - Time Series | ⏳ Not Started | 0% |
| P4 - Measurement | ⏳ Not Started | 0% |
| P5 - Help | ⏳ Not Started | 0% |
| P6 - Polish | ⏳ Not Started | 0% |
| P7 - Testing | ⏳ Not Started | 0% |

**Overall: 26% (2/7 phases complete)**

---

## Notes

- Merah aksen (#D73A49) untuk semua action buttons dan warnings
- Phasor tetap biru (#0366D6) untuk V, E', I - ini adalah standar engineering
- Time series grid lines untuk readability
