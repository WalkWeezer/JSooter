import Phaser from 'phaser';
import type { EnemyDef } from './types';

export class EnemyActor {
  readonly body: Phaser.Physics.Arcade.Image;
  readonly cone: Phaser.GameObjects.Graphics;
  readonly type: EnemyDef['type'];
  route: Phaser.Math.Vector2[] = [];
  routeIndex = 0;
  facing: number;
  alive = true;
  alert = 0;
  visionRange = 150;
  visionFov = Phaser.Math.DegToRad(52);
  speed = 70;

  constructor(scene: Phaser.Scene, def: EnemyDef, tileSize: number) {
    const x = def.x * tileSize + tileSize / 2;
    const y = def.y * tileSize + tileSize / 2;
    this.type = def.type;
    this.body = scene.physics.add.image(x, y, 'enemy');
    this.body.setCircle(10, 2, 2);
    this.body.setImmovable(true);
    this.body.setDepth(18);
    this.cone = scene.add.graphics().setDepth(5);
    this.facing = Phaser.Math.DegToRad(def.facing ?? 0);

    if (def.route?.length) {
      this.route = def.route.map(([tx, ty]) => new Phaser.Math.Vector2(tx * tileSize + tileSize / 2, ty * tileSize + tileSize / 2));
    }

    if (def.type === 'shotgun') {
      this.visionRange = 120;
      this.visionFov = Phaser.Math.DegToRad(40);
      this.body.setTint(0xff8844);
    } else if (def.type === 'shield') {
      this.visionRange = 130;
      this.body.setTint(0x88aaff);
      this.speed = 55;
    }
  }

  update(delta: number, playerPos: Phaser.Math.Vector2 | null, walls: Phaser.Physics.Arcade.StaticGroup): void {
    if (!this.alive) return;

    if (this.route.length >= 2 && this.alert < 0.6) {
      const target = this.route[this.routeIndex];
      const dist = Phaser.Math.Distance.Between(this.body.x, this.body.y, target.x, target.y);
      if (dist < 6) {
        this.routeIndex = (this.routeIndex + 1) % this.route.length;
      } else {
        const angle = Math.atan2(target.y - this.body.y, target.x - this.body.x);
        this.facing = angle;
        this.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
      }
    } else if (this.alert >= 0.6 && playerPos) {
      const angle = Math.atan2(playerPos.y - this.body.y, playerPos.x - this.body.x);
      this.facing = angle;
      this.body.setVelocity(Math.cos(angle) * this.speed * 1.25, Math.sin(angle) * this.speed * 1.25);
    } else {
      this.body.setVelocity(0);
    }

    this.drawCone();
    void walls;
    void delta;
  }

  canSee(px: number, py: number, blocked: (x1: number, y1: number, x2: number, y2: number) => boolean): boolean {
    if (!this.alive) return false;
    const dist = Phaser.Math.Distance.Between(this.body.x, this.body.y, px, py);
    if (dist > this.visionRange) return false;
    const angleTo = Math.atan2(py - this.body.y, px - this.body.x);
    let diff = Phaser.Math.Angle.Wrap(angleTo - this.facing);
    if (Math.abs(diff) > this.visionFov / 2) return false;
    if (blocked(this.body.x, this.body.y, px, py)) return false;
    return true;
  }

  drawCone(): void {
    this.cone.clear();
    if (!this.alive) return;
    this.cone.fillStyle(0xff2a6d, 0.18);
    this.cone.beginPath();
    this.cone.moveTo(this.body.x, this.body.y);
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const a = this.facing - this.visionFov / 2 + (this.visionFov * i) / steps;
      this.cone.lineTo(this.body.x + Math.cos(a) * this.visionRange, this.body.y + Math.sin(a) * this.visionRange);
    }
    this.cone.closePath();
    this.cone.fillPath();
  }

  neutralize(): void {
    this.alive = false;
    this.body.setVelocity(0);
    this.body.setTint(0x2de2e6);
    this.body.setAlpha(0.35);
    this.cone.clear();
  }

  destroy(): void {
    this.body.destroy();
    this.cone.destroy();
  }
}
