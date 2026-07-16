import Phaser from 'phaser';
import { t } from '../i18n';
import { gameplayStart } from '../platform/yandex';

export class PauseOverlay extends Phaser.Scene {
  constructor() {
    super('PauseOverlay');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0b0d12, 0.72).setScrollFactor(0);
    this.add
      .text(width / 2, height / 2 - 30, t('mission.pause'), {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#2DE2E6',
      })
      .setOrigin(0.5);

    const resume = this.add
      .text(width / 2, height / 2 + 30, t('mission.resume'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#39FF14',
        backgroundColor: '#152018',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    resume.on('pointerdown', () => {
      this.scene.resume('MissionScene');
      gameplayStart();
      this.scene.stop();
    });

    const hub = this.add
      .text(width / 2, height / 2 + 80, t('results.to_hub'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#9aa3b5',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    hub.on('pointerdown', () => {
      this.scene.stop('MissionScene');
      this.scene.start('HubScene');
      this.scene.stop();
    });
  }
}
