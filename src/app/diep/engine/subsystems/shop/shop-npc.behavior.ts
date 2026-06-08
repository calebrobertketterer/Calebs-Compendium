// src/app/diep/engine/subsystems/shop/shop-npc.behavior.ts
import { DIEP_SHOP_NPCS, DiepShopNpc } from './shop-npc.config';
import { REGISTERED_SHOP_VENDORS } from './vendors';

export class DiepShopNpcBehaviorEngine {
  // --- AI Tuning & Weight Adjustments ---
  private static WANDER_SPEED = 1.2;
  private static STEERING_EASE = 0.05; 
  private static SEPARATION_BUFFER = 25;
  private static SEPARATION_FORCE_WEIGHT = 0.5;
  
  private static ENGAGE_PROXIMITY = 220;    
  private static SOCIAL_PROXIMITY = 140;    
  private static TARGET_ARRIVE_RADIUS = 12; 

  private static MIN_CHAT_DURATION = 1500;
  private static MAX_CHAT_DURATION = 4000;
  private static MIN_IDLE_DURATION = 2000;
  private static MAX_IDLE_DURATION = 4500;

  private static MAP_BOUNDS = {
    minX: 0.2, maxX: 0.8,
    minY: 0.4, maxY: 0.8
  };

  // --- Type-Specific Size Configuration Bounds ---
  private static TYPE_SIZE_CONFIGS: Record<string, { MIN_RADIUS: number; MAX_RADIUS: number }> = {
    GENERAL:   { MIN_RADIUS: 20, MAX_RADIUS: 25 }, 
    COSMETICS: { MIN_RADIUS: 18, MAX_RADIUS: 23 }, 
    WEAPONS:   { MIN_RADIUS: 28, MAX_RADIUS: 34 }, 
    ABILITIES: { MIN_RADIUS: 22, MAX_RADIUS: 28 }  
  };

  // Session-based persistence caches
  private static sessionColorCache = new Map<string, { base: string; accent: string }>();
  private static sessionSizeCache = new Map<string, number>();
  private static sessionPositionCache = new Map<string, { x: number; y: number }>();

  private static COLOR_PALETTES = [
    { base: '#3498db', accent: '#2980b9' }, 
    { base: '#e74c3c', accent: '#c0392b' }, 
    { base: '#9b59b6', accent: '#8e44ad' }, 
    { base: '#2ecc71', accent: '#27ae60' }, 
    { base: '#f1c40f', accent: '#f39c12' }, 
    { base: '#e67e22', accent: '#d35400' }, 
    { base: '#1abc9c', accent: '#16a085' }  
  ];

