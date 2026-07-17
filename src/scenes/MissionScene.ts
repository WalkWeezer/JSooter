import Phaser from 'phaser';
import {
  PlayerActor,
  WEAPON_RANGE,
  WEAPON_FOV,
  IS_MELEE,
  type WeaponType,
} from '../game/Player';
import { EnemyActor } from '../game/Enemy';
import { InputRouter } from '../input/InputRouter';
import { computeRank, type MissionDef, type Rank } from '../game/types';
import { gameplayStart, gameplayStop } from '../platform/yandex';
import { t } from '../i18n';
import { audioService } from '../audio/AudioService';
import { getMission } from '../data/missionIndex';
import { saveService } from '../save/SaveService';
import { getMask } from '../data/masks';
import { adsService } from '../ads/AdsService';
import { WEAPON_TEXTURE, ensureFallbackTextures } from '../game/SpriteFactory';
import { CombatVfx } from '../game/CombatVfx';

type Pickup = {
  type: WeaponType;
  image: Phaser.Physics.Arcade.Image;
  label: Phaser.GameObjects.Text;
};

export type MissionResultPayload = {
  missionId: string;
  rank: Rank;
  deaths: number;
  timeSec: number;
  alarm: boolean;
};

export class MissionScene extends Phaser.Scene {
  private mission!: MissionDef;
  private player!: PlayerActor;
  private enemies: EnemyActor[] = [];
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private pickups: Pickup[] = [];
  private inputRouter!: InputRouter;
  private exitZone!: Phaser.GameObjects.Zone;
  private caseItem?: Phaser.Physics.Arcade.Image;
  private deaths = 0;
  private startedAt = 0;
  private alarm = false;
  private hasCase = false;
  private ended = false;
  private hudText?: Phaser.GameObjects.Text;
  private weaponHud?: Phaser.GameObjects.Image;
  private wallRects: Phaser.Geom.Rectangle[] = [];
  private desktopAttackArmed = false;
  private vfx!: CombatVfx;
  private rangeHint?: Phaser.GameObjects.Text;

  constructor() {
    super('MissionScene');
  }

  init(data: { missionId?: string }): void {
    const id = data?.missionId || 'tut_01';
    this.mission = getMission(id);
  }

