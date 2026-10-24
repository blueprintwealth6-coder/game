import * as THREE from 'three';
import { VehicleClass, WeaponType } from './types.ts';

// Shared PBR Material Library
export const materials = {
  skin: new THREE.MeshStandardMaterial({ color: 0xe0a98b, roughness: 0.6, metalness: 0.1 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x1f1715, roughness: 0.8 }),
  sunglasses: new THREE.MeshPhysicalMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1, clearcoat: 1.0 }),
  goldMetal: new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 }),
  hawaiianShirt: new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.7 }), // Miami cyan floral base
  shirtPattern: new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.7 }), // Pink hibiscus pattern
  jeans: new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.85 }), // Blue denim
  shoes: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),
  leatherBelt: new THREE.MeshStandardMaterial({ color: 0x271912, roughness: 0.6 }),

  // Car Materials
  carGlass: new THREE.MeshPhysicalMaterial({
    color: 0x111827,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.7,
    transparent: true,
    opacity: 0.85,
    ior: 1.5,
  }),
  carTire: new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9, metalness: 0.05 }),
  carRim: new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.25, metalness: 0.9 }),
  carChrome: new THREE.MeshStandardMaterial({ color: 0xf4f4f5, roughness: 0.1, metalness: 0.95 }),
  carHeadlight: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1.2,
    roughness: 0.1,
  }),
  carTaillight: new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  }),
  policeSirenRed: new THREE.MeshStandardMaterial({
    color: 0xff0044,
    emissive: 0xff0044,
    emissiveIntensity: 2.0,
    roughness: 0.1,
  }),
  policeSirenBlue: new THREE.MeshStandardMaterial({
    color: 0x0066ff,
    emissive: 0x0066ff,
    emissiveIntensity: 2.0,
    roughness: 0.1,
  }),

  // Prop Materials
  palmBark: new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.9 }),
  palmFrond: new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.65, side: THREE.DoubleSide }),
  streetLampPole: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.8 }),
  streetLampGlow: new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xfde047,
    emissiveIntensity: 1.8,
  }),

  // Weapons
  gunMetal: new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.35, metalness: 0.85 }),
  gunWood: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 }),
};

export interface PlayerRig {
  group: THREE.Group;
  head: THREE.Mesh;
  torso: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  weaponMount: THREE.Group;
  currentWeaponMesh: THREE.Object3D | null;
  updateAnimation: (isMoving: boolean, isSprinting: boolean, isAiming: boolean, speed: number, dt: number) => void;
}

