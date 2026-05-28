import { Injectable } from '@angular/core';
import { Player, Bullet, Enemy, HighScore, TrailSegment, DifficultyMode, GameSystem } from '../core/diep.interfaces';
import { DiepTimeManager } from '../core/diep.time-manager';
import { DiepProjectileService } from './subsystems/diep.projectile.service';
import { DiepCollisionService } from './subsystems/diep.collision.service';
import { DiepPlayerService } from './subsystems/diep.player.service';
import { DiepEnemyService } from '../enemies/diep.enemy.service';
import { DiepWaveManagerService } from './subsystems/arena/arena.wave-manager';
import { DiepArenaManager } from './subsystems/arena/arena.manager';
import { DiepFloorDirector } from './subsystems/arena/arena.floor-director.service';
import { DiepDeathAnimationService } from './subsystems/diep.death-animation.service';
import { DiepArenaResetService } from './subsystems/arena/arena.reset';
import { DiepPlayerUpgradesService } from './subsystems/player-upgrades/diep.player-upgrades.service';
import { AchievementService } from '../core/diep.achievement.service';
import { HighScoresService } from '../core/diep.high-scores.service';
import { EnemySpawnerService } from '../enemies/diep.enemy-spawner';

@Injectable({ providedIn: 'root' })
export class DiepGameEngineService {
    public width = 800;
    public height = 600;
    public player: Player;
    public bullets: Bullet[] = [];
    public enemies: Enemy[] = [];
    public toxicTrails: TrailSegment[] = [];
    public keys: { [key: string]: boolean } = {};
    public score = 0;
    public sessionKills = 0; 
    public showingQuadrivium = false;
    public showingAchievements = false;
    public gameOver = false;
    public isPaused = false;
    public isDarkMode = true;
    public isStartingNewGame = false;
    public lastAngle = 0;
    public mouseAiming = true;
    public mousePos = { x: 0, y: 0 };
    public mouseDown = false;
    public isGameStarted = false;
    public topScores: HighScore[] = [];

    public currentDifficulty: DifficultyMode = 'MEDIUM';
    public persistentXp = 0;

    private animationFrameId: number | null = null;
    private lastTime: number = 0;
    public onRenderCallback: () => void = () => {};

    public arenaEnabled = true;

    private systems: GameSystem[] = [];

    constructor(
        public spawner: EnemySpawnerService,
        public highScoresService: HighScoresService,
        public projectileService: DiepProjectileService,
        public playerService: DiepPlayerService,
        public collisionService: DiepCollisionService,
        public enemyService: DiepEnemyService,
        public waveManager: DiepWaveManagerService,
        public achievementService: AchievementService,
        private upgradeService: DiepPlayerUpgradesService,
        public arenaManager: DiepArenaManager,
        public hazardDirector: DiepFloorDirector,
        public arenaReset: DiepArenaResetService,
        public deathAnimation: DiepDeathAnimationService
    ) {
        this.player = this.playerService.getDefaultPlayer(this.currentDifficulty, this.persistentXp);
        this.topScores = this.highScoresService.getHighScores();
        this.arenaManager.init(this.width, this.height);
        this.arenaReset.transition.fadeIn();

        this.systems = [
            this.projectileService
        ];
    }

    public startTicker(renderFn: () => void) {
        this.onRenderCallback = renderFn;
        this.lastTime = performance.now();
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.ticker(this.lastTime);
    }

    private ticker = (time: number) => {
        const isLogicPaused = this.isPaused || (this.gameOver && this.deathAnimation.deathAnimationTimeStart === null);
        DiepTimeManager.update(isLogicPaused, time);

        this.update();
        this.onRenderCallback();

        this.animationFrameId = requestAnimationFrame(this.ticker);
    }

    public update() {
        const F = DiepTimeManager.gameTick;
        
        this.arenaReset.updateTransition();

        for (const system of this.systems) {
            system.update(this, F, DiepTimeManager.gameMs);
        }

        if (this.isGameStarted && !this.isPaused && !this.gameOver) {
            this.hazardDirector.update(DiepTimeManager.gameMs, this.width, this.height);
        }

        if (this.gameOver && this.deathAnimation.deathAnimationTimeStart) {
            this.deathAnimation.handleDeathAnimation(Date.now());
        }

        if (!this.isGameStarted || this.isPaused || this.gameOver) return;

        const playerUpdate = this.playerService.update(this.player, this.keys, this.mousePos, this.mouseAiming, this.width, this.height, F, DiepTimeManager.gameMs);
        this.lastAngle = playerUpdate.lastAngle;
        
        if (this.collisionService.handleEnvironmentCollision(this.player)) {
            this.deathAnimation.handleGameOver(this);
            return;
        }

        if (this.player.health > 0) {
            if (!this.isStartingNewGame) {
                this.enemyService.updateAI(this.enemies, this.bullets, this.player, DiepTimeManager.gameMs, this.width, this.height);
                this.enemies.forEach(e => this.collisionService.handleEnvironmentCollision(e));
            } else {
                this.isStartingNewGame = false;
            }
        }

        const col = this.collisionService.handleCollisions(this.player, this.bullets, this.enemies, (e: Enemy) => this.upgradeService.processKillRewards(this, e));
        this.bullets = col.bullets;
        this.enemies = col.enemies;

        if (this.player.health <= 0) {
            this.deathAnimation.handleGameOver(this);
            return;
        }

        this.enemies = this.enemyService.cleanup(this.enemies, this.width, this.height);
        this.waveManager.updateWaves(this.enemies, this.width, this.height);
        this.achievementService.updateProgress('WAVE', this.waveManager.waveCount);
        this.player.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.x));
        this.player.y = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.player.y));
    }

    public resetState(startGameImmediately: boolean) {
        this.arenaReset.resetState(this, startGameImmediately);
    }

    public togglePause() { 
        if (!this.gameOver && this.isGameStarted) {
            this.isPaused = !this.isPaused;
            if (!this.isPaused) this.startTicker(this.onRenderCallback);
        }
        return this.isPaused; 
    }

    public toggleDarkMode() { this.isDarkMode = !this.isDarkMode; }
    
    public getVisibleEnemies(): Enemy[] {
        return this.deathAnimation.getVisibleEnemies(this.enemies);
    }
}