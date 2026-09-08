# Plan: Redesign Layout UI - Synchronous Generator Simulator

**Tanggal:** 2026-09-08  
**Status:** DRAFT  
**Prioritas:** HIGH

## Problem Statement

Layout saat ini memiliki beberapa masalah:

1. **Visual hierarchy lemah** - semua panel sejajar dengan bobot visual sama
2. **Page scroll** - halaman bisa discroll, mengganggu fokus pada simulasi
3. **Time series overwhelming** - 4 gelombang ditampilkan sekaligus, user bingung harus lihat apa
4. **Tidak ada fokus jelas** - mata user tidak tahu harus fokus ke mana

## Design Goals

1. **Phasor diagram (rotating rotor) sebagai hero** - bagian paling prominent
2. **Controls panel mudah diakses** - seperti panel generator real untuk research
3. **EAC curve (P-δ) visible** - critical untuk stability analysis
4. **No page scroll** - fixed viewport, 100vh
5. **Time series fokus 1 signal** - user paham apa yang sedang terjadi
6. **Internal scrollbar jika diperlukan** - di dalam card saja

## Proposed Layout Structure

### Layout Option A: Dashboard Style (Recommended)

```
┌─────────────────────────────────────────────────────────────────┐
│ Header (fixed, 60px)                                             │
│ Synchronous Generator Simulator | Status: ● RUNNING             │
├────────────────────┬────────────────────────────────────────────┤
│                    │                                             │
│ LEFT PANEL (40%)   │ RIGHT PANEL (60%)                          │
│                    │                                             │
│ ┌────────────────┐ │ ┌─────────────────────────────────────────┐│
│ │ PHASOR DIAGRAM │ │ │ P-δ CURVE (EAC)                         ││
│ │ (Rotating      │ │ │ - Sinusoidal curve                      ││
│ │  Rotor Hero)   │ │ │ - Operating point (animated)            ││
│ │ 400x400px      │ │ │ - A1/A2 shading                         ││
│ │                │ │ │ - δcc marker                            ││
│ └────────────────┘ │ │ Height: 350px                           ││
│                    │ └─────────────────────────────────────────┘│
│ ┌────────────────┐ │                                             │
│ │ CONTROLS PANEL │ │ ┌─────────────────────────────────────────┐│
│ │ (scrollable)   │ │ │ TIME SERIES (Single Signal)             ││
│ │                │ │ │ ┌─────────────────────────────────────┐ ││
│ │ • Pm (slider)  │ │ │ │ [δ] [ω] [Pe] [Pm] ← Tab/Radio      │ ││
│ │ • Droop (%)    │ │ │ └─────────────────────────────────────┘ ││
│ │ • Fault type   │ │ │                                         ││
│ │ • δ₀ (initial) │ │ │ [Chart menampilkan 1 signal terpilih]  ││
│ │ • Scenario     │ │ │ - Axis labels jelas                     ││
│ │                │ │ │ - Range values visible                  ││
│ │ [Mulai] [Stop] │ │ │ - Current value highlighted             ││
│ │ [Reset]        │ │ │                                         ││
│ └────────────────┘ │ │ Height: 250px                           ││
│                    │ └─────────────────────────────────────────┘│
│ ┌────────────────┐ │                                             │
│ │ STATUS VALUES  │ │ ┌─────────────────────────────────────────┐│
│ │ δ: 30.5°       │ │ │ INFO PANEL (optional collapse)          ││
│ │ ω: 1.0023 pu   │ │ │ - Stability margin: 15%                 ││
│ │ Pe: 1.15 pu    │ │ │ - Time elapsed: 12.5s                   ││
│ │ Pm: 1.20 pu    │ │ │ - Scenario: Steady State                ││
│ └────────────────┘ │ └─────────────────────────────────────────┘│
│                    │                                             │
└────────────────────┴─────────────────────────────────────────────┘
```

**Dimensi:**
- Header: 60px fixed
- Content area: calc(100vh - 60px)
- Left panel: 40% width, full height, internal scroll
- Right panel: 60% width, full height

