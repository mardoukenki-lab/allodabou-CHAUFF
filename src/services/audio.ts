/**
 * Audio Alert & Vibration Service for Allô Dabou Chauffeur
 * Generates an audible driver alert using Web Audio API without external file dependencies
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playNewRideAlert(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // High clarity two-stage alert chime (880Hz -> 1320Hz -> 1760Hz)
    const tones = [
      { freq: 880, start: 0.0, dur: 0.15 },
      { freq: 1175, start: 0.18, dur: 0.18 },
      { freq: 1760, start: 0.40, dur: 0.35 },
      // Second burst
      { freq: 880, start: 0.90, dur: 0.15 },
      { freq: 1175, start: 1.08, dur: 0.18 },
      { freq: 1760, start: 1.30, dur: 0.45 },
    ];

    tones.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.35, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    });

    // Device vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([250, 100, 250, 100, 400]);
    }
  } catch (err) {
    console.warn('Audio alert error:', err);
  }
}

// User-triggered sound test / unlock audio context
export function testAlertSound(): void {
  playNewRideAlert();
}
