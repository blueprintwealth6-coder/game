import { WeaponInfo, WeaponType } from './types.ts';

export const WEAPON_REGISTRY: Record<WeaponType, WeaponInfo> = {
  fists: {
    id: 'fists',
    name: 'Brass Knuckles',
    damage: 35,
    fireRate: 2.2, // punches per sec
    range: 2.8,
    maxAmmo: Infinity,
    currentAmmo: Infinity,
    magSize: Infinity,
    currentMag: Infinity,
    reloadTime: 0,
    icon: '👊',
  },
  pistol: {
    id: 'pistol',
    name: 'Vice 9mm Pistol',
    damage: 42,
    fireRate: 3.5,
    range: 75,
    maxAmmo: 120,
    currentAmmo: 120,
    magSize: 15,
    currentMag: 15,
    reloadTime: 1.4,
    icon: '🔫',
  },
  smg: {
    id: 'smg',
    name: 'Micro Uzi',
    damage: 28,
    fireRate: 11, // Rapid fire
    range: 65,
    maxAmmo: 300,
    currentAmmo: 300,
    magSize: 30,
    currentMag: 30,
    reloadTime: 1.6,
    icon: '⚡',
  },
  rifle: {
    id: 'rifle',
    name: 'M4 Assault Rifle',
    damage: 65,
    fireRate: 7.5,
    range: 120,
    maxAmmo: 240,
    currentAmmo: 240,
    magSize: 30,
    currentMag: 30,
    reloadTime: 2.0,
    icon: '🎯',
  },
  rpg: {
    id: 'rpg',
    name: 'RPG-7 Rocket',
    damage: 350,
    fireRate: 0.8,
    range: 160,
    maxAmmo: 12,
    currentAmmo: 12,
    magSize: 1,
    currentMag: 1,
    reloadTime: 2.6,
    icon: '💥',
  },
};

export interface RocketProjectile {
  position: import('three').Vector3;
  velocity: import('three').Vector3;
  mesh: import('three').Object3D;
  life: number;
}
