import { Egg, EggSplat, Particle } from '../types/game';
import { GAME_CONSTANTS } from './constants';

export class EggRenderer {
  // 금(Crack) 패턴 벡터
  private crackPatterns: Array<Array<{ x: number; y: number }>> = [
    [
      { x: -3, y: -15 },
      { x: 3, y: -9 },
      { x: -2, y: -3 },
      { x: 4, y: 2 },
    ],
    [
      { x: -11, y: -2 },
      { x: -5, y: 4 },
      { x: 3, y: 1 },
      { x: 9, y: 7 },
      { x: 13, y: 4 },
    ],
    [
      { x: -8, y: 8 },
      { x: -1, y: 14 },
      { x: 6, y: 11 },
      { x: 2, y: 18 },
      { x: -3, y: 20 },
    ],
  ];

  // 1. 살아있는 달걀 그리기
  public drawEgg(ctx: CanvasRenderingContext2D, egg: Egg): void {
    ctx.save();
    ctx.translate(egg.x, egg.y);

    // 회전 (우하향일 때는 시계방향, 좌하향일 때는 반시계방향 회전)
    ctx.rotate(egg.rotation);

    // 착지 시 찌그러짐 탄성
    ctx.scale(egg.squishX, egg.squishY);

    const rx = GAME_CONSTANTS.EGG_RADIUS_X;
    const ry = GAME_CONSTANTS.EGG_RADIUS_Y;

    // A. 바닥 그림자 (달걀 아래 은은한 음영)
    ctx.beginPath();
    ctx.ellipse(2, 4, rx * 0.9, ry * 0.95, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(180, 83, 9, 0.18)';
    ctx.fill();

    // B. 완벽한 기하학 달걀 곡선 (True Oval Egg Path)
    this.createTrueEggPath(ctx, rx, ry);

    if (egg.flashDamage) {
      ctx.fillStyle = '#f87171';
    } else {
      // 신선하고 매끄러운 달걀 그라데이션
      const grad = ctx.createRadialGradient(-rx * 0.35, -ry * 0.4, 2, 0, ry * 0.1, ry * 1.2);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.25, '#fffbeb');
      grad.addColorStop(0.65, '#fde68a');
      grad.addColorStop(0.9, '#f59e0b');
      grad.addColorStop(1, '#d97706');
      ctx.fillStyle = grad;
    }
    ctx.fill();

    // C. 섬세한 껍질 외곽선
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // D. 실시간 금(Crack) 렌더링
    this.drawCracks(ctx, egg.hp, egg.maxHp);

    // E. 달걀 표정 그리기 (상황에 따른 표정 변화)
    this.drawFace(ctx, egg, rx, ry);

    // F. 상단 유광 하이라이트 (매끄러운 달걀 광택)
    ctx.beginPath();
    ctx.ellipse(-rx * 0.35, -ry * 0.45, rx * 0.3, ry * 0.45, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fill();

    ctx.restore();
  }

  // 기하학적으로 완벽한 유선형 달걀 패스 (단 하나의 각진 곳도 없는 부드러운 곡면)
  private createTrueEggPath(ctx: CanvasRenderingContext2D, rx: number, ry: number): void {
    ctx.beginPath();
    // 상단 뾰족한 곡선 정점 (0, -ry)
    ctx.moveTo(0, -ry);
    // 우상단 -> 우측 허리
    ctx.bezierCurveTo(rx * 0.85, -ry, rx * 1.15, -ry * 0.2, rx * 1.1, ry * 0.4);
    // 우측 허리 -> 하단 둥근 엉덩이 (0, ry)
    ctx.bezierCurveTo(rx * 1.05, ry * 0.85, rx * 0.6, ry, 0, ry);
    // 하단 엉덩이 -> 좌측 허리
    ctx.bezierCurveTo(-rx * 0.6, ry, -rx * 1.05, ry * 0.85, -rx * 1.1, ry * 0.4);
    // 좌측 허리 -> 상단 정점
    ctx.bezierCurveTo(-rx * 1.15, -ry * 0.2, -rx * 0.85, -ry, 0, -ry);
    ctx.closePath();
  }

  // 달걀 표정 렌더링
  private drawFace(ctx: CanvasRenderingContext2D, egg: Egg, rx: number, ry: number): void {
    const eyeY = -ry * 0.05;
    const eyeDist = rx * 0.42;

    ctx.save();

    if (egg.expression === 'SURPRISED') {
      // 😱 추락 직전 경악 표정 (눈알이 튀어나오고 입이 떡 벌어짐)
      // 왼쪽 눈
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-eyeDist, eyeY - 2, 6, 0, Math.PI * 2);
      ctx.arc(eyeDist, eyeY - 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 검은 눈동자 (작게 떨림)
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(-eyeDist + 1, eyeY - 2, 2.2, 0, Math.PI * 2);
      ctx.arc(eyeDist - 1, eyeY - 2, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // 떡 벌어진 입 (O 모양)
      ctx.beginPath();
      ctx.ellipse(0, eyeY + 8, 4.5, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#78350f';
      ctx.fill();
      ctx.fillStyle = '#f87171'; // 입 속 혀
      ctx.beginPath();
      ctx.arc(0, eyeY + 11, 3, 0, Math.PI);
      ctx.fill();
    } else if (egg.expression === 'PAIN') {
      // 😣 대미지 시 눈 질끈 감음 (> <)
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      // 왼쪽 눈 >
      ctx.beginPath();
      ctx.moveTo(-eyeDist - 3, eyeY - 3);
      ctx.lineTo(-eyeDist + 2, eyeY);
      ctx.lineTo(-eyeDist - 3, eyeY + 3);
      ctx.stroke();
      // 오른쪽 눈 <
      ctx.beginPath();
      ctx.moveTo(eyeDist + 3, eyeY - 3);
      ctx.lineTo(eyeDist - 2, eyeY);
      ctx.lineTo(eyeDist + 3, eyeY + 3);
      ctx.stroke();
    } else if (egg.expression === 'DIZZY') {
      // 😵 데굴데굴 어지러운 골뱅이 눈
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.8;
      this.drawSpiral(ctx, -eyeDist, eyeY, 4.5);
      this.drawSpiral(ctx, eyeDist, eyeY, 4.5);
      // 입 (물결치듯 비틀림)
      ctx.beginPath();
      ctx.moveTo(-4, eyeY + 7);
      ctx.quadraticCurveTo(0, eyeY + 4, 4, eyeY + 7);
      ctx.stroke();
    } else {
      // 😊 평소의 귀여운 표정
      // 눈동자
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(-eyeDist, eyeY, 3, 0, Math.PI * 2);
      ctx.arc(eyeDist, eyeY, 3, 0, Math.PI * 2);
      ctx.fill();

      // 눈망울 하이라이트
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-eyeDist - 1, eyeY - 1, 1.2, 0, Math.PI * 2);
      ctx.arc(eyeDist - 1, eyeY - 1, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // 핑크빛 볼터치
      ctx.fillStyle = 'rgba(251, 113, 133, 0.6)';
      ctx.beginPath();
      ctx.ellipse(-eyeDist - 3, eyeY + 5, 3.5, 2, 0, 0, Math.PI * 2);
      ctx.ellipse(eyeDist + 3, eyeY + 5, 3.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // 방긋 웃는 입
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, eyeY + 4, 4.5, 0.2, Math.PI - 0.2);
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

  // 실시간 금 렌더링
  private drawCracks(ctx: CanvasRenderingContext2D, hp: number, maxHp: number): void {
    const ratio = Math.max(0, Math.min(1, hp / maxHp));
    if (ratio >= 0.8) return;

    ctx.save();
    ctx.strokeStyle = '#78350f';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'miter';

    if (ratio < 0.8) {
      ctx.lineWidth = 1.6;
      this.drawCrackLine(ctx, this.crackPatterns[0]);
    }
    if (ratio < 0.5) {
      ctx.lineWidth = 2.0;
      this.drawCrackLine(ctx, this.crackPatterns[1]);
    }
    if (ratio < 0.25) {
      ctx.lineWidth = 2.4;
      this.drawCrackLine(ctx, this.crackPatterns[2]);
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

  // 2. 바닥에 깨진 계란(Fried/Broken Splat) 그리기 (요구사항 8)
  public drawEggSplat(ctx: CanvasRenderingContext2D, splat: EggSplat): void {
    ctx.save();
    ctx.translate(splat.x, splat.y);
    ctx.rotate(splat.rotation);

    const r = splat.radius;

    // A. 바닥에 찰방 퍼진 흰자 웅덩이 (Egg White Splat)
    ctx.beginPath();
    ctx.moveTo(-r * 1.2, -r * 0.4);
    ctx.bezierCurveTo(-r * 1.4, -r * 1.1, -r * 0.3, -r * 1.3, r * 0.5, -r * 1.1);
    ctx.bezierCurveTo(r * 1.3, -r * 0.9, r * 1.5, -r * 0.2, r * 1.4, r * 0.6);
    ctx.bezierCurveTo(r * 1.3, r * 1.3, r * 0.2, r * 1.4, -r * 0.6, r * 1.2);
    ctx.bezierCurveTo(-r * 1.3, r * 1.1, -r * 1.5, r * 0.3, -r * 1.2, -r * 0.4);
    ctx.closePath();

    // 흰자 유광 그라데이션
    const whiteGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, r * 1.4);
    whiteGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    whiteGrad.addColorStop(0.7, 'rgba(254, 240, 138, 0.6)');
    whiteGrad.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
    ctx.fillStyle = whiteGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(253, 230, 138, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // B. 탱글탱글 살아있는 노른자 (Golden Yolk)
    const yolkGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, r * 0.55);
    yolkGrad.addColorStop(0, '#fef08a');
    yolkGrad.addColorStop(0.3, '#f59e0b');
    yolkGrad.addColorStop(0.9, '#ea580c');
    yolkGrad.addColorStop(1, '#9a3412');

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2);
    ctx.fillStyle = yolkGrad;
    ctx.fill();
    ctx.strokeStyle = '#c2410c';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 노른자 광택
    ctx.beginPath();
    ctx.ellipse(-r * 0.18, -r * 0.18, r * 0.15, r * 0.1, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();

    // C. 주변에 흩뿌려진 깨진 껍질 조각들
    for (const frag of splat.shellFragments) {
      ctx.save();
      ctx.translate(frag.offsetX, frag.offsetY);
      ctx.rotate(frag.rot);

      ctx.fillStyle = frag.color;
      ctx.beginPath();
      ctx.moveTo(0, -frag.size);
      ctx.lineTo(frag.size * 0.9, frag.size * 0.8);
      ctx.lineTo(-frag.size * 0.8, frag.size * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }

  // 껍질 폭발 파티클
  public createBreakExplosion(x: number, y: number): Particle[] {
    const particles: Particle[] = [];
    const shellColors = ['#fffbeb', '#fde68a', '#fed7aa', '#f59e0b'];

    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.5;
      const speed = 100 + Math.random() * 200;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        radius: 4 + Math.random() * 5,
        color: shellColors[i % shellColors.length],
        alpha: 1,
        life: 0,
        maxLife: 1.4,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 14,
        type: 'SHELL',
      });
    }

    return particles;
  }
}
