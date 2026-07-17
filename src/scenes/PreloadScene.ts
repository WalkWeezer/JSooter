import Phaser from 'phaser';
import { t } from '../i18n';
import { audioService } from '../audio/AudioService';
import { preloadGameSprites, ensureFallbackTextures } from '../game/SpriteFactory';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    audioService.attachScene(this);
    const { width, height } = this.scale;
    const barWidth = Math.min(320, width * 0.6);
    const cx = width / 2;
    const cy = height / 2;

    const frame = this.add.rectangle(cx, cy, barWidth, 18, 0x1a1f2b).setStrokeStyle(2, 0x2de2e6);
    const fill = this.add.rectangle(cx - barWidth / 2 + 2, cy, 4, 12, 0xff2a6d).setOrigin(0, 0.5);
    const label = this.add
      .text(cx, cy - 36, t('common.brand'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#2DE2E6',
      })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      fill.width = Math.max(4, (barWidth - 4) * value);
    });

    preloadGameSprites(this);
    this.load.audio('bgm-hub', 'audio/hub-loop.mp3');
    this.load.audio('bgm-combat', 'audio/combat-loop.mp3');

    this.load.on('complete', () => {
      frame.destroy();
      fill.destroy();
      label.destroy();
    });
  }

  create(): void {
    ensureFallbackTextures(this);
    this.scene.start('HubScene');
  }
}
