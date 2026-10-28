import { Egg, EggSplat, Particle, EggSkin } from '../types/game';
import { GAME_CONSTANTS } from './constants';
import { getEggSkinById } from '../data/eggSkins';

export class EggRenderer {
  private currentSkin: EggSkin = getEggSkinById('classic');
  private costumes: { hat?: string; top?: string; bottom?: string; hand?: string } = {};

  public setSkin(skin: EggSkin): void {
    this.currentSkin = skin;
  }

  public setCostumes(costumes?: { hat?: string; top?: string; bottom?: string; hand?: string }): void {
    this.costumes = costumes || {};
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

    // 스킨 고유 패턴 (점박이, 에메랄드 균열, 사이버 라인, 4대 특수 계란 등)
    this.drawSkinPatterns(ctx, rx, ry, egg);

    // 실시간 금(Crack) 렌더링
    this.drawCracks(ctx, egg.hp, egg.maxHp);

    // 달걀 표정 그리기 (홈 화면과 100% 동일한 눈/볼터치/미소 및 특수 계란 얼굴)
    this.drawFace(ctx, egg, rx, ry);

    // [피드백 8 & 9 반영] 의상 코스튬 렌더링 (모자, 상의, 하의, 손)
    this.drawCostumes(ctx, rx, ry);

    // 좌상단 부드러운 곡면 하이라이트 (실물 달걀의 은은한 광택)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(-rx * 0.35, -ry * 0.25, rx * 0.35, ry * 0.42, -0.32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // [피드백 1 반영] 실물 달걀 3차 베지어 곡선 (세로 비율을 단축하여 통통하고 둥근 형태, 상단 슬림 첨단 & y=60% 최대 폭)
  public createTrueEggPath(ctx: CanvasRenderingContext2D, rx: number, ry: number): void {
    ctx.beginPath();
    // 상단 슬림한 정점 (0, -ry)
    ctx.moveTo(0, -ry);
    // 우상단 -> 우측 최대 폭 (rx, ry * 0.18)
    ctx.bezierCurveTo(rx * 0.58, -ry, rx, -ry * 0.35, rx, ry * 0.18);
    // 우하단 -> 하단 풍만한 둔단 (0, ry)
    ctx.bezierCurveTo(rx, ry * 0.65, rx * 0.6, ry, 0, ry);
    // 좌하단 -> 좌측 최대 폭 (-rx, ry * 0.18)
    ctx.bezierCurveTo(-rx * 0.6, ry, -rx, ry * 0.65, -rx, ry * 0.18);
    // 좌상단 -> 상단 슬림 정점 (0, -ry)
    ctx.bezierCurveTo(-rx, -ry * 0.35, -rx * 0.58, -ry, 0, -ry);
    ctx.closePath();
  }

  // 캔버스 인게임 의상 렌더링
  private drawCostumes(ctx: CanvasRenderingContext2D, rx: number, ry: number): void {
    // [피드백 2 & 3] 의상이 갖춰진 고유 계란이면 번들 의상을 자동 장착, 순수 계란이면 유저 커스텀 의상 렌더링
    const effective = (this.currentSkin.hasFixedOutfit && this.currentSkin.bundledCostumes)
      ? this.currentSkin.bundledCostumes
      : this.costumes;

    const { hat, top, bottom, hand } = effective;

    // 1. 하의
    if (bottom === 'police_bottom') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-rx * 0.85, ry * 0.52, rx * 1.7, ry * 0.2);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-rx * 0.22, ry * 0.50, rx * 0.44, ry * 0.24);
    } else if (bottom === 'cowboy_bottom') {
      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.arc(0, ry * 0.35, rx * 0.95, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-rx * 0.85, ry * 0.45, rx * 1.7, ry * 0.18);
    } else if (bottom === 'mermaid_bottom') {
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(0, ry * 0.4, rx * 0.95, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#34d399';
      // 꼬리 날개
      ctx.beginPath();
      ctx.moveTo(-rx * 0.5, ry);
      ctx.lineTo(-rx * 0.9, ry + 6);
      ctx.lineTo(0, ry + 2);
      ctx.lineTo(rx * 0.9, ry + 6);
      ctx.lineTo(rx * 0.5, ry);
      ctx.fill();
    } else if (bottom === 'king_bottom') {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-rx * 0.85, ry * 0.52, rx * 1.7, ry * 0.2);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, ry * 0.62, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. 상의 - [피드백 10] 얼굴(눈/볼터치/미소 ry: 0.05~0.25) 아래 목/가슴 위치(ry: 0.28 ~ 0.52)로 정확히 배치
    if (top === 'police_top') {
      // 흰 칼라 & 검정 넥타이
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-4, ry * 0.28);
      ctx.lineTo(4, ry * 0.28);
      ctx.lineTo(0, ry * 0.38);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-2, ry * 0.32);
      ctx.lineTo(2, ry * 0.32);
      ctx.lineTo(3, ry * 0.54);
      ctx.lineTo(0, ry * 0.60);
      ctx.lineTo(-3, ry * 0.54);
      ctx.closePath();
      ctx.fill();
      // 경찰 배지
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-rx * 0.65, ry * 0.35, 4, 4.5);
    } else if (top === 'cowboy_top') {
      // 빨간 반다나 스카프
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(-rx * 0.45, ry * 0.28);
      ctx.lineTo(rx * 0.45, ry * 0.28);
      ctx.lineTo(0, ry * 0.48);
      ctx.closePath();
      ctx.fill();
      // 조끼
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-rx * 0.82, ry * 0.34, rx * 0.35, ry * 0.25);
      ctx.fillRect(rx * 0.47, ry * 0.34, rx * 0.35, ry * 0.25);
    } else if (top === 'mermaid_top') {
      // 보라 조개
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.ellipse(-rx * 0.38, ry * 0.36, 5, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(rx * 0.38, ry * 0.36, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f3e8ff';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (top === 'king_top') {
      // 붉은 망토 칼라
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, ry * 0.3, rx * 0.85, 0, Math.PI);
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#f8fafc';
      ctx.stroke();
    }

    // 3. 모자
    if (hat === 'police_hat') {
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.ellipse(0, -ry * 0.9, rx * 0.75, ry * 0.35, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-rx * 0.8, -ry * 0.9, rx * 1.6, 3.5);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-2, -ry * 1.05, 4, 4);
    } else if (hat === 'cowboy_hat') {
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(0, -ry * 0.85, rx * 1.15, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.arc(0, -ry * 0.95, rx * 0.6, Math.PI, Math.PI * 2);
      ctx.fill();
    } else if (hat === 'mermaid_hat') {
      ctx.fillStyle = '#ffffff';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(i * 5, -ry * 0.92, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, -ry * 1.05, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (hat === 'king_hat') {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(-rx * 0.65, -ry * 0.85);
      ctx.lineTo(-rx * 0.65, -ry * 1.25);
      ctx.lineTo(-rx * 0.25, -ry * 1.05);
      ctx.lineTo(0, -ry * 1.35);
      ctx.lineTo(rx * 0.25, -ry * 1.05);
      ctx.lineTo(rx * 0.65, -ry * 1.25);
      ctx.lineTo(rx * 0.65, -ry * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-rx * 0.65, -ry * 0.9, rx * 1.3, 2.5);
    }

    // 4. 손
    if (hand === 'police_hand') {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rx * 0.85, ry * 0.2);
      ctx.lineTo(rx * 1.25, -ry * 0.2);
      ctx.stroke();
    } else if (hand === 'cowboy_hand') {
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(rx * 1.1, ry * 0.1, 4, 7, 0.4, 0, Math.PI * 2);
      ctx.stroke();
    } else if (hand === 'mermaid_hand') {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rx * 0.85, ry * 0.4);
      ctx.lineTo(rx * 1.15, -ry * 0.35);
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(rx * 1.05, -ry * 0.45, 6, 4);
    } else if (hand === 'king_hand') {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rx * 0.85, ry * 0.4);
      ctx.lineTo(rx * 1.15, -ry * 0.3);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(rx * 1.18, -ry * 0.35, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
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
      // 평소 표정 (특수 계란별 고유 얼굴 또는 귀여운 기본 표정)
      const special = this.currentSkin.specialType;

      if (special === 'METAL') {
        // [사이버 메탈란] 오른쪽 네온 그린 LED 사이버 센서 눈 & 메카닉 입
        // 1. 왼쪽 눈 (일반 메탈릭 렌즈)
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(-eyeDist, eyeY, 2.8, 0, Math.PI * 2);
        ctx.fill();

        // 2. 오른쪽 눈 (사이버네틱 네온 그린 LED 렌즈 - 외곽 링 + 눈부심)
        ctx.save();
        ctx.fillStyle = 'rgba(74, 222, 128, 0.35)';
        ctx.beginPath();
        ctx.arc(eyeDist, eyeY, 6.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(eyeDist, eyeY, 4.2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(eyeDist, eyeY, 2.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeDist - 0.8, eyeY - 0.8, 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 메탈 볼터치
        ctx.fillStyle = '#cbd5e1';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(-eyeDist - 3, eyeY + 5, 3.2, 1.8, 0, 0, Math.PI * 2);
        ctx.ellipse(eyeDist + 3, eyeY + 5, 3.2, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // 사이버네틱 직선 슬릿 입
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-3, eyeY + 6);
        ctx.lineTo(3, eyeY + 6);
        ctx.stroke();
      } else if (special === 'DEVIL') {
        // [심연의 악마란] 붉은 눈과 날카로운 악마 송곳니 미소
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(-eyeDist, eyeY, 3.4, 0, Math.PI * 2);
        ctx.arc(eyeDist, eyeY, 3.4, 0, Math.PI * 2);
        ctx.fill();

        // 붉은 눈 안쪽 하이라이트
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.arc(-eyeDist - 1, eyeY - 1, 1.2, 0, Math.PI * 2);
        ctx.arc(eyeDist - 1, eyeY - 1, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // 짙은 검붉은 볼터치
        ctx.fillStyle = '#7f1d1d';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(-eyeDist - 4, eyeY + 5, 3.5, 2.0, 0, 0, Math.PI * 2);
        ctx.ellipse(eyeDist + 4, eyeY + 5, 3.5, 2.0, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // 악마 이빨 미소 (벌린 입 + 상단 2개 뾰족한 송곳니)
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.moveTo(-4, eyeY + 4.5);
        ctx.quadraticCurveTo(0, eyeY + 9, 4, eyeY + 4.5);
        ctx.closePath();
        ctx.fill();

        // 하얀 송곳니 2개
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-3, eyeY + 4.5);
        ctx.lineTo(-1.8, eyeY + 7);
        ctx.lineTo(-0.8, eyeY + 4.5);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0.8, eyeY + 4.5);
        ctx.lineTo(1.8, eyeY + 7);
        ctx.lineTo(3, eyeY + 4.5);
        ctx.fill();
      } else {
        // 😊 사랑스럽고 귀여운 평소 표정 (홈 화면과 100% 동일한 눈 & 반짝임 & 핑크 볼터치 & 방긋 미소)
        const colors = this.currentSkin.colors;

        ctx.fillStyle = colors.eyeColor;
        ctx.beginPath();
        ctx.arc(-eyeDist, eyeY, 3.2, 0, Math.PI * 2);
        ctx.arc(eyeDist, eyeY, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // 초롱초롱 눈 반짝임
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-eyeDist - 1, eyeY - 1, 1.3, 0, Math.PI * 2);
        ctx.arc(eyeDist - 1, eyeY - 1, 1.3, 0, Math.PI * 2);
        ctx.fill();

        // 핑크 볼터치
        ctx.fillStyle = colors.cheekColor;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.ellipse(-eyeDist - 4, eyeY + 5, 3.8, 2.2, 0, 0, Math.PI * 2);
        ctx.ellipse(eyeDist + 4, eyeY + 5, 3.8, 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // 방긋 미소
        ctx.strokeStyle = colors.eyeColor;
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3, eyeY + 4.5);
        ctx.quadraticCurveTo(0, eyeY + 7.5, 3, eyeY + 4.5);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // 스킨별 고유 패턴 렌더링
  private drawSkinPatterns(ctx: CanvasRenderingContext2D, rx: number, ry: number, egg: Egg): void {
    const pattern = this.currentSkin.colors.pattern;
    if (!pattern || pattern === 'NONE') return;

    ctx.save();
    if (pattern === 'SPOTS') {
      ctx.fillStyle = this.currentSkin.colors.line;
      ctx.globalAlpha = 0.38;
      ctx.beginPath();
      ctx.arc(-rx * 0.4, -ry * 0.2, 2.5, 0, Math.PI * 2);
      ctx.arc(rx * 0.45, -ry * 0.3, 2.8, 0, Math.PI * 2);
      ctx.arc(-rx * 0.5, ry * 0.4, 3, 0, Math.PI * 2);
      ctx.arc(rx * 0.5, ry * 0.35, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (pattern === 'CRACKS') {
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2.0;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.moveTo(0, -ry * 0.6);
      ctx.lineTo(rx * 0.2, -ry * 0.2);
      ctx.lineTo(-rx * 0.1, ry * 0.1);
      ctx.lineTo(rx * 0.25, ry * 0.4);
      ctx.stroke();
    } else if (pattern === 'CYBER_LINES') {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(-rx * 0.6, -ry * 0.1);
      ctx.lineTo(0, -ry * 0.1);
      ctx.lineTo(rx * 0.3, -ry * 0.3);
      ctx.stroke();
    } else if (pattern === 'FIRE_AURA') {
      ctx.fillStyle = '#f97316';
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(0, -ry * 0.6, 4, 0, Math.PI * 2);
      ctx.arc(-rx * 0.6, 0, 5, 0, Math.PI * 2);
      ctx.arc(rx * 0.6, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (pattern === 'METAL_BOLTS') {
      // [사이버 메탈란] 둘레를 따라 균일하게 박힌 8개의 정밀 메탈릭 볼트 나사
      const bolts = [
        { x: -rx * 0.45, y: -ry * 0.72 },
        { x: rx * 0.45, y: -ry * 0.72 },
        { x: -rx * 0.82, y: -ry * 0.22 },
        { x: rx * 0.82, y: -ry * 0.22 },
        { x: -rx * 0.84, y: ry * 0.32 },
        { x: rx * 0.84, y: ry * 0.32 },
        { x: -rx * 0.48, y: ry * 0.76 },
        { x: rx * 0.48, y: ry * 0.76 },
      ];

      for (const b of bolts) {
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 십자(+) 나사 홈
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(b.x - 1.8, b.y);
        ctx.lineTo(b.x + 1.8, b.y);
        ctx.moveTo(b.x, b.y - 1.8);
        ctx.lineTo(b.x, b.y + 1.8);
        ctx.stroke();
      }
    } else if (pattern === 'POISON_BUBBLES') {
      // [치명적인 맹독란] 몸체에 맺힌 4개의 보글보글 독성 기포 방울
      const bubbles = [
        { x: -rx * 0.38, y: -ry * 0.45, r: 4.2 },
        { x: rx * 0.55, y: -ry * 0.12, r: 5.5 },
        { x: -rx * 0.46, y: ry * 0.42, r: 4.8 },
        { x: rx * 0.32, y: ry * 0.68, r: 3.6 },
      ];

      for (const b of bubbles) {
        const bGrad = ctx.createRadialGradient(b.x - 1, b.y - 1, 1, b.x, b.y, b.r);
        bGrad.addColorStop(0, '#86efac');
        bGrad.addColorStop(0.7, '#22c55e');
        bGrad.addColorStop(1, '#15803d');
        ctx.fillStyle = bGrad;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#bbf7d0';
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // 기포 광택
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    } else if (pattern === 'ANGEL_WINGS') {
      // [순백의 천사란] 머리 위 황금 헤일로 + 접힘/펼쳐짐 날개
      // 1. 머리 위 황금 헤일로 (천사 링)
      ctx.save();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.ellipse(0, -ry * 1.18, rx * 0.55, 3.8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.6)';
      ctx.lineWidth = 4.5;
      ctx.stroke();
      ctx.restore();

      // 2. 날개 렌더링 (점프 시 활짝 펼침, 평소엔 몸을 포근히 감쌈)
      if (egg.state === 'JUMPING') {
        // 활짝 펼쳐진 천사 날개 (Wings Spread)
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.5;

        // 좌측 날개
        ctx.beginPath();
        ctx.moveTo(-rx * 0.6, -ry * 0.1);
        ctx.bezierCurveTo(-rx * 1.5, -ry * 0.7, -rx * 1.7, -ry * 0.1, -rx * 1.5, ry * 0.3);
        ctx.bezierCurveTo(-rx * 1.2, ry * 0.1, -rx * 0.9, ry * 0.2, -rx * 0.6, ry * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 우측 날개
        ctx.beginPath();
        ctx.moveTo(rx * 0.6, -ry * 0.1);
        ctx.bezierCurveTo(rx * 1.5, -ry * 0.7, rx * 1.7, -ry * 0.1, rx * 1.5, ry * 0.3);
        ctx.bezierCurveTo(rx * 1.2, ry * 0.1, rx * 0.9, ry * 0.2, rx * 0.6, ry * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // 접힌 천사 날개 (Wings Folded - 몸을 포근히 감쌈)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.4;

        // 좌측 접힌 날개
        ctx.beginPath();
        ctx.moveTo(-rx * 0.85, -ry * 0.1);
        ctx.quadraticCurveTo(-rx * 0.3, 0, -rx * 0.2, ry * 0.5);
        ctx.quadraticCurveTo(-rx * 0.65, ry * 0.55, -rx * 0.82, ry * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 우측 접힌 날개
        ctx.beginPath();
        ctx.moveTo(rx * 0.85, -ry * 0.1);
        ctx.quadraticCurveTo(rx * 0.3, 0, rx * 0.2, ry * 0.5);
        ctx.quadraticCurveTo(rx * 0.65, ry * 0.55, rx * 0.82, ry * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else if (pattern === 'DEVIL') {
      // [심연의 악마란] 실시간 진화 (stage 1: 악마 뿔, stage 2: 박쥐 날개)
      const stage = egg.devilStage || 0;

      // 1. 악마 뿔 (100m 이상: stage >= 1)
      if (stage >= 1) {
        ctx.save();
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 1.5;

        // 좌측 뿔
        ctx.beginPath();
        ctx.moveTo(-rx * 0.45, -ry * 0.8);
        ctx.quadraticCurveTo(-rx * 0.85, -ry * 1.25, -rx * 0.65, -ry * 1.35);
        ctx.quadraticCurveTo(-rx * 0.35, -ry * 1.05, -rx * 0.25, -ry * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 우측 뿔
        ctx.beginPath();
        ctx.moveTo(rx * 0.45, -ry * 0.8);
        ctx.quadraticCurveTo(rx * 0.85, -ry * 1.25, rx * 0.65, -ry * 1.35);
        ctx.quadraticCurveTo(rx * 0.35, -ry * 1.05, rx * 0.25, -ry * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // 2. 박쥐 날개 (200m 이상: stage >= 2)
      if (stage >= 2) {
        ctx.save();
        ctx.fillStyle = '#7f1d1d';
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 1.5;

        if (egg.state === 'JUMPING') {
          // 펼쳐진 박쥐 날개
          // 좌측 박쥐 날개
          ctx.beginPath();
          ctx.moveTo(-rx * 0.6, -ry * 0.1);
          ctx.lineTo(-rx * 1.5, -ry * 0.6);
          ctx.lineTo(-rx * 1.3, -ry * 0.1);
          ctx.lineTo(-rx * 1.6, ry * 0.1);
          ctx.lineTo(-rx * 1.1, ry * 0.2);
          ctx.lineTo(-rx * 0.7, ry * 0.3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // 우측 박쥐 날개
          ctx.beginPath();
          ctx.moveTo(rx * 0.6, -ry * 0.1);
          ctx.lineTo(rx * 1.5, -ry * 0.6);
          ctx.lineTo(rx * 1.3, -ry * 0.1);
          ctx.lineTo(rx * 1.6, ry * 0.1);
          ctx.lineTo(rx * 1.1, ry * 0.2);
          ctx.lineTo(rx * 0.7, ry * 0.3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // 접힌 박쥐 날개 (몸 뒤쪽을 감싼 실루엣)
          ctx.fillStyle = '#450a0a';
          ctx.beginPath();
          ctx.moveTo(-rx * 0.85, -ry * 0.05);
          ctx.lineTo(-rx * 0.35, ry * 0.5);
          ctx.lineTo(-rx * 0.8, ry * 0.4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(rx * 0.85, -ry * 0.05);
          ctx.lineTo(rx * 0.35, ry * 0.5);
          ctx.lineTo(rx * 0.8, ry * 0.4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }
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
