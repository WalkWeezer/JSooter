import Phaser from 'phaser';
import { PlayerActor, WEAPON_RANGE, type WeaponType } from '../game/Player';
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

type Pickup = {
  type: WeaponType;
  image: Phaser.Physics.Arcade.Image;
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
  private wallRects: Phaser.Geom.Rectangle[] = [];
  private desktopAttackArmed = false;

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

    ensureTextures(this);
    const m = this.mission;
    const ts = m.tileSize;
    const mapW = m.width * ts;
    const mapH = m.height * ts;

    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.physics.world.setBounds(0, 0, mapW, mapH);
    this.cameras.main.setBackgroundColor('#12161f');

    // Floor tint grid
    for (let y = 0; y < m.height; y++) {
      for (let x = 0; x < m.width; x++) {
        const c = (x + y) % 2 === 0 ? 0x171b26 : 0x141821;
        this.add.rectangle(x * ts + ts / 2, y * ts + ts / 2, ts - 1, ts - 1, c).setDepth(0);
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
      if (mask.perk === 'vision') {
        enemy.cone.setAlpha(1);
      }
      this.physics.add.collider(enemy.body, this.walls);
      this.enemies.push(enemy);
    }

    this.registry.set('maskPerk', mask.perk);
    this.registry.set('silencerCharges', mask.perk === 'silencer' ? 1 : 0);

    for (const w of m.weapons) {
      const img = this.physics.add.image(w.x * ts + ts / 2, w.y * ts + ts / 2, 'weapon');
      img.setDepth(8);
      this.pickups.push({ type: w.type as WeaponType, image: img });
    }

    if (m.caseItem) {
      this.caseItem = this.physics.add.image(m.caseItem[0] * ts + ts / 2, m.caseItem[1] * ts + ts / 2, 'case');
      this.caseItem.setDepth(9);
    }

    const exitX = m.exit[0] * ts + ts / 2;
    const exitY = m.exit[1] * ts + ts / 2;
    this.add.rectangle(exitX, exitY, ts * 0.8, ts * 0.8, 0x39ff14, 0.25).setStrokeStyle(2, 0x39ff14).setDepth(2);
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
      gameplayStop();
    });
  }

  update(_time: number, delta: number): void {
    if (this.ended || !this.player) return;

    const state = this.inputRouter.getState(this.player.body.x, this.player.body.y);
    this.player.update(state.moveX, state.moveY, state.aimX, state.aimY);

    if (this.inputRouter.consumeAttack() || this.desktopAttackArmed) {
      this.desktopAttackArmed = false;
      this.tryAttack();
    }

    // pickups
    for (const p of this.pickups) {
      if (!p.image.active) continue;
      if (Phaser.Math.Distance.Between(this.player.body.x, this.player.body.y, p.image.x, p.image.y) < 22) {
        this.player.weapon = p.type;
        p.image.destroy();
        p.image.active = false;
      }
    }

    if (this.caseItem?.active) {
      if (Phaser.Math.Distance.Between(this.player.body.x, this.player.body.y, this.caseItem.x, this.caseItem.y) < 24) {
        this.hasCase = true;
        this.player.hasCase = true;
        this.caseItem.destroy();
        this.caseItem = undefined;
      }
    }

    const playerPos = new Phaser.Math.Vector2(this.player.body.x, this.player.body.y);
    for (const enemy of this.enemies) {
      enemy.update(delta, this.alarm ? playerPos : null, this.walls);
      if (enemy.alive && enemy.canSee(this.player.body.x, this.player.body.y, this.lineBlocked.bind(this))) {
        this.onSpotted();
        return;
      }
      // melee contact
      if (
        enemy.alive &&
        Phaser.Math.Distance.Between(enemy.body.x, enemy.body.y, this.player.body.x, this.player.body.y) < 18
      ) {
        this.onSpotted();
        return;
      }
    }

    // win check
    if (this.checkWin()) {
      this.onWin();
    }

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
  }

  private checkWin(): boolean {
    const allDown = this.enemies.every((e) => !e.alive);
    const atExit =
      Phaser.Math.Distance.Between(this.player.body.x, this.player.body.y, this.exitZone.x, this.exitZone.y) < 20;

    switch (this.mission.objective) {
      case 'extract':
        return this.hasCase && atExit;
      case 'clear':
      case 'vip':
      case 'timed':
        return allDown;
      case 'silent':
        return allDown; // alarm affects rank only
      default:
        return allDown && atExit;
    }
  }

  private tryAttack(): void {
    if (!this.player.alive) return;
    const range = WEAPON_RANGE[this.player.weapon];
    const facing = this.player.facing;
    const origin = this.player.body;
    let hit = false;

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const dist = Phaser.Math.Distance.Between(origin.x, origin.y, enemy.body.x, enemy.body.y);
      if (dist > range) continue;
      const angleTo = Math.atan2(enemy.body.y - origin.y, enemy.body.x - origin.x);
      const diff = Math.abs(Phaser.Math.Angle.Wrap(angleTo - facing));
      const behind = Math.abs(Phaser.Math.Angle.Wrap(angleTo - enemy.facing)) > Math.PI * 0.65;
      const melee = this.player.weapon === 'fist' || this.player.weapon === 'bat' || this.player.weapon === 'knife';

      if (melee && (diff < 0.9 || behind)) {
        // shield blocks frontal melee
        if (enemy.type === 'shield' && !behind && diff < 0.8) continue;
        this.neutralizeEnemy(enemy);
        hit = true;
        break;
      }
      if (!melee && diff < 0.35 && !this.lineBlocked(origin.x, origin.y, enemy.body.x, enemy.body.y)) {
        this.neutralizeEnemy(enemy);
        hit = true;
        const charges = Number(this.registry.get('silencerCharges') || 0);
        if (charges > 0) {
          this.registry.set('silencerCharges', charges - 1);
        } else {
          this.raiseNoise(origin.x, origin.y, 160);
        }
        break;
      }
    }

    if (!hit && (this.player.weapon === 'pistol' || this.player.weapon === 'shotgun' || this.player.weapon === 'uzi')) {
      const charges = Number(this.registry.get('silencerCharges') || 0);
      if (charges > 0) this.registry.set('silencerCharges', charges - 1);
      else this.raiseNoise(origin.x, origin.y, 180);
    }
  }

  private neutralizeEnemy(enemy: EnemyActor): void {
    enemy.neutralize();
    // dissolve particles
    const particles = this.add.particles(enemy.body.x, enemy.body.y, 'pixel', {
      speed: { min: 40, max: 120 },
      scale: { start: 3, end: 0 },
      lifespan: 350,
      quantity: 12,
      tint: [0x2de2e6, 0xff2a6d],
    });
    this.time.delayedCall(400, () => particles.destroy());
  }

  private raiseNoise(x: number, y: number, radius: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (Phaser.Math.Distance.Between(enemy.body.x, enemy.body.y, x, y) < radius) {
        enemy.alert = 1;
        this.alarm = true;
      }
    }
  }

  private lineBlocked(x1: number, y1: number, x2: number, y2: number): boolean {
    const steps = 12;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
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

    // Instant restart < 0.4s feel: short flash then soft reset scene state
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
    // approximate total run time including previous deaths in this attempt chain is fine for slice
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

export function ensureTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('player')) return;
  const g = scene.make.graphics({ x: 0, y: 0 });

  g.fillStyle(0x2de2e6, 1);
  g.fillCircle(12, 12, 10);
  g.fillStyle(0x0b0d12, 1);
  g.fillTriangle(20, 12, 12, 8, 12, 16);
  g.generateTexture('player', 24, 24);
  g.clear();

  g.fillStyle(0xff2a6d, 1);
  g.fillCircle(12, 12, 10);
  g.generateTexture('enemy', 24, 24);
  g.clear();

  g.fillStyle(0x3a4254, 1);
  g.fillRect(0, 0, 32, 32);
  g.lineStyle(2, 0x2de2e6, 0.35);
  g.strokeRect(1, 1, 30, 30);
  g.generateTexture('wall', 32, 32);
  g.clear();

  g.fillStyle(0xffc857, 1);
  g.fillRect(4, 10, 16, 6);
  g.generateTexture('weapon', 24, 24);
  g.clear();

  g.fillStyle(0x7a5cff, 1);
  g.fillRect(4, 6, 16, 14);
  g.generateTexture('case', 24, 24);
  g.destroy();
}
