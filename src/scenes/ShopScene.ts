import Phaser from 'phaser';
import { t } from '../i18n';
import { saveService } from '../save/SaveService';
import { MASKS, getMask } from '../data/masks';
import { purchaseService } from '../iap/PurchaseService';
import { adsService } from '../ads/AdsService';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0B0D12');
    this.draw();
  }

  private draw(): void {
    this.children.removeAll();
    const { width, height } = this.scale;
    const pad = Number(this.registry.get('stickyPaddingPx') || 90);
    const save = saveService.get();

    this.add
      .text(width / 2, pad + 28, t('shop.title'), {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#2DE2E6',
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        pad + 64,
        `${t('shop.impulses', { count: save.impulses })}   ${t('shop.cassettes', { count: save.cassettes })}`,
        { fontFamily: 'monospace', fontSize: '14px', color: '#9aa3b5' },
      )
      .setOrigin(0.5);

    MASKS.forEach((mask, i) => {
      const y = pad + 110 + i * 78;
      const owned = save.unlockedMasks.includes(mask.id) || mask.costImpulses === 0;
      const equipped = save.maskId === mask.id;
      const title = `${t(mask.nameKey)}${equipped ? ' ★' : ''}`;
      this.add
        .text(40, y, title, { fontFamily: 'monospace', fontSize: '16px', color: '#cfd6e6' })
        .setOrigin(0, 0.5);
      this.add
        .text(40, y + 22, t(mask.descKey), {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#6b7385',
          wordWrap: { width: width - 200 },
        })
        .setOrigin(0, 0.5);

      if (owned) {
        const eq = this.add
          .text(width - 40, y, equipped ? t('shop.owned') : t('shop.equip'), {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#0B0D12',
            backgroundColor: equipped ? '#39FF14' : '#2DE2E6',
            padding: { x: 10, y: 6 },
          })
          .setOrigin(1, 0.5)
          .setInteractive({ useHandCursor: true });
        eq.on('pointerdown', () => {
          saveService.equipMask(mask.id);
          this.draw();
        });
      } else {
        const buy = this.add
          .text(width - 40, y, `${t('shop.buy')} (${mask.costImpulses})`, {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#0B0D12',
            backgroundColor: save.impulses >= mask.costImpulses ? '#FF2A6D' : '#333',
            padding: { x: 10, y: 6 },
          })
          .setOrigin(1, 0.5)
          .setInteractive({ useHandCursor: true });
        buy.on('pointerdown', () => {
          if (saveService.buyMask(mask.id, mask.costImpulses)) this.draw();
        });
      }
    });

    this.add
      .text(width / 2, height - pad - 110, t('shop.remove_ads'), {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: save.removeAds ? '#39FF14' : '#cfd6e6',
        backgroundColor: '#121820',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', async () => {
        if (save.removeAds) return;
        await purchaseService.purchase('remove_ads');
        this.draw();
      });

    const pack = this.add
      .text(width / 2, height - pad - 70, t('shop.pack_cassettes'), {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#cfd6e6',
        backgroundColor: '#121820',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    pack.on('pointerdown', async () => {
      await purchaseService.purchase('cassettes_small');
      this.draw();
    });

    const back = this.add
      .text(width / 2, height - pad - 28, t('common.back'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#9aa3b5',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('HubScene'));

    void getMask;
    void adsService;
  }
}
