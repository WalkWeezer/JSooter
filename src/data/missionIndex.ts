import type { MissionDef } from '../game/types';
import tut01 from './missions/tut_01.json';
import tut02 from './missions/tut_02.json';
import tut03 from './missions/tut_03.json';
import plat01 from './missions/plat_01.json';
import plat02 from './missions/plat_02.json';
import plat03 from './missions/plat_03.json';
import plat04 from './missions/plat_04.json';
import plat05 from './missions/plat_05.json';
import plat06 from './missions/plat_06.json';
import plat07 from './missions/plat_07.json';
import plat08 from './missions/plat_08.json';
import port01 from './missions/port_01.json';
import port02 from './missions/port_02.json';
import port03 from './missions/port_03.json';

const ALL: MissionDef[] = [
  tut01, tut02, tut03,
  plat01, plat02, plat03, plat04, plat05, plat06, plat07, plat08,
  port01, port02, port03,
] as MissionDef[];

const byId = Object.fromEntries(ALL.map((m) => [m.id, m]));

export function listMissions(): MissionDef[] {
  return ALL;
}

export function getMission(id: string): MissionDef {
  const m = byId[id];
  if (!m) throw new Error(`Unknown mission: ${id}`);
  return m;
}

export function getNextMissionId(currentId: string): string | null {
  const idx = ALL.findIndex((m) => m.id === currentId);
  if (idx < 0 || idx >= ALL.length - 1) return null;
  return ALL[idx + 1].id;
}

export const TUTORIAL_IDS = ['tut_01', 'tut_02', 'tut_03'];
