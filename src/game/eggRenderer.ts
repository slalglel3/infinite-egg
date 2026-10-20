import { Egg, Particle } from '../types/game';
import { GAME_CONSTANTS } from './constants';

export class EggRenderer {
  // 계란의 고유한 금(Crack) 패턴 벡터 (미리 생성해 일관된 모양 유지)
  private crackPatterns: Array<Array<{ x: number; y: number }>> = [
    // 금 패턴 1 (상단 실금)
    [
      { x: -2, y: -16 },
      { x: 3, y: -11 },
      { x: -1, y: -6 },
      { x: 4, y: -1 },
    ],
    // 금 패턴 2 (중앙 대각선 금)
    [
      { x: -12, y: -2 },
      { x: -6, y: 3 },
      { x: 2, y: 0 },
      { x: 8, y: 7 },
      { x: 14, y: 5 },
    ],
    // 금 패턴 3 (하단 심각한 균열)
    [
      { x: -8, y: 8 },
      { x: -2, y: 13 },
      { x: 5, y: 10 },
      { x: 1, y: 17 },
      { x: -4, y: 19 },
    ],
    // 금 패턴 4 (노른자 노출 균열)
    [
      { x: -5, y: -4 },
      { x: 6, y: -3 },
      { x: 3, y: 4 },
      { x: -7, y: 3 },
    ],
  ];

  public drawEgg(ctx: CanvasRenderingContext2D, egg: Egg): void {
    ctx.save();
    ctx.translate(egg.x, egg.y);

    // 착지 시 찌그러짐(Squish) 탄성 스케일 적용
    const scaleX = (egg.direction === 'LEFT_DOWN' ? -1 : 1) * egg.squishX;
    const scaleY = egg.squishY;
    ctx.scale(scaleX, scaleY);

    // 회전 (데굴데굴 굴러가는 각도)
    ctx.rotate(egg.rotation);

    const rx = GAME_CONSTANTS.EGG_RADIUS_X;
    const ry = GAME_CONSTANTS.EGG_RADIUS_Y;

    // 1. 계란 외곽 베이스 형태 (Egg Shape Path)
    this.createEggPath(ctx, rx, ry);

    // 피격 시 붉은 점멸 또는 일반 계란 색상
    if (egg.flashDamage) {
      ctx.fillStyle = '#f87171'; // 밝은 빨강
    } else {
      // 부드러운 그라데이션 (입체감)
      const grad = ctx.createRadialGradient(-rx * 0.3, -ry * 0.4, 2, 0, 0, ry * 1.1);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, GAME_CONSTANTS.COLORS.EGG_BODY);
      grad.addColorStop(0.8, '#fde68a');
      grad.addColorStop(1, GAME_CONSTANTS.COLORS.EGG_SHADOW);
      ctx.fillStyle = grad;
    }
    ctx.fill();

    // 2. 외곽선 테두리
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // 3. 내구도에 따른 금(Crack) 렌더링
    this.drawCracks(ctx, egg.hp, egg.maxHp);

    // 4. 상단 매끄러운 광택(하이라이트 타원)
    ctx.beginPath();
    ctx.ellipse(-rx * 0.35, -ry * 0.45, rx * 0.28, ry * 0.4, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();

    ctx.restore();
  }

  // 계란 곡선 패스 생성 (위는 좁고 아래는 둥근 달걀 형태)
  private createEggPath(ctx: CanvasRenderingContext2D, rx: number, ry: number): void {
    ctx.beginPath();
    ctx.moveTo(0, -ry);
    // 상단 -> 우측 -> 하단
    ctx.bezierCurveTo(rx * 0.9, -ry, rx * 1.15, ry * 0.3, rx * 0.95, ry * 0.85);
    ctx.bezierCurveTo(rx * 0.7, ry * 1.1, -rx * 0.7, ry * 1.1, -rx * 0.95, ry * 0.85);
    ctx.bezierCurveTo(-rx * 1.15, ry * 0.3, -rx * 0.9, -ry, 0, -ry);
    ctx.closePath();
  }

  // 내구도(HP) 비율에 따른 단계별 금 렌더링
  private drawCracks(ctx: CanvasRenderingContext2D, hp: number, maxHp: number): void {
    const ratio = Math.max(0, Math.min(1, hp / maxHp));

    // HP가 80% 이상이면 금 없음
    if (ratio >= 0.8) return;

    ctx.save();
    ctx.strokeStyle = GAME_CONSTANTS.COLORS.EGG_CRACK;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'miter';

    // 1단계 실금 (HP 50% ~ 80%)
    if (ratio < 0.8) {
      ctx.lineWidth = 1.4;
      this.drawCrackLine(ctx, this.crackPatterns[0]);
    }

    // 2단계 균열 (HP 25% ~ 50%)
    if (ratio < 0.5) {
      ctx.lineWidth = 1.8;
      this.drawCrackLine(ctx, this.crackPatterns[1]);
    }

    // 3단계 심각한 파손 (HP 0% ~ 25%)
    if (ratio < 0.25) {
      ctx.lineWidth = 2.2;
      this.drawCrackLine(ctx, this.crackPatterns[2]);
      
      // 틈새 사이로 노른자 황금빛이 살짝 새어나오는 효과
      ctx.fillStyle = GAME_CONSTANTS.COLORS.EGG_YOLK;
      ctx.beginPath();
      const p = this.crackPatterns[3];
      ctx.moveTo(p[0].x, p[0].y);
      for (let i = 1; i < p.length; i++) {
        ctx.lineTo(p[i].x, p[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawCrackLine(ctx: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>): void {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

  // 계란 파괴 시 폭발 파티클 생성
  public createBreakExplosion(x: number, y: number): Particle[] {
    const particles: Particle[] = [];

    // 1. 계란 껍질 조각 (8~12개)
    const shellColors = ['#fffbeb', '#fde68a', '#fed7aa', '#f59e0b'];
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.4;
      const speed = 120 + Math.random() * 220;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 90, // 위로 살짝 솟구침
        radius: 4 + Math.random() * 5,
        color: shellColors[i % shellColors.length],
        alpha: 1,
        life: 0,
        maxLife: 1.2 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 12,
        type: 'SHELL',
      });
    }

    // 2. 노른자 방울 (황금빛 파티클 6개)
    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 140;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        radius: 6 + Math.random() * 6,
        color: '#f59e0b',
        alpha: 1,
        life: 0,
        maxLife: 0.9 + Math.random() * 0.3,
        type: 'YOLK',
      });
    }

    return particles;
  }
}
