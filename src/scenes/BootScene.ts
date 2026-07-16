import Phaser from 'phaser';
import { getPlatform } from '../platform/yandex';
import { loadI18n, t } from '../i18n';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    const { lang, isMock, stickyPaddingPx } = getPlatform();
    this.registry.set('isMock', isMock);
    this.registry.set('stickyPaddingPx', stickyPaddingPx);

    this.cameras.main.setBackgroundColor('#0B0D12');
    const label = this.add
      .text(this.scale.width / 2, this.scale.height / 2, '…', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#2DE2E6',
      })
      .setOrigin(0.5);

    void loadI18n(lang).then((resolved) => {
      this.registry.set('lang', resolved);
      label.setText(t('common.loading'));
      this.scene.start('PreloadScene');
    });
  }
}
