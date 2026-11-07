import * as THREE from 'three';
import type { LevelConfig, WorldObstacle, RivalState, TrafficCar } from '../types/game';
import { SkaterMesh } from './SkaterMesh';
import { TextureGenerator } from './TextureGenerator';

export class DownhillWorld {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public playerMesh: SkaterMesh;
  public rivalMeshes: Map<string, SkaterMesh> = new Map();

  // Environment & Track Meshes
  public roadSegments: THREE.Mesh[] = [];
  public roadsideObjects: THREE.Group = new THREE.Group();
  public itemsGroup: THREE.Group = new THREE.Group();
  public tunnelGroup: THREE.Group = new THREE.Group();
  public trafficGroup: THREE.Group = new THREE.Group();
  public activeObstacles: WorldObstacle[] = [];
  public trafficVehicles: TrafficCar[] = [];
  public trafficMeshes: Map<number, THREE.Group> = new Map();
  public finishLineMesh!: THREE.Group;

  // Speed Lines & Falling Leaves Particle Systems
  private speedLinesSystem!: THREE.LineSegments;
  private leavesSystem!: THREE.Points;
  private leavesPositions!: Float32Array;
  private flameJets: THREE.Mesh[] = [];

  // Track Dimensions
  public roadWidth = 13.5;
  public trackLength = 1900;
  public curveFactor = 1.0;

  constructor(container: HTMLElement, level: LevelConfig) {
    this.trackLength = Math.max(1800, level.trackLength);
    this.curveFactor = level.curveIntensity;

    // 1. Scene & Atmosphere
    this.scene = new THREE.Scene();

    // Sunny Blue Sky with Clouds
    const skyTex = TextureGenerator.createSunnySkyTexture();
    const skyGeo = new THREE.SphereGeometry(600, 32, 20);
    const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(skyDome);

    // Sunlit Mountain Fog
    this.scene.fog = new THREE.FogExp2(0xbfe3f7, 0.0028);

    // 2. Camera Setup (Matching Video exact trailing angle)
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(62, aspect, 0.2, 700);

    // 3. Realistic Sunlight & Ambient
    const ambientLight = new THREE.AmbientLight(0xfff6ea, 0.85);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.35);
    sunLight.position.set(50, 90, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    this.scene.add(sunLight);

    // 4. Player Skater (Crimson hoodie + stealth board + neon green wheels)
    this.playerMesh = new SkaterMesh(true, 0xe11d48, 0x1e293b);
    this.scene.add(this.playerMesh.group);

    // 5. Groups
    this.scene.add(this.roadsideObjects);
    this.scene.add(this.itemsGroup);
    this.scene.add(this.tunnelGroup);
    this.scene.add(this.trafficGroup);

    // 6. Build the 5 Exact Video Track Phases
    this.buildMultiPhaseHighway();
    this.buildMountainSlopes();
    this.buildTrafficCars();
    this.buildFallingLeaves();
    this.buildSpeedLines();
    this.buildItemsAndObstacles();
    this.buildPyrotechnicFinishArch(this.trackLength);
  }

  // Curvature: curves through mountain switchbacks
  public getRoadCenter(z: number): number {
    // S-curves and turns matching video
    return (
      Math.sin(z * 0.009) * 8 * this.curveFactor +
      Math.cos(z * 0.0035) * 14 * this.curveFactor
    );
  }

  // Downhill Slope: rolling descent with steep dips
  public getRoadHeight(z: number): number {
    return -z * 0.11 + Math.sin(z * 0.012) * 3.5;
  }

