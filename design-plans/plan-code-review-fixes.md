# Plan: Code Review Fixes

**Tanggal**: 2026-09-08  
**Status**: DRAFT  
**Sumber**: Code review findings dari /code-review max  
**Prioritas**: Critical → Medium → Minor

---

## Ringkasan Findings

- **Standards axis**: 18 hard violations + 11 baseline smells
- **Spec axis**: 3 missing requirements + 2 wrong implementations + 5 scope creep

---

## CRITICAL (Must Fix)

### Task 1: Fix Swing Equation Convention Inconsistency
**Priority**: CRITICAL (breaks mathematical correctness)  
**File**: `src/physics/swing.js`  
**Problem**: Lines 19 & 24 mix conventions - line 19: `dDelta = omega` (relative), line 24: `D * (omega - 1.0)` (absolute)  
**PRD Reference**: §3.1 lines 56-58

**Steps**:
1. Read `src/physics/swing.js` line 19-24
2. Decide convention: use relative (`ω - ωs`) consistently
3. Update line 19 to `dDelta = omega - 1.0` OR update line 24 to `D * omega`
4. Update all tests in `tools/physics.test.js` if behavior changes
5. Run `node tools/physics.test.js`
6. Verify: swing test passes with new convention

**Verification**:
```bash
node tools/physics.test.js
# All assertions pass
```

---

### Task 2: Fix CONSTANTS.R Mutation
**Priority**: CRITICAL (breaks architecture)  
**File**: `src/ui/controls.js`  
**Problem**: Line 46 directly mutates `CONSTANTS.R = droop`  
**Standard Violation**: "No mixing concerns" - constants should be read-only

**Steps**:
1. Read `src/ui/controls.js` line 40-50
2. Remove `CONSTANTS.R = droop` mutation
3. Pass droop as parameter through state: `state.R = droop`
4. Update `src/constants.js` to export `DEFAULT_R` instead of mutable `R`
5. Update all consumers: `src/physics/tgov1.js` to read `state.R || CONSTANTS.DEFAULT_R`
6. Run `node tools/physics.test.js`

**Verification**:
```bash
node tools/physics.test.js
node tools/integration.test.js
# All pass, CONSTANTS remains immutable
```

---

### Task 3: Implement Critical Clearing Time (CCT)
**Priority**: CRITICAL (missing PRD requirement)  
**File**: New file `src/physics/cct.js`  
**Problem**: CCT calculation not implemented  
**PRD Reference**: §3.3 lines 117-119

**Steps**:
1. Create `src/physics/cct.js`
2. Implement `computeCCT(delta0, Pm, Pmax, PmaxFault, dt)`
   - Integrate swing equation during fault-on
   - Stop when δ reaches δcc
   - Return time in seconds
3. Write test in `tools/physics.test.js`:
   ```js
   const cct = computeCCT(0.524, 1.0, 2.0, 1.0, 0.01);
   assert(cct > 0 && cct < 1.0, 'CCT in reasonable range');
   ```
4. Add CCT display to `src/ui/controls.js` status panel
5. Run `node tools/physics.test.js`

**Verification**:
```bash
node tools/physics.test.js
# CCT test passes
# Browser: CCT value displays in status panel
```

---

## MEDIUM (Should Fix)

### Task 4: Add A2 Area Shading to P-δ Curve
**Priority**: MEDIUM (missing PRD requirement)  
**File**: `src/renderers/pdelta.js`  
**Problem**: Only A1 shading drawn, A2 missing  
**PRD Reference**: §6.2 lines 188-190

**Steps**:
1. Read `src/renderers/pdelta.js` lines 61-69
2. Add A2 path after A1:
   ```js
   // A2: deceleration area (δcc to δmax)
   const pathA2 = `M ${x_cc} ${y_cc} ... Z`;
   svgNS.appendChild(pathA2);
   ```
3. Style A2 with different color (e.g., fill="rgba(0,255,0,0.2)")
4. Test in browser: apply fault, verify A1 (red) + A2 (green) both visible

**Verification**:
```bash
python -m http.server 8000
# Browser: apply 3ph fault, see both A1 and A2 shaded areas
```

---

### Task 5: Fix Duplicated Code in timeSeries.js
**Priority**: MEDIUM (code smell)  
**File**: `src/renderers/timeSeries.js`  
**Problem**: Lines 79-80, 86-87 repeat "range value → Y coordinate" calculation

**Steps**:
1. Read `src/renderers/timeSeries.js` lines 70-90
2. Extract helper:
   ```js
   function valueToY(value, min, max, height, padding) {
     return padding + (1 - (value - min) / (max - min)) * (height - 2 * padding);
   }
   ```
3. Replace duplicated code with helper calls
4. Run `node tools/renderers.test.js`

**Verification**:
```bash
node tools/renderers.test.js
# Renderer tests pass
```

---

