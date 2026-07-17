import Phaser from 'phaser';

/** Texture keys used across the game. Loaded as PNG from public/assets/sprites. */
export const SPRITE_FILES: Record<string, string> = {
  player: 'assets/sprites/player.png',
  enemy_patrol: 'assets/sprites/enemy_patrol.png',
  enemy_shotgun: 'assets/sprites/enemy_shotgun.png',
  enemy_shield: 'assets/sprites/enemy_shield.png',
  enemy_sniper: 'assets/sprites/enemy_sniper.png',
  enemy_down: 'assets/sprites/enemy_down.png',
  wpn_fist: 'assets/sprites/wpn_fist.png',
  wpn_bat: 'assets/sprites/wpn_bat.png',
  wpn_knife: 'assets/sprites/wpn_knife.png',
  wpn_pistol: 'assets/sprites/wpn_pistol.png',
  wpn_shotgun: 'assets/sprites/wpn_shotgun.png',
  wpn_uzi: 'assets/sprites/wpn_uzi.png',
  case: 'assets/sprites/case.png',
  floor_a: 'assets/sprites/floor_a.png',
  floor_b: 'assets/sprites/floor_b.png',
  wall: 'assets/sprites/wall.png',
  exit: 'assets/sprites/exit.png',
  bullet: 'assets/sprites/bullet.png',
  muzzle: 'assets/sprites/muzzle.png',
  spark: 'assets/sprites/spark.png',
  pixel: 'assets/sprites/pixel.png',
};

export function preloadGameSprites(scene: Phaser.Scene): void {
  for (const [key, path] of Object.entries(SPRITE_FILES)) {
    if (!scene.textures.exists(key)) {
      scene.load.image(key, path);
    }
  }
}

/** Fallback procedural textures if a PNG failed to load. */
export function ensureFallbackTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('player') && scene.textures.exists('bullet')) return;
  // Minimal emergency fallbacks
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  if (!scene.textures.exists('pixel')) {
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 4, 4);
    g.generateTexture('pixel', 4, 4);
    g.clear();
  }
  if (!scene.textures.exists('bullet')) {
    g.fillStyle(0xffc857, 1);
    g.fillCircle(4, 4, 3);
    g.generateTexture('bullet', 8, 8);
    g.clear();
  }
  g.destroy();
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

/**
 * Cast a ray and return the distance until a wall hit (or maxRange).
 */
export function raycastWalls(
  x: number,
  y: number,
  angle: number,
  maxRange: number,
  walls: Phaser.Geom.Rectangle[],
  steps = 28,
): number {
  let hitDist = maxRange;
  for (let i = 1; i <= steps; i++) {
    const d = (maxRange * i) / steps;
    const px = x + Math.cos(angle) * d;
    const py = y + Math.sin(angle) * d;
    for (const r of walls) {
      if (r.contains(px, py)) {
        hitDist = Math.max(0, d - maxRange / steps);
        return hitDist;
      }
    }
  }
  return hitDist;
}

export function segmentHitsWall(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  walls: Phaser.Geom.Rectangle[],
  steps = 16,
): boolean {
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    for (const r of walls) {
      if (r.contains(x, y)) return true;
    }
  }
  return false;
}
