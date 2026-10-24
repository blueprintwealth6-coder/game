import * as THREE from 'three';
import { RoadSegment } from './cityMap.ts';
import { VehicleRig, createVehicleModel, materials } from './models.ts';
import { soundEngine } from './audio.ts';

export interface TrafficCar {
  rig: VehicleRig;
  roadIndex: number;
  progress: number; // 0 to 1 along road segment
  speed: number;
  laneOffset: number; // side offset
  isPolice: boolean;
  health: number;
  isHostile: boolean;
}

export interface Pedestrian {
  group: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  walkTimer: number;
  direction: THREE.Vector3;
  isPanicked: boolean;
  health: number;
  isCop: boolean;
}

export class TrafficAndAISystem {
  public trafficCars: TrafficCar[] = [];
  public pedestrians: Pedestrian[] = [];
  private scene: THREE.Scene;
  private roadSegments: RoadSegment[];

  constructor(scene: THREE.Scene, roadSegments: RoadSegment[]) {
    this.scene = scene;
    this.roadSegments = roadSegments;
  }

  public populateTraffic(count: number = 18) {
    const carTypes: ('supercar' | 'muscle' | 'taxi' | 'bike')[] = ['muscle', 'taxi', 'supercar', 'muscle', 'taxi', 'bike'];
    const pastelColors = [0xf43f5e, 0x06b6d4, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xe2e8f0, 0x1e293b];

    for (let i = 0; i < count; i++) {
      const roadIdx = i % this.roadSegments.length;
      const road = this.roadSegments[roadIdx];
      const type = carTypes[i % carTypes.length];
      const col = pastelColors[i % pastelColors.length];

      const rig = createVehicleModel(`traffic_${i}`, type, col);
      this.scene.add(rig.group);

      const progress = Math.random();
      const laneSide = Math.random() > 0.5 ? 4.5 : -4.5;
      const pos = road.start.clone().lerp(road.end, progress);
      const perp = new THREE.Vector3(-road.direction.z, 0, road.direction.x).normalize();
      pos.add(perp.multiplyScalar(laneSide));

      rig.group.position.copy(pos);
      const angle = Math.atan2(road.direction.x, road.direction.z);
      rig.group.rotation.y = angle;

      this.trafficCars.push({
        rig,
        roadIndex: roadIdx,
        progress,
        speed: 12 + Math.random() * 8,
        laneOffset: laneSide,
        isPolice: false,
        health: 250,
        isHostile: false,
      });
    }
  }

