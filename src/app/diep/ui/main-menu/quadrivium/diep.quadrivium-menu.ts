// src/app/diep/ui/main-menu/quadrivium/diep.quadrivium-menu.ts
import { EnemyRegistry } from '../../../enemies/enemy.registry';
import { DiepMorphologySorter } from './diep.morphology-sorter';
import { DiepMorphologyRenderer } from './diep.morphology-renderer';
import { DiepQuadriviumNavigator } from './diep.quadrivium-nav-bar';
import { QuadriviumStatsPanelRenderer } from './diep.records-renderer';
import { DiepButton } from '../../../core/diep.interfaces';
import { DiepButtonRenderer } from '../../buttons/diep.button-renderer';

export class DiepQuadriviumMenu {
  private static rotation = 0;
  private static scrollY = 0;
  private static targetScrollY = 0;
  private static isDragging = false;
  private static lastMouseY = 0;

  public static render(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    DiepQuadriviumNavigator.handleInput(g);
    this.rotation += 0.015;

    ctx.fillStyle = 'rgba(8, 8, 15, 0.99)';
    ctx.fillRect(0, 0, width, height);

    const currentTab = DiepQuadriviumNavigator.tabs[DiepQuadriviumNavigator.activeTabIndex];
    const rawTypes = EnemyRegistry.getRegisteredTypes();
    const sortedTypes = DiepMorphologySorter.sortEnemies(rawTypes);

    const startY = 80;
    const viewHeight = height - startY - 0; 
    let contentHeight = 0;

    // Dynamically query boundaries based on context mapping configurations
    if (currentTab === 'MORPHOLOGY') {
      const colCount = 2;
      const rowSpacing = 110;
      const totalRows = Math.ceil(sortedTypes.length / colCount);
      contentHeight = totalRows * rowSpacing;
    } else if (currentTab === 'DOSSIER') {
      contentHeight = 480; 
    } else if (currentTab === 'RECORDS') {
      const allTimeCount = g.highScoresService?.getHighScores().length || 0;
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const weeklyCount = (g.highScoresService?.getHighScores() || []).filter((row: any) => new Date(row.date).getTime() >= sevenDaysAgo).length;
      
      const maxCount = Math.max(allTimeCount, weeklyCount);
      contentHeight = Math.max(150, maxCount * 30 + 130); 
    }

    const canScroll = contentHeight > viewHeight;
    const totalHeight = contentHeight;

    if (canScroll) {
      this.handleKeyboardScroll(g);
      this.scrollY += (this.targetScrollY - this.scrollY) * 0.15;
    } else {
      this.targetScrollY = 0;
      this.scrollY = 0;
    }

    let displayOffset = 0;
    if (canScroll) {
      displayOffset = this.scrollY % totalHeight;
      if (displayOffset > 0) displayOffset -= totalHeight;
    }

    // Clip rendering visual view bounding box
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, startY - 10, width, viewHeight + 10);
    ctx.clip();

    const loops = canScroll ? 2 : 1;
    for (let loop = 0; loop < loops; loop++) {
      const currentScrollOffset = displayOffset + (loop * totalHeight);

      if (currentTab === 'MORPHOLOGY') {
        DiepMorphologyRenderer.drawGrid(ctx, sortedTypes, width, height, startY, currentScrollOffset, this.rotation);
      } else if (currentTab === 'DOSSIER') {
        const paneY = 140 + currentScrollOffset;
        if (paneY > startY - 500 && paneY < height + 500) {
          QuadriviumStatsPanelRenderer.drawDossier(ctx, g, width, paneY);
        }
      } else if (currentTab === 'RECORDS') {
        const paneY = 140 + currentScrollOffset;
        if (paneY > startY - 500 && paneY < height + 500) {
          QuadriviumStatsPanelRenderer.drawHighScores(ctx, g, width, paneY);
        }
      }
    }
    ctx.restore();

