import Phaser from 'phaser';
import { t, getLang, onLangChange, setLang } from '../i18n';
import { audioService } from '../audio/AudioService';
import { mountPagerChrome, pagerButton, UI } from '../ui/PagerChrome';

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

    this.add
      .text(cx, top + 8, t('settings.language'), {
        fontFamily: UI.font,
        fontSize: '11px',
        color: UI.hex.muted,
      })
      .setOrigin(0.5, 0)
      .setDepth(8);

    pagerButton(this, cx - 70, top + 42, t('settings.lang_ru'), {
      fill: lang === 'ru' ? UI.hex.cyan : '#152028',
      color: lang === 'ru' ? UI.hex.bg : UI.hex.cyan,
      fontSize: '13px',
      onClick: () => {
        setLang('ru');
        this.registry.set('lang', 'ru');
      },
    });
    pagerButton(this, cx + 70, top + 42, t('settings.lang_en'), {
      fill: lang === 'en' ? UI.hex.cyan : '#152028',
      color: lang === 'en' ? UI.hex.bg : UI.hex.cyan,
      fontSize: '13px',
      onClick: () => {
        setLang('en');
        this.registry.set('lang', 'en');
      },
    });

    pagerButton(
      this,
      cx,
      top + 90,
      `${t('settings.mute')}: ${this.userMuted ? t('common.on') : t('common.off')}`,
      {
        fill: '#121820',
        color: UI.hex.text,
        fontSize: '13px',
        onClick: () => {
          this.userMuted = !this.userMuted;
          audioService.setUserMuted(this.userMuted);
          this.draw();
        },
      },
    );

    this.add
      .text(cx, top + 130, t('settings.cloud_save_reason'), {
        fontFamily: UI.font,
        fontSize: '10px',
        color: UI.hex.muted,
        align: 'center',
        wordWrap: { width: layout.content.w - 20 },
      })
      .setOrigin(0.5, 0)
      .setDepth(8);

    pagerButton(this, cx, top + 175, t('settings.cloud_save'), {
      fill: UI.hex.cyan,
      color: UI.hex.bg,
      onClick: () => console.info('[auth] cloud save requested — open Yandex auth on explicit tap'),
    });
  }
}
