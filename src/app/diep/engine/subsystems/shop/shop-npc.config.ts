// src/app/diep/engine/subsystems/shop/shop-npc.config.ts

export interface DiepShopNpc {
  id: string;
  name: string;
  subtitle: string;
  type: 'GENERAL' | 'WEAPONS' | 'COSMETICS' | 'ABILITIES';
  x: number;       // Canvas width scalar (0.0 to 1.0)
  y: number;       // Canvas height scalar (0.0 to 1.0)
  radius: number;
  baseColor: string;
  accentColor: string;
  
  // Real-time tracking properties for look-at physics
  currentAngle: number;
  targetAngle: number;
  defaultAngle: number;
}

export const DIEP_SHOP_NPCS: DiepShopNpc[] = [
  {
    id: 'npc-general-vendor',
    name: 'GENERAL VENDOR',
    subtitle: 'Supplies & Items',
    type: 'GENERAL',
    x: 0.5,
    y: 0.35,
    radius: 25,
    baseColor: '#3498db',
    accentColor: '#2980b9',
    currentAngle: Math.PI / 2,  // Facing down initially
    targetAngle: Math.PI / 2,
    defaultAngle: Math.PI / 2
  },
  {
    id: 'npc-arms-dealer',
    name: 'ARMS DEALER',
    subtitle: 'Barrels & Firepower',
    type: 'WEAPONS',
    x: 0.25,
    y: 0.6,
    radius: 28,
    baseColor: '#e74c3c',
    accentColor: '#c0392b',
    currentAngle: 0,            // Facing right initially
    targetAngle: 0,
    defaultAngle: 0
  },
  {
    id: 'npc-tailor',
    name: 'STYLIST MERCH',
    subtitle: 'Skins & Cosmetics',
    type: 'COSMETICS',
    x: 0.75,
    y: 0.6,
    radius: 22,
    baseColor: '#9b59b6',
    accentColor: '#8e44ad',
    currentAngle: Math.PI,      // Facing left initially
    targetAngle: Math.PI,
    defaultAngle: Math.PI
  }
];