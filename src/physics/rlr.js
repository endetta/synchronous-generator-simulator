// src/physics/rlr.js
// Real Load Response (RLR) — 24-hour load profile simulation
// Based on IEEE Std 399-1997 Typical Integrated Peak (TIP) load profile.
// Load values are normalized to the daily peak (1.0 pu).

// 24-hour load profile (pu, normalized to daily peak = 1.0).
// Source: IEEE Std 399-1997 representative residential/light-industrial mix.
const LOAD_PROFILE = [
  0.65, // 00:00 - Late night
  0.60, // 01:00
  0.55, // 02:00
  0.52, // 03:00
  0.50, // 04:00
  0.50, // 05:00 - Daily minimum
  0.55, // 06:00 - Morning ramp
  0.62, // 07:00
  0.72, // 08:00
  0.82, // 09:00
  0.88, // 10:00
  0.92, // 11:00
  0.95, // 12:00 - Noon plateau
  0.94, // 13:00
  0.90, // 14:00 - Shoulder
  0.92, // 15:00
  0.98, // 16:00 - Afternoon ramp
  1.00, // 17:00 - Daily peak
  0.97, // 18:00
  0.94, // 19:00 - Evening plateau
  0.89, // 20:00
  0.82, // 21:00
  0.74, // 22:00
  0.70, // 23:00 - Late evening
];

// Human-readable Indonesian period labels (one per hour).
const PERIOD_LABELS = [
  'Malam',   // 00
  'Malam',   // 01
  'Malam',   // 02
  'Malam',   // 03
  'Malam',   // 04
  'Malam',   // 05
  'Pagi',    // 06
  'Pagi',    // 07
  'Pagi',    // 08
  'Pagi',    // 09
  'Siang',   // 10
  'Siang',   // 11
  'Siang',   // 12
  'Siang',   // 13
  'Siang',   // 14
  'Sore',    // 15
  'Sore',    // 16
  'Sore',    // 17
  'Sore',    // 18
  'Sore',    // 19
  'Malam',   // 20
  'Malam',   // 21
  'Malam',   // 22
  'Malam',   // 23
];

// Get normalized load at given hour (with linear interpolation for sub-hour times).
// Returns load in pu, normalized to daily peak.
export function getRLRLoad(t) {
  if (Number.isNaN(t)) return 0;
  if (t < 0) t = 0;
  if (t >= 24) t = 23.999999;

  const idx = Math.floor(t);
  const frac = t - idx;

  if (idx >= 23) return LOAD_PROFILE[23];

  return LOAD_PROFILE[idx] * (1 - frac) + LOAD_PROFILE[idx + 1] * frac;
}

// Get period label at given time (nearest-hour fallback).
export function getRLRPeriod(t) {
  if (Number.isNaN(t) || t < 0) return PERIOD_LABELS[0];
  if (t >= 24) return PERIOD_LABELS[23];
  return PERIOD_LABELS[Math.floor(t)];
}

// Get peak load hour and value.
export function getRLRPeak() {
  let peakIdx = 0;
  for (let i = 1; i < LOAD_PROFILE.length; i++) {
    if (LOAD_PROFILE[i] > LOAD_PROFILE[peakIdx]) peakIdx = i;
  }
  return {
    hour: peakIdx,
    load: LOAD_PROFILE[peakIdx],
    period: PERIOD_LABELS[peakIdx],
  };
}

// Get minimum load hour and value.
export function getRLRMinimum() {
  let minIdx = 0;
  for (let i = 1; i < LOAD_PROFILE.length; i++) {
    if (LOAD_PROFILE[i] < LOAD_PROFILE[minIdx]) minIdx = i;
  }
  return {
    hour: minIdx,
    load: LOAD_PROFILE[minIdx],
    period: PERIOD_LABELS[minIdx],
  };
}

// Expose the full profile for chart rendering.
export function getRLRProfile() {
  return LOAD_PROFILE.map((load, hour) => ({
    hour,
    load,
    period: PERIOD_LABELS[hour],
  }));
}