### Task 6: Fix Duplicated Code in phasor.js
**Priority**: MEDIUM (code smell)  
**File**: `src/renderers/phasor.js`  
**Problem**: Lines 79-83 repeat angle formatting (status text + tooltip)

**Steps**:
1. Read `src/renderers/phasor.js` lines 75-85
2. Extract helper:
   ```js
   function formatAngle(radians) {
     return `${(radians * 180 / Math.PI).toFixed(1)}°`;
   }
   ```
3. Replace duplicated angle formatting
4. Run `node tools/renderers.test.js`

**Verification**:
```bash
node tools/renderers.test.js
```

---

### Task 7: Fix Duplicated Code in state.js reset()
**Priority**: MEDIUM (code smell)  
**File**: `src/state.js`  
**Problem**: Lines 69-72 manually copy fields instead of delegating

**Steps**:
1. Read `src/state.js` lines 65-75
2. Replace manual copy with:
   ```js
   export function reset() {
     Object.assign(state, makeState());
     commit();
   }
   ```
3. Run `node tools/integration.test.js`

**Verification**:
```bash
node tools/integration.test.js
```

---

### Task 8: Review TGOV1 Lead-Lag Filter Implementation
**Priority**: MEDIUM (wrong vs PRD, but may be intentional approximation)  
**File**: `src/physics/tgov1.js`  
**Problem**: Lines 34-42 use non-standard discrete approximation vs PRD §3.2 transfer function

**Steps**:
1. Read PRD §3.2 lines 79-85 (notes T1/T2 may be swapped)
2. Read `src/physics/tgov1.js` lines 30-45
3. **DECISION POINT**: Is current approximation acceptable for demo?
   - If YES: Add comment explaining deviation from PRD
   - If NO: Implement proper bilinear transform
4. Run `node tools/physics.test.js`

**Verification**:
```bash
node tools/physics.test.js
# Governor settling time ~3-5s (acceptable range)
```

---

## MINOR (Nice to Have)

### Task 9: Fix Naming Inconsistencies
**Priority**: MINOR (code smell)  
**Files**: Multiple

**Steps**:
1. `src/main.js` line 75-83: Rename `currentPm` → `rlrPm`, `currentPref` → `rlrPref`
2. `src/ui/oosAlarm.js` line 54: Rename `playBeep()` → `playOOSBeep()`
3. Run all tests

**Verification**:
```bash
node tools/physics.test.js
node tools/renderers.test.js
node tools/integration.test.js
```

---

### Task 10: Remove Speculative Event Bus (Optional)
**Priority**: MINOR (speculative generality)  
**File**: `src/state.js`  
**Problem**: Lines 43-55 event bus pattern overkill for this project size

**Steps**:
1. **DECISION POINT**: Is event bus used elsewhere?
   - grep "onChange" src/
   - If only 1-2 call sites: inline it
   - If many: keep as is
2. If removing: replace with direct `renderAll()` calls
3. Run all tests

**Verification**:
```bash
node tools/integration.test.js
```

---

### Task 11: Remove Debug Export (Production)
**Priority**: MINOR (should remove before production)  
**File**: `src/main.js`  
**Problem**: Lines 214-223 `window.__app` debug export

**Steps**:
1. Read `src/main.js` lines 214-223
2. Wrap in `if (process.env.NODE_ENV !== 'production')` OR remove entirely
3. Run browser test

**Verification**:
```bash
python -m http.server 8000
# Browser console: `window.__app` undefined (or only in dev)
```

---

## Verification Gates

### After Each Task
```bash
# Run relevant test file
node tools/physics.test.js
node tools/renderers.test.js
node tools/integration.test.js
```

### Final Gate (All Tasks Complete)
```bash
# All tests pass
node tools/physics.test.js
node tools/renderers.test.js
node tools/integration.test.js

# Browser smoke test
python -m http.server 8000
# - Apply each scenario (startup, fault, swing, RLR)
# - Verify no console errors
# - Verify CCT displays
# - Verify A1+A2 shading visible during fault

# Screenshot baseline
node tools/screenshot.js
# - Check tools/shots/report.txt for no regressions
```

---

## Notes

- **Task 1 (swing convention)** may break existing tests - update expectations
- **Task 2 (CONSTANTS.R)** requires state refactor - test thoroughly
- **Task 8 (TGOV1)** has decision point - verify with user if unsure
- **Task 10 (event bus)** is optional - low priority
- Scope creep items (extra scenarios, OOS alarm, tooltip) NOT addressed - they're useful features

---

## Success Criteria

- [ ] All CRITICAL tasks completed (1-3)
- [ ] All MEDIUM tasks completed (4-8)
- [ ] All tests pass (physics + renderers + integration)
- [ ] Browser smoke test passes (no console errors)
- [ ] Screenshot baseline updated (no visual regressions)
- [ ] Git commit dengan conventional message
