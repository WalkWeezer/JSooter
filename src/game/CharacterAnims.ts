import Phaser from 'phaser';

export const ANIM_FRAME = 64;
export const ANIM_COLS = 8;

/** Player sheet rows: idle, walk, melee, ranged, death */
export const PLAYER_ANIM_SHEET = 'player_anim';

/** Enemy sheet rows: idle, walk, alert, death */
export const ENEMY_ANIM_SHEETS: Record<string, string> = {
  patrol: 'enemy_patrol_anim',
  shotgun: 'enemy_shotgun_anim',
  shield: 'enemy_shield_anim',
  sniper: 'enemy_sniper_anim',
};

export const ANIM_SHEET_FILES: Record<string, string> = {
  player_anim: 'assets/sprites/anim/player_anim.png',
  enemy_patrol_anim: 'assets/sprites/anim/enemy_patrol_anim.png',
  enemy_shotgun_anim: 'assets/sprites/anim/enemy_shotgun_anim.png',
  enemy_shield_anim: 'assets/sprites/anim/enemy_shield_anim.png',
  enemy_sniper_anim: 'assets/sprites/anim/enemy_sniper_anim.png',
};

export function preloadCharacterAnims(scene: Phaser.Scene): void {
  for (const [key, path] of Object.entries(ANIM_SHEET_FILES)) {
    if (!scene.textures.exists(key)) {
      scene.load.spritesheet(key, path, {
        frameWidth: ANIM_FRAME,
        frameHeight: ANIM_FRAME,
      });
    }
  }
}

function ensureAnim(
  scene: Phaser.Scene,
  key: string,
  sheet: string,
  start: number,
  end: number,
  frameRate: number,
  repeat: number,
): void {
  if (scene.anims.exists(key)) return;
  scene.anims.create({
    key,
    frames: scene.anims.generateFrameNumbers(sheet, { start, end }),
    frameRate,
    repeat,
  });
}

/** Register all character animations once textures are loaded. */
export function registerCharacterAnims(scene: Phaser.Scene): void {
  // Player — 5 rows × 8 frames
  ensureAnim(scene, 'player_idle', PLAYER_ANIM_SHEET, 0, 7, 8, -1);
  ensureAnim(scene, 'player_walk', PLAYER_ANIM_SHEET, 8, 15, 12, -1);
  ensureAnim(scene, 'player_melee', PLAYER_ANIM_SHEET, 16, 23, 16, 0);
  ensureAnim(scene, 'player_shoot', PLAYER_ANIM_SHEET, 24, 31, 16, 0);
  ensureAnim(scene, 'player_death', PLAYER_ANIM_SHEET, 32, 39, 12, 0);

  for (const type of Object.keys(ENEMY_ANIM_SHEETS)) {
    const sheet = ENEMY_ANIM_SHEETS[type];
    ensureAnim(scene, `enemy_${type}_idle`, sheet, 0, 7, 7, -1);
    ensureAnim(scene, `enemy_${type}_walk`, sheet, 8, 15, 10, -1);
    ensureAnim(scene, `enemy_${type}_alert`, sheet, 16, 23, 10, -1);
    ensureAnim(scene, `enemy_${type}_death`, sheet, 24, 31, 12, 0);
  }
}

export function playAnim(
  sprite: Phaser.GameObjects.Sprite,
  key: string,
  ignoreIfPlaying = true,
): void {
  if (!sprite.active || !sprite.anims) return;
  if (ignoreIfPlaying && sprite.anims.isPlaying && sprite.anims.currentAnim?.key === key) {
    return;
  }
  // Don't interrupt one-shot attack/death with locomotion
  const cur = sprite.anims.currentAnim?.key;
  if (
    ignoreIfPlaying &&
    cur &&
    (cur.endsWith('_melee') || cur.endsWith('_shoot') || cur.endsWith('_death')) &&
    sprite.anims.isPlaying
  ) {
    if (!key.endsWith('_death')) return;
  }
  sprite.play(key, ignoreIfPlaying);
}
