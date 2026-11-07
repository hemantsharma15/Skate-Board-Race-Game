import * as THREE from 'three';
import { DownhillWorld } from './DownhillWorld';
import { racerAudio } from '../audio/RacerAudio';
import { RacerStorage } from '../storage/RacerStorage';
import type { GameTelemetry, LevelConfig, RivalState, ResultEntry } from '../types/game';

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private world: DownhillWorld;
  private level: LevelConfig;

  // Player Physics
  public playerZ = 0;
  public playerX = 0; // Relative to road center
  public playerY = 0;
  public speed = 40; // km/h
  public baseTopSpeed = 95; // km/h
  public topSpeed = 95;
  public steerInput = 0; // -1 to 1
  public isDrifting = false;
  public isAirborne = false;
  public airVelocityY = 0;
  public isNitroActive = false;
  public nitroTimer = 0;
  public nitroGauge = 100;
  public coinsCollected = 0;
  public nearMissCount = 0;
  public comboMessage: string | null = null;
  public comboTimer = 0;

  // Rivals
  public rivals: RivalState[] = [];

  // Loop & Callbacks
  private isRunning = false;
  private lastTime = 0;
  private onTelemetry: (t: GameTelemetry) => void;
  private onFinish: (rank: number, coins: number, leaderboard: ResultEntry[]) => void;
  private animationFrameId: number | null = null;

  constructor(
    container: HTMLElement,
    level: LevelConfig,
    onTelemetry: (t: GameTelemetry) => void,
    onFinish: (rank: number, coins: number, leaderboard: ResultEntry[]) => void
  ) {
    this.container = container;
    this.level = level;
    this.onTelemetry = onTelemetry;
    this.onFinish = onFinish;

    // Apply Upgrades from Storage
    const profile = RacerStorage.getProfile();
    this.topSpeed = this.baseTopSpeed + profile.upgrades.speedLevel * 8;

    // Setup Three.js Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Build World
    this.world = new DownhillWorld(container, level);

    // Initialize Rivals (Matching exact competitor names from video recording!)
    this.initRivals(level.rivalCount);

    // Window Resize Listener
    window.addEventListener('resize', this.onWindowResize);

    racerAudio.init();
    racerAudio.startMusic();
    this.start();
  }

  private initRivals(count: number): void {
    // Competitors lineup
    const names = ['Axel', 'Blaze', 'Kira', 'Vortex', 'Ghost', 'Nova'];
    const colors = [0xdc2626, 0xf59e0b, 0x10b981, 0x8b5cf6, 0x06b6d4, 0xec4899];

    const rivalTotal = Math.min(count, names.length);
    for (let i = 0; i < rivalTotal; i++) {
      const id = `rival_${i}`;
      const baseSpd = this.topSpeed - 6 + (Math.random() * 8 - 4);
      const rival: RivalState = {
        id,
        name: names[i],
        z: 40 + i * 28,
        x: (Math.random() - 0.5) * (this.world.roadWidth - 5),
        speed: baseSpd,
        baseSpeed: baseSpd,
        color: colors[i % colors.length],
        suitColor: colors[i % colors.length],
        isKnockedOut: false,
        knockoutTimer: 0,
        rank: i + 2,
      };
      this.rivals.push(rival);
      this.world.addRivalMesh(id, rival.suitColor, rival.color);
    }
  }

  public setSteer(amount: number): void {
    this.steerInput = Math.max(-1, Math.min(1, amount));
    this.isDrifting = Math.abs(amount) > 0.65;
  }

  public triggerNitro(): void {
    if (this.nitroGauge >= 25 && !this.isNitroActive) {
      this.isNitroActive = true;
      this.nitroTimer = 3.0;
      this.nitroGauge = Math.max(0, this.nitroGauge - 35);
      this.speed = Math.min(160, this.speed + 35);
      racerAudio.playBoost();
      this.showCombo('SUPER BOOST! ⚡');
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    racerAudio.stopAll();
  }

  private loop = (time: number): void => {
    if (!this.isRunning) return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.update(dt);
    this.renderer.render(this.world.scene, this.world.camera);
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    // 1. Acceleration & Downhill Gravity
    let targetSpeed = this.topSpeed;
    if (this.isNitroActive) targetSpeed = 150;
    else if (this.isDrifting) targetSpeed = this.topSpeed * 0.88;

    this.speed = THREE.MathUtils.lerp(this.speed, targetSpeed, dt * 1.8);

    // Nitro Countdown
    if (this.isNitroActive) {
      this.nitroTimer -= dt;
      if (this.nitroTimer <= 0) {
        this.isNitroActive = false;
      }
    } else {
      this.nitroGauge = Math.min(100, this.nitroGauge + dt * 6);
    }

    // 2. Forward Progress along track
    const forwardSpeedMetersPerSec = (this.speed * 1000) / 3600;
    this.playerZ += forwardSpeedMetersPerSec * dt;

    // 3. Steering & Lane Changing
    const steerSpeed = 13 * (this.isDrifting ? 1.4 : 1.0);
    this.playerX -= this.steerInput * steerSpeed * dt;
    const maxLaneX = this.world.roadWidth / 2 - 1.2;
    this.playerX = Math.max(-maxLaneX, Math.min(maxLaneX, this.playerX));

    // 4. Elevation & Airborne Jump Physics
    const roadGroundY = this.world.getRoadHeight(this.playerZ);
    if (this.isAirborne) {
      this.playerY += this.airVelocityY * dt;
      this.airVelocityY -= 25 * dt;
      if (this.playerY <= roadGroundY) {
        this.playerY = roadGroundY;
        this.isAirborne = false;
        this.airVelocityY = 0;
        this.showCombo('PERFECT LANDING! ⭐');
      }
    } else {
      this.playerY = roadGroundY;
    }

    // 5. Update Player 3D Mesh
    const roadCenterX = this.world.getRoadCenter(this.playerZ);
    this.world.playerMesh.group.position.set(roadCenterX + this.playerX, this.playerY, this.playerZ);

    const nextZ = this.playerZ + 2;
    const nextRoadX = this.world.getRoadCenter(nextZ);
    const nextRoadY = this.world.getRoadHeight(nextZ);
    const roadHeading = Math.atan2(nextRoadX - roadCenterX, nextZ - this.playerZ);
    const roadPitch = Math.atan2(roadGroundY - nextRoadY, 2);

    this.world.playerMesh.group.rotation.y = roadHeading;
    this.world.playerMesh.group.rotation.x = roadPitch;
    this.world.playerMesh.update(dt, this.speed, this.steerInput, this.isDrifting, this.isAirborne);

    // Audio Wind & Rumble update
    racerAudio.updateSpeed(this.speed / 160, this.isAirborne);
    if (this.isDrifting && Math.random() < 0.2) {
      racerAudio.playDrift();
    }

    // 6. Camera Trailing & Dynamic FOV
    const camDistance = 5.2;
    const camHeight = 2.6;
    const targetCamX = roadCenterX + this.playerX * 0.55;
    const targetCamY = this.playerY + camHeight;

    this.world.camera.position.x = THREE.MathUtils.lerp(this.world.camera.position.x, targetCamX, dt * 10);
    this.world.camera.position.y = THREE.MathUtils.lerp(this.world.camera.position.y, targetCamY, dt * 10);
    this.world.camera.position.z = this.playerZ - camDistance;
    this.world.camera.lookAt(roadCenterX + this.playerX * 0.35, this.playerY + 1.4, this.playerZ + 18);

    const targetFov = 62 + (this.speed / 160) * 14;
    this.world.camera.fov = THREE.MathUtils.lerp(this.world.camera.fov, targetFov, dt * 6);
    this.world.camera.updateProjectionMatrix();

    // 7. Check Collisions with Items & Obstacles
    this.checkCollisions();

    // 8. Update Traffic Vehicles & Near Miss Mechanic (matching video 00:08!)
    this.world.updateTraffic(dt);
    this.checkTrafficVehicles();

    // 9. Update Rivals & Clash Mechanics
    this.updateRivalsLogic(dt);

    // 10. Animate Item rotations, flame jets & falling autumn leaves
    this.world.animateItems(dt, this.playerZ, this.speed);

    // 11. Check Finish Line
    if (this.playerZ >= this.level.trackLength) {
      this.handleFinish();
      return;
    }

    // 12. Emit Telemetry to React HUD
    this.emitTelemetry();
  }

  private checkTrafficVehicles(): void {
    const pz = this.playerZ;
    const playerGlobalX = this.world.getRoadCenter(pz) + this.playerX;

    for (const car of this.world.trafficVehicles) {
      const carGlobalX = this.world.getRoadCenter(car.z) + car.x;
      const distZ = Math.abs(pz - car.z);
      const distX = Math.abs(playerGlobalX - carGlobalX);

      // Direct Collision with Traffic Car
      if (distZ < 2.2 && distX < 1.35 && !this.isAirborne) {
        this.speed = Math.max(25, this.speed - 50);
        racerAudio.playCrash();
        this.showCombo('CAR IMPACT! 💥');
      }
      // Exact "NEAR MISS +10" mechanic from video!
      else if (distZ < 2.8 && distX < 2.5 && !car.hasNearMissed) {
        car.hasNearMissed = true;
        this.nearMissCount++;
        this.coinsCollected += 10;
        RacerStorage.addCoins(10);
        this.speed = Math.min(160, this.speed + 16); // instant adrenaline boost
        racerAudio.playBoost();
        this.showCombo('NEAR MISS +10! 🔥');
      }
    }
  }

  private checkCollisions(): void {
    const px = this.world.getRoadCenter(this.playerZ) + this.playerX;
    const pz = this.playerZ;

    for (const item of this.world.activeObstacles) {
      if (!item.active) continue;

      const distZ = Math.abs(pz - item.z);
      const distX = Math.abs(px - item.x);

      if (distZ < 2.0 && distX < item.width / 2 + 0.6) {
        if (item.type === 'coin') {
          item.active = false;
          this.coinsCollected += 10;
          RacerStorage.addCoins(10);
          racerAudio.playCoin();
          this.removeObstacleMesh(item.id);
          this.showCombo('+10 COINS! 💰');
        } else if (item.type === 'boost') {
          this.isNitroActive = true;
          this.nitroTimer = 2.5;
          this.speed = Math.min(160, this.speed + 45);
          racerAudio.playBoost();
          this.showCombo('BOOST PAD! ⚡');
        } else if (item.type === 'ramp') {
          if (!this.isAirborne) {
            this.isAirborne = true;
            this.airVelocityY = 14;
            racerAudio.playRamp();
            this.showCombo('AIRTIME TRICK! 🚀');
          }
        } else if (item.type === 'cone' || item.type === 'barrier' || item.type === 'rock') {
          if (!this.isAirborne) {
            item.active = false;
            this.speed = Math.max(30, this.speed - 40);
            racerAudio.playCrash();
            this.showCombo('CRASH! 💥');
          }
        }
      }
    }
  }

  private updateRivalsLogic(dt: number): void {
    const px = this.world.getRoadCenter(this.playerZ) + this.playerX;
    const pz = this.playerZ;

    for (const r of this.rivals) {
      if (r.isKnockedOut) {
        r.knockoutTimer += dt;
        if (r.knockoutTimer > 3.0) {
          r.isKnockedOut = false;
          r.knockoutTimer = 0;
          r.speed = r.baseSpeed;
        }
        continue;
      }

      // Rival AI movement along track
      r.speed = THREE.MathUtils.lerp(r.speed, r.baseSpeed, dt * 0.8);
      r.z += ((r.speed * 1000) / 3600) * dt;
      r.x += Math.sin(r.z * 0.05 + r.speed) * dt * 2.5;

      // Clash Detection with Player!
      const rx = this.world.getRoadCenter(r.z) + r.x;
      const rz = r.z;

      const distZ = Math.abs(pz - rz);
      const distX = Math.abs(px - rx);

      if (distZ < 2.2 && distX < 1.4 && !this.isAirborne) {
        r.isKnockedOut = true;
        r.speed = 10;
        racerAudio.playClash();
        this.coinsCollected += 50;
        RacerStorage.addCoins(50);
        this.showCombo(`KNOCKOUT ${r.name}! +50 🥊`);
      }
    }

    this.world.updateRivals(this.rivals, dt);
  }

  private removeObstacleMesh(id: number): void {
    for (let i = this.world.itemsGroup.children.length - 1; i >= 0; i--) {
      const child = this.world.itemsGroup.children[i];
      if ((child as unknown as { obstacleId: number }).obstacleId === id) {
        this.world.itemsGroup.remove(child);
        break;
      }
    }
  }

  private showCombo(msg: string): void {
    this.comboMessage = msg;
    this.comboTimer = 1.6;
  }

  private calculateRank(): number {
    let rank = 1;
    for (const r of this.rivals) {
      if (r.z > this.playerZ) {
        rank++;
      }
    }
    return rank;
  }

  private emitTelemetry(): void {
    const progressPercent = Math.min(100, Math.round((this.playerZ / this.level.trackLength) * 100));

    if (this.comboTimer > 0) {
      this.comboTimer -= 0.016;
      if (this.comboTimer <= 0) this.comboMessage = null;
    }

    this.onTelemetry({
      speed: Math.round(this.speed),
      maxSpeed: Math.round(this.topSpeed * 1.4),
      distance: Math.round(this.playerZ),
      totalDistance: this.level.trackLength,
      progressPercent,
      rank: this.calculateRank(),
      totalRacers: this.rivals.length + 1,
      coinsCollected: this.coinsCollected,
      nearMissCount: this.nearMissCount,
      nitro: Math.round(this.nitroGauge),
      nitroMax: 100,
      isNitroActive: this.isNitroActive,
      isDrifting: this.isDrifting,
      isAirborne: this.isAirborne,
      comboMessage: this.comboMessage,
    });
  }

  private handleFinish(): void {
    this.stop();
    const rank = this.calculateRank();
    racerAudio.playFinish();

    // Reward for completing
    const finishBonus = rank === 1 ? 500 : rank === 2 ? 300 : 150;
    RacerStorage.addCoins(finishBonus);
    if (rank <= 3) {
      RacerStorage.unlockNextLevel(this.level.id);
    }

    // Build the exact 7-racer leaderboard matching the video Result screen!
    const racers = [
      { name: 'Player', z: this.playerZ, isPlayer: true },
      ...this.rivals.map((r) => ({ name: r.name, z: r.z, isPlayer: false })),
    ];
    racers.sort((a, b) => b.z - a.z);

    const leaderboard: ResultEntry[] = racers.map((r, idx) => ({
      rank: idx + 1,
      name: r.name,
      isPlayer: r.isPlayer,
      coinsBonus: idx === 0 ? 200 : idx === 1 ? 140 : idx === 2 ? 90 : 30,
    }));

    this.onFinish(rank, this.coinsCollected + finishBonus, leaderboard);
  }

  private onWindowResize = (): void => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.world.camera.aspect = w / h;
    this.world.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
    if (this.container && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

