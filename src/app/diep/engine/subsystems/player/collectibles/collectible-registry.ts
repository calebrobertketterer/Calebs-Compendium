// src/app/diep/engine/subsystems/player/collectibles/collectible-registry.ts
import { InventoryItem } from '../../../../core/diep.interfaces';

export class CollectibleRegistry {
  private static templates: { [id: string]: () => InventoryItem } = {
    plasma_thruster: () => ({
      id: 'plasma_thruster',
      name: 'Plasma Thruster',
      description: 'A customized engine nozzle that emits glowing neon heat trails.',
      quantity: 1,
      maxStack: 1,
      type: 'CHASSIS_PERK',
      drawIllustration: (ctx, x, y, size, frame) => {
        const cx = x + size / 2;
        const cy = y + size / 2;
        
        // Pulse animation vector calculations
        const pulse = Math.sin(frame * 0.08) * 4;

        // Core Thruster nozzle housing
        ctx.fillStyle = '#7f8c8d';
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy + 10);
        ctx.lineTo(cx + 15, cy + 10);
        ctx.lineTo(cx + 8, cy - 15);
        ctx.lineTo(cx - 8, cy - 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Plasma Fire plume output
        ctx.fillStyle = 'rgba(52, 152, 219, 0.8)';
        ctx.beginPath();
        ctx.arc(cx, cy + 16, 8 + pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy + 14, 4 + pulse * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }),

    cyclone_barrel: () => ({
      id: 'cyclone_barrel',
      name: 'Cyclone Barrel',
      description: 'A heavy, reinforced dual-bore assembly built to spiral fire.',
      quantity: 1,
      maxStack: 1,
      type: 'ATTACHMENT',
      drawIllustration: (ctx, x, y, size, frame) => {
        const cx = x + size / 2;
        const cy = y + size / 2;
        
        // Rotational speed tracking scalar
        const rotation = (frame * 0.04) % (Math.PI * 2);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);

        ctx.fillStyle = '#95a5a6';
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 3;

        // Render two split offset barrel layouts
        ctx.fillRect(-14, -18, 8, 36);
        ctx.strokeRect(-14, -18, 8, 36);

        ctx.fillRect(6, -18, 8, 36);
        ctx.strokeRect(6, -18, 8, 36);

        // Central node anchor ring
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    })
  };

  /**
   * Spawns a pristine deep-copied instance of a registered item configuration blueprint.
   */
  public static createItem(id: string): InventoryItem | null {
    const builder = this.templates[id];
    return builder ? builder() : null;
  }

  /**
   * Utility helper to build default starter playtesting inventories cleanly.
   */
  public static getStarterInventoryList(): InventoryItem[] {
    return [
      this.createItem('plasma_thruster')!,
      this.createItem('cyclone_barrel')!
    ].filter(Boolean);
  }
}