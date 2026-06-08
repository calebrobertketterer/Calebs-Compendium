// src/app/diep/engine/subsystems/shop/shop-npc.config.ts
import { REGISTERED_SHOP_VENDORS, DiepVendorProfile } from './vendors';

export interface DiepShopNpc {
  id: string;
  name: string;
  subtitle: string;
  type: DiepVendorProfile['type'];
  
  // Real-time grid vector scalars
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  
  // Structural Look Angle Interpolations
  currentAngle: number;
  targetAngle: number;
  lastHeadingAngle: number;
  
  // Runtime AI State parameters
  behaviorType: 'WANDER' | 'STAND';
  wanderState: 'IDLE' | 'MOVING_AIMLESS' | 'MOVING_TO_STALL';
  wanderTimer: number;
  wanderTargetX?: number;
  wanderTargetY?: number;
  
  // Conversational focus constraints
  focusedNpcId: string | null;
  interactionTimer: number;
  
  // Cosmetic Style rendering cache pairs
  baseColor: string;
  accentColor: string;
}

// Automatically transform drop-in records into live runtime array objects
export const DIEP_SHOP_NPCS: DiepShopNpc[] = REGISTERED_SHOP_VENDORS.map(v => {
  // Safe default on-screen spawn boundaries (e.g., 20% to 80% of screen space)
  const fallbackX = Math.random() * 0.6 + 0.2;
  const fallbackY = Math.random() * 0.4 + 0.4;

  return {
    id: v.id,
    name: v.name,
    subtitle: v.subtitle,
    type: v.type,
    // Use configured coordinates if defined, otherwise apply automated fallbacks
    x: v.initialX !== undefined ? v.initialX : fallbackX,
    y: v.initialY !== undefined ? v.initialY : fallbackY,
    vx: 0,
    vy: 0,
    radius: 20, 
    currentAngle: 0,
    targetAngle: 0,
    lastHeadingAngle: 0,
    behaviorType: 'STAND',
    wanderState: 'IDLE',
    wanderTimer: 0,
    focusedNpcId: null,
    interactionTimer: 0,
    baseColor: '#95a5a6',
    accentColor: '#7f8c8d'
  };
});