### Layout Option B: Centered Hero Style

```
┌─────────────────────────────────────────────────────────────────┐
│ Header + Controls Bar (80px)                                     │
│ [Pm: 1.0] [Droop: 5%] [Fault: None] [δ₀: 30°] [●] [■] [↻]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ PHASOR DIAGRAM (Hero, centered)                              ││
│ │ 500x500px - Maximum prominence                               ││
│ │ Rotating reference frame                                     ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
├──────────────────────────────┬──────────────────────────────────┤
│ P-δ CURVE (EAC)              │ TIME SERIES (Single Signal)      │
│ - Operating point animated   │ ┌───────────────────────────────┐│
│ - A1/A2 shading visible      │ │ Select: [δ▼] [30.5°]          ││
│ - Grid + axes                │ └───────────────────────────────┘│
│                              │ [Chart for selected signal]      │
│ Height: 300px                │ - Focused, clear labeling        │
│                              │ - Sliding window 10s             │
└──────────────────────────────┴──────────────────────────────────┘
```

## Design Decisions

### 1. Visual Hierarchy

**Priority 1: Phasor Diagram**
- Largest visual element
- Centered or left-hero position
- Smooth rotation animation catches eye
- User immediately sees "this is generator rotor"

**Priority 2: P-δ Curve with EAC**
- Critical for understanding stability
- Operating point animation shows current state
- A1/A2 shading shows stability margin
- Size: ~350px height minimum

**Priority 3: Controls Panel**
- Grouped logically (Power, Governor, Fault, Initial Conditions)
- Slider dengan real-time value display
- Action buttons prominent (Start/Stop/Reset)
- **Scrollable internally** jika controls banyak

**Priority 4: Time Series**
- **Single signal at a time** (tab/radio selector)
- Clear axis labels dan units
- Current value prominent
- Contextual info (e.g., "δ = rotor angle relative to synchronous speed")

### 2. No Page Scroll

**Implementation:**
```css
body {
  height: 100vh;
  overflow: hidden; /* No page scroll */
}

#main-content {
  height: calc(100vh - 60px); /* minus header */
  display: grid;
  overflow: hidden;
}

.scrollable-panel {
  overflow-y: auto; /* Internal scroll only */
  overflow-x: hidden;
}
```

**Panels dengan internal scroll:**
- Controls panel (jika banyak parameter)
- Info/help panel (jika ada documentation)

### 3. Time Series - Single Signal Focus

**Current:** 4 stacks ditampilkan sekaligus
```
[δ ────────]
[ω ────────]
[Pe ───────]
[Pm ───────]
```

**Proposed:** Tab selector + 1 chart besar
```
┌─────────────────────────────────────┐
│ [● δ] [ ω] [ Pe] [ Pm]              │  ← Radio buttons / Tabs
├─────────────────────────────────────┤
│                                     │
│  δ (Rotor Angle)                    │
│  ┌───────────────────────────────┐  │
│  │                            /  │  │
│  │                       ___/    │  │
│  │                  ____/        │  │
│  │  Current: 30.5° (increasing)  │  │
│  └───────────────────────────────┘  │
│  0                          10s     │
│                                     │
│  Info: Sudut rotor relatif terhadap │
│        kecepatan sinkron             │
└─────────────────────────────────────┘
```

**Benefits:**
- Fokus pada 1 signal = lebih mudah dipahami
- Chart lebih besar = detail lebih jelas
- Konteks/explanation bisa ditambahkan per signal
- User tidak overwhelmed dengan 4 grafik sekaligus

**Signal Metadata:**
```javascript
const signals = {
  delta: {
    name: 'δ (Rotor Angle)',
    unit: 'rad',
    range: [0, Math.PI],
    color: '#0366D6',
    description: 'Sudut rotor relatif terhadap kecepatan sinkron. Osilasi menunjukkan swing.',
  },
  omega: {
    name: 'ω (Angular Velocity)',
    unit: 'pu',
    range: [0.95, 1.05],
    color: '#D73A49',
    description: 'Kecepatan angular rotor. 1.0 pu = kecepatan sinkron (60 Hz).',
  },
  // ...
};
```

