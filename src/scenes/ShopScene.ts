import Phaser from 'phaser';
import { t } from '../i18n';
import { saveService } from '../save/SaveService';
import { MASKS } from '../data/masks';
import { purchaseService } from '../iap/PurchaseService';
import { mountPagerChrome, pagerButton, uiText, UI } from '../ui/PagerChrome';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
  }

  create(): void {
    this.draw();
  }

  private draw(): void {
    this.children.removeAll();
    const save = saveService.get();
    const layout = mountPagerChrome(this, {
      activeTab: 'loadout',
      title: t('shop.title'),
      subtitle: `${t('shop.impulses', { count: save.impulses })} · ${t('shop.cassettes', { count: save.cassettes })}`,
    });

    const left = layout.content.x - layout.content.w / 2;
    const top = layout.content.y - layout.content.h / 2;
    const w = layout.content.w;

    MASKS.forEach((mask, i) => {
      const y = top + 10 + i * 56;
      const owned = save.unlockedMasks.includes(mask.id) || mask.costImpulses === 0;
      const equipped = save.maskId === mask.id;

      const g = this.add.graphics().setDepth(6);
      g.fillStyle(equipped ? 0x0c1a12 : 0x0a1010, 0.6);
      g.fillRect(left + 2, y, w - 4, 50);
      g.lineStyle(1, equipped ? UI.green : UI.cyan, equipped ? 0.7 : 0.4);
      g.strokeRect(left + 2, y, w - 4, 50);

      uiText(this, left + 12, y + 14, `${t(mask.nameKey)}${equipped ? ' ★' : ''}`, {
        family: 'ui',
        size: 15,
        color: equipped ? UI.hex.green : UI.hex.text,
        bold: true,
        originY: 0.5,
        glow: equipped ? 'green' : 'none',
      });
      uiText(this, left + 12, y + 34, t(mask.descKey), {
        family: 'ui',
        size: 12,
        color: UI.hex.muted,
        originY: 0.5,
        wrap: w - 120,
      });

      if (owned) {
        pagerButton(this, left + w - 52, y + 25, equipped ? t('shop.owned') : t('shop.equip'), {
          fill: equipped ? UI.hex.green : UI.hex.cyan,
          color: UI.hex.bg,
          fontSize: '12px',
          onClick: () => {
            saveService.equipMask(mask.id);
            this.draw();
          },
        });
      } else {
        pagerButton(this, left + w - 56, y + 25, `${t('shop.buy')} ${mask.costImpulses}`, {
          fill: save.impulses >= mask.costImpulses ? UI.hex.magenta : '#333',
          color: UI.hex.bg,
          fontSize: '11px',
          onClick: () => {
            if (saveService.buyMask(mask.id, mask.costImpulses)) this.draw();
          },
        });
      }
    });

    const by = top + 10 + MASKS.length * 56 + 14;
    pagerButton(this, layout.content.x, by, t('shop.remove_ads'), {
      fill: save.removeAds ? UI.hex.green : UI.hex.muted,
      color: UI.hex.bg,
      fontSize: '12px',
      outlined: !save.removeAds,
      onClick: () => {
        void (async () => {
          if (save.removeAds) return;
          await purchaseService.purchase('remove_ads');
          this.draw();
        })();
      },
    });
    pagerButton(this, layout.content.x, by + 40, t('shop.pack_cassettes'), {
      fill: UI.hex.amber,
      color: UI.hex.bg,
      fontSize: '12px',
      outlined: true,
      onClick: () => {
        void (async () => {
          await purchaseService.purchase('cassettes_small');
          this.draw();
        })();
      },
    });
  }
}
