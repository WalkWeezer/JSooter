import Phaser from 'phaser';
import { listMissions } from '../data/missionIndex';
import { saveService } from '../save/SaveService';
import { t } from '../i18n';
import {
  mountPagerChrome,
  missionCode,
  missionTitle,
  riskLabel,
  districtLabel,
  uiText,
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
    const rowH = Math.min(52, (layout.content.h - 40) / this.pageSize);
    const rowW = layout.content.w;

    slice.forEach((m, i) => {
      const unlocked = saveService.isUnlocked(m.id);
      const cleared = saveService.get().cleared[m.id];
      const y = top + 6 + i * rowH + rowH / 2;
      const code = missionCode(m.id);
      const risk = riskLabel(m.id);
      const district = districtLabel(m.id);
      const title = missionTitle(m.id);

      const g = this.add.graphics().setDepth(6);
      if (unlocked) {
        g.fillStyle(0x0c1a12, 0.55);
        g.fillRect(left + 2, y - rowH / 2 + 3, rowW - 4, rowH - 6);
      }
      g.lineStyle(1, unlocked ? UI.green : UI.muted, unlocked ? 0.55 : 0.28);
      g.strokeRect(left + 2, y - rowH / 2 + 3, rowW - 4, rowH - 6);

      // Status pips (cleared / locked)
      const pipX = left + 12;
      const pipY = y - 10;
      for (let p = 0; p < 4; p++) {
        const on = unlocked && cleared && p < 2;
        g.fillStyle(on ? UI.green : unlocked ? 0x1a2a1e : 0x1a1a1a, 1);
        g.fillRect(pipX + p * 7, pipY, 5, 5);
      }

      uiText(this, left + 12, y + 6, code, {
        family: 'mono',
        size: 11,
        color: unlocked ? UI.hex.cyan : UI.hex.dim,
        originY: 0.5,
        depth: 7,
      });

      if (unlocked) {
        uiText(this, left + 78, y - 8, title, {
          family: 'ui',
          size: 14,
          color: cleared ? UI.hex.green : UI.hex.text,
          bold: true,
          originY: 0.5,
          depth: 7,
          glow: cleared ? 'green' : 'none',
        });
        uiText(this, left + 78, y + 10, district, {
          family: 'mono',
          size: 10,
          color: UI.hex.muted,
          originY: 0.5,
          depth: 7,
        });
      } else {
        uiText(this, left + 78, y - 6, t('pager.locked'), {
          family: 'mono',
          size: 12,
          color: UI.hex.dim,
          originY: 0.5,
          depth: 7,
        });
        uiText(this, left + 78, y + 10, t('pager.unlock_hint', { id: missionCode(prevId(m.id)) }), {
          family: 'mono',
          size: 10,
          color: UI.hex.dim,
          originY: 0.5,
          depth: 7,
        });
      }

      const riskColor =
        risk === 'CRITICAL' ? UI.hex.magenta : risk === 'HIGH' ? UI.hex.amber : UI.hex.green;
      uiText(this, left + rowW - 28, y - 8, t('pager.risk'), {
        family: 'mono',
        size: 9,
        color: UI.hex.dim,
        originX: 1,
        originY: 0.5,
        depth: 7,
      });
      uiText(this, left + rowW - 28, y + 8, unlocked ? risk : '—', {
        family: 'ui',
        size: 12,
        color: unlocked ? riskColor : UI.hex.dim,
        bold: true,
        originX: 1,
        originY: 0.5,
        depth: 7,
        glow: unlocked && risk === 'CRITICAL' ? 'magenta' : 'none',
      });

      uiText(this, left + rowW - 10, y, '›', {
        family: 'ui',
        size: 22,
        color: unlocked ? UI.hex.green : UI.hex.dim,
        originX: 0.5,
        originY: 0.5,
        depth: 7,
      });

      if (unlocked) {
        const hit = this.add
          .rectangle(layout.content.x, y, rowW - 4, rowH - 6, 0x39ff14, 0.001)
          .setDepth(8)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => this.scene.start('BriefingScene', { missionId: m.id }));
      }
    });

    const py = layout.content.y + layout.content.h / 2 - 16;
    const prev = uiText(this, layout.content.x - 56, py, '▲', {
      family: 'ui',
      size: 14,
      color: this.page > 0 ? UI.hex.green : UI.hex.dim,
      originX: 0.5,
      originY: 0.5,
      depth: 8,
    });
    if (this.page > 0) {
      prev.setInteractive({ useHandCursor: true });
      prev.on('pointerdown', () => {
        this.page -= 1;
        this.draw();
      });
    }

    uiText(
      this,
      layout.content.x,
      py,
      `${String(this.page + 1).padStart(2, '0')} / ${String(pages).padStart(2, '0')}`,
      {
        family: 'mono',
        size: 13,
        color: UI.hex.cyan,
        originX: 0.5,
        originY: 0.5,
        depth: 8,
      },
    );

    const next = uiText(this, layout.content.x + 56, py, '▼', {
      family: 'ui',
      size: 14,
      color: this.page < pages - 1 ? UI.hex.green : UI.hex.dim,
      originX: 0.5,
      originY: 0.5,
      depth: 8,
    });
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
