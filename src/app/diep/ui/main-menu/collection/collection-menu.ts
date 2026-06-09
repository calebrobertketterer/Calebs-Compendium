// src/app/diep/ui/main-menu/collection/diep.collection-menu.ts
import { DiepButton } from '../../../core/diep.interfaces';
import { DiepButtonRenderer } from '../../buttons/diep.button-renderer';
import { DiepCollectionNavigator } from './collection-nav-bar';

export class DiepCollectionMenu {
  private static selectedIndex: number = 0;

  public static render(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    // Process tab inputs and updates before calculations
    DiepCollectionNavigator.handleInput(g);
    DiepCollectionNavigator.updateTransition();

    const buttons = this.getButtons(g, width, height);

    // 1. Solid Deep Background Fill
    ctx.fillStyle = 'rgba(8, 8, 15, 0.99)';
    ctx.fillRect(0, 0, width, height);

    const frame = g.frameCounter || 0;
    
    if (!g.playerService?.player) {
      g.playerService.initializePlayer();
    }
    const player = g.playerService.player;
    const inv = player.inventory;

    // 2. Header Block - High-Boldness Left Aligned Styling
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '900 32px Inter, sans-serif';
    ctx.fillStyle = '#3498db';
    ctx.fillText('COLLECTION', 50, 65);

    ctx.font = '500 13px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('Manage your discovered items, body modifications, and upgrade cards', 50, 85);

    // 3. Right-Aligned Balance Currency Balance Indicator (Symbol only)
    const pixelAmountText = `${inv.pixels}`;
    ctx.font = 'bold 16px Inter, sans-serif';
    const textW = ctx.measureText(pixelAmountText).width;
    
    const boxGap = 10;
    const diamondSize = 12;
    const paddingX = 18;
    const boxW = textW + boxGap + diamondSize + (paddingX * 2);
    const boxH = 38; 
    const boxX = width - boxW - 50;
    const boxY = 38;
    
    ctx.strokeStyle = '#2980b9';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#3498db';
    ctx.textAlign = 'left';
    ctx.fillText(pixelAmountText, boxX + paddingX, 63);

    ctx.save();
    ctx.translate(boxX + paddingX + textW + boxGap + (diamondSize / 2), 56);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#3498db';
    ctx.fillRect(-6, -6, diamondSize, diamondSize);
    ctx.restore();

    // 4. Render Three Empty "Equipped" Slots - Aligned perfectly with Currency Box
    const eqSlotSize = 38; 
    const eqGap = 10;
    const eqStartX = boxX - (eqSlotSize * 3) - (eqGap * 3) - 0; 
    const eqStartY = 38;

    ctx.font = '900 11px Inter, sans-serif';
    ctx.fillStyle = '#3498db';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.fillText('EQUIPPED', eqStartX - 12, eqStartY + eqSlotSize / 2);

    ctx.textBaseline = 'alphabetic'; 

    for (let e = 0; e < 3; e++) {
      const sx = eqStartX + e * (eqSlotSize + eqGap);
      
      const slotButton = buttons.find(b => b.id === `equipped-slot-${e}`);
      const isEqHovered = slotButton && g.mouseX >= sx && g.mouseX <= sx + eqSlotSize && g.mouseY >= eqStartY && g.mouseY <= eqStartY + eqSlotSize;

      ctx.fillStyle = isEqHovered ? '#1c2833' : '#141419';
      ctx.strokeStyle = isEqHovered ? '#3498db' : '#2c3e50';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(sx, eqStartY, eqSlotSize, eqSlotSize, 6);
      ctx.fill();
      ctx.stroke();
    }

    // Draw Tab Navigation Headers
    DiepCollectionNavigator.drawTabs(ctx, width);

    // 5. Main Grid View Layout
    const gridStartX = 50;
    const gridStartY = 135; 
    const slotSize = 90;
    const gap = 16;
    const columns = 4;

    const currentTab = DiepCollectionNavigator.tabs[DiepCollectionNavigator.activeTabIndex];

    if (currentTab === 'INVENTORY') {
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
    } else {
      // Placeholder data rendering contexts for Blueprints and Cards tab variations
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.font = 'italic 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${currentTab} content modules coming soon`, width / 2, gridStartY + 100);
    }

    // Solid Black Transition Fade Masks mirroring Quadrivium animations
    if (DiepCollectionNavigator.maskAlpha > 0) {
      ctx.fillStyle = `rgba(8, 8, 15, ${DiepCollectionNavigator.maskAlpha})`;
      ctx.fillRect(0, gridStartY - 10, width, height - gridStartY);
    }

    // Loop and execute standard layout buttons manually
    buttons.forEach(btn => {
      DiepButtonRenderer.draw(ctx, btn, g);
    });
  }

  public static getButtons(g: any, width: number, height: number): DiepButton[] {
    const player = g.playerService?.player;
    const inv = player?.inventory;
    const pixelAmountText = inv ? `${inv.pixels}` : '0';
    
    // Fallback alignment width estimation (approx 7.5px per character) to avoid requiring a canvas context
    const textW = pixelAmountText.length * 7.5;
    const boxW = textW + 10 + 12 + (18 * 2);
    const boxX = width - boxW - 50;

    const list: DiepButton[] = [
      {
        id: 'back-to-menu-btn',
        label: 'BACK',
        x: width / 2 - 100, 
        y: height - 80, 
        w: 200, 
        h: 50,
        color: '#e74c3c', 
        borderColor: '#c0392b',
        hoverEffect: 'grow',
        action: () => g.arenaReset.transition.fadeOut(() => g.showingCollection = false)
      },
      ...DiepCollectionNavigator.getButtons(g, width)
    ];

    // Equipped slot interaction zones - Correctly tracked with zero signature alterations
    const eqSlotSize = 38;
    const eqGap = 10;
    const eqStartX = boxX - (eqSlotSize * 3) - (eqGap * 3) - 20;
    const eqStartY = 38;
    for (let e = 0; e < 3; e++) {
      list.push({
        id: `equipped-slot-${e}`,
        label: '',
        x: eqStartX + e * (eqSlotSize + eqGap),
        y: eqStartY,
        w: eqSlotSize,
        h: eqSlotSize,
        color: 'transparent',
        borderColor: 'transparent',
        action: () => { /* Future equipment management hooks */ }
      });
    }

    // Active item panel grid coordinates mapped only if current routing layer targets inventory tracking
    if (DiepCollectionNavigator.tabs[DiepCollectionNavigator.activeTabIndex] === 'INVENTORY') {
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

    return list;
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