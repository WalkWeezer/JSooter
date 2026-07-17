import Phaser from 'phaser';
import { t } from '../i18n';
import { getMission } from '../data/missionIndex';
import type { MissionDef } from '../game/types';
import { mountPagerChrome, pagerButton, pagerPanel, missionCode, districtLabel, UI } from '../ui/PagerChrome';

export class BriefingScene extends Phaser.Scene {
  private missionId = 'tut_01';

  constructor() {
    super('BriefingScene');
  }

  init(data: { missionId?: string }): void {
    this.missionId = data?.missionId || 'tut_01';
  }

  create(): void {
    const mission = getMission(this.missionId) as MissionDef;
    const layout = mountPagerChrome(this, {
      activeTab: 'missions',
      title: t('pager.contract'),
      subtitle: `${missionCode(this.missionId)} · ${districtLabel(this.missionId)}`,
    });

    const cx = layout.content.x;
    const top = layout.content.y - layout.content.h / 2;
    const w = layout.content.w;

    pagerPanel(this, cx, top + 48, w - 4, 70, 6);

    const bodyKey = `briefing.${this.missionId}_body`;
    const body = t(bodyKey);
    this.add
      .text(cx, top + 48, body === bodyKey ? t('briefing.default_body') : body, {
        fontFamily: UI.font,
        fontSize: '12px',
        color: UI.hex.text,
        align: 'center',
        wordWrap: { width: w - 24 },
      })
      .setOrigin(0.5)
      .setDepth(8);

    const objectiveKey = `briefing.objective_${mission.objective}`;
    this.add
      .text(cx, top + 100, t(objectiveKey), {
        fontFamily: UI.font,
        fontSize: '13px',
        color: UI.hex.green,
      })
      .setOrigin(0.5)
      .setDepth(8);

    this.add
      .text(cx, top + 122, t('briefing.s_hint', { sec: mission.sRankRules.maxTimeSec }), {
        fontFamily: UI.font,
        fontSize: '10px',
        color: UI.hex.muted,
      })
      .setOrigin(0.5)
      .setDepth(8);

    pagerButton(this, cx, top + 165, t('briefing.start'), {
      fill: UI.hex.cyan,
      color: UI.hex.bg,
      fontSize: '15px',
      onClick: () => {
        this.registry.set('runDeaths', 0);
        this.scene.start('MissionScene', { missionId: this.missionId });
      },
    });

    pagerButton(this, cx, top + 205, t('common.back'), {
      fill: '#121820',
      color: UI.hex.muted,
      fontSize: '12px',
      onClick: () => this.scene.start('MissionSelectScene'),
    });
  }
}
