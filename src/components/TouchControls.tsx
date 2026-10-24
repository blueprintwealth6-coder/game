import React from 'react';
import { GameEngine } from '../game/engine.ts';

interface TouchControlsProps {
  engine: GameEngine | null;
  inVehicle: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ engine, inVehicle }) => {
  if (!engine) return null;

  const handleTouchKey = (code: string, pressed: boolean) => {
    engine.keys[code] = pressed;
  };

  return (
    <div className="md:hidden absolute inset-0 pointer-events-none select-none z-30">
      {/* Left side: Movement / Steering Buttons */}
      <div className="absolute bottom-6 left-4 pointer-events-auto flex flex-col gap-2">
        <div className="flex justify-center">
          <button
            onTouchStart={() => handleTouchKey('KeyW', true)}
            onTouchEnd={() => handleTouchKey('KeyW', false)}
            onMouseDown={() => handleTouchKey('KeyW', true)}
            onMouseUp={() => handleTouchKey('KeyW', false)}
            className="w-13 h-13 rounded-2xl bg-slate-900/80 active:bg-cyan-600 border border-cyan-500/50 text-white font-bold text-lg flex items-center justify-center shadow-lg"
          >
            ▲
          </button>
        </div>

        <div className="flex gap-4">
          <button
            onTouchStart={() => handleTouchKey('KeyA', true)}
            onTouchEnd={() => handleTouchKey('KeyA', false)}
            onMouseDown={() => handleTouchKey('KeyA', true)}
            onMouseUp={() => handleTouchKey('KeyA', false)}
            className="w-13 h-13 rounded-2xl bg-slate-900/80 active:bg-cyan-600 border border-cyan-500/50 text-white font-bold text-lg flex items-center justify-center shadow-lg"
          >
            ◀
          </button>
          <button
            onTouchStart={() => handleTouchKey('KeyS', true)}
            onTouchEnd={() => handleTouchKey('KeyS', false)}
            onMouseDown={() => handleTouchKey('KeyS', true)}
            onMouseUp={() => handleTouchKey('KeyS', false)}
            className="w-13 h-13 rounded-2xl bg-slate-900/80 active:bg-cyan-600 border border-cyan-500/50 text-white font-bold text-lg flex items-center justify-center shadow-lg"
          >
            ▼
          </button>
          <button
            onTouchStart={() => handleTouchKey('KeyD', true)}
            onTouchEnd={() => handleTouchKey('KeyD', false)}
            onMouseDown={() => handleTouchKey('KeyD', true)}
            onMouseUp={() => handleTouchKey('KeyD', false)}
            className="w-13 h-13 rounded-2xl bg-slate-900/80 active:bg-cyan-600 border border-cyan-500/50 text-white font-bold text-lg flex items-center justify-center shadow-lg"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Right side: Action Buttons (Enter/Exit, Sprint/Nitro, Jump/Handbrake, Fire) */}
      <div className="absolute bottom-6 right-4 pointer-events-auto flex flex-col items-end gap-3">
        {/* Enter/Exit Vehicle Button */}
        <button
          onClick={() => engine.toggleVehicle()}
          className="px-4 py-2 rounded-xl bg-pink-600/90 active:bg-pink-500 border border-pink-400 text-white font-black text-xs tracking-wider shadow-lg"
        >
          {inVehicle ? 'EXIT CAR (F)' : 'ENTER CAR (F)'}
        </button>

        <div className="flex items-center gap-3">
          {/* Handbrake / Jump */}
          <button
            onTouchStart={() => handleTouchKey('Space', true)}
            onTouchEnd={() => handleTouchKey('Space', false)}
            onMouseDown={() => handleTouchKey('Space', true)}
            onMouseUp={() => handleTouchKey('Space', false)}
            className="w-14 h-14 rounded-full bg-slate-900/90 active:bg-amber-600 border-2 border-amber-500 text-amber-300 font-black text-xs flex items-center justify-center shadow-xl"
          >
            {inVehicle ? 'DRIFT' : 'JUMP'}
          </button>

          {/* Nitro / Sprint */}
          <button
            onTouchStart={() => handleTouchKey('ShiftLeft', true)}
            onTouchEnd={() => handleTouchKey('ShiftLeft', false)}
            onMouseDown={() => handleTouchKey('ShiftLeft', true)}
            onMouseUp={() => handleTouchKey('ShiftLeft', false)}
            className="w-14 h-14 rounded-full bg-slate-900/90 active:bg-blue-600 border-2 border-blue-500 text-blue-300 font-black text-xs flex items-center justify-center shadow-xl"
          >
            {inVehicle ? 'NITRO' : 'RUN'}
          </button>

          {/* Fire / Attack button */}
          <button
            onTouchStart={() => {
              engine.isShooting = true;
              engine.shootWeapon();
            }}
            onTouchEnd={() => {
              engine.isShooting = false;
            }}
            onMouseDown={() => {
              engine.isShooting = true;
              engine.shootWeapon();
            }}
            onMouseUp={() => {
              engine.isShooting = false;
            }}
            className="w-16 h-16 rounded-full bg-red-600 active:bg-red-500 border-2 border-white text-white font-black text-sm flex items-center justify-center shadow-2xl shadow-red-500/50"
          >
            FIRE
          </button>
        </div>
      </div>
    </div>
  );
};
