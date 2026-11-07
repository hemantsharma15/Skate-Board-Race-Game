import React from 'react';
import { Flag, Pause, Zap } from 'lucide-react';
import type { GameTelemetry } from '../types/game';

interface DownhillHUDProps {
  telemetry: GameTelemetry;
  onTriggerBoost: () => void;
  onSteer: (amount: number) => void;
  onPause: () => void;
}

export const DownhillHUD: React.FC<DownhillHUDProps> = ({
  telemetry,
  onTriggerBoost,
  onSteer,
  onPause,
}) => {
  const getRankSuffix = (r: number) => {
    if (r === 1) return 'st';
    if (r === 2) return 'nd';
    if (r === 3) return 'rd';
    return 'th';
  };

  const speedRatio = Math.min(1.0, telemetry.speed / 150);

  return (
    <div className="downhill-hud-overlay">
      {/* --- TOP BAR (Exact layout from user recording) --- */}
      <div className="hud-video-topbar">
        {/* Top-Left: Angled Speed Pill */}
        <div className="speed-angled-pill">
          <div className="speed-label-tiny">speed</div>
          <div className="speed-num-row">
            <span className="speed-big-val">{telemetry.speed}</span>
            <span className="speed-unit-text">km/h</span>
          </div>
        </div>

        {/* Top-Center: Angled Green/Teal Track Progress Bar */}
        <div className="level-progress-pill">
          <div className="level-tag-row">
            <span className="level-title-text">Level 1</span>
          </div>
          <div className="progress-slanted-track">
            <div
              className="progress-slanted-fill"
              style={{ width: `${telemetry.progressPercent}%` }}
            />
            <Flag size={15} className="finish-checkered-flag" />
          </div>
        </div>

        {/* Top-Right: Coins Pill & Pause Button */}
        <div className="hud-top-right-group">
          <div className="coins-video-pill">
            <span className="coin-icon-gold">🪙</span>
            <span className="coins-counter-text">+{telemetry.coinsCollected}</span>
          </div>
          <button className="hud-pause-circular-btn" onClick={onPause} title="Pause Game">
            <Pause size={17} />
          </button>
        </div>
      </div>

      {/* --- FLOATING 3D-STYLE RANK OVER SKATER (Exact match to "7th" in video!) --- */}
      <div className="floating-video-rank">
        <span className="floating-rank-digit">{telemetry.rank}</span>
        <span className="floating-rank-suffix-text">{getRankSuffix(telemetry.rank)}</span>
      </div>

      {/* --- NEAR MISS +10 COMBO POPUP (Exact match to video near miss!) --- */}
      {telemetry.comboMessage && (
        <div className="near-miss-comic-popup">
          <span className="near-miss-text">{telemetry.comboMessage}</span>
        </div>
      )}

      {/* --- DRIFT & AIRTIME POPUPS --- */}
      {telemetry.isDrifting && (
        <div className="drift-active-badge">
          <Zap size={16} />
          <span>DRIFT!</span>
        </div>
      )}
      {telemetry.isAirborne && (
        <div className="airtime-active-badge">
          <span>AIRTIME!</span>
        </div>
      )}

      {/* --- BOTTOM CONTROLS & BOOST --- */}
      <div className="hud-bottom-row">
        {/* On-Screen Steering Left / Right Buttons */}
        <div className="hud-steering-cluster">
          <button
            className="steer-action-btn steer-left"
            onPointerDown={(e) => { e.stopPropagation(); onSteer(-1); }}
            onPointerUp={(e) => { e.stopPropagation(); onSteer(0); }}
            onPointerLeave={() => onSteer(0)}
            onPointerCancel={() => onSteer(0)}
            title="Steer Left [A / ◀]"
          >
            <span className="steer-arrow-icon">◀</span>
            <span className="steer-btn-label">LEFT</span>
          </button>

          <button
            className="steer-action-btn steer-right"
            onPointerDown={(e) => { e.stopPropagation(); onSteer(1); }}
            onPointerUp={(e) => { e.stopPropagation(); onSteer(0); }}
            onPointerLeave={() => onSteer(0)}
            onPointerCancel={() => onSteer(0)}
            title="Steer Right [D / ▶]"
          >
            <span className="steer-btn-label">RIGHT</span>
            <span className="steer-arrow-icon">▶</span>
          </button>
        </div>

        {/* Steering Instruction Hint */}
        <div className="touch-steering-hint">
          <span>Use ◀ ▶ or A / D to steer • SPACE to Boost</span>
        </div>

        {/* Boost Action Button */}
        <button
          className={`nitro-action-trigger ${telemetry.nitro >= 25 ? 'ready' : 'empty'} ${
            telemetry.isNitroActive ? 'ignited' : ''
          }`}
          onClick={(e) => { e.stopPropagation(); onTriggerBoost(); }}
          onPointerDown={(e) => e.stopPropagation()}
          title="Super Boost [SPACE]"
        >
          <div className="nitro-btn-inner">
            <span className="nitro-flame-icon">⚡</span>
            <span className="nitro-btn-text">BOOST</span>
          </div>
          <div
            className="nitro-refill-line"
            style={{ width: `${telemetry.nitro}%` }}
          />
        </button>
      </div>
    </div>
  );
};
