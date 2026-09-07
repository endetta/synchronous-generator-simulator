# CLAUDE.md — Synchronous Generator Simulator (LEVEL 2)

Panduan untuk agen coding yang bekerja di **simulator generator sinkron** ini.
Proyek ini adalah migrasi modular dari `LEVEL 1 - SYNCHRONOUS GENERATOR SIMULATOR (UNSTABLE).html`
dengan arsitektur Level 2 (vanilla ES modules + Node.js testing harness).

## Identitas proyek

- **Nama**: Synchronous Generator Simulator
- **Level**: 2 (modular vanilla, tanpa build)
- **Stack**: HTML + CSS + ES modules JavaScript (murni browser)
- **Repo**: `endetta/synchronous-generator-simulator` (branch `main`)
- **Status**: **AKTIF DEVELOPMENT** — refaktoring dari LEVEL 1

## Model fisika & referensi

**Sumber kebenaran**: `docs/PRD.md` — semua persamaan, parameter, dan asumsi model
berasal dari Kundur (1994) *Power System Stability and Control*, Bab 11-12.

Model inti:
1. **Swing Equation** (Kundur 11.1): `M·d²δ/dt² = Pm - Pe - D·(dδ/dt)`
2. **TGOV1 Governor** (IEEE Std 421.5): PID steam turbine dengan T1=0.5s, T2=3.5s, R=5%
3. **EAC (Equal Area Criterion)** (Kundur 11.13, 11.17): analisis stabilitas δcc
4. **RLR (Real Load Response)**: profil beban 24 jam IEEE Std 399-1997, simulasi 2400× speed

**Integrator**: RK4 (Runge-Kutta orde-4), Δt = 0.01s (10ms), akurasi O(h⁵).

## Struktur folder

```
LEVEL 2 - SYNCHRONOUS GENERATOR SIMULATOR/
├── index.html              # entry point, <script type="module" src="src/main.js">
├── src/
│   ├── main.js             # orchestrator, init semua modul
│   ├── state.js            # state global (δ, ω, Pe, Pm, ...), event bus
│   ├── constants.js        # konstanta fisika (M, D, Pmax, ...)
│   ├── scenarios.js        # preset skenario (startup, fault, swing, ...)
│   ├── styles.css          # stylesheet tunggal
│   ├── physics/
│   │   ├── swing.js        # RK4 integrator + swing equation
│   │   ├── tgov1.js        # TGOV1 governor model
│   │   ├── eac.js          # Equal Area Criterion calculator
│   │   └── rlr.js          # Real Load Response 24h profile
│   ├── renderers/
│   │   ├── phasor.js       # diagram phasor SVG (E', V, I, δ)
│   │   ├── pdelta.js       # kurva P-δ SVG (Pmax·sin(δ), EAC shading)
│   │   ├── timeSeries.js   # 4-stack canvas (δ, ω, Pe, Pm)
│   │   └── rlrChart.js     # chart beban 24h (canvas atau SVG)
│   └── ui/
│       ├── controls.js     # slider, dropdown, button handler
│       ├── panels.js       # toggle visibility panel (phasor, pdelta, ...)
│       ├── tooltip.js      # hover tooltip di SVG/canvas
│       └── oosAlarm.js     # alarm out-of-step (δ > δcc)
├── docs/
│   ├── PRD.md              # Product Requirements Document (model fisika)
│   └── overview.md         # orientasi cepat
├── tools/
│   ├── lens-harness.js     # stub DOM untuk testing (jsdom-like)
│   ├── physics.test.js     # tes swing.js, tgov1.js, eac.js, rlr.js
│   ├── renderers.test.js   # tes phasor.js, pdelta.js, timeSeries.js
│   └── integration.test.js # tes end-to-end (scenario → render)
├── design-plans/
│   ├── sesi-TEMPLATE.md    # template log sesi
│   ├── plan-modular-migration.md  # rencana migrasi dari LEVEL 1
│   └── sesi-2026-09-07-01-initial-scaffold.md
└── _archive/
    └── original.html       # backup LEVEL 1 (UNSTABLE) original

```

## Aturan kerja

### 1. **Sumber kebenaran model = `docs/PRD.md`**

Semua persamaan, konstanta, dan asumsi fisika harus match dengan PRD. Jangan mengubah
model tanpa update PRD terlebih dahulu. Jika menemukan inkonsistensi antara kode dan
PRD: PRD yang benar — perbaiki kode.

### 2. **ES modules, tanpa build**

- Import/export native browser: `import { rk4Step } from './physics/swing.js';`
- Jalankan via HTTP server: `python -m http.server 8000` atau `npx serve`
- Tidak ada bundler (Vite, Webpack, Rollup) — keep it simple

