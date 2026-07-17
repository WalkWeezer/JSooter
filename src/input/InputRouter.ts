import Phaser from 'phaser';

export type InputState = {
  moveX: number;
  moveY: number;
  aimX: number;
  aimY: number;
  attack: boolean;
  interact: boolean;
};

/**
 * Desktop: WASD + mouse aim + LMB
 * Mobile: twin virtual sticks + attack button
 */
export class InputRouter {
  private keys!: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    e: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private attackPressed = false;
  private interactPressed = false;

  private leftStick = { active: false, dx: 0, dy: 0, id: -1 };
  private rightStick = { active: false, dx: 0, dy: 0, id: -1 };
  private baseLeft = { x: 0, y: 0 };
  private baseRight = { x: 0, y: 0 };

  private leftGfx?: Phaser.GameObjects.Graphics;
  private rightGfx?: Phaser.GameObjects.Graphics;
  private attackBtn?: Phaser.GameObjects.Container;
  private isTouch: boolean;

  constructor(private scene: Phaser.Scene) {
    const params = new URLSearchParams(window.location.search);
    const forceTouch =
      params.get('mobile') === '1' ||
      params.get('touch') === '1' ||
      scene.registry.get('forceTouchUi') === true ||
      scene.scale.width < 720;
    this.isTouch = Boolean(
      forceTouch || scene.sys.game.device.input.touch || scene.sys.game.device.os.android || scene.sys.game.device.os.iOS,
    );
    const kb = scene.input.keyboard!;
    this.keys = {
      w: kb.addKey('W'),
      a: kb.addKey('A'),
      s: kb.addKey('S'),
      d: kb.addKey('D'),
      e: kb.addKey('E'),
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
    };

    scene.input.on('pointerdown', this.onPointerDown, this);
    scene.input.on('pointermove', this.onPointerMove, this);
    scene.input.on('pointerup', this.onPointerUp, this);

    if (this.isTouch) {
      this.createTouchUi();
    }
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    this.leftGfx?.destroy();
    this.rightGfx?.destroy();
    this.attackBtn?.destroy();
  }

  hasTouchUi(): boolean {
    return Boolean(this.leftGfx);
  }

  consumeAttack(): boolean {
    const v = this.attackPressed;
    this.attackPressed = false;
    return v;
  }

  consumeInteract(): boolean {
    const v = this.interactPressed || Phaser.Input.Keyboard.JustDown(this.keys.e);
    this.interactPressed = false;
    return v;
  }

  getState(playerX: number, playerY: number): InputState {
    let moveX = 0;
    let moveY = 0;
    let aimX = 0;
    let aimY = 0;

    if (this.keys.a.isDown || this.keys.left.isDown) moveX -= 1;
    if (this.keys.d.isDown || this.keys.right.isDown) moveX += 1;
    if (this.keys.w.isDown || this.keys.up.isDown) moveY -= 1;
    if (this.keys.s.isDown || this.keys.down.isDown) moveY += 1;

    if (this.leftStick.active) {
      moveX = this.leftStick.dx;
      moveY = this.leftStick.dy;
    }

    const pointer = this.scene.input.activePointer;
    if (!this.leftGfx) {
      const world = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      aimX = world.x - playerX;
      aimY = world.y - playerY;
    } else if (this.rightStick.active) {
      aimX = this.rightStick.dx;
      aimY = this.rightStick.dy;
    } else if (Math.abs(moveX) + Math.abs(moveY) > 0.1) {
      aimX = moveX;
      aimY = moveY;
    }

    const len = Math.hypot(moveX, moveY) || 1;
    if (len > 1) {
      moveX /= len;
      moveY /= len;
    }

    return {
      moveX,
      moveY,
      aimX,
      aimY,
      attack: false,
      interact: false,
    };
  }

