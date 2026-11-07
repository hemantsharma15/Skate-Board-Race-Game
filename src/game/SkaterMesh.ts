import * as THREE from 'three';

export class SkaterMesh {
  public group: THREE.Group;
  public boardGroup: THREE.Group;
  public bodyGroup: THREE.Group;
  public wheels: THREE.Mesh[] = [];

  // Limbs for dynamic animation
  private leftLegGroup!: THREE.Group;
  private rightLegGroup!: THREE.Group;
  private leftArm!: THREE.Mesh;
  private rightArm!: THREE.Mesh;
  private headGroup!: THREE.Group;

  // Particle sparks for drifting
  private sparksParticleSystem!: THREE.Points;
  private sparksGeometry!: THREE.BufferGeometry;
  private sparksPositions!: Float32Array;
  private sparksVelocities!: Float32Array;
  private sparksAlphas!: Float32Array;
  private activeSparks = 0;

  constructor(isPlayer = true, jacketColorHex = 0xe11d48, boardColorHex = 0x1e293b) {
    this.group = new THREE.Group();
    this.boardGroup = new THREE.Group();
    this.bodyGroup = new THREE.Group();

    this.buildLongboard(boardColorHex);
    this.buildExactCharacter(jacketColorHex, isPlayer);
    this.buildDriftSparks();

    this.group.add(this.boardGroup);
    this.group.add(this.bodyGroup);
  }

