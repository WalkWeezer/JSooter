import Phaser from 'phaser';
import { t } from '../i18n';
import type { MissionResultPayload } from './MissionScene';
import { saveService } from '../save/SaveService';
import { getNextMissionId } from '../data/missionIndex';
import { adsService } from '../ads/AdsService';
import { mountPagerChrome, pagerButton, missionCode, UI } from '../ui/PagerChrome';

export class ResultsScene extends Phaser.Scene {
  private payload!: MissionResultPayload;

  constructor() {
    super('ResultsScene');
  }

  init(data: MissionResultPayload): void {
    this.payload = data;
  }

  async create(): Promise<void> {
    const p = this.payload;
    const nextId = getNextMissionId(p.missionId);
    saveService.markCleared(p.missionId, p.rank, p.timeSec, p.deaths, nextId);
    await adsService.showSticky();

    const layout = mountPagerChrome(this, {
      activeTab: 'missions',
      title: t('pager.rank_log'),
      subtitle: missionCode(p.missionId),
    });

    const cx = layout.content.x;
    const top = layout.content.y - layout.content.h / 2;

    this.add
      .text(cx, top + 20, t('results.rank', { rank: p.rank }), {
        fontFamily: UI.font,
        fontSize: '36px',
        color: p.rank.startsWith('S') ? UI.hex.green : UI.hex.magenta,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setDepth(8);

    this.add
      .text(
        cx,
        top + 70,
        `${t('results.deaths', { count: p.deaths })}\n${t('results.time', { time: p.timeSec.toFixed(1) + 's' })}\n${p.alarm ? t('mission.alarm') : t('pager.signal_ok')}\n${t('shop.impulses', { count: saveService.get().impulses })}`,
        {
          fontFamily: UI.font,
          fontSize: '12px',
          color: UI.hex.text,
          align: 'center',
        },
      )
      .setOrigin(0.5, 0)
      .setDepth(8);

    const goNext = async (target: () => void) => {
      await adsService.showInterstitial();
      target();
    };

    let y = top + 145;
    pagerButton(this, cx, y, t('ads.reward_x2'), {
      fill: UI.hex.amber,
      color: UI.hex.bg,
      fontSize: '12px',
      onClick: () => {
        void (async () => {
          const ok = await adsService.showRewarded();
          if (ok) saveService.addImpulses(10);
        })();
      },
    });
    y += 40;

    if (nextId) {
      pagerButton(this, cx, y, t('results.next'), {
        fill: UI.hex.cyan,
        color: UI.hex.bg,
        onClick: () => {
          void goNext(() => this.scene.start('BriefingScene', { missionId: nextId }));
        },
      });
      y += 40;
    }

    pagerButton(this, cx, y, t('mission.retry'), {
      fill: UI.hex.magenta,
      color: UI.hex.bg,
      fontSize: '13px',
      onClick: () => {
        void goNext(() => {
          this.registry.set('runDeaths', 0);
          this.scene.start('BriefingScene', { missionId: p.missionId });
        });
      },
    });
    y += 38;

    pagerButton(this, cx, y, t('results.to_hub'), {
      fill: '#121820',
      color: UI.hex.cyan,
      fontSize: '12px',
      onClick: () => {
        void goNext(() => this.scene.start('HubScene'));
      },
    });
  }
}
