import Phaser from 'phaser';
import { t } from '../i18n';
import type { MissionResultPayload } from './MissionScene';
import { saveService } from '../save/SaveService';
import { getNextMissionId } from '../data/missionIndex';
import { adsService } from '../ads/AdsService';

export class ResultsScene extends Phaser.Scene {
  private payload!: MissionResultPayload;

  constructor() {
    super('ResultsScene');
  }

  init(data: MissionResultPayload): void {
    this.payload = data;
  }

  async create(): Promise<void> {
    const { width, height } = this.scale;
    const pad = Number(this.registry.get('stickyPaddingPx') || 90);
    const p = this.payload;
    const nextId = getNextMissionId(p.missionId);

    saveService.markCleared(p.missionId, p.rank, p.timeSec, p.deaths, nextId);
    await adsService.showSticky();

    this.cameras.main.setBackgroundColor('#0B0D12');

    this.add
      .text(width / 2, pad + 50, t('results.title'), {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#2DE2E6',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.26, t('results.rank', { rank: p.rank }), {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: p.rank.startsWith('S') ? '#39FF14' : '#FF2A6D',
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.4,
        `${t('results.deaths', { count: p.deaths })}\n${t('results.time', { time: p.timeSec.toFixed(1) + 's' })}\n${t('shop.impulses', { count: saveService.get().impulses })}`,
        {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#cfd6e6',
          align: 'center',
        },
      )
      .setOrigin(0.5);

    const rv = this.add
      .text(width / 2, height * 0.54, t('ads.reward_x2'), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#0B0D12',
        backgroundColor: '#FFC857',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    rv.on('pointerdown', async () => {
      rv.disableInteractive();
      const ok = await adsService.showRewarded();
      if (ok) {
        saveService.addImpulses(10);
        rv.setText(t('shop.impulses', { count: saveService.get().impulses }));
      } else {
        rv.setInteractive({ useHandCursor: true });
      }
    });

    const goNext = async (target: () => void) => {
      await adsService.showInterstitial();
      target();
    };

    if (nextId) {
      const next = this.add
        .text(width / 2, height * 0.64, t('results.next'), {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#0B0D12',
          backgroundColor: '#2DE2E6',
          padding: { x: 16, y: 10 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      next.on('pointerdown', () => {
        void goNext(() => this.scene.start('BriefingScene', { missionId: nextId }));
      });
    }

    const again = this.add
      .text(width / 2, height * 0.74, t('mission.retry'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#0B0D12',
        backgroundColor: '#FF2A6D',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    again.on('pointerdown', () => {
      void goNext(() => {
        this.registry.set('runDeaths', 0);
        this.scene.start('BriefingScene', { missionId: p.missionId });
      });
    });

    const hub = this.add
      .text(width / 2, height * 0.84, t('results.to_hub'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#2DE2E6',
        backgroundColor: '#121820',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    hub.on('pointerdown', () => {
      void goNext(() => this.scene.start('HubScene'));
    });
  }
}
