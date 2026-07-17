import Phaser from 'phaser';
import { t, getLang, onLangChange, setLang } from '../i18n';
import { audioService } from '../audio/AudioService';
import { mountPagerChrome, pagerButton, uiText, UI } from '../ui/PagerChrome';

export class SettingsScene extends Phaser.Scene {
  private unsub: (() => void) | null = null;
  private userMuted = false;

  constructor() {
    super('SettingsScene');
  }

  create(): void {
    this.draw();
    this.unsub = onLangChange(() => this.draw());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsub?.();
      this.unsub = null;
    });
  }

  private draw(): void {
    this.children.removeAll();
    const lang = getLang();
    const layout = mountPagerChrome(this, {
      activeTab: 'system',
      title: t('settings.title'),
      subtitle: t('pager.footer'),
    });

    const cx = layout.content.x;
    const top = layout.content.y - layout.content.h / 2;

    uiText(this, cx, top + 10, t('settings.language'), {
      family: 'mono',
      size: 13,
      color: UI.hex.muted,
      originX: 0.5,
    });

    pagerButton(this, cx - 78, top + 48, t('settings.lang_ru'), {
      fill: lang === 'ru' ? UI.hex.cyan : UI.hex.muted,
      color: UI.hex.bg,
      fontSize: '14px',
      outlined: lang !== 'ru',
      onClick: () => {
        setLang('ru');
        this.registry.set('lang', 'ru');
      },
    });
    pagerButton(this, cx + 78, top + 48, t('settings.lang_en'), {
      fill: lang === 'en' ? UI.hex.cyan : UI.hex.muted,
      color: UI.hex.bg,
      fontSize: '14px',
      outlined: lang !== 'en',
      onClick: () => {
        setLang('en');
        this.registry.set('lang', 'en');
      },
    });

    pagerButton(
      this,
      cx,
      top + 105,
      `${t('settings.mute')}: ${this.userMuted ? t('common.on') : t('common.off')}`,
      {
        fill: UI.hex.green,
        color: UI.hex.bg,
        fontSize: '14px',
        outlined: true,
        onClick: () => {
          this.userMuted = !this.userMuted;
          audioService.setUserMuted(this.userMuted);
          this.draw();
        },
      },
    );

    uiText(this, cx, top + 150, t('settings.cloud_save_reason'), {
      family: 'ui',
      size: 13,
      color: UI.hex.muted,
      originX: 0.5,
      align: 'center',
      wrap: layout.content.w - 24,
    });

    pagerButton(this, cx, top + 210, t('settings.cloud_save'), {
      fill: UI.hex.cyan,
      color: UI.hex.bg,
      fontSize: '15px',
      onClick: () => console.info('[auth] cloud save requested — open Yandex auth on explicit tap'),
    });
  }
}