export function createPlayerModel(): PlayerRig {
  const group = new THREE.Group();
  group.name = 'player_character';

  // Torso
  const torso = new THREE.Group();
  torso.position.y = 1.0;

  const torsoBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.28), materials.hawaiianShirt);
  torsoBody.castShadow = true;
  torsoBody.receiveShadow = true;
  torso.add(torsoBody);

  // Shirt collar details
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.3), materials.shirtPattern);
  collar.position.y = 0.32;
  torso.add(collar);

  // Belt
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.3), materials.leatherBelt);
  belt.position.y = -0.32;
  torso.add(belt);

  // Gold buckle
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.32), materials.goldMetal);
  buckle.position.set(0, -0.32, 0.01);
  torso.add(buckle);

  group.add(torso);

  // Head & Neck
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.55, 0);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), materials.skin);
  headMesh.scale.set(1, 1.15, 1);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // 80s Slick Hair
  const hairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.38), materials.hair);
  hairMesh.position.set(0, 0.12, -0.02);
  headGroup.add(hairMesh);

  // Aviator Sunglasses
  const sunglasses = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.08), materials.sunglasses);
  sunglasses.position.set(0, 0.04, 0.18);
  headGroup.add(sunglasses);

  group.add(headGroup);

  // Arms
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.35, 1.25, 0);
  const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.6, 12), materials.skin);
  leftArmMesh.position.y = -0.28;
  leftArmMesh.castShadow = true;
  leftArm.add(leftArmMesh);
  group.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.35, 1.25, 0);
  const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.6, 12), materials.skin);
  rightArmMesh.position.y = -0.28;
  rightArmMesh.castShadow = true;
  rightArm.add(rightArmMesh);

  // Weapon mount attached to right hand
  const weaponMount = new THREE.Group();
  weaponMount.position.set(0, -0.55, 0.1);
  rightArm.add(weaponMount);
  group.add(rightArm);

  // Legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16, 0.75, 0);
  const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.22), materials.jeans);
  leftLegMesh.position.y = -0.35;
  leftLegMesh.castShadow = true;
  leftLeg.add(leftLegMesh);

  // Left Shoe
  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.32), materials.shoes);
  leftShoe.position.set(0, -0.7, 0.05);
  leftLeg.add(leftShoe);
  group.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16, 0.75, 0);
  const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.22), materials.jeans);
  rightLegMesh.position.y = -0.35;
  rightLegMesh.castShadow = true;
  rightLeg.add(rightLegMesh);

  // Right Shoe
  const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.32), materials.shoes);
  rightShoe.position.set(0, -0.7, 0.05);
  rightLeg.add(rightShoe);
  group.add(rightLeg);

  // Animation cycle accumulator
  let animTime = 0;

  const updateAnimation = (isMoving: boolean, isSprinting: boolean, isAiming: boolean, speed: number, dt: number) => {
    if (isMoving) {
      const freq = isSprinting ? 14 : 9;
      animTime += dt * freq;
      const legAngle = Math.sin(animTime) * (isSprinting ? 0.75 : 0.5);

      leftLeg.rotation.x = legAngle;
      rightLeg.rotation.x = -legAngle;

      if (!isAiming) {
        leftArm.rotation.x = -legAngle * 0.8;
        rightArm.rotation.x = legAngle * 0.8;
      }
      torso.position.y = 1.0 + Math.abs(Math.sin(animTime * 2)) * 0.04;
    } else {
      // Idle breathing
      animTime += dt * 2.5;
      leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, 0, 10, dt);
      rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, 0, 10, dt);
      torso.position.y = 1.0 + Math.sin(animTime) * 0.01;

      if (!isAiming) {
        leftArm.rotation.x = THREE.MathUtils.damp(leftArm.rotation.x, 0, 10, dt);
        rightArm.rotation.x = THREE.MathUtils.damp(rightArm.rotation.x, 0, 10, dt);
      }
    }

    if (isAiming) {
      // Raise weapon arm forward
      rightArm.rotation.x = THREE.MathUtils.damp(rightArm.rotation.x, -Math.PI / 2, 15, dt);
      rightArm.rotation.y = THREE.MathUtils.damp(rightArm.rotation.y, -0.1, 15, dt);
      leftArm.rotation.x = THREE.MathUtils.damp(leftArm.rotation.x, -Math.PI / 2.3, 15, dt);
      leftArm.rotation.y = THREE.MathUtils.damp(leftArm.rotation.y, 0.4, 15, dt);
    } else {
      rightArm.rotation.y = THREE.MathUtils.damp(rightArm.rotation.y, 0, 10, dt);
      leftArm.rotation.y = THREE.MathUtils.damp(leftArm.rotation.y, 0, 10, dt);
    }
  };

  return {
    group,
    head: headMesh,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weaponMount,
    currentWeaponMesh: null,
    updateAnimation,
  };
}