  private buildLongboard(woodColorHex: number): void {
    // 1. Sleek High-Performance Deck with Custom Grip Tape
    const deckGeo = new THREE.BoxGeometry(0.72, 0.06, 2.2);

    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.95,
      metalness: 0.05,
    });

    const woodMat = new THREE.MeshStandardMaterial({
      color: woodColorHex,
      roughness: 0.45,
      metalness: 0.1,
    });

    const deckMesh = new THREE.Mesh(deckGeo, [
      woodMat, woodMat, // left / right sides
      gripMat,          // top (grip tape)
      woodMat,          // bottom
      woodMat, woodMat, // front / back
    ]);
    deckMesh.position.y = 0.22;
    deckMesh.castShadow = true;
    this.boardGroup.add(deckMesh);

    // Neon cyan center racing stripe on grip tape
    const stripeGeo = new THREE.PlaneGeometry(0.08, 2.15);
    stripeGeo.rotateX(-Math.PI / 2);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
    stripeMesh.position.y = 0.252;
    this.boardGroup.add(stripeMesh);

    // 2. Heavy-Duty Metal Trucks
    const truckMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
    const frontTruck = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.1), truckMat);
    frontTruck.position.set(0, 0.14, 0.65);
    this.boardGroup.add(frontTruck);

    const backTruck = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.1), truckMat);
    backTruck.position.set(0, 0.14, -0.65);
    this.boardGroup.add(backTruck);

    // 3. Four Emerald Neon Urethane Downhill Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.12, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.35, metalness: 0.2 });

    const wheelOffsets = [
      [-0.42, 0.12, 0.65],
      [0.42, 0.12, 0.65],
      [-0.42, 0.12, -0.65],
      [0.42, 0.12, -0.65],
    ];

    wheelOffsets.forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(x, y, z);
      wheel.castShadow = true;
      this.boardGroup.add(wheel);
      this.wheels.push(wheel);
    });
  }

  private buildExactCharacter(jacketColorHex: number, isPlayer: boolean): void {
    // Exact materials matching user screenshot:
    // - Sky-blue puffer jacket (#38bdf8)
    // - Black shorts (#18181b) with purple stripe (#9333ea)
    // - Purple shoes (#8b5cf6) with white sole
    // - Lime-green hair (#b4e600)
    // - Skin tone (#fbcfe8 / #fcd34d skin blend)

    const jacketMat = new THREE.MeshStandardMaterial({
      color: jacketColorHex,
      roughness: 0.45,
      metalness: 0.1,
    });

    const shortsMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.8,
    });

    const purpleStripeMat = new THREE.MeshStandardMaterial({
      color: isPlayer ? 0xe11d48 : 0xa855f7,
      roughness: 0.4,
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf5caa6,
      roughness: 0.75,
    });

    const shoePurpleMat = new THREE.MeshStandardMaterial({
      color: isPlayer ? 0x27272a : 0x8b5cf6,
      roughness: 0.5,
    });

    const shoeWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: isPlayer ? 0x18181b : 0xb4e600, // Black beanie / hair for player
      roughness: 0.35,
    });

    const strapMat = new THREE.MeshStandardMaterial({
      color: 0x09090b, // Black cross-body strap
      roughness: 0.9,
    });

    // --- LEGS & SHOES (Standing on Longboard) ---
    // Right Foot (Front foot, angled slightly forward)
    this.rightLegGroup = new THREE.Group();

    // Purple Sneaker with White Sole
    const soleGeo = new THREE.BoxGeometry(0.22, 0.08, 0.46);
    const rightSole = new THREE.Mesh(soleGeo, shoeWhiteMat);
    rightSole.position.set(0.08, 0.27, -0.2);
    rightSole.rotation.y = 0.35;
    this.rightLegGroup.add(rightSole);

    const upperShoeGeo = new THREE.BoxGeometry(0.2, 0.16, 0.42);
    const rightShoe = new THREE.Mesh(upperShoeGeo, shoePurpleMat);
    rightShoe.position.set(0.08, 0.37, -0.2);
    rightShoe.rotation.y = 0.35;
    this.rightLegGroup.add(rightShoe);

    // Bare Calf / Leg
    const calfGeo = new THREE.CylinderGeometry(0.085, 0.075, 0.5, 12);
    const rightCalf = new THREE.Mesh(calfGeo, skinMat);
    rightCalf.position.set(0.08, 0.65, -0.2);
    this.rightLegGroup.add(rightCalf);

    // Left Foot (Back foot, perpendicular stance)
    this.leftLegGroup = new THREE.Group();

    const leftSole = new THREE.Mesh(soleGeo, shoeWhiteMat);
    leftSole.position.set(-0.12, 0.27, 0.35);
    leftSole.rotation.y = -0.2;
    this.leftLegGroup.add(leftSole);

    const leftShoe = new THREE.Mesh(upperShoeGeo, shoePurpleMat);
    leftShoe.position.set(-0.12, 0.37, 0.35);
    leftShoe.rotation.y = -0.2;
    this.leftLegGroup.add(leftShoe);

    const leftCalf = new THREE.Mesh(calfGeo, skinMat);
    leftCalf.position.set(-0.12, 0.65, 0.35);
    this.leftLegGroup.add(leftCalf);

    this.bodyGroup.add(this.rightLegGroup);
    this.bodyGroup.add(this.leftLegGroup);

    // --- BLACK SHORTS WITH PURPLE SIDE STRIPES ---
    const shortsGeo = new THREE.BoxGeometry(0.55, 0.42, 0.38);
    const shorts = new THREE.Mesh(shortsGeo, shortsMat);
    shorts.position.set(0, 1.05, 0.05);
    this.bodyGroup.add(shorts);

    // Purple side stripes on shorts
    const stripeSideGeo = new THREE.BoxGeometry(0.04, 0.43, 0.12);
    const leftShortsStripe = new THREE.Mesh(stripeSideGeo, purpleStripeMat);
    leftShortsStripe.position.set(-0.28, 1.05, 0.05);
    this.bodyGroup.add(leftShortsStripe);

    const rightShortsStripe = new THREE.Mesh(stripeSideGeo, purpleStripeMat);
    rightShortsStripe.position.set(0.28, 1.05, 0.05);
    this.bodyGroup.add(rightShortsStripe);

    // --- SKY BLUE PUFFY JACKET / HOODIE ---
    // Torso Jacket Body
    const jacketGeo = new THREE.BoxGeometry(0.68, 0.72, 0.46);
    const jacket = new THREE.Mesh(jacketGeo, jacketMat);
    jacket.position.set(0, 1.55, 0.08);
    jacket.castShadow = true;
    this.bodyGroup.add(jacket);

    // Black Cross-Body Satchel Strap across the back
    const strapGeo = new THREE.BoxGeometry(0.12, 0.85, 0.48);
    const strap = new THREE.Mesh(strapGeo, strapMat);
    strap.position.set(0.05, 1.55, 0.08);
    strap.rotation.z = -0.65; // Diagonal cross strap
    this.bodyGroup.add(strap);

    // Purple Back Logo / Decal
    const logoGeo = new THREE.BoxGeometry(0.28, 0.22, 0.04);
    const logo = new THREE.Mesh(logoGeo, purpleStripeMat);
    logo.position.set(-0.02, 1.62, -0.16);
    this.bodyGroup.add(logo);

    // --- ARMS & SLEEVES ---
    const armGeo = new THREE.BoxGeometry(0.18, 0.65, 0.2);
    this.leftArm = new THREE.Mesh(armGeo, jacketMat);
    this.leftArm.position.set(-0.46, 1.45, 0.05);
    this.leftArm.rotation.z = 0.2;
    this.leftArm.rotation.x = -0.25;
    this.bodyGroup.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, jacketMat);
    this.rightArm.position.set(0.46, 1.45, 0.05);
    this.rightArm.rotation.z = -0.2;
    this.rightArm.rotation.x = -0.25;
    this.bodyGroup.add(this.rightArm);

    // Hands (Skin tone)
    const handGeo = new THREE.SphereGeometry(0.08, 10, 10);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.set(-0.48, 1.1, 0.12);
    this.bodyGroup.add(leftHand);

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.set(0.48, 1.1, 0.12);
    this.bodyGroup.add(rightHand);

    // --- HEAD & LIME-GREEN HAIR ---
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 2.05, 0.12);

    // Head base
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), skinMat);
    this.headGroup.add(headMesh);

    // Lime-Green Spiky Hair / Beanie
    const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 16), hairMat);
    hairMesh.position.set(0, 0.04, -0.02);
    hairMesh.scale.set(1.02, 1.05, 1.08);
    this.headGroup.add(hairMesh);

    this.bodyGroup.add(this.headGroup);
  }

  private buildDriftSparks(): void {
    const maxSparks = 60;
    this.sparksGeometry = new THREE.BufferGeometry();
    this.sparksPositions = new Float32Array(maxSparks * 3);
    this.sparksVelocities = new Float32Array(maxSparks * 3);
    this.sparksAlphas = new Float32Array(maxSparks);

    for (let i = 0; i < maxSparks; i++) {
      this.sparksPositions[i * 3] = 0;
      this.sparksPositions[i * 3 + 1] = -100;
      this.sparksPositions[i * 3 + 2] = 0;
      this.sparksAlphas[i] = 0;
    }

    this.sparksGeometry.setAttribute('position', new THREE.BufferAttribute(this.sparksPositions, 3));

    const sparksMat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.22,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    this.sparksParticleSystem = new THREE.Points(this.sparksGeometry, sparksMat);
    this.group.add(this.sparksParticleSystem);
  }

  public update(dt: number, speed: number, steer: number, isDrifting: boolean, isAirborne: boolean): void {
    // 1. Wheel spin
    const spinSpeed = (speed / 3.6) * dt * 10;
    for (const w of this.wheels) {
      w.rotation.x += spinSpeed;
    }

    // 2. Realistic skater balance & carve lean
    const targetRoll = steer * (isDrifting ? 0.55 : 0.35);
    this.boardGroup.rotation.z = THREE.MathUtils.lerp(this.boardGroup.rotation.z, targetRoll, dt * 14);
    this.bodyGroup.rotation.z = THREE.MathUtils.lerp(this.bodyGroup.rotation.z, targetRoll * 1.15, dt * 14);

    // Natural skater balance sway
    const sway = Math.sin(Date.now() * 0.006) * 0.03;
    this.bodyGroup.position.x = sway;

    // 3. Drifting slide glove pose
    if (isDrifting) {
      this.bodyGroup.position.y = THREE.MathUtils.lerp(this.bodyGroup.position.y, -0.12, dt * 12);
      if (steer < 0) {
        this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 1.2, dt * 12);
      } else {
        this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 1.2, dt * 12);
      }
      this.emitSparks(steer < 0 ? 0.4 : -0.4);
    } else {
      this.bodyGroup.position.y = THREE.MathUtils.lerp(this.bodyGroup.position.y, 0, dt * 8);
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, -0.25, dt * 8);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, -0.25, dt * 8);
    }

    // 4. Airborne jump pose
    if (isAirborne) {
      this.bodyGroup.rotation.x = Math.sin(Date.now() * 0.01) * 0.15;
    } else {
      this.bodyGroup.rotation.x = 0;
    }

    // 5. Update Sparks
    this.updateSparks(dt);
  }

  private emitSparks(sideX: number): void {
    const maxSparks = 60;
    for (let k = 0; k < 2; k++) {
      const idx = this.activeSparks % maxSparks;
      this.sparksPositions[idx * 3] = sideX + (Math.random() - 0.5) * 0.2;
      this.sparksPositions[idx * 3 + 1] = 0.05;
      this.sparksPositions[idx * 3 + 2] = -0.6 + (Math.random() - 0.5) * 0.3;

      this.sparksVelocities[idx * 3] = (sideX > 0 ? 1 : -1) * (1.8 + Math.random() * 2);
      this.sparksVelocities[idx * 3 + 1] = 1.0 + Math.random() * 1.5;
      this.sparksVelocities[idx * 3 + 2] = -3 - Math.random() * 4;

      this.sparksAlphas[idx] = 1.0;
      this.activeSparks++;
    }
  }

  private updateSparks(dt: number): void {
    const maxSparks = 60;
    let anyAlive = false;
    for (let i = 0; i < maxSparks; i++) {
      if (this.sparksAlphas[i] > 0) {
        anyAlive = true;
        this.sparksPositions[i * 3] += this.sparksVelocities[i * 3] * dt;
        this.sparksPositions[i * 3 + 1] += this.sparksVelocities[i * 3 + 1] * dt;
        this.sparksPositions[i * 3 + 2] += this.sparksVelocities[i * 3 + 2] * dt;

        this.sparksVelocities[i * 3 + 1] -= 9.8 * dt;
        this.sparksAlphas[i] -= dt * 3.5;
        if (this.sparksAlphas[i] <= 0) {
          this.sparksPositions[i * 3 + 1] = -100;
        }
      }
    }
    if (anyAlive) {
      this.sparksGeometry.attributes.position.needsUpdate = true;
    }
  }
}
