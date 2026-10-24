import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildViceCity, CityData, CollisionBox } from './cityMap.ts';
import {
  createPlayerModel,
  PlayerRig,
  createVehicleModel,
  VehicleRig,
  createWeaponMesh,
} from './models.ts';
import {
  CharacterPhysics,
  updateCharacterPhysics,
  VehiclePhysicsState,
  updateVehiclePhysics,
} from './physics.ts';
import { TrafficAndAISystem } from './aiTraffic.ts';
import { soundEngine } from './audio.ts';
import { WEAPON_REGISTRY, RocketProjectile } from './weapons.ts';
import { STORY_MISSIONS } from './missions.ts';
import { Mission, PlayerStats, TimeOfDay, WeaponType } from './types.ts';

// Reusable vectors for zero GC in render loop
const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const _camTarget = new THREE.Vector3();

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private frameId: number = 0;
  private isDestroyed = false;
  private isSoftwareGl = false;

  // City & Environment
  private cityData!: CityData;
  private trafficAI!: TrafficAndAISystem;
  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private skyFog!: THREE.FogExp2;

  // Player & Vehicle State
  public playerRig!: PlayerRig;
  public playerPhysics!: CharacterPhysics;
  public playerVehicleRig: VehicleRig | null = null;
  public playerVehiclePhys: VehiclePhysicsState | null = null;
  public playerVehiclesList: { rig: VehicleRig; phys: VehiclePhysicsState }[] = [];

  // Active Weapon & Rockets
  public rockets: RocketProjectile[] = [];
  public particles: {
    mesh: THREE.Points;
    velocities: Float32Array;
    life: Float32Array;
    maxLife: number;
  } | null = null;

  // Mission State
  public missions: Mission[] = JSON.parse(JSON.stringify(STORY_MISSIONS));
  public activeMission: Mission | null = null;
  private missionMarkerMesh!: THREE.Group;

  // Camera Settings
  public cameraYaw: number = 0;
  public cameraPitch: number = 0.25;
  public cameraDistance: number = 4.8;
  public cameraShake: number = 0;

  // Input State
  public keys: Record<string, boolean> = {};
  public mouseLook = { active: false, deltaX: 0, deltaY: 0 };
  public isAiming: boolean = false;
  public isShooting: boolean = false;
  private lastShootTime: number = 0;

  // Time of Day
  public currentTimeOfDay: TimeOfDay = 'sunset';

  // React State Callback
  private onStatsUpdate?: (stats: PlayerStats) => void;
  private onMissionNotification?: (title: string, msg: string) => void;

  // Player Stats
  public stats: PlayerStats = {
    health: 100,
    maxHealth: 100,
    armor: 100,
    maxArmor: 100,
    cash: 1250,
    wantedLevel: 0,
    wantedProgress: 0,
    currentWeapon: 'smg',
    inVehicle: false,
    vehicleId: null,
    speedMPH: 0,
    isAiming: false,
    isReloading: false,
    isDrifting: false,
    currentDistrict: 'Ocean Drive',
  };

  constructor(
    canvas: HTMLCanvasElement,
    onStatsUpdate?: (stats: PlayerStats) => void,
    onMissionNotification?: (title: string, msg: string) => void
  ) {
    this.canvas = canvas;
    this.onStatsUpdate = onStatsUpdate;
    this.onMissionNotification = onMissionNotification;

    this.initWebGL();
    this.initLightingAndSky();
    this.initWorld();
    this.initParticles();
    this.initInputListeners();
    this.startLoop();
  }

  private initWebGL() {
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1500);

    // Procedural RoomEnvironment reflection
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }

  private initLightingAndSky() {
    this.skyFog = new THREE.FogExp2(0x501c38, 0.0035); // 80s Miami sunset purple fog
    this.scene.fog = this.skyFog;
    this.scene.background = new THREE.Color(0x38122d);

    this.hemiLight = new THREE.HemisphereLight(0xff77aa, 0x1e293b, 1.2);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffb088, 2.4);
    this.sunLight.position.set(120, 180, 240);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 600;
    const d = 160;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
  }

  public setTimeOfDay(time: TimeOfDay) {
    this.currentTimeOfDay = time;
    if (time === 'sunset') {
      this.scene.background = new THREE.Color(0x38122d);
      this.skyFog.color.setHex(0x501c38);
      this.sunLight.color.setHex(0xffb088);
      this.sunLight.intensity = 2.4;
      this.hemiLight.color.setHex(0xff77aa);
      this.hemiLight.groundColor.setHex(0x1e293b);
      this.hemiLight.intensity = 1.2;
    } else if (time === 'night') {
      this.scene.background = new THREE.Color(0x0a0c16);
      this.skyFog.color.setHex(0x0e1122);
      this.sunLight.color.setHex(0x38bdf8);
      this.sunLight.intensity = 0.6;
      this.hemiLight.color.setHex(0x6366f1);
      this.hemiLight.groundColor.setHex(0x090d16);
      this.hemiLight.intensity = 0.5;
    } else if (time === 'day') {
      this.scene.background = new THREE.Color(0x7dd3fc);
      this.skyFog.color.setHex(0xbae6fd);
      this.sunLight.color.setHex(0xffffff);
      this.sunLight.intensity = 2.8;
      this.hemiLight.color.setHex(0x38bdf8);
      this.hemiLight.groundColor.setHex(0x334155);
      this.hemiLight.intensity = 1.4;
    } else if (time === 'storm') {
      this.scene.background = new THREE.Color(0x1e293b);
      this.skyFog.color.setHex(0x334155);
      this.sunLight.color.setHex(0x94a3b8);
      this.sunLight.intensity = 1.1;
      this.hemiLight.color.setHex(0x64748b);
      this.hemiLight.groundColor.setHex(0x0f172a);
      this.hemiLight.intensity = 0.8;
    }
  }

  private initWorld() {
    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.cityData = buildViceCity(maxAnisotropy);
    this.scene.add(this.cityData.rootGroup);

    // Initialize Player Rig & Physics
    this.playerRig = createPlayerModel();
    this.playerRig.group.position.copy(this.cityData.spawnPoints.player);
    this.scene.add(this.playerRig.group);

    this.playerPhysics = {
      position: this.cityData.spawnPoints.player.clone(),
      velocity: new THREE.Vector3(),
      heading: 0,
      isGrounded: true,
      isSprinting: false,
      isAiming: false,
      radius: 0.45,
      height: 1.8,
    };

    // Spawn parked Hero Infernus Supercar
    const heroSupercar = createVehicleModel('infernus_hero', 'supercar', 0xff0055);
    heroSupercar.group.position.copy(this.cityData.spawnPoints.playerVehicle);
    this.scene.add(heroSupercar.group);

    const supercarPhys: VehiclePhysicsState = {
      position: this.cityData.spawnPoints.playerVehicle.clone(),
      velocity: new THREE.Vector3(),
      heading: 0,
      speed: 0,
      steeringAngle: 0,
      suspensionRoll: 0,
      suspensionPitch: 0,
      isDrifting: false,
      isNitroActive: false,
      health: 350,
      maxHealth: 350,
    };
    this.playerVehiclesList.push({ rig: heroSupercar, phys: supercarPhys });

    // Spawn parked Muscle Car near Starfish Island
    const muscleCar = createVehicleModel('stallion_1', 'muscle', 0x0284c7);
    muscleCar.group.position.set(40, 0.2, 0);
    this.scene.add(muscleCar.group);
    const musclePhys: VehiclePhysicsState = {
      position: new THREE.Vector3(40, 0.2, 0),
      velocity: new THREE.Vector3(),
      heading: Math.PI / 2,
      speed: 0,
      steeringAngle: 0,
      suspensionRoll: 0,
      suspensionPitch: 0,
      isDrifting: false,
      isNitroActive: false,
      health: 320,
      maxHealth: 320,
    };
    this.playerVehiclesList.push({ rig: muscleCar, phys: musclePhys });

    // Spawn parked PCJ-600 Motorbike near the Beachfront
    const bike = createVehicleModel('pcj_1', 'bike', 0x10b981);
    bike.group.position.set(134, 0.2, -80);
    this.scene.add(bike.group);
    const bikePhys: VehiclePhysicsState = {
      position: new THREE.Vector3(134, 0.2, -80),
      velocity: new THREE.Vector3(),
      heading: 0,
      speed: 0,
      steeringAngle: 0,
      suspensionRoll: 0,
      suspensionPitch: 0,
      isDrifting: false,
      isNitroActive: false,
      health: 200,
      maxHealth: 200,
    };
    this.playerVehiclesList.push({ rig: bike, phys: bikePhys });

    // Spawn Mission Marker Ring
    this.initMissionMarker();

    // Spawn AI Traffic & Pedestrians
    this.trafficAI = new TrafficAndAISystem(this.scene, this.cityData.roadSegments);
    this.trafficAI.populateTraffic(18);
    this.trafficAI.populatePedestrians(32);

    // Equip default weapon
    this.equipWeapon(this.stats.currentWeapon);
  }

  private initMissionMarker() {
    this.missionMarkerMesh = new THREE.Group();

    // Glowing vertical cylinder column
    const cylGeo = new THREE.CylinderGeometry(2.5, 2.5, 6, 24, 1, true);
    const cylMat = new THREE.MeshBasicMaterial({
      color: 0xff007f,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const cyl = new THREE.Mesh(cylGeo, cylMat);
    cyl.position.y = 3;
    this.missionMarkerMesh.add(cyl);

    // Glowing ground ring
    const ringGeo = new THREE.RingGeometry(2.2, 2.8, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.1;
    this.missionMarkerMesh.add(ring);

    this.missionMarkerMesh.position.copy(this.cityData.spawnPoints.missionStart);
    this.scene.add(this.missionMarkerMesh);
  }

  private initParticles() {
    const count = 300;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const life = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -100; // start hidden
      positions[i * 3 + 2] = 0;

      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.6;
      colors[i * 3 + 2] = 0.2;

      life[i] = 0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const mesh = new THREE.Points(geometry, material);
    mesh.frustumCulled = false;
    this.scene.add(mesh);

    this.particles = {
      mesh,
      velocities,
      life,
      maxLife: 0.8,
    };
  }

  public spawnSparks(pos: THREE.Vector3, count: number = 20, colorHex: number = 0xffa500) {
    if (!this.particles) return;
    const posAttr = this.particles.mesh.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.particles.mesh.geometry.attributes.color as THREE.BufferAttribute;
    const col = new THREE.Color(colorHex);

    let spawned = 0;
    for (let i = 0; i < this.particles.life.length && spawned < count; i++) {
      if (this.particles.life[i] <= 0) {
        posAttr.setXYZ(i, pos.x, pos.y, pos.z);
        colAttr.setXYZ(i, col.r, col.g, col.b);

        this.particles.velocities[i * 3] = (Math.random() - 0.5) * 12;
        this.particles.velocities[i * 3 + 1] = Math.random() * 8 + 3;
        this.particles.velocities[i * 3 + 2] = (Math.random() - 0.5) * 12;

        this.particles.life[i] = this.particles.maxLife;
        spawned++;
      }
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  // --- Weapons & Shooting ---
  public equipWeapon(type: WeaponType) {
    this.stats.currentWeapon = type;
    if (this.playerRig.currentWeaponMesh) {
      this.playerRig.weaponMount.remove(this.playerRig.currentWeaponMesh);
    }
    const mesh = createWeaponMesh(type);
    this.playerRig.weaponMount.add(mesh);
    this.playerRig.currentWeaponMesh = mesh;
  }

  public shootWeapon() {
    const weapon = WEAPON_REGISTRY[this.stats.currentWeapon];
    const now = performance.now() / 1000;
    if (now - this.lastShootTime < 1 / weapon.fireRate) return;
    this.lastShootTime = now;

    if (weapon.currentMag <= 0 && weapon.id !== 'fists') {
      this.reloadWeapon();
      return;
    }

    if (weapon.id !== 'fists') {
      weapon.currentMag--;
    }

    // Play Sound & Camera Kick
    if (weapon.id === 'fists') {
      soundEngine.playPunch();
      this.cameraShake = 0.04;
    } else {
      soundEngine.playGunshot(weapon.id as 'pistol' | 'smg' | 'rifle' | 'rpg');
      this.cameraShake = weapon.id === 'rpg' ? 0.35 : 0.08;
    }

    // Weapon Fire Mechanics
    if (weapon.id === 'rpg') {
      // Fire Rocket Projectile
      const startPos = this.playerRig.group.position.clone().add(new THREE.Vector3(0, 1.4, 0));
      const forward = new THREE.Vector3(
        Math.sin(this.cameraYaw),
        -Math.sin(this.cameraPitch),
        Math.cos(this.cameraYaw)
      ).normalize();

      const rocketMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff4400 })
      );
      rocketMesh.rotation.x = Math.PI / 2;
      rocketMesh.position.copy(startPos);
      this.scene.add(rocketMesh);

      this.rockets.push({
        position: startPos,
        velocity: forward.multiplyScalar(42),
        mesh: rocketMesh,
        life: 4.0,
      });
      return;
    }

    // Bullet Raycasting / Hit Detection
    const rayOrigin = this.playerRig.group.position.clone().add(new THREE.Vector3(0, 1.4, 0));
    const rayDir = new THREE.Vector3(
      Math.sin(this.cameraYaw),
      -Math.sin(this.cameraPitch),
      Math.cos(this.cameraYaw)
    ).normalize();

    // Check hit against Traffic Cars
    for (const car of this.trafficAI.trafficCars) {
      const dist = car.rig.group.position.distanceTo(rayOrigin);
      if (dist < weapon.range) {
        const toCar = new THREE.Vector3().subVectors(car.rig.group.position, rayOrigin);
        const dot = toCar.normalize().dot(rayDir);
        if (dot > 0.96) {
          // Hit car!
          car.health -= weapon.damage;
          this.spawnSparks(car.rig.group.position, 15, 0xffaa00);
          this.addCrimeHeat(25);
          break;
        }
      }
    }

    // Check hit against Pedestrians
    for (const ped of this.trafficAI.pedestrians) {
      const dist = ped.position.distanceTo(rayOrigin);
      if (dist < weapon.range && ped.health > 0) {
        const toPed = new THREE.Vector3().subVectors(ped.position, rayOrigin);
        const dot = toPed.normalize().dot(rayDir);
        if (dot > 0.97) {
          ped.health -= weapon.damage;
          ped.isPanicked = true;
          this.spawnSparks(ped.position, 8, 0xff0044);
          this.addCrimeHeat(35);
          if (ped.health <= 0) {
            this.stats.cash += 85;
            soundEngine.playCashSound();
          }
          break;
        }
      }
    }
  }

  public reloadWeapon() {
    const weapon = WEAPON_REGISTRY[this.stats.currentWeapon];
    if (weapon.id === 'fists' || weapon.currentMag >= weapon.magSize) return;

    this.stats.isReloading = true;
    setTimeout(() => {
      weapon.currentMag = weapon.magSize;
      this.stats.isReloading = false;
    }, weapon.reloadTime * 1000);
  }

  // --- Crime Heat & Wanted Level ---
  public addCrimeHeat(amount: number) {
    this.stats.wantedProgress += amount;
    if (this.stats.wantedProgress >= 100) {
      this.stats.wantedProgress = 0;
      if (this.stats.wantedLevel < 5) {
        this.stats.wantedLevel++;
        soundEngine.setSiren(true);
        // Dispatch police car to chase player
        this.trafficAI.spawnPolicePursuitCar(this.playerRig.group.position);
      }
    }
  }

  // --- Vehicle Enter / Exit ---
  public toggleVehicle() {
    if (this.stats.inVehicle) {
      // Exit Vehicle
      if (this.playerVehicleRig && this.playerVehiclePhys) {
        this.stats.inVehicle = false;
        this.stats.vehicleId = null;

        // Position player next to driver side door
        const perp = new THREE.Vector3(
          -Math.cos(this.playerVehiclePhys.heading),
          0,
          Math.sin(this.playerVehiclePhys.heading)
        ).normalize();
        this.playerPhysics.position.copy(this.playerVehiclePhys.position).add(perp.multiplyScalar(2.2));
        this.playerPhysics.velocity.set(0, 0, 0);
        this.playerRig.group.position.copy(this.playerPhysics.position);
        this.playerRig.group.visible = true;

        this.playerVehicleRig = null;
        this.playerVehiclePhys = null;
        soundEngine.updateEngine(false, 0, false);
      }
    } else {
      // Enter Nearest Vehicle within 4.5m
      let nearestVeh: { rig: VehicleRig; phys: VehiclePhysicsState } | null = null;
      let minDist = 4.5;

      // Check parked player vehicles
      for (const veh of this.playerVehiclesList) {
        const d = veh.phys.position.distanceTo(this.playerPhysics.position);
        if (d < minDist) {
          minDist = d;
          nearestVeh = veh;
        }
      }

      // Check AI traffic cars (carjacking!)
      if (!nearestVeh) {
        for (let i = 0; i < this.trafficAI.trafficCars.length; i++) {
          const tCar = this.trafficAI.trafficCars[i];
          const d = tCar.rig.group.position.distanceTo(this.playerPhysics.position);
          if (d < minDist) {
            // Hijack this car!
            minDist = d;
            const newPhys: VehiclePhysicsState = {
              position: tCar.rig.group.position.clone(),
              velocity: new THREE.Vector3(),
              heading: tCar.rig.group.rotation.y,
              speed: tCar.speed * 0.5,
              steeringAngle: 0,
              suspensionRoll: 0,
              suspensionPitch: 0,
              isDrifting: false,
              isNitroActive: false,
              health: tCar.health,
              maxHealth: 300,
            };
            this.playerVehiclesList.push({ rig: tCar.rig, phys: newPhys });
            nearestVeh = { rig: tCar.rig, phys: newPhys };
            this.trafficAI.trafficCars.splice(i, 1);
            this.addCrimeHeat(40); // Carjacking wanted heat!
            break;
          }
        }
      }

      if (nearestVeh) {
        this.playerVehicleRig = nearestVeh.rig;
        this.playerVehiclePhys = nearestVeh.phys;
        this.stats.inVehicle = true;
        this.stats.vehicleId = nearestVeh.rig.id;
        this.playerRig.group.visible = false;
        soundEngine.updateEngine(true, 0.2, true);
      }
    }
  }

  // --- Mission System ---
  public startMission(missionId: string) {
    const mission = this.missions.find((m) => m.id === missionId);
    if (!mission) return;

    this.activeMission = mission;
    mission.status = 'active';
    mission.currentCheckpoint = 0;
    soundEngine.playMissionFanfare(true);
    if (this.onMissionNotification) {
      this.onMissionNotification(mission.title, mission.description);
    }
  }

  private updateMissions(dt: number) {
    if (!this.activeMission) {
      // Check if player entered start trigger of available mission
      const playerPos = this.stats.inVehicle && this.playerVehiclePhys
        ? this.playerVehiclePhys.position
        : this.playerPhysics.position;

      const avail = this.missions.find((m) => m.status === 'available');
      if (avail) {
        this.missionMarkerMesh.visible = true;
        this.missionMarkerMesh.position.set(avail.startPos[0], avail.startPos[1], avail.startPos[2]);
        this.missionMarkerMesh.rotation.y += dt * 1.5;

        _vA.set(avail.startPos[0], avail.startPos[1], avail.startPos[2]);
        if (playerPos.distanceTo(_vA) < 5.0) {
          this.startMission(avail.id);
        }
      } else {
        this.missionMarkerMesh.visible = false;
      }
      return;
    }

    // Active Mission Progress
    const mission = this.activeMission;
    const playerPos = this.stats.inVehicle && this.playerVehiclePhys
      ? this.playerVehiclePhys.position
      : this.playerPhysics.position;

    // Check timer
    if (mission.timer !== undefined) {
      mission.timer -= dt;
      if (mission.timer <= 0) {
        // Mission Failed
        mission.status = 'failed';
        soundEngine.playMissionFanfare(false);
        if (this.onMissionNotification) {
          this.onMissionNotification('MISSION FAILED', 'Time expired! Try again.');
        }
        this.activeMission = null;
        return;
      }
    }

    // Race Checkpoints
    if (mission.checkpointList && mission.currentCheckpoint !== undefined) {
      const targetCp = mission.checkpointList[mission.currentCheckpoint];
      _vA.set(targetCp[0], targetCp[1], targetCp[2]);

      this.missionMarkerMesh.visible = true;
      this.missionMarkerMesh.position.copy(_vA);
      this.missionMarkerMesh.rotation.y += dt * 2.0;

      if (playerPos.distanceTo(_vA) < 7.0) {
        mission.currentCheckpoint++;
        soundEngine.playCashSound();
        if (mission.currentCheckpoint >= mission.checkpointList.length) {
          // Completed Mission!
          this.completeMission(mission);
        }
      }
    } else if (mission.targetPos) {
      _vA.set(mission.targetPos[0], mission.targetPos[1], mission.targetPos[2]);
      this.missionMarkerMesh.visible = true;
      this.missionMarkerMesh.position.copy(_vA);
      this.missionMarkerMesh.rotation.y += dt * 1.5;

      if (playerPos.distanceTo(_vA) < 6.5) {
        this.completeMission(mission);
      }
    }
  }

  private completeMission(mission: Mission) {
    mission.status = 'completed';
    this.stats.cash += mission.reward;
    soundEngine.playMissionFanfare(true);
    soundEngine.playCashSound();
    if (this.onMissionNotification) {
      this.onMissionNotification('MISSION PASSED!', `+ $${mission.reward.toLocaleString()} REWARD`);
    }
    this.activeMission = null;
  }

  // --- Input Listeners ---
  private initInputListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyF' || e.code === 'Enter') {
        this.toggleVehicle();
      } else if (e.code === 'KeyR') {
        this.reloadWeapon();
      } else if (e.code === 'Digit1') {
        this.equipWeapon('fists');
      } else if (e.code === 'Digit2') {
        this.equipWeapon('pistol');
      } else if (e.code === 'Digit3') {
        this.equipWeapon('smg');
      } else if (e.code === 'Digit4') {
        this.equipWeapon('rifle');
      } else if (e.code === 'Digit5') {
        this.equipWeapon('rpg');
      } else if (e.code === 'KeyQ') {
        // Toggle Radio Station
        const current = soundEngine.getRadioStation();
        const next = (current + 1) % 4;
        soundEngine.setRadioStation(next);
      } else if (e.code === 'KeyH') {
        soundEngine.playHorn();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isShooting = true;
        this.shootWeapon();
      } else if (e.button === 2) {
        this.isAiming = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.isShooting = false;
      if (e.button === 2) this.isAiming = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('mousemove', (e) => {
      if (e.buttons === 1 || e.buttons === 2 || document.pointerLockElement === this.canvas) {
        this.cameraYaw -= e.movementX * 0.0035;
        this.cameraPitch = Math.max(-0.4, Math.min(1.1, this.cameraPitch + e.movementY * 0.0035));
      }
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // --- Main 60fps Loop ---
  private startLoop() {
    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (this.isDestroyed) return;

      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent physics exploding

      this.updatePhysicsAndGameplay(dt);
      this.updateCamera(dt);
      this.updateParticles(dt);
      this.updateRockets(dt);

      this.renderer.render(this.scene, this.camera);

      // Report stats to React UI (throttled every few frames)
      if (this.onStatsUpdate && Math.random() < 0.25) {
        this.onStatsUpdate({ ...this.stats });
      }

      if (this.isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) afterDraw(tick);
    else this.frameId = requestAnimationFrame(tick);
  }

  private updatePhysicsAndGameplay(dt: number) {
    if (this.stats.inVehicle && this.playerVehicleRig && this.playerVehiclePhys) {
      // Vehicle Driving Mode
      const throttleInput = (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) -
        (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0);
      const steerInput = (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0) -
        (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0);
      const handbrakeInput = !!this.keys['Space'];
      const nitroInput = !!this.keys['ShiftLeft'] || !!this.keys['ShiftRight'];

      updateVehiclePhysics(
        this.playerVehiclePhys,
        this.playerVehicleRig,
        {
          throttle: throttleInput,
          steering: steerInput,
          handbrake: handbrakeInput,
          nitro: nitroInput,
        },
        this.cityData.collisionBoxes,
        dt,
        (impact) => {
          this.cameraShake = Math.min(0.6, impact * 0.02);
          this.spawnSparks(this.playerVehiclePhys!.position, 25, 0xffbb00);
        }
      );

      // Update engine audio
      const speedNorm = Math.abs(this.playerVehiclePhys.speed) / 50;
      soundEngine.updateEngine(true, speedNorm, throttleInput > 0);

      // Tire smoke particles during drift
      if (this.playerVehiclePhys.isDrifting) {
        this.spawnSparks(this.playerVehiclePhys.position, 6, 0xcccccc);
      }

      this.stats.speedMPH = Math.floor(Math.abs(this.playerVehiclePhys.speed) * 2.237);
      this.stats.isDrifting = this.playerVehiclePhys.isDrifting;

      // Update camera yaw to smoothly follow vehicle rear
      const vehHeading = this.playerVehiclePhys.heading;
      this.cameraYaw = THREE.MathUtils.damp(this.cameraYaw, vehHeading, 3.5, dt);

      // District detection
      this.updateDistrict(this.playerVehiclePhys.position);
    } else {
      // On-Foot Mode
      const moveX = (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) -
        (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0);
      const moveZ = (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) -
        (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0);
      const isSprinting = (this.keys['ShiftLeft'] || this.keys['ShiftRight']) && moveZ > 0;
      const isJump = !!this.keys['Space'];

      this.playerPhysics.isAiming = this.isAiming;
      if (this.isAiming) {
        this.playerPhysics.heading = this.cameraYaw;
      }

      updateCharacterPhysics(
        this.playerPhysics,
        { x: moveX, z: moveZ },
        this.cameraYaw,
        isJump,
        isSprinting,
        this.cityData.collisionBoxes,
        dt
      );

      // Sync player 3D rig
      this.playerRig.group.position.copy(this.playerPhysics.position);
      this.playerRig.group.rotation.y = this.playerPhysics.heading;

      const isMoving = Math.abs(this.playerPhysics.velocity.x) > 0.1 || Math.abs(this.playerPhysics.velocity.z) > 0.1;
      const speed = Math.sqrt(
        this.playerPhysics.velocity.x * this.playerPhysics.velocity.x +
        this.playerPhysics.velocity.z * this.playerPhysics.velocity.z
      );
      this.playerRig.updateAnimation(isMoving, isSprinting, this.isAiming, speed, dt);

      this.stats.speedMPH = Math.floor(speed * 2.237);
      this.stats.isDrifting = false;
      this.updateDistrict(this.playerPhysics.position);

      // Rapid-fire weapon hold
      if (this.isShooting && (this.stats.currentWeapon === 'smg' || this.stats.currentWeapon === 'rifle')) {
        this.shootWeapon();
      }
    }

    // Update AI Traffic & Pedestrians
    const activePlayerPos = this.stats.inVehicle && this.playerVehiclePhys
      ? this.playerVehiclePhys.position
      : this.playerPhysics.position;
    this.trafficAI.update(activePlayerPos, this.stats.wantedLevel, dt);

    // Update Missions
    this.updateMissions(dt);
  }

  private updateDistrict(pos: THREE.Vector3) {
    if (pos.x > 70) {
      this.stats.currentDistrict = 'Ocean Drive / Beach';
    } else if (pos.x > -70) {
      this.stats.currentDistrict = 'Starfish Island';
    } else if (pos.z > 190) {
      this.stats.currentDistrict = 'Viceport Docks';
    } else {
      this.stats.currentDistrict = 'Downtown Vice City';
    }
  }

  private updateCamera(dt: number) {
    const targetPos = this.stats.inVehicle && this.playerVehiclePhys
      ? this.playerVehiclePhys.position
      : this.playerPhysics.position;

    // Follow distance expands when driving at high speed
    const baseDist = this.stats.inVehicle ? 7.2 : this.isAiming ? 2.6 : 4.6;
    const speedZoom = this.stats.inVehicle && this.playerVehiclePhys
      ? (Math.abs(this.playerVehiclePhys.speed) / 50) * 2.2
      : 0;
    this.cameraDistance = THREE.MathUtils.damp(this.cameraDistance, baseDist + speedZoom, 5, dt);

    const targetHeight = this.stats.inVehicle ? 2.2 : 1.6;

    // Camera look target
    _camTarget.copy(targetPos).add(new THREE.Vector3(0, targetHeight, 0));

    // Spherical offset from yaw and pitch
    const hDist = this.cameraDistance * Math.cos(this.cameraPitch);
    const vDist = this.cameraDistance * Math.sin(this.cameraPitch);

    _camPos.x = targetPos.x - Math.sin(this.cameraYaw) * hDist;
    _camPos.y = targetPos.y + targetHeight + vDist;
    _camPos.z = targetPos.z - Math.cos(this.cameraYaw) * hDist;

    // Camera shake decay
    if (this.cameraShake > 0) {
      _camPos.x += (Math.random() - 0.5) * this.cameraShake;
      _camPos.y += (Math.random() - 0.5) * this.cameraShake;
      _camPos.z += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 1.5);
    }

    this.camera.position.copy(_camPos);
    this.camera.lookAt(_camTarget);
  }

  private updateParticles(dt: number) {
    if (!this.particles) return;
    const posAttr = this.particles.mesh.geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < this.particles.life.length; i++) {
      if (this.particles.life[i] > 0) {
        this.particles.life[i] -= dt;

        const x = posAttr.getX(i) + this.particles.velocities[i * 3] * dt;
        const y = posAttr.getY(i) + this.particles.velocities[i * 3 + 1] * dt;
        const z = posAttr.getZ(i) + this.particles.velocities[i * 3 + 2] * dt;

        this.particles.velocities[i * 3 + 1] -= 9.8 * dt; // gravity
        posAttr.setXYZ(i, x, y, z);
      } else {
        posAttr.setY(i, -100);
      }
    }
    posAttr.needsUpdate = true;
  }

  private updateRockets(dt: number) {
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const rocket = this.rockets[i];
      rocket.life -= dt;
      rocket.position.addScaledVector(rocket.velocity, dt);
      rocket.mesh.position.copy(rocket.position);

      // Check hit against ground or building
      if (rocket.position.y <= 0.5 || rocket.life <= 0) {
        this.detonateRocket(rocket.position);
        this.scene.remove(rocket.mesh);
        this.rockets.splice(i, 1);
        continue;
      }

      // Check hit against buildings
      for (const box of this.cityData.collisionBoxes) {
        if (
          rocket.position.x > box.min.x &&
          rocket.position.x < box.max.x &&
          rocket.position.z > box.min.z &&
          rocket.position.z < box.max.z &&
          rocket.position.y < box.max.y
        ) {
          this.detonateRocket(rocket.position);
          this.scene.remove(rocket.mesh);
          this.rockets.splice(i, 1);
          break;
        }
      }
    }
  }

  private detonateRocket(pos: THREE.Vector3) {
    soundEngine.playGunshot('rpg');
    this.cameraShake = 0.5;
    this.spawnSparks(pos, 50, 0xff3300);

    // Damage nearby cars & ped
    for (const car of this.trafficAI.trafficCars) {
      if (car.rig.group.position.distanceTo(pos) < 18) {
        car.health -= 350;
        this.spawnSparks(car.rig.group.position, 30, 0xff7700);
      }
    }
    for (const ped of this.trafficAI.pedestrians) {
      if (ped.position.distanceTo(pos) < 14) {
        ped.health = 0;
        ped.isPanicked = true;
      }
    }
    this.addCrimeHeat(50);
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.frameId) cancelAnimationFrame(this.frameId);
    this.trafficAI.cleanUp();
    this.renderer.dispose();
  }
}