// Procedural Weapons
export function createWeaponMesh(type: WeaponType): THREE.Object3D {
  const group = new THREE.Group();
  group.name = `weapon_${type}`;

  if (type === 'fists') {
    return group; // bare hands
  }

  if (type === 'pistol') {
    // 9mm Colt pistol
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.32), materials.gunMetal);
    barrel.position.z = 0.08;
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.08), materials.gunWood);
    grip.position.set(0, -0.1, -0.04);
    grip.rotation.x = -0.25;
    group.add(barrel, grip);
    group.scale.set(0.9, 0.9, 0.9);
  } else if (type === 'smg') {
    // Micro Uzi
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.45), materials.gunMetal);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.06), materials.gunMetal);
    mag.position.set(0, -0.16, 0);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.2), materials.gunMetal);
    stock.position.set(0, 0.02, -0.26);
    group.add(body, mag, stock);
  } else if (type === 'rifle') {
    // Assault Rifle
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.65), materials.gunMetal);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8), materials.gunMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, 0.45);
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.35), materials.gunWood);
    handguard.position.set(0, 0.01, 0.25);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.3), materials.gunWood);
    stock.position.set(0, -0.02, -0.42);
    const bananaMag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.1), materials.gunMetal);
    bananaMag.position.set(0, -0.18, 0.08);
    bananaMag.rotation.x = 0.2;
    group.add(receiver, barrel, handguard, stock, bananaMag);
    group.scale.set(0.85, 0.85, 0.85);
  } else if (type === 'rpg') {
    // Rocket Launcher
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 16), materials.gunMetal);
    tube.rotation.x = Math.PI / 2;
    const warhead = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.35, 12), materials.hawaiianShirt);
    warhead.rotation.x = Math.PI / 2;
    warhead.position.z = 0.7;
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.08), materials.gunWood);
    grip.position.set(0, -0.15, -0.1);
    group.add(tube, warhead, grip);
    group.scale.set(0.8, 0.8, 0.8);
  }

  return group;
}

// --- Composite High-Detail Vehicle Generator ---
export interface VehicleRig {
  id: string;
  type: VehicleClass;
  group: THREE.Group;
  wheels: THREE.Group[];
  frontWheels: THREE.Group[];
  rearTaillights: THREE.Mesh[];
  sirenLights?: { red: THREE.Mesh; blue: THREE.Mesh };
  spotlights: THREE.SpotLight[];
  speed: number; // m/s
  steeringAngle: number;
  health: number;
  maxHealth: number;
  color: number;
}