  public populatePedestrians(count: number = 30) {
    const skinColors = [0xe0a98b, 0x8d5524, 0xc68642, 0xf1c27d];
    const clothesColors = [0xec4899, 0x06b6d4, 0xfacc15, 0x22c55e, 0xa855f7, 0xffffff];

    for (let i = 0; i < count; i++) {
      const road = this.roadSegments[i % this.roadSegments.length];
      const progress = Math.random();
      const pos = road.start.clone().lerp(road.end, progress);
      const perp = new THREE.Vector3(-road.direction.z, 0, road.direction.x).normalize();
      const side = Math.random() > 0.5 ? 1 : -1;
      pos.add(perp.multiplyScalar(side * (road.width / 2 + 2.5)));

      const group = new THREE.Group();
      group.name = `pedestrian_${i}`;

      const skinMat = new THREE.MeshStandardMaterial({
        color: skinColors[i % skinColors.length],
        roughness: 0.7,
      });
      const clothMat = new THREE.MeshStandardMaterial({
        color: clothesColors[i % clothesColors.length],
        roughness: 0.6,
      });

      // Simple composite ped
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.25), clothMat);
      torso.position.y = 0.95;
      torso.castShadow = true;
      group.add(torso);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), skinMat);
      head.position.y = 1.45;
      head.castShadow = true;
      group.add(head);

      const legs = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.65, 0.22), materials.jeans);
      legs.position.y = 0.35;
      legs.castShadow = true;
      group.add(legs);

      group.position.copy(pos);
      this.scene.add(group);

      this.pedestrians.push({
        group,
        position: pos.clone(),
        velocity: new THREE.Vector3(),
        walkTimer: Math.random() * 10,
        direction: road.direction.clone().multiplyScalar(Math.random() > 0.5 ? 1 : -1),
        isPanicked: false,
        health: 50,
        isCop: false,
      });
    }
  }

  public spawnPolicePursuitCar(nearPos: THREE.Vector3): TrafficCar {
    const id = `police_${Date.now()}`;
    const rig = createVehicleModel(id, 'police');
    this.scene.add(rig.group);

    // Spawn 80m behind or ahead on nearest road
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 60,
      0,
      (Math.random() - 0.5) * 60
    );
    rig.group.position.copy(nearPos).add(offset);
    rig.group.position.y = 0;

    const car: TrafficCar = {
      rig,
      roadIndex: 0,
      progress: 0,
      speed: 25,
      laneOffset: 0,
      isPolice: true,
      health: 350,
      isHostile: true,
    };
    this.trafficCars.push(car);
    return car;
  }

  public update(playerPos: THREE.Vector3, wantedLevel: number, dt: number) {
    // 1. Update Traffic Cars
    for (let i = this.trafficCars.length - 1; i >= 0; i--) {
      const car = this.trafficCars[i];

      if (car.health <= 0) {
        // Destroyed car
        this.scene.remove(car.rig.group);
        this.trafficCars.splice(i, 1);
        continue;
      }

      if (car.isPolice && wantedLevel > 0) {
        // Pursuit AI: Steer towards player
        const toPlayer = new THREE.Vector3().subVectors(playerPos, car.rig.group.position);
        toPlayer.y = 0;
        const dist = toPlayer.length();

        if (dist > 1.5) {
          toPlayer.normalize();
          const targetHeading = Math.atan2(toPlayer.x, toPlayer.z);
          car.rig.group.rotation.y = THREE.MathUtils.damp(car.rig.group.rotation.y, targetHeading, 4.5, dt);

          const forward = new THREE.Vector3(
            Math.sin(car.rig.group.rotation.y),
            0,
            Math.cos(car.rig.group.rotation.y)
          );
          const chaseSpeed = 22 + wantedLevel * 4;
          car.rig.group.position.addScaledVector(forward, chaseSpeed * dt);

          // Siren flash animation
          if (car.rig.sirenLights) {
            const flash = Math.sin(Date.now() * 0.015) > 0;
            (car.rig.sirenLights.red.material as THREE.MeshStandardMaterial).emissiveIntensity = flash ? 3.0 : 0.2;
            (car.rig.sirenLights.blue.material as THREE.MeshStandardMaterial).emissiveIntensity = flash ? 0.2 : 3.0;
          }
        }
      } else {
        // Regular civilian cruising AI along road segment
        const road = this.roadSegments[car.roadIndex];
        const step = (car.speed * dt) / road.length;
        car.progress += step;

        if (car.progress >= 1.0) {
          car.progress = 0;
          car.roadIndex = (car.roadIndex + 1) % this.roadSegments.length;
        }

        const basePos = road.start.clone().lerp(road.end, car.progress);
        const perp = new THREE.Vector3(-road.direction.z, 0, road.direction.x).normalize();
        basePos.add(perp.multiplyScalar(car.laneOffset));

        car.rig.group.position.copy(basePos);
        const angle = Math.atan2(road.direction.x, road.direction.z);
        car.rig.group.rotation.y = angle;

        // Wheel spin
        car.rig.wheels.forEach((w) => {
          w.rotation.x += car.speed * dt * 3;
        });
      }
    }

    // 2. Update Pedestrians
    for (let i = 0; i < this.pedestrians.length; i++) {
      const ped = this.pedestrians[i];
      if (ped.health <= 0) continue;

      const distToPlayer = ped.position.distanceTo(playerPos);
      if (distToPlayer < 7 && wantedLevel > 0) {
        ped.isPanicked = true;
      }

      if (ped.isPanicked) {
        // Run away from player
        const fleeDir = new THREE.Vector3().subVectors(ped.position, playerPos).normalize();
        fleeDir.y = 0;
        ped.position.addScaledVector(fleeDir, 5.5 * dt);
        ped.group.position.copy(ped.position);
        ped.group.rotation.y = Math.atan2(fleeDir.x, fleeDir.z);
      } else {
        // Casual stroll
        ped.position.addScaledVector(ped.direction, 1.8 * dt);
        ped.walkTimer += dt;
        if (ped.walkTimer > 8) {
          ped.walkTimer = 0;
          ped.direction.negate();
        }
        ped.group.position.copy(ped.position);
        ped.group.rotation.y = Math.atan2(ped.direction.x, ped.direction.z);
      }
    }
  }

  public cleanUp() {
    this.trafficCars.forEach((c) => this.scene.remove(c.rig.group));
    this.pedestrians.forEach((p) => this.scene.remove(p.group));
    this.trafficCars = [];
    this.pedestrians = [];
  }
}
