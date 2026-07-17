import Phaser from 'phaser';
import type { WeaponType } from './Player';
import { WEAPON_FOV, WEAPON_RANGE, IS_MELEE } from './Player';

export class CombatVfx {
  readonly rangeGfx: Phaser.GameObjects.Graphics;
  readonly swingGfx: Phaser.GameObjects.Graphics;

  constructor(private scene: Phaser.Scene) {
    this.rangeGfx = scene.add.graphics().setDepth(6);
    this.swingGfx = scene.add.graphics().setDepth(25);
  }

  destroy(): void {
    this.rangeGfx.destroy();
    this.swingGfx.destroy();
  }

  /** Aim cone clipped by walls when wall list provided. */
  drawAimCone(
    x: number,
    y: number,
    facing: number,
    weapon: WeaponType,
    hasTarget: boolean,
    walls?: Phaser.Geom.Rectangle[],
  ): void {
    const range = WEAPON_RANGE[weapon];
    const fov = WEAPON_FOV[weapon];
    this.rangeGfx.clear();
    const color = hasTarget ? 0x39ff14 : 0x2de2e6;
    const alpha = hasTarget ? 0.28 : 0.14;
    this.rangeGfx.fillStyle(color, alpha);
    this.rangeGfx.beginPath();
    this.rangeGfx.moveTo(x, y);
    const steps = 18;
    const raySteps = Math.max(20, Math.ceil(range / 3));
    for (let i = 0; i <= steps; i++) {
      const a = facing - fov + ((fov * 2) * i) / steps;
      let dist = range;
      if (walls?.length) {
        for (let s = 1; s <= raySteps; s++) {
          const d = (range * s) / raySteps;
          const px = x + Math.cos(a) * d;
          const py = y + Math.sin(a) * d;
          if (walls.some((r) => r.contains(px, py))) {
            dist = Math.max(0, d - range / raySteps);
            break;
          }
        }
      }
      this.rangeGfx.lineTo(x + Math.cos(a) * dist, y + Math.sin(a) * dist);
    }
    this.rangeGfx.closePath();
    this.rangeGfx.fillPath();
    this.rangeGfx.lineStyle(2, color, hasTarget ? 0.85 : 0.4);
    this.rangeGfx.strokeCircle(x, y, Math.min(range, 20));
  }

  playMeleeSwing(x: number, y: number, facing: number, weapon: WeaponType): void {
    const range = WEAPON_RANGE[weapon];
    const fov = WEAPON_FOV[weapon];
    this.swingGfx.clear();
    this.swingGfx.fillStyle(0xffffff, 0.55);
    this.swingGfx.beginPath();
    this.swingGfx.moveTo(x, y);
    for (let i = 0; i <= 10; i++) {
      const a = facing - fov + ((fov * 2) * i) / 10;
      this.swingGfx.lineTo(x + Math.cos(a) * range, y + Math.sin(a) * range);
    }
    this.swingGfx.closePath();
    this.swingGfx.fillPath();
    this.scene.tweens.add({
      targets: this.swingGfx,
      alpha: 0,
      duration: 140,
      onComplete: () => {
        this.swingGfx.clear();
        this.swingGfx.setAlpha(1);
      },
    });
  }

  muzzleFlash(x: number, y: number, facing: number): void {
    const fx = this.scene.add
      .image(x + Math.cos(facing) * 18, y + Math.sin(facing) * 18, 'muzzle')
      .setRotation(facing)
      .setDepth(30)
      .setScale(1.2);
    this.scene.tweens.add({
      targets: fx,
      alpha: 0,
      scale: 1.8,
      duration: 80,
      onComplete: () => fx.destroy(),
    });
  }

  spawnBullet(
    x: number,
    y: number,
    facing: number,
    weapon: WeaponType,
    onHit: (bx: number, by: number) => boolean,
    blocked: (x1: number, y1: number, x2: number, y2: number) => boolean,
  ): void {
    if (IS_MELEE[weapon]) return;
    const speed = weapon === 'shotgun' ? 420 : weapon === 'uzi' ? 520 : 480;
    const pellets = weapon === 'shotgun' ? 5 : 1;
    const spread = weapon === 'shotgun' ? 0.28 : weapon === 'uzi' ? 0.08 : 0.02;

    for (let i = 0; i < pellets; i++) {
      const ang = facing + (pellets === 1 ? 0 : -spread / 2 + (spread * i) / (pellets - 1));
      const bullet = this.scene.physics.add.image(x + Math.cos(facing) * 16, y + Math.sin(facing) * 16, 'bullet');
      bullet.setDepth(28);
      bullet.setScale(weapon === 'shotgun' ? 1.1 : 1.4);
      bullet.setRotation(ang);
      bullet.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);

      const trail = this.scene.add.particles(0, 0, 'spark', {
        follow: bullet,
        lifespan: 120,
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.7, end: 0 },
        frequency: 16,
        tint: 0xffc857,
      });

      let alive = true;
      const maxDist = WEAPON_RANGE[weapon] + 40;
      const startX = bullet.x;
      const startY = bullet.y;

      const timer = this.scene.time.addEvent({
        delay: 12,
        loop: true,
        callback: () => {
          if (!alive || !bullet.active) {
            timer.remove(false);
            return;
          }
          const dist = Phaser.Math.Distance.Between(startX, startY, bullet.x, bullet.y);
          const prevX = bullet.x - Math.cos(ang) * 12;
          const prevY = bullet.y - Math.sin(ang) * 12;
          const hitWall = blocked(prevX, prevY, bullet.x, bullet.y);
          if (dist > maxDist || hitWall) {
            alive = false;
            this.hitSpark(bullet.x, bullet.y);
            bullet.destroy();
            trail.destroy();
            timer.remove(false);
            return;
          }
          if (onHit(bullet.x, bullet.y)) {
            alive = false;
            this.hitSpark(bullet.x, bullet.y);
            bullet.destroy();
            trail.destroy();
            timer.remove(false);
          }
        },
      });

      this.scene.time.delayedCall(900, () => {
        if (bullet.active) bullet.destroy();
        trail.destroy();
      });
    }

    this.muzzleFlash(x, y, facing);
  }

  hitSpark(x: number, y: number): void {
    const p = this.scene.add.particles(x, y, 'spark', {
      speed: { min: 40, max: 140 },
      scale: { start: 1.2, end: 0 },
      lifespan: 220,
      quantity: 8,
      tint: [0xffc857, 0x2de2e6, 0xffffff],
    });
    this.scene.time.delayedCall(250, () => p.destroy());
  }

  dissolve(x: number, y: number): void {
    const p = this.scene.add.particles(x, y, 'pixel', {
      speed: { min: 50, max: 160 },
      scale: { start: 4, end: 0 },
      lifespan: 420,
      quantity: 18,
      tint: [0x2de2e6, 0xff2a6d, 0xffffff],
    });
    this.scene.time.delayedCall(450, () => p.destroy());
  }

  pickupPulse(image: Phaser.GameObjects.Image): void {
    this.scene.tweens.add({
      targets: image,
      y: image.y - 4,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.scene.tweens.add({
      targets: image,
      angle: 360,
      duration: 4000,
      repeat: -1,
    });
  }
}
