# PRD — Synchronous Generator Simulator

**Tanggal**: 2026-09-07  
**Versi**: 1.0  
**Sumber kebenaran**: Kundur (1994) *Power System Stability and Control*, Bab 11-12  
**Status**: DRAFT

---

## 1. Latar belakang

Simulator ini mendemonstrasikan dinamika generator sinkron pasca-gangguan (post-fault
transients) dengan fokus pada:

1. **Swing equation** — evolusi sudut δ(t) dan frekuensi ω(t)
2. **TGOV1 Governor** — kontrol daya mekanik Pm
3. **Equal Area Criterion (EAC)** — analisis stabilitas dengan kritis clearing angle
4. **Real Load Response (RLR)** — profil beban 24 jam + simulasi 2400× speed

Target pengguna: mahasiswa Teknik Elektro / profesional proteksi menggunakan alat
untuk edukasi interaktif.

---

## 2. Asumsi dasar

| Parameter | Nilai | Sumber |
|-----------|-------|--------|
| Frekuensi nominal | 60 Hz (50 Hz opsional) | IEEE 399-1997 |
| Rating generator | 1 pu | konsek menjadi basis pu |
| Sudut sempurna (δ₀) | 0° — 90° | swing equation |
| Impeden transfer | Ditetapkan via Pmax | Kundur 11.13 |

---

## 3. Model fisika

### 3.1 Swing Equation (Kundur 11.1)

```
M · d²δ/dt² = Pm − Pe − D · (dδ/dt)
```

**State variables:**
- `δ` — sudut rotor relatif (rad)
- `ω = dδ/dt` — kecepatan angular relatif (pu, ω = 1 pada kondisi seimbang)

**Parameter:**
- `M = 2H / (ωs · Sb)` — momen inersia (H dalam konsep ke setoran energi)
- `D` — koefisien damping (biasanya 1–5 pu)
- `Pm` — daya mekanik (pu)
- `Pe = Pmax · sin(δ)` — daya elektrik (pu), asumsi infinit bus model
- `ωs = 2π · f_nom` — frekuensi angular nominal

**Dua variabel state → sistem orde-2:**
```
dδ/dt = ω − ωs    ... (atau dδ/dt = ω pada pu, konsisten)
dω/dt = (Pm − Pe − D · (ω − ωs)) / M
```

### 3.2 TGOV1 Governor (IEEE Std 421.5)

TGOV1 adalah model governor turbin uap standar ANSI/IEEE.

**Blok:**
```
 Pref ──[1+R₁s]──[1+T₂s]──► Valve position (y) ──[T₁]──► Pm
        (droop)   (lead-lag)
```

**Parameter (Level 2 default):**
| Parameter | Simbol | Nilai | Unit | Keterangan |
|-----------|--------|-------|------|------------|
| Droop | R | 0.05 | pu | 5% droop (standar ANSI) |
| Time constant T1 | T1 | 0.5 | s | low-pressure reheat |
| Time constant T2 | T2 | 3.5 | s | lead-lag governor |
| Deadband | DB | 0.0 | pu | tidak diajakkan di Level 2 ini |

**Persamaan:**
1. Error: `E = Pref − Pm`
2. Proportional: `EG = E / R = (Pref − Pm) / R`
3. Lead-lag (T₂/T₁): `y = EG · (1 + T₂s) / (1 + T₁s)`
4. Output: `Pm = y` (clamp 0 — ∞; Valve linear, no rate limiter in base model)

**Catatan**: T₁ and T₂ in original code may be swapped vs IEEE convention. Ini
dokumentasi asli, jangaian hanya diperlakukan konsisten dengan Kundur/Boeing standard
yang asli pakai T1=0.5s dan T2=3.5s.

### 3.3 Equal Area Criterion (EAC)

EAC mengevaluasi stabilitas sudut transien dengan membandingkan energi akumulasi
positif dan negatif relatif ke `δ₀`.

**Persamaan kunci (Kundur 11.13, 11.17):**

- **Critical clearing angle** (δcc) — sudut di mana area setara:
  ```
  A1 = A2
  A1 = ∫[δ₀..δcc] (Pm − Pe_max · sin(δ)) dδ
  A2 = ∫[δcc..δmax] (Pe_max · sin(δ) − Pm) dδ
  ```

  Solusi tertutup (Kundur 11.17):
  ```
  δcc = arccos[(Pm/Pmax) · ( (π/2 − (δmax − δcc)) ...) ]
  ```

  Versi sederhana (Pm < Pmax, post-fault):
  ```
  δcc = arccos((Pm/Pmax) · (1 − cos(δmax)))
  ```

- **Stabilitas**:
  - `δ < δcc` → stabil (area margin cukup)
  - `δ ≥ δcc` → tidak stabil / lost synchronism (out-of-step)

