import Phaser from 'phaser';
import { audioService } from '../audio/AudioService';
import { markGameReady, getPlatform } from '../platform/yandex';
import { t, getLang, onLangChange } from '../i18n';
import { mountPagerChrome, pagerButton, UI } from '../ui/PagerChrome';
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
    const w = layout.content.w;

    this.add
      .text(cx, top + 8, t('pager.signal'), {
        fontFamily: UI.font,
        fontSize: '11px',
        color: UI.hex.muted,
      })
      .setOrigin(0.5, 0)
      .setDepth(8);

    this.add
      .text(cx, top + 28, t('pager.signal_ok'), {
        fontFamily: UI.font,
        fontSize: '22px',
        color: UI.hex.green,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setDepth(8);

    this.add
      .text(
        cx,
        top + 62,
        t('hub.status', { lang, sdk: isMock ? 'mock' : 'yandex' }),
        { fontFamily: UI.font, fontSize: '11px', color: UI.hex.cyan },
      )
      .setOrigin(0.5, 0)
      .setDepth(8);

    this.add
      .text(
        cx,
        top + 88,
        `${t('shop.impulses', { count: save.impulses })}  ·  ${t('shop.cassettes', { count: save.cassettes })}`,
        { fontFamily: UI.font, fontSize: '12px', color: UI.hex.amber },
      )
      .setOrigin(0.5, 0)
      .setDepth(8);

    pagerButton(this, cx, top + 130, t('hub.open_missions'), {
      fill: UI.hex.green,
      color: UI.hex.bg,
      onClick: () => this.scene.start('MissionSelectScene'),
    });

    pagerButton(this, cx, top + 175, isMock ? t('hub.cta_hum') : t('hub.cta_ready'), {
      fill: '#152018',
      color: UI.hex.green,
      fontSize: '12px',
      onClick: () => audioService.playHubHum(),
    });

    pagerButton(this, cx, top + 215, t('hub.mobile_play'), {
      fill: '#1a1520',
      color: UI.hex.amber,
      fontSize: '12px',
      onClick: () => {
        this.registry.set('forceTouchUi', true);
        const url = new URL(window.location.href);
        url.searchParams.set('mobile', '1');
        window.history.replaceState({}, '', url.toString());
        this.scene.start('MissionSelectScene');
      },
    });

    this.add
      .text(cx, layout.content.y + layout.content.h / 2 - 18, t('pager.footer'), {
        fontFamily: UI.font,
        fontSize: '8px',
        color: UI.hex.dim,
      })
      .setOrigin(0.5)
      .setDepth(8);

    void w;
  }
}
