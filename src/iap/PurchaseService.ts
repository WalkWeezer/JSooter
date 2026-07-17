import { getPlatform } from '../platform/yandex';
import { saveService } from '../save/SaveService';

export type ProductId = 'remove_ads' | 'cassettes_small';

const PRODUCT_META: Record<ProductId, { cassettes?: number; removeAds?: boolean }> = {
  remove_ads: { removeAds: true },
  cassettes_small: { cassettes: 5 },
};

/**
 * Payments via Yandex SDK only. Consume is mandatory after purchase.
 * In mock mode, grants products locally for QA.
 */
export class PurchaseService {
  async purchase(productId: ProductId): Promise<boolean> {
    const { sdk, isMock } = getPlatform();

    if (isMock || !(sdk as { getPayments?: unknown }).getPayments) {
      console.info('[iap] mock purchase', productId);
      this.grant(productId);
      return true;
    }

    try {
      // Official API shape kept loose for Phase 6 shell.
      const payments = await (sdk as { getPayments: (o?: unknown) => Promise<{ purchase: (o: { id: string }) => Promise<{ purchaseToken: string }>; consumePurchase: (token: string) => Promise<void> }> }).getPayments({ signed: true });
      const purchase = await payments.purchase({ id: productId });
      await payments.consumePurchase(purchase.purchaseToken);
      this.grant(productId);
      return true;
    } catch (error) {
      console.warn('[iap] purchase failed', error);
      return false;
    }
  }

  private grant(productId: ProductId): void {
    const meta = PRODUCT_META[productId];
    if (meta.removeAds) saveService.setRemoveAds(true);
    if (meta.cassettes) saveService.addCassettes(meta.cassettes);
  }
}

export const purchaseService = new PurchaseService();
