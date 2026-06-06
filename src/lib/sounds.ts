"use client";

// Synthesized sound effects using Web Audio API — no files needed
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

/** Played when user clicks to place a pin */
export function playPinDrop() {
  playTone(800, 0.08, "sine", 0.1);
  setTimeout(() => playTone(1200, 0.06, "sine", 0.08), 50);
}

/** Played when user confirms a guess — ascending notes based on score */
export function playGuessResult(score: number) {
  if (score >= 180) {
    playTone(523, 0.15, "sine", 0.12);
    setTimeout(() => playTone(659, 0.15, "sine", 0.12), 80);
    setTimeout(() => playTone(784, 0.2, "sine", 0.12), 160);
    setTimeout(() => playTone(1047, 0.3, "sine", 0.1), 240);
  } else if (score >= 100) {
    playTone(440, 0.12, "sine", 0.12);
    setTimeout(() => playTone(660, 0.2, "sine", 0.1), 100);
  } else if (score >= 50) {
    playTone(440, 0.15, "sine", 0.1);
  } else {
    playTone(400, 0.12, "sine", 0.1);
    setTimeout(() => playTone(300, 0.2, "sine", 0.08), 100);
  }
}

/** Played when a game is completed */
export function playGameComplete(totalScore: number, maxScore: number) {
  const ratio = totalScore / maxScore;
  if (ratio >= 0.8) {
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, "sine", 0.1), i * 100);
    });
  } else if (ratio >= 0.5) {
    [440, 554, 659].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, "sine", 0.1), i * 120);
    });
  } else {
    playTone(330, 0.3, "sine", 0.1);
    setTimeout(() => playTone(392, 0.3, "sine", 0.08), 200);
  }
}

/** Played when streak milestone is hit */
export function playStreakMilestone() {
  [660, 880, 1100, 1320].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.12, "triangle", 0.1), i * 70);
  });
}
