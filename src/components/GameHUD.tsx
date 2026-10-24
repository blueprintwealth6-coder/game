import React, { useState } from 'react';
import { GameEngine } from '../game/engine.ts';
import { PlayerStats, TimeOfDay, WeaponType } from '../game/types.ts';
import { WEAPON_REGISTRY } from '../game/weapons.ts';
import { soundEngine } from '../game/audio.ts';
import { MiniMapRadar } from './MiniMapRadar.tsx';
import {
  Volume2,
  VolumeX,
  Radio,
  Crosshair,
  Shield,
  Heart,
  Car,
  Compass,
  Sun,
  Moon,
  Sunset,
  CloudRain,
  HelpCircle,
  X,
} from 'lucide-react';

interface GameHUDProps {
  engine: GameEngine | null;
  stats: PlayerStats;
  notification: { title: string; msg: string } | null;
}

export const GameHUD: React.FC<GameHUDProps> = ({ engine, stats, notification }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'weapons' | 'missions'>('status');

  const currentWeapon = WEAPON_REGISTRY[stats.currentWeapon];

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleRadioNext = () => {
    const current = soundEngine.getRadioStation();
    const next = (current + 1) % 4;
    soundEngine.setRadioStation(next);
  };

  const radioStationNames = ['RADIO OFF', 'VICE WAVE 103', 'FLASH FM 80s', 'V-ROCK CLASSIC'];
  const currentRadioName = radioStationNames[soundEngine.getRadioStation()];

  const handleSelectWeapon = (w: WeaponType) => {
    engine?.equipWeapon(w);
  };

  const handleSetTimeOfDay = (time: TimeOfDay) => {
    engine?.setTimeOfDay(time);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans">
      {/* Center Screen Crosshair (On-Foot only) */}
      {!stats.inVehicle && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#00f0ff]" />
          {stats.isAiming && (
            <div className="absolute w-8 h-8 rounded-full border border-cyan-400/80 animate-pulse" />
          )}
        </div>
      )}

      {/* Top Left: Radio Station & Audio Controls */}
      <div className="absolute top-4 left-4 pointer-events-auto flex items-center gap-2">
        <button
          onClick={handleRadioNext}
          title="Change Radio Station (Q)"
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/85 hover:bg-slate-900 border border-pink-500/50 rounded-lg text-pink-300 shadow-lg text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer"
        >
          <Radio className="w-4 h-4 text-pink-400" />
          <span>{currentRadioName}</span>
        </button>

        <button
          onClick={handleToggleMute}
          title="Toggle Mute (M)"
          className="p-1.5 bg-slate-950/85 hover:bg-slate-900 border border-cyan-500/40 rounded-lg text-cyan-300 transition-all cursor-pointer shadow-lg"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Time of Day Cycle switcher */}
        <div className="flex bg-slate-950/85 border border-purple-500/40 rounded-lg p-0.5">
          <button
            onClick={() => handleSetTimeOfDay('sunset')}
            title="Vice Sunset"
            className="p-1 hover:bg-purple-900/50 rounded text-pink-400 transition"
          >
            <Sunset className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleSetTimeOfDay('night')}
            title="Neon Midnight"
            className="p-1 hover:bg-purple-900/50 rounded text-cyan-400 transition"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleSetTimeOfDay('day')}
            title="Sunny Day"
            className="p-1 hover:bg-purple-900/50 rounded text-yellow-400 transition"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => setShowHelpModal(true)}
          title="Controls & Instructions"
          className="p-1.5 bg-slate-950/85 hover:bg-slate-900 border border-slate-700 rounded-lg text-slate-300 transition cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Top Right: Status Cluster (Cash, Health, Armor, Wanted Level, Weapon) */}
      <div className="absolute top-4 right-4 pointer-events-auto flex flex-col items-end gap-2">
        {/* Cash Counter */}
        <div className="px-4 py-1.5 bg-slate-950/90 border-2 border-emerald-500/60 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <span className="text-emerald-400 font-extrabold text-2xl tracking-wider tabular-nums font-mono drop-shadow">
            ${stats.cash.toLocaleString()}
          </span>
        </div>

        {/* Wanted Level Stars (1 to 5) */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950/85 border border-amber-500/40 rounded-lg">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`text-lg transition-transform ${
                star <= stats.wantedLevel
                  ? 'text-amber-400 drop-shadow-[0_0_8px_#f59e0b] scale-110'
                  : 'text-slate-700'
              }`}
            >
              ★
            </span>
          ))}
        </div>

        {/* Health & Armor Bars */}
        <div className="w-48 bg-slate-950/90 border border-slate-700/80 rounded-xl p-2.5 flex flex-col gap-1.5 shadow-xl">
          {/* Health */}
          <div className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-emerald-950">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-150"
                style={{ width: `${(stats.health / stats.maxHealth) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-emerald-300 font-mono font-bold w-6 text-right tabular-nums">
              {stats.health}
            </span>
          </div>

          {/* Armor */}
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
            <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden border border-cyan-950">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-150"
                style={{ width: `${(stats.armor / stats.maxArmor) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-cyan-300 font-mono font-bold w-6 text-right tabular-nums">
              {stats.armor}
            </span>
          </div>
        </div>

        {/* Weapon Card & Quick Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/90 border border-pink-500/50 rounded-xl p-2 shadow-xl">
          {(['fists', 'pistol', 'smg', 'rifle', 'rpg'] as WeaponType[]).map((wType, idx) => {
            const wInfo = WEAPON_REGISTRY[wType];
            const isSelected = stats.currentWeapon === wType;
            return (
              <button
                key={wType}
                onClick={() => handleSelectWeapon(wType)}
                className={`relative px-2 py-1 rounded-lg border transition-all cursor-pointer flex flex-col items-center min-w-9 ${
                  isSelected
                    ? 'bg-pink-950/70 border-pink-500 shadow-[0_0_10px_#ec4899]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-600'
                }`}
              >
                <span className="text-sm">{wInfo.icon}</span>
                <span className="text-[9px] font-mono font-bold text-slate-300">{idx + 1}</span>
              </button>
            );
          })}

          <div className="pl-2 border-l border-slate-800 flex flex-col text-right">
            <span className="text-xs font-bold text-pink-300 font-mono">{currentWeapon.name}</span>
            <span className="text-[11px] font-mono text-cyan-300 font-semibold tabular-nums">
              {currentWeapon.id === 'fists' ? 'INF' : `${currentWeapon.currentMag} / ${currentWeapon.maxAmmo}`}
            </span>
          </div>
        </div>
      </div>

      {/* Top Center: Mission Objective Notification */}
      {notification && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto px-6 py-2.5 bg-slate-950/95 border-2 border-pink-500 rounded-2xl shadow-[0_0_30px_rgba(236,72,153,0.5)] flex flex-col items-center text-center animate-bounce">
          <span className="text-pink-400 font-extrabold text-sm tracking-widest font-mono">
            {notification.title}
          </span>
          <span className="text-slate-200 text-xs font-medium max-w-sm mt-0.5">
            {notification.msg}
          </span>
        </div>
      )}

      {/* Bottom Center: Vehicle Speedometer (when driving) */}
      {stats.inVehicle && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center">
          <div className="px-6 py-2.5 bg-slate-950/95 border-2 border-cyan-400/80 rounded-2xl shadow-[0_0_25px_rgba(0,240,255,0.4)] flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-4xl font-black text-cyan-300 font-mono tracking-tighter tabular-nums drop-shadow">
                {stats.speedMPH}
              </span>
              <span className="text-[10px] font-extrabold text-cyan-500 tracking-widest uppercase">
                MPH
              </span>
            </div>

            <div className="h-8 w-px bg-slate-800" />

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">NITRO</span>
                <div className="w-20 h-2 bg-slate-900 rounded-full overflow-hidden border border-cyan-900">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-300 w-full animate-pulse" />
                </div>
              </div>
              {stats.isDrifting && (
                <span className="text-[10px] font-black text-pink-400 tracking-widest font-mono animate-pulse">
                  DRIFT ⚡
                </span>
              )}
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 font-mono">
            [F] Exit Vehicle · [Space] Handbrake · [Shift] Nitro
          </span>
        </div>
      )}

      {/* Bottom Left: Mini-Map Radar & District */}
      <div className="absolute bottom-6 left-6 pointer-events-auto">
        <MiniMapRadar engine={engine} district={stats.currentDistrict} />
      </div>

      {/* Help / Controls Modal */}
      {showHelpModal && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm pointer-events-auto flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border-2 border-cyan-400 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-200">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-black text-cyan-300 tracking-wider font-mono mb-4 flex items-center gap-2">
              <span>🌴 VICE CITY: CONTROLS</span>
            </h2>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-pink-400 font-bold">WASD / Arrow Keys</span>
                <span>Move On-Foot / Drive Vehicle</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-pink-400 font-bold">Shift</span>
                <span>Sprint On-Foot / Nitro in Car</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-pink-400 font-bold">Space</span>
                <span>Jump On-Foot / Handbrake Drift in Car</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-pink-400 font-bold">F or Enter</span>
                <span>Enter / Exit / Carjack Vehicle</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-pink-400 font-bold">Left Mouse Click</span>
                <span>Punch / Shoot Weapon</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-pink-400 font-bold">Right Mouse Hold</span>
                <span>Aim Weapon Stance</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-pink-400 font-bold">1, 2, 3, 4, 5</span>
                <span>Quick Weapon Switch</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-pink-400 font-bold">Q</span>
                <span>Next Radio Station (80s Synth FM)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-pink-400 font-bold">H</span>
                <span>Honk Vehicle Horn</span>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-6 w-full py-2.5 bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-black text-sm tracking-widest rounded-xl hover:opacity-90 transition cursor-pointer"
            >
              RESUME GAME
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
