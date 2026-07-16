import Phaser from 'phaser';
import { listMissions, TUTORIAL_IDS } from '../data/missionIndex';
import { saveService } from '../save/SaveService';
import { t } from '../i18n';

export class MissionSelectScene extends Phaser.Scene {
  constructor() {
    super('MissionSelectScene');
  }

  create(): void {
    const { width, height } = this.scale;
    const pad = Number(this.registry.get('stickyPaddingPx') || 90);
    this.cameras.main.setBackgroundColor('#0B0D12');

    this.add
      .text(width / 2, pad + 28, t('hub.open_missions'), {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#2DE2E6',
      })
      .setOrigin(0.5);

    const missions = listMissions();
    const startY = pad + 70;
    const rowH = 34;
    const maxVisible = Math.floor((height - startY - pad - 60) / rowH);

    missions.slice(0, maxVisible).forEach((m, i) => {
      const unlocked = saveService.isUnlocked(m.id);
      const cleared = saveService.get().cleared[m.id];
      const label = `${m.id.toUpperCase()}  ${cleared ? '[' + cleared.rank + ']' : unlocked ? '•' : '🔒'}`;
      const color = !unlocked ? '#4a5160' : cleared ? '#39FF14' : '#cfd6e6';
      const row = this.add
        .text(width / 2, startY + i * rowH, label, {
          fontFamily: 'monospace',
          fontSize: '15px',
          color,
          backgroundColor: unlocked ? '#121820' : '#0d1016',
          padding: { x: 10, y: 6 },
        })
        .setOrigin(0.5);

      if (unlocked) {
        row.setInteractive({ useHandCursor: true });
        row.on('pointerdown', () => this.scene.start('BriefingScene', { missionId: m.id }));
      }
    });

    // Ensure first tutorial unlocked
    saveService.unlock('tut_01');

    const back = this.add
      .text(width / 2, height - pad - 28, t('common.back'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#9aa3b5',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('HubScene'));

    void TUTORIAL_IDS;
  }
}
