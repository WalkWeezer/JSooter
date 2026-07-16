import Phaser from 'phaser';
import { getPlatform } from '../platform/yandex';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    const { lang, isMock, stickyPaddingPx } = getPlatform();
    this.registry.set('lang', lang);
    this.registry.set('isMock', isMock);
    this.registry.set('stickyPaddingPx', stickyPaddingPx);

    this.cameras.main.setBackgroundColor('#0B0D12');
    this.scene.start('PreloadScene');
  }
}
