// src/app/diep/engine/subsystems/shop/shop-physics.processor.ts
import { Player, Bullet } from '../../../core/diep.interfaces';
import { DIEP_SHOP_NPCS, DiepShopNpc } from './shop-npc.config';

export class DiepShopPhysicsProcessor {
  /**
   * Orchestrates orientation updates, solid collisions, and projectile blocks for the shop scene
   */
  public static process(g: any, player: Player, bullets: Bullet[], tick: number): void {
    if (!player) return;

    const lookRange = 250; // Distance threshold to trigger player-tracking tracking mechanics

    for (const npc of DIEP_SHOP_NPCS) {
      const npcX = g.width * npc.x;
      const npcY = g.height * npc.y;

      // 1. Smoothly Interpolate Orientation Angles
      const dx = player.x - npcX;
      const dy = player.y - npcY;
      const distToPlayer = Math.sqrt(dx * dx + dy * dy);

      if (distToPlayer < lookRange) {
        // Track the player tank coordinate vector
        npc.targetAngle = Math.atan2(dy, dx);
      } else {
        // Return smoothly to the baseline direction assignment
        npc.targetAngle = npc.defaultAngle;
      }

      // Execute smooth rotation easing (0.1 interpolation step)
      let angleDiff = npc.targetAngle - npc.currentAngle;
      // Normalize angle difference between -PI and +PI to avoid spinning backwards
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      npc.currentAngle += angleDiff * 0.1 * tick;

      // 2. Handle Player Solid Circle Pushing Physics
      const minDist = player.radius + npc.radius;
      if (distToPlayer < minDist && distToPlayer > 0) {
        const overlap = minDist - distToPlayer;
        // Calculate normal vectors
        const nx = dx / distToPlayer;
        const ny = dy / distToPlayer;

        // Push player tank away out of the solid vendor body bounds immediately
        player.x += nx * overlap;
        player.y += ny * overlap;
      }

      // 3. Handle Cosmetic Bullet Intersection & Blockades
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        const bDx = b.x - npcX;
        const bDy = b.y - npcY;
        const bDist = Math.sqrt(bDx * bDx + bDy * bDy);

        if (bDist < npc.radius + (b.radius || 10)) {
          // Instantly deplete bullet health to destroy it without bleeding damage to the NPC object
          b.health = 0;
        }
      }
    }
  }
}