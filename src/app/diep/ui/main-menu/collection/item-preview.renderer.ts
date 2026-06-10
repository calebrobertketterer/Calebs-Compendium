// src/app/diep/ui/main-menu/collection/item-preview.renderer.ts
import { InventoryItem } from '../../../core/diep.interfaces';

export class ItemPreviewRenderer {
  /**
   * Renders the right-hand inspection details panel for a selected inventory item.
   */
  public static render(
    ctx: CanvasRenderingContext2D,
    selectedItem: InventoryItem | null,
    panelX: number,
    panelY: number,
    panelW: number,
    panelH: number
  ): void {
    // Render Inspection Right-Side Base Overlay Box Container
    ctx.fillStyle = '#161616';
    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 12);
    ctx.fill();
    ctx.stroke();

    if (!selectedItem) {
      ctx.fillStyle = '#4f4f4f';
      ctx.font = 'italic 15px Inter, sans-serif';
      ctx.textAlign = 'left';
      this.wrapText(ctx, 'Select an occupied inventory slot to inspect details.', panelX + 25, panelY + 45, panelW - 50, 22);
      return;
    }

    // Render Item Title Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(selectedItem.name, panelX + 25, panelY + 45);

    // Render Type Badge Category Tag
    const tagText = selectedItem.type.replace('_', ' ');
    ctx.font = 'bold 11px Inter, sans-serif';
    const tagW = ctx.measureText(tagText).width;

    ctx.fillStyle = '#2980b9';
    ctx.beginPath();
    ctx.roundRect(panelX + 25, panelY + 62, tagW + 16, 20, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(tagText, panelX + 33, panelY + 76);

    // Parse description strings dynamically into distinct functional categories
    let abilityText = '';
    let flavorText = selectedItem.description;

    const sentences = selectedItem.description.split(/(?<=\.)\s+/);
    const abilityIndex = sentences.findIndex((s: string) => 
      s.toLowerCase().includes('%') || 
      s.toLowerCase().includes('equipped') || 
      s.toLowerCase().includes('doubles')
    );

    if (abilityIndex !== -1) {
      abilityText = sentences[abilityIndex];
      flavorText = sentences.filter((_: string, idx: number) => idx !== abilityIndex).join(' ');
    }

    let textCursorY = panelY + 120;

    // 1. Draw Ability modifier line if extracted
    if (abilityText) {
      ctx.fillStyle = '#2ecc71';
      ctx.font = 'bold 14px Inter, sans-serif';
      this.wrapText(ctx, abilityText, panelX + 25, textCursorY, panelW - 50, 22);
      
      // Calculate vertical lines wrapping displacement scalar
      const words = abilityText.split(' ');
      let testLine = '';
      let linesCount = 1;
      for (let n = 0; n < words.length; n++) {
        let testWidth = ctx.measureText(testLine + words[n] + ' ').width;
        if (testWidth > (panelW - 50) && n > 0) {
          linesCount++;
          testLine = words[n] + ' ';
        } else {
          testLine += words[n] + ' ';
        }
      }
      textCursorY += (linesCount * 22) + 12;
    }

    // 2. Draw Flavor lore sub-text block underneath
    if (flavorText) {
      ctx.fillStyle = 'rgba(236, 240, 241, 0.5)';
      ctx.font = 'italic 13px Inter, sans-serif';
      this.wrapText(ctx, flavorText, panelX + 25, textCursorY, panelW - 50, 20);
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