/**
 * Web Audio API synthesizer for study reminder alerts and alarms.
 * Provides pleasant, high-fidelity chimes and bells that don't depend on external assets.
 */

class SoundAlertService {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Cheerful School Bell / Study Reminder Chime
   */
  playStudyChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.28 }, // C5
      { freq: 659.25, time: 0.22, dur: 0.28 }, // E5
      { freq: 783.99, time: 0.44, dur: 0.32 }, // G5
      { freq: 1046.50, time: 0.70, dur: 0.75 }, // C6
    ];

    const now = ctx.currentTime;

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      // Gentle bell envelope
      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.3, now + time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur);
    });
  }

  /**
   * Energetic Alarm / Attention Tone
   */
  playUrgentAlert(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const pattern = [880, 1174.66, 880, 1174.66]; // A5, D6, A5, D6

    pattern.forEach((freq, idx) => {
      const time = idx * 0.16;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.25, now + time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + 0.15);
    });
  }

  /**
   * Celebration Chime (when task/review is completed)
   */
  playSuccessChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chords = [
      { f: 587.33, t: 0.0 }, // D5
      { f: 739.99, t: 0.12 }, // F#5
      { f: 880.00, t: 0.24 }, // A5
      { f: 1174.66, t: 0.36 }, // D6
    ];

    chords.forEach(({ f, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0, now + t);
      gain.gain.linearRampToValueAtTime(0.25, now + t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + 0.6);
    });
  }
}

export const ReminderSound = new SoundAlertService();
