// src/app/diep/ui/main-menu/quadrivium/diep.quadrivium.stats-renderer.ts
import { HighScore } from '../../../core/diep.interfaces';

export class QuadriviumStatsPanelRenderer {
  
  public static drawDossier(ctx: CanvasRenderingContext2D, g: any, width: number, startY: number): void {
    const tracker = g.quadriviumStatsService?.stats || {
      playtime: 0,
      totalKills: 0,
      shotsFired: 1,
      shotsHit: 0,
      upgradesSpent: 0,
      factionKills: { 'Red': 0, 'Orange': 0, 'Yellow': 0, 'Green': 0, 'Blue': 0, 'Purple': 0 }
    };

    const containerW = Math.min(800, width - 120);
    const startX = (width - containerW) / 2;

    // --- PANEL 1: HISTORY MATRIX ---
    this.drawCardBackground(ctx, startX, startY, containerW, 160);
    
    ctx.textAlign = 'left';
    ctx.font = '900 16px Inter, sans-serif';
    ctx.fillStyle = '#9b59b6';
    ctx.fillText('PLAYER PROFILE STATISTICS', startX + 25, startY + 35);

    const accuracyRate = Math.round((tracker.shotsHit / Math.max(1, tracker.shotsFired)) * 100);
    const metrics = [
      { name: 'TIME COMBATING', value: this.formatTime(tracker.playtime) },
      { name: 'ENTITIES PURGED', value: (tracker.totalKills || 0).toLocaleString() },
      { name: 'FIRE ACCURACY', value: `${accuracyRate}%` },
      { name: 'UPGRADES APPLIED', value: (tracker.upgradesSpent || 0).toLocaleString() }
    ];

    ctx.font = 'bold 11px Inter, sans-serif';
    metrics.forEach((m, idx) => {
      const cX = startX + 25 + (idx % 2) * (containerW / 2 - 20);
      const cY = startY + 75 + Math.floor(idx / 2) * 50;

      ctx.fillStyle = '#7f8c8d';
      ctx.fillText(m.name, cX, cY);
      
      ctx.font = '900 20px Inter, sans-serif';
      ctx.fillStyle = '#ecf0f1';
      ctx.fillText(m.value, cX, cY + 24);
      ctx.font = 'bold 11px Inter, sans-serif';
    });

    // --- PANEL 2: FACTION ATTACK LOGS ---
    const panel2Y = startY + 190;
    this.drawCardBackground(ctx, startX, panel2Y, containerW, 250);

    ctx.textAlign = 'left';
    ctx.font = '900 16px Inter, sans-serif';
    ctx.fillStyle = '#9b59b6';
    ctx.fillText('PURGE MANIFEST BY FACTION', startX + 25, panel2Y + 35);

    const factions = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple'];
    const factionColors: Record<string, string> = {
      'Red': '#e74c3c', 'Orange': '#e67e22', 'Yellow': '#f1c40f',
      'Green': '#2ecc71', 'Blue': '#3498db', 'Purple': '#be7ff5'
    };

    ctx.font = 'bold 12px Inter, sans-serif';
    factions.forEach((faction, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const fX = startX + 25 + col * (containerW / 3 - 10);
      const fY = panel2Y + 80 + row * 75;

      ctx.beginPath();
      ctx.arc(fX + 6, fY - 4, 6, 0, Math.PI * 2);
      ctx.fillStyle = factionColors[faction];
      ctx.fill();

      ctx.fillStyle = '#7f8c8d';
      ctx.fillText(faction.toUpperCase(), fX + 20, fY);

      const killCount = tracker.factionKills?.[faction] || 0;

      ctx.font = '900 24px Inter, sans-serif';
      ctx.fillStyle = '#ecf0f1';
      ctx.fillText(killCount.toLocaleString(), fX + 20, fY + 28);
      ctx.font = 'bold 12px Inter, sans-serif';
    });
  }

  public static drawHighScores(ctx: CanvasRenderingContext2D, g: any, width: number, startY: number): void {
    const allTimeScores: HighScore[] = g.highScoresService?.getHighScores() || [];
    
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyScores = allTimeScores.filter(row => new Date(row.date).getTime() >= sevenDaysAgo);

    const totalContainerW = Math.min(940, width - 40); // Slightly bumped to offer comfortable space for long timestamps
    const startX = (width - totalContainerW) / 2;
    const columnW = (totalContainerW - 30) / 2;

    // Column Left: All-Time Records
    this.drawScoreTable(ctx, allTimeScores, startX, startY, columnW, 'ALL-TIME RECORDS');

    // Column Right: Weekly Records
    this.drawScoreTable(ctx, weeklyScores, startX + columnW + 30, startY, columnW, 'WEEKLY TOP SCORES (7D)');
  }

  private static drawScoreTable(ctx: CanvasRenderingContext2D, scoresList: HighScore[], x: number, y: number, w: number, title: string): void {
    this.drawCardBackground(ctx, x, y, w, 400);

    ctx.textAlign = 'left';
    ctx.font = '900 14px Inter, sans-serif';
    ctx.fillStyle = '#9b59b6';
    ctx.fillText(title, x + 25, y + 40);

    ctx.font = '900 10px Inter, sans-serif';
    ctx.fillStyle = 'rgba(155, 89, 182, 0.4)';
    ctx.fillText('RANK', x + 25, y + 75);
    ctx.fillText('ARCHIVE STAMP', x + 85, y + 75);
    ctx.textAlign = 'right';
    ctx.fillText('FINAL SCORE', x + w - 25, y + 75);

    ctx.strokeStyle = 'rgba(155, 89, 182, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 85);
    ctx.lineTo(x + w - 20, y + 85);
    ctx.stroke();

    if (scoresList.length === 0) {
      ctx.textAlign = 'center';
      ctx.font = 'italic 12px Inter, sans-serif';
      ctx.fillStyle = '#7f8c8d';
      ctx.fillText('No history files found in this frame.', x + w / 2, y + 200);
      return;
    }

    const rowHeight = 30;
    scoresList.slice(0, 10).forEach((row: HighScore, i: number) => {
      const rY = y + 112 + i * rowHeight;
      const isTop = i === 0;

      ctx.textAlign = 'left';
      ctx.font = isTop ? '900 12px Inter, sans-serif' : 'bold 12px Inter, sans-serif';
      ctx.fillStyle = isTop ? '#f1c40f' : '#ecf0f1';
      ctx.fillText(`#${i + 1}`, x + 25, rY);
      
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(this.formatDate(row.date), x + 85, rY);

      ctx.textAlign = 'right';
      ctx.font = isTop ? '900 12px Inter, sans-serif' : 'bold 12px Inter, sans-serif';
      ctx.fillStyle = isTop ? '#f1c40f' : '#ecf0f1';
      ctx.fillText((row.score || 0).toLocaleString(), x + w - 25, rY);
    });
  }

  private static drawCardBackground(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = 'rgba(20, 15, 30, 0.5)';
    ctx.strokeStyle = 'rgba(155, 89, 182, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();
  }

  private static formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }

  private static formatDate(isoString: string): string {
    if (!isoString) return 'UNKNOWN';
    try {
      const d = new Date(isoString);
      
      // Full Month Day, Year formatting
      const dateString = d.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });

      // Hour:Minute AM/PM formatting
      const timeString = d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      return `${dateString} • ${timeString}`;
    } catch (e) {
      return 'INVALID DATE';
    }
  }
}