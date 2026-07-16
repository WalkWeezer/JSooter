import Phaser from 'phaser';
import { audioService } from '../audio/AudioService';
import { markGameReady, getPlatform } from '../platform/yandex';

export class HubScene extends Phaser.Scene {
  private readySent = false;

  constructor() {
    super('HubScene');
  }

  create(): void {
    const { width, height } = this.scale;
    const pad = Number(this.registry.get('stickyPaddingPx') || 90);
    const isMock = Boolean(this.registry.get('isMock'));
    const lang = String(this.registry.get('lang') || 'ru');

    this.cameras.main.setBackgroundColor('#0B0D12');

    // Safe area guides for sticky banner.
    this.add.rectangle(width / 2, pad / 2, width, pad, 0x11151f, 0.9);
    this.add
      .text(width / 2, pad / 2, 'sticky-safe-area', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#5a6478',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.28, 'NEONTRON', {
        fontFamily: 'monospace',
        fontSize: Math.min(48, width * 0.1) + 'px',
        color: '#2DE2E6',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.36, 'NIGHT ASSAULT', {
        fontFamily: 'monospace',
        fontSize: Math.min(22, width * 0.05) + 'px',
        color: '#FF2A6D',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.46, `lang: ${lang} | sdk: ${isMock ? 'mock' : 'yandex'}`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#9aa3b5',
      })
      .setOrigin(0.5);

    const cta = this.add
      .text(width / 2, height * 0.58, isMock ? 'TAP TO START HUM' : 'READY', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#39FF14',
        backgroundColor: '#152018',
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    cta.on('pointerdown', () => {
      audioService.playHubHum();
    });

    this.add
      .text(
        width / 2,
        height * 0.72,
        'Phase 1 skeleton\nHide tab to mute audio\nMissions come in Phase 3',
        {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#6b7385',
          align: 'center',
        },
      )
      .setOrigin(0.5);

    // Bottom safe padding mirror.
    this.add.rectangle(width / 2, height - pad / 2, width, pad, 0x11151f, 0.55);

    this.scale.on('resize', this.onResize, this);

    if (!this.readySent) {
      this.readySent = true;
      markGameReady();
      console.info('[hub] marked LoadingAPI.ready — player can interact');
      console.info(`[hub] stickyPaddingPx=${getPlatform().stickyPaddingPx}`);
    }
  }

  private onResize(gameSize: Phaser.Structs.Size): void {
    this.cameras.resize(gameSize.width, gameSize.height);
  }
}
