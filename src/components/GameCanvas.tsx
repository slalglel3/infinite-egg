import React, { useRef, useEffect } from 'react';
import { GameEngine } from '../game/gameEngine';

interface GameCanvasProps {
  engine: GameEngine;
  onJump: () => void;
  onTurn: () => void;
  onTogglePause?: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engine,
  onJump,
  onTurn,
  onTogglePause,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onJumpRef = useRef(onJump);
  const onTurnRef = useRef(onTurn);
  const onTogglePauseRef = useRef(onTogglePause);

  onJumpRef.current = onJump;
  onTurnRef.current = onTurn;
  onTogglePauseRef.current = onTogglePause;

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

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      engine.setScreenSize(width, height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // 2. 키보드 단축키 핸들러 (입력창 포커스 중이거나 홈/로비 대기 상태에서는 키 입력 가로채기 금지)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (!engine.isRunning) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
        return;
      }

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (onTogglePauseRef.current) {
          e.preventDefault();
          onTogglePauseRef.current();
        }
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        onJumpRef.current();
      } else if (
        e.code === 'KeyZ' ||
        e.code === 'KeyX' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight' ||
        e.code === 'KeyA' ||
        e.code === 'KeyD'
      ) {
        e.preventDefault();
        onTurnRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // 3. 메인 게임 루프 (60/120 FPS 부드러운 가변 델타타임, 음수/스파이크 dt 원천 차단)
    const loop = (currentTime: number) => {
      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = Math.max(lastTime, currentTime);
      const dt = Number.isFinite(rawDt) && rawDt > 0 ? Math.min(0.08, rawDt) : 0;

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
  }, [engine]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block touch-none select-none"
    />
  );
};
