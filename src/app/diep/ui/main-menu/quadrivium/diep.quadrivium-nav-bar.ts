// src/app/diep/ui/main-menu/quadrivium/diep.quadrivium-navigator.ts
import { DiepButton } from '../../../core/diep.interfaces';

export class DiepQuadriviumNavigator {
  public static tabs = ['BESTIARY', 'DOSSIER', 'RECORDS'];
  public static activeTabIndex = 0;

  private static tabSpacing = 140;
  private static tabY = 75;

  public static drawTabs(ctx: CanvasRenderingContext2D, width: number): void {
    const startX = (width / 2) - ((this.tabs.length - 1) * this.tabSpacing) / 2;
    
    ctx.textAlign = 'center';
    ctx.font = '900 12px Inter, sans-serif';

    this.tabs.forEach((tab, i) => {
      const x = startX + (i * this.tabSpacing);
      const isActive = i === this.activeTabIndex;

      if (isActive) {
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(x - 35, this.tabY + 20, 70, 3);
      }
      
      ctx.fillStyle = isActive ? '#fff' : 'rgba(255, 255, 255, 0.3)';
      ctx.fillText(tab, x, this.tabY + 10);
    });
  }

  public static getButtons(g: any, width: number): DiepButton[] {
    const startX = (width / 2) - ((this.tabs.length - 1) * this.tabSpacing) / 2;

    return this.tabs.map((tab, i) => ({
      id: `quad-tab-${tab}`,
      label: '', 
      x: startX + (i * this.tabSpacing) - 55,
      y: this.tabY - 10,
      w: 110,
      h: 40,
      color: 'transparent',
      borderColor: 'transparent',
      hidden: true,
      action: () => { this.activeTabIndex = i; }
    }));
  }

  public static handleInput(g: any): void {
    if (g.keys['d'] || g.keys['D'] || g.keys['arrowright']) {
      this.activeTabIndex = (this.activeTabIndex + 1) % this.tabs.length;
      g.keys['d'] = g.keys['D'] = g.keys['arrowright'] = false;
    }
    if (g.keys['a'] || g.keys['A'] || g.keys['arrowleft']) {
      this.activeTabIndex = (this.activeTabIndex - 1 + this.tabs.length) % this.tabs.length;
      g.keys['a'] = g.keys['A'] = g.keys['arrowleft'] = false;
    }
  }
}