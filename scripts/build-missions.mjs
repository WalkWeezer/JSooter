#!/usr/bin/env node
/**
 * Neontron mission builder — room-rect authoring with punched doors.
 *
 * LEVEL DESIGN BRIEF
 * ==================
 * TUT_01 SIGNAL CHECK — Move, pick bat, backstab one idle patrol, EXIT.
 * TUT_02 REAR ENTRY — Patrol walks a beat; learn cones; side path; EXIT.
 * TUT_03 CASE DRILL — Extract: case mid-room, shotgun faces main door, north flank.
 * PLAT_01 FIRST ADDRESS — 3-room spine, 2 patrols + shotgun choke, dual routes.
 * PLAT_02 CHOKE POINT — Shotgun on main door; sniper on long hall; side loop.
 * PLAT_03 BLACKOUT HARBOR — GDD App A extract: 2 patrol, shield@case, shotgun@door.
 * PLAT_04 VIP SHADOW — Kill amber VIP (shield), ignore foyer; EXIT.
 * PLAT_05 WET DOCK — Silent clear; overlapping patrols; knife/bat only; noAlarm S.
 * PLAT_06 KNIFE PROTOCOL — Tight cubicle melee maze; shotgun last choke.
 * PLAT_07 GRID SWEEP — Three lanes, all archetypes, aggression vs stealth.
 * PLAT_08 PLAT FINALE — Timed extract: case behind VIP+shotgun, tight S clock.
 * PORT_01 ZARYA GATE — Port extract opener, deeper case, more patrols.
 * PORT_02 WAREHOUSE RUN — Aisle extract, long sightlines, snipers.
 * PORT_03 PORT STORM — Climax clear, pocketed arena, dual shotguns.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'src/data/missions');

/**
 * Build a sealed grid from room rectangles.
 * room: {x,y,w,h, doors:['N'|'S'|'E'|'W'| 'N:3' (offset) ...]}
 * Doors punch the perimeter of that room.
 */
function buildGrid(width, height, rooms) {
  const g = Array.from({ length: height }, () => Array.from({ length: width }, () => '#'));
  const fill = (x0, y0, x1, y1, ch) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (x >= 0 && y >= 0 && x < width && y < height) g[y][x] = ch;
    }
  };
  // Carve rooms (interior open, keep outer frame as walls unless punched)
  for (const r of rooms) {
    fill(r.x, r.y, r.x + r.w - 1, r.y + r.h - 1, '#'); // ensure wall shell
    fill(r.x + 1, r.y + 1, r.x + r.w - 2, r.y + r.h - 2, '.');
    for (const d of r.doors || []) {
      const [dir, offStr] = d.split(':');
      const off = offStr != null ? Number(offStr) : Math.floor((dir === 'N' || dir === 'S' ? r.w : r.h) / 2);
      if (dir === 'N') g[r.y][r.x + off] = '.';
      if (dir === 'S') g[r.y + r.h - 1][r.x + off] = '.';
      if (dir === 'W') g[r.y + off][r.x] = '.';
      if (dir === 'E') g[r.y + off][r.x + r.w - 1] = '.';
    }
  }
  // Seal true perimeter always
  for (let x = 0; x < width; x++) {
    g[0][x] = '#';
    g[height - 1][x] = '#';
  }
  for (let y = 0; y < height; y++) {
    g[y][0] = '#';
    g[y][width - 1] = '#';
  }
  return g;
}

function place(g, x, y, ch) {
  if (y < 0 || x < 0 || y >= g.length || x >= g[0].length) throw new Error(`OOB ${ch}@${x},${y}`);
  if (g[y][x] === '#') throw new Error(`wall under ${ch}@${x},${y}`);
  g[y][x] = ch;
}

function toAscii(g) {
  return g.map((r) => r.join('')).join('\n');
}

