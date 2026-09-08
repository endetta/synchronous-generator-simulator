# Plan: Enhancement - Rotor/Stator Demonstration & Control System Response

**Date:** 2026-09-08
**Status:** DRAFT
**Priority:** HIGH
**Estimated Effort:** 40-50 hours

---

## 1. Background & Objectives

### User Request

> "Saya ingin simulasi ini berfokus pada demonstrasi/ilustrasi pergerakan sudut rotor dan stator dan pengaruhnya terhadap output generator. Saya ingin pula melihat proses bagaimana governor dan AVR dalam merespons perubahan sistem."

### Objectives

1. **Demonstrate rotor/stator magnetic field interaction** — Visualize how rotor angle (δ) affects power output
2. **Show governor response dynamics** — How TGOV1 responds to load/frequency changes
3. **Implement AVR system** — Show how voltage regulation affects generator transients
4. **Enhance educational value** — Make the physics visible and intuitive

---

## 2. Current State Assessment

### What Works

| Component | Status | Quality |
|-----------|--------|---------|
| Swing equation (RK4) | ✅ Correct | Good |
| EAC analysis | ✅ Correct | Good |
| Phasor diagram | ✅ Works | 80% educational value |
| P-δ curve | ✅ Works | 95% educational value |
| Time series | ✅ Works | 85% educational value |

### Critical Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| TGOV1 incorrect implementation | Governor response wrong | HIGH |
| AVR not implemented | E' static, unrealistic | HIGH |
| Rotor/stator field animation missing | Fundamental concept not shown | HIGH |
| Governor visualization missing | Dynamics not visible | MEDIUM |
| CCT not calculated | Protection education incomplete | MEDIUM |

---

## 3. Design Approach

### 3.1 Architecture

Maintain existing modular architecture:

```
Physics Layer (pure functions)
    ↓
State Layer (event bus)
    ↓
Renderer Layer (SVG/Canvas)
    ↓
UI Layer (controls, panels)
```

### 3.2 Key Design Decisions

#### D1. AVR Model Selection

**Decision:** Use simplified IEEE Type 1 exciter (AC4C-like)

**Rationale:**
- Standard model, well-documented
- Sufficient for educational purposes
- Reasonable parameter complexity

**Parameters:**
- Ka = 200 pu (regulator gain)
- Ta = 0.02 s (regulator time constant)
- Te = 0.5 s (exciter time constant)
- Efd limits: 0 to 6.0 pu

#### D2. Field Animation Approach

**Decision:** Create separate visualization panel for rotor/stator fields

**Rationale:**
- Phasor diagram shows steady-state quantities
- Field animation shows physical mechanism
- Complementary, not redundant

**Components:**
- Stator: 3-phase windings → rotating magnetic field (at ωs)
- Rotor: DC field → rotates with rotor (at ω)
- Air gap: resultant flux vector
- Torque: shown as interaction arrow

#### D3. Governor Visualization

**Decision:** Add gauge + time plot for governor dynamics

**Components:**
- Valve position gauge (0-100%)
- Pref vs Pm tracking plot (small canvas)
- Droop indicator

---

## 4. Implementation Phases

### Phase 1: Fix Critical Issues (4-6 hours)

**Goal:** Correct existing bugs before adding features.

#### P1.1 Fix TGOV1 Transfer Function

**File:** `src/physics/tgov1.js`

**Current (WRONG):**
```javascript
const x2_new = x2 + (dt / T1) * (T2 * EG - x2);
const y_new = EG + x2_new;
```

**Correct (IEEE 421.5):**
```javascript
// Lead-lag: (1 + T2·s) / (1 + T1·s)
// State: x (integrator output)
// Output: y = u + (T2/T1)·(u - x)
const dx = (dt / T1) * (u - x);
const x_new = x + dx;
const y_new = u + (T2 / T1) * (u - x_new);
```

**Tasks:**
- [ ] Rewrite `tgov1Step()` with correct discretization
- [ ] Add state variable `x` for lead-lag integrator
- [ ] Update tests to verify step response
- [ ] Verify settling time ≈ 3-5 seconds

#### P1.2 Fix RLR Time Scaling

