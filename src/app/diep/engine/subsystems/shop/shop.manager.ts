// src/app/diep/engine/subsystems/shop/shop.manager.ts
import { Injectable } from '@angular/core';
import { Player } from '../../../core/diep.interfaces';
import { DIEP_SHOP_NPCS, DiepShopNpc } from './shop-npc.config';
import { DiepShopPhysicsProcessor } from './shop-physics.processor'; // Import the physics processor

@Injectable({
  providedIn: 'root'
})
export class DiepShopManagerService {
  
  /**
   * Performs data setup and entry mechanics for the store module
   */
  public transitionToShop(g: any): void {
    g.arenaReset.transition.fadeOut(() => {
      g.currentMode = 'SHOP';
      g.isGameStarted = true;
      g.gameOver = false;
      g.isPaused = false;
      
      g.bullets = [];
      g.playerService.initializePlayer(g.currentDifficulty, g.persistentXp);
      
      const p = g.playerService.player;
      if (p) {
        p.x = g.width / 2;
        p.y = g.height / 2;
      }
      
      g.arenaReset.transition.fadeIn();
    });
  }

  /**
   * New exit sequence method to back out cleanly into the master main menu
   */
  public transitionToMenu(g: any): void {
    g.arenaReset.transition.fadeOut(() => {
      g.currentMode = 'MENU';
      g.isGameStarted = false;
      g.arenaReset.transition.fadeIn();
    });
  }

  /**
   * Encapsulates running logic for position updates, map constraints, and cosmetic weapon loops
   */
  public updateShop(g: any, tick: number, ms: number): void {
    const p = g.playerService.player;

    // 1. Execute physics/movement tracking mechanics via player service
    g.playerService.update(g, tick, ms);
    
    // 2. Process cosmetic firing loops and translate active projectiles across the viewport
    if (g.weaponController) {
      g.weaponController.update(g, tick, ms);
    }
    g.projectileService.update(g, tick, ms);

    // 3. Run specialized dynamic NPC looking loops and solid circle pushing collision fields
    if (p) {
      // FIXED: Added the missing 'ms' argument down into the physics orchestrator execution parameters
      DiepShopPhysicsProcessor.process(g, p, g.bullets, tick, ms);
    }
    
    // 4. Contain player within the strict bounds of the view map layout
    if (p) {
      if (p.x < p.radius) p.x = p.radius;
      if (p.x > g.width - p.radius) p.x = g.width - p.radius;
      if (p.y < p.radius) p.y = p.radius;
      if (p.y > g.height - p.radius) p.y = g.height - p.radius;
    }
  }

  /**
   * Handles canvas backdrop visuals and dynamically renders populated NPCs
   */
  public drawShop(ctx: CanvasRenderingContext2D, player: Player, width: number, height: number): void {
    ctx.fillStyle = '#11161b';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(52, 152, 219, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Loop through and render all active configurated shop NPCs dynamically
    for (const npc of DIEP_SHOP_NPCS) {
      const actualX = width * npc.x;
      const actualY = height * npc.y;
      this.drawShopNpc(ctx, actualX, actualY, npc);
    }
  }

  /**
   * Visual renderer structure for shop NPCs matching tank geometric styling mechanics
   */
  private drawShopNpc(ctx: CanvasRenderingContext2D, x: number, y: number, npc: DiepShopNpc): void {
    const radius = npc.radius;
    
    ctx.save();
    ctx.translate(x, y);
    
    // Dynamic Rotation: Rotate the canvas coordinate base to match the real-time looking angle
    ctx.rotate(npc.currentAngle);
    
    // 1. Draw Vendor Barrel/Stand Underlay Geometry (now tracks rotation automatically)
    ctx.fillStyle = '#95a5a6';
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 2;
    ctx.fillRect(0, -radius * 0.4, radius * 1.8, radius * 0.8); // Adjusted coordinates to project forward along zero-angle axis
    ctx.strokeRect(0, -radius * 0.4, radius * 1.8, radius * 0.8);

    // 2. Draw Main Geometric Core Body Circular Layer
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = npc.baseColor;
    ctx.fill();
    ctx.strokeStyle = npc.accentColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.restore();

    // 3. Render Floating Text Typography Information Headings (Drawn unrotated outside context save stack)
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillStyle = npc.baseColor;
    ctx.textAlign = 'center';
    ctx.fillText(npc.name, x, y - radius - 20);

    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillStyle = '#7f8c8d';
    ctx.fillText(npc.subtitle, x, y - radius - 6);
  }
}