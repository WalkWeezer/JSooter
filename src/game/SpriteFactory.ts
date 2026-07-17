import Phaser from 'phaser';

/**
 * Procedural neon top-down sprites. Consistent palette, readable at 32px.
 */
export function createGameTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('player')) return;

  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  // --- floor / wall / props ---
  drawFloor(g, 0x171b26, 0x1c2230);
  g.generateTexture('floor_a', 32, 32);
  g.clear();
  drawFloor(g, 0x141821, 0x191e2a);
  g.generateTexture('floor_b', 32, 32);
  g.clear();

  // wall block
  g.fillStyle(0x2a3142, 1);
  g.fillRoundedRect(1, 1, 30, 30, 3);
  g.lineStyle(2, 0x2de2e6, 0.45);
  g.strokeRoundedRect(2, 2, 28, 28, 2);
  g.fillStyle(0x0b0d12, 0.35);
  g.fillRect(8, 8, 16, 16);
  g.generateTexture('wall', 32, 32);
  g.clear();

  // exit pad
  g.lineStyle(3, 0x39ff14, 0.9);
  g.strokeRoundedRect(4, 4, 24, 24, 4);
  g.fillStyle(0x39ff14, 0.2);
  g.fillRoundedRect(6, 6, 20, 20, 3);
  g.generateTexture('exit', 32, 32);
  g.clear();

  // case
  g.fillStyle(0x7a5cff, 1);
  g.fillRoundedRect(6, 8, 20, 16, 3);
  g.lineStyle(2, 0xcbb8ff, 1);
  g.strokeRoundedRect(6, 8, 20, 16, 3);
  g.fillStyle(0xffc857, 1);
  g.fillCircle(16, 16, 3);
  g.generateTexture('case', 32, 32);
  g.clear();

  // --- player ---
  drawCourier(g, 0x2de2e6, 0x0b0d12, true);
  g.generateTexture('player', 32, 32);
  g.clear();

  // --- enemies ---
  drawCourier(g, 0xff2a6d, 0x1a0a10, false);
  g.generateTexture('enemy_patrol', 32, 32);
  g.clear();

  drawCourier(g, 0xff8844, 0x1a1008, false);
  // shotgun mark
  g.fillStyle(0xffc857, 1);
  g.fillRect(22, 14, 8, 4);
  g.generateTexture('enemy_shotgun', 32, 32);
  g.clear();

  drawCourier(g, 0x88aaff, 0x0a1020, false);
  // shield plate in front
  g.fillStyle(0xc0d4ff, 0.95);
  g.fillRoundedRect(20, 8, 6, 16, 2);
  g.lineStyle(1, 0xffffff, 0.8);
  g.strokeRoundedRect(20, 8, 6, 16, 2);
  g.generateTexture('enemy_shield', 32, 32);
  g.clear();

  drawCourier(g, 0xc44dff, 0x140818, false);
  g.fillStyle(0xffffff, 0.8);
  g.fillRect(24, 14, 6, 2);
  g.generateTexture('enemy_sniper', 32, 32);
  g.clear();

  // neutralized ghost
  drawCourier(g, 0x2de2e6, 0x0b0d12, false);
  g.generateTexture('enemy_down', 32, 32);
  g.clear();

  // --- weapons (pickup + held overlays are distinct shapes) ---
  drawWeaponFist(g);
  g.generateTexture('wpn_fist', 32, 32);
  g.clear();
  drawWeaponBat(g);
  g.generateTexture('wpn_bat', 32, 32);
  g.clear();
  drawWeaponKnife(g);
  g.generateTexture('wpn_knife', 32, 32);
  g.clear();
  drawWeaponPistol(g);
  g.generateTexture('wpn_pistol', 32, 32);
  g.clear();
  drawWeaponShotgun(g);
  g.generateTexture('wpn_shotgun', 32, 32);
  g.clear();
  drawWeaponUzi(g);
  g.generateTexture('wpn_uzi', 32, 32);
  g.clear();

  // bullet
  g.fillStyle(0xffc857, 1);
  g.fillCircle(4, 4, 3);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(4, 4, 1.5);
  g.generateTexture('bullet', 8, 8);
  g.clear();

  // muzzle flash
  g.fillStyle(0xffc857, 1);
  g.fillTriangle(0, 8, 16, 4, 16, 12);
  g.fillStyle(0xffffff, 0.9);
  g.fillTriangle(4, 8, 14, 6, 14, 10);
  g.generateTexture('muzzle', 16, 16);
  g.clear();

  // particle pixel
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 0, 4, 4);
  g.generateTexture('pixel', 4, 4);
  g.clear();

  // spark
  g.fillStyle(0x2de2e6, 1);
  g.fillCircle(4, 4, 4);
  g.generateTexture('spark', 8, 8);
  g.destroy();
}

