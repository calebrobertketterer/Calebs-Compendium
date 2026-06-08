// src/app/diep/engine/subsystems/shop/shop-npc.config.ts

export interface DiepShopNpc {
  id: string;
  name: string;
  subtitle: string;
  type: 'GENERAL' | 'WEAPONS' | 'COSMETICS' | 'ABILITIES';
  x: number;       
  y: number;       
  radius: number;
  baseColor: string;
  accentColor: string;
  
  // Real-time orientation properties
  currentAngle: number;
  targetAngle: number;
  defaultAngle: number;
  lastHeadingAngle: number; 

  // Behavior Engine Tracking
  behaviorType: 'STAND' | 'WANDER';
  vx: number;               
  vy: number;               
  wanderTargetX?: number;   
  wanderTargetY?: number;
  wanderTimer?: number;     
  wanderState?: 'IDLE' | 'MOVING_TO_STALL' | 'MOVING_AIMLESS';
  
  // NEW: Cooldown tracking to break vendor-to-vendor standoffs
  interactionTimer?: number;
  focusedNpcId?: string | null;
}

export const DIEP_SHOP_NPCS: DiepShopNpc[] = [
  {
    id: 'npc-general-vendor',
    name: 'GENERAL VENDOR',
    subtitle: 'Supplies & Items',
    type: 'GENERAL',
    x: 0.5,
    y: 0.32,
    radius: 25,
    baseColor: '#3498db',
    accentColor: '#2980b9',
    currentAngle: Math.PI / 2,
    targetAngle: Math.PI / 2,
    defaultAngle: Math.PI / 2,
    lastHeadingAngle: Math.PI / 2,
    behaviorType: 'STAND', 
    vx: 0, vy: 0,
    interactionTimer: 0,
    focusedNpcId: null
  },
  {
    id: 'npc-arms-dealer',
    name: 'ARMS DEALER',
    subtitle: 'Barrels & Firepower',
    type: 'WEAPONS',
    x: 0.20,
    y: 0.65,
    radius: 28,
    baseColor: '#e74c3c',
    accentColor: '#c0392b',
    currentAngle: 0,
    targetAngle: 0,
    defaultAngle: 0,
    lastHeadingAngle: 0,
    behaviorType: 'WANDER', 
    vx: 0, vy: 0,
    wanderTimer: 0,
    wanderState: 'IDLE',
    interactionTimer: 0,
    focusedNpcId: null
  },
  {
    id: 'npc-tailor',
    name: 'STYLIST MERCH',
    subtitle: 'Skins & Cosmetics',
    type: 'COSMETICS',
    x: 0.80,
    y: 0.65,
    radius: 22,
    baseColor: '#9b59b6',
    accentColor: '#8e44ad',
    currentAngle: Math.PI,
    targetAngle: Math.PI,
    defaultAngle: Math.PI,
    lastHeadingAngle: Math.PI,
    behaviorType: 'WANDER', 
    vx: 0, vy: 0,
    wanderTimer: 0,
    wanderState: 'IDLE',
    interactionTimer: 0,
    focusedNpcId: null
  }
];