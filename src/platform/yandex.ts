export type LangCode = 'ru' | 'en' | string;

export type YandexSdk = {
  environment: {
    i18n: {
      lang: LangCode;
      tld: string;
    };
  };
  features?: {
    LoadingAPI?: {
      ready: () => void;
    };
    GameplayAPI?: {
      start: () => void;
      stop: () => void;
    };
  };
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback: (...args: unknown[]) => void) => void;
  adv?: {
    showFullscreenAdv: (opts?: {
      callbacks?: {
        onOpen?: () => void;
        onClose?: (wasShown: boolean) => void;
        onError?: (error: unknown) => void;
      };
    }) => void;
    showRewardedVideo: (opts?: {
      callbacks?: {
        onOpen?: () => void;
        onClose?: (wasShown: boolean) => void;
        onError?: (error: unknown) => void;
        onRewarded?: () => void;
      };
    }) => void;
    getBannerAdvStatus?: () => Promise<{ stickyAdvIsShowing: boolean }>;
    showBannerAdv?: () => Promise<unknown>;
    hideBannerAdv?: () => Promise<unknown>;
  };
  getPayments?: (opts?: unknown) => Promise<unknown>;
};

declare global {
  interface Window {
    YaGames?: {
      init: (opts?: unknown) => Promise<YandexSdk>;
    };
    __NEONTRON_SDK__?: YandexSdk;
  }
}

export type PlatformState = {
  sdk: YandexSdk;
  lang: LangCode;
  isMock: boolean;
  stickyPaddingPx: number;
};

let platformState: PlatformState | null = null;
const pauseListeners = new Set<() => void>();
const resumeListeners = new Set<() => void>();

function createMockSdk(): YandexSdk {
  const params = new URLSearchParams(window.location.search);
  const lang = (params.get('lang') || navigator.language.slice(0, 2) || 'ru') as LangCode;

  const handlers = new Map<string, Set<(...args: unknown[]) => void>>();

  const sdk: YandexSdk = {
    environment: {
      i18n: {
        lang,
        tld: 'ru',
      },
    },
    features: {
      LoadingAPI: {
        ready: () => {
          console.info('[mock-sdk] LoadingAPI.ready()');
        },
      },
      GameplayAPI: {
        start: () => console.info('[mock-sdk] GameplayAPI.start()'),
        stop: () => console.info('[mock-sdk] GameplayAPI.stop()'),
      },
    },
    on: (event, callback) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(callback);
      console.info(`[mock-sdk] on(${event})`);
    },
    off: (event, callback) => {
      handlers.get(event)?.delete(callback);
      console.info(`[mock-sdk] off(${event})`);
    },
    adv: {
      showFullscreenAdv: (opts) => {
        console.info('[mock-sdk] showFullscreenAdv()');
        opts?.callbacks?.onOpen?.();
        window.setTimeout(() => opts?.callbacks?.onClose?.(true), 200);
      },
      showRewardedVideo: (opts) => {
        console.info('[mock-sdk] showRewardedVideo()');
        opts?.callbacks?.onOpen?.();
        window.setTimeout(() => {
          opts?.callbacks?.onRewarded?.();
          opts?.callbacks?.onClose?.(true);
        }, 300);
      },
      getBannerAdvStatus: async () => ({ stickyAdvIsShowing: false }),
      showBannerAdv: async () => ({ stickyAdvIsShowing: true }),
      hideBannerAdv: async () => ({ stickyAdvIsShowing: false }),
    },
  };

  // Expose helpers for manual pause/resume testing in console.
  (window as unknown as { __mockSdkEmit?: (event: string) => void }).__mockSdkEmit = (event: string) => {
    console.info(`[mock-sdk] emit ${event}`);
    handlers.get(event)?.forEach((cb) => cb());
  };

  return sdk;
}

async function loadOfficialSdk(): Promise<YandexSdk | null> {
  if (window.YaGames?.init) {
    try {
      return await window.YaGames.init();
    } catch (error) {
      console.warn('[yandex] YaGames.init failed, fallback to mock', error);
      return null;
    }
  }

  // Official SDK script is injected by Yandex Games host. Locally it is absent.
  return null;
}

export async function initPlatform(): Promise<PlatformState> {
  if (platformState) return platformState;

  const official = await loadOfficialSdk();
  const isMock = !official;
  const sdk = official ?? createMockSdk();
  const lang = sdk.environment?.i18n?.lang || 'ru';

  const onPause = () => {
    console.info('[yandex] game_api_pause');
    pauseListeners.forEach((cb) => cb());
  };
  const onResume = () => {
    console.info('[yandex] game_api_resume');
    resumeListeners.forEach((cb) => cb());
  };

  sdk.on('game_api_pause', onPause);
  sdk.on('game_api_resume', onResume);

  platformState = {
    sdk,
    lang,
    isMock,
    stickyPaddingPx: 90,
  };

  console.info(`[yandex] init complete (mock=${isMock}, lang=${lang})`);
  return platformState;
}

export function getPlatform(): PlatformState {
  if (!platformState) {
    throw new Error('Platform is not initialized. Call initPlatform() first.');
  }
  return platformState;
}

export function markGameReady(): void {
  const { sdk } = getPlatform();
  sdk.features?.LoadingAPI?.ready?.();
}

export function gameplayStart(): void {
  getPlatform().sdk.features?.GameplayAPI?.start?.();
}

export function gameplayStop(): void {
  getPlatform().sdk.features?.GameplayAPI?.stop?.();
}

export function onPlatformPause(cb: () => void): () => void {
  pauseListeners.add(cb);
  return () => pauseListeners.delete(cb);
}

export function onPlatformResume(cb: () => void): () => void {
  resumeListeners.add(cb);
  return () => resumeListeners.delete(cb);
}
