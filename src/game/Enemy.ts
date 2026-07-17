import Phaser from 'phaser';
import type { EnemyDef } from './types';
import { raycastWalls, segmentHitsWall } from './SpriteFactory';
import { ENEMY_ANIM_SHEETS, playAnim } from './CharacterAnims';

export type EnemyCombatHooks = {
  onShoot: (enemy: EnemyActor, aimAngle: number) => void;
};

export class EnemyActor {
  readonly body: Phaser.Physics.Arcade.Sprite;
  readonly cone: Phaser.GameObjects.Graphics;
  readonly underglow: Phaser.GameObjects.Arc;
  readonly type: EnemyDef['type'];
  readonly vip: boolean;
  route: Phaser.Math.Vector2[] = [];
  routeIndex = 0;
  facing: number;
  targetFacing: number;
  alive = true;
  alert = 0;
  visionRange = 150;
  visionFov = Phaser.Math.DegToRad(52);
  speed = 70;
  turnSpeed = 2.4;
  shootRange = 190;
  shootCooldownMs = 700;
  private shootTimer = 0;
  private walls: Phaser.Geom.Rectangle[] = [];
  private readonly animPrefix: string;
  private hooks?: EnemyCombatHooks;

  constructor(scene: Phaser.Scene, def: EnemyDef, tileSize: number) {
    const x = def.x * tileSize + tileSize / 2;
    const y = def.y * tileSize + tileSize / 2;
    this.type = def.type;
    this.vip = Boolean(def.vip);
    const sheet = ENEMY_ANIM_SHEETS[def.type] || ENEMY_ANIM_SHEETS.patrol;
    this.animPrefix = `enemy_${def.type in ENEMY_ANIM_SHEETS ? def.type : 'patrol'}`;
    this.underglow = scene.add
      .circle(x, y, 24, this.vip ? 0xffc857 : 0xff2a6d, this.vip ? 0.28 : 0.16)
      .setDepth(17);
    this.body = scene.physics.add.sprite(x, y, sheet, 0);
    // Body must be smaller than a tile so wall colliders catch edges
    this.body.setDisplaySize(56, 56);
    this.body.setSize(22, 22);
    this.body.setOffset((this.body.width - 22) / 2, (this.body.height - 22) / 2);
    this.body.setCollideWorldBounds(true);
    this.body.setBounce(0);
    this.body.setDepth(18);
    this.body.setPushable(false);
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
      this.shootRange = 140;
      this.shootCooldownMs = 900;
    } else if (def.type === 'shield') {
      this.visionRange = 130;
      this.speed = 55;
      this.turnSpeed = 1.6;
      this.shootRange = 160;
      this.shootCooldownMs = 850;
    } else if (def.type === 'sniper') {
      this.visionRange = 220;
      this.visionFov = Phaser.Math.DegToRad(28);
      this.speed = 48;
      this.turnSpeed = 1.8;
      this.shootRange = 260;
      this.shootCooldownMs = 1100;
    } else {
      this.turnSpeed = 2.2;
      this.shootCooldownMs = 650;
    }
  }

  setWalls(walls: Phaser.Geom.Rectangle[]): void {
    this.walls = walls;
  }

  setCombatHooks(hooks: EnemyCombatHooks): void {
    this.hooks = hooks;
  }

  update(
    delta: number,
    playerPos: Phaser.Math.Vector2 | null,
    canSeePlayer: boolean,
  ): void {
    if (!this.alive) return;
    const dt = delta / 1000;
    if (this.shootTimer > 0) this.shootTimer -= delta;

    let moveAngle: number | null = null;
    const alarmed = this.alert >= 0.55;

    if (!alarmed && this.route.length >= 2) {
      const target = this.route[this.routeIndex];
      const dist = Phaser.Math.Distance.Between(this.body.x, this.body.y, target.x, target.y);
      if (dist < 8) {
        this.routeIndex = (this.routeIndex + 1) % this.route.length;
      } else if (!this.segmentBlocked(this.body.x, this.body.y, target.x, target.y)) {
        moveAngle = Math.atan2(target.y - this.body.y, target.x - this.body.x);
        this.targetFacing = moveAngle;
      } else {
        // Skip blocked waypoint
        this.routeIndex = (this.routeIndex + 1) % this.route.length;
      }
    } else if (alarmed && playerPos) {
      this.targetFacing = Math.atan2(playerPos.y - this.body.y, playerPos.x - this.body.x);
      const dist = Phaser.Math.Distance.Between(this.body.x, this.body.y, playerPos.x, playerPos.y);
      // Keep shooting distance — advance if can't see / too far, strafe if close
      if (!canSeePlayer || dist > this.shootRange * 0.85) {
        if (!this.segmentBlocked(this.body.x, this.body.y, playerPos.x, playerPos.y)) {
          moveAngle = this.targetFacing;
        } else {
          // Slide along wall toward player
          moveAngle = this.slideAroundWall(playerPos);
        }
      } else if (dist < this.shootRange * 0.35) {
        moveAngle = this.targetFacing + Math.PI; // back off
      }
    }

    this.facing = Phaser.Math.Angle.RotateTo(this.facing, this.targetFacing, this.turnSpeed * dt);
    this.body.setRotation(this.facing);
    this.underglow.setPosition(this.body.x, this.body.y);

    let moving = false;
    if (moveAngle !== null) {
      const aligned = Math.abs(Phaser.Math.Angle.Wrap(moveAngle - this.facing)) < 0.7;
      const spd = alarmed ? this.speed * 1.15 : this.speed;
      const use = aligned ? spd : spd * 0.3;
      const vx = Math.cos(moveAngle) * use;
      const vy = Math.sin(moveAngle) * use;
      this.applyVelocityAvoidingWalls(vx, vy);
      moving = Math.hypot(vx, vy) > 8;
    } else {
      this.body.setVelocity(0);
    }

    // Shootout after alarm when player is in LOS
    if (alarmed && playerPos && canSeePlayer && this.hooks) {
      const dist = Phaser.Math.Distance.Between(this.body.x, this.body.y, playerPos.x, playerPos.y);
      if (dist <= this.shootRange && this.shootTimer <= 0) {
        const aim = Math.atan2(playerPos.y - this.body.y, playerPos.x - this.body.x);
        this.facing = aim;
        this.targetFacing = aim;
        this.body.setRotation(aim);
        this.hooks.onShoot(this, aim);
        this.shootTimer = this.shootCooldownMs * (0.85 + Math.random() * 0.3);
        playAnim(this.body, `${this.animPrefix}_alert`, false);
      }
    }

    if (alarmed) {
      playAnim(this.body, moving ? `${this.animPrefix}_walk` : `${this.animPrefix}_alert`);
    } else {
      playAnim(this.body, moving ? `${this.animPrefix}_walk` : `${this.animPrefix}_idle`);
    }

    this.drawCone();
  }

  private applyVelocityAvoidingWalls(vx: number, vy: number): void {
    const look = 14;
    const hitX = this.pointInWall(this.body.x + Math.sign(vx) * look, this.body.y);
    const hitY = this.pointInWall(this.body.x, this.body.y + Math.sign(vy) * look);
    this.body.setVelocity(hitX ? 0 : vx, hitY ? 0 : vy);
  }

  private pointInWall(x: number, y: number): boolean {
    return this.walls.some((r) => r.contains(x, y));
  }

  private segmentBlocked(x1: number, y1: number, x2: number, y2: number): boolean {
    return segmentHitsWall(x1, y1, x2, y2, this.walls, 20);
  }

  private slideAroundWall(_playerPos: Phaser.Math.Vector2): number | null {
    const angles = [this.targetFacing + 0.9, this.targetFacing - 0.9, this.targetFacing + 1.6, this.targetFacing - 1.6];
    for (const a of angles) {
      const nx = this.body.x + Math.cos(a) * 24;
      const ny = this.body.y + Math.sin(a) * 24;
      if (!this.pointInWall(nx, ny)) return a;
    }
    return null;
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
    this.cone.fillStyle(0xff2a6d, alertHot ? 0.2 : 0.11);
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