  /**
   * Randomizes NPC traits and behaviors upon shop entrance passes
   */
  public static initializeDynamicNpcs(): void {
    for (const npc of DIEP_SHOP_NPCS) {
      // 1. Core behavior state assignments (shuffles setup on every entry pass)
      npc.behaviorType = Math.random() > 0.5 ? 'WANDER' : 'STAND';

      // 2. Persistent Session Positioning Logic
      let isFirstTimeThisSession = !this.sessionPositionCache.has(npc.id);

      if (isFirstTimeThisSession) {
        // First time opening the page this session -> find their structural home coordinate
        const profile = REGISTERED_SHOP_VENDORS.find(v => v.id === npc.id);
        
        let startupX = npc.x;
        let startupY = npc.y;

        if (profile) {
          // If the profile lacks an explicit coordinate layout, map standard random fallbacks
          startupX = profile.initialX !== undefined ? profile.initialX : (Math.random() * 0.6 + 0.2);
          startupY = profile.initialY !== undefined ? profile.initialY : (Math.random() * 0.4 + 0.4);
        }

        this.sessionPositionCache.set(npc.id, { x: startupX, y: startupY });
      }

      // Restore their exact coordinate location from the session cache
      const cachedPos = this.sessionPositionCache.get(npc.id)!;
      npc.x = cachedPos.x;
      npc.y = cachedPos.y;
      
      // FIXED: Compute default orientation angle facing your bottom-center player spawn point (0.5, 0.85)
      if (isFirstTimeThisSession) {
        const deltaX = 0.5 - npc.x;
        const deltaY = 0.85 - npc.y;
        const angleToPlayerSpawn = Math.atan2(deltaY, deltaX);
        
        npc.currentAngle = angleToPlayerSpawn;
        npc.targetAngle = angleToPlayerSpawn;
        npc.lastHeadingAngle = angleToPlayerSpawn;
      }

      // Clear momentary kinematics vectors so they don't violently jump when the engine resumes ticks
      npc.vx = 0;
      npc.vy = 0;
      npc.wanderState = 'IDLE';
      npc.wanderTimer = 0;
      npc.focusedNpcId = null;
      npc.interactionTimer = 0;

      // 3. Session Size
      if (!this.sessionSizeCache.has(npc.id)) {
        const config = this.TYPE_SIZE_CONFIGS[npc.type] || this.TYPE_SIZE_CONFIGS['ABILITIES'];
        const delta = config.MAX_RADIUS - config.MIN_RADIUS;
        const randomRadius = config.MIN_RADIUS + Math.random() * delta;
        this.sessionSizeCache.set(npc.id, Math.round(randomRadius));
      }
      npc.radius = this.sessionSizeCache.get(npc.id)!;

      // 4. Session Color
      if (!this.sessionColorCache.has(npc.id)) {
        const randomPalette = this.COLOR_PALETTES[Math.floor(Math.random() * this.COLOR_PALETTES.length)];
        this.sessionColorCache.set(npc.id, randomPalette);
      }
      const cachedColors = this.sessionColorCache.get(npc.id)!;
      npc.baseColor = cachedColors.base;
      npc.accentColor = cachedColors.accent;
    }
  }

  /**
   * Processes all custom AI kinematics, objective path selections, and steering rotations
   */
  public static updateBehavior(npc: DiepShopNpc, g: any, playerX: number, playerY: number, tick: number, ms: number): void {
    const npcX = g.width * npc.x;
    const npcY = g.height * npc.y;

    if (!npc.interactionTimer) npc.interactionTimer = 0;
    if (npc.interactionTimer > 0) npc.interactionTimer -= ms;

    if (npc.behaviorType === 'WANDER') {
      this.processWanderAi(npc, g, npcX, npcY, playerX, playerY, ms);
      this.applySeparationAndSocializing(npc, g, npcX, npcY);
    } else {
      npc.vx = 0;
      npc.vy = 0;
    }

    npc.x += (npc.vx / g.width) * tick;
    npc.y += (npc.vy / g.height) * tick;

    // Keep the cache updated with real-time vector transformations as they travel
    this.sessionPositionCache.set(npc.id, { x: npc.x, y: npc.y });

    this.processLookingOrientation(npc, g, g.width * npc.x, g.height * npc.y, playerX, playerY, tick);
  }