    this.drawFades(ctx, width, height, startY, viewHeight);
    this.drawHeader(ctx, width);
    DiepQuadriviumNavigator.drawTabs(ctx, width);

    if (canScroll) {
      this.drawScrollbar(ctx, width, startY, viewHeight, totalHeight);
    }

    DiepButtonRenderer.drawCollection(ctx, g, this.getButtons(g, width, height));
  }

  private static drawHeader(ctx: CanvasRenderingContext2D, width: number): void {
    ctx.fillStyle = 'rgba(8, 8, 15, 1)';
    ctx.fillRect(0, 0, width, 25);

    ctx.textAlign = 'center';
    ctx.font = '900 32px Inter, sans-serif';
    ctx.fillStyle = '#9b59b6';
    ctx.fillText('THE QUADRIVIUM', width / 2, 45);

    ctx.font = '900 9px Inter, sans-serif';
    ctx.fillStyle = 'rgba(155, 89, 182, 0.5)';
    ctx.fillText('A / D TO SWAP MODULES • W / S TO EXPLORE', width / 2, 62);
  }

  private static drawFades(ctx: CanvasRenderingContext2D, w: number, h: number, startY: number, viewH: number): void {
    const fadeColor = 'rgba(8, 8, 15, 1)';
    const transparent = 'rgba(8, 8, 15, 0)';

    const topGrad = ctx.createLinearGradient(0, startY - 15, 0, startY + 5);
    topGrad.addColorStop(0, fadeColor);
    topGrad.addColorStop(1, transparent);
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, startY - 15, w, 20);

    const bottomY = startY + viewH;
    const botGrad = ctx.createLinearGradient(0, bottomY - 20, 0, bottomY + 10);
    botGrad.addColorStop(0, transparent);
    botGrad.addColorStop(1, fadeColor);
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, bottomY - 20, w, 30);
    
    const floorFadeHeight = 20; 
    const floorGrad = ctx.createLinearGradient(0, h - floorFadeHeight, 0, h);
    floorGrad.addColorStop(0, 'rgba(8, 8, 15, 0.99)');
    floorGrad.addColorStop(1, transparent);
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, h - floorFadeHeight, w, floorFadeHeight);
  }

  private static drawScrollbar(ctx: CanvasRenderingContext2D, w: number, startY: number, viewH: number, totalH: number): void {
    const barHeight = 80;
    const barX = w - 10;
    const scrollNormalized = ((-this.scrollY % totalH) + totalH) % totalH;
    const scrollPercent = scrollNormalized / totalH;
    const barY = startY + (scrollPercent * (viewH - barHeight));

    ctx.fillStyle = 'rgba(155, 89, 182, 0.4)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, 4, barHeight, 2);
    ctx.fill();
  }

  public static handleInputDown(mouseY: number): void { this.isDragging = true; this.lastMouseY = mouseY; }
  public static handleInputUp(): void { this.isDragging = false; }
  public static handleInputMove(mouseY: number): void {
    if (!this.isDragging) return;
    this.targetScrollY += (mouseY - this.lastMouseY);
    this.lastMouseY = mouseY;
  }

  private static handleKeyboardScroll(g: any): void {
    const speed = 12;
    if (g.keys['w'] || g.keys['W'] || g.keys['arrowup']) this.targetScrollY += speed;
    if (g.keys['s'] || g.keys['S'] || g.keys['arrowdown']) this.targetScrollY -= speed;
  }

  public static getButtons(g: any, width: number, height: number): DiepButton[] {
    return [
      {
        id: 'back-to-menu-btn',
        label: 'BACK',
        x: width / 2 - 100, y: height - 80, w: 200, h: 50,
        color: '#e74c3c', borderColor: '#c0392b',
        hoverEffect: 'grow',
        action: () => g.arenaReset.transition.fadeOut(() => g.showingQuadrivium = false)
      },
      ...DiepQuadriviumNavigator.getButtons(g, width)
    ];
  }
}