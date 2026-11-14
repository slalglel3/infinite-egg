import React, { useState, useEffect, useRef, useCallback } from 'react';
import { App as CapApp } from '@capacitor/app';
import { GameEngine } from './game/gameEngine';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { Controls } from './components/Controls';
import { HomeView } from './components/home/HomeView';
import { GameOverModal } from './components/GameOverModal';
import { GameStats, UserProgress, EventMapItem } from './types/game';
import { loadUserProgress, addGameResult } from './utils/storage';
import { getEggSkinById } from './data/eggSkins';
import { sound } from './audio/sound';

export function App() {
  const [gameState, setGameState] = useState<'HOME' | 'PLAYING' | 'GAMEOVER'>('HOME');
  const [userProgress, setUserProgress] = useState<UserProgress>(loadUserProgress());
  const [stats, setStats] = useState<GameStats>({
    distanceMeters: 0,
    speed: 0,
    hp: 100,
    maxHp: 100,
    perfectLandings: 0,
    itemsCollected: 0,
    isNewRecord: false,
  });
  const [gameOverReason, setGameOverReason] = useState<'CRACKED' | 'FALL'>('CRACKED');
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [leveledUp, setLeveledUp] = useState(false);
  const [lastEarnedGold, setLastEarnedGold] = useState(0);
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [activeEventMap, setActiveEventMap] = useState<EventMapItem | null>(null);
  const [showEventBanner, setShowEventBanner] = useState(false);

  // 싱글톤 GameEngine 인스턴스 유지
  const engineRef = useRef<GameEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new GameEngine(userProgress.level);
  }
  const engine = engineRef.current;

  // 게임 오버 핸들러
  const handleEngineGameOver = useCallback((finalStats: GameStats, reason: 'CRACKED' | 'FALL') => {
    const result = addGameResult(finalStats);
    setUserProgress(result.progress);
    setIsNewRecord(result.isNewRecord);
    setLeveledUp(result.leveledUp);
    setLastEarnedGold(result.earnedGold);
    setGameOverReason(reason);
    setStats({ ...finalStats });
    setGameState('GAMEOVER');
  }, []);

  useEffect(() => {
    engine.onGameOver = handleEngineGameOver;
  }, [engine, handleEngineGameOver]);

  // 주기적으로 HUD stats 상태 동기화 (초당 30회)
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const intervalId = setInterval(() => {
      setStats({ ...engine.stats });
    }, 33);

    return () => clearInterval(intervalId);
  }, [engine, gameState]);

  // 안드로이드 하드웨어 뒤로가기 버튼 처리
  useEffect(() => {
    let handler: { remove: () => Promise<void> } | null = null;
    try {
      CapApp.addListener('backButton', () => {
        if (gameState === 'PLAYING' || gameState === 'GAMEOVER') {
          setGameState('HOME');
        }
      }).then((h) => {
        handler = h;
      }).catch(() => {});
    } catch {
      // 웹 환경 무시
    }

    return () => {
      if (handler && typeof handler.remove === 'function') {
        handler.remove().catch(() => {});
      }
    };
  }, [gameState]);

  // 조작 핸들러
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

  // 게임 시작 (기본 모드 또는 이벤트 맵 모드)
  const handleStartGame = (eventMap?: EventMapItem) => {
    setActiveEventMap(eventMap || null);
    if (eventMap) {
      setShowEventBanner(true);
      setTimeout(() => {
        setShowEventBanner(false);
      }, 2200);
    } else {
      setShowEventBanner(false);
    }

    const currentSkin = getEggSkinById(userProgress.selectedEggId);
    engine.restart(userProgress.level, currentSkin, userProgress.equippedCostumes, eventMap || null);
    setStats({ ...engine.stats });
    setGameState('PLAYING');
  };

  // 홈 화면으로 이동
  const handleGoHome = () => {
    sound.playTurn();
    setGameState('HOME');
  };

  // 음소거 토글
  const handleToggleMute = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none touch-none bg-sky-100">
      {/* 1. 2D 캔버스 렌더러 (백그라운드 주행) */}
      <GameCanvas engine={engine} onJump={handleJump} onTurn={handleTurn} />

      {/* 2. 게임 중 HUD & 조작 버튼 오버레이 */}
      {gameState === 'PLAYING' && (
        <>
          <HUD
            stats={stats}
            userLevel={userProgress.level}
            onToggleMute={handleToggleMute}
            isMuted={isMuted}
          />

          {/* 이벤트 맵 인트로 아케이드 배너 팝업 */}
          {showEventBanner && activeEventMap && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce">
              <div className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 border-2 border-white shadow-2xl flex items-center gap-3">
                <span className="text-sm px-2 py-1 rounded-lg bg-black/40 font-black text-amber-300">
                  {activeEventMap.tag}
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-amber-200 tracking-wider">EVENT MAP ACTIVATED</span>
                  <span className="text-sm font-black text-white text-stroke-black">{activeEventMap.title}</span>
                </div>
              </div>
            </div>
          )}

          <Controls onJump={handleJump} onTurn={handleTurn} />
        </>
      )}

      {/* 3. 새로운 모바일 5대 탭 홈 화면 (HomeView) */}
      {gameState === 'HOME' && (
        <HomeView
          progress={userProgress}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onStartGame={handleStartGame}
          onUpdateProgress={setUserProgress}
        />
      )}

      {/* 4. 게임 오버 모달 ([다시 도전하기] & [홈으로 이동] 버튼) */}
      {gameState === 'GAMEOVER' && (
        <GameOverModal
          stats={stats}
          reason={gameOverReason}
          progress={userProgress}
          leveledUp={leveledUp}
          isNewRecord={isNewRecord}
          earnedGold={lastEarnedGold}
          onRestart={() => handleStartGame(activeEventMap || undefined)}
          onGoHome={handleGoHome}
        />
      )}
    </div>
  );
}

export default App;