**File:** `src/main.js` line 113

**Current:**
```javascript
state.rlrTime += dt / 3600;
```

**Correct:**
```javascript
state.rlrTime += (dt * CONSTANTS.SPEED) / 3600;
```

**Tasks:**
- [ ] Fix time scaling
- [ ] Test RLR sweep completes in ~36 seconds

---

### Phase 2: Implement AVR System (10-12 hours)

**Goal:** Add automatic voltage regulation for realistic transients.

#### P2.1 Create AVR Physics Module

**File:** `src/physics/avr.js` (NEW)

**Model:** IEEE Type 1 (simplified)

```javascript
// State: { Efd, Vr }
// Parameters: { Ka, Ta, Ke, Te, Vrmin, Vrmax, Efdmin, Efdmax }

export function makeAVRState() {
  return {
    Efd: 1.0,   // Field voltage (pu)
    Vr: 0.0,    // Regulator output (pu)
  };
}

export function avrStep(state, Vref, Vt, params, dt) {
  const { Ka, Ta, Ke, Te, Vrmin, Vrmax, Efdmin, Efdmax } = params;
  
  // Voltage error
  const Verr = Vref - Vt;
  
  // Regulator (first-order lag)
  const dVr = (Ka * Verr - state.Vr) / Ta;
  const Vr_new = clamp(state.Vr + dVr * dt, Vrmin, Vrmax);
  
  // Exciter (first-order lag)
  const dEfd = (Vr_new - Ke * state.Efd) / Te;
  const Efd_new = clamp(state.Efd + dEfd * dt, Efdmin, Efdmax);
  
  return { Efd: Efd_new, Vr: Vr_new };
}
```

**Tasks:**
- [ ] Implement `avrStep()` function
- [ ] Implement `makeAVRState()` initializer
- [ ] Add AVR parameters to `constants.js`
- [ ] Write unit tests in `tools/physics.test.js`
- [ ] Test step response: Vref change → Efd settles in ~Te seconds

#### P2.2 Integrate AVR with Swing Equation

**File:** `src/state.js`, `src/main.js`

**Changes:**
- Add AVR state to global state
- Update E' magnitude dynamically: `Ea = Efd * (Xad / Xf)`
- Compute terminal voltage: `Vt = |V|` from power flow

**Tasks:**
- [ ] Extend state to include `avrState`, `Vref`, `Vt`
- [ ] Update swing equation to use dynamic Ea
- [ ] Add AVR step to simulation loop
- [ ] Verify E' magnitude changes during transients

#### P2.3 Add AVR Controls to UI

**File:** `src/ui/controls.js`, `index.html`

**Controls:**
- Vref slider (0.9 - 1.1 pu)
- Ka gain slider (50 - 400 pu)
- AVR enable/disable toggle

**Tasks:**
- [ ] Add Vref slider to controls panel
- [ ] Add Ka slider (optional, advanced)
- [ ] Add AVR enable toggle
- [ ] Update tooltip descriptions

#### P2.4 Update Phasor Renderer for Dynamic E'

**File:** `src/renderers/phasor.js`

**Changes:**
- E' magnitude now comes from state (via Efd)
- Show Efd value in status

**Tasks:**
- [ ] Use dynamic Ea from state
- [ ] Display Efd value below phasor diagram
- [ ] Animate E' magnitude change smoothly

---

### Phase 3: Rotor/Stator Field Animation (12-16 hours)

**Goal:** Visualize magnetic field interaction.

#### P3.1 Create Field Animation Renderer

**File:** `src/renderers/fieldAnimation.js` (NEW)

**Concept:**

```
┌─────────────────────────────────────┐
│  STATOR (stationary frame)          │
│    ○──A──○                          │
│   /      \   ← 3-phase windings     │
│  ○   ⊕   ○   ← Air gap flux         │
│   \      /                          │
│    ○──B──○                          │
│                                     │
│  ROTOR (rotating at ω)              │
│    ↑                                │
│    │ N                              │
│    │     ← DC field winding         │
│    │ S                              │
│    ↓                                │
│                                     │
│  Angle between fields = δ           │
└─────────────────────────────────────┘
```

**Components:**

