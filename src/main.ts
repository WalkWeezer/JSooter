import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { HubScene } from './scenes/HubScene';
import { SettingsScene } from './scenes/SettingsScene';
import { audioService, bindPhaserMute } from './audio/AudioService';
import { initPlatform, onPlatformPause, onPlatformResume } from './platform/yandex';

async function bootstrap(): Promise<void> {
  await initPlatform();

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
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: true,
    },
    input: {
      activePointers: 3,
    },
    scene: [BootScene, PreloadScene, HubScene, SettingsScene],
  });

  bindPhaserMute(game);

  onPlatformPause(() => {
    audioService.setSystemMuted(true);
    audioService.stopAll();
    game.sound.mute = true;
    console.info('[main] platform pause → audio muted');
  });

  onPlatformResume(() => {
    if (!document.hidden) {
      audioService.setSystemMuted(false);
      game.sound.mute = false;
      console.info('[main] platform resume → audio unmuted');
    }
  });

  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}

bootstrap().catch((error) => {
  console.error('[main] bootstrap failed', error);
  const root = document.getElementById('game-root');
  if (root) {
    root.textContent = 'Failed to start Neontron. See console.';
  }
});
