// src/app/diep/engine/subsystems/shop/shop.manager.ts
import { Injectable } from '@angular/core';
import { Player } from '../../../core/diep.interfaces';

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
      
      // Clear out old projectiles so you start with a clean canvas field
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
    // 1. Execute physics/movement tracking mechanics via player service
    g.playerService.update(g, tick, ms);
    
    // 2. Process cosmetic firing loops and translate active projectiles across the viewport
    if (g.weaponController) {
      g.weaponController.update(g, tick, ms);
    }
    g.projectileService.update(g, tick, ms);
    
    // 3. Contain player within the strict bounds of the view map layout
    const p = g.playerService.player;
    if (p) {
      if (p.x < p.radius) p.x = p.radius;
      if (p.x > g.width - p.radius) p.x = g.width - p.radius;
      if (p.y < p.radius) p.y = p.radius;
      if (p.y > g.height - p.radius) p.y = g.height - p.radius;
    }
  }

  /**
   * Handles canvas backdrop visuals
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

    this.drawShopkeeperPlaceholder(ctx, width / 2, height / 3, 'GENERAL VENDOR');
  }

  private drawShopkeeperPlaceholder(ctx: CanvasRenderingContext2D, x: number, y: number, name: string): void {
    const radius = 25;
    
    ctx.save();
    ctx.translate(x, y);
    
    ctx.fillStyle = '#95a5a6';
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 2;
    ctx.fillRect(-radius * 0.4, 0, radius * 0.8, radius * 1.8);
    ctx.strokeRect(-radius * 0.4, 0, radius * 0.8, radius * 1.8);

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#3498db';
    ctx.fill();
    ctx.strokeStyle = '#2980b9';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.restore();

    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#3498db';
    ctx.textAlign = 'center';
    ctx.fillText(name, x, y - radius - 10);
  }
}