function parseAscii(ascii, spec) {
  const rows = ascii.trim().split('\n');
  const height = rows.length;
  const width = rows[0].length;
  const walls = [];
  let spawn = null;
  let exit = null;
  let caseItem = null;
  const enemies = [];
  const weapons = [];
  const ENEMY = { e: 'patrol', s: 'shotgun', h: 'shield', H: 'shield', n: 'sniper' };
  const WEAPON = { b: 'bat', k: 'knife', p: 'pistol', g: 'shotgun', u: 'uzi' };
  /** @type {Record<string, {route?: number[][], facing?: number}>} */
  const meta = spec.enemyMeta || {};

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ch = rows[y][x];
      if (ch === '#') walls.push([x, y]);
      else if (ch === 'P') spawn = [x, y];
      else if (ch === 'X') exit = [x, y];
      else if (ch === 'C') caseItem = [x, y];
      else if (ENEMY[ch]) {
        const key = `${x},${y}`;
        const m = meta[key] || {};
        enemies.push({
          type: ENEMY[ch],
          x,
          y,
          ...(ch === 'H' || m.vip ? { vip: true } : {}),
          ...(m.route?.length ? { route: m.route } : {}),
          ...(m.facing != null ? { facing: m.facing } : {}),
        });
      } else if (WEAPON[ch]) weapons.push({ type: WEAPON[ch], x, y });
      else if (ch !== '.') throw new Error(`${spec.id}: bad '${ch}' @${x},${y}`);
    }
  }
  if (!spawn || !exit) throw new Error(`${spec.id}: need P and X`);
  if (spec.objective === 'extract' && !caseItem) throw new Error(`${spec.id}: extract needs C`);

  if (spec.objective === 'vip' && !enemies.some((e) => e.vip)) {
    const s = enemies.find((e) => e.type === 'shield');
    if (s) s.vip = true;
    else throw new Error(`${spec.id}: vip needs H`);
  }

  return {
    id: spec.id,
    chapter: spec.chapter,
    objective: spec.objective,
    playerSpawn: spawn,
    exit,
    tileSize: 32,
    width,
    height,
    walls,
    enemies,
    weapons,
    ...(caseItem ? { caseItem } : {}),
    briefingKey: `briefing.${spec.id}`,
    sRankRules: {
      maxDeaths: spec.maxDeaths ?? 1,
      maxTimeSec: spec.maxTimeSec ?? 60,
      ...(spec.noAlarm ? { noAlarm: true } : {}),
    },
  };
}

function wallSet(m) {
  return new Set(m.walls.map(([x, y]) => `${x},${y}`));
}
function open(m, x, y, W) {
  return x >= 0 && y >= 0 && x < m.width && y < m.height && !W.has(`${x},${y}`);
}
function flood(m, start) {
  const W = wallSet(m);
  const seen = new Set([`${start[0]},${start[1]}`]);
  const q = [start];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      const k = `${nx},${ny}`;
      if (seen.has(k) || !open(m, nx, ny, W)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return seen;
}
function validate(m) {
  const errs = [];
  const reach = flood(m, m.playerSpawn);
  for (const [label, pos] of [
    ['exit', m.exit],
    ...(m.caseItem ? [['case', m.caseItem]] : []),
    ...m.enemies.map((e, i) => [`enemy${i}`, [e.x, e.y]]),
    ...m.weapons.map((w, i) => [`weapon${i}`, [w.x, w.y]]),
  ]) {
    if (!reach.has(`${pos[0]},${pos[1]}`)) errs.push(`${label}@${pos}`);
  }
  for (const [i, e] of m.enemies.entries()) {
    for (const [rx, ry] of e.route || []) {
      if (!reach.has(`${rx},${ry}`)) errs.push(`route e${i}@${rx},${ry}`);
    }
  }
  const W = wallSet(m);
  let orphans = 0;
  for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) {
    if (open(m, x, y, W) && !reach.has(`${x},${y}`)) orphans++;
  }
  if (orphans) errs.push(`orphans=${orphans}`);
  return errs;
}

/** @type {any[]} */
const LEVELS = [];

// ---- TUT_01: single chamber with center pillars ----
{
  const w = 14;
  const h = 11;
  const g = buildGrid(w, h, [{ x: 0, y: 0, w, h, doors: [] }]);
  // pillars
  for (const [x, y] of [
    [4, 4],
    [5, 4],
    [6, 4],
    [4, 7],
    [5, 7],
    [6, 7],
  ])
    g[y][x] = '#';
  place(g, 2, 2, 'P');
  place(g, 3, 3, 'b');
  place(g, 9, 5, 'e');
  place(g, 11, 8, 'X');
  LEVELS.push({
    id: 'tut_01',
    chapter: 0,
    objective: 'clear',
    maxDeaths: 2,
    maxTimeSec: 90,
    enemyMeta: {
      '9,5': { facing: 0 },
    },
    ascii: toAscii(g),
  });
}

