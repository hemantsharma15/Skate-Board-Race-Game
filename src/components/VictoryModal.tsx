import React from 'react';
import { Coins, RotateCcw, ArrowRight, Home, CheckCircle2 } from 'lucide-react';
import type { LevelConfig, ResultEntry } from '../types/game';

interface VictoryModalProps {
  level: LevelConfig;
  rank: number;
  coinsEarned: number;
  leaderboard?: ResultEntry[];
  onNextLevel: () => void;
  onRetry: () => void;
  onHome: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  level,
  rank,
  coinsEarned,
  leaderboard = [],
  onNextLevel,
  onRetry,
  onHome,
}) => {
  const isPodium = rank <= 3;

  // Fallback if leaderboard is empty
  const defaultRacers: ResultEntry[] = [
    { rank: 1, name: 'Axel', isPlayer: rank === 1, coinsBonus: 200 },
    { rank: 2, name: 'Blaze', isPlayer: rank === 2, coinsBonus: 140 },
    { rank: 3, name: 'Kira', isPlayer: rank === 3, coinsBonus: 90 },
    { rank: 4, name: 'Vortex', isPlayer: rank === 4, coinsBonus: 30 },
    { rank: 5, name: 'Ghost', isPlayer: rank === 5, coinsBonus: 30 },
    { rank: 6, name: 'Nova', isPlayer: rank === 6, coinsBonus: 30 },
    { rank: 7, name: 'Player', isPlayer: rank >= 7, coinsBonus: 25 },
  ];

  const displayList = leaderboard.length > 0 ? leaderboard : defaultRacers;

  return (
    <div className="modal-backdrop">
      <div className="result-video-card">
        {/* Exact Graffiti Splash Title from Video ("RESULT") */}
        <div className="result-title-banner">
          <h1 className="result-graffiti-title">RESULT</h1>
          <div className="earned-subline">
            <span className="earned-text">You Earned</span>
            <div className="earned-coin-chip">
              <span className="coin-emoji">🪙</span>
              <span className="earned-amount">{coinsEarned}</span>
            </div>
          </div>
        </div>

        {/* 7-Competitor Leaderboard List (Matching Video Screen!) */}
        <div className="result-leaderboard-box">
          <div className="leaderboard-header-row">
            <span className="col-rank">#</span>
            <span className="col-racer">RACER</span>
            <span className="col-bonus">REWARD</span>
          </div>

          <div className="leaderboard-items-scroll">
            {displayList.map((entry) => {
              const isUser = entry.isPlayer || entry.rank === rank;
              return (
                <div
                  key={entry.rank}
                  className={`leaderboard-item-row rank-${entry.rank} ${isUser ? 'user-highlight' : ''}`}
                >
                  <div className="rank-badge-cell">
                    <span className="rank-num-text">{entry.rank}</span>
                  </div>

                  <div className="racer-info-cell">
                    <div className={`racer-avatar-dot rank-${entry.rank}`} />
                    <span className="racer-name-text">
                      {isUser ? `${entry.name} (YOU)` : entry.name}
                    </span>
                    {isUser && <span className="you-pill">YOU</span>}
                  </div>

                  <div className="reward-cell">
                    <span className="reward-coins">+{entry.coinsBonus}</span>
                    <Coins size={14} className="small-gold-coin" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exact "Claim!" Button from Video */}
        <div className="result-actions-cluster">
          <button className="claim-reward-button" onClick={isPodium ? onNextLevel : onRetry}>
            <CheckCircle2 size={24} className="claim-icon" />
            <span className="claim-label">Claim!</span>
          </button>

          <div className="secondary-action-row">
            <button className="sub-action-btn" onClick={onRetry} title="Retry Race">
              <RotateCcw size={16} />
              <span>Retry</span>
            </button>

            {level.id < 4 && isPodium && (
              <button className="sub-action-btn next-track" onClick={onNextLevel} title="Next Track">
                <span>Next Track</span>
                <ArrowRight size={16} />
              </button>
            )}

            <button className="sub-action-btn" onClick={onHome} title="Main Menu">
              <Home size={16} />
              <span>Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
