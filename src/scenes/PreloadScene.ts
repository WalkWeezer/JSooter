import Phaser from 'phaser';
import { audioService } from '../audio/AudioService';
import { preloadGameSprites, ensureFallbackTextures } from '../game/SpriteFactory';
import { preloadCharacterAnims, registerCharacterAnims } from '../game/CharacterAnims';

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
      .text(cx, cy - 36, 'NEONTRON', {
        fontFamily: 'Orbitron, "Exo 2", sans-serif',
        fontSize: '22px',
        color: '#2DE2E6',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    label.setShadow(0, 0, '#2DE2E6', 10, true, true);

    this.load.on('progress', (value: number) => {
      fill.width = Math.max(4, (barWidth - 4) * value);
    });

    preloadGameSprites(this);
    preloadCharacterAnims(this);
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
    registerCharacterAnims(this);
    this.scene.start('HubScene');
  }
}
