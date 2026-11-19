import React, { useState, useEffect, useRef, useCallback } from 'react';
import { App as CapApp } from '@capacitor/app';
import { GameEngine } from './game/gameEngine';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { Controls } from './components/Controls';
import { HomeView } from './components/home/HomeView';
import { GameOverModal } from './components/GameOverModal';
import { GameStats, UserProgress } from './types/game';
import { loadUserProgress, addGameResult } from './utils/storage';
import { sound } from './audio/sound';

export function App() {
  const [gameState, setGameState] = useState<'HOME' | 'PLAYING' | 'GAMEOVER'>('HOME');
  const [userProgress, setUserProgress] = useState<UserProgress>(loadUserProgress());
  const [stats, setStats] = useState<GameStats>({
    distanceMeters: 0,
    speed: 0,
    hp: 100,
    maxHp: 100,
    itemsCollected: 0,
    isNewRecord: false,
    eggState: 'ROLLING',
  });
  const [gameOverReason, setGameOverReason] = useState<'CRACKED' | 'FALL'>('CRACKED');
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [isPaused, setIsPaused] = useState(false);

  const engineRef = useRef<GameEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new GameEngine();
  }
  const engine = engineRef.current;

  const handleEngineGameOver = useCallback((finalStats: GameStats, reason: 'CRACKED' | 'FALL') => {
    const result = addGameResult(finalStats);
    setUserProgress(result.progress);
    setIsNewRecord(result.isNewRecord);
    setGameOverReason(reason);
    setStats({ ...finalStats });
    setGameState('GAMEOVER');
  }, []);

  useEffect(() => {
    engine.onGameOver = handleEngineGameOver;
  }, [engine, handleEngineGameOver]);

  // 주기적으로 HUD stats 상태 동기화 (초당 30회, 일시정지 시 중단)
  useEffect(() => {
    if (gameState !== 'PLAYING' || isPaused) return;

    const intervalId = setInterval(() => {
      setStats({ ...engine.stats });
    }, 33);

    return () => clearInterval(intervalId);
  }, [engine, gameState, isPaused]);

  const handleGoHome = useCallback(() => {
    sound.playTurn();
    engine.stop();
    setIsPaused(false);
    setGameState('HOME');
  }, [engine]);

  // 안드로이드 하드웨어 뒤로가기 버튼 처리
  useEffect(() => {
    let handler: { remove: () => Promise<void> } | null = null;
    try {
      CapApp.addListener('backButton', () => {
        if (gameState === 'PLAYING' || gameState === 'GAMEOVER') {
          engine.stop();
          setIsPaused(false);
          setGameState('HOME');
        }
      })
        .then((h) => {
          handler = h;
        })
        .catch(() => {});
    } catch {
      // 웹 환경 무시
    }

    return () => {
      if (handler && typeof handler.remove === 'function') {
        handler.remove().catch(() => {});
      }
    };
  }, [engine, gameState]);

  const handleJump = useCallback(() => {
    if (gameState === 'PLAYING') {
      engine.triggerJump();
    }
  }, [engine, gameState]);

  const handleTurn = useCallback(() => {
    if (gameState === 'PLAYING') {
      engine.triggerTurn();
    }
  }, [engine, gameState]);

  const handleStartGame = useCallback(() => {
    engine.restart();
    setIsPaused(false);
    setStats({ ...engine.stats });
    setGameState('PLAYING');
  }, [engine]);

  const handleToggleMute = useCallback(() => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  const handleTogglePause = useCallback(() => {
    if (!engine.isRunning || engine.isGameOver) return;
    const paused = engine.togglePause();
    setIsPaused(paused);
  }, [engine]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none touch-none bg-white">
      {/* 1. 순수 와이어프레임 게임 캔버스 */}
      <GameCanvas
        engine={engine}
        onJump={handleJump}
        onTurn={handleTurn}
        onTogglePause={handleTogglePause}
      />

      {/* 2. 플레이 중 HUD & 조작 버튼 */}
      {gameState === 'PLAYING' && (
        <>
          <HUD
            stats={stats}
            onToggleMute={handleToggleMute}
            onGoHome={handleGoHome}
            onTogglePause={handleTogglePause}
            isMuted={isMuted}
            isPaused={isPaused}
          />
          <Controls
            onJump={handleJump}
            onTurn={handleTurn}
            disabled={isPaused}
          />
        </>
      )}

      {/* 3. 5대 탭 와이어프레임 홈 화면 */}
      {gameState === 'HOME' && (
        <HomeView
          progress={userProgress}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onStartGame={handleStartGame}
        />
      )}

      {/* 4. 최소 와이어프레임 게임 오버 모달 */}
      {gameState === 'GAMEOVER' && (
        <GameOverModal
          stats={stats}
          reason={gameOverReason}
          progress={userProgress}
          isNewRecord={isNewRecord}
          onRestart={handleStartGame}
          onGoHome={handleGoHome}
        />
      )}
    </div>
  );
}

export default App;
