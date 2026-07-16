import Phaser from 'phaser';

/**
 * Minimal audio bus for Phase 1.
 * Provides a silent/beep tone and respects tab visibility + platform pause.
 */
export class AudioService {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private mutedByUser = false;
  private mutedBySystem = false;
  private started = false;

  async ensureStarted(): Promise<void> {
    if (this.started) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.context = new Ctx();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.0001;
    this.masterGain.connect(this.context.destination);

    this.oscillator = this.context.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.value = 110;
    this.oscillator.connect(this.masterGain);
    this.oscillator.start();
    this.started = true;
    this.applyMuteState();
  }

  setUserMuted(muted: boolean): void {
    this.mutedByUser = muted;
    this.applyMuteState();
  }

  setSystemMuted(muted: boolean): void {
    this.mutedBySystem = muted;
    this.applyMuteState();
  }

  isAudible(): boolean {
    return this.started && !this.mutedByUser && !this.mutedBySystem;
  }

  /** Soft hub hum — barely audible, enough to verify mute-on-hide. */
  playHubHum(): void {
    void this.ensureStarted().then(() => {
      if (!this.masterGain || !this.context) return;
      if (!this.isAudible()) {
        this.masterGain.gain.setTargetAtTime(0.0001, this.context.currentTime, 0.01);
        return;
      }
      this.masterGain.gain.setTargetAtTime(0.02, this.context.currentTime, 0.05);
    });
  }

  stopAll(): void {
    if (!this.masterGain || !this.context) return;
    this.masterGain.gain.setTargetAtTime(0.0001, this.context.currentTime, 0.01);
  }

  private applyMuteState(): void {
    if (!this.masterGain || !this.context) return;
    const target = this.isAudible() ? 0.02 : 0.0001;
    this.masterGain.gain.setTargetAtTime(target, this.context.currentTime, 0.01);
    console.info(`[audio] mutedByUser=${this.mutedByUser} mutedBySystem=${this.mutedBySystem}`);
  }
}

export const audioService = new AudioService();

export function bindPhaserMute(game: Phaser.Game): void {
  const mute = () => {
    audioService.setSystemMuted(true);
    audioService.stopAll();
    game.sound.mute = true;
  };
  const unmute = () => {
    audioService.setSystemMuted(false);
    game.sound.mute = false;
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) mute();
    else unmute();
  });
  window.addEventListener('blur', mute);
  window.addEventListener('focus', () => {
    if (!document.hidden) unmute();
  });
}