  private static processWanderAi(npc: DiepShopNpc, g: any, currentX: number, currentY: number, playerX: number, playerY: number, ms: number): void {
    if (!npc.wanderTimer) npc.wanderTimer = 0;
    npc.wanderTimer -= ms;

    const pDx = playerX - currentX;
    const pDy = playerY - currentY;
    const distToPlayer = Math.sqrt(pDx * pDx + pDy * pDy);

    if (distToPlayer < this.ENGAGE_PROXIMITY) {
      npc.vx = 0;
      npc.vy = 0;
      return; 
    }

    if (npc.wanderState === 'IDLE' && npc.wanderTimer <= 0) {
      npc.focusedNpcId = null; 

      if (Math.random() > 0.5) {
        npc.wanderState = 'MOVING_AIMLESS';
        npc.wanderTargetX = (Math.random() * (this.MAP_BOUNDS.maxX - this.MAP_BOUNDS.minX) + this.MAP_BOUNDS.minX) * g.width;
        npc.wanderTargetY = (Math.random() * (this.MAP_BOUNDS.maxY - this.MAP_BOUNDS.minY) + this.MAP_BOUNDS.minY) * g.height;
      } else {
        npc.wanderState = 'MOVING_TO_STALL';
        npc.wanderTargetX = g.width * 0.5; 
        npc.wanderTargetY = g.height * 0.5;
      }
      npc.wanderTimer = 0; 
    }

    if ((npc.wanderState === 'MOVING_AIMLESS' || npc.wanderState === 'MOVING_TO_STALL') && npc.wanderTargetX !== undefined && npc.wanderTargetY !== undefined) {
      const tDx = npc.wanderTargetX - currentX;
      const tDy = npc.wanderTargetY - currentY;
      const tDist = Math.sqrt(tDx * tDx + tDy * tDy);

      if (tDist > this.TARGET_ARRIVE_RADIUS) {
        const desiredVx = (tDx / tDist) * this.WANDER_SPEED;
        const desiredVy = (tDy / tDist) * this.WANDER_SPEED;

        npc.vx += (desiredVx - npc.vx) * this.STEERING_EASE;
        npc.vy += (desiredVy - npc.vy) * this.STEERING_EASE;

        npc.lastHeadingAngle = Math.atan2(npc.vy, npc.vx);
      } else {
        npc.wanderState = 'IDLE';
        npc.wanderTimer = this.MIN_IDLE_DURATION + Math.random() * (this.MAX_IDLE_DURATION - this.MIN_IDLE_DURATION);
        npc.vx = 0;
        npc.vy = 0;
      }
    }
  }

  private static applySeparationAndSocializing(npc: DiepShopNpc, g: any, npcX: number, npcY: number): void {
    for (const other of DIEP_SHOP_NPCS) {
      if (other.id === npc.id) continue;

      const otherX = g.width * other.x;
      const otherY = g.height * other.y;

      const dx = npcX - otherX;
      const dy = npcY - otherY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = npc.radius + other.radius + this.SEPARATION_BUFFER;

      if (dist < minDist && dist > 0) {
        const force = ((minDist - dist) / minDist) * this.SEPARATION_FORCE_WEIGHT;
        npc.vx += (dx / dist) * force;
        npc.vy += (dy / dist) * force;
      }

      if (dist < this.SOCIAL_PROXIMITY && npc.wanderState === 'IDLE' && other.wanderState === 'IDLE') {
        if (npc.focusedNpcId === null && (npc.interactionTimer || 0) <= 0) {
          npc.focusedNpcId = other.id;
          npc.interactionTimer = this.MIN_CHAT_DURATION + Math.random() * (this.MAX_CHAT_DURATION - this.MIN_CHAT_DURATION);
        }
      }
      
      if (npc.focusedNpcId === other.id && (npc.interactionTimer || 0) <= 0) {
        npc.focusedNpcId = 'BREAK_AWAY'; 
      }
    }
  }

  private static processLookingOrientation(npc: DiepShopNpc, g: any, npcX: number, npcY: number, playerX: number, playerY: number, tick: number): void {
    const pDx = playerX - npcX;
    const pDy = playerY - npcY;
    const distToPlayer = Math.sqrt(pDx * pDx + pDy * pDy);

    if (distToPlayer < this.ENGAGE_PROXIMITY) {
      npc.targetAngle = Math.atan2(pDy, pDx);
    } 
    else if (npc.wanderState !== 'IDLE' && (Math.abs(npc.vx) > 0.1 || Math.abs(npc.vy) > 0.1)) {
      npc.targetAngle = Math.atan2(npc.vy, npc.vx);
    } 
    else if (npc.focusedNpcId && npc.focusedNpcId !== 'BREAK_AWAY') {
      const buddy = DIEP_SHOP_NPCS.find(n => n.id === npc.focusedNpcId);
      if (buddy) {
        npc.targetAngle = Math.atan2((buddy.y * g.height) - npcY, (buddy.x * g.width) - npcX);
      }
    } 
    else {
      npc.targetAngle = npc.lastHeadingAngle;
    }

    let angleDiff = npc.targetAngle - npc.currentAngle;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    npc.currentAngle += angleDiff * 0.08 * tick;
  }
}