### 3. **Testing via Node.js harness**

Modul diuji di Node dengan `tools/lens-harness.js` (stub DOM minimal). Pattern:

```javascript
// tools/physics.test.js
import assert from 'node:assert';
import { rk4Step } from '../src/physics/swing.js';

const state = { delta: 0.5, omega: 1.0 };
const next = rk4Step(state, { Pm: 1.0, Pmax: 2.0, M: 10, D: 2 }, 0.01);
assert(Math.abs(next.delta - 0.50005) < 1e-5, 'RK4 delta increment');
```

Jalankan: `node tools/physics.test.js` (atau `node --test` jika pakai `node:test`).

### 4. **Seam desain wajib dijaga**

Arsitektur **physics → state → renderers → UI** harus dipertahankan:
- **Physics**: fungsi murni, tidak tahu DOM (`swing.js`, `eac.js`)
- **Renderers**: nerima data, render ke SVG/canvas, tidak tahu state global
- **State**: centralized (`state.js`), event bus untuk notifikasi perubahan
- **UI**: event handler (click, input), trigger state mutation

Jangan mencampur concern (misal: jangan masukkan logika RK4 ke dalam renderer).

### 5. **Commit & pesan**

Repo ini punya remote `https://github.com/endetta/synchronous-generator-simulator`.
Conventional commits, Bahasa Indonesia:

```
feat(physics): tambahkan integrator RK4 dengan akurasi O(h⁵)
fix(eac): perbaiki perhitungan A2 untuk gangguan 3-fasa
test(renderers): tambahkan tes phasor diagram dengan δ = 30°
docs(prd): perbarui parameter TGOV1 sesuai IEEE 421.5
```

Push dari folder proyek, jangan dari root library.

### 6. **Bug fix dari LEVEL 1**

Bug kritis di original (`none` vs `'none'`, line 1266) sudah diperbaiki di migrasi
ini. File asli tetap ada di `_archive/original.html` sebagai referensi.

### 7. **Log sesi wajib**

Setiap sesi kerja non-sepele: buat/update `design-plans/sesi-YYYY-MM-DD-NN-*.md`
dengan template dari `sesi-TEMPLATE.md`. Catat:
- Waktu mulai + commit sebelum
- Kegiatan & hasil (ringkas + bukti)
- Status plan terkait
- Langkah berikutnya

Sesi baru: baca CLAUDE.md (ini) → log sesi terbaru → plan ber-status DRAF/AKTIF →
lanjutkan. Jangan eksplorasi ulang dari nol.

## Validasi cepat

```bash
# Dari folder proyek LEVEL 2 - SYNCHRONOUS GENERATOR SIMULATOR

# Tes model fisika (swing, TGOV1, EAC, RLR)
node tools/physics.test.js

# Tes renderer (phasor, pdelta, timeSeries)
node tools/renderers.test.js

# Tes integrasi end-to-end
node tools/integration.test.js

# Jalankan simulator di browser
python -m http.server 8000
# Buka http://localhost:8000
```

## Gotcha

- **Original file berlabel UNSTABLE** — jangan edit file LEVEL 1 langsung; kerja di
  folder LEVEL 2 ini. Backup ada di `_archive/original.html`.
- **Canvas DPR scaling**: `timeSeries.js` harus pakai `window.devicePixelRatio` agar
  tajam di layar retina.
- **SVG coordinate system**: phasor pakai `viewBox="-150 -150 300 300"` (origin tengah),
  pdelta pakai `viewBox="0 0 360 200"` (origin kiri-atas).
- **RK4 step size**: Δt = 0.01s (10ms) cukup untuk swing equation. Jangan terlalu kecil
  (boros) atau terlalu besar (tidak stabil).
- **Governor lag**: TGOV1 punya T2 = 3.5s, jadi respon Pm lambat ~3-5 detik. Ini fisika,
  bukan bug.
- **File HTML/CSS/JS = Bahasa Indonesia** untuk label UI; komentar kode boleh Inggris
  atau Indonesia. Jangan terjemahkan istilah teknis (swing, droop, governor).

## Status migrasi (2026-09-07)

- ✅ Folder structure created
- ✅ `index.html` entry point
- ✅ `CLAUDE.md` (ini)
- ⏳ `docs/PRD.md` (next)
- ⏳ `docs/overview.md`
- ⏳ `src/` modules
- ⏳ `tools/` test harness
- ⏳ Git init + remote setup

Fase 2-5 (ekstraksi modul + tes) belum mulai. Lihat `design-plans/plan-modular-migration.md`
untuk roadmap lengkap.
