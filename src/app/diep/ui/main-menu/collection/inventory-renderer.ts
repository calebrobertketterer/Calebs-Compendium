// src/app/diep/ui/main-menu/collection/inventory-renderer.ts
import { DiepButton } from '../../../core/diep.interfaces';

export class InventoryRenderer {
  private static selectedIndex: number = 0;

  public static render(ctx: CanvasRenderingContext2D, g: any, width: number, height: number, gridStartY: number, buttons: DiepButton[]): void {
    const inv = g.playerService.player.inventory;
    const frame = g.frameCounter || 0;

    const gridStartX = 50;
    const slotSize = 90;
    const gap = 16;
    const columns = 4;

    // Process items grid slots dynamically
    for (let i = 0; i < inv.maxSlots; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const slotX = gridStartX + col * (slotSize + gap);
      const slotY = gridStartY + row * (slotSize + gap);

      const isOccupied = i < inv.slots.length;
      const isSelected = i === this.selectedIndex;

      const slotButton = buttons.find(b => b.id === `slot-${i}`);
      const isHovered = slotButton && g.mouseX >= slotX && g.mouseX <= slotX + slotSize && g.mouseY >= slotY && g.mouseY <= slotY + slotSize;

      ctx.fillStyle = isSelected ? '#1c2833' : (isHovered ? '#252525' : '#1e1e1e');
      ctx.strokeStyle = isSelected ? '#3498db' : (isHovered ? '#555555' : '#333333');
      ctx.lineWidth = isSelected ? 3 : 2;

      ctx.beginPath();
      ctx.roundRect(slotX, slotY, slotSize, slotSize, 10);
      ctx.fill();
      ctx.stroke();

      if (isOccupied) {
        const item = inv.slots[i];
        ctx.save();
        item.drawIllustration(ctx, slotX, slotY, slotSize, frame);
        ctx.restore();

        if (item.quantity > 1) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px Inter, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`x${item.quantity}`, slotX + slotSize - 8, slotY + slotSize - 8);
        }
      }
    }

    // Render Inspection Right-Side Info Overlay Box
    const panelX = gridStartX + columns * (slotSize + gap) + 20;
    const panelY = gridStartY;
    const panelW = width - panelX - 50;
    const panelH = inv.maxSlots / columns * (slotSize + gap) - gap;

    ctx.fillStyle = '#161616';
    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 12);
    ctx.fill();
    ctx.stroke();

    const selectedItem = this.selectedIndex < inv.slots.length ? inv.slots[this.selectedIndex] : null;

    if (selectedItem) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(selectedItem.name, panelX + 25, panelY + 45);

      const tagText = selectedItem.type.replace('_', ' ');
      ctx.font = 'bold 11px Inter, sans-serif';
      const tagW = ctx.measureText(tagText).width;

      ctx.fillStyle = '#2980b9';
      ctx.beginPath();
      ctx.roundRect(panelX + 25, panelY + 62, tagW + 16, 20, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(tagText, panelX + 33, panelY + 76);

      ctx.fillStyle = '#ecf0f1';
      ctx.font = '14px Inter, sans-serif';
      this.wrapText(ctx, selectedItem.description, panelX + 25, panelY + 115, panelW - 50, 22);
    } else {
      ctx.fillStyle = '#4f4f4f';
      ctx.font = 'italic 15px Inter, sans-serif';
      ctx.textAlign = 'left';
      this.wrapText(ctx, 'Select an occupied inventory slot to inspect details.', panelX + 25, panelY + 45, panelW - 50, 22);
    }
  }

  public static addButtons(list: DiepButton[], g: any): void {
    const inv = g.playerService?.player?.inventory;
    const gridStartX = 50;
    const gridStartY = 135;
    const slotSize = 90;
    const gap = 16;
    const columns = 4;
    const maxSlots = inv?.maxSlots || 12;

    for (let i = 0; i < maxSlots; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      list.push({
        id: `slot-${i}`,
        label: '',
        x: gridStartX + col * (slotSize + gap),
        y: gridStartY + row * (slotSize + gap),
        w: slotSize,
        h: slotSize,
        color: 'transparent',
        borderColor: 'transparent',
        action: () => { this.selectedIndex = i; }
      });
    }
  }

  private static wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
    const words = text.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }
}