  private createTouchUi(): void {
    const cam = this.scene.cameras.main;
    const pad = Number(this.scene.registry.get('stickyPaddingPx') || 90);
    const y = cam.height - Math.max(110, pad + 70);
    this.baseLeft = { x: 90, y };
    this.baseRight = { x: cam.width - 160, y };

    this.leftGfx = this.scene.add.graphics().setScrollFactor(0).setDepth(1000);
    this.rightGfx = this.scene.add.graphics().setScrollFactor(0).setDepth(1000);
    this.drawStick(this.leftGfx, this.baseLeft.x, this.baseLeft.y, 0, 0, 0x2de2e6);
    this.drawStick(this.rightGfx, this.baseRight.x, this.baseRight.y, 0, 0, 0xff2a6d);

    const btnBg = this.scene.add.circle(0, 0, 34, 0xff2a6d, 0.85);
    const btnLabel = this.scene.add
      .text(0, 0, 'ATK', { fontFamily: '"Exo 2", sans-serif', fontSize: '14px', color: '#0B0D12', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.attackBtn = this.scene.add
      .container(cam.width - 70, y - 90, [btnBg, btnLabel])
      .setScrollFactor(0)
      .setDepth(1001)
      .setSize(68, 68)
      .setInteractive(
        new Phaser.Geom.Circle(0, 0, 34),
        Phaser.Geom.Circle.Contains,
      );

    this.attackBtn.on('pointerdown', () => {
      this.attackPressed = true;
      this.interactPressed = true;
    });
  }

  private drawStick(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    dx: number,
    dy: number,
    color: number,
  ): void {
    g.clear();
    g.lineStyle(2, color, 0.5);
    g.strokeCircle(x, y, 54);
    g.fillStyle(color, 0.35);
    g.fillCircle(x + dx * 34, y + dy * 34, 22);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.leftGfx) return;
    if (pointer.x < this.scene.scale.width * 0.45 && this.leftStick.id < 0) {
      this.leftStick = { active: true, dx: 0, dy: 0, id: pointer.id };
      this.baseLeft = { x: pointer.x, y: pointer.y };
    } else if (pointer.x >= this.scene.scale.width * 0.45 && this.rightStick.id < 0) {
      // ignore if hitting attack button area roughly
      if (this.attackBtn) {
        const b = this.attackBtn;
        const d = Phaser.Math.Distance.Between(pointer.x, pointer.y, b.x, b.y);
        if (d < 50) return;
      }
      this.rightStick = { active: true, dx: 0, dy: 0, id: pointer.id };
      this.baseRight = { x: pointer.x, y: pointer.y };
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.leftStick.id) {
      const dx = (pointer.x - this.baseLeft.x) / 54;
      const dy = (pointer.y - this.baseLeft.y) / 54;
      const len = Math.hypot(dx, dy) || 1;
      this.leftStick.dx = Phaser.Math.Clamp(dx / Math.max(1, len), -1, 1) * Math.min(1, len);
      this.leftStick.dy = Phaser.Math.Clamp(dy / Math.max(1, len), -1, 1) * Math.min(1, len);
      if (len > 1) {
        this.leftStick.dx = dx / len;
        this.leftStick.dy = dy / len;
      } else {
        this.leftStick.dx = dx;
        this.leftStick.dy = dy;
      }
      this.drawStick(this.leftGfx!, this.baseLeft.x, this.baseLeft.y, this.leftStick.dx, this.leftStick.dy, 0x2de2e6);
    }
    if (pointer.id === this.rightStick.id) {
      const dx = (pointer.x - this.baseRight.x) / 54;
      const dy = (pointer.y - this.baseRight.y) / 54;
      const len = Math.hypot(dx, dy) || 1;
      if (len > 1) {
        this.rightStick.dx = dx / len;
        this.rightStick.dy = dy / len;
      } else {
        this.rightStick.dx = dx;
        this.rightStick.dy = dy;
      }
      this.drawStick(
        this.rightGfx!,
        this.baseRight.x,
        this.baseRight.y,
        this.rightStick.dx,
        this.rightStick.dy,
        0xff2a6d,
      );
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.leftStick.id) {
      this.leftStick = { active: false, dx: 0, dy: 0, id: -1 };
      this.drawStick(this.leftGfx!, this.baseLeft.x, this.baseLeft.y, 0, 0, 0x2de2e6);
    }
    if (pointer.id === this.rightStick.id) {
      this.rightStick = { active: false, dx: 0, dy: 0, id: -1 };
      this.drawStick(this.rightGfx!, this.baseRight.x, this.baseRight.y, 0, 0, 0xff2a6d);
    }
  }
}
