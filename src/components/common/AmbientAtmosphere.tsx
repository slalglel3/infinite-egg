import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  alpha: number;
  type: 'FEATHER' | 'LEAF' | 'DUST' | 'SPARKLE';
  color: string;
  swaySpeed: number;
  swayDist: number;
  swayOffset: number;
}

interface AmbientAtmosphereProps {
  intensity?: 'COZY' | 'DRAMATIC';
  showGodRays?: boolean;
}

export const AmbientAtmosphere: React.FC<AmbientAtmosphereProps> = ({
  intensity = 'COZY',
  showGodRays = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 파티클 풀 초기화
    const count = intensity === 'COZY' ? 24 : 40;
    const particles: Particle[] = [];

    const createParticle = (spawnAnywhere = false): Particle => {
      const typeRand = Math.random();
      let type: Particle['type'] = 'DUST';
      if (typeRand < 0.35) type = 'FEATHER';
      else if (typeRand < 0.65) type = 'LEAF';
      else if (typeRand < 0.85) type = 'SPARKLE';

      let size = 3;
      let color = 'rgba(254, 240, 138, 0.7)';
      if (type === 'FEATHER') {
        size = 12 + Math.random() * 12;
        color = 'rgba(254, 249, 195, 0.85)';
      } else if (type === 'LEAF') {
        size = 8 + Math.random() * 10;
        color = Math.random() < 0.5 ? 'rgba(134, 239, 172, 0.75)' : 'rgba(251, 191, 36, 0.75)';
      } else if (type === 'SPARKLE') {
        size = 3 + Math.random() * 4;
        color = 'rgba(250, 204, 21, 0.9)';
      }

      return {
        x: Math.random() * width,
        y: spawnAnywhere ? Math.random() * height : -20,
        vx: (Math.random() - 0.4) * 0.4,
        vy: 0.3 + Math.random() * 0.7,
        size,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.03,
        alpha: 0.3 + Math.random() * 0.6,
        type,
        color,
        swaySpeed: 0.0015 + Math.random() * 0.002,
        swayDist: 20 + Math.random() * 35,
        swayOffset: Math.random() * Math.PI * 2,
      };
    };

    for (let i = 0; i < count; i++) {
      particles.push(createParticle(true));
    }

    // 터치/클릭 시 화사한 깃털 & 별빛 버스트 인터랙션
    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      if (clickX < 0 || clickX > width || clickY < 0 || clickY > height) return;

      for (let k = 0; k < 5; k++) {
        particles.push({
          x: clickX + (Math.random() - 0.5) * 24,
          y: clickY + (Math.random() - 0.5) * 24,
          vx: (Math.random() - 0.5) * 1.8,
          vy: -0.6 - Math.random() * 1.4,
          size: k % 2 === 0 ? 14 : 5,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.08,
          alpha: 1.0,
          type: k % 2 === 0 ? 'FEATHER' : 'SPARKLE',
          color: k % 2 === 0 ? 'rgba(254, 240, 138, 0.95)' : 'rgba(250, 204, 21, 1)',
          swaySpeed: 0.003,
          swayDist: 15,
          swayOffset: Math.random() * Math.PI * 2,
        });
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);

    let startTime = performance.now();

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const elapsed = time - startTime;

      // 1. 따스한 사선 햇살 광선 (God-Rays)
      if (showGodRays) {
        ctx.save();
        const pulse = 0.18 + 0.07 * Math.sin(elapsed * 0.0012);
        ctx.globalAlpha = pulse;

        // 메인 사선 광선
        const rayGrad = ctx.createLinearGradient(width * 0.1, 0, width * 0.9, height);
        rayGrad.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
        rayGrad.addColorStop(0.4, 'rgba(253, 224, 71, 0.25)');
        rayGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');

        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(width * 0.05, 0);
        ctx.lineTo(width * 0.55, 0);
        ctx.lineTo(width * 1.05, height);
        ctx.lineTo(width * 0.4, height);
        ctx.closePath();
        ctx.fill();

        // 보조 햇살 줄기
        ctx.beginPath();
        ctx.moveTo(width * 0.45, 0);
        ctx.lineTo(width * 0.75, 0);
        ctx.lineTo(width * 1.2, height * 0.85);
        ctx.lineTo(width * 0.8, height * 0.85);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // 2. 흩날리는 깃털, 나뭇잎, 금빛 먼지 렌더링
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 자연스러운 좌우 바람 살랑임 (Sway)
        const sway = Math.sin(elapsed * p.swaySpeed + p.swayOffset) * p.swayDist;
        const curX = p.x + sway;
        p.y += p.vy;
        p.rotation += p.vRot;

        // 화면 아래로 벗어나면 상단으로 재스폰
        if (p.y > height + 30) {
          particles[i] = createParticle(false);
          continue;
        }

        ctx.save();
        ctx.translate(curX, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;

        if (p.type === 'FEATHER') {
          // 포근한 깃털 그리기
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.35, p.size, 0, 0, Math.PI * 2);
          ctx.fill();

          // 깃대 (중앙 줄기)
          ctx.strokeStyle = 'rgba(253, 224, 71, 0.7)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(0, p.size);
          ctx.stroke();
        } else if (p.type === 'LEAF') {
          // 살랑이는 초록/단풍 나뭇잎
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.quadraticCurveTo(p.size * 0.6, 0, 0, p.size);
          ctx.quadraticCurveTo(-p.size * 0.6, 0, 0, -p.size);
          ctx.fill();
        } else if (p.type === 'SPARKLE') {
          // 반짝이는 황금 보석 별빛
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // 몽환적인 금빛 먼지
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [intensity, showGodRays]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-25 w-full h-full"
    />
  );
};
