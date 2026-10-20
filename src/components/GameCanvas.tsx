import React, { useRef, useEffect } from 'react';
import { GameEngine } from '../game/gameEngine';

interface GameCanvasProps {
  engine: GameEngine;
  onJump: () => void;
  onTurn: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ engine, onJump, onTurn }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    // 1. 화면 리사이즈 핸들러 (고해상도 DPR 지원)
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      engine.setScreenSize(width, height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // 2. 키보드 단축키 핸들러
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        onJump();
      } else if (
        e.code === 'KeyZ' ||
        e.code === 'KeyX' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight' ||
        e.code === 'KeyA' ||
        e.code === 'KeyD'
      ) {
        e.preventDefault();
        onTurn();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // 3. 메인 게임 루프 (60/120 FPS 부드러운 가변 델타타임)
    const loop = (currentTime: number) => {
      const dt = Math.min(0.08, (currentTime - lastTime) / 1000); // 델타 타임 상한선 80ms
      lastTime = currentTime;

      engine.update(dt);
      engine.render(ctx);

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    // 클린업 (메모리 및 이벤트 누수 완전 방지)
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [engine, onJump, onTurn]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block touch-none select-none"
    />
  );
};