export function createVehicleModel(id: string, type: VehicleClass, customColor?: number): VehicleRig {
  const group = new THREE.Group();
  group.name = `vehicle_${id}`;

  const defaultColor =
    customColor ??
    (type === 'supercar'
      ? 0xff0055 // Neon Miami Red/Pink
      : type === 'muscle'
      ? 0x0284c7 // Deep electric blue
      : type === 'police'
      ? 0xffffff // White cruiser
      : type === 'taxi'
      ? 0xfacc15 // Kaufman Taxi yellow
      : 0x10b981); // Emerald green bike

  const carPaint = new THREE.MeshPhysicalMaterial({
    color: defaultColor,
    metalness: 0.85,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  const wheels: THREE.Group[] = [];
  const frontWheels: THREE.Group[] = [];
  const rearTaillights: THREE.Mesh[] = [];
  let sirenLights: { red: THREE.Mesh; blue: THREE.Mesh } | undefined;
  const spotlights: THREE.SpotLight[] = [];

  const createWheel = (radius: number, width: number): THREE.Group => {
    const wheelGroup = new THREE.Group();
    // Tire rubber
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 24), materials.carTire);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Rim alloy
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, width + 0.02, 12), materials.carRim);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    // Central hub cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.25, radius * 0.25, width + 0.04, 8), materials.carChrome);
    cap.rotation.z = Math.PI / 2;
    wheelGroup.add(cap);

    return wheelGroup;
  };

  if (type === 'supercar') {
    // 80s Infernus Wedge Supercar
    // 1. Lower chassis / body
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.45, 4.4), carPaint);
    lowerBody.position.y = 0.4;
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    group.add(lowerBody);

    // 2. Aerodynamic wedge front nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.2, 4), carPaint);
    nose.rotation.x = -Math.PI / 2;
    nose.rotation.y = Math.PI / 4;
    nose.scale.set(1.4, 0.35, 1.0);
    nose.position.set(0, 0.35, 2.1);
    nose.castShadow = true;
    group.add(nose);

    // 3. Cabin Greenhouse & Tinted Windshield
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 2.0), materials.carGlass);
    cabin.position.set(0, 0.85, -0.2);
    cabin.castShadow = true;
    group.add(cabin);

    // Roof plate
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.05, 1.8), carPaint);
    roof.position.set(0, 1.1, -0.2);
    group.add(roof);

    // 4. Rear GT Wing Spoiler
    const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.06, 0.4), carPaint);
    spoilerWing.position.set(0, 1.12, -2.15);
    const strutLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.15), materials.carChrome);
    strutLeft.position.set(-0.7, 0.95, -2.15);
    const strutRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.15), materials.carChrome);
    strutRight.position.set(0.7, 0.95, -2.15);
    group.add(spoilerWing, strutLeft, strutRight);

    // 5. Quad Chrome Exhausts
    for (let i = -1; i <= 1; i += 2) {
      const ex1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12), materials.carChrome);
      ex1.rotation.x = Math.PI / 2;
      ex1.position.set(i * 0.45, 0.28, -2.25);
      const ex2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12), materials.carChrome);
      ex2.rotation.x = Math.PI / 2;
      ex2.position.set(i * 0.6, 0.28, -2.25);
      group.add(ex1, ex2);
    }

    // 6. Pop-up Headlights & Taillights
    const headLeft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.06), materials.carHeadlight);
    headLeft.position.set(-0.65, 0.55, 2.05);
    const headRight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.06), materials.carHeadlight);
    headRight.position.set(0.65, 0.55, 2.05);
    group.add(headLeft, headRight);

    const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.12, 0.05), materials.carTaillight);
    tailBar.position.set(0, 0.52, -2.21);
    rearTaillights.push(tailBar);
    group.add(tailBar);

    // 4 Wheels
    const wheelRadius = 0.38;
    const wheelPositions = [
      { x: -1.02, y: wheelRadius, z: 1.35, isFront: true },
      { x: 1.02, y: wheelRadius, z: 1.35, isFront: true },
      { x: -1.05, y: wheelRadius, z: -1.35, isFront: false },
      { x: 1.05, y: wheelRadius, z: -1.35, isFront: false },
    ];

    wheelPositions.forEach((wp) => {
      const w = createWheel(wheelRadius, 0.28);
      w.position.set(wp.x, wp.y, wp.z);
      group.add(w);
      wheels.push(w);
      if (wp.isFront) frontWheels.push(w);
    });
  } else if (type === 'muscle') {
    // 80s Stallion Muscle Car
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 4.6), carPaint);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    // Hood scoop
    const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 1.1), materials.carChrome);
    scoop.position.set(0, 0.82, 1.2);
    group.add(scoop);

    // Fastback roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 2.2), carPaint);
    roof.position.set(0, 1.0, -0.4);
    group.add(roof);

    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.45, 2.0), materials.carGlass);
    glass.position.set(0, 0.98, -0.38);
    group.add(glass);

    // Chrome bumpers
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.15, 0.2), materials.carChrome);
    frontBumper.position.set(0, 0.35, 2.35);
    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.15, 0.2), materials.carChrome);
    rearBumper.position.set(0, 0.38, -2.35);
    group.add(frontBumper, rearBumper);

    // Dual round headlights
    for (let i = -1; i <= 1; i += 2) {
      const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), materials.carHeadlight);
      hl.rotation.x = Math.PI / 2;
      hl.position.set(i * 0.7, 0.55, 2.32);
      group.add(hl);
    }

    const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 0.05), materials.carTaillight);
    tailBar.position.set(0, 0.55, -2.32);
    rearTaillights.push(tailBar);
    group.add(tailBar);

    // Wheels
    const wheelRadius = 0.4;
    const wheelPositions = [
      { x: -0.98, y: wheelRadius, z: 1.4, isFront: true },
      { x: 0.98, y: wheelRadius, z: 1.4, isFront: true },
      { x: -1.02, y: wheelRadius, z: -1.35, isFront: false },
      { x: 1.02, y: wheelRadius, z: -1.35, isFront: false },
    ];
    wheelPositions.forEach((wp) => {
      const w = createWheel(wheelRadius, wp.isFront ? 0.26 : 0.32);
      w.position.set(wp.x, wp.y, wp.z);
      group.add(w);
      wheels.push(w);
      if (wp.isFront) frontWheels.push(w);
    });
  } else if (type === 'police' || type === 'taxi') {
    // Vice Cruiser / Kaufman Taxi
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.55, 4.5), carPaint);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.58, 2.3), materials.carGlass);
    cabin.position.set(0, 1.0, -0.2);
    group.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.06, 2.1), carPaint);
    roof.position.set(0, 1.3, -0.2);
    group.add(roof);

    // Front/Rear lights
    const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.05), materials.carHeadlight);
    hl1.position.set(-0.65, 0.52, 2.27);
    const hl2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.05), materials.carHeadlight);
    hl2.position.set(0.65, 0.52, 2.27);
    group.add(hl1, hl2);

    const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.05), materials.carTaillight);
    tailBar.position.set(0, 0.54, -2.26);
    rearTaillights.push(tailBar);
    group.add(tailBar);

    if (type === 'police') {
      // Siren Lightbar
      const sirenBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.2), materials.carChrome);
      sirenBase.position.set(0, 1.35, -0.2);
      const sirenRed = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.18), materials.policeSirenRed);
      sirenRed.position.set(-0.3, 1.44, -0.2);
      const sirenBlue = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.18), materials.policeSirenBlue);
      sirenBlue.position.set(0.3, 1.44, -0.2);
      group.add(sirenBase, sirenRed, sirenBlue);
      sirenLights = { red: sirenRed, blue: sirenBlue };

      // Push bumper
      const pushBumper = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 0.15), materials.carChrome);
      pushBumper.position.set(0, 0.45, 2.35);
      group.add(pushBumper);
    } else if (type === 'taxi') {
      // Rooftop Taxi Sign
      const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.16, 0.25), materials.carHeadlight);
      taxiSign.position.set(0, 1.4, -0.2);
      group.add(taxiSign);
    }

    const wheelRadius = 0.38;
    const wheelPositions = [
      { x: -0.96, y: wheelRadius, z: 1.35, isFront: true },
      { x: 0.96, y: wheelRadius, z: 1.35, isFront: true },
      { x: -0.96, y: wheelRadius, z: -1.35, isFront: false },
      { x: 0.96, y: wheelRadius, z: -1.35, isFront: false },
    ];
    wheelPositions.forEach((wp) => {
      const w = createWheel(wheelRadius, 0.25);
      w.position.set(wp.x, wp.y, wp.z);
      group.add(w);
      wheels.push(w);
      if (wp.isFront) frontWheels.push(w);
    });
  } else if (type === 'bike') {
    // PCJ-600 Motorbike
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 1.8), carPaint);
    frame.position.y = 0.55;
    group.add(frame);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.8), materials.leatherBelt);
    seat.position.set(0, 0.82, -0.2);
    group.add(seat);

    const fairing = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 8), carPaint);
    fairing.rotation.x = -Math.PI / 2;
    fairing.position.set(0, 0.8, 0.8);
    group.add(fairing);

    const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), materials.carHeadlight);
    headlight.position.set(0, 0.8, 1.15);
    group.add(headlight);

    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), materials.carChrome);
    handlebar.rotation.z = Math.PI / 2;
    handlebar.position.set(0, 0.95, 0.5);
    group.add(handlebar);

    const wheelRadius = 0.36;
    const frontW = createWheel(wheelRadius, 0.16);
    frontW.position.set(0, wheelRadius, 1.0);
    const rearW = createWheel(wheelRadius, 0.2);
    rearW.position.set(0, wheelRadius, -0.9);
    group.add(frontW, rearW);
    wheels.push(frontW, rearW);
    frontWheels.push(frontW);
  }

  // Dual Headlight Three.js SpotLights for night driving
  const spotL = new THREE.SpotLight(0xffffff, 0, 45, Math.PI / 5, 0.3, 1);
  spotL.position.set(-0.6, 0.5, 2.0);
  const targetL = new THREE.Object3D();
  targetL.position.set(-0.6, 0, 20);
  group.add(spotL, targetL);
  spotL.target = targetL;
  spotlights.push(spotL);

  const spotR = new THREE.SpotLight(0xffffff, 0, 45, Math.PI / 5, 0.3, 1);
  spotR.position.set(0.6, 0.5, 2.0);
  const targetR = new THREE.Object3D();
  targetR.position.set(0.6, 0, 20);
  group.add(spotR, targetR);
  spotR.target = targetR;
  spotlights.push(spotR);

  return {
    id,
    type,
    group,
    wheels,
    frontWheels,
    rearTaillights,
    sirenLights,
    spotlights,
    speed: 0,
    steeringAngle: 0,
    health: type === 'supercar' ? 350 : type === 'police' ? 400 : 300,
    maxHealth: type === 'supercar' ? 350 : type === 'police' ? 400 : 300,
    color: defaultColor,
  };
}

