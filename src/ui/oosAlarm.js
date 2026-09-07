// src/ui/oosAlarm.js
// Out-of-Step (OOS) alarm: triggers when δ > δcc (lost synchronism).
// Plays a beep and shows a visual indicator.

let alarmActive = false;
let beepInterval = null;

export function startOOSAlarm() {
  if (alarmActive) return;
  alarmActive = true;

  console.warn('⚠ Out-of-Step detected! Generator lost synchronism.');

  // Visual alarm
  const alarmEl = document.getElementById('oos-indicator');
  if (alarmEl) {
    alarmEl.classList.add('active');
    alarmEl.textContent = '⚠ OUT-OF-STEP';
  }

  // Audio alarm (if available)
  try {
    beepInterval = setInterval(() => {
      playBeep();
    }, 1000);
  } catch (e) {
    console.warn('Audio not available');
  }
}

export function stopOOSAlarm() {
  if (!alarmActive) return;
  alarmActive = false;

  console.log('Alarm cleared.');

  const alarmEl = document.getElementById('oos-indicator');
  if (alarmEl) {
    alarmEl.classList.remove('active');
    alarmEl.textContent = '';
  }

  if (beepInterval) {
    clearInterval(beepInterval);
    beepInterval = null;
  }
}

export function isOOSActive() {
  return alarmActive;
}

// Play a single beep using Web Audio API
function playBeep() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gain.gain.setValueAtTime(0.1, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    // Silent fail
  }
}

// Check OOS condition and toggle alarm
export function checkOOS(state, deltaCC) {
  if (state.delta > deltaCC) {
    startOOSAlarm();
  } else {
    stopOOSAlarm();
  }
}