  create(): void {
    this.ended = false;
    this.deaths = Number(this.registry.get('runDeaths') || 0);
    this.alarm = false;
    this.hasCase = false;
    this.startedAt = this.time.now;
    this.enemies = [];
    this.pickups = [];
    this.wallRects = [];

    ensureFallbackTextures(this);
    this.vfx = new CombatVfx(this);

    const m = this.mission;
    const ts = m.tileSize;
    const mapW = m.width * ts;
    const mapH = m.height * ts;

    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.physics.world.setBounds(0, 0, mapW, mapH);
    this.cameras.main.setBackgroundColor('#0e121a');

    for (let y = 0; y < m.height; y++) {
      for (let x = 0; x < m.width; x++) {
        const key = (x + y) % 2 === 0 ? 'floor_a' : 'floor_b';
        this.add.image(x * ts + ts / 2, y * ts + ts / 2, key).setDepth(0);
      }
    }

    this.walls = this.physics.add.staticGroup();
    for (const [tx, ty] of m.walls) {
      const img = this.walls.create(tx * ts + ts / 2, ty * ts + ts / 2, 'wall') as Phaser.Physics.Arcade.Image;
      img.refreshBody();
      this.wallRects.push(new Phaser.Geom.Rectangle(tx * ts, ty * ts, ts, ts));
    }

    const spawnX = m.playerSpawn[0] * ts + ts / 2;
    const spawnY = m.playerSpawn[1] * ts + ts / 2;
    this.player = new PlayerActor(this, spawnX, spawnY);
    const mask = getMask(saveService.get().maskId);
    if (mask.perk === 'dash') this.player.speed = 185;
    this.physics.add.collider(this.player.body, this.walls);

    for (const e of m.enemies) {
      const enemy = new EnemyActor(this, e, ts);
      enemy.setWalls(this.wallRects);
      if (mask.perk === 'vision') {
        enemy.cone.setAlpha(1);
      }
      this.physics.add.collider(enemy.body, this.walls);
      this.enemies.push(enemy);
    }

    this.registry.set('maskPerk', mask.perk);
    this.registry.set('silencerCharges', mask.perk === 'silencer' ? 1 : 0);

    for (const w of m.weapons) {
      const tex = WEAPON_TEXTURE[w.type] || 'wpn_bat';
      const img = this.physics.add.image(w.x * ts + ts / 2, w.y * ts + ts / 2, tex);
      img.setDepth(8);
      img.setDisplaySize(28, 28);
      this.vfx.pickupPulse(img);
      const label = this.add
        .text(img.x, img.y + 16, w.type.toUpperCase(), {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#ffc857',
        })
        .setOrigin(0.5)
        .setDepth(9);
      this.pickups.push({ type: w.type as WeaponType, image: img, label });
    }

    if (m.caseItem) {
      this.caseItem = this.physics.add.image(m.caseItem[0] * ts + ts / 2, m.caseItem[1] * ts + ts / 2, 'case');
      this.caseItem.setDepth(9);
      this.vfx.pickupPulse(this.caseItem);
    }

    const exitX = m.exit[0] * ts + ts / 2;
    const exitY = m.exit[1] * ts + ts / 2;
    this.add.image(exitX, exitY, 'exit').setDepth(2);
    this.exitZone = this.add.zone(exitX, exitY, ts, ts);
    this.physics.world.enable(this.exitZone);
    (this.exitZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    this.inputRouter = new InputRouter(this);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.inputRouter.hasTouchUi() && pointer.leftButtonDown()) {
        this.desktopAttackArmed = true;
      }
    });
    this.cameras.main.startFollow(this.player.body, true, 0.12, 0.12);

    this.hudText = this.add
      .text(12, 12, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#cfd6e6',
        backgroundColor: '#0b0d12aa',
        padding: { x: 8, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(2000);

    this.weaponHud = this.add
      .image(36, 78, 'wpn_fist')
      .setScrollFactor(0)
      .setDepth(2000)
      .setDisplaySize(36, 36);

    this.rangeHint = this.add
      .text(12, 100, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#39ff14',
        backgroundColor: '#0b0d12aa',
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(2000);

    const pauseBtn = this.add
      .text(this.scale.width - 12, 12, t('mission.pause'), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#2DE2E6',
        backgroundColor: '#121820',
        padding: { x: 8, y: 6 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(2000)
      .setInteractive({ useHandCursor: true });

    pauseBtn.on('pointerdown', () => {
      this.scene.pause();
      gameplayStop();
      this.scene.launch('PauseOverlay');
    });

    gameplayStart();
    audioService.attachScene(this);
    audioService.playCombat();
    void adsService.hideSticky();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputRouter.destroy();
      this.vfx.destroy();
      this.player.destroy();
      gameplayStop();
    });
  }

  update(_time: number, delta: number): void {
    if (this.ended || !this.player) return;

    const state = this.inputRouter.getState(this.player.body.x, this.player.body.y);
    this.player.update(state.moveX, state.moveY, state.aimX, state.aimY, delta);

    if (this.inputRouter.consumeAttack() || this.desktopAttackArmed) {
      this.desktopAttackArmed = false;
      this.tryAttack();
    }

    for (const p of this.pickups) {
      if (!p.image.active) continue;
      if (Phaser.Math.Distance.Between(this.player.body.x, this.player.body.y, p.image.x, p.image.y) < 26) {
        this.player.setWeapon(p.type);
        this.weaponHud?.setTexture(WEAPON_TEXTURE[p.type]);
        p.label.destroy();
        p.image.destroy();
        p.image.active = false;
        this.flashPickup(p.type);
      }
    }

    if (this.caseItem?.active) {
      if (Phaser.Math.Distance.Between(this.player.body.x, this.player.body.y, this.caseItem.x, this.caseItem.y) < 26) {
        this.hasCase = true;
        this.player.hasCase = true;
        this.caseItem.destroy();
        this.caseItem = undefined;
      }
    }

    const playerPos = new Phaser.Math.Vector2(this.player.body.x, this.player.body.y);
    for (const enemy of this.enemies) {
      enemy.update(delta, this.alarm ? playerPos : null);
      if (enemy.alive && enemy.canSee(this.player.body.x, this.player.body.y, this.lineBlocked.bind(this))) {
        this.onSpotted();
        return;
      }
      if (
        enemy.alive &&
        Phaser.Math.Distance.Between(enemy.body.x, enemy.body.y, this.player.body.x, this.player.body.y) < 18
      ) {
        this.onSpotted();
        return;
      }
    }

    const target = this.findAttackTarget();
    this.vfx.drawAimCone(
      this.player.body.x,
      this.player.body.y,
      this.player.facing,
      this.player.weapon,
      Boolean(target),
      this.wallRects,
    );
    if (this.rangeHint) {
      this.rangeHint.setText(
        target
          ? t('mission.in_range')
          : `${t('mission.range')}: ${Math.round(WEAPON_RANGE[this.player.weapon])}px`,
      );
      this.rangeHint.setColor(target ? '#39ff14' : '#9aa3b5');
    }

    if (this.checkWin()) this.onWin();

    const elapsed = (this.time.now - this.startedAt) / 1000;
    const objectiveKey =
      this.mission.objective === 'extract'
        ? 'briefing.objective_extract'
        : this.mission.objective === 'silent'
          ? 'briefing.objective_silent'
          : this.mission.objective === 'vip'
            ? 'briefing.objective_vip'
            : this.mission.objective === 'timed'
              ? 'briefing.objective_timed'
              : 'briefing.objective_clear';
    this.hudText?.setText(
      `${t(objectiveKey)}\n` +
        `${this.player.weapon.toUpperCase()} | ${t('results.deaths', { count: this.deaths })}\n` +
        `${elapsed.toFixed(1)}s` +
        (this.hasCase ? ' | CASE' : '') +
        (this.alarm ? ` | ${t('mission.alarm')}` : ''),
    );
    this.weaponHud?.setTexture(WEAPON_TEXTURE[this.player.weapon]);
  }

  private findAttackTarget(): EnemyActor | null {
    const range = WEAPON_RANGE[this.player.weapon];
    const fov = WEAPON_FOV[this.player.weapon];
    const origin = this.player.body;
    let best: EnemyActor | null = null;
    let bestDist = Infinity;
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const dist = Phaser.Math.Distance.Between(origin.x, origin.y, enemy.body.x, enemy.body.y);
      if (dist > range) continue;
      const angleTo = Math.atan2(enemy.body.y - origin.y, enemy.body.x - origin.x);
      const diff = Math.abs(Phaser.Math.Angle.Wrap(angleTo - this.player.facing));
      if (diff > fov) continue;
      if (!IS_MELEE[this.player.weapon] && this.lineBlocked(origin.x, origin.y, enemy.body.x, enemy.body.y)) {
        continue;
      }
      if (enemy.type === 'shield' && IS_MELEE[this.player.weapon]) {
        const behind = Math.abs(Phaser.Math.Angle.Wrap(angleTo - enemy.facing)) > Math.PI * 0.65;
        if (!behind && diff < 0.9) continue;
      }
      if (dist < bestDist) {
        bestDist = dist;
        best = enemy;
      }
    }
    return best;
  }

  private checkWin(): boolean {
    const allDown = this.enemies.every((e) => !e.alive);
    const atExit =
      Phaser.Math.Distance.Between(this.player.body.x, this.player.body.y, this.exitZone.x, this.exitZone.y) < 22;

    switch (this.mission.objective) {
      case 'extract':
        return this.hasCase && atExit;
      case 'clear':
      case 'vip':
      case 'timed':
      case 'silent':
        return allDown;
      default:
        return allDown && atExit;
    }
  }

  private tryAttack(): void {
    if (!this.player.alive || this.player.attackCooldown > 0) return;
    this.player.attackCooldown = IS_MELEE[this.player.weapon] ? 220 : 160;

    const facing = this.player.facing;
    const origin = this.player.body;
    const melee = IS_MELEE[this.player.weapon];

    if (melee) {
      this.vfx.playMeleeSwing(origin.x, origin.y, facing, this.player.weapon);
      const target = this.findAttackTarget();
      if (target) {
        this.neutralizeEnemy(target);
        this.vfx.hitSpark(target.body.x, target.body.y);
      }
      return;
    }

    // Guns: visible projectiles
    const charges = Number(this.registry.get('silencerCharges') || 0);
    if (charges > 0) this.registry.set('silencerCharges', charges - 1);
    else this.raiseNoise(origin.x, origin.y, 180);

    this.vfx.spawnBullet(
      origin.x,
      origin.y,
      facing,
      this.player.weapon,
      (bx, by) => {
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          if (Phaser.Math.Distance.Between(bx, by, enemy.body.x, enemy.body.y) < 16) {
            // shield blocks front shots
            if (enemy.type === 'shield') {
              const angleTo = Math.atan2(origin.y - enemy.body.y, origin.x - enemy.body.x);
              const front = Math.abs(Phaser.Math.Angle.Wrap(angleTo - enemy.facing)) < Math.PI * 0.55;
              if (front) {
                this.vfx.hitSpark(bx, by);
                return true; // stop bullet, no kill
              }
            }
            this.neutralizeEnemy(enemy);
            return true;
          }
        }
        return false;
      },
      this.lineBlocked.bind(this),
    );
  }

  private neutralizeEnemy(enemy: EnemyActor): void {
    enemy.neutralize();
    this.vfx.dissolve(enemy.body.x, enemy.body.y);
    this.cameras.main.shake(60, 0.004);
  }

  private flashPickup(type: WeaponType): void {
    const toast = this.add
      .text(this.player.body.x, this.player.body.y - 24, type.toUpperCase(), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffc857',
      })
      .setOrigin(0.5)
      .setDepth(40);
    this.tweens.add({
      targets: toast,
      y: toast.y - 20,
      alpha: 0,
      duration: 500,
      onComplete: () => toast.destroy(),
    });
  }

  private raiseNoise(x: number, y: number, radius: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (Phaser.Math.Distance.Between(enemy.body.x, enemy.body.y, x, y) < radius) {
        enemy.alert = 1;
        // turn toward noise gradually via targetFacing
        enemy.targetFacing = Math.atan2(y - enemy.body.y, x - enemy.body.x);
        this.alarm = true;
      }
    }
  }

  private lineBlocked(x1: number, y1: number, x2: number, y2: number): boolean {
    const steps = 14;
    for (let i = 1; i < steps; i++) {
      const tt = i / steps;
      const x = x1 + (x2 - x1) * tt;
      const y = y1 + (y2 - y1) * tt;
      for (const r of this.wallRects) {
        if (r.contains(x, y)) return true;
      }
    }
    return false;
  }

  private onSpotted(): void {
    if (this.ended || !this.player.alive) return;
    this.player.kill();
    this.deaths += 1;
    this.registry.set('runDeaths', this.deaths);
    audioService.playDeathSting();
    this.cameras.main.flash(120, 255, 42, 109, false);
    this.showDeathAndRestart();
  }

  private showDeathAndRestart(): void {
    const { width, height } = this.scale;
    const label = this.add
      .text(width / 2, height / 2, t('mission.died'), {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#FF2A6D',
        backgroundColor: '#0b0d12cc',
        padding: { x: 16, y: 12 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(3000);

    this.time.delayedCall(280, () => {
      label.destroy();
      this.scene.restart({ missionId: this.mission.id });
    });
  }

  private onWin(): void {
    if (this.ended) return;
    this.ended = true;
    gameplayStop();
    const timeSec = (this.time.now - this.startedAt) / 1000;
    const rank = computeRank({
      deaths: this.deaths,
      timeSec,
      alarm: this.alarm,
      rules: this.mission.sRankRules,
      objective: this.mission.objective,
      hasCase: this.hasCase,
    });

    const payload: MissionResultPayload = {
      missionId: this.mission.id,
      rank,
      deaths: this.deaths,
      timeSec,
      alarm: this.alarm,
    };
    this.registry.set('runDeaths', 0);
    this.scene.start('ResultsScene', payload);
  }
}
