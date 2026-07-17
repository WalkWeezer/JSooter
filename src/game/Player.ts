import Phaser from 'phaser';
import { PLAYER_ANIM_SHEET, playAnim } from './CharacterAnims';

export type WeaponType = 'fist' | 'bat' | 'knife' | 'pistol' | 'shotgun' | 'uzi';

export const WEAPON_RANGE: Record<WeaponType, number> = {
  fist: 34,
  bat: 44,
  knife: 38,
  pistol: 200,
  shotgun: 130,
  uzi: 170,
};

/** Half-angle of attack cone in radians */
export const WEAPON_FOV: Record<WeaponType, number> = {
  fist: 0.95,
  bat: 1.05,
  knife: 0.75,
  pistol: 0.22,
  shotgun: 0.45,
  uzi: 0.28,
};

export const WEAPON_NOISE: Record<WeaponType, number> = {
  fist: 0,
  bat: 0.15,
  knife: 0,
  pistol: 1,
  shotgun: 1.25,
  uzi: 1.05,
};

export const IS_MELEE: Record<WeaponType, boolean> = {
  fist: true,
  bat: true,
  knife: true,
  pistol: false,
  shotgun: false,
  uzi: false,
};

export class PlayerActor {
  readonly body: Phaser.Physics.Arcade.Sprite;
  readonly weaponSprite: Phaser.GameObjects.Image;
  facing = 0;
  weapon: WeaponType = 'fist';
  speed = 160;
  alive = true;
  hasCase = false;
  attackCooldown = 0;
  private attacking = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.body = scene.physics.add.sprite(x, y, PLAYER_ANIM_SHEET, 0);
    this.body.setCircle(12, 4, 4);
    this.body.setCollideWorldBounds(true);
    this.body.setDepth(20);
    this.body.setDisplaySize(52, 52);
    playAnim(this.body, 'player_idle', false);

    this.weaponSprite = scene.add.image(x, y, 'wpn_fist').setDepth(21).setDisplaySize(20, 20);
    this.weaponSprite.setVisible(false);

    this.body.on('animationcomplete', (anim: Phaser.Animations.Animation) => {
      if (anim.key === 'player_melee' || anim.key === 'player_shoot') {
        this.attacking = false;
      }
    });
  }

  setWeapon(type: WeaponType): void {
    this.weapon = type;
    this.weaponSprite.setTexture(`wpn_${type}`);
    this.weaponSprite.setVisible(type !== 'fist' && this.alive);
  }

  /** Trigger attack animation (melee or shoot). */
  playAttack(): void {
    if (!this.alive) return;
    this.attacking = true;
    const key = IS_MELEE[this.weapon] ? 'player_melee' : 'player_shoot';
    playAnim(this.body, key, false);
  }

  update(moveX: number, moveY: number, aimX: number, aimY: number, delta: number): void {
    if (!this.alive) {
      this.body.setVelocity(0);
      return;
    }
    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    this.body.setVelocity(moveX * this.speed, moveY * this.speed);
    if (Math.abs(aimX) + Math.abs(aimY) > 0.05) {
      this.facing = Math.atan2(aimY, aimX);
    } else if (Math.abs(moveX) + Math.abs(moveY) > 0.05) {
      this.facing = Math.atan2(moveY, moveX);
    }
    this.body.setRotation(this.facing);

    if (!this.attacking) {
      const moving = Math.hypot(moveX, moveY) > 0.08;
      playAnim(this.body, moving ? 'player_walk' : 'player_idle');
    }

    const ox = Math.cos(this.facing) * 14;
    const oy = Math.sin(this.facing) * 14;
    this.weaponSprite.setPosition(this.body.x + ox, this.body.y + oy);
    this.weaponSprite.setRotation(this.facing);
    this.weaponSprite.setVisible(this.alive && this.weapon !== 'fist');
  }

  kill(): void {
    this.alive = false;
    this.attacking = false;
    this.body.setVelocity(0);
    this.weaponSprite.setVisible(false);
    playAnim(this.body, 'player_death', false);
  }

  destroy(): void {
    this.body.destroy();
    this.weaponSprite.destroy();
  }
}