// ---- TUT_02: hall with center booth, patrol inside booth opening south ----
{
  const w = 16;
  const h = 12;
  const g = buildGrid(w, h, [{ x: 0, y: 0, w, h, doors: [] }]);
  // center booth with E and W doors (patrol walks N-S inside)
  for (let y = 3; y <= 8; y++) for (let x = 6; x <= 10; x++) g[y][x] = '#';
  for (let y = 4; y <= 7; y++) for (let x = 7; x <= 9; x++) g[y][x] = '.';
  g[5][6] = '.'; // west door
  g[5][10] = '.'; // east door
  place(g, 2, 2, 'P');
  place(g, 3, 3, 'b');
  place(g, 8, 5, 'e');
  place(g, 13, 9, 'X');
  LEVELS.push({
    id: 'tut_02',
    chapter: 0,
    objective: 'clear',
    maxDeaths: 2,
    maxTimeSec: 80,
    enemyMeta: {
      '8,5': { route: [[8, 4], [8, 7]], facing: 180 },
    },
    ascii: toAscii(g),
  });
}

// ---- TUT_03: foyer | case room | exit hall with shotgun ----
{
  const w = 18;
  const h = 13;
  const g2 = buildGrid(w, h, [{ x: 0, y: 0, w, h, doors: [] }]);
  // vertical dividers with doors (north flank + south choke)
  for (let y = 2; y <= 10; y++) {
    g2[y][5] = '#';
    g2[y][12] = '#';
  }
  g2[3][5] = '.'; // north path into case bay
  g2[8][5] = '.'; // south path
  g2[3][12] = '.'; // north flank to exit
  g2[8][12] = '.'; // shotgun door (faces west)
  place(g2, 2, 2, 'P');
  place(g2, 2, 4, 'b');
  place(g2, 2, 9, 'k');
  place(g2, 8, 5, 'C');
  place(g2, 9, 6, 'e');
  place(g2, 14, 8, 's');
  place(g2, 15, 10, 'X');
  LEVELS.push({
    id: 'tut_03',
    chapter: 0,
    objective: 'extract',
    maxDeaths: 1,
    maxTimeSec: 70,
    noAlarm: true,
    enemyMeta: {
      '9,6': { route: [[7, 4], [10, 4], [10, 7], [7, 7]], facing: 90 },
      '14,8': { facing: 180 },
    },
    ascii: toAscii(g2),
  });
}

// ---- PLAT_01: three bays ----
{
  const w = 22;
  const h = 14;
  const g = buildGrid(w, h, [{ x: 0, y: 0, w, h, doors: [] }]);
  // two vertical dividers
  for (let y = 2; y <= 11; y++) {
    g[y][7] = '#';
    g[y][14] = '#';
  }
  // doors: north fast path + south safe path
  g[3][7] = '.';
  g[10][7] = '.';
  g[3][14] = '.';
  g[10][14] = '.';
  // shotgun sits in middle bay facing west door
  place(g, 2, 2, 'P');
  place(g, 3, 3, 'b');
  place(g, 3, 8, 'k');
  place(g, 4, 5, 'e');
  place(g, 10, 6, 's');
  place(g, 11, 4, 'e');
  place(g, 18, 11, 'X');
  LEVELS.push({
    id: 'plat_01',
    chapter: 1,
    objective: 'clear',
    maxDeaths: 1,
    maxTimeSec: 70,
    enemyMeta: {
      '4,5': { route: [[3, 4], [3, 9]], facing: 90 },
      '10,6': { facing: 180 },
      '11,4': { route: [[10, 3], [12, 3]], facing: 0 },
    },
    ascii: toAscii(g),
  });
}

// ---- PLAT_02: choke room center ----
{
  const w = 24;
  const h = 14;
  const g = buildGrid(w, h, [{ x: 0, y: 0, w, h, doors: [] }]);
  // central killbox
  for (let y = 3; y <= 10; y++) for (let x = 8; x <= 15; x++) g[y][x] = '#';
  for (let y = 4; y <= 9; y++) for (let x = 9; x <= 14; x++) g[y][x] = '.';
  g[6][8] = '.'; // west door (shotgun faces)
  g[6][15] = '.'; // east door
  g[3][11] = '.'; // north vent
  g[10][11] = '.'; // south vent
  place(g, 2, 2, 'P');
  place(g, 3, 3, 'b');
  place(g, 4, 7, 'e');
  place(g, 11, 6, 's');
  place(g, 12, 5, 'k');
  place(g, 18, 6, 'n');
  place(g, 21, 11, 'X');
  LEVELS.push({
    id: 'plat_02',
    chapter: 1,
    objective: 'clear',
    maxDeaths: 1,
    maxTimeSec: 65,
    enemyMeta: {
      '4,7': { route: [[3, 5], [6, 5], [6, 9], [3, 9]], facing: 0 },
      '11,6': { facing: 180 },
      '18,6': { facing: 270 },
    },
    ascii: toAscii(g),
  });
}