### 4. Controls Panel - Generator Real Research Style

**Grouping logical:**

```
┌─────────────────────┐
│ MECHANICAL POWER    │
│ ├─ Pm: [====|===] 1.0 pu
│ └─ Scenario: [Steady State ▼]
├─────────────────────┤
│ GOVERNOR (TGOV1)    │
│ ├─ Droop R: [==|======] 5%
│ └─ Response: T2=3.5s
├─────────────────────┤
│ FAULT CONDITIONS    │
│ ├─ Type: [None ▼]
│ │   • None
│ │   • 3-Phase
│ │   • Line-to-Ground
│ └─ Duration: [===|====] 0.15s
├─────────────────────┤
│ INITIAL CONDITIONS  │
│ ├─ δ₀: [====|===] 30°
│ └─ ω₀: 1.0 pu (sync)
├─────────────────────┤
│ SIMULATION CONTROL  │
│ ┌─────┬─────┬──────┐│
│ │[▶] │[■]  │[↻]   ││
│ │Start│Stop │Reset ││
│ └─────┴─────┴──────┘│
└─────────────────────┘
```

**Features:**
- Section headers dengan separator
- Sliders dengan live value display
- Dropdowns untuk options
- Info tooltips (❓) untuk penjelasan teknis
- Validation indicators (min/max values)

### 5. Responsive Breakpoints (future)

Desktop only untuk sekarang (research tool):
- Min width: 1280px
- Optimal: 1920x1080

## Implementation Phases

### Phase 1: Layout Structure (2-3 hours)
- [ ] Update `index.html` dengan struktur grid baru
- [ ] CSS grid/flex untuk layout dashboard
- [ ] Fixed viewport (no page scroll)
- [ ] Internal scrollbar untuk controls panel

### Phase 2: Time Series Refactor (1-2 hours)
- [ ] Tambahkan signal selector (radio/tabs)
- [ ] Refactor `timeSeries.js` untuk render 1 signal
- [ ] Chart lebih besar dengan detail lebih jelas
- [ ] Tambahkan signal description/context

### Phase 3: Controls Panel Redesign (1-2 hours)
- [ ] Group controls logical
- [ ] Section headers dan separators
- [ ] Better visual hierarchy
- [ ] Tooltips untuk technical info

### Phase 4: Visual Polish (1 hour)
- [ ] Phasor diagram sizing (hero)
- [ ] P-δ curve sizing
- [ ] Color consistency
- [ ] Typography scale

### Phase 5: Testing & Iteration (1 hour)
- [ ] User flow testing
- [ ] Visual balance
- [ ] Accessibility check
- [ ] Browser compatibility

## Open Questions

1. **Layout preference:** Option A (Dashboard) vs Option B (Centered Hero)?
2. **Time series selector:** Tabs atau Radio buttons atau Dropdown?
3. **Controls panel position:** Left sidebar atau Right sidebar?
4. **Status values:** Separate panel atau integrated dalam controls?
5. **RLR panel:** Keep hidden atau integrate somewhere?

## Success Criteria

- [ ] Phasor diagram (rotating rotor) is most prominent visual element
- [ ] No page scroll - fixed viewport 100vh
- [ ] Controls panel accessible dan logical grouping
- [ ] P-δ curve dengan EAC visible dan clear
- [ ] Time series fokus 1 signal dengan konteks jelas
- [ ] User tidak overwhelmed - tahu harus lihat apa
- [ ] Semua functionality tetap bekerja (no regression)

## Next Steps

1. **User decision:** Pilih layout option (A atau B)
2. **Mockup:** Buat HTML mockup statis untuk preview
3. **Implementation:** Fase 1-5 berurutan
4. **User testing:** Feedback dan iterasi

---

**Estimasi total:** 6-9 jam development + testing  
**Breaking changes:** Layout HTML structure, CSS styles, time series renderer  
**Backward compatibility:** Renderer API tetap sama (no physics model changes)
