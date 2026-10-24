import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/engine.ts';
import { PlayerStats } from './game/types.ts';
import { TitleScreen } from './components/TitleScreen.tsx';
import { GameHUD } from './components/GameHUD.tsx';
import { TouchControls } from './components/TouchControls.tsx';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<'title' | 'playing'>('title');
  const [notification, setNotification] = useState<{ title: string; msg: string } | null>(null);
  const [stats, setStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    armor: 100,
    maxArmor: 100,
    cash: 1250,
    wantedLevel: 0,
    wantedProgress: 0,
    currentWeapon: 'smg',
    inVehicle: false,
    vehicleId: null,
    speedMPH: 0,
    isAiming: false,
    isReloading: false,
    isDrifting: false,
    currentDistrict: 'Ocean Drive / Beach',
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Game Engine once
    const engine = new GameEngine(
      canvasRef.current,
      (updatedStats) => {
        setStats(updatedStats);
      },
      (title, msg) => {
        setNotification({ title, msg });
        setTimeout(() => setNotification(null), 4500);
      }
    );
    engineRef.current = engine;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        setGameState('playing');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleStartGame = () => {
    setGameState('playing');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Isolated Three.js Canvas Container - Never torn down by React */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-crosshair outline-none"
      />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen onStartGame={handleStartGame} />
      )}

      {/* Main Game HUD (Playing Mode) */}
      {gameState === 'playing' && (
        <>
          <GameHUD
            engine={engineRef.current}
            stats={stats}
            notification={notification}
          />
          <TouchControls
            engine={engineRef.current}
            inVehicle={stats.inVehicle}
          />
        </>
      )}
    </div>
  );
}
