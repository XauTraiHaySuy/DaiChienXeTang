// js/bullet.js - Bullet Logic with 4s Lifetime Limit & Max 3 Active Limit

class Bullet {
    constructor(x, y, angle, owner) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.speed = 7.0;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.owner = owner; // Tank instance owner
        this.alive = true;
        this.hasBounced = false; // Flag to track if bullet has ricocheted off a wall

        // Requirement: Bullets disappear after 4 seconds (240 frames at 60fps)
        this.maxLife = 240; 
        this.life = this.maxLife;

        // Trail positions
        this.trail = [];
    }

    update() {
        if (!this.alive) return;
        this._predictedPoints = null;

        // Countdown 4-second life limit
        this.life--;
        if (this.life <= 0) {
            this.alive = false;
            createExpireEffect(this.x, this.y);
            return;
        }

        // Save trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 6) this.trail.shift();

        // Sub-stepping for ultra-precise collision detection & bouncing
        const steps = 4;
        const subVx = this.vx / steps;
        const subVy = this.vy / steps;

        for (let s = 0; s < steps; s++) {
            this.x += subVx;
            this.y += subVy;

            // Electric Pylons & Laser Walls Collision for Bullet in Map 4
            if (typeof currentMapIndex !== 'undefined' && currentMapIndex === 3 && typeof checkElectricWallCollideAt === 'function') {
                if (checkElectricWallCollideAt(this.x, this.y, this.radius)) {
                    this.hasBounced = true;
                    this.vx = -this.vx;
                    this.vy = -this.vy;
                    if (typeof createSparks === 'function') createSparks(this.x, this.y);
                    if (typeof audio !== 'undefined' && audio.playBounce) audio.playBounce();
                    break;
                }
            }

            // Wall Collision & Bouncing
            for (const wall of walls) {
                if (this.checkWallCollision(wall)) {
                    this.bounceFromWall(wall, subVx, subVy);
                    createSparks(this.x, this.y);
                    break;
                }
            }
        }
    }

    checkWallCollision(wall) {
        return (
            this.x + this.radius > wall.x &&
            this.x - this.radius < wall.x + wall.w &&
            this.y + this.radius > wall.y &&
            this.y - this.radius < wall.y + wall.h
        );
    }

    bounceFromWall(wall, subVx, subVy) {
        this.hasBounced = true;
        const prevX = this.x - subVx;
        const prevY = this.y - subVy;

        const hitLeft = prevX + this.radius <= wall.x;
        const hitRight = prevX - this.radius >= wall.x + wall.w;
        const hitTop = prevY + this.radius <= wall.y;
        const hitBottom = prevY - this.radius >= wall.y + wall.h;

        if (hitLeft) {
            this.vx = -Math.abs(this.vx);
            this.x = wall.x - this.radius;
        } else if (hitRight) {
            this.vx = Math.abs(this.vx);
            this.x = wall.x + wall.w + this.radius;
        } else if (hitTop) {
            this.vy = -Math.abs(this.vy);
            this.y = wall.y - this.radius;
        } else if (hitBottom) {
            this.vy = Math.abs(this.vy);
            this.y = wall.y + wall.h + this.radius;
        } else {
            this.vx = -this.vx;
            this.vy = -this.vy;
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        const isPlayer = this.owner && this.owner.isPlayer;
        const mainColor = isPlayer ? '#38bdf8' : '#ef4444';
        const glowColor = isPlayer ? '#0284c7' : '#dc2626';

        // Draw Bullet Motion Trail
        ctx.save();
        for (let i = 0; i < this.trail.length; i++) {
            const p = this.trail[i];
            const ratio = (i + 1) / this.trail.length;
            ctx.globalAlpha = ratio * 0.4 * (this.life / this.maxLife);
            ctx.fillStyle = mainColor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, this.radius * ratio * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Draw Main Glowing Bullet (Dual-Layer Glow for 60 FPS performance without shadowBlur)
        ctx.save();
        ctx.globalAlpha = Math.min(1, (this.life / 20)); // Fade out near end of 4s
        
        // Outer Glow Circle (Lightweight vector glow)
        ctx.fillStyle = isPlayer ? 'rgba(56, 189, 248, 0.35)' : 'rgba(239, 68, 68, 0.35)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 1.7, 0, Math.PI * 2);
        ctx.fill();

        // Main Bullet Body
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner Core Flash
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

const bullets = [];

// Helper to count active bullets owned by a specific tank
function getActiveBulletsCount(tank) {
    return bullets.filter(b => b.alive && b.owner === tank).length;
}