// ---- PLAT_03: GDD App A ----
{
  const w = 26;
  const h = 15;
  const g = buildGrid(w, h, [{ x: 0, y: 0, w, h, doors: [] }]);
  // left stairs corridor
  for (let y = 4; y <= 12; y++) g[y][6] = '#';
  g[5][6] = '.';
  g[11][6] = '.';
  // case vault center
  for (let y = 4; y <= 10; y++) for (let x = 9; x <= 16; x++) g[y][x] = '#';
  for (let y = 5; y <= 9; y++) for (let x = 10; x <= 15; x++) g[y][x] = '.';
  g[5][9] = '.'; // west into vault
  g[7][16] = '.'; // east out
  g[10][12] = '.'; // south shotgun choke
  // right patrol wing divider
  for (let y = 4; y <= 12; y++) g[y][19] = '#';
  g[7][19] = '.';
  g[11][19] = '.';
  place(g, 2, 2, 'P');
  place(g, 3, 3, 'b');
  place(g, 3, 7, 'k');
  place(g, 3, 5, 'e');
  place(g, 12, 6, 'C');
  place(g, 13, 7, 'H');
  place(g, 12, 11, 's');
  place(g, 22, 8, 'e');
  place(g, 23, 12, 'X');
  LEVELS.push({
    id: 'plat_03',
    chapter: 1,
    objective: 'extract',
    maxDeaths: 0,
    maxTimeSec: 55,
    noAlarm: true,
    enemyMeta: {
      '3,5': { route: [[2, 4], [4, 4], [4, 8], [2, 8]], facing: 90 },
      '13,7': { facing: 90 },
      '12,11': { facing: 180 },
      '22,8': { route: [[21, 6], [23, 6], [23, 10], [21, 10]], facing: 180 },
    },
    ascii: toAscii(g),
  });
}

// ---- PLAT_04: VIP office ----
{
  const w = 24;
  const h = 14;
  const g = buildGrid(w, h, [{ x: 0, y: 0, w, h, doors: [] }]);
  for (let y = 4; y <= 12; y++) g[y][7] = '#';
  g[5][7] = '.';
  g[10][7] = '.';
  // VIP office
  for (let y = 7; y <= 12; y++) for (let x = 14; x <= 22; x++) g[y][x] = '#';
  for (let y = 8; y <= 11; y++) for (let x = 15; x <= 21; x++) g[y][x] = '.';
  g[9][14] = '.';
  place(g, 2, 2, 'P');
  place(g, 3, 3, 'b');
  place(g, 3, 9, 'k');
  place(g, 4, 6, 'e');
  place(g, 11, 5, 'n');
  place(g, 12, 10, 'p');
  place(g, 18, 9, 'H');
  place(g, 20, 10, 'X');
  LEVELS.push({
    id: 'plat_04',
    chapter: 1,
    objective: 'vip',
    maxDeaths: 1,
    maxTimeSec: 60,
    enemyMeta: {
      '4,6': { route: [[3, 5], [5, 5], [5, 10], [3, 10]], facing: 0 },
      '11,5': { facing: 270 },
      '18,9': { facing: 180 },
    },
    ascii: toAscii(g),
  });
}

