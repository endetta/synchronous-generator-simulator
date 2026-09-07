# Overview — Synchronous Generator Simulator (LEVEL 2)

**TL;DR**: Migrasi modular simulator generator sinkron dari LEVEL 1 ke Level 2
(vanilla ES modules + Node testing). Fokus: refaktoring tanpa kehilangan fitur, dan
tambahkan test coverage agar bug #1 (`none` vs `'none'`) tidak lolos lagi.

**Status**: Awal migrasi. Folder structure + dokumen sudah. Modul `src/*` belum diekstrak.

---

## Peta file cepat

| Path | Apa | Untuk apa |
|------|-----|-----------|
| `index.html` | Entry point | Load `src/main.js` via ES modules |
| `CLAUDE.md` | Panduan proyek | Baca ini dulu setiap sesi |
| `docs/prd.md` | Model fisika (swing, TGOV1, EAC, RLR) | Sumber kebenaran persamaan |
| `docs/overview.md` | Halaman ini | Orientasi cepat |
| `src/main.js` | Orchestrator | Init state, mount UI, start render loop |
| `src/state.js` | State global | δ, ω, Pe, Pm, Pmax, pref, fault state |
| `src/constants.js` | Konstanta fisika | M, D, Pmax, R, T1, T2, dt, ... |
| `src/scenarios.js` | Preset skenario | Startup, Swing, Fault, RLR |
| `src/physics/swing.js` | RK4 + swing equation | Integrator murni |
| `src/physics/tgov1.js` | TGOV1 governor | Lead-lag valve dynamics |
| `src/physics/eac.js` | Equal Area Criterion | Critical clearing angle |
| `src/physics/rlr.js` | Real Load Response | Profil beban 24h |
| `src/renderers/phasor.js` | Diagram phasor | SVG E', V, I, δ |
| `src/renderers/pdelta.js` | Kurva P-δ | SVG dengan EAC shading |
| `src/renderers/timeSeries.js` | 4-stack grafik | Canvas DPR-scaled |
| `src/renderers/rlrChart.js` | Chart beban | Canvas 24h profile |
| `src/ui/controls.js` | Slider, button | Input handlers |
| `src/ui/panels.js` | Toggle panel | Show/hide phasor, pdelta, dll |
| `src/ui/tooltip.js` | Hover tooltip | Info parameter di SVG |
| `src/ui/oosAlarm.js` | Out-of-step alarm | Beep bila δ ≥ δcc |
| `tools/lens-harness.js` | Stub DOM | Testing tanpa browser |
| `tools/physics.test.js` | Tes model | swing, tgov1, eac, rlr |
| `tools/renderers.test.js` | Tes render | SVG/canvas output |
| `tools/integration.test.js` | Tes E2E | Skenario → render |
| `design-plans/` | Log sesi + plan | Riwayat keputusan, fase kerja |
| `_archive/original.html` | Backup LEVEL 1 | Referensi bug fix |

---

## Alur kerja singkat (10 menit)

1. **Buka simulator**:
   ```bash
   python -m http.server 8000
   # buka http://localhost:8000 di browser
   ```

2. **Run tes**:
   ```bash
   node tools/physics.test.js
   node tools/renderers.test.js
   node tools/integration.test.js
   ```

3. **Cek log sesi**:
   ```bash
   ls design-plans/
   # baca sesi terbaru untuk status
   ```

---

## Peta level-level di workspace

- **LEVEL 1** (root): HTML mandiri single-file, tanpa repo git (kecuali calculator 1PG)
- **LEVEL 2** (folder): Multi-file ES modules + Node testing, repo git independen
  - `LEVEL 2 - DIFFERENTIAL RELAY SIMULATOR/` (frozen style)
  - `LEVEL 2 - DISTANCE RELAY SIMULATOR/`
  - `LEVEL 2 - UNDERFREQUENCY RELAY SIMULATOR/`
  - `LEVEL 2 - SYNCHRONOUS GENERATOR SIMULATOR/` ← **kita di sini**
- **LEVEL 3** (platform React): Vite + React 18 + TypeScript, modular ketat

Proyek ini **LEVEL 2** karena cocok dengan pola Differential/Distance/Underfrequency
(murni vanilla, fokus edukasi interaktif, tanpa kompleksitas React).

---

## Bug yang diperbaiki saat migrasi

- **Bug #1 (CRITICAL)** — `none` (ReferenceError) di line 1266 file original.
  Panel toggle akan crash. Fixed: ubah `none` menjadi `'none'` (string literal).
- **Bug #2 (Medium)** — `delta_sc_start` diset tapi tidak pernah dibaca. Cleaned up.
- **Bug #3-5 (Low)** — Dead variables dan minor logic gaps. Diperbaiki via moduler
  refaktor.

---

## Aturan main hakim sendiri

1. **PRD adalah sumber kebenaran** — kalau ada persamaan di kode yang beda dari PRD,
   perbaiki kode.
2. **ES modules, no build** — browser modern dukung native.
3. **Test di Node** — fisika murni diuji tanpa DOM (lebih cepat, deterministic).
4. **Renderer tidak boleh pegang state** — data masuk, gambar keluar, lalu selesai.
5. **Commit per fase** — setiap fase (ekstrak swing, tgov1, eac, rlr) = 1 commit.

---

## Quick reference: konstanta

| Simbol | Nilai | Unit | Default | Sumber |
|--------|-------|------|---------|--------|
| F₀ | 60 | Hz | ya | IEEE 399-1997 |
| H | 5.0 | s | ya | Kundur 12.1 |
| D | 2.0 | pu | ya | konvensi |
| Pmax | 2.0 | pu | ya | tipikal transmisi |
| R | 0.05 | pu | ya | TGOV1 IEEE 421.5 |
| T1 | 0.5 | s | ya | TGOV1 |
| T2 | 3.5 | s | ya | TGOV1 |
| dt | 0.01 | s | ya | RK4 step |
| VSPD | 2400 | x | ya | RLR speedup |

Lihat `docs/prd.md` untuk konteks lengkap.
