export type SaveData = {
  version: 1;
  unlocked: string[];
  cleared: Record<string, { rank: string; bestTime: number; deaths: number }>;
  impulses: number;
  cassettes: number;
  maskId: string;
  removeAds: boolean;
};

const KEY = 'neontron.save.v1';

const DEFAULT: SaveData = {
  version: 1,
  unlocked: ['tut_01'],
  cleared: {},
  impulses: 0,
  cassettes: 0,
  maskId: 'iskra',
  removeAds: false,
};

export class SaveService {
  private data: SaveData;

  constructor() {
    this.data = this.read();
  }

  get(): SaveData {
    return this.data;
  }

  isUnlocked(id: string): boolean {
    return this.data.unlocked.includes(id);
  }

  unlock(id: string): void {
    if (!this.data.unlocked.includes(id)) {
      this.data.unlocked.push(id);
      this.write();
    }
  }

  markCleared(id: string, rank: string, timeSec: number, deaths: number, nextId: string | null): void {
    const prev = this.data.cleared[id];
    const rankScore = { C: 1, B: 2, A: 3, S: 4, 'S+': 5 } as Record<string, number>;
    const first = !prev;
    const better =
      first ||
      (rankScore[rank] || 0) > (rankScore[prev.rank] || 0) ||
      ((rankScore[rank] || 0) === (rankScore[prev.rank] || 0) && timeSec < prev.bestTime);

    if (better) {
      this.data.cleared[id] = { rank, bestTime: timeSec, deaths };
      const reward = rank === 'S' || rank === 'S+' ? 25 : rank === 'A' ? 15 : rank === 'B' ? 10 : 5;
      this.data.impulses += first ? reward : Math.max(3, Math.floor(reward / 2));
      if ((rank === 'S' || rank === 'S+') && (!prev || prev.rank !== 'S' && prev.rank !== 'S+')) {
        this.data.cassettes += 1;
      }
    }

    if (nextId) this.unlock(nextId);
    this.write();
  }

  private read(): SaveData {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(DEFAULT);
      const parsed = JSON.parse(raw) as SaveData;
      return { ...structuredClone(DEFAULT), ...parsed, version: 1 };
    } catch {
      return structuredClone(DEFAULT);
    }
  }

  private write(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      // ignore quota
    }
  }
}

export const saveService = new SaveService();
