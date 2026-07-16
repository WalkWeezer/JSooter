import Phaser from 'phaser';

/**
 * Phaser-backed music bus with mute policies for Yandex requirements.
 */
export class AudioService {
  private scene?: Phaser.Scene;
  private mutedByUser = false;
  private mutedBySystem = false;
  private currentKey: 'hub' | 'combat' | null = null;

  attachScene(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  setUserMuted(muted: boolean): void {
    this.mutedByUser = muted;
    this.apply();
  }

  setSystemMuted(muted: boolean): void {
    this.mutedBySystem = muted;
    this.apply();
  }

  isAudible(): boolean {
    return !this.mutedByUser && !this.mutedBySystem;
  }

  playHubHum(): void {
    this.playLoop('hub', 'bgm-hub', 0.35);
  }

  playCombat(): void {
    this.playLoop('combat', 'bgm-combat', 0.4);
  }

  playDeathSting(): void {
    if (!this.scene || !this.isAudible()) return;
    // short noise burst via existing tone texture not available — use volume blip on hub
    if (this.scene.cache.audio.exists('bgm-hub')) {
      const s = this.scene.sound.add('bgm-hub', { volume: 0.05, rate: 0.6 });
      s.play();
      this.scene.time.delayedCall(200, () => s.stop());
    }
  }

  stopAll(): void {
    this.scene?.sound.stopAll();
    this.currentKey = null;
  }

  private playLoop(key: 'hub' | 'combat', cacheKey: string, volume: number): void {
    if (!this.scene) return;
    if (this.currentKey === key && this.scene.sound.get(cacheKey)?.isPlaying) {
      this.apply();
      return;
    }
    this.scene.sound.stopAll();
    if (!this.scene.cache.audio.exists(cacheKey)) {
      console.warn('[audio] missing', cacheKey);
      return;
    }
    this.scene.sound.play(cacheKey, { loop: true, volume: this.isAudible() ? volume : 0 });
    this.currentKey = key;
    this.apply();
  }

  private apply(): void {
    if (!this.scene) return;
    this.scene.sound.mute = !this.isAudible();
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
