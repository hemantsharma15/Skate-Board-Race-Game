import React, { useState, useRef } from 'react';
import { MainMenu } from './components/MainMenu';
import { ThreeCanvas } from './components/ThreeCanvas';
import { DownhillHUD } from './components/DownhillHUD';
import { GarageModal } from './components/GarageModal';
import { VictoryModal } from './components/VictoryModal';
import { LEVELS } from './game/LevelData';
import type { GameEngine } from './game/GameEngine';
import type { GameTelemetry, LevelConfig, ResultEntry } from './types/game';
import './App.css';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<'MENU' | 'PLAYING' | 'VICTORY'>('MENU');
  const [showGarage, setShowGarage] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<LevelConfig>(LEVELS[0]);
  const [telemetry, setTelemetry] = useState<GameTelemetry | null>(null);
  const [finishData, setFinishData] = useState<{ rank: number; coins: number; leaderboard: ResultEntry[] } | null>(null);

  const engineRef = useRef<GameEngine | null>(null);

  const handleStartRace = (level: LevelConfig) => {
    setSelectedLevel(level);
    setTelemetry(null);
    setFinishData(null);
    setScreen('PLAYING');
  };

  const handleFinishRace = (rank: number, coins: number, leaderboard: ResultEntry[]) => {
    setFinishData({ rank, coins, leaderboard });
    setScreen('VICTORY');
  };

  const handleNextLevel = () => {
    const nextIdx = LEVELS.findIndex((l) => l.id === selectedLevel.id) + 1;
    if (nextIdx < LEVELS.length) {
      handleStartRace(LEVELS[nextIdx]);
    } else {
      setScreen('MENU');
    }
  };

  const handleRetry = () => {
    handleStartRace(selectedLevel);
  };

  return (
    <div className="racer-app-root">
      {/* 1. Main Menu */}
      {screen === 'MENU' && (
        <MainMenu
          onStartRace={handleStartRace}
          onOpenGarage={() => setShowGarage(true)}
        />
      )}

      {/* 2. Active 3D Race Simulation */}
      {screen === 'PLAYING' && (
        <>
          <ThreeCanvas
            level={selectedLevel}
            onTelemetry={setTelemetry}
            onFinish={handleFinishRace}
            engineRef={engineRef}
          />

          {telemetry && (
            <DownhillHUD
              telemetry={telemetry}
              onTriggerBoost={() => engineRef.current?.triggerNitro()}
              onSteer={(steer) => engineRef.current?.setSteer(steer)}
              onPause={() => setScreen('MENU')}
            />
          )}
        </>
      )}

      {/* 3. Victory & Debrief Screen */}
      {screen === 'VICTORY' && finishData && (
        <VictoryModal
          level={selectedLevel}
          rank={finishData.rank}
          coinsEarned={finishData.coins}
          leaderboard={finishData.leaderboard}
          onNextLevel={handleNextLevel}
          onRetry={handleRetry}
          onHome={() => setScreen('MENU')}
        />
      )}

      {/* 4. Tuning Garage Modal */}
      {showGarage && <GarageModal onClose={() => setShowGarage(false)} />}
    </div>
  );
};

export default App;
