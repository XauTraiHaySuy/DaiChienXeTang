// js/particle.js - Particle & Visual Effects Engine

class Particle {
    constructor(x, y, color, vx, vy, size, life, shape = 'circle') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.initialSize = size;
        this.maxLife = life;
        this.life = life;
        this.shape = shape;
        this.rotation = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.96;
        this.vy *= 0.96;
        this.rotation += this.vRot;
        this.life--;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;

        if (this.shape === 'circle') {
            const currentSize = Math.max(0, this.size * (this.life / this.maxLife));
            ctx.beginPath();
            ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'rect') {
            const sz = this.size;
            ctx.fillRect(-sz/2, -sz/2, sz, sz);
        } else if (this.shape === 'ring') {
            const radius = (1 - alpha) * this.size * 2 + 5;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}

class TrackMark {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.life = 400; // Persists for ~6.6 seconds
        this.maxLife = 400;
    }

    update() {
        this.life--;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = `rgba(15, 23, 42, ${0.4 * (this.life / this.maxLife)})`;
        // Draw pair of tread lines
        ctx.fillRect(-12, -14, 5, 28);
        ctx.fillRect(7, -14, 5, 28);
        ctx.restore();
    }
}

const particles = [];
const trackMarks = [];
let screenShakeTimer = 0;
let screenShakeIntensity = 0;

function triggerScreenShake(intensity = 8, duration = 15) {
    screenShakeIntensity = intensity;
    screenShakeTimer = duration;
}

function createMuzzleFlash(x, y, angle, isPlayer = true) {
    const color = isPlayer ? '#38bdf8' : '#f87171';
    for (let i = 0; i < 10; i++) {
        const spread = (Math.random() - 0.5) * 0.6;
        const speed = Math.random() * 4 + 2;
        const vx = Math.cos(angle + spread) * speed;
        const vy = Math.sin(angle + spread) * speed;
        particles.push(new Particle(x, y, color, vx, vy, Math.random() * 4 + 2, 12, 'circle'));
    }
    // Smoke
    for (let i = 0; i < 5; i++) {
        const vx = Math.cos(angle) * Math.random() * 2;
        const vy = Math.sin(angle) * Math.random() * 2;
        particles.push(new Particle(x, y, '#64748b', vx, vy, Math.random() * 6 + 4, 20, 'circle'));
    }
}

function createSparks(x, y) {
    audio.playBounce();
    for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        particles.push(new Particle(x, y, '#facc15', vx, vy, Math.random() * 2.5 + 1, 14, 'circle'));
    }
}

function createExpireEffect(x, y) {
    audio.playExpire();
    for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 0.5;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        particles.push(new Particle(x, y, '#94a3b8', vx, vy, Math.random() * 3 + 2, 15, 'circle'));
    }
}

function createExplosion(x, y, isBig = true) {
    audio.playExplosion();
    triggerScreenShake(isBig ? 12 : 6, 20);

    // Shockwave ring
    particles.push(new Particle(x, y, '#ffaa00', 0, 0, 40, 22, 'ring'));

    // Fire particles
    const fireColors = ['#ff2200', '#ff6600', '#ffcc00', '#ffffff'];
    const count = isBig ? 65 : 30;

    for (let i = 0; i < count; i++) {
        const color = fireColors[Math.floor(Math.random() * fireColors.length)];
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * (isBig ? 8 : 4) + 1;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const size = Math.random() * (isBig ? 9 : 5) + 3;
        particles.push(new Particle(x, y, color, vx, vy, size, Math.random() * 25 + 20, Math.random() > 0.3 ? 'circle' : 'rect'));
    }

    // Heavy Smoke
    for (let i = 0; i < 25; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 0.5;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        particles.push(new Particle(x, y, '#334155', vx, vy, Math.random() * 12 + 6, 45, 'circle'));
    }
}
