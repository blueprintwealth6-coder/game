import * as THREE from 'three';
import {
  getRoadTexture,
  getSidewalkTexture,
  getSkyscraperFacadeTexture,
  getHotelNeonSignTexture,
  getSandTexture,
} from './textures.ts';
import { createPalmTree, createStreetLamp, createLuxuryYacht } from './models.ts';

export interface RoadSegment {
  start: THREE.Vector3;
  end: THREE.Vector3;
  width: number;
  direction: THREE.Vector3;
  length: number;
}

export interface CollisionBox {
  min: THREE.Vector3;
  max: THREE.Vector3;
  center: THREE.Vector3;
  type: 'building' | 'prop' | 'water';
}

export interface CityData {
  rootGroup: THREE.Group;
  collisionBoxes: CollisionBox[];
  roadSegments: RoadSegment[];
  waterPlane: THREE.Mesh;
  spawnPoints: {
    player: THREE.Vector3;
    playerVehicle: THREE.Vector3;
    missionStart: THREE.Vector3;
  };
}

export function buildViceCity(maxAnisotropy: number = 4): CityData {
  const root = new THREE.Group();
  root.name = 'vice_city_map';

  const collisionBoxes: CollisionBox[] = [];
  const roadSegments: RoadSegment[] = [];

  // Helper to add collision box
  const registerCollision = (
    center: THREE.Vector3,
    size: THREE.Vector3,
    type: 'building' | 'prop' | 'water' = 'building'
  ) => {
    const half = size.clone().multiplyScalar(0.5);
    collisionBoxes.push({
      center: center.clone(),
      min: center.clone().sub(half),
      max: center.clone().add(half),
      type,
    });
  };

  // 1. Base Terrain & Ground
  const groundGeo = new THREE.PlaneGeometry(1200, 1200);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.9,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -0.05;
  ground.receiveShadow = true;
  root.add(ground);

  // 2. Ocean & Waterway System (East Coast & Canal)
  const waterGeo = new THREE.PlaneGeometry(800, 1200);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7, // Tropical turquoise ocean
    metalness: 0.2,
    roughness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.85,
    ior: 1.33,
  });
  const ocean = new THREE.Mesh(waterGeo, waterMat);
  ocean.position.set(550, 0.2, 0);
  ocean.receiveShadow = true;
  root.add(ocean);

  // Ocean Beach Sand Strip (X: 170 to 300)
  const sandGeo = new THREE.PlaneGeometry(140, 1200);
  sandGeo.rotateX(-Math.PI / 2);
  const sandMat = new THREE.MeshStandardMaterial({
    map: getSandTexture(maxAnisotropy),
    roughness: 0.95,
    metalness: 0.05,
  });
  const sandStrip = new THREE.Mesh(sandGeo, sandMat);
  sandStrip.position.set(240, 0.3, 0);
  sandStrip.receiveShadow = true;
  root.add(sandStrip);

  // Marina dock with moored Luxury Yacht
  const dockGeo = new THREE.BoxGeometry(16, 0.8, 120);
  const dockMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
  const dock = new THREE.Mesh(dockGeo, dockMat);
  dock.position.set(190, 0.4, 60);
  dock.receiveShadow = true;
  root.add(dock);
  registerCollision(dock.position, new THREE.Vector3(16, 0.8, 120), 'prop');

  const yacht = createLuxuryYacht();
  yacht.position.set(206, 0.2, 60);
  yacht.rotation.y = Math.PI / 2;
  root.add(yacht);

  // 3. Road Network Construction
  const roadTex = getRoadTexture(maxAnisotropy);
  const sidewalkTex = getSidewalkTexture(maxAnisotropy);

  const createRoadStrip = (
    start: THREE.Vector3,
    end: THREE.Vector3,
    width: number = 20,
    hasSidewalk: boolean = true
  ) => {
    const dir = new THREE.Vector3().subVectors(end, start);
    const length = dir.length();
    dir.normalize();

    const roadGeo = new THREE.PlaneGeometry(width, length);
    roadGeo.rotateX(-Math.PI / 2);

    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.7,
      metalness: 0.2,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);

    const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    center.y = 0.08;
    roadMesh.position.copy(center);

    const angle = Math.atan2(dir.x, dir.z);
    roadMesh.rotation.y = angle;
    roadMesh.receiveShadow = true;
    root.add(roadMesh);

    roadSegments.push({
      start: start.clone(),
      end: end.clone(),
      width,
      direction: dir.clone(),
      length,
    });

    if (hasSidewalk) {
      const swWidth = 4;
      const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

      for (let side = -1; side <= 1; side += 2) {
        const swGeo = new THREE.BoxGeometry(swWidth, 0.22, length);
        const swMat = new THREE.MeshStandardMaterial({
          map: sidewalkTex,
          roughness: 0.85,
        });
        const swMesh = new THREE.Mesh(swGeo, swMat);
        const swPos = center
          .clone()
          .add(perp.clone().multiplyScalar(side * (width / 2 + swWidth / 2)));
        swPos.y = 0.15;
        swMesh.position.copy(swPos);
        swMesh.rotation.y = angle;
        swMesh.receiveShadow = true;
        root.add(swMesh);
      }
    }
  };

  // Main Arteries
  // 1. Ocean Drive (North-South Coastal Boulevard)
  createRoadStrip(new THREE.Vector3(140, 0, -450), new THREE.Vector3(140, 0, 450), 22);

  // 2. Washington Avenue (Parallel inner street)
  createRoadStrip(new THREE.Vector3(80, 0, -450), new THREE.Vector3(80, 0, 450), 18);

  // 3. Cross Streets on Beachside
  createRoadStrip(new THREE.Vector3(60, 0, -300), new THREE.Vector3(160, 0, -300), 16);
  createRoadStrip(new THREE.Vector3(60, 0, -150), new THREE.Vector3(160, 0, -150), 16);
  createRoadStrip(new THREE.Vector3(60, 0, 0), new THREE.Vector3(160, 0, 0), 18);
  createRoadStrip(new THREE.Vector3(60, 0, 150), new THREE.Vector3(160, 0, 150), 16);
  createRoadStrip(new THREE.Vector3(60, 0, 300), new THREE.Vector3(160, 0, 300), 16);

  // 4. Starfish Island Causeway Bridges & Roads
  createRoadStrip(new THREE.Vector3(80, 0, 0), new THREE.Vector3(-80, 0, 0), 20); // East-West Main Causeway Bridge
  createRoadStrip(new THREE.Vector3(-10, 0, -140), new THREE.Vector3(-10, 0, 140), 16); // Starfish Island Loop

  // 5. Downtown Highway & Grid
  createRoadStrip(new THREE.Vector3(-100, 0, -450), new THREE.Vector3(-100, 0, 450), 24); // Downtown Central Blvd
  createRoadStrip(new THREE.Vector3(-200, 0, -450), new THREE.Vector3(-200, 0, 450), 22); // Downtown West Ave
  createRoadStrip(new THREE.Vector3(-300, 0, -450), new THREE.Vector3(-300, 0, 450), 18); // Industrial Freeway
  createRoadStrip(new THREE.Vector3(-320, 0, -200), new THREE.Vector3(-80, 0, -200), 20); // North Downtown Cross
  createRoadStrip(new THREE.Vector3(-320, 0, 0), new THREE.Vector3(-80, 0, 0), 22); // Center Downtown Cross
  createRoadStrip(new THREE.Vector3(-320, 0, 200), new THREE.Vector3(-80, 0, 200), 20); // South Port Cross

  // 4. Ocean Drive Art Deco Hotels & Neon Strip (Between Washington Ave & Ocean Drive)
  const hotelHotspots = [
    { name: 'THE MALIBU', sub: 'NIGHTCLUB & CASINO', color: '#ff007f', z: -220, w: 28, h: 22, d: 24 },
    { name: 'OCEAN VIEW', sub: 'LUXURY ART DECO SUITES', color: '#00f0ff', z: -150, w: 26, h: 28, d: 24 },
    { name: 'FLAMINGO', sub: 'RESORT & TROPICAL CABANA', color: '#f43f5e', z: -75, w: 30, h: 24, d: 24 },
    { name: 'PINK PALMS', sub: 'VIP SKY LOUNGE', color: '#ec4899', z: 0, w: 28, h: 32, d: 24 },
    { name: 'NEON HORIZON', sub: 'CASINO HOTEL', color: '#38bdf8', z: 75, w: 28, h: 26, d: 24 },
    { name: 'CROCKETT', sub: 'WATERFRONT PENTHOUSE', color: '#a855f7', z: 150, w: 26, h: 30, d: 24 },
    { name: 'VICE SUNSET', sub: 'OCEAN BOULEVARD RESIDENCE', color: '#fb923c', z: 225, w: 32, h: 25, d: 24 },
  ];

  hotelHotspots.forEach((hotel) => {
    const hotelGroup = new THREE.Group();
    const xPos = 110;
    hotelGroup.position.set(xPos, 0, hotel.z);

    // Pastel stucco building body
    const baseColor =
      hotel.color === '#ff007f'
        ? 0xfce7f3
        : hotel.color === '#00f0ff'
        ? 0xe0f2fe
        : hotel.color === '#f43f5e'
        ? 0xffedd5
        : 0xfdf4ff;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.8,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(hotel.w, hotel.h, hotel.d), bodyMat);
    body.position.y = hotel.h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    hotelGroup.add(body);

    // Stepped Art Deco Crown / Top Fin
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.4,
      metalness: 0.3,
    });
    const crown = new THREE.Mesh(
      new THREE.BoxGeometry(hotel.w * 0.6, 4, hotel.d * 0.7),
      crownMat
    );
    crown.position.y = hotel.h + 2;
    crown.castShadow = true;
    hotelGroup.add(crown);

    // Neon Signboard facing Ocean Drive (East side)
    const signGeo = new THREE.PlaneGeometry(18, 5);
    const signMat = new THREE.MeshBasicMaterial({
      map: getHotelNeonSignTexture(hotel.name, hotel.sub, hotel.color),
      toneMapped: false,
    });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(hotel.w / 2 + 0.1, hotel.h - 5, 0);
    signMesh.rotation.y = Math.PI / 2;
    hotelGroup.add(signMesh);

    // Neon point light on sign
    const neonLight = new THREE.PointLight(new THREE.Color(hotel.color), 3, 35, 1.2);
    neonLight.position.set(hotel.w / 2 + 2, hotel.h - 5, 0);
    hotelGroup.add(neonLight);

    root.add(hotelGroup);
    registerCollision(
      new THREE.Vector3(xPos, hotel.h / 2, hotel.z),
      new THREE.Vector3(hotel.w, hotel.h, hotel.d)
    );
  });

  // 5. Starfish Island: "Diaz's / Vercetti Waterfront Mansion"
  const mansionGroup = new THREE.Group();
  const mansionPos = new THREE.Vector3(-10, 0, -40);
  mansionGroup.position.copy(mansionPos);

  // Grand pink stucco villa
  const villaMat = new THREE.MeshStandardMaterial({ color: 0xfce7f3, roughness: 0.75 });
  const villaMain = new THREE.Mesh(new THREE.BoxGeometry(45, 16, 32), villaMat);
  villaMain.position.y = 8;
  villaMain.castShadow = true;
  mansionGroup.add(villaMain);

  // Classical entrance portico & columns
  const portico = new THREE.Mesh(new THREE.BoxGeometry(18, 4, 10), villaMat);
  portico.position.set(0, 14, 18);
  mansionGroup.add(portico);

  const columnMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  for (let c = -6; c <= 6; c += 4) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 12, 16), columnMat);
    col.position.set(c, 6, 20);
    col.castShadow = true;
    mansionGroup.add(col);
  }

  // Helipad on mansion roof
  const helipad = new THREE.Mesh(
    new THREE.CylinderGeometry(8, 8, 0.2, 32),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
  );
  helipad.position.set(0, 16.1, 0);
  mansionGroup.add(helipad);

  // Circular driveway & fountain
  const fountainBase = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 5.5, 1.2, 24),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 })
  );
  fountainBase.position.set(0, 0.6, 40);
  mansionGroup.add(fountainBase);

  const fountainWater = new THREE.Mesh(
    new THREE.CylinderGeometry(4.6, 4.6, 0.2, 24),
    waterMat
  );
  fountainWater.position.set(0, 1.2, 40);
  mansionGroup.add(fountainWater);

  root.add(mansionGroup);
  registerCollision(
    new THREE.Vector3(-10, 8, -40),
    new THREE.Vector3(45, 16, 32)
  );

  // 6. Downtown Modern Mega-Skyscrapers (GTA V style high-rises)
  const skyscraperConfigs = [
    { x: -140, z: -150, w: 32, d: 32, h: 82, style: 0 },
    { x: -140, z: -80, w: 28, d: 34, h: 68, style: 1 },
    { x: -140, z: 80, w: 36, d: 30, h: 90, style: 2 },
    { x: -140, z: 160, w: 30, d: 30, h: 74, style: 0 },

    { x: -240, z: -160, w: 34, d: 34, h: 78, style: 1 },
    { x: -240, z: -80, w: 30, d: 32, h: 65, style: 2 },
    { x: -240, z: 80, w: 38, d: 36, h: 95, style: 0 }, // Vice Tower (Tallest)
    { x: -240, z: 160, w: 32, d: 30, h: 70, style: 1 },

    { x: -170, z: -320, w: 26, d: 26, h: 55, style: 0 },
    { x: -240, z: -320, w: 28, d: 30, h: 60, style: 2 },
    { x: -160, z: 280, w: 30, d: 32, h: 58, style: 1 },
  ];

  skyscraperConfigs.forEach((cfg, idx) => {
    const towerGroup = new THREE.Group();
    towerGroup.position.set(cfg.x, 0, cfg.z);

    const facadeTex = getSkyscraperFacadeTexture(cfg.style, maxAnisotropy);
    const towerMat = new THREE.MeshStandardMaterial({
      map: facadeTex,
      roughness: 0.15,
      metalness: 0.8,
    });

    const towerGeo = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);
    const towerMesh = new THREE.Mesh(towerGeo, towerMat);
    towerMesh.position.y = cfg.h / 2;
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    towerGroup.add(towerMesh);

    // Rooftop mechanical plant & antenna spire
    const roofBox = new THREE.Mesh(
      new THREE.BoxGeometry(cfg.w * 0.6, 6, cfg.d * 0.6),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
    );
    roofBox.position.y = cfg.h + 3;
    towerGroup.add(roofBox);

    // Glowing aviation beacon antenna
    const spire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.4, 18, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
    );
    spire.position.y = cfg.h + 15;
    towerGroup.add(spire);

    const beaconLight = new THREE.PointLight(0xff0044, 2, 80);
    beaconLight.position.y = cfg.h + 24;
    towerGroup.add(beaconLight);

    root.add(towerGroup);
    registerCollision(
      new THREE.Vector3(cfg.x, cfg.h / 2, cfg.z),
      new THREE.Vector3(cfg.w, cfg.h, cfg.d)
    );
  });

  // 7. Viceport Docks & Shipping Containers
  const containerColors = [0xe11d48, 0x2563eb, 0x16a34a, 0xd97706, 0x0284c7];
  for (let cz = 240; cz <= 360; cz += 30) {
    for (let cx = -340; cx <= -260; cx += 25) {
      const col = containerColors[Math.floor(Math.random() * containerColors.length)];
      const contMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.65, metalness: 0.4 });
      const stackHeight = Math.floor(1 + Math.random() * 3);

      for (let s = 0; s < stackHeight; s++) {
        const cont = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.2, 14), contMat);
        const yPos = 1.6 + s * 3.2;
        cont.position.set(cx, yPos, cz);
        cont.castShadow = true;
        cont.receiveShadow = true;
        root.add(cont);
        registerCollision(
          new THREE.Vector3(cx, yPos, cz),
          new THREE.Vector3(6.5, 3.2, 14)
        );
      }
    }
  }

  // 8. Palm Tree Groves & Streetlamps along Ocean Drive & Washington Ave
  for (let z = -420; z <= 420; z += 24) {
    // Ocean Drive Beachfront Palm Tree Line
    const palm = createPalmTree(7.5 + Math.random() * 2);
    palm.position.set(154, 0, z);
    palm.rotation.y = Math.random() * Math.PI * 2;
    root.add(palm);
    registerCollision(new THREE.Vector3(154, 3, z), new THREE.Vector3(1, 6, 1), 'prop');

    // Ocean Drive Streetlamp (West sidewalk)
    const lamp = createStreetLamp();
    lamp.position.set(128, 0, z);
    root.add(lamp);

    // Downtown Palms along sidewalk
    if (z % 48 === 0) {
      const dtPalm = createPalmTree(8);
      dtPalm.position.set(-88, 0, z);
      root.add(dtPalm);
    }
  }

  return {
    rootGroup: root,
    collisionBoxes,
    roadSegments,
    waterPlane: ocean,
    spawnPoints: {
      player: new THREE.Vector3(134, 0.2, -145), // Right in front of Ocean View Hotel
      playerVehicle: new THREE.Vector3(143, 0.2, -140), // Infernus Supercar parked curbside
      missionStart: new THREE.Vector3(134, 0.2, -215), // In front of The Malibu Club
    },
  };
}
