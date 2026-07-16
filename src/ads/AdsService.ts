import { getPlatform } from '../platform/yandex';
import { saveService } from '../save/SaveService';
import { audioService } from '../audio/AudioService';

type AdvCallbacks = {
  onOpen?: () => void;
  onClose?: (wasShown: boolean) => void;
  onError?: (error: unknown) => void;
  onRewarded?: () => void;
};

/**
 * Yandex-compliant ads helper.
 * Interstitial only from logical pauses; rewarded only on explicit user action.
 */
export class AdsService {
  private stickyVisible = false;

  canShowInterstitial(): boolean {
    return !saveService.get().removeAds;
  }

  showInterstitial(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.canShowInterstitial()) {
        resolve(false);
        return;
      }
      const { sdk } = getPlatform();
      audioService.setSystemMuted(true);
      audioService.stopAll();

      const callbacks: AdvCallbacks = {
        onOpen: () => console.info('[ads] interstitial open'),
        onClose: (wasShown) => {
          audioService.setSystemMuted(document.hidden);
          console.info('[ads] interstitial close', wasShown);
          resolve(Boolean(wasShown));
        },
        onError: (error) => {
          audioService.setSystemMuted(document.hidden);
          console.warn('[ads] interstitial error', error);
          resolve(false);
        },
      };

      try {
        sdk.adv?.showFullscreenAdv?.({ callbacks });
      } catch (error) {
        callbacks.onError?.(error);
      }
    });
  }

  showRewarded(): Promise<boolean> {
    return new Promise((resolve) => {
      const { sdk } = getPlatform();
      let rewarded = false;
      audioService.setSystemMuted(true);
      audioService.stopAll();

      const callbacks: AdvCallbacks = {
        onOpen: () => console.info('[ads] rewarded open'),
        onRewarded: () => {
          rewarded = true;
          console.info('[ads] rewarded granted');
        },
        onClose: () => {
          audioService.setSystemMuted(document.hidden);
          resolve(rewarded);
        },
        onError: (error) => {
          audioService.setSystemMuted(document.hidden);
          console.warn('[ads] rewarded error', error);
          resolve(false);
        },
      };

      try {
        sdk.adv?.showRewardedVideo?.({ callbacks });
      } catch (error) {
        callbacks.onError?.(error);
      }
    });
  }

  async showSticky(): Promise<void> {
    const { sdk } = getPlatform();
    try {
      await sdk.adv?.showBannerAdv?.();
      this.stickyVisible = true;
    } catch {
      this.stickyVisible = false;
    }
  }

  async hideSticky(): Promise<void> {
    const { sdk } = getPlatform();
    try {
      await sdk.adv?.hideBannerAdv?.();
      this.stickyVisible = false;
    } catch {
      // ignore
    }
    void this.stickyVisible;
  }
}

export const adsService = new AdsService();
