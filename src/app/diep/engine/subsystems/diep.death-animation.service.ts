import { Injectable } from '@angular/core';
import { Enemy } from '../../core/diep.interfaces';
import { HighScoresService } from '../../core/diep.high-scores.service';

@Injectable({ providedIn: 'root' })
export class DiepDeathAnimationService {
  public deathAnimationTimeStart: number | null = null;
  public enemiesRemainingForAnimation: Enemy[] = [];

  constructor(private highScoresService: HighScoresService) {}

  public handleGameOver(engine: any): void {
    if (engine.player.health <= 0 && !engine.gameOver) {
      this.highScoresService.addHighScore(engine.score);
      engine.topScores = this.highScoresService.getHighScores();
      engine.player.health = 0;
      engine.gameOver = true;
      
      this.deathAnimationTimeStart = Date.now();
      this.enemiesRemainingForAnimation = [...engine.enemies];
      engine.enemies = [];
    }
  }

  public handleDeathAnimation(now: number): void {
    if (!this.deathAnimationTimeStart) return;
    if (now - this.deathAnimationTimeStart >= 1000) {
      this.enemiesRemainingForAnimation = [];
      this.deathAnimationTimeStart = null;
    }
  }

  public getVisibleEnemies(currentEnemies: Enemy[]): Enemy[] {
    if (this.deathAnimationTimeStart !== null) {
      const timeElapsed = Date.now() - this.deathAnimationTimeStart;
      const enemiesToDisappear = Math.floor(
        (timeElapsed / 1000) * this.enemiesRemainingForAnimation.length
      );
      return this.enemiesRemainingForAnimation.slice(enemiesToDisappear);
    }
    return currentEnemies;
  }

  public reset(): void {
    this.deathAnimationTimeStart = null;
    this.enemiesRemainingForAnimation = [];
  }
}