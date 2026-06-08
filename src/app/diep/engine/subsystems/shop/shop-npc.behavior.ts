// src/app/diep/engine/subsystems/shop/shop-npc.behavior.ts
import { DIEP_SHOP_NPCS, DiepShopNpc } from './shop-npc.config';

export class DiepShopNpcBehaviorEngine {
  private static WANDER_SPEED = 1.2;
  private static STEERING_EASE = 0.05; 

  // Proximity range constants
  private static ENGAGE_PROXIMITY = 220; // Distance where vendor focuses and stops for the player
  private static MIN_CHAT_DURATION = 1500;
  private static MAX_CHAT_DURATION = 4000;

  /**
   * Processes all custom AI kinematics, objective path selections, and steering rotations
   */
  public static updateBehavior(npc: DiepShopNpc, g: any, playerX: number, playerY: number, tick: number, ms: number): void {
    const npcX = g.width * npc.x;
    const npcY = g.height * npc.y;

    // Tick down social timers
    if (!npc.interactionTimer) npc.interactionTimer = 0;
    if (npc.interactionTimer > 0) npc.interactionTimer -= ms;

    if (npc.behaviorType === 'WANDER') {
      this.processWanderAi(npc, g, npcX, npcY, playerX, playerY, ms);
      this.applySeparationAndSocializing(npc, g, npcX, npcY);
    } else {
      npc.vx = 0;
      npc.vy = 0;
    }

    // Apply translation vectors safely to our relative grid system scalars
    npc.x += (npc.vx / g.width) * tick;
    npc.y += (npc.vy / g.height) * tick;

    // Coordinate structural looking priorities
    this.processLookingOrientation(npc, g, g.width * npc.x, g.height * npc.y, playerX, playerY, tick);
  }

  /**
   * Evaluates targets and applies velocity curves using steering interpolation
   */
  private static processWanderAi(
    npc: DiepShopNpc, 
    g: any, 
    currentX: number, 
    currentY: number, 
    playerX: number, 
    playerY: number, 
    ms: number
  ): void {
    if (!npc.wanderTimer) npc.wanderTimer = 0;
    npc.wanderTimer -= ms;

    // 1. GREETING LOCK: If player is close enough, halt movement entirely to focus on them
    const pDx = playerX - currentX;
    const pDy = playerY - currentY;
    const distToPlayer = Math.sqrt(pDx * pDx + pDy * pDy);

    if (distToPlayer < this.ENGAGE_PROXIMITY) {
      npc.vx = 0;
      npc.vy = 0;
      return; // Skip target tracking vectors until player exits vicinity
    }

    // State Transition Picker Loop
    if (npc.wanderState === 'IDLE' && npc.wanderTimer <= 0) {
      // Clear past focus constraints when selecting a brand new path sequence
      npc.focusedNpcId = null; 

      if (Math.random() > 0.5) {
        npc.wanderState = 'MOVING_AIMLESS';
        npc.wanderTargetX = Math.random() * (g.width * 0.6) + (g.width * 0.2);
        npc.wanderTargetY = Math.random() * (g.height * 0.4) + (g.height * 0.4);
      } else {
        npc.wanderState = 'MOVING_TO_STALL';
        npc.wanderTargetX = g.width * 0.5; 
        npc.wanderTargetY = g.height * 0.5;
      }
      npc.wanderTimer = 0; 
    }

    // Velocity Path Processing Step
    if ((npc.wanderState === 'MOVING_AIMLESS' || npc.wanderState === 'MOVING_TO_STALL') && npc.wanderTargetX !== undefined && npc.wanderTargetY !== undefined) {
      const tDx = npc.wanderTargetX - currentX;
      const tDy = npc.wanderTargetY - currentY;
      const tDist = Math.sqrt(tDx * tDx + tDy * tDy);

      if (tDist > 12) {
        const desiredVx = (tDx / tDist) * this.WANDER_SPEED;
        const desiredVy = (tDy / tDist) * this.WANDER_SPEED;

        npc.vx += (desiredVx - npc.vx) * this.STEERING_EASE;
        npc.vy += (desiredVy - npc.vy) * this.STEERING_EASE;

        npc.lastHeadingAngle = Math.atan2(npc.vy, npc.vx);
      } else {
        npc.wanderState = 'IDLE';
        npc.wanderTimer = 2000 + Math.random() * 2500;
        npc.vx = 0;
        npc.vy = 0;
      }
    }
  }

  /**
   * Applies separating push vectors and manages conversational lock mechanics
   */
  private static applySeparationAndSocializing(npc: DiepShopNpc, g: any, npcX: number, npcY: number): void {
    const bufferDistance = 25; 
    const socialProximity = 140; // Range where they notice each other and "chat"

    for (const other of DIEP_SHOP_NPCS) {
      if (other.id === npc.id) continue;

      const otherX = g.width * other.x;
      const otherY = g.height * other.y;

      const dx = npcX - otherX;
      const dy = npcY - otherY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = npc.radius + other.radius + bufferDistance;

      // 1. Separation force handling
      if (dist < minDist && dist > 0) {
        const force = (minDist - dist) / minDist * 0.5;
        npc.vx += (dx / dist) * force;
        npc.vy += (dy / dist) * force;
      }

      // 2. Social Look-Lock Break Logic
      if (dist < socialProximity && npc.wanderState === 'IDLE' && other.wanderState === 'IDLE') {
        if (npc.focusedNpcId === null && (npc.interactionTimer || 0) <= 0) {
          npc.focusedNpcId = other.id;
          npc.interactionTimer = this.MIN_CHAT_DURATION + Math.random() * (this.MAX_CHAT_DURATION - this.MIN_CHAT_DURATION);
        }
      }
      
      if (npc.focusedNpcId === other.id && (npc.interactionTimer || 0) <= 0) {
        npc.focusedNpcId = 'BREAK_AWAY'; // Temporary flag preventing immediate re-lock until they move
      }
    }
  }

  /**
   * Prioritizes looking targets: Player Proximity > Active Movement > Social Chat Lock > Last Heading
   */
  private static processLookingOrientation(npc: DiepShopNpc, g: any, npcX: number, npcY: number, playerX: number, playerY: number, tick: number): void {
    const pDx = playerX - npcX;
    const pDy = playerY - npcY;
    const distToPlayer = Math.sqrt(pDx * pDx + pDy * pDy);

    // 1. Player proximity takes absolute precedence
    if (distToPlayer < this.ENGAGE_PROXIMITY) {
      npc.targetAngle = Math.atan2(pDy, pDx);
    } 
    // 2. Active intentional movement (ignoring micro-jitters from separation force while IDLE)
    else if (npc.wanderState !== 'IDLE' && (Math.abs(npc.vx) > 0.1 || Math.abs(npc.vy) > 0.1)) {
      npc.targetAngle = Math.atan2(npc.vy, npc.vx);
    } 
    // 3. Conditional Social Lock (Looking at fellow vendor buddy)
    else if (npc.focusedNpcId && npc.focusedNpcId !== 'BREAK_AWAY') {
      const buddy = DIEP_SHOP_NPCS.find(n => n.id === npc.focusedNpcId);
      if (buddy) {
        npc.targetAngle = Math.atan2((buddy.y * g.height) - npcY, (buddy.x * g.width) - npcX);
      }
    } 
    // 4. Default fallback: Maintain historical angle vector
    else {
      npc.targetAngle = npc.lastHeadingAngle;
    }

    // Smooth rotation angle interpolation
    let angleDiff = npc.targetAngle - npc.currentAngle;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    npc.currentAngle += angleDiff * 0.08 * tick;
  }
}