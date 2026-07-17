import Phaser from 'phaser';
import type { EnemyDef } from './types';
import { ENEMY_TEXTURE } from './SpriteFactory';

export class EnemyActor {
  readonly body: Phaser.Physics.Arcade.Image;
  readonly cone: Phaser.GameObjects.Graphics;
  readonly type: EnemyDef['type'];
  route: Phaser.Math.Vector2[] = [];
  routeIndex = 0;
  facing: number;
  targetFacing: number;
  alive = true;
  alert = 0;
  visionRange = 150;
  visionFov = Phaser.Math.DegToRad(52);
  speed = 70;
  /** rad/sec — slow enough to read and flank */
  turnSpeed = 2.4;

  constructor(scene: Phaser.Scene, def: EnemyDef, tileSize: number) {
    const x = def.x * tileSize + tileSize / 2;
    const y = def.y * tileSize + tileSize / 2;
    this.type = def.type;
    const tex = ENEMY_TEXTURE[def.type] || 'enemy_patrol';
    this.body = scene.physics.add.image(x, y, tex);
    this.body.setCircle(12, 4, 4);
    this.body.setImmovable(true);
    this.body.setDepth(18);
    this.body.setDisplaySize(32, 32);
    this.cone = scene.add.graphics().setDepth(5);
    this.facing = Phaser.Math.DegToRad(def.facing ?? 0);
    this.targetFacing = this.facing;
    this.body.setRotation(this.facing);

    if (def.route?.length) {
      this.route = def.route.map(
        ([tx, ty]) => new Phaser.Math.Vector2(tx * tileSize + tileSize / 2, ty * tileSize + tileSize / 2),
      );
    }

    if (def.type === 'shotgun') {
      this.visionRange = 120;
      this.visionFov = Phaser.Math.DegToRad(40);
      this.speed = 65;
      this.turnSpeed = 2.0;
    } else if (def.type === 'shield') {
      this.visionRange = 130;
      this.speed = 50;
      this.turnSpeed = 1.6;
    } else if (def.type === 'sniper') {
      this.visionRange = 200;
      this.visionFov = Phaser.Math.DegToRad(28);
      this.speed = 45;
      this.turnSpeed = 1.8;
    } else {
      this.turnSpeed = 2.2;
    }
  }

  update(delta: number, playerPos: Phaser.Math.Vector2 | null): void {
    if (!this.alive) return;
    const dt = delta / 1000;

    let moveAngle: number | null = null;

    if (this.route.length >= 2 && this.alert < 0.55) {
      const target = this.route[this.routeIndex];
      const dist = Phaser.Math.Distance.Between(this.body.x, this.body.y, target.x, target.y);
      if (dist < 6) {
        this.routeIndex = (this.routeIndex + 1) % this.route.length;
      } else {
        moveAngle = Math.atan2(target.y - this.body.y, target.x - this.body.x);
        this.targetFacing = moveAngle;
      }
    } else if (this.alert >= 0.55 && playerPos) {
      moveAngle = Math.atan2(playerPos.y - this.body.y, playerPos.x - this.body.x);
      this.targetFacing = moveAngle;
    }

    // Smooth turn — cannot spin instantly
    this.facing = Phaser.Math.Angle.RotateTo(this.facing, this.targetFacing, this.turnSpeed * dt);
    this.body.setRotation(this.facing);

    // Only move meaningfully once roughly facing the intended direction
    if (moveAngle !== null) {
      const aligned = Math.abs(Phaser.Math.Angle.Wrap(moveAngle - this.facing)) < 0.55;
      const spd = this.alert >= 0.55 ? this.speed * 1.2 : this.speed;
      if (aligned) {
        this.body.setVelocity(Math.cos(this.facing) * spd, Math.sin(this.facing) * spd);
      } else {
        // shuffle slowly while turning
        this.body.setVelocity(Math.cos(this.facing) * spd * 0.25, Math.sin(this.facing) * spd * 0.25);
      }
    } else {
      this.body.setVelocity(0);
    }

    this.drawCone();
  }

  canSee(px: number, py: number, blocked: (x1: number, y1: number, x2: number, y2: number) => boolean): boolean {
    if (!this.alive) return false;
    const dist = Phaser.Math.Distance.Between(this.body.x, this.body.y, px, py);
    if (dist > this.visionRange) return false;
    const angleTo = Math.atan2(py - this.body.y, px - this.body.x);
    const diff = Phaser.Math.Angle.Wrap(angleTo - this.facing);
    if (Math.abs(diff) > this.visionFov / 2) return false;
    if (blocked(this.body.x, this.body.y, px, py)) return false;
    return true;
  }

  drawCone(): void {
    this.cone.clear();
    if (!this.alive) return;
    const alertHot = this.alert >= 0.55;
    this.cone.fillStyle(alertHot ? 0xff2a6d : 0xff2a6d, alertHot ? 0.28 : 0.16);
    this.cone.beginPath();
    this.cone.moveTo(this.body.x, this.body.y);
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const a = this.facing - this.visionFov / 2 + (this.visionFov * i) / steps;
      this.cone.lineTo(
        this.body.x + Math.cos(a) * this.visionRange,
        this.body.y + Math.sin(a) * this.visionRange,
      );
    }
    this.cone.closePath();
    this.cone.fillPath();
    // edge lines for readability
    this.cone.lineStyle(1, alertHot ? 0xff6b9a : 0xff2a6d, 0.45);
    const a0 = this.facing - this.visionFov / 2;
    const a1 = this.facing + this.visionFov / 2;
    this.cone.lineBetween(this.body.x, this.body.y, this.body.x + Math.cos(a0) * this.visionRange, this.body.y + Math.sin(a0) * this.visionRange);
    this.cone.lineBetween(this.body.x, this.body.y, this.body.x + Math.cos(a1) * this.visionRange, this.body.y + Math.sin(a1) * this.visionRange);
  }

  neutralize(): void {
    this.alive = false;
    this.body.setVelocity(0);
    this.body.setTexture('enemy_down');
    this.body.setAlpha(0.4);
    this.body.setTint(0x2de2e6);
    this.cone.clear();
  }

  destroy(): void {
    this.body.destroy();
    this.cone.destroy();
  }
}
