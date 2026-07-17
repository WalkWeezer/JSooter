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
    muted: '#8b93a7',
    text: '#e8eef8',
    dim: '#5a6478',
  },
  /** Brand / neon sign (Latin NEONTRON) */
  fontDisplay: 'Orbitron, "Exo 2", sans-serif',
  /** Readable UI titles & body (Cyrillic) */
  fontUi: '"Exo 2", sans-serif',
  /** Codes, risk, timestamps */
  fontMono: '"JetBrains Mono", monospace',
  /** @deprecated use fontUi — kept for gradual migration */
  font: '"Exo 2", sans-serif',
} as const;

export type PagerTab = 'missions' | 'loadout' | 'intel' | 'system';

export type PagerLayout = {
  padTop: number;
  padBottom: number;
  screen: { x: number; y: number; w: number; h: number };
  content: { x: number; y: number; w: number; h: number };
  tabY: number;
};

type Glow = 'cyan' | 'green' | 'magenta' | 'none';

export function uiText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  content: string,
  opts: {
    family?: 'display' | 'ui' | 'mono';
    size?: number | string;
    color?: string;
    bold?: boolean;
    align?: 'left' | 'center' | 'right';
    originX?: number;
    originY?: number;
    wrap?: number;
    depth?: number;
    glow?: Glow;
    letterSpacing?: number;
  } = {},
): Phaser.GameObjects.Text {
  const family =
    opts.family === 'display' ? UI.fontDisplay : opts.family === 'mono' ? UI.fontMono : UI.fontUi;
  const size = typeof opts.size === 'number' ? `${opts.size}px` : opts.size || '14px';
  const text = scene.add
    .text(x, y, content, {
      fontFamily: family,
      fontSize: size,
      color: opts.color || UI.hex.text,
      fontStyle: opts.bold ? 'bold' : 'normal',
      align: opts.align || 'left',
      wordWrap: opts.wrap ? { width: opts.wrap } : undefined,
    })
    .setOrigin(opts.originX ?? 0, opts.originY ?? 0)
    .setDepth(opts.depth ?? 8);

  const glow = opts.glow ?? 'none';
  if (glow === 'cyan') text.setShadow(0, 0, '#2DE2E6', 10, true, true);
  else if (glow === 'green') text.setShadow(0, 0, '#39FF14', 8, true, true);
  else if (glow === 'magenta') text.setShadow(0, 0, '#FF2A6D', 10, true, true);

  return text;
}

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

  if (scene.textures.exists('hub_bg')) {
    scene.add
      .image(width / 2, height / 2, 'hub_bg')
      .setDisplaySize(width * 1.15, height * 1.15)
      .setAlpha(0.55)
      .setDepth(0);
  }
  scene.add.rectangle(width / 2, height / 2, width, height, UI.bg, 0.55).setDepth(1);

  const marginX = Math.max(10, width * 0.04);
  const frameX = width / 2;
  const frameY = (padTop + (height - padBottom)) / 2;
  const frameW = Math.min(width - marginX * 2, 440);
  const frameH = Math.min(height - padTop - padBottom - 8, height * 0.84);

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

  const inset = Math.max(18, frameW * 0.07);
  const screenW = frameW - inset * 2;
  const screenH = frameH - inset * 2.2;
  const screenX = frameX;
  const screenY = frameY - 6;
  const screenLeft = screenX - screenW / 2;
  const screenTop = screenY - screenH / 2;

  const screen = scene.add.graphics().setDepth(3);
  screen.fillStyle(0x050806, 0.97);
  screen.fillRoundedRect(screenLeft, screenTop, screenW, screenH, 8);
  screen.lineStyle(1, UI.green, 0.4);
  screen.strokeRoundedRect(screenLeft, screenTop, screenW, screenH, 8);

  // Soft inner vignette
  const vig = scene.add.graphics().setDepth(3).setAlpha(0.35);
  vig.fillStyle(0x000000, 1);
  vig.fillRect(screenLeft, screenTop, screenW, 18);
  vig.fillRect(screenLeft, screenTop + screenH - 56, screenW, 56);

  const lines = scene.add.graphics().setDepth(4).setAlpha(0.055);
  for (let y = 0; y < screenH; y += 3) {
    lines.lineStyle(1, UI.green, 1);
    lines.lineBetween(screenLeft, screenTop + y, screenLeft + screenW, screenTop + y);
  }

  // Brand — hero-level signal matching key art / pager mock
  const brandSize = Math.min(30, Math.floor(screenW * 0.095));
  uiText(scene, screenX, screenTop + 14, 'NEONTRON', {
    family: 'display',
    size: brandSize,
    color: UI.hex.cyan,
    bold: true,
    originX: 0.5,
    glow: 'cyan',
    depth: 5,
  });

  uiText(scene, screenLeft + 12, screenTop + 48, '// NIGHT ASSAULT PROTOCOL', {
    family: 'mono',
    size: 10,
    color: UI.hex.muted,
    depth: 5,
  });
  uiText(scene, screenLeft + screenW - 12, screenTop + 48, 'v0.1', {
    family: 'mono',
    size: 10,
    color: UI.hex.dim,
    originX: 1,
    depth: 5,
  });

  const rule = scene.add.graphics().setDepth(5);
  rule.lineStyle(1, UI.green, 0.45);
  rule.lineBetween(screenLeft + 10, screenTop + 66, screenLeft + screenW - 10, screenTop + 66);

  let headerBottom = screenTop + 74;
  if (opts.title) {
    uiText(scene, screenX, headerBottom, opts.title, {
      family: 'ui',
      size: Math.min(20, Math.floor(screenW * 0.055)),
      color: UI.hex.green,
      bold: true,
      originX: 0.5,
      glow: 'green',
      depth: 5,
    });
    headerBottom += 26;
  }
  if (opts.subtitle) {
    uiText(scene, screenX, headerBottom, opts.subtitle, {
      family: 'mono',
      size: 11,
      color: UI.hex.muted,
      originX: 0.5,
      align: 'center',
      wrap: screenW - 28,
      depth: 5,
    });
    headerBottom += 28;
  }

  const contentTop = headerBottom + 4;
  const tabH = 56;
  const contentH = screenH - (contentTop - screenTop) - tabH - 6;
  const tabY = screenTop + screenH - tabH + 2;

  drawPagerTabs(scene, {
    active: opts.activeTab,
    x: screenLeft,
    y: tabY,
    w: screenW,
    h: tabH - 4,
  });

  scene.add.rectangle(width / 2, sticky / 2, width, sticky, 0x11151f, 0.35).setDepth(20);
  uiText(scene, width / 2, sticky / 2, t('hub.sticky_label'), {
    family: 'mono',
    size: 10,
    color: '#5a6478',
    originX: 0.5,
    originY: 0.5,
    depth: 21,
  });

  return {
    padTop,
    padBottom,
    screen: { x: screenX, y: screenY, w: screenW, h: screenH },
    content: {
      x: screenX,
      y: contentTop + contentH / 2,
      w: screenW - 20,
      h: contentH,
    },
    tabY,
  };
}

