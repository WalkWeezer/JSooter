import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { HubScene } from './scenes/HubScene';
import { SettingsScene } from './scenes/SettingsScene';
import { BriefingScene } from './scenes/BriefingScene';
import { MissionScene } from './scenes/MissionScene';
import { ResultsScene } from './scenes/ResultsScene';
import { PauseOverlay } from './scenes/PauseOverlay';
import { MissionSelectScene } from './scenes/MissionSelectScene';
import { ShopScene } from './scenes/ShopScene';
import { audioService, bindPhaserMute } from './audio/AudioService';
import { initPlatform, onPlatformPause, onPlatformResume } from './platform/yandex';
import { saveService } from './save/SaveService';

async function bootstrap(): Promise<void> {
  await initPlatform();
  saveService.unlock('tut_01');

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-root',
    backgroundColor: '#0B0D12',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: true,
    },
    input: {
      activePointers: 3,
    },
    scene: [
      BootScene,
      PreloadScene,
      HubScene,
      SettingsScene,
      BriefingScene,
      MissionScene,
      ResultsScene,
      PauseOverlay,
      MissionSelectScene,
      ShopScene,
    ],
  });

  bindPhaserMute(game);
  (window as unknown as { __NEONTRON_GAME__?: Phaser.Game }).__NEONTRON_GAME__ = game;

  onPlatformPause(() => {
    audioService.setSystemMuted(true);
    audioService.stopAll();
    game.sound.mute = true;
    if (game.scene.isActive('MissionScene')) {
      game.scene.pause('MissionScene');
    }
    console.info('[main] platform pause → audio muted');
  });

  onPlatformResume(() => {
    if (!document.hidden) {
      audioService.setSystemMuted(false);
      game.sound.mute = false;
      if (game.scene.isPaused('MissionScene') && !game.scene.isActive('PauseOverlay')) {
        game.scene.resume('MissionScene');
      }
      console.info('[main] platform resume → audio unmuted');
    }
  });

    // Prevent browser gestures that break mobile play.
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.cancelable) e.preventDefault();
    },
    { passive: false },
  );
}

bootstrap().catch((error) => {
  console.error('[main] bootstrap failed', error);
  const root = document.getElementById('game-root');
  if (root) {
    root.textContent = 'Failed to start Neontron. See console.';
  }
});
