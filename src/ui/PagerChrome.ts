import Phaser from 'phaser';
import { t } from '../i18n';

/** GDD pager palette — docs/visual-style */
export const UI = {
  bg: 0x0b0d12,
  cyan: 0x2de2e6,
  magenta: 0xff2a6d,
  violet: 0x7a5cff,
  green: 0x39ff14,
  amber: 0xffc857,
  muted: 0x6b7385,
  panel: 0x0a120e,
  hex: {
    bg: '#0B0D12',
    cyan: '#2DE2E6',
    magenta: '#FF2A6D',
    violet: '#7A5CFF',
    green: '#39FF14',
    amber: '#FFC857',
    muted: '#6b7385',
    text: '#cfd6e6',
    dim: '#4a5160',
  },
  font: 'Courier New, monospace',
} as const;

export type PagerTab = 'missions' | 'loadout' | 'intel' | 'system';

export type PagerLayout = {
  padTop: number;
  padBottom: number;
  screen: { x: number; y: number; w: number; h: number };
  content: { x: number; y: number; w: number; h: number };
  tabY: number;
};

/**
 * Draws the Neontron pager chrome from the GDD ref:
 * city blur + device frame + phosphor screen + bottom tabs.
 */
export function mountPagerChrome(
  scene: Phaser.Scene,
  opts: { activeTab: PagerTab; title?: string; subtitle?: string },
): PagerLayout {
  const { width, height } = scene.scale;
  const sticky = Number(scene.registry.get('stickyPaddingPx') || 90);
  const padTop = sticky + 8;
  const padBottom = Math.max(70, sticky * 0.55);

  scene.cameras.main.setBackgroundColor(UI.hex.bg);

  // City blur behind device
  if (scene.textures.exists('hub_bg')) {
    scene.add
      .image(width / 2, height / 2, 'hub_bg')
      .setDisplaySize(width * 1.15, height * 1.15)
      .setAlpha(0.55)
      .setDepth(0);
  }
  scene.add.rectangle(width / 2, height / 2, width, height, UI.bg, 0.55).setDepth(1);

  // Device frame
  const marginX = Math.max(10, width * 0.04);
  const frameX = width / 2;
  const frameY = (padTop + (height - padBottom)) / 2;
  const frameW = Math.min(width - marginX * 2, 420);
  const frameH = Math.min(height - padTop - padBottom - 8, height * 0.82);

  if (scene.textures.exists('pager_bezel')) {
    scene.add
      .image(frameX, frameY, 'pager_bezel')
      .setDisplaySize(frameW * 1.08, frameH * 1.06)
      .setDepth(2)
      .setAlpha(0.95);
  } else {
    const g = scene.add.graphics().setDepth(2);
    g.fillStyle(0x151820, 1);
    g.fillRoundedRect(frameX - frameW / 2, frameY - frameH / 2, frameW, frameH, 18);
    g.lineStyle(3, UI.cyan, 0.55);
    g.strokeRoundedRect(frameX - frameW / 2, frameY - frameH / 2, frameW, frameH, 18);
  }

  // Inner phosphor screen
  const inset = Math.max(18, frameW * 0.07);
  const screenW = frameW - inset * 2;
  const screenH = frameH - inset * 2.2;
  const screenX = frameX;
  const screenY = frameY - 6;
  const screenLeft = screenX - screenW / 2;
  const screenTop = screenY - screenH / 2;

  const screen = scene.add.graphics().setDepth(3);
  screen.fillStyle(0x050806, 0.96);
  screen.fillRoundedRect(screenLeft, screenTop, screenW, screenH, 8);
  screen.lineStyle(1, UI.green, 0.45);
  screen.strokeRoundedRect(screenLeft, screenTop, screenW, screenH, 8);

  // Scanlines
  const lines = scene.add.graphics().setDepth(4).setAlpha(0.07);
  for (let y = 0; y < screenH; y += 3) {
    lines.lineStyle(1, UI.green, 1);
    lines.lineBetween(screenLeft, screenTop + y, screenLeft + screenW, screenTop + y);
  }

  // Header brand
  scene.add
    .text(screenX, screenTop + 16, 'NEONTRON', {
      fontFamily: UI.font,
      fontSize: `${Math.min(26, screenW * 0.09)}px`,
      color: UI.hex.cyan,
      fontStyle: 'bold',
    })
    .setOrigin(0.5, 0)
    .setDepth(5);

  scene.add
    .text(screenLeft + 10, screenTop + 42, '// NIGHT ASSAULT PROTOCOL', {
      fontFamily: UI.font,
      fontSize: '9px',
      color: UI.hex.green,
    })
    .setDepth(5);

  scene.add
    .text(screenLeft + screenW - 10, screenTop + 42, 'v0.1', {
      fontFamily: UI.font,
      fontSize: '9px',
      color: UI.hex.dim,
    })
    .setOrigin(1, 0)
    .setDepth(5);

  // Header rule
  const rule = scene.add.graphics().setDepth(5);
  rule.lineStyle(1, UI.green, 0.55);
  rule.lineBetween(screenLeft + 8, screenTop + 56, screenLeft + screenW - 8, screenTop + 56);

  if (opts.title) {
    scene.add
      .text(screenX, screenTop + 64, opts.title, {
        fontFamily: UI.font,
        fontSize: '13px',
        color: UI.hex.green,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setDepth(5);
  }
  if (opts.subtitle) {
    scene.add
      .text(screenX, screenTop + 80, opts.subtitle, {
        fontFamily: UI.font,
        fontSize: '10px',
        color: UI.hex.muted,
        align: 'center',
        wordWrap: { width: screenW - 24 },
      })
      .setOrigin(0.5, 0)
      .setDepth(5);
  }

  const contentTop = screenTop + (opts.subtitle ? 98 : opts.title ? 86 : 64);
  const tabH = 48;
  const contentH = screenH - (contentTop - screenTop) - tabH - 8;
  const tabY = screenTop + screenH - tabH + 4;

  drawPagerTabs(scene, {
    active: opts.activeTab,
    x: screenLeft,
    y: tabY,
    w: screenW,
    h: tabH - 6,
  });

  // Sticky labels (dev/safe area)
  scene.add
    .rectangle(width / 2, sticky / 2, width, sticky, 0x11151f, 0.35)
    .setDepth(20);
  scene.add
    .text(width / 2, sticky / 2, t('hub.sticky_label'), {
      fontFamily: UI.font,
      fontSize: '10px',
      color: '#5a6478',
    })
    .setOrigin(0.5)
    .setDepth(21);

  return {
    padTop,
    padBottom,
    screen: { x: screenX, y: screenY, w: screenW, h: screenH },
    content: {
      x: screenX,
      y: contentTop + contentH / 2,
      w: screenW - 16,
      h: contentH,
    },
    tabY,
  };
}

function drawPagerTabs(
  scene: Phaser.Scene,
  box: { active: PagerTab; x: number; y: number; w: number; h: number },
): void {
  const tabs: { id: PagerTab; labelKey: string; sceneKey: string }[] = [
    { id: 'missions', labelKey: 'pager.tab_missions', sceneKey: 'MissionSelectScene' },
    { id: 'loadout', labelKey: 'pager.tab_loadout', sceneKey: 'ShopScene' },
    { id: 'intel', labelKey: 'pager.tab_intel', sceneKey: 'HubScene' },
    { id: 'system', labelKey: 'pager.tab_system', sceneKey: 'SettingsScene' },
  ];
  const cellW = box.w / tabs.length;
  const g = scene.add.graphics().setDepth(6);
  g.lineStyle(1, UI.green, 0.35);
  g.lineBetween(box.x + 6, box.y, box.x + box.w - 6, box.y);

  tabs.forEach((tab, i) => {
    const cx = box.x + cellW * (i + 0.5);
    const active = tab.id === box.active;
    if (active) {
      g.lineStyle(1, UI.green, 0.8);
      g.strokeRect(cx - cellW * 0.4, box.y + 6, cellW * 0.8, box.h - 10);
      // caret
      g.fillStyle(UI.green, 1);
      g.fillTriangle(cx - 4, box.y + 2, cx + 4, box.y + 2, cx, box.y - 3);
    }
    const label = scene.add
      .text(cx, box.y + box.h / 2 + 2, t(tab.labelKey), {
        fontFamily: UI.font,
        fontSize: '9px',
        color: active ? UI.hex.green : UI.hex.dim,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(7)
      .setInteractive({ useHandCursor: true });

    label.on('pointerdown', () => {
      if (tab.id === box.active) return;
      scene.scene.start(tab.sceneKey);
    });
  });
}

export function pagerPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  depth = 5,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(depth);
  g.lineStyle(1, UI.green, 0.55);
  g.strokeRect(x - w / 2, y - h / 2, w, h);
  // corner crosses
  const c = 5;
  const corners = [
    [x - w / 2, y - h / 2],
    [x + w / 2, y - h / 2],
    [x - w / 2, y + h / 2],
    [x + w / 2, y + h / 2],
  ];
  g.lineStyle(1, UI.cyan, 0.7);
  for (const [cx, cy] of corners) {
    g.lineBetween(cx - c, cy, cx + c, cy);
    g.lineBetween(cx, cy - c, cx, cy + c);
  }
  return g;
}

export function pagerButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  opts: {
    color?: string;
    fill?: string;
    fontSize?: string;
    depth?: number;
    onClick: () => void;
  },
): Phaser.GameObjects.Text {
  const btn = scene.add
    .text(x, y, label, {
      fontFamily: UI.font,
      fontSize: opts.fontSize || '14px',
      color: opts.color || UI.hex.bg,
      backgroundColor: opts.fill || UI.hex.cyan,
      padding: { x: 14, y: 8 },
    })
    .setOrigin(0.5)
    .setDepth(opts.depth ?? 8)
    .setInteractive({ useHandCursor: true });
  btn.on('pointerdown', opts.onClick);
  btn.on('pointerover', () => btn.setAlpha(0.85));
  btn.on('pointerout', () => btn.setAlpha(1));
  return btn;
}

export function missionCode(id: string): string {
  const m = id.match(/^(tut|plat|port)_(\d+)$/i);
  if (!m) return id.toUpperCase();
  const prefix = m[1].toLowerCase() === 'tut' ? 'NA-T' : m[1].toLowerCase() === 'plat' ? 'NA' : 'NP';
  return `${prefix}-${m[2].padStart(2, '0')}`;
}

export function riskLabel(id: string): string {
  if (id.startsWith('tut')) return 'LOW';
  if (id.startsWith('port')) return 'CRITICAL';
  if (id.includes('05') || id.includes('08') || id.includes('07')) return 'HIGH';
  return 'MEDIUM';
}

export function districtLabel(id: string): string {
  if (id.startsWith('tut')) return 'TRAINING DECK';
  if (id.startsWith('port')) return 'PORT ZARYA-13';
  return 'DISTRICT PLAT';
}
