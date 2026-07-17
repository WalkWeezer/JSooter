import Phaser from 'phaser';
import { audioService } from '../audio/AudioService';
import { markGameReady, getPlatform } from '../platform/yandex';
import { t, getLang, onLangChange } from '../i18n';

export class HubScene extends Phaser.Scene {
  private readySent = false;
  private unsub: (() => void) | null = null;

  constructor() {
    super('HubScene');
  }

  create(): void {
    audioService.attachScene(this);
    this.cameras.main.setBackgroundColor('#0B0D12');
    this.draw();
    this.unsub = onLangChange(() => this.draw());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsub?.();
      this.unsub = null;
    });

    if (!this.readySent) {
      this.readySent = true;
      markGameReady();
      console.info('[hub] marked LoadingAPI.ready — player can interact');
      console.info(`[hub] stickyPaddingPx=${getPlatform().stickyPaddingPx}`);
    }

    audioService.playHubHum();
  }

  private draw(): void {
    this.children.removeAll();
    const { width, height } = this.scale;
    const pad = Number(this.registry.get('stickyPaddingPx') || 90);
    const isMock = Boolean(this.registry.get('isMock'));
    const lang = getLang();

    if (this.textures.exists('hub_bg')) {
      this.add
        .image(width / 2, height / 2, 'hub_bg')
        .setDisplaySize(width, height)
        .setAlpha(0.9)
        .setDepth(0);
    }
    this.add.rectangle(width / 2, height / 2, width, height, 0x0b0d12, 0.45).setDepth(1);

    this.add.rectangle(width / 2, pad / 2, width, pad, 0x11151f, 0.9).setDepth(2);
    this.add
      .text(width / 2, pad / 2, t('hub.sticky_label'), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#5a6478',
      })
      .setOrigin(0.5)
      .setDepth(3);

    if (this.textures.exists('prop_sign')) {
      this.add
        .image(width / 2, height * 0.18, 'prop_sign')
        .setDisplaySize(Math.min(420, width * 0.7), 56)
        .setDepth(3);
    }

    this.add
      .text(width / 2, height * 0.28, t('hub.title'), {
        fontFamily: 'monospace',
        fontSize: Math.min(48, width * 0.1) + 'px',
        color: '#2DE2E6',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.add
      .text(width / 2, height * 0.36, t('hub.subtitle'), {
        fontFamily: 'monospace',
        fontSize: Math.min(22, width * 0.05) + 'px',
        color: '#FF2A6D',
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.add
      .text(
        width / 2,
        height * 0.42,
        t('hub.status', { lang, sdk: isMock ? 'mock' : 'yandex' }),
        {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#9aa3b5',
        },
      )
      .setOrigin(0.5)
      .setDepth(3);

    const cta = this.add
      .text(width / 2, height * 0.52, isMock ? t('hub.cta_hum') : t('hub.cta_ready'), {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#39FF14',
        backgroundColor: '#152018',
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(3)
      .setInteractive({ useHandCursor: true });

    cta.on('pointerdown', () => {
      audioService.playHubHum();
    });

    const settings = this.add
      .text(width / 2, height * 0.62, t('hub.open_settings'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#2DE2E6',
        backgroundColor: '#121820',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(3)
      .setInteractive({ useHandCursor: true });

    settings.on('pointerdown', () => this.scene.start('SettingsScene'));

    const missions = this.add
      .text(width / 2, height * 0.68, t('hub.open_missions'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#0B0D12',
        backgroundColor: '#FF2A6D',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(3)
      .setInteractive({ useHandCursor: true });

    missions.on('pointerdown', () => {
      this.scene.start('MissionSelectScene');
    });

    const mobile = this.add
      .text(width / 2, height * 0.735, t('hub.mobile_play'), {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#FFC857',
        backgroundColor: '#1a1520',
        padding: { x: 12, y: 7 },
      })
      .setOrigin(0.5)
      .setDepth(3)
      .setInteractive({ useHandCursor: true });
    mobile.on('pointerdown', () => {
      this.registry.set('forceTouchUi', true);
      const url = new URL(window.location.href);
      url.searchParams.set('mobile', '1');
      window.history.replaceState({}, '', url.toString());
      this.scene.start('MissionSelectScene');
    });

    const shop = this.add
      .text(width / 2, height * 0.81, t('shop.title'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#2DE2E6',
        backgroundColor: '#121820',
        padding: { x: 12, y: 7 },
      })
      .setOrigin(0.5)
      .setDepth(3)
      .setInteractive({ useHandCursor: true });
    shop.on('pointerdown', () => this.scene.start('ShopScene'));

    this.add
      .text(width / 2, height * 0.9, t('hub.phase_note'), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#6b7385',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.add.rectangle(width / 2, height - pad / 2, width, pad, 0x11151f, 0.55).setDepth(2);
  }
}
