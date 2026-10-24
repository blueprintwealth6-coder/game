import * as THREE from 'three';
import { CollisionBox } from './cityMap.ts';
import { VehicleRig } from './models.ts';
import { soundEngine } from './audio.ts';

// Pre-allocated math helpers to ensure ZERO garbage collection in the 60fps loop
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _box = new THREE.Box3();
const _sphere = new THREE.Sphere();

export interface CharacterPhysics {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  heading: number; // yaw angle radians
  isGrounded: boolean;
  isSprinting: boolean;
  isAiming: boolean;
  radius: number;
  height: number;
}

export function updateCharacterPhysics(
  char: CharacterPhysics,
  moveInput: { x: number; z: number },
  cameraYaw: number,
  isJumpPressed: boolean,
  isSprinting: boolean,
  collisionBoxes: CollisionBox[],
  dt: number
) {
  const gravity = -24.0;
  const walkSpeed = 6.0;
  const sprintSpeed = 11.5;
  const targetSpeed = isSprinting ? sprintSpeed : walkSpeed;

  // Compute camera-relative movement direction
  _v1.set(moveInput.x, 0, moveInput.z);
  if (_v1.lengthSq() > 0.001) {
    _v1.normalize();
    _v1.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);

    const accel = char.isGrounded ? 35 : 12;
    char.velocity.x = THREE.MathUtils.damp(char.velocity.x, _v1.x * targetSpeed, accel, dt);
    char.velocity.z = THREE.MathUtils.damp(char.velocity.z, _v1.z * targetSpeed, accel, dt);

    // Turn character toward move direction if not aiming
    if (!char.isAiming) {
      const targetHeading = Math.atan2(_v1.x, _v1.z);
      char.heading = THREE.MathUtils.damp(char.heading, targetHeading, 18, dt);
    }
  } else {
    // Friction deceleration
    const friction = char.isGrounded ? 18 : 2;
    char.velocity.x = THREE.MathUtils.damp(char.velocity.x, 0, friction, dt);
    char.velocity.z = THREE.MathUtils.damp(char.velocity.z, 0, friction, dt);
  }

  // Jump
  if (isJumpPressed && char.isGrounded) {
    char.velocity.y = 8.5;
    char.isGrounded = false;
  }

  // Apply gravity
  char.velocity.y += gravity * dt;

  // Tentative next position
  const nextX = char.position.x + char.velocity.x * dt;
  const nextZ = char.position.z + char.velocity.z * dt;
  const nextY = char.position.y + char.velocity.y * dt;

  // Collision resolution against ground plane (Y = 0)
  if (nextY <= 0) {
    char.position.y = 0;
    char.velocity.y = 0;
    char.isGrounded = true;
  } else {
    char.position.y = nextY;
    char.isGrounded = false;
  }

  // Collision resolution against bounding boxes (sliding response)
  const charRad = char.radius;
  let finalX = nextX;
  let finalZ = nextZ;

  for (let i = 0; i < collisionBoxes.length; i++) {
    const box = collisionBoxes[i];
    // Check if within vertical range
    if (char.position.y > box.max.y || char.position.y + char.height < box.min.y) {
      continue;
    }

    // Resolve X axis
    if (
      finalX + charRad > box.min.x &&
      finalX - charRad < box.max.x &&
      char.position.z + charRad > box.min.z &&
      char.position.z - charRad < box.max.z
    ) {
      if (char.position.x < box.center.x) {
        finalX = box.min.x - charRad;
      } else {
        finalX = box.max.x + charRad;
      }
      char.velocity.x = 0;
    }

    // Resolve Z axis
    if (
      finalX + charRad > box.min.x &&
      finalX - charRad < box.max.x &&
      finalZ + charRad > box.min.z &&
      finalZ - charRad < box.max.z
    ) {
      if (char.position.z < box.center.z) {
        finalZ = box.min.z - charRad;
      } else {
        finalZ = box.max.z + charRad;
      }
      char.velocity.z = 0;
    }
  }

  char.position.x = finalX;
  char.position.z = finalZ;
}

// --- High-Performance Realistic Vehicle Physics ---
export interface VehiclePhysicsState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  heading: number; // yaw angle radians
  speed: number; // forward speed in m/s
  steeringAngle: number;
  suspensionRoll: number;
  suspensionPitch: number;
  isDrifting: boolean;
  isNitroActive: boolean;
  health: number;
  maxHealth: number;
}

