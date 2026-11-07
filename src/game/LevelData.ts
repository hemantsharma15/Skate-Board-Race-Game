import type { LevelConfig } from '../types/game';

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'LEVEL 1: ALPINE DOWNHILL RIDGE',
    subtitle: 'High-speed mountain descent through pine forests',
    theme: 'alpine',
    trackLength: 1800, // 1800 meters
    rivalCount: 4,
    curveIntensity: 0.8,
    obstacleDensity: 0.6,
    skyColor: 0x87ceeb, // Sky blue
    fogColor: 0xb5e2fa,
    sunColor: 0xffffff,
    roadColor: 0x24272c,
    curbColor: 0xcc2222,
  },
  {
    id: 2,
    name: 'LEVEL 2: REDWOOD HALFPIPE CANYON',
    subtitle: 'Steep canyon cliff drops with airtime ramps',
    theme: 'canyon',
    trackLength: 2300,
    rivalCount: 5,
    curveIntensity: 1.2,
    obstacleDensity: 0.9,
    skyColor: 0x6bb5d8,
    fogColor: 0x89c4de,
    sunColor: 0xfff4e0,
    roadColor: 0x202428,
    curbColor: 0xffaa00,
  },
  {
    id: 3,
    name: 'LEVEL 3: SUNSET HIGHWAY RUN',
    subtitle: 'High adrenaline rival clashing at dusk',
    theme: 'sunset',
    trackLength: 2800,
    rivalCount: 5,
    curveIntensity: 1.5,
    obstacleDensity: 1.1,
    skyColor: 0xf37055, // Sunset orange/rose
    fogColor: 0xf58f70,
    sunColor: 0xffcc88,
    roadColor: 0x1b1f24,
    curbColor: 0x00ff88,
  },
  {
    id: 4,
    name: 'LEVEL 4: CYBER SKATE SUMMIT',
    subtitle: 'Nighttime extreme downhill with blazing boost strips',
    theme: 'cyber',
    trackLength: 3400,
    rivalCount: 6,
    curveIntensity: 1.8,
    obstacleDensity: 1.3,
    skyColor: 0x0b0f19, // Cyber dark night
    fogColor: 0x141b2d,
    sunColor: 0x00f3ff,
    roadColor: 0x12151b,
    curbColor: 0xff0055,
  },
];
