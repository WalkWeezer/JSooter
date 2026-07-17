import Phaser from 'phaser';
import { t } from '../i18n';
import { gameplayStart, gameplayStop } from '../platform/yandex';

export class PauseOverlay extends Phaser.Scene {
  constructor() {
    super('PauseOverlay');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0b0d12, 0.72).setScrollFactor(0);
    this.add
      .text(width / 2, height / 2 - 50, t('mission.pause'), {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#2DE2E6',
      })
      .setOrigin(0.5);

    const resume = this.add
      .text(width / 2, height / 2 + 10, t('mission.resume'), {
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

    const restart = this.add
      .text(width / 2, height / 2 + 60, t('mission.restart'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#FFC857',
        backgroundColor: '#1a1520',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    restart.on('pointerdown', () => {
      const mission = this.scene.get('MissionScene') as Phaser.Scene & { mission?: { id: string } };
      const missionId = mission?.mission?.id || this.registry.get('currentMissionId') || 'tut_01';
      this.registry.set('runDeaths', 0);
      gameplayStop();
      this.scene.stop('MissionScene');
      this.scene.start('MissionScene', { missionId });
      this.scene.stop();
    });

    const hub = this.add
      .text(width / 2, height / 2 + 110, t('results.to_hub'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#9aa3b5',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    hub.on('pointerdown', () => {
      gameplayStop();
      this.scene.stop('MissionScene');
      this.scene.start('HubScene');
      this.scene.stop();
    });
  }
}