- **Critical Clearing Time (CCT)**: waktu minimum gangguan sebelum δ mencapai δcc.
  Dihitung via integrasi numerik dari swing equation selama fault-on.

**Status**: EAC dihitung dari state yang ada; tidak memengaruhi dinamika (analisis
pasca-simulasi, bukan in-runtime).

### 3.4 Real Load Response (RLR)

RLR mensimulasikan variasi beban sistem selama 24 jam berdasarkan IEEE Std 399-1997
profil beban TIP (Typical Integrated Peak) dan berlalu 2400× speed (1440 menit →
36 detik simulasi).

**Struktur data:**
```js
RLR_PROFILE = [
  { t: 0,  load: 0.65, period: 'Malam' },     // 00:00
  { t: 1,  load: 0.60, period: 'Malam' },     // 01:00
  // ...
  { t: 12, load: 0.95, period: 'Siang' },     // 12:00
  // ...
  { t: 23, load: 0.70, period: 'Malam' }      // 23:00
];
```

**Logika:**
- `getRLRLoad(t_hours)` → nilai beban pu (interpolasi linear)
- `getRLRPeriod(t_hours)` → label periode (Malam/Siang/Puncak)
- Simulasi 2400× → step 0.01s merepresentasikan ~0.4 detik wall-clock per jam

---

## 4. Parameter default

```js
CONSTANTS = {
  F0: 60,              // frekuensi nominal [Hz]
  H: 5.0,              // inersia energi [s]
  D: 2.0,              // koefisien damping [pu]
  Pmax: 2.0,           // daya maksimum transmisi [pu]
  R: 0.05,             // droop TGOV1 [pu]
  T1: 0.5,             // TGOV1 T1 [s]
  T2: 3.5,             // TGOV1 T2 [s]
  DT: 0.01,            // timestep integrasi [s]
  SPEED: 2400,         // real-time multiplier
  DELTA_INIT: 0.524,   // δ₀ awal [rad] = 30°
};
```

---

## 5. Skenario simulasi

| Skenario | Pref | Pm_init | Fault | δ_init | Keterangan |
|----------|------|---------|-------|--------|------------|
| Startup | 1.0 | 0.0 | none | 30° | Generator di-energikan dari diam |
| Swing Test | 1.0 | 1.0 | none | 30° | Keseimbangan steady-state, sedikit osilasi |
| Fault On | 0.5 | 1.0 | 3ph t=5s | 30° | Gangguan tiga fasa, Pm > Pe selama fault |
| Fault Clear | 0.5 | 1.0 | 3ph t=5s→5.1s | 30° | Fault jernih, turun ke re-separation |
| RLR Sweep | — | dinamis | none | — | Profil beban 24h, 2400× speed |

---

## 6. Output & visualisasi

### 6.1 Phasor Diagram (SVG)
- `E'` — gGL (generator internal EMF), berputar dengan δ
- `V` — infinite bus voltage (referensi statis, 0°)
- `I` — arus transmisi
- `δ` — sudut antara E' dan V

### 6.2 P-δ Curve (SVG)
- Kurva `Pe = Pmax · sin(δ)`
- Area A₁, A₂ (Equal Area Criterion) — di-highlight bila δ ≥ δcc
- Titik kritis: δ₀, δcc, δmax

### 6.3 Time Series (Canvas)
- Layout 4-stack vertikal: δ(t), ω(t), Pe(t), Pm(t)
- DPR-scaled, scroll horizontal bila > 1000 steps

### 6.4 RLR Chart (Canvas/SVG)
- Profil beban 24h vs waktu
- Highlight: siang malam, puncak beban, dan status rotor

---

## 7. Testing

### 7.1 Model physics (pure functions)
- `rk4Step` — akurasi O(h⁵) vs solusi analitik sederhana
- `tgov1Step` — respons step, settling time ≈ 3–5 s
- `computeCC` — δcc konsisten dengan numerik integrasi
- `getRLRLoad` — 25 titik profil, interpolasi linear

### 7.2 Renderers
- Phasor: E', V, I berada pada lingkaran dengan jari-jari yang tepat
- P-δ: kurva sinusoidal antara 0° dan 180°
- Time series: canvas width, DPR scaling, axis labels

### 7.3 Integration
- Skenario "Startup" → δ tumbuh dari 0° ke δ_eq, ω → 1.0 pu
- Skenario "Fault On/Clear" → δ naik saat fault, turun setelah clearing

---

## 8. Changelog

| Versi | Tanggal | Perubahan |
|-------|---------|-----------|
| 1.0 | 2026-09-07 | Initial PRD, model swing/TGOV1/EAC/RLR |
