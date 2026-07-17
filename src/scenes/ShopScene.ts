import Phaser from 'phaser';
import { t } from '../i18n';
import { saveService } from '../save/SaveService';
import { MASKS } from '../data/masks';
import { purchaseService } from '../iap/PurchaseService';
import { mountPagerChrome, pagerButton, UI } from '../ui/PagerChrome';

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
      const y = top + 14 + i * 52;
      const owned = save.unlockedMasks.includes(mask.id) || mask.costImpulses === 0;
      const equipped = save.maskId === mask.id;

      const g = this.add.graphics().setDepth(6);
      g.lineStyle(1, equipped ? UI.green : UI.cyan, 0.45);
      g.strokeRect(left + 2, y, w - 4, 46);

      this.add
        .text(left + 10, y + 12, `${t(mask.nameKey)}${equipped ? ' ★' : ''}`, {
          fontFamily: UI.font,
          fontSize: '12px',
          color: UI.hex.text,
        })
        .setOrigin(0, 0.5)
        .setDepth(7);
      this.add
        .text(left + 10, y + 30, t(mask.descKey), {
          fontFamily: UI.font,
          fontSize: '9px',
          color: UI.hex.muted,
          wordWrap: { width: w - 110 },
        })
        .setOrigin(0, 0.5)
        .setDepth(7);

      if (owned) {
        pagerButton(this, left + w - 48, y + 23, equipped ? t('shop.owned') : t('shop.equip'), {
          fill: equipped ? UI.hex.green : UI.hex.cyan,
          color: UI.hex.bg,
          fontSize: '11px',
          onClick: () => {
            saveService.equipMask(mask.id);
            this.draw();
          },
        });
      } else {
        pagerButton(this, left + w - 52, y + 23, `${t('shop.buy')} ${mask.costImpulses}`, {
          fill: save.impulses >= mask.costImpulses ? UI.hex.magenta : '#333',
          color: UI.hex.bg,
          fontSize: '10px',
          onClick: () => {
            if (saveService.buyMask(mask.id, mask.costImpulses)) this.draw();
          },
        });
      }
    });

    const by = top + 14 + MASKS.length * 52 + 16;
    pagerButton(this, layout.content.x, by, t('shop.remove_ads'), {
      fill: save.removeAds ? '#152018' : '#121820',
      color: save.removeAds ? UI.hex.green : UI.hex.text,
      fontSize: '11px',
      onClick: () => {
        void (async () => {
          if (save.removeAds) return;
          await purchaseService.purchase('remove_ads');
          this.draw();
        })();
      },
    });
    pagerButton(this, layout.content.x, by + 36, t('shop.pack_cassettes'), {
      fill: '#121820',
      color: UI.hex.amber,
      fontSize: '11px',
      onClick: () => {
        void (async () => {
          await purchaseService.purchase('cassettes_small');
          this.draw();
        })();
      },
    });
  }
}
