// src/app/diep/engine/subsystems/player/diep.player.service.ts
import { Injectable } from '@angular/core';
import { Player, DifficultyMode, GameSystem } from '../../../core/diep.interfaces';
import { DiepPlayerUpgradesService } from './player-upgrades/diep.player-upgrades.service';
import { DiepGameEngineService } from '../../diep.game-engine.service';

@Injectable({ providedIn: 'root' })
export class DiepPlayerService implements GameSystem {
    // This is now the definitive single-source-of-truth for the active player state.
    public player!: Player;

    constructor(private upgradeService: DiepPlayerUpgradesService) {}

    /**
     * Clean encapsulation getter to monitor player death without leaking health logic checks.
     */
    public get isPlayerDead(): boolean {
        return this.player ? this.player.health <= 0 : false;
    }

    /**
     * Initializes the internal player entity state.
     */
    public initializePlayer(difficulty: DifficultyMode = 'MEDIUM', carryOverXp: number = 0): void {
        this.player = { 
            x: 400, y: 300, vx: 0, vy: 0, 
            radius: 20, 
            mass: 25,
            angle: 0, 
            maxSpeed: 3, 
            color: '#3498db', 
            health: 100, maxHealth: 100,
            healthRegen: .5, 
            fireRate: 5, 
            bodyDamage: 20,
            bulletDamage: 10,
            bulletHealth: 10,
            bulletSpeed: 7.5,
            upgrades: {},
            progression: this.upgradeService.getDefaultProgression(difficulty, carryOverXp),
            
            inventory: {
                maxSlots: 16,
                pixels: 1337, // Playtesting starter balance
                slots: [
                    {
                        id: 'plasma_thruster',
                        name: 'Plasma Thruster',
                        description: 'A customized engine nozzle that emits glowing neon heat trails.',
                        quantity: 1,
                        maxStack: 1,
                        type: 'CHASSIS_PERK',
                        drawIllustration: (ctx, x, y, size, frame) => {
                            const cx = x + size / 2;
                            const cy = y + size / 2;
                            
                            // Pulse animation vector calculations
                            const pulse = Math.sin(frame * 0.08) * 4;

                            // Core Thruster nozzle housing
                            ctx.fillStyle = '#7f8c8d';
                            ctx.strokeStyle = '#34495e';
                            ctx.lineWidth = 3;
                            ctx.beginPath();
                            ctx.moveTo(cx - 15, cy + 10);
                            ctx.lineTo(cx + 15, cy + 10);
                            ctx.lineTo(cx + 8, cy - 15);
                            ctx.lineTo(cx - 8, cy - 15);
                            ctx.closePath();
                            ctx.fill();
                            ctx.stroke();

                            // Plasma Fire plume output
                            ctx.fillStyle = 'rgba(52, 152, 219, 0.8)';
                            ctx.beginPath();
                            ctx.arc(cx, cy + 16, 8 + pulse, 0, Math.PI * 2);
                            ctx.fill();

                            ctx.fillStyle = '#ffffff';
                            ctx.beginPath();
                            ctx.arc(cx, cy + 14, 4 + pulse * 0.5, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    },
                    {
                        id: 'cyclone_barrel',
                        name: 'Cyclone Barrel',
                        description: 'A heavy, reinforced dual-bore assembly built to spiral fire.',
                        quantity: 1,
                        maxStack: 1,
                        type: 'ATTACHMENT',
                        drawIllustration: (ctx, x, y, size, frame) => {
                            const cx = x + size / 2;
                            const cy = y + size / 2;
                            
                            // Rotational speed tracking scalar
                            const rotation = (frame * 0.04) % (Math.PI * 2);

                            ctx.save();
                            ctx.translate(cx, cy);
                            ctx.rotate(rotation);

                            ctx.fillStyle = '#95a5a6';
                            ctx.strokeStyle = '#2c3e50';
                            ctx.lineWidth = 3;

                            // Render two split offset barrel layouts
                            ctx.fillRect(-14, -18, 8, 36);
                            ctx.strokeRect(-14, -18, 8, 36);

                            ctx.fillRect(6, -18, 8, 36);
                            ctx.strokeRect(6, -18, 8, 36);

                            // Central node anchor ring
                            ctx.fillStyle = '#e74c3c';
                            ctx.beginPath();
                            ctx.arc(0, 0, 6, 0, Math.PI * 2);
                            ctx.fill();

                            ctx.restore();
                        }
                    }
                ]
            }
        };
    }

    /**
     * Implementation of GameSystem interface.
     * Evaluates keyboard physics forces, friction limits, mouse aiming tracking, and regeneration increments.
     */
    public update(engine: DiepGameEngineService, F: number, ms: number): void {
        if (!engine.isGameStarted || engine.isPaused || engine.gameOver) return;

        const results = this.updatePlayerPhysics(
            this.player,
            engine.keys,
            engine.mousePos,
            engine.mouseAiming,
            engine.width,
            engine.height,
            F,
            ms
        );

        engine.lastAngle = results.lastAngle;
    }

    public updatePlayerPhysics(
        player: Player,
        keys: { [key: string]: boolean },
        mousePos: { x: number; y: number },
        mouseAiming: boolean,
        width: number,
        height: number,
        F: number,
        deltaTime: number
    ): { lastAngle: number } {
        let lastAngle = player.angle;
        const FRICTION = Math.pow(0.9, F); 
        const ACCELERATION = 0.5 * F;

        if (keys['w']) player.vy -= ACCELERATION;
        if (keys['s']) player.vy += ACCELERATION;
        if (keys['a']) player.vx -= ACCELERATION;
        if (keys['d']) player.vx += ACCELERATION;

        player.x += player.vx * F;
        player.y += player.vy * F;

        player.vx *= FRICTION;
        player.vy *= FRICTION;

        const currentSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
        if (currentSpeed > player.maxSpeed) {
            const ratio = player.maxSpeed / currentSpeed;
            player.vx *= ratio;
            player.vy *= ratio;
        }

        if (mouseAiming) {
            player.angle = Math.atan2(mousePos.y - player.y, mousePos.x - player.x);
        } else if (Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1) {
            player.angle = Math.atan2(player.vy, player.vx);
        }
        lastAngle = player.angle;
        
        player.health = Math.min(player.maxHealth, player.health + (player.healthRegen * deltaTime / 1000));

        return { lastAngle };
    }
}