function drawPagerTabs(
  scene: Phaser.Scene,
  box: { active: PagerTab; x: number; y: number; w: number; h: number },
): void {
  const tabs: { id: PagerTab; labelKey: string; sceneKey: string; icon: string }[] = [
    { id: 'missions', labelKey: 'pager.tab_missions', sceneKey: 'MissionSelectScene', icon: '◎' },
    { id: 'loadout', labelKey: 'pager.tab_loadout', sceneKey: 'ShopScene', icon: '▣' },
    { id: 'intel', labelKey: 'pager.tab_intel', sceneKey: 'HubScene', icon: '☰' },
    { id: 'system', labelKey: 'pager.tab_system', sceneKey: 'SettingsScene', icon: '⚙' },
  ];
  const cellW = box.w / tabs.length;
  const g = scene.add.graphics().setDepth(6);
  g.lineStyle(1, UI.green, 0.3);
  g.lineBetween(box.x + 8, box.y, box.x + box.w - 8, box.y);

  tabs.forEach((tab, i) => {
    const cx = box.x + cellW * (i + 0.5);
    const active = tab.id === box.active;
    if (active) {
      g.fillStyle(UI.green, 0.12);
      g.fillRoundedRect(cx - cellW * 0.42, box.y + 6, cellW * 0.84, box.h - 10, 4);
      g.lineStyle(1.5, UI.green, 0.9);
      g.strokeRoundedRect(cx - cellW * 0.42, box.y + 6, cellW * 0.84, box.h - 10, 4);
      g.fillStyle(UI.green, 1);
      g.fillTriangle(cx - 5, box.y + 3, cx + 5, box.y + 3, cx, box.y - 3);
    }

    uiText(scene, cx, box.y + 16, tab.icon, {
      family: 'ui',
      size: 13,
      color: active ? UI.hex.green : UI.hex.dim,
      originX: 0.5,
      glow: active ? 'green' : 'none',
      depth: 7,
    });

    const label = uiText(scene, cx, box.y + box.h - 14, t(tab.labelKey), {
      family: 'ui',
      size: 10,
      color: active ? UI.hex.green : UI.hex.dim,
      bold: active,
      originX: 0.5,
      originY: 0.5,
      depth: 7,
    }).setInteractive({ useHandCursor: true });

    // Larger hit area
    const hit = scene.add
      .rectangle(cx, box.y + box.h / 2, cellW * 0.9, box.h - 4, 0x39ff14, 0.001)
      .setDepth(7)
      .setInteractive({ useHandCursor: true });
    const go = () => {
      if (tab.id === box.active) return;
      scene.scene.start(tab.sceneKey);
    };
    label.on('pointerdown', go);
    hit.on('pointerdown', go);
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
  g.fillStyle(0x08140c, 0.55);
  g.fillRect(x - w / 2, y - h / 2, w, h);
  g.lineStyle(1, UI.green, 0.5);
  g.strokeRect(x - w / 2, y - h / 2, w, h);
  const c = 6;
  const corners = [
    [x - w / 2, y - h / 2],
    [x + w / 2, y - h / 2],
    [x - w / 2, y + h / 2],
    [x + w / 2, y + h / 2],
  ];
  g.lineStyle(1.5, UI.cyan, 0.75);
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
    outlined?: boolean;
    onClick: () => void;
  },
): Phaser.GameObjects.Text {
  const outlined = opts.outlined ?? false;
  const accent = opts.fill || UI.hex.cyan;
  const color = outlined ? accent : opts.color || UI.hex.bg;
  const btn = scene.add
    .text(x, y, label.toUpperCase(), {
      fontFamily: UI.fontUi,
      fontSize: opts.fontSize || '15px',
      color,
      backgroundColor: outlined ? '#0a120e' : accent,
      padding: { x: 16, y: 10 },
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setDepth(opts.depth ?? 8)
    .setInteractive({ useHandCursor: true });

  if (outlined) {
    btn.setStroke(accent, 1);
  }

  btn.on('pointerdown', opts.onClick);
  btn.on('pointerover', () => btn.setAlpha(0.88));
  btn.on('pointerout', () => btn.setAlpha(1));
  return btn;
}

export function missionCode(id: string): string {
  const m = id.match(/^(tut|plat|port)_(\d+)$/i);
  if (!m) return id.toUpperCase();
  const prefix = m[1].toLowerCase() === 'tut' ? 'NA-T' : m[1].toLowerCase() === 'plat' ? 'NA' : 'NP';
  return `${prefix}-${m[2].padStart(2, '0')}`;
}

export function missionTitle(id: string): string {
  const key = `missions.${id}_name`;
  const value = t(key);
  return value === key ? id.toUpperCase() : value;
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