  private buildMultiPhaseHighway(): void {
    const segmentLength = 20;
    const numSegments = Math.ceil(this.trackLength / segmentLength);

    const asphaltTex = TextureGenerator.createAsphaltTexture();
    const dirtRoadTex = TextureGenerator.createDirtRoadTexture();
    const curbTex = TextureGenerator.createRedWhiteCurbTexture();
    const chevronTex = TextureGenerator.createChevronSignTexture();
    const graffitiTex = TextureGenerator.createGraffitiTunnelTexture();
    const grassTex = TextureGenerator.createGrassBankTexture();
    const yellowLeafTex = TextureGenerator.createAutumnLeavesTexture(false);
    const orangeLeafTex = TextureGenerator.createAutumnLeavesTexture(true);
    const flowerTex = TextureGenerator.createPurpleFlowerTexture();

    const asphaltMat = new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.85 });
    const dirtMat = new THREE.MeshStandardMaterial({ map: dirtRoadTex, roughness: 0.95 });
    const curbMat = new THREE.MeshStandardMaterial({ map: curbTex, roughness: 0.5 });
    const grassBankMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.9 });
    const flowerMat = new THREE.SpriteMaterial({ map: flowerTex, transparent: true });

    for (let i = 0; i < numSegments; i++) {
      const z1 = i * segmentLength;
      const z2 = (i + 1) * segmentLength;
      const x1 = this.getRoadCenter(z1);
      const x2 = this.getRoadCenter(z2);
      const y1 = this.getRoadHeight(z1);
      const y2 = this.getRoadHeight(z2);

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const midZ = (z1 + z2) / 2;

      const roadRotY = Math.atan2(x2 - x1, z2 - z1);
      const roadRotX = Math.atan2(y1 - y2, segmentLength);

      // SECTION DETERMINATION (From Video):
      // Section 1: 0 - 350m -> Autumn Forest Highway
      // Section 2: 350 - 650m -> Graffiti Underpass Tunnel
      // Section 3: 650 - 1100m -> Open Downhill Valley
      // Section 4: 1100 - 1400m -> Futuristic Glass Ring Tube
      // Section 5: 1400 - 1800m -> Off-Road Dirt Mountain Track
      const isTunnel = midZ >= 350 && midZ <= 650;
      const isGlassTube = midZ >= 1100 && midZ <= 1400;
      const isDirtTrack = midZ >= 1400;

      // 1. Road Mesh
      const roadGeo = new THREE.PlaneGeometry(this.roadWidth, segmentLength);
      roadGeo.rotateX(-Math.PI / 2);
      const activeMat = isDirtTrack ? dirtMat : asphaltMat;

      const roadMesh = new THREE.Mesh(roadGeo, activeMat);
      roadMesh.position.set(midX, midY, midZ);
      roadMesh.rotation.y = roadRotY;
      roadMesh.rotation.x = roadRotX;
      roadMesh.receiveShadow = true;
      this.scene.add(roadMesh);
      this.roadSegments.push(roadMesh);

      // 2. Red & White Curbs (matching video corners!)
      const curbGeo = new THREE.BoxGeometry(0.85, 0.25, segmentLength);
      const leftCurb = new THREE.Mesh(curbGeo, curbMat);
      leftCurb.position.set(midX - this.roadWidth / 2 - 0.4, midY + 0.12, midZ);
      leftCurb.rotation.y = roadRotY;
      leftCurb.rotation.x = roadRotX;
      this.roadsideObjects.add(leftCurb);

      const rightCurb = new THREE.Mesh(curbGeo, curbMat);
      rightCurb.position.set(midX + this.roadWidth / 2 + 0.4, midY + 0.12, midZ);
      rightCurb.rotation.y = roadRotY;
      rightCurb.rotation.x = roadRotX;
      this.roadsideObjects.add(rightCurb);

      // 3. Section 2: Graffiti Underpass Tunnel (matching video 00:03 - 00:07!)
      if (isTunnel) {
        this.buildTunnelSegment(midX, midY, midZ, segmentLength, roadRotY, roadRotX, graffitiTex);
      }
      // 4. Section 4: Glass Ring Tubular Structure (matching video 00:12 - 00:16!)
      else if (isGlassTube) {
        this.buildGlassTubeSegment(midX, midY, midZ, segmentLength, roadRotY, roadRotX);
      }
      // 5. Open Sections: Grassy banks, Autumn trees, and Wildflowers
      else {
        // Grassy Embankments
        const bankWidth = 24;
        const leftBankGeo = new THREE.PlaneGeometry(bankWidth, segmentLength);
        leftBankGeo.rotateX(-Math.PI / 2);
        leftBankGeo.rotateZ(0.25);
        const leftBank = new THREE.Mesh(leftBankGeo, grassBankMat);
        leftBank.position.set(midX - this.roadWidth / 2 - bankWidth / 2 + 1, midY + 1.2, midZ);
        leftBank.rotation.y = roadRotY;
        leftBank.rotation.x = roadRotX;
        this.roadsideObjects.add(leftBank);

        const rightBankGeo = new THREE.PlaneGeometry(bankWidth, segmentLength);
        rightBankGeo.rotateX(-Math.PI / 2);
        rightBankGeo.rotateZ(-0.25);
        const rightBank = new THREE.Mesh(rightBankGeo, grassBankMat);
        rightBank.position.set(midX + this.roadWidth / 2 + bankWidth / 2 - 1, midY + 1.2, midZ);
        rightBank.rotation.y = roadRotY;
        rightBank.rotation.x = roadRotX;
        this.roadsideObjects.add(rightBank);

        // Autumn Canopy Trees (Yellow and Orange)
        this.spawnAutumnTree(
          midX - this.roadWidth / 2 - 3 - Math.random() * 2,
          midY,
          midZ,
          i % 2 === 0 ? orangeLeafTex : yellowLeafTex,
          true
        );
        this.spawnAutumnTree(
          midX + this.roadWidth / 2 + 3 + Math.random() * 2,
          midY,
          midZ,
          (i + 1) % 2 === 0 ? orangeLeafTex : yellowLeafTex,
          false
        );

        // Yellow Curve Warning Chevron Signs on Corners (matching video: ❯ ❯ ❯)
        if (i % 6 === 0) {
          this.spawnChevronSign(midX - this.roadWidth / 2 - 1.6, midY + 1.5, midZ, chevronTex);
        }

        // Purple Wildflowers (matching video!)
        if (i % 3 === 0) {
          const flowerSprite = new THREE.Sprite(flowerMat);
          flowerSprite.scale.set(1.4, 1.4, 1.4);
          flowerSprite.position.set(
            midX - this.roadWidth / 2 - 1.2 - Math.random(),
            midY + 0.6,
            midZ + Math.random() * 5
          );
          this.roadsideObjects.add(flowerSprite);
        }
      }
    }
  }

  // Section 2: Graffiti Underpass Tunnel
  private buildTunnelSegment(
    cx: number,
    cy: number,
    cz: number,
    len: number,
    ry: number,
    rx: number,
    graffitiTex: THREE.CanvasTexture
  ): void {
    const tunnelGroup = new THREE.Group();

    // Arch Ceiling
    const tunnelMat = new THREE.MeshStandardMaterial({
      map: graffitiTex,
      roughness: 0.9,
      side: THREE.BackSide,
    });

    const tunnelGeo = new THREE.CylinderGeometry(
      this.roadWidth / 2 + 0.8,
      this.roadWidth / 2 + 0.8,
      len,
      16,
      1,
      true,
      0,
      Math.PI
    );
    tunnelGeo.rotateZ(Math.PI / 2);
    tunnelGeo.rotateY(Math.PI / 2);

    const archMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
    archMesh.position.y = 1.2;
    tunnelGroup.add(archMesh);

    // Overhead Yellow Tunnel Lights
    const lightGeo = new THREE.BoxGeometry(0.3, 0.2, 4);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    const lamp = new THREE.Mesh(lightGeo, lightMat);
    lamp.position.set(0, 5.2, 0);
    tunnelGroup.add(lamp);

    tunnelGroup.position.set(cx, cy, cz);
    tunnelGroup.rotation.y = ry;
    tunnelGroup.rotation.x = rx;
    this.tunnelGroup.add(tunnelGroup);
  }

  // Section 4: Futuristic Glass Ring Tube
  private buildGlassTubeSegment(
    cx: number,
    cy: number,
    cz: number,
    len: number,
    ry: number,
    rx: number
  ): void {
    const tubeGroup = new THREE.Group();

    // Steel circular rings
    const ringGeo = new THREE.TorusGeometry(this.roadWidth / 2 + 0.5, 0.25, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });

    for (let r = -len / 2; r <= len / 2; r += 5) {
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, 2.5, r);
      ring.rotation.x = Math.PI / 2;
      tubeGroup.add(ring);
    }

    // Glass cylinder
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      roughness: 0.1,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const glassGeo = new THREE.CylinderGeometry(
      this.roadWidth / 2 + 0.4,
      this.roadWidth / 2 + 0.4,
      len,
      16,
      1,
      true
    );
    glassGeo.rotateX(Math.PI / 2);
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.y = 2.5;
    tubeGroup.add(glassMesh);

    tubeGroup.position.set(cx, cy, cz);
    tubeGroup.rotation.y = ry;
    tubeGroup.rotation.x = rx;
    this.tunnelGroup.add(tubeGroup);
  }

  private spawnAutumnTree(
    x: number,
    y: number,
    z: number,
    leafTex: THREE.CanvasTexture,
    isLeft: boolean
  ): void {
    const treeGroup = new THREE.Group();

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2e2015, roughness: 0.9 });
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.65, 6, 7);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 3;
    trunk.rotation.z = isLeft ? -0.15 : 0.15;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const leafMat = new THREE.MeshStandardMaterial({
      map: leafTex,
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.8,
    });

    const canopySize = 9 + Math.random() * 3;
    const planeGeo = new THREE.PlaneGeometry(canopySize, canopySize);

    for (let p = 0; p < 4; p++) {
      const leafMesh = new THREE.Mesh(planeGeo, leafMat);
      leafMesh.position.set(
        (Math.random() - 0.5) * 1.5,
        6 + (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5
      );
      leafMesh.rotation.y = (p / 4) * Math.PI + (Math.random() - 0.5) * 0.3;
      treeGroup.add(leafMesh);
    }

    treeGroup.position.set(x, y, z);
    const scale = 0.95 + Math.random() * 0.35;
    treeGroup.scale.set(scale, scale, scale);
    this.roadsideObjects.add(treeGroup);
  }

  private spawnChevronSign(x: number, y: number, z: number, tex: THREE.CanvasTexture): void {
    const signGroup = new THREE.Group();
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.8 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.25;
    signGroup.add(pole);

    const boardGeo = new THREE.PlaneGeometry(1.4, 1.4);
    const boardMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0, 2.0, 0);
    signGroup.add(board);

    signGroup.position.set(x, y, z);
    this.roadsideObjects.add(signGroup);
  }

  // Build Traffic Vehicles (matching Red Sports Car and Blue Truck from video!)
  private buildTrafficCars(): void {
    // Car 1: Red Sports Car at z=750 (Video Section 3)
    this.spawnCar(1, 'sport', 0xdc2626, -2.5, 750, 48);

    // Car 2: Blue Utility Truck at z=1550 (Video Section 5)
    this.spawnCar(2, 'truck', 0x2563eb, 2.2, 1550, 42);
  }

  private spawnCar(
    id: number,
    model: 'sport' | 'truck',
    colorHex: number,
    laneX: number,
    startZ: number,
    speed: number
  ): void {
    const carGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.6, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.1, metalness: 0.9 });
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red tail lights

    if (model === 'sport') {
      // Sleek Red Sports Car
      const bodyGeo = new THREE.BoxGeometry(2.1, 0.75, 4.4);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.55;
      body.castShadow = true;
      carGroup.add(body);

      const cabinGeo = new THREE.BoxGeometry(1.7, 0.6, 2.2);
      const cabin = new THREE.Mesh(cabinGeo, glassMat);
      cabin.position.set(0, 1.1, -0.3);
      carGroup.add(cabin);

      // Tail lights
      const tailLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.05), lightMat);
      tailLeft.position.set(-0.7, 0.65, -2.21);
      carGroup.add(tailLeft);
      const tailRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.05), lightMat);
      tailRight.position.set(0.7, 0.65, -2.21);
      carGroup.add(tailRight);
    } else {
      // Blue Cargo Truck
      const cabGeo = new THREE.BoxGeometry(2.3, 1.6, 2.2);
      const cab = new THREE.Mesh(cabGeo, bodyMat);
      cab.position.set(0, 1.1, 1.2);
      carGroup.add(cab);

      const cargoGeo = new THREE.BoxGeometry(2.4, 1.8, 3.6);
      const cargoMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
      const cargo = new THREE.Mesh(cargoGeo, cargoMat);
      cargo.position.set(0, 1.3, -1.2);
      cargo.castShadow = true;
      carGroup.add(cargo);
    }

    const rx = this.getRoadCenter(startZ);
    const ry = this.getRoadHeight(startZ);
    carGroup.position.set(rx + laneX, ry, startZ);
    this.trafficGroup.add(carGroup);

    this.trafficVehicles.push({
      id,
      model,
      color: colorHex,
      x: laneX,
      z: startZ,
      speed,
      width: 2.4,
      length: 4.6,
      hasNearMissed: false,
    });
    this.trafficMeshes.set(id, carGroup);
  }

  private buildMountainSlopes(): void {
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x4d6b38,
      roughness: 0.95,
      flatShading: true,
    });

    for (let k = 0; k < 16; k++) {
      const peakGeo = new THREE.ConeGeometry(70 + Math.random() * 40, 110 + Math.random() * 60, 6);
      const peak = new THREE.Mesh(peakGeo, mountainMat);
      const side = k % 2 === 0 ? -1 : 1;
      peak.position.set(
        side * (85 + Math.random() * 120),
        -40 + Math.random() * 30,
        (k * this.trackLength) / 14
      );
      this.scene.add(peak);
    }
  }

  // Speed lines shooting from edges towards center (matching video 00:08 - 00:20!)
  private buildSpeedLines(): void {
    const lineCount = 40;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(lineCount * 6);

    for (let i = 0; i < lineCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x1 = side * (4 + Math.random() * 4);
      const y1 = 1 + Math.random() * 4;
      const z1 = Math.random() * 30;

      const x2 = x1 * 0.4;
      const y2 = y1 * 0.7;
      const z2 = z1 - 6 - Math.random() * 8;

      positions[i * 6] = x1;
      positions[i * 6 + 1] = y1;
      positions[i * 6 + 2] = z1;
      positions[i * 6 + 3] = x2;
      positions[i * 6 + 4] = y2;
      positions[i * 6 + 5] = z2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
    });

    this.speedLinesSystem = new THREE.LineSegments(geo, mat);
    this.scene.add(this.speedLinesSystem);
  }

  private buildFallingLeaves(): void {
    const leafCount = 120;
    const geo = new THREE.BufferGeometry();
    this.leavesPositions = new Float32Array(leafCount * 3);

    for (let i = 0; i < leafCount; i++) {
      this.leavesPositions[i * 3] = (Math.random() - 0.5) * 35;
      this.leavesPositions[i * 3 + 1] = 1 + Math.random() * 14;
      this.leavesPositions[i * 3 + 2] = Math.random() * 80;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.leavesPositions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.35,
      transparent: true,
      opacity: 0.85,
    });

    this.leavesSystem = new THREE.Points(geo, mat);
    this.scene.add(this.leavesSystem);
  }

  private buildItemsAndObstacles(): void {
    let obsId = 0;

    for (let z = 120; z < this.trackLength - 80; z += 50 + Math.random() * 30) {
      // Don't place obstacles directly in the middle of tunnels
      if ((z >= 360 && z <= 640) || (z >= 1110 && z <= 1390)) continue;

      const rx = this.getRoadCenter(z);
      const ry = this.getRoadHeight(z);
      const rand = Math.random();
      const laneOffset = (Math.random() - 0.5) * (this.roadWidth - 3);

      if (rand < 0.45) {
        // Gold Coins trail (matching video: coins right after overtaking red car!)
        for (let c = 0; c < 4; c++) {
          const coinZ = z + c * 4.5;
          const coinX = rx + laneOffset;
          const coinY = this.getRoadHeight(coinZ) + 0.85;
          this.spawnCoinMesh(coinX, coinY, coinZ, obsId++);
        }
      } else if (rand < 0.7) {
        // Neon Boost Pad
        this.spawnBoostPad(rx + laneOffset * 0.5, ry + 0.05, z, obsId++);
      } else {
        // Traffic Cones
        this.spawnTrafficCones(rx + laneOffset, ry, z, obsId++);
      }
    }
  }

  private spawnCoinMesh(x: number, y: number, z: number, id: number): void {
    const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 16);
    coinGeo.rotateZ(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0xaa7700,
      emissiveIntensity: 0.4,
    });

    const mesh = new THREE.Mesh(coinGeo, coinMat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    (mesh as unknown as { obstacleId: number }).obstacleId = id;
    this.itemsGroup.add(mesh);

    this.activeObstacles.push({
      id,
      type: 'coin',
      x,
      z,
      width: 1.0,
      height: 1.0,
      active: true,
    });
  }

  private spawnBoostPad(x: number, y: number, z: number, id: number): void {
    const padGroup = new THREE.Group();
    const padGeo = new THREE.PlaneGeometry(2.4, 4.5);
    padGeo.rotateX(-Math.PI / 2);

    const padMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.9 });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padGroup.add(padMesh);

    const chevronGeo = new THREE.ConeGeometry(0.7, 1.8, 3);
    chevronGeo.rotateX(-Math.PI / 2);
    const chevronMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const chevron = new THREE.Mesh(chevronGeo, chevronMat);
    chevron.position.y = 0.02;
    padGroup.add(chevron);

    padGroup.position.set(x, y, z);
    (padGroup as unknown as { obstacleId: number }).obstacleId = id;
    this.itemsGroup.add(padGroup);

    this.activeObstacles.push({
      id,
      type: 'boost',
      x,
      z,
      width: 2.6,
      height: 4.5,
      active: true,
    });
  }

  private spawnTrafficCones(x: number, y: number, z: number, id: number): void {
    const coneGroup = new THREE.Group();
    const coneGeo = new THREE.ConeGeometry(0.35, 1.0, 10);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

    for (let i = 0; i < 2; i++) {
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(i * 0.9 - 0.45, 0.5, 0);
      cone.castShadow = true;

      const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.22, 10), stripeMat);
      stripe.position.set(i * 0.9 - 0.45, 0.5, 0);
      coneGroup.add(cone);
      coneGroup.add(stripe);
    }

    coneGroup.position.set(x, y, z);
    (coneGroup as unknown as { obstacleId: number }).obstacleId = id;
    this.itemsGroup.add(coneGroup);

    this.activeObstacles.push({
      id,
      type: 'cone',
      x,
      z,
      width: 1.8,
      height: 1.2,
      active: true,
    });
  }

  // Exact Pyrotechnic Finish Arch with Flame Jets (matching video 00:22!)
  private buildPyrotechnicFinishArch(finishZ: number): void {
    this.finishLineMesh = new THREE.Group();

    const fx = this.getRoadCenter(finishZ);
    const fy = this.getRoadHeight(finishZ);

    // Giant truss arch
    const pillarGeo = new THREE.BoxGeometry(1.2, 9.5, 1.2);
    const archMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.2 });

    const leftPillar = new THREE.Mesh(pillarGeo, archMat);
    leftPillar.position.set(-this.roadWidth / 2 - 0.6, 4.75, 0);
    this.finishLineMesh.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, archMat);
    rightPillar.position.set(this.roadWidth / 2 + 0.6, 4.75, 0);
    this.finishLineMesh.add(rightPillar);

    // Crossbeam banner
    const beamGeo = new THREE.BoxGeometry(this.roadWidth + 2.5, 2.2, 1.4);
    const beamMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, metalness: 0.5, roughness: 0.3 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 8.5, 0);
    this.finishLineMesh.add(beam);

    // Fiery Flame Jets on Top of Finish Line (matching video 00:22!)
    const flameGeo = new THREE.ConeGeometry(0.8, 4.5, 8);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    for (let f = 0; f < 6; f++) {
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(-this.roadWidth / 2 + (f * this.roadWidth) / 5, 11, 0);
      this.finishLineMesh.add(flame);
      this.flameJets.push(flame);
    }

    this.finishLineMesh.position.set(fx, fy, finishZ);
    this.scene.add(this.finishLineMesh);
  }

  public addRivalMesh(id: string, suitColor: number, boardColor: number): void {
    const rival = new SkaterMesh(false, suitColor, boardColor);
    this.rivalMeshes.set(id, rival);
    this.scene.add(rival.group);
  }

  public updateRivals(rivals: RivalState[], dt: number): void {
    rivals.forEach((r) => {
      const mesh = this.rivalMeshes.get(r.id);
      if (!mesh) return;

      if (r.isKnockedOut) {
        mesh.group.rotation.y += dt * 15;
        mesh.group.position.x += dt * 6;
      } else {
        const roadX = this.getRoadCenter(r.z);
        const roadY = this.getRoadHeight(r.z);
        mesh.group.position.set(roadX + r.x, roadY, r.z);
        mesh.group.rotation.set(0, 0, 0);
        mesh.update(dt, r.speed, 0, false, false);
      }
    });
  }

  public updateTraffic(dt: number): void {
    this.trafficVehicles.forEach((car) => {
      car.z += ((car.speed * 1000) / 3600) * dt;
      const mesh = this.trafficMeshes.get(car.id);
      if (mesh) {
        const roadX = this.getRoadCenter(car.z);
        const roadY = this.getRoadHeight(car.z);
        mesh.position.set(roadX + car.x, roadY, car.z);

        const nextZ = car.z + 2;
        const nextX = this.getRoadCenter(nextZ);
        mesh.rotation.y = Math.atan2(nextX - roadX, 2);
      }
    });
  }

  public animateItems(dt: number, playerZ: number, playerSpeed: number): void {
    // Spin coins
    this.itemsGroup.children.forEach((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.CylinderGeometry) {
        child.rotation.y += 0.05;
      }
    });

    // Flickering Flame Jets at Finish
    this.flameJets.forEach((flame) => {
      const flicker = 0.8 + Math.random() * 0.4;
      flame.scale.set(flicker, flicker, flicker);
    });

    // Speed Lines follow camera
    if (this.speedLinesSystem) {
      const isHighSpeed = playerSpeed > 60;
      this.speedLinesSystem.visible = isHighSpeed;
      if (isHighSpeed) {
        this.speedLinesSystem.position.set(
          this.camera.position.x,
          this.camera.position.y - 1,
          this.camera.position.z + 10
        );
      }
    }

    // Falling Autumn Leaves
    if (this.leavesSystem) {
      const leafCount = this.leavesPositions.length / 3;
      for (let i = 0; i < leafCount; i++) {
        this.leavesPositions[i * 3 + 1] -= dt * 2.5;
        this.leavesPositions[i * 3] += Math.sin(Date.now() * 0.003 + i) * dt * 1.5;

        if (this.leavesPositions[i * 3 + 1] < this.getRoadHeight(playerZ) - 1) {
          this.leavesPositions[i * 3] = this.getRoadCenter(playerZ) + (Math.random() - 0.5) * 30;
          this.leavesPositions[i * 3 + 1] = this.getRoadHeight(playerZ) + 8 + Math.random() * 8;
          this.leavesPositions[i * 3 + 2] = playerZ + 15 + Math.random() * 45;
        }
      }
      this.leavesSystem.geometry.attributes.position.needsUpdate = true;
    }
  }
}
