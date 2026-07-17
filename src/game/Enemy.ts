import Phaser from 'phaser';
import type { EnemyDef } from './types';
import { raycastWalls } from './SpriteFactory';
import { ENEMY_ANIM_SHEETS, playAnim } from './CharacterAnims';

export class EnemyActor {
  readonly body: Phaser.Physics.Arcade.Sprite;
  readonly cone: Phaser.GameObjects.Graphics;
  readonly underglow: Phaser.GameObjects.Arc;
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
  /** rad/sec */
  turnSpeed = 2.4;
  private walls: Phaser.Geom.Rectangle[] = [];
  private readonly animPrefix: string;

  constructor(scene: Phaser.Scene, def: EnemyDef, tileSize: number) {
    const x = def.x * tileSize + tileSize / 2;
    const y = def.y * tileSize + tileSize / 2;
    this.type = def.type;
    const sheet = ENEMY_ANIM_SHEETS[def.type] || ENEMY_ANIM_SHEETS.patrol;
    this.animPrefix = `enemy_${def.type in ENEMY_ANIM_SHEETS ? def.type : 'patrol'}`;
    this.underglow = scene.add.circle(x, y, 24, 0xff2a6d, 0.16).setDepth(17);
    this.body = scene.physics.add.sprite(x, y, sheet, 0);
    this.body.setCircle(16, 4, 4);
    this.body.setImmovable(true);
    this.body.setDepth(18);
    this.body.setDisplaySize(64, 64);
    playAnim(this.body, `${this.animPrefix}_idle`, false);
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

  setWalls(walls: Phaser.Geom.Rectangle[]): void {
    this.walls = walls;
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

    this.facing = Phaser.Math.Angle.RotateTo(this.facing, this.targetFacing, this.turnSpeed * dt);
    this.body.setRotation(this.facing);
    this.underglow.setPosition(this.body.x, this.body.y);

    let moving = false;
    if (moveAngle !== null) {
      const aligned = Math.abs(Phaser.Math.Angle.Wrap(moveAngle - this.facing)) < 0.55;
      const spd = this.alert >= 0.55 ? this.speed * 1.2 : this.speed;
      if (aligned) {
        this.body.setVelocity(Math.cos(this.facing) * spd, Math.sin(this.facing) * spd);
        moving = true;
      } else {
        this.body.setVelocity(Math.cos(this.facing) * spd * 0.25, Math.sin(this.facing) * spd * 0.25);
        moving = true;
      }
    } else {
      this.body.setVelocity(0);
    }

    if (this.alert >= 0.55) {
      playAnim(this.body, moving ? `${this.animPrefix}_walk` : `${this.animPrefix}_alert`);
    } else {
      playAnim(this.body, moving ? `${this.animPrefix}_walk` : `${this.animPrefix}_idle`);
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
    const fill = 0xff2a6d;
    this.cone.fillStyle(fill, alertHot ? 0.22 : 0.12);
    this.cone.beginPath();
    this.cone.moveTo(this.body.x, this.body.y);
    const steps = 28;
    for (let i = 0; i <= steps; i++) {
      const a = this.facing - this.visionFov / 2 + (this.visionFov * i) / steps;
      const dist = raycastWalls(this.body.x, this.body.y, a, this.visionRange, this.walls, 48);
      this.cone.lineTo(this.body.x + Math.cos(a) * dist, this.body.y + Math.sin(a) * dist);
    }
    this.cone.closePath();
    this.cone.fillPath();

    this.cone.lineStyle(1, alertHot ? 0xff6b9a : 0xff4d7a, 0.55);
    const a0 = this.facing - this.visionFov / 2;
    const a1 = this.facing + this.visionFov / 2;
    const d0 = raycastWalls(this.body.x, this.body.y, a0, this.visionRange, this.walls, 32);
    const d1 = raycastWalls(this.body.x, this.body.y, a1, this.visionRange, this.walls, 32);
    this.cone.lineBetween(
      this.body.x,
      this.body.y,
      this.body.x + Math.cos(a0) * d0,
      this.body.y + Math.sin(a0) * d0,
    );
    this.cone.lineBetween(
      this.body.x,
      this.body.y,
      this.body.x + Math.cos(a1) * d1,
      this.body.y + Math.sin(a1) * d1,
    );
  }

  neutralize(): void {
    this.alive = false;
    this.body.setVelocity(0);
    this.cone.clear();
    this.underglow.setVisible(false);
    playAnim(this.body, `${this.animPrefix}_death`, false);
    this.body.once('animationcomplete', () => {
      if (this.body.active) this.body.setAlpha(0.45);
    });
  }

  destroy(): void {
    this.body.destroy();
    this.cone.destroy();
    this.underglow.destroy();
  }
}
