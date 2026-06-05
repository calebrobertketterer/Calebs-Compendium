// src/app/diep/engine/subsystems/diep.weapon-controller.ts
import { Injectable } from '@angular/core';
import { Player, Bullet } from '../../core/diep.interfaces';
import { DiepTimeManager } from '../../core/diep.time-manager';
import { DiepStatsService } from '../../core/diep.stats.service';

@Injectable({
    providedIn: 'root'
})
export class DiepWeaponController {
    private shotTimer = 0;

    constructor(private diepStatsService: DiepStatsService) {}

    /**
     * Evaluates firing conditions and appends weapon projectiles with recoil force application.
     */
    public shootBullet(
        player: Player, 
        mousePos: { x: number; y: number }, 
        mouseAiming: boolean, 
        lastAngle: number, 
        bullets: Bullet[]
    ): void {
        this.shotTimer += DiepTimeManager.gameMs;
        
        const fireDelay = 1000 / player.fireRate;

        if (this.shotTimer < fireDelay) return;
        
        this.shotTimer = 0; 

        const angle = mouseAiming 
            ? Math.atan2(mousePos.y - player.y, mousePos.x - player.x) 
            : lastAngle;
            
        const barrelLength = player.radius * 2.0;
        const radius = 7.5;
        
        const bulletMass = (Math.pow(radius, 2) * Math.PI) * (player.bulletHealth * 0.001);
        const recoilForce = (bulletMass * player.bulletSpeed) / player.mass;

        player.vx -= Math.cos(angle) * recoilForce;
        player.vy -= Math.sin(angle) * recoilForce;

        bullets.push({
            id: Math.random().toString(36).substr(2, 9),
            x: player.x + Math.cos(angle) * barrelLength,
            y: player.y + Math.sin(angle) * barrelLength,
            dx: Math.cos(angle) * player.bulletSpeed,
            dy: Math.sin(angle) * player.bulletSpeed,
            radius: radius,
            mass: bulletMass,
            color: player.color,
            ownerType: 'PLAYER',
            health: player.bulletHealth,
            maxHealth: player.bulletHealth,
            damage: player.bulletDamage,
            isFlying: true,
            isGhost: false,
        });

        this.diepStatsService.recordShotFired();
    }

    public resetCooldown(): void {
        this.shotTimer = 1000;
    }
}