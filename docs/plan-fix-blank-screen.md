# Plan: Fix Blank Screen Issue

**Tanggal:** 2026-09-08
**Status:** DRAF
**Prioritas:** KRITIS

## Analisis Masalah

Berdasarkan screenshot user:
- Panel P-δ menampilkan kurva sinusoidal (BERFUNGSI)
- Panel Phasor kosong (TIDAK BERFUNGSI)
- Panel Time Series kosong (TIDAK BERFUNGSI)
- Panel Controls dan Status tidak terlihat di screenshot

## Hipotesis Penyebab

### 1. JavaScript Module Loading Error
**Probabilitas: TINGGI**

Fungsi `renderPhasor()` dan `renderTimeSeries()` mungkin tidak dipanggil atau error saat dieksekusi.

**Evidence:**
- Tests pass di Node.js (modul bekerja)
- Browser mungkin memiliki error yang berbeda

### 2. SVG/Canvas Dimensions Issue
**Probabilitas: SEDANG**

- SVG phasor mungkin memiliki `viewBox` tapi tidak ada `clientWidth/clientHeight`
- Canvas timeSeries mungkin tidak memiliki ukuran yang proper

**Evidence:**
- `phasor.js:14` menggunakan `svg.clientWidth || 300`
- `timeSeries.js` menggunakan `canvas.clientWidth || 600`

### 3. History Data Kosong
**Probabilitas: TINGGI untuk TimeSeries**

`history` object kosong saat inisialisasi, sehingga timeSeries tidak punya data untuk di-plot.

**Evidence:**
- `main.js` menginisialisasi `history = { delta: [], omega: [], Pe: [], Pm: [], simTime: [] }`
- Data hanya diisi saat `simulate()` berjalan
- `state.running = false` saat load, jadi tidak ada simulasi

### 4. Phasor Tidak Render dengan Benar
**Probabilitas: TINGGI**

`renderPhasor()` mungkin dipanggil tapi SVG innerHTML tidak ter-set dengan benar.

**Evidence:**
- `phasor.js:49-57` menggunakan `svg.innerHTML +=` pattern
- Pattern ini bisa menyebabkan masalah jika SVG tidak properly initialized

## Plan Perbaikan

### Phase 1: Diagnosa (15 menit)
1. ✅ Buka browser DevTools Console
2. ✅ Cek apakah ada JavaScript errors
3. ✅ Verifikasi `window.__app` object exists
4. ✅ Cek `state` values

### Phase 2: Fix Phasor Rendering (20 menit)
1. Tambahkan console.log di `renderPhasor()` untuk debug
2. Pastikan SVG element ditemukan
3. Pastikan innerHTML ter-set dengan benar
4. Test dengan hardcoded values

### Phase 3: Fix TimeSeries Rendering (20 menit)
1. Tambahkan initial data point di history
2. Atau render empty state dengan placeholder
3. Pastikan canvas dimensions correct

### Phase 4: Integration Test (15 menit)
1. Refresh browser dan verifikasi semua panel render
2. Test interaksi (sliders, buttons)
3. Test simulasi running
4. Screenshot untuk dokumentasi

## Commands untuk Debug

```javascript
// Di browser console:
window.__app.state                    // Cek state
document.getElementById('phasor-svg') // Cek SVG element
document.getElementById('timeseries-canvas') // Cek canvas
window.__app.applyScenario('steadyState') // Apply scenario
```

## Success Criteria

- [ ] Phasor diagram menampilkan vektor V, E', dan I
- [ ] Time series menampilkan plot (setelah simulasi dijalankan)
- [ ] P-δ curve menampilkan kurva dan titik operasi
- [ ] Controls panel responsif (sliders dan buttons bekerja)
- [ ] Status panel menampilkan nilai real-time
- [ ] Tidak ada JavaScript errors di console