// Procedural Palm Tree
export function createPalmTree(height: number = 8): THREE.Group {
  const palm = new THREE.Group();
  palm.name = 'palm_tree';

  // Segmented Trunk
  const segments = 6;
  let currentY = 0;
  let currentLean = 0;
  for (let s = 0; s < segments; s++) {
    const segH = height / segments;
    const rBottom = 0.35 * (1 - (s / segments) * 0.3);
    const rTop = 0.35 * (1 - ((s + 1) / segments) * 0.3);
    const trunkSeg = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, segH, 8), materials.palmBark);
    trunkSeg.position.set(currentLean, currentY + segH / 2, 0);
    trunkSeg.rotation.z = 0.03 * (s + 1);
    trunkSeg.castShadow = true;
    palm.add(trunkSeg);

    currentY += segH;
    currentLean += 0.08 * (s + 1);
  }

  // Lush Palm Fronds radiating in a dome
  const frondCount = 9;
  for (let f = 0; f < frondCount; f++) {
    const angle = (f / frondCount) * Math.PI * 2;
    const frondGroup = new THREE.Group();
    frondGroup.position.set(currentLean, currentY, 0);
    frondGroup.rotation.y = angle;

    const frondMesh = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3.8, 3), materials.palmFrond);
    frondMesh.rotation.x = Math.PI / 2.5;
    frondMesh.position.set(0, -0.4, 1.8);
    frondMesh.scale.set(1, 0.15, 1);
    frondMesh.castShadow = true;
    frondGroup.add(frondMesh);

    palm.add(frondGroup);
  }

  return palm;
}