// ---- PLAT_05: silent dock spine ----
{
  const w = 28;
  const h = 15;
  const g = buildGrid(w, h, [{ x: 0, y: 0, w, h, doors: [] }]);
  for (let y = 4; y <= 13; y++) g[y][8] = '#';
  g[5][8] = '.';
  g[11][8] = '.';
  for (let y = 4; y <= 13; y++) g[y][18] = '#';
  g[6][18] = '.';
  g[12][18] = '.';
  place(g, 2, 2, 'P');
  place(g, 3, 3, 'b');
  place(g, 3, 8, 'k');
  place(g, 5, 4, 'e');
  place(g, 12, 7, 'e');
  place(g, 13, 11, 'e');
  place(g, 22, 10, 'n');
  place(g, 25, 12, 'X');
  LEVELS.push({
    id: 'plat_05',
    chapter: 1,
    objective: 'silent',
    maxDeaths: 0,
    maxTimeSec: 75,
    noAlarm: true,
    enemyMeta: {
      '5,4': { route: [[4, 3], [6, 3], [6, 6], [4, 6]], facing: 0 },
      '12,7': { route: [[10, 5], [15, 5], [15, 9], [10, 9]], facing: 90 },
      '13,11': { route: [[11, 10], [16, 10], [16, 12], [11, 12]], facing: 0 },
      '22,10': { facing: 270 },
    },
    ascii: toAscii(g),
  });
}

// ---- PLAT_06: cubicle maze ----
{
  const w = 26;
  const h = 15;
  const g = buildGrid(w, h, [{ x: 0, y: 0, w, h, doors: [] }]);
  // cubicle blocks
  const blocks = [
    [5, 3, 10, 6],
    [12, 3, 17, 6],
    [5, 8, 10, 12],
    [12, 8, 17, 12],
  ];
  for (const [x0, y0, x1, y1] of blocks) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = '#';
    for (let y = y0 + 1; y <= y1 - 1; y++) for (let x = x0 + 1; x <= x1 - 1; x++) g[y][x] = '.';
  }
  // doors between cubicles / halls
  g[4][5] = '.';
  g[4][10] = '.';
  g[4][12] = '.';
  g[4][17] = '.';
  g[9][5] = '.';
  g[9][10] = '.';
  g[9][12] = '.';
  g[9][17] = '.';
  g[6][7] = '.';
  g[8][7] = '.';
  g[6][14] = '.';
  g[8][14] = '.';
  place(g, 2, 2, 'P');
  place(g, 2, 3, 'k');
  place(g, 3, 10, 'b');
  place(g, 7, 4, 'e');
  place(g, 14, 4, 'e');
  place(g, 7, 10, 'e');
  place(g, 14, 10, 'e');
  place(g, 20, 7, 's');
  place(g, 21, 11, 'p');
  place(g, 23, 12, 'X');
  LEVELS.push({
    id: 'plat_06',
    chapter: 1,
    objective: 'clear',
    maxDeaths: 1,
    maxTimeSec: 70,
    enemyMeta: {
      '7,4': { route: [[7, 4], [8, 4]], facing: 0 },
      '14,4': { route: [[14, 4], [15, 4]], facing: 180 },
      '7,10': { route: [[7, 10], [8, 10]], facing: 0 },
      '14,10': { route: [[14, 10], [15, 10]], facing: 180 },
      '20,7': { facing: 180 },
    },
    ascii: toAscii(g),
  });
}

// ---- PLAT_07: three lanes ----
{
  const w = 30;
  const h = 15;
  const g = buildGrid(w, h, [{ x: 0, y: 0, w, h, doors: [] }]);
  for (let y = 2; y <= 12; y++) {
    g[y][9] = '#';
    g[y][19] = '#';
  }
  for (const x of [9, 19]) {
    g[3][x] = '.';
    g[7][x] = '.';
    g[11][x] = '.';
  }
  place(g, 2, 2, 'P');
  place(g, 3, 3, 'b');
  place(g, 3, 8, 'k');
  place(g, 4, 5, 'e');
  place(g, 5, 11, 'e');
  place(g, 13, 4, 'e');
  place(g, 14, 8, 's');
  place(g, 14, 10, 'h');
  place(g, 15, 12, 'p');
  place(g, 23, 5, 'e');
  place(g, 24, 8, 'n');
  place(g, 27, 12, 'X');
  LEVELS.push({
    id: 'plat_07',
    chapter: 1,
    objective: 'clear',
    maxDeaths: 1,
    maxTimeSec: 80,
    enemyMeta: {
      '4,5': { route: [[3, 4], [3, 10]], facing: 90 },
      '5,11': { route: [[4, 11], [6, 11]], facing: 0 },
      '13,4': { route: [[12, 3], [16, 3]], facing: 0 },
      '14,8': { facing: 180 },
      '14,10': { facing: 90 },
      '23,5': { route: [[22, 4], [25, 4], [25, 10], [22, 10]], facing: 90 },
      '24,8': { facing: 270 },
    },
    ascii: toAscii(g),
  });
}

