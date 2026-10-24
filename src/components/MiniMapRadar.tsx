import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine.ts';

interface MiniMapRadarProps {
  engine: GameEngine | null;
  district: string;
}

export const MiniMapRadar: React.FC<MiniMapRadarProps> = ({ engine, district }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;

    const renderRadar = () => {
      const canvas = canvasRef.current;
      if (!canvas || !engine) {
        animId = requestAnimationFrame(renderRadar);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = canvas.width;
      const center = size / 2;
      const radius = size / 2 - 6;

      ctx.clearRect(0, 0, size, size);

      // Radar Outer Ring & Dark Background
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(0, 0, size, size);

      // Grid concentric circles
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(center, center, radius * 0.35, 0, Math.PI * 2);
      ctx.arc(center, center, radius * 0.7, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshairs
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.beginPath();
      ctx.moveTo(center, 0);
      ctx.lineTo(center, size);
      ctx.moveTo(0, center);
      ctx.lineTo(size, center);
      ctx.stroke();

      // Current Player World Position and Heading
      const playerPos = engine.stats.inVehicle && engine.playerVehiclePhys
        ? engine.playerVehiclePhys.position
        : engine.playerPhysics.position;

      const playerHeading = engine.stats.inVehicle && engine.playerVehiclePhys
        ? engine.playerVehiclePhys.heading
        : engine.playerPhysics.heading;

      // Scale factor (world units to radar pixels)
      const scale = 0.55;

      // Draw Roads relative to player
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(-playerHeading); // Rotate radar with heading

      // Draw Road lines
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';

      // Ocean Beach coast line on East
      ctx.fillStyle = 'rgba(2, 132, 199, 0.35)';
      const oceanRelX = (240 - playerPos.x) * scale;
      ctx.fillRect(oceanRelX, -250, 200, 500);

      // Draw Traffic Cars as white dots
      ctx.fillStyle = '#ffffff';
      for (const car of engine['trafficAI'].trafficCars) {
        const rx = (car.rig.group.position.x - playerPos.x) * scale;
        const rz = (car.rig.group.position.z - playerPos.z) * scale;
        if (Math.hypot(rx, rz) < radius - 8) {
          ctx.beginPath();
          ctx.arc(rx, rz, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Police Cars as blinking Red/Blue
      const flash = Math.sin(Date.now() * 0.015) > 0;
      ctx.fillStyle = flash ? '#ef4444' : '#3b82f6';
      for (const car of engine['trafficAI'].trafficCars) {
        if (car.isPolice) {
          const rx = (car.rig.group.position.x - playerPos.x) * scale;
          const rz = (car.rig.group.position.z - playerPos.z) * scale;
          if (Math.hypot(rx, rz) < radius - 8) {
            ctx.beginPath();
            ctx.arc(rx, rz, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw Mission Destination Blip (Yellow/Pink diamond)
      if (engine.activeMission) {
        const target = engine.activeMission.checkpointList
          ? engine.activeMission.checkpointList[engine.activeMission.currentCheckpoint || 0]
          : engine.activeMission.targetPos;

        if (target) {
          const mx = (target[0] - playerPos.x) * scale;
          const mz = (target[2] - playerPos.z) * scale;
          const dist = Math.hypot(mx, mz);
          const clampedDist = Math.min(dist, radius - 10);
          const angle = Math.atan2(mz, mx);
          const bx = Math.cos(angle) * clampedDist;
          const bz = Math.sin(angle) * clampedDist;

          ctx.fillStyle = '#facc15';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(bx, bz - 6);
          ctx.lineTo(bx + 6, bz);
          ctx.lineTo(bx, bz + 6);
          ctx.lineTo(bx - 6, bz);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      ctx.restore(); // Restore radar rotation

      // Center Player Indicator (always points UP)
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(center, center - 7);
      ctx.lineTo(center + 6, center + 6);
      ctx.lineTo(center, center + 3);
      ctx.lineTo(center - 6, center + 6);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore(); // Restore clip

      // Outer Neon Cyberpunk Border Ring
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Cardinal North Indicator
      const northAngle = -playerHeading;
      const nx = center + Math.sin(northAngle) * (radius - 12);
      const ny = center - Math.cos(northAngle) * (radius - 12);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', nx, ny);

      animId = requestAnimationFrame(renderRadar);
    };

    animId = requestAnimationFrame(renderRadar);
    return () => cancelAnimationFrame(animId);
  }, [engine]);

  return (
    <div className="relative pointer-events-auto flex flex-col items-center">
      <div className="relative w-40 h-40 rounded-full shadow-2xl shadow-cyan-950/80 bg-slate-950/90 border-2 border-cyan-400/40 p-0.5">
        <canvas ref={canvasRef} width={156} height={156} className="w-full h-full rounded-full" />
      </div>

      <div className="mt-1 px-3 py-0.5 bg-slate-900/90 border border-cyan-500/30 rounded text-cyan-300 text-[11px] font-bold tracking-wider uppercase font-mono shadow-md">
        📍 {district}
      </div>
    </div>
  );
};
