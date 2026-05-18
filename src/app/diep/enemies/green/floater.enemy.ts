import { Enemy, Player, Bullet } from '../../core/diep.interfaces';

export class FloaterEnemy {

    public static metadata = {
        name: 'Floater',
        faction: 'Green',
        description: 'A volatile bio-hazard unit that emits a toxic aura and bursts into corrosive puddles upon death.'
    };

    public static create(x: number, y: number): Partial<Enemy> {
        const randomBodySize = Math.floor(Math.random() * (50 - 25 + 1)) + 25;
        const toxicRange = Math.floor(Math.random() * (50 - 25 + 1)) + 100;

        return {
            x, y, 
            radius: randomBodySize,
            color: '#00E673',
            health: (randomBodySize * 4),
            maxHealth: (randomBodySize * 4),
            scoreValue: (randomBodySize * 2),
            type: 'FLOATER',
            isPassive: false, 
            onSpawn: (enemy: any, canvasWidth: number, canvasHeight: number) => {
                enemy.targetX = Math.random() * canvasWidth;
                enemy.targetY = Math.random() * canvasHeight;
            },
            onUpdate: (enemy: any, player: Player, deltaTime: number) => {
                if (enemy.deathTimer !== undefined) {
                    enemy.deathTimer -= deltaTime;
                    if (enemy.deathTimer <= 0) enemy.health = 0;
                    return;
                }

                const dx = enemy.x - player.x;
                const dy = enemy.y - player.y;
                if (Math.sqrt(dx * dx + dy * dy) < enemy.radius + toxicRange) {
                    player.health -= 0.5 * (deltaTime / 16.66);
                }
            },
            onHit: (enemies: Enemy[], _spawner: any, bullet: Bullet) => {
                FloaterEnemy.spawnPuddleLogic(enemies, bullet.x, bullet.y, randomBodySize);
            },
            onDeath: (enemies: Enemy[], spawner: any, deadEnemy: any) => {
                if (deadEnemy.deathTimer === undefined) {
                    deadEnemy.isPassive = true;          
                    deadEnemy.deathTimer = 350;  
                    deadEnemy.health = 1;                 
                    
                    const puddleCount = Math.floor(Math.random() * 4) + 5;
                    for (let i = 0; i < puddleCount; i++) {
                        FloaterEnemy.spawnPuddleLogic(
                            enemies, 
                            deadEnemy.x + (Math.random() - 0.5) * 160, 
                            deadEnemy.y + (Math.random() - 0.5) * 160, 
                            deadEnemy.radius
                        );
                    }
                }
            }
        };
    }

    private static spawnPuddleLogic(enemies: Enemy[], x: number, y: number, baseRadius: number): void {
        const puddle: Enemy = {
            id: Math.random().toString(36).substring(2, 9),
            x, y, vx: 0, vy: 0, mass: 0, bodyDamage: 0, scoreValue: 0,
            radius: Math.floor(Math.random() * (baseRadius * 0.8 - 10 + 1)) + 10,
            color: '#33cc3333',
            health: 1, maxHealth: 1,
            type: 'FLOATER', isGhost: true, isPassive: true, 
            spawnTime: Date.now(),
            lifespan: 12000 + (Math.random() * 5000),
            targetX: x, targetY: y,
            onUpdate: (p: any, player: Player, deltaTime: number) => {
                const dx = p.x - player.x;
                const dy = p.y - player.y;
                if (Math.sqrt(dx * dx + dy * dy) < p.radius) {
                    player.health -= 0.35 * (deltaTime / 16.66);
                }
                if (Date.now() - p.spawnTime > p.lifespan) p.health = 0; 
            }
        };
        enemies.push(puddle);
    }

    public static update(enemy: Enemy, player: Player, deltaTime: number, currentTime: number, moveTowards: Function): void {
        if ((enemy as any).deathTimer !== undefined) return;
        const tx = (enemy as any).targetX ?? enemy.x;
        const ty = (enemy as any).targetY ?? enemy.y;
        moveTowards(enemy, deltaTime, tx, ty, (tx === enemy.x && ty === enemy.y) ? 0 : 0.5);
    }

    public static draw(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
        const timeFactor = Date.now();
        const tx = (enemy as any).targetX ?? enemy.x;
        const ty = (enemy as any).targetY ?? enemy.y;

        if (tx === enemy.x && ty === enemy.y) {
            const rem = (enemy as any).lifespan - (timeFactor - (enemy as any).spawnTime);
            let r = enemy.radius + Math.sin(timeFactor / 400) * 2;
            if (rem < 1500) r *= Math.max(0, rem / 1500);

            if (r > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, r, 0, Math.PI * 2);
                const grad = ctx.createRadialGradient(enemy.x, enemy.y, r * 0.85, enemy.x, enemy.y, r);
                grad.addColorStop(0, 'rgba(46, 204, 113, 0.35)'); 
                grad.addColorStop(1, 'rgba(46, 204, 113, 0)');    
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.restore();
            }
            return;
        }

        if ((enemy as any).deathTimer !== undefined) {
            const p = (350 - (enemy as any).deathTimer) / 350; 
            ctx.save();
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius * (1 + p * 0.6), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 230, 115, ${(1 - p) * 0.7})`;
            ctx.fill();
            
            ctx.fillStyle = `rgba(0, 230, 115, ${1 - p})`;
            const dist = enemy.radius * (0.45 + p * 1.8);
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI * 2 * i) / 6 + (p * 1.5);
                ctx.beginPath();
                ctx.arc(enemy.x + dist * Math.cos(a), enemy.y + dist * Math.sin(a), Math.max(2, enemy.radius * 0.12 * (1 - p)), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.beginPath();
        const auraR = enemy.radius + 130 + Math.sin(timeFactor / 800) * 22 + Math.cos(timeFactor / 350) * 4;
        ctx.arc(enemy.x, enemy.y, auraR, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(enemy.x, enemy.y, enemy.radius * 0.3, enemy.x, enemy.y, auraR);
        gradient.addColorStop(0, 'rgba(0, 230, 115, 0.22)'); 
        gradient.addColorStop(0.5, 'rgba(51, 204, 51, 0.08)');
        gradient.addColorStop(1, 'rgba(51, 204, 51, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00E673'; 
        ctx.fill();
        ctx.strokeStyle = '#007e3f';
        ctx.lineWidth = 5 + Math.sin(timeFactor / 800); 
        ctx.stroke();
        ctx.restore();
    }
}