function drawFloor(g: Phaser.GameObjects.Graphics, base: number, accent: number): void {
  g.fillStyle(base, 1);
  g.fillRect(0, 0, 32, 32);
  g.fillStyle(accent, 0.5);
  g.fillRect(0, 0, 32, 1);
  g.fillRect(0, 0, 1, 32);
  g.fillStyle(0x2de2e6, 0.06);
  g.fillCircle(24, 8, 3);
}

function drawCourier(g: Phaser.GameObjects.Graphics, neon: number, dark: number, isPlayer: boolean): void {
  // body
  g.fillStyle(dark, 1);
  g.fillCircle(16, 16, 11);
  g.lineStyle(2, neon, 1);
  g.strokeCircle(16, 16, 11);
  // head direction wedge
  g.fillStyle(neon, 1);
  g.fillTriangle(28, 16, 18, 11, 18, 21);
  // visor
  g.fillStyle(0xffffff, isPlayer ? 0.85 : 0.5);
  g.fillCircle(16, 16, 3);
  if (isPlayer) {
    g.lineStyle(1, 0x39ff14, 0.8);
    g.strokeCircle(16, 16, 13);
  }
}

function drawWeaponFist(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0xffc857, 1);
  g.fillCircle(16, 16, 7);
  g.lineStyle(2, 0xffffff, 0.7);
  g.strokeCircle(16, 16, 7);
}

function drawWeaponBat(g: Phaser.GameObjects.Graphics): void {
  g.lineStyle(5, 0xc49a6c, 1);
  g.lineBetween(8, 24, 24, 8);
  g.fillStyle(0xffc857, 1);
  g.fillCircle(24, 8, 4);
}

function drawWeaponKnife(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0xc0c8d8, 1);
  g.fillTriangle(8, 22, 14, 8, 18, 10);
  g.fillStyle(0x5a4030, 1);
  g.fillRect(8, 20, 8, 4);
}

function drawWeaponPistol(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x9aa3b5, 1);
  g.fillRoundedRect(8, 12, 18, 7, 2);
  g.fillStyle(0x5a6478, 1);
  g.fillRect(10, 18, 5, 8);
  g.fillStyle(0xffc857, 1);
  g.fillRect(24, 13, 4, 4);
}

function drawWeaponShotgun(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x6b5344, 1);
  g.fillRoundedRect(4, 13, 24, 6, 2);
  g.fillStyle(0x3a3030, 1);
  g.fillRect(6, 18, 6, 8);
  g.fillStyle(0xff8844, 1);
  g.fillCircle(26, 16, 3);
}

function drawWeaponUzi(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x4a5568, 1);
  g.fillRoundedRect(6, 11, 20, 8, 2);
  g.fillStyle(0x2a3142, 1);
  g.fillRect(10, 18, 4, 8);
  g.fillRect(16, 19, 8, 3);
  g.fillStyle(0x2de2e6, 1);
  g.fillRect(24, 12, 5, 5);
}

export const WEAPON_TEXTURE: Record<string, string> = {
  fist: 'wpn_fist',
  bat: 'wpn_bat',
  knife: 'wpn_knife',
  pistol: 'wpn_pistol',
  shotgun: 'wpn_shotgun',
  uzi: 'wpn_uzi',
};

export const ENEMY_TEXTURE: Record<string, string> = {
  patrol: 'enemy_patrol',
  shotgun: 'enemy_shotgun',
  shield: 'enemy_shield',
  sniper: 'enemy_sniper',
};
