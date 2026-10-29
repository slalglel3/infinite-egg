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

  // 1. 살아있는 달걀 그리기 (2 & 3번과 100% 동일한 SVG 황금비율 벡터 좌표계로 렌더링)
  public drawEgg(ctx: CanvasRenderingContext2D, egg: Egg): void {
    const rx = GAME_CONSTANTS.EGG_RADIUS_X;
    const ry = GAME_CONSTANTS.EGG_RADIUS_Y;
    const jumpOffset = egg.jumpArcOffset || 0;

    // A. 도로 바닥 그림자 (계란이 점프해도 그림자는 도로 표면에 유지)
    ctx.save();
    ctx.translate(egg.x, egg.y);
    const shadowScale = Math.max(0.4, 1 - jumpOffset / 120);
    const shadowAlpha = Math.max(0.12, 0.32 - jumpOffset / 200);
    ctx.beginPath();
    ctx.ellipse(0, 4, rx * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(15, 23, 42, ${shadowAlpha})`;
    ctx.fill();
    ctx.restore();

    // B. 달걀 본체 그리기
    ctx.save();
    ctx.translate(egg.x, egg.y - jumpOffset);

    // 회전 (우하향: 시계방향, 좌하향: 반시계방향)
    ctx.rotate(egg.rotation);

    // [핵심 일원화] SVG (0..100, 0..116, 중심: 50, 58) 좌표계를 캔버스로 정확히 매핑!
    // 중심점(50, 58)을 (0, 0) 회전 중심축으로 일치시킴
    ctx.scale(egg.squishX * (rx / 42), egg.squishY * (ry / 48));
    ctx.translate(-50, -58);

    // 1. 실물 달걀 베지어 패스 (황금비율 실물 달걀)
    const shellPath = new Path2D(
      'M 50 10 C 74 10, 92 38, 92 65 C 92 90, 75 106, 50 106 C 25 106, 8 90, 8 65 C 8 38, 26 10, 50 10 Z'
    );

    if (egg.flashDamage) {
      ctx.fillStyle = '#f87171';
    } else {
      const c = this.currentSkin.colors;
      const grad = ctx.createRadialGradient(42, 36, 2, 50, 58, 65);
      grad.addColorStop(0, c.top);
      grad.addColorStop(0.22, c.mid1);
      grad.addColorStop(0.65, c.mid2);
      grad.addColorStop(0.92, c.bottom);
      grad.addColorStop(1, c.shadow);
      ctx.fillStyle = grad;
    }
    ctx.fill(shellPath);

    // 외곽선
    ctx.strokeStyle = this.currentSkin.colors.line;
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';
    ctx.stroke(shellPath);

    // 2. 우측 곡면 3D 볼륨 섀도우 (홈 화면과 100% 동일)
    const sideShadow = new Path2D(
      'M 50 10 C 74 10, 92 38, 92 65 C 92 90, 75 106, 50 106 C 68 106, 82 86, 82 65 C 82 40, 68 16, 50 10 Z'
    );
    const sideShadowGrad = ctx.createLinearGradient(0, 0, 100, 58);
    sideShadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    sideShadowGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.15)');
    sideShadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = sideShadowGrad;
    ctx.fill(sideShadow);

    // 3. 좌측 상단 초승달 하이라이트 광택 (홈 화면과 100% 동일)
    const highlight = new Path2D(
      'M 42 16 C 30 22, 17 40, 17 56 C 17 62, 20 66, 24 60 C 27 46, 36 28, 46 20 C 47 18, 45 16, 42 16 Z'
    );
    const highlightGrad = ctx.createLinearGradient(0, 0, 100, 116);
    highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    highlightGrad.addColorStop(0.5, 'rgba(255, 248, 235, 0.6)');
    highlightGrad.addColorStop(1, 'rgba(254, 243, 199, 0.2)');
    ctx.fillStyle = highlightGrad;
    ctx.fill(highlight);

    // 4. 스킨 고유 패턴 (사이버 메탈란 8볼트, 맹독란 기포, 천사란 헤일로/날개, 악마란 뿔/날개 등)
    this.drawSkinPatterns(ctx, egg);

    // 5. 실시간 대미지 금(Crack) 렌더링
    this.drawCracks(ctx, egg.hp, egg.maxHp);

    // 6. 달걀 표정 그리기 (홈/프리뷰 화면과 100% 일치)
    this.drawFace(ctx, egg);

    // 7. 의상 코스튬 렌더링
    this.drawCostumes(ctx);

    ctx.restore();
  }

  // 스킨별 고유 패턴 렌더링 (SVG와 100% 동일한 좌표 및 형태)
  private drawSkinPatterns(ctx: CanvasRenderingContext2D, egg: Egg): void {
    const pattern = this.currentSkin.colors.pattern;
    const special = this.currentSkin.specialType;

    ctx.save();

    // 1. 점박이 패턴
    if (pattern === 'SPOTS') {
      ctx.fillStyle = this.currentSkin.colors.line;
      ctx.globalAlpha = 0.38;
      const spots = [
        { x: 32, y: 46, rx: 3.5, ry: 4, rot: -0.26 },
        { x: 46, y: 34, rx: 2.5, ry: 2.8, rot: 0.35 },
        { x: 68, y: 48, rx: 4, ry: 4.5, rot: 0.17 },
        { x: 76, y: 70, rx: 3.2, ry: 3.5, rot: -0.44 },
        { x: 30, y: 84, rx: 3, ry: 3, rot: 0 },
        { x: 58, y: 88, rx: 2.8, ry: 2.8, rot: 0 },
        { x: 48, y: 58, rx: 2, ry: 2, rot: 0 },
      ];
      for (const s of spots) {
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.rx, s.ry, s.rot, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // 2. 아기 공룡알 균열 패턴
    else if (pattern === 'CRACKS') {
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.moveTo(50, 20);
      ctx.lineTo(57, 38);
      ctx.lineTo(47, 50);
      ctx.lineTo(60, 62);
      ctx.lineTo(52, 78);
      ctx.lineTo(62, 92);
      ctx.stroke();
    }
    // 3. 사이버 라인 패턴
    else if (pattern === 'CYBER_LINES') {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.0;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(26, 50); ctx.lineTo(42, 50); ctx.lineTo(52, 38); ctx.lineTo(78, 38);
      ctx.moveTo(30, 74); ctx.lineTo(46, 74); ctx.lineTo(56, 86); ctx.lineTo(72, 86);
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(42, 50, 2.2, 0, Math.PI * 2);
      ctx.arc(56, 86, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    // 4. 불사조 화염 오라
    else if (pattern === 'FIRE_AURA') {
      ctx.fillStyle = '#f97316';
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(50, 18, 5, 0, Math.PI * 2);
      ctx.arc(22, 52, 6, 0, Math.PI * 2);
      ctx.arc(78, 52, 6, 0, Math.PI * 2);
      ctx.arc(34, 88, 5, 0, Math.PI * 2);
      ctx.arc(66, 88, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    // 5. 황금알 광채
    else if (pattern === 'GOLD_SHINE') {
      ctx.fillStyle = '#fef08a';
      ctx.globalAlpha = 0.65;
      const star1 = new Path2D('M 50 22 L 52 28 L 58 30 L 52 32 L 50 38 L 48 32 L 42 30 L 48 28 Z');
      const star2 = new Path2D('M 74 48 L 75.5 52 L 80 53 L 75.5 54 L 74 58 L 72.5 54 L 68 53 L 72.5 52 Z');
      ctx.fill(star1);
      ctx.fill(star2);
    }
    // 6. [사이버 메탈란] 둘레 8개 정밀 메탈릭 볼트 나사 (십자 홈 포함!)
    else if (pattern === 'METAL_BOLTS' || special === 'METAL') {
      const bolts = [
        { cx: 32, cy: 22 },
        { cx: 68, cy: 22 },
        { cx: 16, cy: 46 },
        { cx: 84, cy: 46 },
        { cx: 15, cy: 74 },
        { cx: 85, cy: 74 },
        { cx: 30, cy: 98 },
        { cx: 70, cy: 98 },
      ];
      for (const b of bolts) {
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(b.cx, b.cy, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(b.cx - 2.2, b.cy);
        ctx.lineTo(b.cx + 2.2, b.cy);
        ctx.moveTo(b.cx, b.cy - 2.2);
        ctx.lineTo(b.cx, b.cy + 2.2);
        ctx.stroke();
      }
    }
    // 7. [치명적인 맹독란] 4개의 보글보글 독성 기포 방울
    else if (pattern === 'POISON_BUBBLES' || special === 'POISON') {
      const bubbles = [
        { cx: 32, cy: 36, r: 5.5 },
        { cx: 72, cy: 48, r: 6.5 },
        { cx: 28, cy: 76, r: 5.8 },
        { cx: 64, cy: 88, r: 4.8 },
      ];
      for (const b of bubbles) {
        ctx.fillStyle = '#22c55e';
        ctx.strokeStyle = '#bbf7d0';
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(b.cx, b.cy, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.cx - b.r * 0.3, b.cy - b.r * 0.3, b.r * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // 8. [순백의 천사란] 황금 헤일로 & 깃털 날개
    else if (pattern === 'ANGEL_WINGS' || special === 'ANGEL') {
      // 황금 헤일로
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.ellipse(50, 0, 22, 5.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.ellipse(50, 0, 22, 5.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // 날개 (점프 시 펼침, 평소엔 접힘)
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.6;

      if (egg.state === 'JUMPING') {
        const leftWingSpread = new Path2D('M 20 54 C -4 30, -12 50, -4 74 C 4 66, 12 70, 22 66 Z');
        const rightWingSpread = new Path2D('M 80 54 C 104 30, 112 50, 104 74 C 96 66, 88 70, 78 66 Z');
        ctx.fill(leftWingSpread);
        ctx.stroke(leftWingSpread);
        ctx.fill(rightWingSpread);
        ctx.stroke(rightWingSpread);
      } else {
        const leftWingFold = new Path2D('M 12 50 C 26 56, 38 68, 38 88 C 22 92, 10 75, 12 50 Z');
        const rightWingFold = new Path2D('M 88 50 C 74 56, 62 68, 62 88 C 78 92, 90 75, 88 50 Z');
        ctx.fill(leftWingFold);
        ctx.stroke(leftWingFold);
        ctx.fill(rightWingFold);
        ctx.stroke(rightWingFold);
      }
    }
    // 9. [심연의 악마란] 악마 뿔 & 박쥐 날개
    else if (pattern === 'DEVIL' || special === 'DEVIL') {
      const stage = egg.devilStage !== undefined ? egg.devilStage : 2;

      // 뿔 (stage >= 1)
      if (stage >= 1) {
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 1.8;
        const leftHorn = new Path2D('M 32 20 Q 14 6 18 -6 Q 28 6 38 20 Z');
        const rightHorn = new Path2D('M 68 20 Q 86 6 82 -6 Q 72 6 62 20 Z');
        ctx.fill(leftHorn);
        ctx.stroke(leftHorn);
        ctx.fill(rightHorn);
        ctx.stroke(rightHorn);
      }

      // 날개 (stage >= 2)
      if (stage >= 2) {
        ctx.fillStyle = '#450a0a';
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 1.5;

        if (egg.state === 'JUMPING') {
          const leftBatSpread = new Path2D('M 22 52 L -6 32 L -2 50 L -12 60 L 0 66 L 16 68 Z');
          const rightBatSpread = new Path2D('M 78 52 L 106 32 L 102 50 L 112 60 L 100 66 L 84 68 Z');
          ctx.fill(leftBatSpread);
          ctx.stroke(leftBatSpread);
          ctx.fill(rightBatSpread);
          ctx.stroke(rightBatSpread);
        } else {
          const leftBatFold = new Path2D('M 14 52 L 35 84 L 16 78 Z');
          const rightBatFold = new Path2D('M 86 52 L 65 84 L 84 78 Z');
          ctx.fill(leftBatFold);
          ctx.stroke(leftBatFold);
          ctx.fill(rightBatFold);
          ctx.stroke(rightBatFold);
        }
      }
    }

    ctx.restore();
  }

  // 달걀 표정 렌더링 (SVG와 100% 동일한 눈/볼터치/미소 및 특수 얼굴)
  private drawFace(ctx: CanvasRenderingContext2D, egg: Egg): void {
    ctx.save();

    if (egg.expression === 'SURPRISED') {
      // 😱 경악 표정
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(38, 60, 6, 0, Math.PI * 2);
      ctx.arc(64, 60, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(39, 60, 2.2, 0, Math.PI * 2);
      ctx.arc(63, 60, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(51, 72, 4.5, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#78350f';
      ctx.fill();
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(51, 75, 3, 0, Math.PI);
      ctx.fill();
    } else if (egg.expression === 'PAIN') {
      // 😣 대미지 시 눈 질끈 감음 (> <)
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(35, 59); ctx.lineTo(40, 62); ctx.lineTo(35, 65);
      ctx.moveTo(67, 59); ctx.lineTo(62, 62); ctx.lineTo(67, 65);
      ctx.stroke();
    } else if (egg.expression === 'DIZZY') {
      // 😵 골뱅이 눈
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.8;
      this.drawSpiral(ctx, 38, 62, 4.5);
      this.drawSpiral(ctx, 64, 62, 4.5);
      ctx.beginPath();
      ctx.moveTo(46, 73);
      ctx.quadraticCurveTo(51, 69, 56, 73);
      ctx.stroke();
    } else {
      // 평소 표정 (특수 계란별 맞춤 얼굴 및 기본 귀여운 표정)
      const special = this.currentSkin.specialType;

      if (special === 'METAL') {
        // [사이버 메탈란] 왼쪽 볼트렌즈 & 오른쪽 네온 그린 LED 사이버 눈 (볼터치 없음)
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(38, 62, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // 오른쪽 LED 글로우 & 렌즈
        ctx.fillStyle = 'rgba(74, 222, 128, 0.35)';
        ctx.beginPath();
        ctx.arc(64, 62, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#22c55e';
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(64, 62, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(62.5, 60.5, 1.6, 0, Math.PI * 2);
        ctx.fill();

        // 사이버 슬릿 입
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(44, 72);
        ctx.lineTo(56, 72);
        ctx.stroke();
      } else if (special === 'DEVIL') {
        // [심연의 악마란] 붉은 눈 & 악마 이빨 미소
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(38, 62, 4.2, 0, Math.PI * 2);
        ctx.arc(64, 62, 4.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.arc(36.5, 60.5, 1.6, 0, Math.PI * 2);
        ctx.arc(62.5, 60.5, 1.6, 0, Math.PI * 2);
        ctx.fill();

        // 어두운 볼터치
        ctx.fillStyle = '#7f1d1d';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(29, 70, 4.5, 2.5, 0, 0, Math.PI * 2);
        ctx.ellipse(73, 70, 4.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // 악마 입 & 송곳니
        ctx.fillStyle = '#020617';
        const mouthPath = new Path2D('M 44 68 Q 51 77 58 68 Z');
        ctx.fill(mouthPath);

        ctx.fillStyle = '#ffffff';
        const fang1 = new Path2D('M 45 68 L 47 72 L 49 68 Z');
        const fang2 = new Path2D('M 53 68 L 55 72 L 57 68 Z');
        ctx.fill(fang1);
        ctx.fill(fang2);
      } else {
        // 기본 / 일반 달걀 표정
        const colors = this.currentSkin.colors;

        ctx.fillStyle = colors.eyeColor;
        ctx.beginPath();
        ctx.arc(38, 62, 4.2, 0, Math.PI * 2);
        ctx.arc(64, 62, 4.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(36.5, 60.5, 1.6, 0, Math.PI * 2);
        ctx.arc(62.5, 60.5, 1.6, 0, Math.PI * 2);
        ctx.fill();

        // 핑크 볼터치
        ctx.fillStyle = colors.cheekColor;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.ellipse(29, 70, 4.8, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(73, 70, 4.8, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // 방긋 미소
        ctx.strokeStyle = colors.eyeColor;
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        const smilePath = new Path2D('M 44 70 Q 51 76 58 70');
        ctx.stroke(smilePath);
      }
    }

    ctx.restore();
  }

  // 캔버스 인게임 의상 렌더링 (CostumeSvgLayers와 100% 동일한 좌표계)
  private drawCostumes(ctx: CanvasRenderingContext2D): void {
    const effective = this.currentSkin.hasFixedOutfit && this.currentSkin.bundledCostumes
      ? this.currentSkin.bundledCostumes
      : this.costumes;

    const { hat, top, bottom, hand } = effective;

    ctx.save();

    // 1. 하의 (Bottom)
    if (bottom === 'police_bottom') {
      const belt = new Path2D('M 16 80 Q 50 85 84 80 L 86 89 Q 50 94 14 89 Z');
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.fill(belt);
      ctx.stroke(belt);

      // 황금 버클
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.2;
      ctx.fillRect(44, 80, 12, 10);
      ctx.strokeRect(44, 80, 12, 10);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(47, 83, 6, 4);
    } else if (bottom === 'cowboy_bottom') {
      const jeans = new Path2D('M 12 78 Q 50 84 88 78 C 88 98 75 106 50 106 C 25 106 12 98 12 78 Z');
      ctx.fillStyle = '#1d4ed8';
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 1.5;
      ctx.fill(jeans);
      ctx.stroke(jeans);

      const belt = new Path2D('M 14 78 Q 50 83 86 78 L 86 84 Q 50 89 14 84 Z');
      ctx.fillStyle = '#78350f';
      ctx.fill(belt);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(50, 82, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (bottom === 'mermaid_bottom') {
      const tail = new Path2D('M 12 76 Q 50 84 88 76 C 84 98 70 106 50 106 C 30 106 16 98 12 76 Z');
      ctx.fillStyle = '#059669';
      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 1.5;
      ctx.fill(tail);
      ctx.stroke(tail);

      const fin = new Path2D('M 50 104 C 36 108 24 116 28 122 C 38 120 46 112 50 106 C 54 112 62 120 72 122 C 76 116 64 108 50 104 Z');
      ctx.fillStyle = '#34d399';
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1.5;
      ctx.fill(fin);
      ctx.stroke(fin);
    } else if (bottom === 'king_bottom') {
      const belt = new Path2D('M 14 80 Q 50 86 86 80 L 87 88 Q 50 94 13 88 Z');
      ctx.fillStyle = '#b45309';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.fill(belt);
      ctx.stroke(belt);
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(50, 84, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 2. 상의 (Top)
    if (top === 'police_top') {
      const collar = new Path2D('M 38 74 L 50 81 L 62 74 L 50 72 Z');
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.fill(collar);
      ctx.stroke(collar);

      const tie = new Path2D('M 48 78 L 52 78 L 54 92 L 50 96 L 46 92 Z');
      ctx.fillStyle = '#0f172a';
      ctx.fill(tie);

      ctx.fillStyle = '#fbbf24';
      const badge = new Path2D('M 32 78 L 36 75 L 40 78 L 38 83 L 34 83 Z');
      ctx.fill(badge);
    } else if (top === 'cowboy_top') {
      const bandana = new Path2D('M 40 75 L 60 75 L 50 87 Z');
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 1;
      ctx.fill(bandana);
      ctx.stroke(bandana);

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(36, 75);
      ctx.quadraticCurveTo(50, 80, 64, 75);
      ctx.stroke();

      ctx.fillStyle = '#92400e';
      ctx.globalAlpha = 0.9;
      const vestL = new Path2D('M 18 78 L 32 78 L 30 92 L 16 92 Z');
      const vestR = new Path2D('M 82 78 L 68 78 L 70 92 L 84 92 Z');
      ctx.fill(vestL);
      ctx.fill(vestR);
      ctx.globalAlpha = 1.0;
    } else if (top === 'mermaid_top') {
      ctx.fillStyle = '#c084fc';
      ctx.strokeStyle = '#f3e8ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(38, 76, 6, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(62, 76, 6, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (top === 'king_top') {
      const cape = new Path2D('M 22 74 C 32 78, 68 78, 78 74 L 84 92 C 68 96, 32 96, 16 92 Z');
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 1.5;
      ctx.fill(cape);
      ctx.stroke(cape);
    }

    // 3. 모자 (Hat)
    if (hat === 'police_hat') {
      ctx.fillStyle = '#1e3a8a';
      const cap = new Path2D('M 28 16 C 28 0, 72 0, 72 16 Z');
      ctx.fill(cap);

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(50, 16, 26, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(48, 6, 4, 6);
    } else if (hat === 'cowboy_hat') {
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(50, 16, 38, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      const crown = new Path2D('M 32 16 C 32 -2, 44 2, 50 -1 C 56 2, 68 -2, 68 16 Z');
      ctx.fillStyle = '#92400e';
      ctx.fill(crown);
    } else if (hat === 'mermaid_hat') {
      ctx.fillStyle = '#ffffff';
      for (const cx of [36, 43, 50, 57, 64]) {
        ctx.beginPath();
        ctx.arc(cx, 12, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(50, 6, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (hat === 'king_hat') {
      const crown = new Path2D('M 28 18 L 26 2 L 38 9 L 50 -1 L 62 9 L 74 2 L 72 18 Z');
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.fill(crown);
      ctx.stroke(crown);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(30, 15, 40, 3);
    }

    // 4. 손 (Hand)
    if (hand === 'police_hand') {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(82, 70);
      ctx.lineTo(100, 46);
      ctx.stroke();
    } else if (hand === 'cowboy_hand') {
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(92, 64, 6, 12, 0.4, 0, Math.PI * 2);
      ctx.stroke();
    } else if (hand === 'mermaid_hand') {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(82, 80);
      ctx.lineTo(96, 36);
      ctx.stroke();
    } else if (hand === 'king_hand') {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(82, 80);
      ctx.lineTo(96, 40);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(96, 38, 4, 0, Math.PI * 2);
      ctx.fill();
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

  // 실시간 금 렌더링 (50, 58 중심점 기준)
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
    ctx.moveTo(points[0].x + 50, points[0].y + 58);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x + 50, points[i].y + 58);
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
