import Phaser from 'phaser';
import { t } from '../i18n';
import { getMission } from '../data/missionIndex';
import type { MissionDef } from '../game/types';
import {
  mountPagerChrome,
  pagerButton,
  pagerPanel,
  missionCode,
  missionTitle,
  districtLabel,
  uiText,
  UI,
} from '../ui/PagerChrome';

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

    uiText(this, cx, top + 6, missionTitle(this.missionId), {
      family: 'ui',
      size: 18,
      color: UI.hex.text,
      bold: true,
      originX: 0.5,
      glow: 'cyan',
    });

    pagerPanel(this, cx, top + 68, w - 4, 78, 6);

    const bodyKey = `briefing.${this.missionId}_body`;
    const body = t(bodyKey);
    uiText(this, cx, top + 68, body === bodyKey ? t('briefing.default_body') : body, {
      family: 'ui',
      size: 14,
      color: UI.hex.text,
      originX: 0.5,
      originY: 0.5,
      align: 'center',
      wrap: w - 28,
    });

    const objectiveKey = `briefing.objective_${mission.objective}`;
    uiText(this, cx, top + 122, t(objectiveKey), {
      family: 'ui',
      size: 15,
      color: UI.hex.green,
      bold: true,
      originX: 0.5,
      glow: 'green',
    });

    uiText(this, cx, top + 148, t('briefing.s_hint', { sec: mission.sRankRules.maxTimeSec }), {
      family: 'mono',
      size: 12,
      color: UI.hex.muted,
      originX: 0.5,
    });

    pagerButton(this, cx, top + 195, t('briefing.start'), {
      fill: UI.hex.cyan,
      color: UI.hex.bg,
      fontSize: '16px',
      onClick: () => {
        this.registry.set('runDeaths', 0);
        this.scene.start('MissionScene', { missionId: this.missionId });
      },
    });

    pagerButton(this, cx, top + 240, t('common.back'), {
      fill: UI.hex.muted,
      color: UI.hex.bg,
      fontSize: '13px',
      outlined: true,
      onClick: () => this.scene.start('MissionSelectScene'),
    });
  }
}
