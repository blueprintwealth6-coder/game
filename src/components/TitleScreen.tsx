import React from 'react';
import { soundEngine } from '../game/audio.ts';

interface TitleScreenProps {
  onStartGame: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame }) => {
  const handleStart = () => {
    soundEngine.ensureContext();
    soundEngine.setRadioStation(1); // Start Vice Wave 103!
    onStartGame();
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-8 md:p-12 select-none pointer-events-auto bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/60">
      {/* Top Header Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-pink-500/20 border border-pink-500/60 rounded-full text-pink-400 font-mono text-xs font-bold tracking-widest uppercase">
            🌴 1986 MIAMI METROPOLIS
          </div>
          <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/60 rounded-full text-cyan-300 font-mono text-xs font-bold tracking-widest uppercase hidden sm:block">
            ⚡ NEXT-GEN 3D OPEN WORLD
          </div>
        </div>

        <div className="text-right text-xs font-mono text-slate-400">
          POWERED BY THREE.JS ENGINE
        </div>
      </div>

      {/* Hero Centerpiece: Bespoke SVG Neon Title Lockup */}
      <div className="flex flex-col items-center justify-center my-auto text-center">
        <div className="relative mb-6">
          <svg
            viewBox="0 0 600 160"
            className="w-[90vw] max-w-[620px] h-auto drop-shadow-[0_0_35px_rgba(236,72,153,0.8)]"
          >
            <defs>
              <linearGradient id="neonPink" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
              <linearGradient id="chromeCyan" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor="#38bdf8" />
                <stop offset="55%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#082f49" />
              </linearGradient>
            </defs>

            {/* Script "Vice City" style title */}
            <text
              x="50%"
              y="75"
              textAnchor="middle"
              fill="url(#neonPink)"
              stroke="#ffffff"
              strokeWidth="2"
              className="font-extrabold"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: '78px',
                fontStyle: 'italic',
                fontWeight: 900,
                letterSpacing: '-2px',
              }}
            >
              VICE CITY
            </text>

            {/* Futuristic Chrome "NEXT-GEN" subtitle */}
            <text
              x="50%"
              y="135"
              textAnchor="middle"
              fill="url(#chromeCyan)"
              stroke="#00f0ff"
              strokeWidth="1.5"
              style={{
                fontFamily: "'Chakra Petch', sans-serif",
                fontSize: '36px',
                fontWeight: 900,
                letterSpacing: '12px',
              }}
            >
              NEXT-GEN
            </text>
          </svg>
        </div>

        <p className="text-slate-300 text-sm md:text-base font-medium max-w-lg mb-8 drop-shadow">
          An expansive 3D open-world featuring Ocean Drive, Starfish Island, luxury supercars, high-speed police chases, street races, and procedural 80s synth radio.
        </p>

        {/* Primary Start CTA Button */}
        <button
          onClick={handleStart}
          className="group relative px-10 py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-cyan-500 rounded-2xl text-white font-black text-lg md:text-xl tracking-widest uppercase shadow-[0_0_30px_rgba(236,72,153,0.7)] hover:shadow-[0_0_50px_rgba(0,240,255,0.9)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border-2 border-white/50"
        >
          <span className="flex items-center gap-3">
            <span>START GAME</span>
            <span className="group-hover:translate-x-1 transition-transform">➔</span>
          </span>
        </button>

        <span className="text-xs text-slate-400 font-mono mt-3">
          Press ENTER or SPACE to start
        </span>
      </div>

      {/* Flat Control Hint Line */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-4">
        <span>WASD Move/Drive · Space Action/Handbrake · F Vehicle · Mouse Shoot</span>
        <span className="text-cyan-400 font-bold mt-1 sm:mt-0">
          60FPS Simulation · Zero-Asset Procedural 3D
        </span>
      </div>
    </div>
  );
};
