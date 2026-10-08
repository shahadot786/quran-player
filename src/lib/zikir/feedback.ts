export type Cue = "count" | "step" | "round";
export type FeedbackSettings = { sound: boolean; haptics: boolean };

const VIBRATION: Record<Cue, number[]> = { count: [12], step: [30, 40, 30], round: [60, 50, 60, 50, 140] };
// Short notes per cue: a soft tick for each count, and a rising pair or trio for a finished step or round.
const NOTES: Record<Cue, { hz: number; at: number; length: number }[]> = {
  count: [{ hz: 880, at: 0, length: 0.05 }],
  step: [{ hz: 660, at: 0, length: 0.09 }, { hz: 880, at: 0.09, length: 0.12 }],
  round: [{ hz: 660, at: 0, length: 0.1 }, { hz: 880, at: 0.1, length: 0.1 }, { hz: 1320, at: 0.2, length: 0.22 }],
};

export function vibrate(cue: Cue) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(VIBRATION[cue]);
}

type AudioWindow = typeof globalThis & { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };

// The audio context is only created on the first count, because browsers allow sound only after a tap.
export class Feedback {
  private context: AudioContext | null = null;

  private sound(cue: Cue) {
    const Context = (globalThis as AudioWindow).AudioContext ?? (globalThis as AudioWindow).webkitAudioContext;
    if (!Context) return;
    this.context ??= new Context();
    const context = this.context;
    if (context.state === "suspended") void context.resume();
    for (const note of NOTES[cue]) {
      const start = context.currentTime + note.at;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = note.hz;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.length);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + note.length + 0.02);
    }
  }

  play(cue: Cue, settings: FeedbackSettings) {
    if (settings.haptics) vibrate(cue);
    if (!settings.sound) return;
    try {
      this.sound(cue);
    } catch {
      // A browser that refuses audio just counts silently.
    }
  }
}
