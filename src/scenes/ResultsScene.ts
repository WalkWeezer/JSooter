import Phaser from 'phaser';
import { t } from '../i18n';
import type { MissionResultPayload } from './MissionScene';
import { saveService } from '../save/SaveService';
import { getNextMissionId } from '../data/missionIndex';

export class ResultsScene extends Phaser.Scene {
  private payload!: MissionResultPayload;

  constructor() {
    super('ResultsScene');
  }

  init(data: MissionResultPayload): void {
    this.payload = data;
  }

  create(): void {
    const { width, height } = this.scale;
    const pad = Number(this.registry.get('stickyPaddingPx') || 90);
    const p = this.payload;
    const nextId = getNextMissionId(p.missionId);

    saveService.markCleared(p.missionId, p.rank, p.timeSec, p.deaths, nextId);

    this.cameras.main.setBackgroundColor('#0B0D12');

    this.add
      .text(width / 2, pad + 50, t('results.title'), {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#2DE2E6',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.3, t('results.rank', { rank: p.rank }), {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: p.rank.startsWith('S') ? '#39FF14' : '#FF2A6D',
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.44,
        `${t('results.deaths', { count: p.deaths })}\n${t('results.time', { time: p.timeSec.toFixed(1) + 's' })}\n${t('shop.impulses', { count: saveService.get().impulses })}`,
        {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#cfd6e6',
          align: 'center',
        },
      )
      .setOrigin(0.5);

    if (nextId) {
      const next = this.add
        .text(width / 2, height * 0.6, t('results.next'), {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#0B0D12',
          backgroundColor: '#2DE2E6',
          padding: { x: 16, y: 10 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      next.on('pointerdown', () => this.scene.start('BriefingScene', { missionId: nextId }));
    }

    const again = this.add
      .text(width / 2, height * 0.7, t('mission.retry'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#0B0D12',
        backgroundColor: '#FF2A6D',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    again.on('pointerdown', () => {
      this.registry.set('runDeaths', 0);
      this.scene.start('BriefingScene', { missionId: p.missionId });
    });

    const hub = this.add
      .text(width / 2, height * 0.8, t('results.to_hub'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#2DE2E6',
        backgroundColor: '#121820',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    hub.on('pointerdown', () => this.scene.start('HubScene'));
  }
}
