import Phaser from 'phaser';
import { t } from '../i18n';
import { gameplayStart, gameplayStop } from '../platform/yandex';
import { UI, pagerButton } from '../ui/PagerChrome';

export class PauseOverlay extends Phaser.Scene {
  constructor() {
    super('PauseOverlay');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, UI.bg, 0.78).setScrollFactor(0).setDepth(0);

    // Mini pager panel
    const pw = Math.min(320, width * 0.8);
    const ph = 260;
    const g = this.add.graphics().setDepth(1).setScrollFactor(0);
    g.fillStyle(0x050806, 0.95);
    g.fillRoundedRect(width / 2 - pw / 2, height / 2 - ph / 2, pw, ph, 10);
    g.lineStyle(1, UI.green, 0.7);
    g.strokeRoundedRect(width / 2 - pw / 2, height / 2 - ph / 2, pw, ph, 10);

    this.add
      .text(width / 2, height / 2 - 90, 'NEONTRON', {
        fontFamily: UI.font,
        fontSize: '14px',
        color: UI.hex.cyan,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2);

    this.add
      .text(width / 2, height / 2 - 65, t('mission.pause'), {
        fontFamily: UI.font,
        fontSize: '22px',
        color: UI.hex.green,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2);

    pagerButton(this, width / 2, height / 2 - 15, t('mission.resume'), {
      fill: UI.hex.green,
      color: UI.hex.bg,
      depth: 3,
      onClick: () => {
        this.scene.resume('MissionScene');
        gameplayStart();
        this.scene.stop();
      },
    }).setScrollFactor(0);

    pagerButton(this, width / 2, height / 2 + 30, t('mission.restart'), {
      fill: '#1a1520',
      color: UI.hex.amber,
      depth: 3,
      onClick: () => {
        const missionId = String(this.registry.get('currentMissionId') || 'tut_01');
        this.registry.set('runDeaths', 0);
        gameplayStop();
        this.scene.stop('MissionScene');
        this.scene.start('MissionScene', { missionId });
        this.scene.stop();
      },
    }).setScrollFactor(0);

    pagerButton(this, width / 2, height / 2 + 75, t('results.to_hub'), {
      fill: '#121820',
      color: UI.hex.muted,
      fontSize: '13px',
      depth: 3,
      onClick: () => {
        gameplayStop();
        this.scene.stop('MissionScene');
        this.scene.start('HubScene');
        this.scene.stop();
      },
    }).setScrollFactor(0);
  }
}
