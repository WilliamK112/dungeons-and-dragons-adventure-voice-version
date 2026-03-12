let ctx: AudioContext | null = null;
let deathAudio: HTMLAudioElement | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!ctx) ctx = new AudioContextCtor();
  return ctx;
}

function tone(freq: number, durationMs: number, type: OscillatorType = 'sine', volume = 0.04, delayMs = 0) {
  const audio = getCtx();
  if (!audio) return;
  const startAt = audio.currentTime + delayMs / 1000;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationMs / 1000);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(startAt);
  osc.stop(startAt + durationMs / 1000 + 0.02);
}

export function playChoiceClick() {
  tone(540, 80, 'triangle', 0.03);
}

export function playSuccess() {
  tone(523, 100, 'triangle', 0.035);
  tone(659, 120, 'triangle', 0.035, 70);
}

export function playFail() {
  tone(180, 140, 'sawtooth', 0.028);
  tone(140, 140, 'sawtooth', 0.028, 100);
}

export function playInventoryGain() {
  tone(740, 80, 'square', 0.03);
  tone(880, 80, 'square', 0.03, 60);
}

export function playLevelUp() {
  tone(392, 90, 'triangle', 0.03);
  tone(523, 90, 'triangle', 0.03, 70);
  tone(784, 120, 'triangle', 0.03, 140);
}

export function playDeathSfx() {
  if (typeof window === 'undefined') return;
  if (!deathAudio) {
    deathAudio = new Audio('/audio/death-funeral-march.ogg');
    deathAudio.preload = 'auto';
  }
  try {
    deathAudio.currentTime = 0;
    deathAudio.volume = 0.45;
    deathAudio.play().catch(() => {
      // ignore autoplay/interaction failures
    });
    window.setTimeout(() => {
      if (!deathAudio) return;
      deathAudio.pause();
      deathAudio.currentTime = 0;
    }, 2600);
  } catch {
    // ignore audio errors
  }
}

export const playDeath = playDeathSfx;
