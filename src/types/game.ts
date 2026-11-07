export interface UpgradeStats {
  speedLevel: number;
  handlingLevel: number;
  nitroLevel: number;
  clashLevel: number;
}

export interface PlayerProfile {
  coins: number;
  diamonds: number;
  unlockedLevel: number;
  selectedBoard: string;
  selectedCharacter: string;
  upgrades: UpgradeStats;
}

export type TrackTheme = 'alpine' | 'canyon' | 'sunset' | 'cyber';

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  theme: TrackTheme;
  trackLength: number;
  rivalCount: number;
  curveIntensity: number;
  obstacleDensity: number;
  skyColor: number;
  fogColor: number;
  sunColor: number;
  roadColor: number;
  curbColor: number;
}

export interface RivalState {
  id: string;
  name: string;
  z: number;
  x: number;
  speed: number;
  baseSpeed: number;
  color: number;
  suitColor: number;
  isKnockedOut: boolean;
  knockoutTimer: number;
  rank: number;
}

export type ObstacleType = 'cone' | 'barrier' | 'rock' | 'oil' | 'ramp' | 'boost' | 'coin';

export interface WorldObstacle {
  id: number;
  type: ObstacleType;
  x: number;
  z: number;
  width: number;
  height: number;
  active: boolean;
  rotation?: number;
}

export interface TrafficCar {
  id: number;
  model: 'sport' | 'truck';
  color: number;
  x: number;
  z: number;
  speed: number;
  width: number;
  length: number;
  hasNearMissed?: boolean;
}

export interface ResultEntry {
  rank: number;
  name: string;
  isPlayer: boolean;
  coinsBonus: number;
}

export interface GameTelemetry {
  speed: number;
  maxSpeed: number;
  distance: number;
  totalDistance: number;
  progressPercent: number;
  rank: number;
  totalRacers: number;
  coinsCollected: number;
  nitro: number;
  nitroMax: number;
  isNitroActive: boolean;
  isDrifting: boolean;
  isAirborne: boolean;
  comboMessage: string | null;
  nearMissCount: number;
}
