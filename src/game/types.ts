export type WeaponType = 'fists' | 'pistol' | 'smg' | 'rifle' | 'rpg';

export interface WeaponInfo {
  id: WeaponType;
  name: string;
  damage: number;
  fireRate: number; // shots per sec
  range: number;
  maxAmmo: number;
  currentAmmo: number;
  magSize: number;
  currentMag: number;
  reloadTime: number;
  icon: string;
}

export type VehicleClass = 'supercar' | 'muscle' | 'police' | 'bike' | 'taxi';

export interface VehicleConfig {
  type: VehicleClass;
  name: string;
  topSpeed: number;
  acceleration: number;
  braking: number;
  handling: number;
  health: number;
  color: number;
}

export interface Mission {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  reward: number;
  status: 'available' | 'active' | 'completed' | 'failed';
  startPos: [number, number, number];
  targetPos?: [number, number, number];
  checkpointList?: [number, number, number][];
  currentCheckpoint?: number;
  timer?: number; // seconds
  enemyCount?: number;
  enemiesRemaining?: number;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  cash: number;
  wantedLevel: number; // 0 to 5
  wantedProgress: number; // 0 to 100 for star escalation
  currentWeapon: WeaponType;
  inVehicle: boolean;
  vehicleId: string | null;
  speedMPH: number;
  isAiming: boolean;
  isReloading: boolean;
  isDrifting: boolean;
  currentDistrict: string;
}

export type TimeOfDay = 'day' | 'sunset' | 'night' | 'storm';

export interface GameSettings {
  radioStation: number;
  isMuted: boolean;
  volume: number;
  graphicsQuality: 'high' | 'medium';
  timeOfDay: TimeOfDay;
}
