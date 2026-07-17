import Phaser from 'phaser';
import { t } from '../i18n';
import { gameplayStart, gameplayStop } from '../platform/yandex';
import { UI, pagerButton, uiText } from '../ui/PagerChrome';

export class PauseOverlay extends Phaser.Scene {
  constructor() {
    super('PauseOverlay');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, UI.bg, 0.78).setScrollFactor(0).setDepth(0);

    const pw = Math.min(340, width * 0.82);
    const ph = 280;
    const g = this.add.graphics().setDepth(1).setScrollFactor(0);
    g.fillStyle(0x050806, 0.96);
    g.fillRoundedRect(width / 2 - pw / 2, height / 2 - ph / 2, pw, ph, 10);
    g.lineStyle(1.5, UI.green, 0.75);
    g.strokeRoundedRect(width / 2 - pw / 2, height / 2 - ph / 2, pw, ph, 10);

    uiText(this, width / 2, height / 2 - 100, 'NEONTRON', {
      family: 'display',
      size: 16,
      color: UI.hex.cyan,
      bold: true,
      originX: 0.5,
      originY: 0.5,
      glow: 'cyan',
      depth: 2,
    }).setScrollFactor(0);

    uiText(this, width / 2, height / 2 - 70, t('mission.pause'), {
      family: 'ui',
      size: 26,
      color: UI.hex.green,
      bold: true,
      originX: 0.5,
      originY: 0.5,
      glow: 'green',
      depth: 2,
    }).setScrollFactor(0);

    pagerButton(this, width / 2, height / 2 - 15, t('mission.resume'), {
      fill: UI.hex.green,
      color: UI.hex.bg,
      depth: 3,
      fontSize: '16px',
      onClick: () => {
        this.scene.resume('MissionScene');
        gameplayStart();
        this.scene.stop();
      },
    }).setScrollFactor(0);

    pagerButton(this, width / 2, height / 2 + 35, t('mission.restart'), {
      fill: UI.hex.amber,
      color: UI.hex.bg,
      depth: 3,
      fontSize: '14px',
      outlined: true,
      onClick: () => {
        const missionId = String(this.registry.get('currentMissionId') || 'tut_01');
        this.registry.set('runDeaths', 0);
        gameplayStop();
        this.scene.stop('MissionScene');
        this.scene.start('MissionScene', { missionId });
        this.scene.stop();
      },
    }).setScrollFactor(0);

    pagerButton(this, width / 2, height / 2 + 85, t('results.to_hub'), {
      fill: UI.hex.muted,
      color: UI.hex.bg,
      fontSize: '13px',
      depth: 3,
      outlined: true,
      onClick: () => {
        gameplayStop();
        this.scene.stop('MissionScene');
        this.scene.start('HubScene');
        this.scene.stop();
      },
    }).setScrollFactor(0);
  }
}
