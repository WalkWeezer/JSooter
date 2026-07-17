import Phaser from 'phaser';
import type { MissionDef } from './types';

export type FloorKind = 'lounge' | 'dance' | 'bar' | 'bath' | 'corridor';

const FLOOR_TEX: Record<FloorKind, string> = {
  lounge: 'floor_lounge',
  dance: 'floor_dance',
  bar: 'floor_bar',
  bath: 'floor_bath',
  corridor: 'floor_corridor',
};

const ROOM_PROPS: Record<FloorKind, string[]> = {
  dance: ['prop_dj', 'prop_stool', 'prop_table'],
  lounge: ['prop_sofa', 'prop_table', 'prop_plant', 'prop_sofa'],
  bar: ['prop_bar', 'prop_stool', 'prop_stool', 'prop_plant'],
  bath: ['prop_plant'],
  corridor: ['prop_plant'],
};

/**
 * Paint levels closer to docs/visual-style/neontron-topdown-gameplay.png
 * — zoned floors (dance / bar / lounge / bath), solid walls + edge neon, club props.
 */
export function paintClubLevel(
  scene: Phaser.Scene,
  m: MissionDef,
  wallSet: Set<string>,
): void {
  const ts = m.tileSize;
  const kinds = assignFloorZones(m, wallSet);

  for (let y = 0; y < m.height; y++) {
    for (let x = 0; x < m.width; x++) {
      if (wallSet.has(`${x},${y}`)) continue;
      const kind = kinds[y][x];
      const tex = FLOOR_TEX[kind];
      const key = scene.textures.exists(tex) ? tex : 'floor_lounge';
      scene.add
        .image(x * ts + ts / 2, y * ts + ts / 2, key)
        .setDisplaySize(ts + 1, ts + 1)
        .setDepth(0);
    }
  }

  // Soft washes per zone (GDD atmosphere)
  const washes: Array<[number, number, number, number]> = [
    [m.width * 0.5 * ts, m.height * 0.45 * ts, 0xff2a6d, 0.06], // dance
    [m.width * 0.18 * ts, m.height * 0.5 * ts, 0xffc857, 0.05], // bar
    [m.width * 0.78 * ts, m.height * 0.55 * ts, 0x7a5cff, 0.05], // lounge
    [m.width * 0.82 * ts, m.height * 0.22 * ts, 0x2de2e6, 0.05], // bath
  ];
  for (const [x, y, color, a] of washes) {
    scene.add.circle(x, y, ts * 3.2, color, a).setDepth(1);
  }
}

export function paintWalls(
  scene: Phaser.Scene,
  m: MissionDef,
  wallSet: Set<string>,
  wallsGroup: Phaser.Physics.Arcade.StaticGroup,
  wallRects: Phaser.Geom.Rectangle[],
): void {
  const ts = m.tileSize;

  for (const [tx, ty] of m.walls) {
    // drop shadow for height
    scene.add.rectangle(tx * ts + ts / 2 + 2, ty * ts + ts / 2 + 3, ts, ts, 0x000000, 0.35).setDepth(11);
    const img = wallsGroup.create(tx * ts + ts / 2, ty * ts + ts / 2, 'wall') as Phaser.Physics.Arcade.Image;
    img.setDisplaySize(ts + 1, ts + 1);
    img.setDepth(12);
    img.refreshBody();
    wallRects.push(new Phaser.Geom.Rectangle(tx * ts, ty * ts, ts, ts));
  }

  for (const [tx, ty] of m.walls) {
    const openN = !wallSet.has(`${tx},${ty - 1}`) && inMap(m, tx, ty - 1);
    const openS = !wallSet.has(`${tx},${ty + 1}`) && inMap(m, tx, ty + 1);
    const openW = !wallSet.has(`${tx - 1},${ty}`) && inMap(m, tx - 1, ty);
    const openE = !wallSet.has(`${tx + 1},${ty}`) && inMap(m, tx + 1, ty);

    if (openN) {
      scene.add
        .image(tx * ts + ts / 2, ty * ts + 3, 'neon_strip_m')
        .setDisplaySize(ts * 1.02, 8)
        .setDepth(13)
        .setAlpha(1);
    }
    if (openS) {
      scene.add
        .image(tx * ts + ts / 2, ty * ts + ts - 3, 'neon_strip_c')
        .setDisplaySize(ts * 1.02, 7)
        .setDepth(13)
        .setAlpha(0.95);
    }
    if (openW) {
      scene.add
        .image(tx * ts + 3, ty * ts + ts / 2, 'neon_strip_m')
        .setDisplaySize(7, ts * 1.02)
        .setDepth(13)
        .setAlpha(0.85);
    }
    if (openE) {
      scene.add
        .image(tx * ts + ts - 3, ty * ts + ts / 2, 'neon_strip_c')
        .setDisplaySize(7, ts * 1.02)
        .setDepth(13)
        .setAlpha(0.85);
    }
  }
}

