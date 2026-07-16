import Phaser from 'phaser';
import { t, getLang, onLangChange, setLang } from '../i18n';

export class SettingsScene extends Phaser.Scene {
  private unsub: (() => void) | null = null;

  constructor() {
    super('SettingsScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0B0D12');
    this.draw();
    this.unsub = onLangChange(() => this.draw());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsub?.();
      this.unsub = null;
    });
  }

  private draw(): void {
    this.children.removeAll();
    const { width, height } = this.scale;
    const pad = Number(this.registry.get('stickyPaddingPx') || 90);
    const lang = getLang();

    this.add
      .text(width / 2, pad + 40, t('settings.title'), {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#2DE2E6',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, pad + 90, t('settings.language'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#9aa3b5',
      })
      .setOrigin(0.5);

    this.makeLangButton(width / 2 - 90, pad + 140, 'ru', t('settings.lang_ru'), lang === 'ru');
    this.makeLangButton(width / 2 + 90, pad + 140, 'en', t('settings.lang_en'), lang === 'en');

    this.add
      .text(width / 2, pad + 220, t('settings.cloud_save_reason'), {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#6b7385',
        align: 'center',
        wordWrap: { width: Math.min(420, width - 40) },
      })
      .setOrigin(0.5);

    const cloud = this.add
      .text(width / 2, pad + 290, t('settings.cloud_save'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#0B0D12',
        backgroundColor: '#2DE2E6',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    cloud.on('pointerdown', () => {
      console.info('[auth] cloud save requested — open Yandex auth on explicit tap');
    });

    const back = this.add
      .text(width / 2, height - pad - 40, t('common.back'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#39FF14',
        backgroundColor: '#152018',
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    back.on('pointerdown', () => this.scene.start('HubScene'));
  }

  private makeLangButton(x: number, y: number, code: 'ru' | 'en', label: string, active: boolean): void {
    const btn = this.add
      .text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: active ? '#0B0D12' : '#2DE2E6',
        backgroundColor: active ? '#2DE2E6' : '#152028',
        padding: { x: 14, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      setLang(code);
      this.registry.set('lang', code);
    });
  }
}