// ---- PLAT_08: timed extract finale ----
{
  const w = 28;
  const h = 15;
  const g = buildGrid(w, h, [{ x: 0, y: 0, w, h, doors: [] }]);
  // vault
  for (let y = 4; y <= 12; y++) for (let x = 10; x <= 18; x++) g[y][x] = '#';
  for (let y = 5; y <= 11; y++) for (let x = 11; x <= 17; x++) g[y][x] = '.';
  g[6][10] = '.'; // west entry
  g[9][18] = '.'; // east exit path
  g[12][14] = '.'; // south shotgun choke
  place(g, 2, 2, 'P');
  place(g, 3, 3, 'b');
  place(g, 3, 8, 'k');
  place(g, 5, 4, 'e');
  place(g, 14, 6, 'C');
  place(g, 15, 7, 'H');
  place(g, 14, 12, 's');
  place(g, 21, 5, 'n');
  place(g, 22, 10, 'e');
  place(g, 15, 11, 'p');
  place(g, 25, 12, 'X');
  LEVELS.push({
    id: 'plat_08',
    chapter: 1,
    objective: 'extract',
    maxDeaths: 0,
    maxTimeSec: 50,
    enemyMeta: {
      '5,4': { route: [[4, 3], [7, 3], [7, 6], [4, 6]], facing: 0 },
      '15,7': { facing: 90 },
      '14,12': { facing: 180 },
      '21,5': { facing: 270 },
      '22,10': { route: [[21, 9], [24, 9], [24, 11], [21, 11]], facing: 180 },
    },
    ascii: toAscii(g),
  });
}

// ---- PORT_01 ----
{
  const w = 32;
  const h = 16;
  const g = buildGrid(w, h, [{ x: 0, y: 0, w, h, doors: [] }]);
  for (let y = 4; y <= 14; y++) g[y][8] = '#';
  g[5][8] = '.';
  g[12][8] = '.';
  // vault
  for (let y = 5; y <= 13; y++) for (let x = 11; x <= 17; x++) g[y][x] = '#';
  for (let y = 6; y <= 12; y++) for (let x = 12; x <= 16; x++) g[y][x] = '.';
  g[6][11] = '.';
  g[10][17] = '.';
  g[13][14] = '.';
  for (let y = 4; y <= 14; y++) g[y][22] = '#';
  g[7][22] = '.';
  g[12][22] = '.';
  place(g, 2, 2, 'P');
  place(g, 3, 3, 'b');
  place(g, 3, 8, 'k');
  place(g, 5, 4, 'e');
  place(g, 14, 7, 'C');
  place(g, 14, 8, 'H');
  place(g, 14, 12, 's');
  place(g, 14, 11, 'p');
  place(g, 19, 6, 'e');
  place(g, 19, 11, 'e');
  place(g, 26, 9, 'n');
  place(g, 29, 13, 'X');
  LEVELS.push({
    id: 'port_01',
    chapter: 2,
    objective: 'extract',
    maxDeaths: 1,
    maxTimeSec: 75,
    noAlarm: true,
    enemyMeta: {
      '5,4': { route: [[4, 3], [6, 3], [6, 6], [4, 6]], facing: 0 },
      '14,8': { facing: 90 },
      '14,12': { facing: 180 },
      '19,6': { route: [[18, 5], [20, 5], [20, 8], [18, 8]], facing: 90 },
      '19,11': { route: [[18, 10], [20, 10], [20, 13], [18, 13]], facing: 0 },
      '26,9': { facing: 270 },
    },
    ascii: toAscii(g),
  });
}

