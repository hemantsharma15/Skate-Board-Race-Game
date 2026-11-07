import React from 'react';
import { Play, Wrench, Coins, Trophy, Lock } from 'lucide-react';
import { LEVELS } from '../game/LevelData';
import { RacerStorage } from '../storage/RacerStorage';
import type { LevelConfig } from '../types/game';

interface MainMenuProps {
  onStartRace: (level: LevelConfig) => void;
  onOpenGarage: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartRace, onOpenGarage }) => {
  const profile = RacerStorage.getProfile();
  const [selectedLevelId, setSelectedLevelId] = React.useState<number>(1);

  const selectedLevel = LEVELS.find((l) => l.id === selectedLevelId) || LEVELS[0];

  return (
    <div className="main-menu-overlay">
      {/* Top Bar with Coins */}
      <div className="menu-top-bar">
        <div className="brand-tag">APEX SKATE STUDIOS</div>
        <div className="coins-display-badge">
          <Coins size={18} className="gold-coin" />
          <span>{profile.coins}</span>
        </div>
      </div>

      {/* Hero Title */}
      <div className="menu-hero-section">
        <div className="title-flair">EXTREME 3D STREET SKATEBOARD RACING</div>
        <h1 className="game-title">
          <span className="title-downhill">SKATE BOARD</span>
          <span className="title-racer">RACE</span>
        </h1>
        <p className="game-tagline">
          Carve mountain roads, drift sharp hairpins, clash with rivals and boost past 150 KM/H!
        </p>
      </div>

      {/* Track / Level Selection Strip */}
      <div className="track-select-card">
        <div className="track-header">
          <Trophy size={16} className="track-icon" />
          <span>SELECT DESCENT MOUNTAIN</span>
        </div>

        <div className="track-cards-grid">
          {LEVELS.map((lvl) => {
            const isUnlocked = lvl.id <= profile.unlockedLevel;
            const isSelected = lvl.id === selectedLevelId;

            return (
              <button
                key={lvl.id}
                className={`track-card ${isSelected ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`}
                onClick={() => isUnlocked && setSelectedLevelId(lvl.id)}
                disabled={!isUnlocked}
              >
                {!isUnlocked && (
                  <div className="lock-overlay">
                    <Lock size={16} />
                  </div>
                )}
                <div className="track-card-id">STAGE 0{lvl.id}</div>
                <div className="track-card-name">{lvl.name.split(':')[1]}</div>
                <div className="track-card-dist">{lvl.trackLength}m Track</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="menu-action-cluster">
        <button
          className="play-race-button"
          onClick={() => onStartRace(selectedLevel)}
        >
          <Play size={24} fill="#000000" />
          <span>RACE NOW!</span>
        </button>

        <button className="garage-button" onClick={onOpenGarage}>
          <Wrench size={20} />
          <span>GARAGE &amp; UPGRADES</span>
        </button>
      </div>

      {/* Quick Controls Cheat Sheet */}
      <div className="menu-controls-cheat">
        <span>🎮 <strong>◀ ▶ Buttons</strong>, <strong>A / D</strong> or <strong>Arrows</strong> to Steer</span>
        <span>•</span>
        <span>⚡ <strong>SPACE</strong> or <strong>BOOST Button</strong> for Super Boost</span>
        <span>•</span>
        <span>🥊 Ram into Rivals to <strong>Clash!</strong></span>
      </div>
    </div>
  );
};
