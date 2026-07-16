export type Objective = 'clear' | 'vip' | 'extract' | 'silent' | 'timed';

export type EnemyDef = {
  type: 'patrol' | 'shotgun' | 'shield' | 'sniper';
  x: number;
  y: number;
  route?: number[][];
  facing?: number;
};

export type WeaponDef = {
  type: 'bat' | 'knife' | 'pistol' | 'shotgun' | 'uzi';
  x: number;
  y: number;
};

export type MissionDef = {
  id: string;
  chapter: number;
  objective: Objective;
  playerSpawn: [number, number];
  exit: [number, number];
  tileSize: number;
  width: number;
  height: number;
  walls: number[][];
  enemies: EnemyDef[];
  weapons: WeaponDef[];
  caseItem?: [number, number];
  briefingKey: string;
  sRankRules: {
    maxDeaths: number;
    maxTimeSec: number;
    noAlarm?: boolean;
  };
};

export type Rank = 'C' | 'B' | 'A' | 'S' | 'S+';

export function computeRank(opts: {
  deaths: number;
  timeSec: number;
  alarm: boolean;
  rules: MissionDef['sRankRules'];
  hasCase?: boolean;
  objective: Objective;
}): Rank {
  const { deaths, timeSec, alarm, rules, objective, hasCase } = opts;
  if (objective === 'extract' && hasCase === false) return 'C';

  if (deaths === 0 && timeSec <= rules.maxTimeSec && (!rules.noAlarm || !alarm)) return 'S';
  if (deaths <= 1 && timeSec <= rules.maxTimeSec * 1.4) return 'A';
  if (deaths <= 2) return 'B';
  return 'C';
}