// Procedural Street Lamp with light
export function createStreetLamp(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'street_lamp';

  // Cast iron pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 5.5, 8), materials.streetLampPole);
  pole.position.y = 2.75;
  pole.castShadow = true;
  group.add(pole);

  // Arched neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 8), materials.streetLampPole);
  neck.position.set(0.45, 5.4, 0);
  neck.rotation.z = Math.PI / 3;
  group.add(neck);

  // Lantern housing
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.15, 0.35, 8), materials.streetLampGlow);
  lantern.position.set(0.9, 5.2, 0);
  group.add(lantern);

  return group;
}

// Procedural Luxury Yacht
export function createLuxuryYacht(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'luxury_yacht';

  const hullMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.2 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 }); // Teak wood

  // Main hull
  const hull = new THREE.Mesh(new THREE.BoxGeometry(6, 2.2, 22), hullMat);
  hull.position.y = 1.1;
  hull.castShadow = true;
  group.add(hull);

  // Pointed prow/bow
  const bow = new THREE.Mesh(new THREE.ConeGeometry(3, 7, 4), hullMat);
  bow.rotation.x = -Math.PI / 2;
  bow.rotation.y = Math.PI / 4;
  bow.position.set(0, 1.1, 14.5);
  bow.scale.set(1.4, 0.65, 1);
  group.add(bow);

  // Teak deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.1, 20), deckMat);
  deck.position.y = 2.25;
  group.add(deck);

  // Superstructure cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.2, 10), hullMat);
  cabin.position.set(0, 3.4, -1);
  group.add(cabin);

  const glass = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.8, 9), materials.carGlass);
  glass.position.set(0, 3.6, -1);
  group.add(glass);

  // Radar mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3, 8), materials.carChrome);
  mast.position.set(0, 5.5, -2);
  group.add(mast);

  return group;
}
