import { Egg, EggSplat, Particle, EggSkin } from '../types/game';
import { GAME_CONSTANTS } from './constants';
import { getEggSkinById } from '../data/eggSkins';

export class EggRenderer {
  private currentSkin: EggSkin = getEggSkinById('classic');

  public setSkin(skin: EggSkin): void {
    this.currentSkin = skin;
  }

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
    const rx = GAME_CONSTANTS.EGG_RADIUS_X;
    const ry = GAME_CONSTANTS.EGG_RADIUS_Y;
    const jumpOffset = egg.jumpArcOffset || 0;

    // A. 도로 바닥 그림자 (계란이 점프해도 그림자는 도로 표면에 유지!)
    ctx.save();
    ctx.translate(egg.x, egg.y);
    const shadowScale = Math.max(0.4, 1 - jumpOffset / 120);
    const shadowAlpha = Math.max(0.12, 0.32 - jumpOffset / 200);
    ctx.beginPath();
    ctx.ellipse(0, 4, rx * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(15, 23, 42, ${shadowAlpha})`;
    ctx.fill();
    ctx.restore();

    // B. 공중으로 점프한 달걀 본체 그리기
    ctx.save();
    // [중요] 점프 높이(jumpOffset)를 Y좌표에 완벽히 반영!
    ctx.translate(egg.x, egg.y - jumpOffset);

    // 회전 (우하향: 시계방향, 좌하향: 반시계방향)
    ctx.rotate(egg.rotation);

    // 착지 시 탄성
    ctx.scale(egg.squishX, egg.squishY);

    // 실물 달걀 황금비율 곡선 (상단 슬림 첨단, y=60% 최대폭, 풍만한 하단 둔단)
    this.createTrueEggPath(ctx, rx, ry);

    if (egg.flashDamage) {
      ctx.fillStyle = '#f87171';
    } else {
      const c = this.currentSkin.colors;
      const grad = ctx.createRadialGradient(-rx * 0.35, -ry * 0.35, 2, 0, ry * 0.1, ry * 1.25);
      grad.addColorStop(0, c.top);
      grad.addColorStop(0.2, c.mid1);
      grad.addColorStop(0.65, c.mid2);
      grad.addColorStop(0.9, c.bottom);
      grad.addColorStop(1, c.shadow);
      ctx.fillStyle = grad;
    }
    ctx.fill();

    // 껍질 외곽선
    ctx.strokeStyle = this.currentSkin.colors.line;
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // 실시간 금(Crack) 렌더링
    this.drawCracks(ctx, egg.hp, egg.maxHp);

    // 달걀 표정 그리기
    this.drawFace(ctx, egg, rx, ry);

    // 좌상단 부드러운 곡면 하이라이트 (실물 달걀의 은은한 광택)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(-rx * 0.35, -ry * 0.3, rx * 0.35, ry * 0.45, -0.32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // 실물 달걀 3차 베지어 곡선 (단 1개의 각진 곳도 없는 유선형, 상단 슬림 첨단 & y=60% 최대 폭)
  public createTrueEggPath(ctx: CanvasRenderingContext2D, rx: number, ry: number): void {
    ctx.beginPath();
    // 상단 슬림한 정점 (0, -ry)
    ctx.moveTo(0, -ry);
    // 우상단 -> 우측 최대 폭 (rx, ry * 0.20)
    ctx.bezierCurveTo(rx * 0.57, -ry, rx, -ry * 0.4, rx, ry * 0.2);
    // 우하단 -> 하단 풍만한 둔단 (0, ry)
    ctx.bezierCurveTo(rx, ry * 0.67, rx * 0.6, ry, 0, ry);
    // 좌하단 -> 좌측 최대 폭 (-rx, ry * 0.20)
    ctx.bezierCurveTo(-rx * 0.6, ry, -rx, ry * 0.67, -rx, ry * 0.2);
    // 좌상단 -> 상단 슬림 정점 (0, -ry)
    ctx.bezierCurveTo(-rx, -ry * 0.4, -rx * 0.57, -ry, 0, -ry);
    ctx.closePath();
  }

  // 달걀 표정 렌더링
  private drawFace(ctx: CanvasRenderingContext2D, egg: Egg, rx: number, ry: number): void {
    const eyeY = -ry * 0.05;
    const eyeDist = rx * 0.42;

    ctx.save();

    if (egg.expression === 'SURPRISED') {
      // 😱 추락 직전 경악 표정
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-eyeDist, eyeY - 2, 6, 0, Math.PI * 2);
      ctx.arc(eyeDist, eyeY - 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(-eyeDist + 1, eyeY - 2, 2.2, 0, Math.PI * 2);
      ctx.arc(eyeDist - 1, eyeY - 2, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(0, eyeY + 8, 4.5, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#78350f';
      ctx.fill();
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(0, eyeY + 11, 3, 0, Math.PI);
      ctx.fill();
    } else if (egg.expression === 'PAIN') {
      // 😣 대미지 시 눈 질끈 감음 (> <)
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-eyeDist - 3, eyeY - 3);
      ctx.lineTo(-eyeDist + 2, eyeY);
      ctx.lineTo(-eyeDist - 3, eyeY + 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(eyeDist + 3, eyeY - 3);
      ctx.lineTo(eyeDist - 2, eyeY);
      ctx.lineTo(eyeDist + 3, eyeY + 3);
      ctx.stroke();
    } else if (egg.expression === 'DIZZY') {
      // 😵 골뱅이 눈
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.8;
      this.drawSpiral(ctx, -eyeDist, eyeY, 4.5);
      this.drawSpiral(ctx, eyeDist, eyeY, 4.5);
      ctx.beginPath();
      ctx.moveTo(-4, eyeY + 7);
      ctx.quadraticCurveTo(0, eyeY + 4, 4, eyeY + 7);
      ctx.stroke();
    } else {
      // 😊 사랑스럽고 귀여운 평소 표정
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(-eyeDist, eyeY, 3, 0, Math.PI * 2);
      ctx.arc(eyeDist, eyeY, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-eyeDist - 1, eyeY - 1, 1.2, 0, Math.PI * 2);
      ctx.arc(eyeDist - 1, eyeY - 1, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // 볼터치
      ctx.fillStyle = 'rgba(251, 113, 133, 0.65)';
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

  // 2. 바닥에 깨진 계란(Fried Splat) 그리기
  public drawEggSplat(ctx: CanvasRenderingContext2D, splat: EggSplat): void {
    ctx.save();
    ctx.translate(splat.x, splat.y);
    ctx.rotate(splat.rotation);

    const r = splat.radius;

    // 흰자 웅덩이
    ctx.beginPath();
    ctx.moveTo(-r * 1.2, -r * 0.4);
    ctx.bezierCurveTo(-r * 1.4, -r * 1.1, -r * 0.3, -r * 1.3, r * 0.5, -r * 1.1);
    ctx.bezierCurveTo(r * 1.3, -r * 0.9, r * 1.5, -r * 0.2, r * 1.4, r * 0.6);
    ctx.bezierCurveTo(r * 1.3, r * 1.3, r * 0.2, r * 1.4, -r * 0.6, r * 1.2);
    ctx.bezierCurveTo(-r * 1.3, r * 1.1, -r * 1.5, r * 0.3, -r * 1.2, -r * 0.4);
    ctx.closePath();

    const whiteGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, r * 1.4);
    whiteGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    whiteGrad.addColorStop(0.7, 'rgba(254, 240, 138, 0.6)');
    whiteGrad.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
    ctx.fillStyle = whiteGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(253, 230, 138, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 황금빛 노른자
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

    // 껍질 조각
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