export function updateVehiclePhysics(
  veh: VehiclePhysicsState,
  rig: VehicleRig,
  input: { throttle: number; steering: number; handbrake: boolean; nitro: boolean },
  collisionBoxes: CollisionBox[],
  dt: number,
  onCollision?: (impact: number) => void
) {
  const isSupercar = rig.type === 'supercar';
  const isBike = rig.type === 'bike';
  const isMuscle = rig.type === 'muscle';

  // Stats
  const maxForwardSpeed = isSupercar ? 52 : isBike ? 46 : isMuscle ? 42 : 38; // ~116 mph for supercar
  const maxReverseSpeed = -15;
  const accelRate = (isSupercar ? 24 : isBike ? 28 : isMuscle ? 18 : 15) * (input.nitro ? 1.6 : 1.0);
  const brakeRate = 28;
  const maxSteerAngle = isBike ? 0.6 : 0.45;

  // Steering with smooth return
  const targetSteer = -input.steering * maxSteerAngle;
  veh.steeringAngle = THREE.MathUtils.damp(veh.steeringAngle, targetSteer, 14, dt);

  // Apply steering to front wheel models
  rig.frontWheels.forEach((w) => {
    w.rotation.y = veh.steeringAngle;
  });

  // Acceleration & Braking
  if (input.throttle > 0) {
    if (veh.speed < 0) {
      veh.speed = THREE.MathUtils.damp(veh.speed, 0, brakeRate, dt);
    } else {
      const topSpd = input.nitro ? maxForwardSpeed * 1.25 : maxForwardSpeed;
      veh.speed = THREE.MathUtils.damp(veh.speed, topSpd, accelRate / topSpd * 10, dt);
    }
  } else if (input.throttle < 0) {
    if (veh.speed > 0) {
      veh.speed = THREE.MathUtils.damp(veh.speed, 0, brakeRate, dt);
    } else {
      veh.speed = THREE.MathUtils.damp(veh.speed, maxReverseSpeed, 8, dt);
    }
  } else {
    // Natural engine drag & rolling resistance
    const drag = input.handbrake ? 24 : 3.5;
    veh.speed = THREE.MathUtils.damp(veh.speed, 0, drag, dt);
  }

  // Handbrake drifting mechanics
  veh.isDrifting = input.handbrake && Math.abs(veh.speed) > 10;
  if (veh.isDrifting) {
    soundEngine.playTireSkid();
    veh.speed *= 0.985;
  }

  // Turn rate based on speed and steering angle
  const turnSpeedFactor = Math.min(1.0, Math.abs(veh.speed) / 6.0);
  const driftMultiplier = veh.isDrifting ? 1.8 : 1.0;
  const yawDelta = veh.steeringAngle * turnSpeedFactor * (veh.speed >= 0 ? 1 : -1) * 2.4 * driftMultiplier * dt;
  veh.heading += yawDelta;

  // Forward direction vector
  const forwardX = Math.sin(veh.heading);
  const forwardZ = Math.cos(veh.heading);

  // Movement velocity
  veh.velocity.x = forwardX * veh.speed;
  veh.velocity.z = forwardZ * veh.speed;

  // Wheel spinning animation
  const wheelCircumference = 2 * Math.PI * 0.38;
  const wheelRotSpeed = (veh.speed / wheelCircumference) * (Math.PI * 2) * dt;
  rig.wheels.forEach((w) => {
    w.rotation.x += wheelRotSpeed;
  });

  // Dynamic suspension body roll & pitch tilt for GTA V physical weight feel
  const targetRoll = -veh.steeringAngle * Math.min(1.0, veh.speed / 20) * (isBike ? 0.45 : 0.08);
  const targetPitch = (input.throttle > 0 ? -0.04 : input.throttle < 0 ? 0.05 : 0) * Math.min(1, Math.abs(veh.speed) / 15);
  veh.suspensionRoll = THREE.MathUtils.damp(veh.suspensionRoll, targetRoll, 10, dt);
  veh.suspensionPitch = THREE.MathUtils.damp(veh.suspensionPitch, targetPitch, 8, dt);

  // Tentative position update
  let newX = veh.position.x + veh.velocity.x * dt;
  let newZ = veh.position.z + veh.velocity.z * dt;

  // Vehicle Collision Detection against buildings & barriers
  const vehRadius = isBike ? 1.2 : 2.0;
  let hadCollision = false;

  for (let i = 0; i < collisionBoxes.length; i++) {
    const box = collisionBoxes[i];
    if (box.max.y < 0.5) continue; // ignore low ground props

    if (
      newX + vehRadius > box.min.x &&
      newX - vehRadius < box.max.x &&
      newZ + vehRadius > box.min.z &&
      newZ - vehRadius < box.max.z
    ) {
      hadCollision = true;
      const impactSpeed = Math.abs(veh.speed);

      // Bounce back
      veh.speed = -veh.speed * 0.35;
      newX = veh.position.x - forwardX * 0.5;
      newZ = veh.position.z - forwardZ * 0.5;

      // Damage vehicle health
      if (impactSpeed > 8) {
        const damage = Math.floor(impactSpeed * 3.5);
        veh.health = Math.max(0, veh.health - damage);
        soundEngine.playCarCrash(impactSpeed / 20);
        if (onCollision) onCollision(impactSpeed);
      }
      break;
    }
  }

  veh.position.x = newX;
  veh.position.z = newZ;
  veh.position.y = 0;

  // Sync Three.js group transform
  rig.group.position.copy(veh.position);
  rig.group.rotation.set(veh.suspensionPitch, veh.heading, veh.suspensionRoll);
}
