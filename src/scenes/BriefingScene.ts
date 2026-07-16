import Phaser from 'phaser';
import { t } from '../i18n';
import plat03 from '../data/missions/plat_03.json';
import type { MissionDef } from '../game/types';

export class BriefingScene extends Phaser.Scene {
  private missionId = 'plat_03';

  constructor() {
    super('BriefingScene');
  }

  init(data: { missionId?: string }): void {
    this.missionId = data?.missionId || 'plat_03';
  }

  create(): void {
    const mission = plat03 as MissionDef;
    const { width, height } = this.scale;
    const pad = Number(this.registry.get('stickyPaddingPx') || 90);

    this.cameras.main.setBackgroundColor('#0B0D12');

    this.add
      .text(width / 2, pad + 40, t('briefing.title'), {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#2DE2E6',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, pad + 90, this.missionId.toUpperCase(), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#FF2A6D',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.38, t('briefing.plat_03_body'), {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#cfd6e6',
        align: 'center',
        wordWrap: { width: Math.min(460, width - 40) },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.52, t('briefing.objective_extract'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#39FF14',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.58, `${t('briefing.s_hint', { sec: mission.sRankRules.maxTimeSec })}`, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#6b7385',
      })
      .setOrigin(0.5);

    const start = this.add
      .text(width / 2, height * 0.72, t('briefing.start'), {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#0B0D12',
        backgroundColor: '#2DE2E6',
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    start.on('pointerdown', () => {
      this.registry.set('runDeaths', 0);
      this.scene.start('MissionScene', { missionId: this.missionId });
    });

    const back = this.add
      .text(width / 2, height - pad - 30, t('common.back'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#9aa3b5',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    back.on('pointerdown', () => this.scene.start('HubScene'));
  }
}
