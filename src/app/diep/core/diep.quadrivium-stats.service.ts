// src/app/diep/core/diep.quadrivium-stats.service.ts
import { Injectable } from '@angular/core';

export interface LifetimeStats {
  playtime: number;       // Accumulates total seconds elapsed
  totalKills: number;     // Lifetime entity breakdowns
  shotsFired: number;     // Track accuracy
  shotsHit: number;
  upgradesSpent: number;
  factionKills: Record<string, number>;
}

@Injectable({ providedIn: 'root' })
export class QuadriviumStatsService {
  private readonly STORAGE_KEY = 'diep_quadrivium_telemetry';
  
  public stats: LifetimeStats = {
    playtime: 0,
    totalKills: 0,
    shotsFired: 0,
    shotsHit: 0,
    upgradesSpent: 0,
    factionKills: { 'Red': 0, 'Orange': 0, 'Yellow': 0, 'Green': 0, 'Blue': 0, 'Purple': 0 }
  };

  constructor() {
    this.load();
  }

  public recordKill(faction: string): void {
    this.stats.totalKills++;
    if (faction) {
      const formatted = faction.charAt(0).toUpperCase() + faction.slice(1).toLowerCase();
      if (this.stats.factionKills[formatted] !== undefined) {
        this.stats.factionKills[formatted]++;
      }
    }
    this.save();
  }

  public trackTime(seconds: number): void {
    if (seconds > 0) {
      this.stats.playtime += seconds;
      this.save();
    }
  }

  private save(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.stats));
  }

  private load(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      this.stats = { ...this.stats, ...parsed };
    } catch (e) {
      console.error('Error hydrating telemetry payload:', e);
    }
  }
}