// ---- PORT_02: warehouse aisles ----
{
  const w = 34;
  const h = 17;
  const g = buildGrid(w, h, [{ x: 0, y: 0, w, h, doors: [] }]);
  // three aisle walls (vertical racks) with gaps
  for (const ax of [8, 16, 24]) {
    for (let y = 3; y <= 14; y++) g[y][ax] = '#';
    g[5][ax] = '.';
    g[9][ax] = '.';
    g[13][ax] = '.';
  }
  place(g, 2, 2, 'P');
  place(g, 3, 3, 'b');
  place(g, 3, 10, 'k');
  place(g, 4, 6, 'e');
  place(g, 11, 5, 'e');
  place(g, 12, 11, 's');
  place(g, 14, 9, 'C');
  place(g, 19, 7, 's');
  place(g, 20, 12, 'h');
  place(g, 21, 5, 'e');
  place(g, 27, 8, 'e');
  place(g, 28, 12, 'n');
  place(g, 29, 14, 'p');
  place(g, 31, 10, 'X');
  LEVELS.push({
    id: 'port_02',
    chapter: 2,
    objective: 'extract',
    maxDeaths: 1,
    maxTimeSec: 80,
    enemyMeta: {
      '4,6': { route: [[3, 5], [3, 12]], facing: 90 },
      '11,5': { route: [[10, 4], [10, 12]], facing: 90 },
      '12,11': { facing: 180 },
      '19,7': { facing: 180 },
      '20,12': { facing: 90 },
      '21,5': { route: [[20, 4], [22, 4], [22, 10], [20, 10]], facing: 90 },
      '27,8': { route: [[26, 6], [29, 6], [29, 11], [26, 11]], facing: 90 },
      '28,12': { facing: 270 },
    },
    ascii: toAscii(g),
  });
}

// ---- PORT_03: storm pockets ----
{
  const w = 36;
  const h = 18;
  const g = buildGrid(w, h, [{ x: 0, y: 0, w, h, doors: [] }]);
  // pocket rooms
  const pockets = [
    [4, 4, 10, 9],
    [14, 3, 22, 8],
    [14, 10, 22, 15],
    [25, 5, 32, 12],
  ];
  for (const [x0, y0, x1, y1] of pockets) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = '#';
    for (let y = y0 + 1; y <= y1 - 1; y++) for (let x = x0 + 1; x <= x1 - 1; x++) g[y][x] = '.';
  }
  // doors
  g[6][4] = '.';
  g[6][10] = '.';
  g[5][14] = '.';
  g[5][22] = '.';
  g[12][14] = '.';
  g[12][22] = '.';
  g[8][25] = '.';
  g[8][32] = '.';
  g[9][18] = '.'; // link upper/lower mid
  g[10][18] = '.';
  place(g, 2, 2, 'P');
  place(g, 2, 3, 'b');
  place(g, 2, 12, 'k');
  place(g, 7, 6, 'e');
  place(g, 7, 7, 's');
  place(g, 17, 5, 'e');
  place(g, 18, 6, 's');
  place(g, 19, 12, 'h');
  place(g, 17, 13, 'p');
  place(g, 20, 13, 'g');
  place(g, 28, 7, 'e');
  place(g, 29, 9, 'n');
  place(g, 12, 16, 'e');
  place(g, 33, 15, 'X');
  LEVELS.push({
    id: 'port_03',
    chapter: 2,
    objective: 'clear',
    maxDeaths: 1,
    maxTimeSec: 90,
    enemyMeta: {
      '7,6': { route: [[6, 5], [8, 5], [8, 7], [6, 7]], facing: 0 },
      '7,7': { facing: 180 },
      '17,5': { route: [[16, 4], [20, 4]], facing: 0 },
      '18,6': { facing: 180 },
      '19,12': { facing: 90 },
      '28,7': { route: [[27, 6], [30, 6], [30, 10], [27, 10]], facing: 90 },
      '29,9': { facing: 270 },
      '12,16': { route: [[10, 16], [14, 16]], facing: 0 },
    },
    ascii: toAscii(g),
  });
}

// ---- emit ----
let failures = 0;
for (const spec of LEVELS) {
  const mission = parseAscii(spec.ascii, spec);
  const errors = validate(mission);
  const out = path.join(outDir, `${mission.id}.json`);
  fs.writeFileSync(out, JSON.stringify(mission, null, 2) + '\n');
  const tag = errors.length ? 'FAIL' : 'OK';
  console.log(
    `[${tag}] ${mission.id} ${mission.width}x${mission.height} ${mission.objective} ` +
      `E${mission.enemies.length} W${mission.weapons.length}` +
      (mission.caseItem ? ' CASE' : '') +
      (mission.enemies.some((e) => e.vip) ? ' VIP' : ''),
  );
  if (errors.length) {
    failures += errors.length;
    errors.forEach((e) => console.log('  -', e));
    console.log(spec.ascii);
  }
}
if (failures) {
  console.error(`\n${failures} issues`);
  process.exit(1);
}
console.log(`\nWrote ${LEVELS.length} missions`);
