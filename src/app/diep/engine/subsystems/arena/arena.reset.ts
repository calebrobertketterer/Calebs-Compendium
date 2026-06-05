// src/app/diep/engine/subsystems/arena/arena.reset.ts
import { Injectable } from '@angular/core';
import { TransitionManager } from '../../../ui/diep.transition-manager';
import { DiepTimeManager } from '../../../core/diep.time-manager';
import { DiepWeaponController } from '../diep.weapon-controller';

@Injectable({ providedIn: 'root' })
export class DiepArenaResetService {
    public transition = new TransitionManager();

    constructor(private weaponController: DiepWeaponController) {
        this.transition.fadeIn();
    }

    public updateTransition() {
        this.transition.update(DiepTimeManager.uiTick * 16.67);
    }

    public startNewGame(engine: any) {
        this.transition.fadeOut(() => {
            this.resetState(engine, true);
            engine.waveManager.startFirstWave(engine.enemies, engine.width, engine.height);
        });
        engine.startTicker(engine.onRenderCallback);
    }

    public restartGame(engine: any) {
        this.transition.fadeOut(() => {
            this.resetState(engine, true);
            engine.waveManager.startFirstWave(engine.enemies, engine.width, engine.height);
        });
        engine.startTicker(engine.onRenderCallback);
    }

    public exitToMenu(engine: any) {
        this.transition.fadeOut(() => {
            this.resetState(engine, false);
        });
        engine.startTicker(engine.onRenderCallback);
    }

    public resetState(engine: any, startGameImmediately: boolean) {
        const activePlayer = engine.playerService.player;
        if (activePlayer) { 
            engine.persistentXp = activePlayer.progression.totalXpEarned; 
        }
        
        engine.playerService.initializePlayer(engine.currentDifficulty, engine.persistentXp);
        engine.bullets = []; 
        engine.enemies = []; 
        engine.toxicTrails = [];
        engine.score = 0; 
        engine.sessionKills = 0; 
        engine.gameOver = false; 
        engine.isPaused = false;
        engine.lastAngle = 0; 
        engine.isGameStarted = startGameImmediately;
        engine.isStartingNewGame = startGameImmediately;
        
        engine.waveManager.reset();
        this.weaponController.resetCooldown();
        engine.topScores = engine.highScoresService.getHighScores();
        engine.arenaManager.init(engine.width, engine.height);
        engine.deathAnimation.reset();

        // Safe telemetry registration when an active match sequence begins
        if (startGameImmediately && engine.diepStatsService) {
            engine.diepStatsService.recordGameStarted();
        }
    }
}