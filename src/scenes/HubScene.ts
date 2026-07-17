import Phaser from 'phaser';
import { audioService } from '../audio/AudioService';
import { markGameReady, getPlatform } from '../platform/yandex';
import { t, getLang, onLangChange } from '../i18n';
import { mountPagerChrome, pagerButton, uiText, UI } from '../ui/PagerChrome';
import { saveService } from '../save/SaveService';

/** INTEL tab — signal status / entry into the pager. */
export class HubScene extends Phaser.Scene {
  private readySent = false;
  private unsub: (() => void) | null = null;

  constructor() {
    super('HubScene');
  }

  create(): void {
    audioService.attachScene(this);
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
    const isMock = Boolean(this.registry.get('isMock'));
    const lang = getLang();
    const save = saveService.get();
    const layout = mountPagerChrome(this, {
      activeTab: 'intel',
      title: t('pager.night_assault'),
      subtitle: t('pager.tagline'),
    });

    const cx = layout.content.x;
    const top = layout.content.y - layout.content.h / 2;

    uiText(this, cx, top + 10, t('pager.signal'), {
      family: 'mono',
      size: 12,
      color: UI.hex.muted,
      originX: 0.5,
    });

    uiText(this, cx, top + 32, t('pager.signal_ok'), {
      family: 'ui',
      size: 28,
      color: UI.hex.green,
      bold: true,
      originX: 0.5,
      glow: 'green',
    });

    uiText(this, cx, top + 72, t('hub.status', { lang, sdk: isMock ? 'mock' : 'yandex' }), {
      family: 'mono',
      size: 12,
      color: UI.hex.cyan,
      originX: 0.5,
    });

    uiText(
      this,
      cx,
      top + 98,
      `${t('shop.impulses', { count: save.impulses })}  ·  ${t('shop.cassettes', { count: save.cassettes })}`,
      {
        family: 'mono',
        size: 13,
        color: UI.hex.amber,
        originX: 0.5,
      },
    );

    pagerButton(this, cx, top + 145, t('hub.open_missions'), {
      fill: UI.hex.green,
      color: UI.hex.bg,
      fontSize: '16px',
      onClick: () => this.scene.start('MissionSelectScene'),
    });

    pagerButton(this, cx, top + 195, isMock ? t('hub.cta_hum') : t('hub.cta_ready'), {
      fill: UI.hex.cyan,
      color: UI.hex.bg,
      fontSize: '13px',
      outlined: true,
      onClick: () => audioService.playHubHum(),
    });

    pagerButton(this, cx, top + 240, t('hub.mobile_play'), {
      fill: UI.hex.amber,
      color: UI.hex.bg,
      fontSize: '13px',
      outlined: true,
      onClick: () => {
        this.registry.set('forceTouchUi', true);
        const url = new URL(window.location.href);
        url.searchParams.set('mobile', '1');
        window.history.replaceState({}, '', url.toString());
        this.scene.start('MissionSelectScene');
      },
    });

    uiText(this, cx, layout.content.y + layout.content.h / 2 - 18, t('pager.footer'), {
      family: 'mono',
      size: 9,
      color: UI.hex.dim,
      originX: 0.5,
      originY: 0.5,
    });
  }
}
