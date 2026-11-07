import React, { useState } from 'react';
import { ArrowLeft, Coins, Zap, Shield, Gauge, Wind, Check } from 'lucide-react';
import { RacerStorage } from '../storage/RacerStorage';
import type { PlayerProfile } from '../types/game';

interface GarageModalProps {
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({ onClose }) => {
  const [profile, setProfile] = useState<PlayerProfile>(() => RacerStorage.getProfile());

  const handleUpgrade = (
    stat: 'speedLevel' | 'handlingLevel' | 'nitroLevel' | 'clashLevel',
    cost: number
  ) => {
    const success = RacerStorage.upgradeStat(stat, cost);
    if (success) {
      setProfile(RacerStorage.getProfile());
    }
  };

  const calculateCost = (level: number) => level * 150;

  const upgradesList = [
    {
      id: 'speedLevel' as const,
      name: 'TOP SPEED DESCENT',
      desc: 'Increases maximum downhill velocity and momentum',
      icon: Gauge,
      level: profile.upgrades.speedLevel,
      color: '#ff0055',
    },
    {
      id: 'handlingLevel' as const,
      name: 'DRIFT & HANDLING',
      desc: 'Sharpens hairpin turning radius and drift responsiveness',
      icon: Wind,
      level: profile.upgrades.handlingLevel,
      color: '#00f3ff',
    },
    {
      id: 'nitroLevel' as const,
      name: 'SUPER BOOST ACCELERATION',
      desc: 'Supercharges rocket boost duration and refill rate',
      icon: Zap,
      level: profile.upgrades.nitroLevel,
      color: '#ffaa00',
    },
    {
      id: 'clashLevel' as const,
      name: 'CLASH BUMPER ARMOR',
      desc: 'Delivers heavier impact hits to knock rivals off track',
      icon: Shield,
      level: profile.upgrades.clashLevel,
      color: '#00ff88',
    },
  ];

  return (
    <div className="modal-backdrop">
      <div className="garage-card">
        {/* Header */}
        <div className="garage-header">
          <button className="back-btn" onClick={onClose}>
            <ArrowLeft size={20} />
            <span>BACK</span>
          </button>
          <h2>TUNING GARAGE</h2>
          <div className="coins-pill">
            <Coins size={18} className="gold-coin" />
            <span>{profile.coins}</span>
          </div>
        </div>

        {/* Upgrades List */}
        <div className="upgrades-list">
          {upgradesList.map((item) => {
            const cost = calculateCost(item.level);
            const canAfford = profile.coins >= cost;
            const isMax = item.level >= 10;
            const Icon = item.icon;

            return (
              <div key={item.id} className="upgrade-row">
                <div
                  className="upgrade-icon-box"
                  style={{ backgroundColor: `${item.color}22`, borderColor: item.color }}
                >
                  <Icon size={24} style={{ color: item.color }} />
                </div>

                <div className="upgrade-details">
                  <div className="upgrade-name-row">
                    <span className="upgrade-title">{item.name}</span>
                    <span className="upgrade-lvl">LVL {item.level} / 10</span>
                  </div>
                  <p className="upgrade-desc">{item.desc}</p>
                  <div className="lvl-bar-track">
                    <div
                      className="lvl-bar-fill"
                      style={{ width: `${(item.level / 10) * 100}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>

                <div className="upgrade-action">
                  {isMax ? (
                    <div className="max-tag">
                      <Check size={16} /> MAX
                    </div>
                  ) : (
                    <button
                      className={`upgrade-btn ${canAfford ? 'affordable' : 'locked'}`}
                      onClick={() => canAfford && handleUpgrade(item.id, cost)}
                      disabled={!canAfford}
                    >
                      <Coins size={14} />
                      <span>{cost}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
