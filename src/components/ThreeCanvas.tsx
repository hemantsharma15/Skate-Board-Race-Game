import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/GameEngine';
import type { GameTelemetry, LevelConfig, ResultEntry } from '../types/game';

interface ThreeCanvasProps {
  level: LevelConfig;
  onTelemetry: (t: GameTelemetry) => void;
  onFinish: (rank: number, coins: number, leaderboard: ResultEntry[]) => void;
  engineRef: React.MutableRefObject<GameEngine | null>;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  level,
  onTelemetry,
  onFinish,
  engineRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(
      containerRef.current,
      level,
      onTelemetry,
      onFinish
    );
    engineRef.current = engine;

    // --- Keyboard Steering ---
    let leftDown = false;
    let rightDown = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        leftDown = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        rightDown = true;
      } else if (e.key === ' ' || e.key === 'Shift') {
        engine.triggerNitro();
      }

      const steer = (leftDown ? -1 : 0) + (rightDown ? 1 : 0);
      engine.setSteer(steer);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        leftDown = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        rightDown = false;
      }

      const steer = (leftDown ? -1 : 0) + (rightDown ? 1 : 0);
      engine.setSteer(steer);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // --- Mouse & Touch Drag Steering (Mobile/Tablet & Casual Mouse) ---
    const handlePointerDown = (e: PointerEvent) => {
      // Don't drag steer if user clicks/taps an interactive HUD button
      if ((e.target as HTMLElement)?.closest('button, .modal-backdrop')) return;
      touchStartX.current = e.clientX;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (touchStartX.current === null) return;
      const diffX = e.clientX - touchStartX.current;
      const maxRange = 120;
      const steer = Math.max(-1, Math.min(1, diffX / maxRange));
      engine.setSteer(steer);
    };

    const handlePointerUp = () => {
      touchStartX.current = null;
      if (!leftDown && !rightDown) {
        engine.setSteer(0);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      engine.destroy();
      engineRef.current = null;
    };
  }, [level]);

  return <div ref={containerRef} className="three-game-container" />;
};