export function placeRoomDecor(
  scene: Phaser.Scene,
  m: MissionDef,
  wallSet: Set<string>,
): void {
  const ts = m.tileSize;
  const kinds = assignFloorZones(m, wallSet);

  const blocked = new Set<string>();
  blocked.add(`${m.playerSpawn[0]},${m.playerSpawn[1]}`);
  blocked.add(`${m.exit[0]},${m.exit[1]}`);
  if (m.caseItem) blocked.add(`${m.caseItem[0]},${m.caseItem[1]}`);
  for (const e of m.enemies) blocked.add(`${e.x},${e.y}`);
  for (const w of m.weapons) blocked.add(`${w.x},${w.y}`);
  for (const [x, y] of m.walls) blocked.add(`${x},${y}`);

  // NEONTRON sign
  for (let x = 2; x < m.width - 3; x++) {
    if (wallSet.has(`${x},1`) && !wallSet.has(`${x},2`)) {
      if (scene.textures.exists('prop_sign')) {
        scene.add
          .image(x * ts + ts, 1 * ts + ts * 0.55, 'prop_sign')
          .setDisplaySize(ts * 3.6, ts * 0.8)
          .setDepth(14);
        const glow = scene.add.circle(x * ts + ts, 2 * ts + 6, ts * 1.8, 0xff2a6d, 0.12).setDepth(1);
        scene.tweens.add({ targets: glow, alpha: 0.2, duration: 900, yoyo: true, repeat: -1 });
      }
      break;
    }
  }

  // Collect open cells by zone
  const byKind: Record<FloorKind, [number, number][]> = {
    lounge: [],
    dance: [],
    bar: [],
    bath: [],
    corridor: [],
  };
  for (let y = 1; y < m.height - 1; y++) {
    for (let x = 1; x < m.width - 1; x++) {
      if (wallSet.has(`${x},${y}`) || blocked.has(`${x},${y}`)) continue;
      const nearWall =
        wallSet.has(`${x - 1},${y}`) ||
        wallSet.has(`${x + 1},${y}`) ||
        wallSet.has(`${x},${y - 1}`) ||
        wallSet.has(`${x},${y + 1}`);
      if (!nearWall && kinds[y][x] !== 'dance') continue;
      byKind[kinds[y][x]].push([x, y]);
    }
  }

  for (const kind of Object.keys(byKind) as FloorKind[]) {
    const cells = byKind[kind];
    const props = ROOM_PROPS[kind];
    const budget =
      kind === 'lounge' ? 5 : kind === 'bar' ? 4 : kind === 'dance' ? 3 : kind === 'bath' ? 1 : 2;
    let placed = 0;
    const step = Math.max(1, Math.floor(cells.length / Math.max(1, budget)));
    for (let i = 0; i < cells.length && placed < budget; i += step) {
      const [x, y] = cells[i];
      if (blocked.has(`${x},${y}`)) continue;
      let close = false;
      for (const b of blocked) {
        const [bx, by] = b.split(',').map(Number);
        if (Math.abs(bx - x) + Math.abs(by - y) < 2) {
          close = true;
          break;
        }
      }
      if (close) continue;
      blocked.add(`${x},${y}`);
      const tex = props[placed % props.length];
      if (!scene.textures.exists(tex)) continue;
      const scale =
        tex === 'prop_sofa' || tex === 'prop_bar' || tex === 'prop_dj'
          ? 1.7
          : tex === 'prop_table'
            ? 1.2
            : 1.05;
      scene.add
        .image(x * ts + ts / 2, y * ts + ts / 2, tex)
        .setDisplaySize(ts * scale, ts * scale)
        .setDepth(4);
      placed += 1;
    }
  }
}

function inMap(m: MissionDef, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < m.width && y < m.height;
}

/** Spatial zones inspired by GDD top-down club layout — not flood-fill of whole map. */
function assignFloorZones(m: MissionDef, wallSet: Set<string>): FloorKind[][] {
  const grid: FloorKind[][] = [];
  const cx = (m.width - 1) / 2;
  const cy = (m.height - 1) / 2;

  for (let y = 0; y < m.height; y++) {
    grid[y] = [];
    for (let x = 0; x < m.width; x++) {
      if (wallSet.has(`${x},${y}`)) {
        grid[y][x] = 'corridor';
        continue;
      }
      const nx = x / Math.max(1, m.width - 1);
      const ny = y / Math.max(1, m.height - 1);
      const dx = (x - cx) / m.width;
      const dy = (y - cy) / m.height;
      const dist = Math.hypot(dx, dy);

      // Bathroom pocket — top-right
      if (nx > 0.72 && ny < 0.38) {
        grid[y][x] = 'bath';
      }
      // Bar — left side
      else if (nx < 0.28) {
        grid[y][x] = 'bar';
      }
      // Dance floor — center
      else if (dist < 0.28) {
        grid[y][x] = 'dance';
      }
      // Lounge — right / lower
      else if (nx > 0.55 || ny > 0.62) {
        grid[y][x] = 'lounge';
      } else {
        grid[y][x] = 'corridor';
      }
    }
  }
  return grid;
}