1. **Stator cross-section:**
   - 3-phase windings (A, B, C) 120° apart
   - Rotating magnetic field vector (at ωs)
   - Labeled "Medan Stator"

2. **Rotor cross-section:**
   - DC field winding (N-S poles)
   - Rotates at ω = ωs + Δω
   - Labeled "Medan Rotor"

3. **Air gap flux:**
   - Resultant vector (sum of stator and rotor fields)
   - Changes with load

4. **Torque indicator:**
   - Arrow showing torque direction
   - Proportional to sin(δ)

**Tasks:**
- [ ] Create SVG-based field animation
- [ ] Implement stator field rotation (at ωs)
- [ ] Implement rotor field rotation (at ω)
- [ ] Compute and show air gap flux
- [ ] Add torque indicator
- [ ] Smooth animation using requestAnimationFrame

#### P3.2 Add Field Animation Panel to Layout

**File:** `index.html`, `src/styles.css`

**Layout:**
- Replace or supplement phasor panel
- Add toggle between phasor view and field animation
- Responsive sizing

**Tasks:**
- [ ] Add `#field-animation-panel` to HTML
- [ ] Style panel to match existing design
- [ ] Add view toggle button
- [ ] Ensure layout works on 1920x1080

#### P3.3 Integrate with State

**File:** `src/main.js`

**Tasks:**
- [ ] Pass δ, ω, Efd to field animation renderer
- [ ] Update animation on each frame
- [ ] Handle pause/resume

---

### Phase 4: Governor Visualization (8-10 hours)

**Goal:** Show governor dynamics visually.

#### P4.1 Create Governor Gauge Renderer

**File:** `src/renderers/governorGauge.js` (NEW)

**Components:**

1. **Valve position gauge:**
   - Semicircular gauge (0-100%)
   - Current valve position indicator
   - Color coding (green = normal, yellow = high, red = limit)

2. **Pref vs Pm plot:**
   - Small canvas (200x100 px)
   - Shows last 10 seconds of Pref and Pm
   - Demonstrates tracking lag

**Tasks:**
- [ ] Implement gauge SVG rendering
- [ ] Implement tracking plot canvas
- [ ] Add to controls panel
- [ ] Update on each simulation step

#### P4.2 Add Governor Panel to UI

**File:** `index.html`, `src/ui/controls.js`

**Layout:**
- Add governor panel below Pm control
- Collapsible accordion

**Tasks:**
- [ ] Add governor panel HTML
- [ ] Add gauge and plot elements
- [ ] Initialize in main.js

#### P4.3 Show Droop Action

**File:** `src/renderers/governorGauge.js`

**Feature:**
- Display droop setting (R = 5%)
- Show steady-state error calculation
- Visual indicator of droop effect

**Tasks:**
- [ ] Add droop display
- [ ] Calculate and show steady-state error
- [ ] Update tooltip with explanation

---

### Phase 5: CCT Calculation & Display (4-6 hours)

**Goal:** Add critical clearing time for protection education.

#### P5.1 Implement CCT Calculation

**File:** `src/physics/eac.js`

**Method:**

```javascript
export function computeCCT(delta0, deltaCC, Pm, M) {
  // During 3-phase fault: Pmax ≈ 0
  // δ(t) = δ₀ + ½·(Pm/M)·t²
  // Solve for t when δ = δCC:
  // CCT = √[2·M·(δCC - δ₀) / Pm]
  
  const CCT = Math.sqrt(2 * M * (deltaCC - delta0) / Pm);
  return CCT;
}
```

**Tasks:**
- [ ] Implement `computeCCT()` function
- [ ] Add to EAC tests
- [ ] Verify against numerical integration

#### P5.2 Display CCT in UI

**File:** `src/renderers/pdelta.js`, `src/ui/infoPanel.js`

**Display:**
- Show CCT value in seconds on P-δ panel
- Add to info panel during fault scenarios
- Countdown timer during fault

**Tasks:**
- [ ] Add CCT to P-δ plot annotation
- [ ] Add to info panel
- [ ] Update in real-time during fault

---

### Phase 6: Testing & Documentation (4-6 hours)

**Goal:** Ensure quality and create educational content.

