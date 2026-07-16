import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    const { width, height } = this.scale;
    const barWidth = Math.min(320, width * 0.6);
    const cx = width / 2;
    const cy = height / 2;

    const frame = this.add.rectangle(cx, cy, barWidth, 18, 0x1a1f2b).setStrokeStyle(2, 0x2de2e6);
    const fill = this.add.rectangle(cx - barWidth / 2 + 2, cy, 4, 12, 0xff2a6d).setOrigin(0, 0.5);
    const label = this.add
      .text(cx, cy - 36, 'NEONTRON', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#2DE2E6',
      })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      fill.width = Math.max(4, (barWidth - 4) * value);
    });

    // Phase 1: no heavy assets yet. Tiny delay keeps loader visible.
    this.load.image(
      'pixel',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5W5aUAAAAASUVORK5CYII=',
    );

    this.load.on('complete', () => {
      frame.destroy();
      fill.destroy();
      label.destroy();
    });
  }

  create(): void {
    this.scene.start('HubScene');
  }
}
