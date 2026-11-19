import { Egg, EggSplat, Particle } from '../types/game';
import { GAME_CONSTANTS } from './constants';

export class EggRenderer {
  // 금(Crack) 패턴 벡터 (50, 58 기준 상대 좌표)
  private crackPatterns: Array<Array<{ x: number; y: number }>> = [
    [
      { x: -5, y: -24 },
      { x: 5, y: -14 },
      { x: -3, y: -5 },
      { x: 6, y: 3 },
    ],
    [
      { x: -18, y: -3 },
      { x: -8, y: 6 },
      { x: 5, y: 2 },
      { x: 15, y: 11 },
      { x: 21, y: 6 },
    ],
    [
      { x: -13, y: 13 },
      { x: -2, y: 22 },
      { x: 10, y: 17 },
      { x: 3, y: 29 },
      { x: -5, y: 32 },
    ],
  ];

  // 1. 투명 와이어프레임 달걀 본체 및 바닥 접지 그림자 테두리
  public drawEgg(ctx: CanvasRenderingContext2D, egg: Egg): void {
    const rx = GAME_CONSTANTS.EGG_RADIUS_X;
    const ry = GAME_CONSTANTS.EGG_RADIUS_Y;
    const jumpOffset = egg.jumpArcOffset || 0;
    const groundY = egg.y + ry - 4;

    // A. 바닥 접지 그림자 (에셋 모드: 부드러운 갈색 그림자, 와이어프레임 모드: 점선 테두리)
    if (egg.state === 'ROLLING' || egg.state === 'JUMPING') {
      ctx.save();
      const shadowScale = Math.max(0.45, 1 - jumpOffset / 120);
      if (this.filledShell) {
        ctx.fillStyle = `rgba(38, 18, 8, ${(0.46 * shadowScale).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(egg.x, groundY + 1, rx * 1.12 * shadowScale, 6.8 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.ellipse(egg.x, groundY, rx * shadowScale, 5.5 * shadowScale, 0, 0, Math.PI * 2);
        ctx.stroke();

        if (jumpOffset > 2) {
          ctx.strokeStyle = 'rgba(2, 132, 199, 0.45)';
          ctx.beginPath();
          ctx.moveTo(egg.x, groundY);
          ctx.lineTo(egg.x, egg.y - jumpOffset + ry - 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // B. 투명 테두리 달걀 본체
    ctx.save();
    ctx.translate(egg.x, egg.y - jumpOffset);
    ctx.rotate(egg.rotation);

    // SVG (0..100, 0..116, 중심 50, 58) 황금비율 좌표계 매핑
    ctx.scale(egg.squishX * (rx / 42), egg.squishY * (ry / 48));
    ctx.translate(-50, -58);

    const shellPath = new Path2D(
      'M 50 10 C 74 10, 92 38, 92 65 C 92 90, 75 106, 50 106 C 25 106, 8 90, 8 65 C 8 38, 26 10, 50 10 Z'
    );
    if (this.filledShell) {
      const eggGrad = ctx.createRadialGradient(38, 38, 6, 50, 62, 54);
      if (egg.flashDamage) {
        eggGrad.addColorStop(0, '#fff5f5');
        eggGrad.addColorStop(0.65, '#fecaca');
        eggGrad.addColorStop(1, '#f87171');
      } else {
        eggGrad.addColorStop(0, '#fffdf7');
        eggGrad.addColorStop(0.58, '#f6e7c8');
        eggGrad.addColorStop(1, '#dcbf8e');
      }
      ctx.fillStyle = eggGrad;
      ctx.fill(shellPath);

      // 상단 좌측 따뜻한 햇살 하이라이트
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.beginPath();
      ctx.ellipse(36, 36, 9, 15, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = egg.flashDamage ? '#ef4444' : this.filledShell ? '#3d2210' : '#0f172a';
    ctx.lineWidth = this.filledShell ? 4.6 : 4.2;
    ctx.lineJoin = 'round';
    ctx.stroke(shellPath);

    // 구름 각도(Rotation) 확인용 장식 (에셋 모드: 껍질 반점, 와이어프레임: 십자 보조선)
    ctx.save();
    if (this.filledShell) {
      ctx.fillStyle = 'rgba(180, 128, 72, 0.36)';
      ctx.beginPath();
      ctx.arc(68, 34, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(28, 76, 3.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(62, 86, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(50, 12);
      ctx.lineTo(50, 104);
      ctx.moveTo(10, 62);
      ctx.lineTo(90, 62);
      ctx.stroke();
    }
    ctx.restore();

    // 실시간 대미지 금(Crack)
    this.drawCracks(ctx, egg.hp, egg.maxHp);

    // 최소화된 테두리 표정 (상태 식별용)
    this.drawFace(ctx, egg);

    ctx.restore();
  }

  private drawFace(ctx: CanvasRenderingContext2D, egg: Egg): void {
    ctx.save();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';

    if (egg.expression === 'SURPRISED') {
      ctx.beginPath();
      ctx.arc(38, 60, 5.5, 0, Math.PI * 2);
      ctx.arc(64, 60, 5.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(51, 74, 4.5, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (egg.expression === 'PAIN') {
      ctx.beginPath();
      ctx.moveTo(34, 58);
      ctx.lineTo(41, 62);
      ctx.lineTo(34, 66);
      ctx.moveTo(68, 58);
      ctx.lineTo(61, 62);
      ctx.lineTo(68, 66);
      ctx.stroke();
    } else if (egg.expression === 'DIZZY') {
      this.drawSpiral(ctx, 38, 62, 4.5);
      this.drawSpiral(ctx, 64, 62, 4.5);
      ctx.beginPath();
      ctx.moveTo(46, 73);
      ctx.quadraticCurveTo(51, 69, 56, 73);
      ctx.stroke();
    } else {
      // 기본 표정 (속이 빈 테두리 눈 & 미소)
      ctx.beginPath();
      ctx.arc(38, 62, 3.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(64, 62, 3.8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(44, 71);
      ctx.quadraticCurveTo(51, 77, 58, 71);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawSpiral(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.5, Math.PI * 0.5, Math.PI * 2);
    ctx.stroke();
  }

  private drawCracks(ctx: CanvasRenderingContext2D, hp: number, maxHp: number): void {
    const ratio = Math.max(0, Math.min(1, hp / maxHp));
    if (ratio >= 0.8) return;

    ctx.save();
    ctx.strokeStyle = '#dc2626';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'miter';

    if (ratio < 0.8) {
      ctx.lineWidth = 2.6;
      this.drawCrackLine(ctx, this.crackPatterns[0]);
    }
    if (ratio < 0.5) {
      ctx.lineWidth = 3.0;
      this.drawCrackLine(ctx, this.crackPatterns[1]);
    }
    if (ratio < 0.25) {
      ctx.lineWidth = 3.4;
      this.drawCrackLine(ctx, this.crackPatterns[2]);
    }

    ctx.restore();
  }

  private drawCrackLine(ctx: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>): void {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x + 50, points[0].y + 58);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x + 50, points[i].y + 58);
    }
    ctx.stroke();
  }

  private filledShell = true;

  public setFilledShell(filled: boolean): void {
    this.filledShell = filled;
  }

  // 2. 파손(Splat) 와이어프레임 테두리
  public drawEggSplat(ctx: CanvasRenderingContext2D, splat: EggSplat): void {
    ctx.save();
    ctx.translate(splat.x, splat.y);
    ctx.rotate(splat.rotation);

    const r = splat.radius;

    ctx.save();
    ctx.setLineDash(this.filledShell ? [] : [4, 3]);
    ctx.strokeStyle = this.filledShell ? '#e2e8f0' : '#94a3b8';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-r * 1.2, -r * 0.4);
    ctx.bezierCurveTo(-r * 1.4, -r * 1.1, -r * 0.3, -r * 1.3, r * 0.5, -r * 1.1);
    ctx.bezierCurveTo(r * 1.3, -r * 0.9, r * 1.5, -r * 0.2, r * 1.4, r * 0.6);
    ctx.bezierCurveTo(r * 1.3, r * 1.3, r * 0.2, r * 1.4, -r * 0.6, r * 1.2);
    ctx.bezierCurveTo(-r * 1.3, r * 1.1, -r * 1.5, r * 0.3, -r * 1.2, -r * 0.4);
    ctx.closePath();
    if (this.filledShell) {
      ctx.fillStyle = 'rgba(255, 250, 240, 0.92)';
      ctx.fill();
    }
    ctx.stroke();
    ctx.restore();

    if (this.filledShell) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    for (const frag of splat.shellFragments) {
      ctx.save();
      ctx.translate(frag.offsetX, frag.offsetY);
      ctx.rotate(frag.rot);

      ctx.strokeStyle = this.filledShell ? '#3d2210' : '#0f172a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -frag.size);
      ctx.lineTo(frag.size * 0.9, frag.size * 0.8);
      ctx.lineTo(-frag.size * 0.8, frag.size * 0.7);
      ctx.closePath();
      if (this.filledShell) {
        ctx.fillStyle = '#f6e7c8';
        ctx.fill();
      }
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }

  // 3. 껍질 파편 와이어프레임 파티클
  public createBreakExplosion(x: number, y: number): Particle[] {
    const particles: Particle[] = [];

    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.4;
      const speed = 100 + Math.random() * 180;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        radius: 4 + Math.random() * 4,
        color: '#0f172a',
        alpha: 1,
        life: 0,
        maxLife: 1.2,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 14,
        type: 'SHELL',
      });
    }

    return particles;
  }
}