#### P6.1 Update Physics Tests

**File:** `tools/physics.test.js`

**Tests:**
- AVR step response
- CCT calculation
- TGOV1 corrected response

**Tasks:**
- [ ] Add AVR unit tests
- [ ] Add CCT calculation tests
- [ ] Update TGOV1 tests

#### P6.2 Update Renderer Tests

**File:** `tools/renderers.test.js`

**Tests:**
- Field animation rendering
- Governor gauge rendering

**Tasks:**
- [ ] Add field animation test
- [ ] Add governor gauge test

#### P6.3 Create Educational Scenarios

**File:** `src/scenarios.js`

**Scenarios:**

1. **Governor Response Demo:**
   - Load step at t=2s
   - Observe Pm tracking Pref with lag
   - See droop steady-state error

2. **AVR Response Demo:**
   - Voltage disturbance at t=2s
   - Observe Efd and E' response
   - See voltage recovery

3. **Fault Stability Demo:**
   - 3-phase fault at t=2s
   - Clear at CCT-0.1s (stable)
   - Clear at CCT+0.1s (unstable)

4. **Field Interaction Demo:**
   - Steady-state operation
   - Show rotor/stator field alignment
   - Demonstrate torque production

**Tasks:**
- [ ] Create 4 educational scenarios
- [ ] Add descriptions and learning objectives
- [ ] Test each scenario

#### P6.4 Update PRD and Documentation

**Files:** `docs/PRD.md`, `docs/overview.md`

**Tasks:**
- [ ] Update PRD with AVR model
- [ ] Document new parameters
- [ ] Update overview.md with new features
- [ ] Add screenshots to documentation

---

## 5. Dependencies

### New Files

```
src/physics/avr.js           — AVR physics module
src/renderers/fieldAnimation.js  — Field visualization
src/renderers/governorGauge.js   — Governor visualization
```

### Modified Files

```
src/physics/tgov1.js         — Fix transfer function
src/physics/eac.js           — Add CCT
src/state.js                 — Add AVR state
src/constants.js             — Add AVR parameters
src/main.js                  — Integrate AVR, fix RLR
src/renderers/phasor.js      — Dynamic E'
src/ui/controls.js           — AVR controls
index.html                   — New panels
src/styles.css               — Panel styles
```

### Test Files

```
tools/physics.test.js        — AVR, CCT tests
tools/renderers.test.js      — Field animation tests
```

---

## 6. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AVR parameters unrealistic | Medium | Medium | Use verified IEEE 421.5 values |
| Field animation performance | Low | Medium | Use efficient SVG, limit frame rate |
| TGOV1 fix breaks scenarios | Medium | High | Comprehensive test suite |
| Layout overflow on small screens | Medium | Low | Test at 1920x1080 minimum |

---

## 7. Acceptance Criteria

### Must Have

- [ ] AVR implemented and working
- [ ] TGOV1 corrected
- [ ] Field animation shows rotor/stator interaction
- [ ] Governor dynamics visualized
- [ ] All tests pass (physics, renderers, integration)

### Should Have

- [ ] CCT calculation and display
- [ ] Educational scenarios created
- [ ] Documentation updated

### Nice to Have

- [ ] Multi-signal time series view
- [ ] Parameter sensitivity analysis

---

## 8. Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Critical Fixes | 4-6 hours | None |
| Phase 2: AVR Implementation | 10-12 hours | Phase 1 |
| Phase 3: Field Animation | 12-16 hours | None (parallel) |
| Phase 4: Governor Viz | 8-10 hours | Phase 1 |
| Phase 5: CCT | 4-6 hours | None (parallel) |
| Phase 6: Testing & Docs | 4-6 hours | All phases |

**Total:** 42-56 hours

**Recommended Sequence:**
1. Phase 1 (fixes) → 2. Phase 2 (AVR) → 3. Phase 3 (fields) → 4. Phase 4 (governor) → 5. Phase 5 (CCT) → 6. Phase 6 (testing)

---

## 9. Next Steps

1. **Get user approval** on this plan
2. **Start Phase 1** — Fix critical issues
3. **Iterate per phase** with user review between phases

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-09-08 | Initial plan from research findings |
