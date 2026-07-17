import Phaser from 'phaser';
import { listMissions } from '../data/missionIndex';
import { saveService } from '../save/SaveService';
import { t } from '../i18n';
import {
  mountPagerChrome,
  missionCode,
  riskLabel,
  districtLabel,
  UI,
} from '../ui/PagerChrome';

export class MissionSelectScene extends Phaser.Scene {
  private page = 0;
  private readonly pageSize = 5;

  constructor() {
    super('MissionSelectScene');
  }

  create(): void {
    saveService.unlock('tut_01');
    this.draw();
  }

  private draw(): void {
    this.children.removeAll();
    const layout = mountPagerChrome(this, {
      activeTab: 'missions',
      title: t('pager.night_assault'),
      subtitle: t('pager.tagline'),
    });

    const missions = listMissions();
    const pages = Math.max(1, Math.ceil(missions.length / this.pageSize));
    this.page = Phaser.Math.Clamp(this.page, 0, pages - 1);
    const slice = missions.slice(this.page * this.pageSize, this.page * this.pageSize + this.pageSize);

    const left = layout.content.x - layout.content.w / 2;
    const top = layout.content.y - layout.content.h / 2;
    const rowH = Math.min(46, (layout.content.h - 36) / this.pageSize);
    const rowW = layout.content.w;

    slice.forEach((m, i) => {
      const unlocked = saveService.isUnlocked(m.id);
      const cleared = saveService.get().cleared[m.id];
      const y = top + 8 + i * rowH + rowH / 2;
      const code = missionCode(m.id);
      const risk = riskLabel(m.id);
      const district = districtLabel(m.id);

      const g = this.add.graphics().setDepth(6);
      g.lineStyle(1, unlocked ? UI.green : UI.muted, unlocked ? 0.7 : 0.35);
      g.strokeRect(left + 2, y - rowH / 2 + 3, rowW - 4, rowH - 6);

      const titleColor = !unlocked ? UI.hex.dim : cleared ? UI.hex.green : UI.hex.text;
      this.add
        .text(left + 10, y - 8, code, {
          fontFamily: UI.font,
          fontSize: '10px',
          color: unlocked ? UI.hex.cyan : UI.hex.dim,
        })
        .setOrigin(0, 0.5)
        .setDepth(7);

      this.add
        .text(left + 10, y + 8, unlocked ? district : t('pager.locked'), {
          fontFamily: UI.font,
          fontSize: '9px',
          color: unlocked ? UI.hex.muted : UI.hex.dim,
        })
        .setOrigin(0, 0.5)
        .setDepth(7);

      const midLabel = unlocked
        ? `${m.id.toUpperCase()}${cleared ? `  [${cleared.rank}]` : ''}`
        : t('pager.unlock_hint', { id: missionCode(prevId(m.id)) });

      this.add
        .text(layout.content.x - 10, y, midLabel, {
          fontFamily: UI.font,
          fontSize: '11px',
          color: titleColor,
        })
        .setOrigin(0.5)
        .setDepth(7);

      const riskColor =
        risk === 'CRITICAL' ? UI.hex.magenta : risk === 'HIGH' ? UI.hex.amber : UI.hex.green;
      this.add
        .text(left + rowW - 28, y - 6, `${t('pager.risk')}`, {
          fontFamily: UI.font,
          fontSize: '8px',
          color: UI.hex.dim,
        })
        .setOrigin(1, 0.5)
        .setDepth(7);
      this.add
        .text(left + rowW - 28, y + 8, unlocked ? risk : '—', {
          fontFamily: UI.font,
          fontSize: '10px',
          color: unlocked ? riskColor : UI.hex.dim,
        })
        .setOrigin(1, 0.5)
        .setDepth(7);

      this.add
        .text(left + rowW - 10, y, '>', {
          fontFamily: UI.font,
          fontSize: '14px',
          color: unlocked ? UI.hex.green : UI.hex.dim,
        })
        .setOrigin(0.5)
        .setDepth(7);

      if (unlocked) {
        const hit = this.add
          .rectangle(layout.content.x, y, rowW - 4, rowH - 6, 0x39ff14, 0.001)
          .setDepth(8)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => this.scene.start('BriefingScene', { missionId: m.id }));
      }
    });

    // Pagination
    const py = layout.content.y + layout.content.h / 2 - 14;
    const prev = this.add
      .text(layout.content.x - 50, py, '▲', {
        fontFamily: UI.font,
        fontSize: '12px',
        color: this.page > 0 ? UI.hex.green : UI.hex.dim,
      })
      .setOrigin(0.5)
      .setDepth(8);
    if (this.page > 0) {
      prev.setInteractive({ useHandCursor: true });
      prev.on('pointerdown', () => {
        this.page -= 1;
        this.draw();
      });
    }

    this.add
      .text(layout.content.x, py, `${String(this.page + 1).padStart(2, '0')} / ${String(pages).padStart(2, '0')}`, {
        fontFamily: UI.font,
        fontSize: '11px',
        color: UI.hex.cyan,
      })
      .setOrigin(0.5)
      .setDepth(8);

    const next = this.add
      .text(layout.content.x + 50, py, '▼', {
        fontFamily: UI.font,
        fontSize: '12px',
        color: this.page < pages - 1 ? UI.hex.green : UI.hex.dim,
      })
      .setOrigin(0.5)
      .setDepth(8);
    if (this.page < pages - 1) {
      next.setInteractive({ useHandCursor: true });
      next.on('pointerdown', () => {
        this.page += 1;
        this.draw();
      });
    }
  }
}

function prevId(id: string): string {
  const all = listMissions();
  const idx = all.findIndex((m) => m.id === id);
  if (idx <= 0) return '—';
  return all[idx - 1].id;
}
