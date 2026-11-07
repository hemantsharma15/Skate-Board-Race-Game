import type { PlayerProfile } from '../types/game';

const STORAGE_KEY = 'DOWNHILL_RACER_PROFILE_V1';

const DEFAULT_PROFILE: PlayerProfile = {
  coins: 500,
  diamonds: 5,
  unlockedLevel: 1,
  selectedBoard: 'speed_cruiser',
  selectedCharacter: 'rider_alex',
  upgrades: {
    speedLevel: 1,
    handlingLevel: 1,
    nitroLevel: 1,
    clashLevel: 1,
  },
};

export class RacerStorage {
  public static getProfile(): PlayerProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return { ...DEFAULT_PROFILE };
      return { ...DEFAULT_PROFILE, ...JSON.parse(data) };
    } catch {
      return { ...DEFAULT_PROFILE };
    }
  }

  public static saveProfile(profile: PlayerProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save racer profile:', e);
    }
  }

  public static addCoins(amount: number): number {
    const p = this.getProfile();
    p.coins += amount;
    this.saveProfile(p);
    return p.coins;
  }

  public static upgradeStat(stat: 'speedLevel' | 'handlingLevel' | 'nitroLevel' | 'clashLevel', cost: number): boolean {
    const p = this.getProfile();
    if (p.coins < cost) return false;
    p.coins -= cost;
    p.upgrades[stat] += 1;
    this.saveProfile(p);
    return true;
  }

  public static unlockNextLevel(completedLevel: number): void {
    const p = this.getProfile();
    if (completedLevel >= p.unlockedLevel && p.unlockedLevel < 4) {
      p.unlockedLevel = completedLevel + 1;
      this.saveProfile(p);
    }
  }
}
