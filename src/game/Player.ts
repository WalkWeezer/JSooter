import Phaser from 'phaser';

export type WeaponType = 'fist' | 'bat' | 'knife' | 'pistol' | 'shotgun' | 'uzi';

export const WEAPON_RANGE: Record<WeaponType, number> = {
  fist: 28,
  bat: 36,
  knife: 32,
  pistol: 180,
  shotgun: 110,
  uzi: 160,
};

export const WEAPON_NOISE: Record<WeaponType, number> = {
  fist: 0,
  bat: 0.2,
  knife: 0,
  pistol: 1,
  shotgun: 1.2,
  uzi: 1.1,
};

export class PlayerActor {
  readonly body: Phaser.Physics.Arcade.Image;
  facing = 0;
  weapon: WeaponType = 'fist';
  speed = 160;
  alive = true;
  hasCase = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.body = scene.physics.add.image(x, y, 'player');
    this.body.setCircle(10, 2, 2);
    this.body.setCollideWorldBounds(true);
    this.body.setDepth(20);
  }

  update(moveX: number, moveY: number, aimX: number, aimY: number): void {
    if (!this.alive) {
      this.body.setVelocity(0);
      return;
    }
    this.body.setVelocity(moveX * this.speed, moveY * this.speed);
    if (Math.abs(aimX) + Math.abs(aimY) > 0.05) {
      this.facing = Math.atan2(aimY, aimX);
    } else if (Math.abs(moveX) + Math.abs(moveY) > 0.05) {
      this.facing = Math.atan2(moveY, moveX);
    }
    this.body.setRotation(this.facing);
  }

  kill(): void {
    this.alive = false;
    this.body.setVelocity(0);
    this.body.setTint(0x666666);
  }

  reset(x: number, y: number): void {
    this.alive = true;
    this.weapon = 'fist';
    this.hasCase = false;
    this.body.clearTint();
    this.body.setPosition(x, y);
    this.body.setVelocity(0);
  }
}
