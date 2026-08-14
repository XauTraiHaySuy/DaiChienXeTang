// public/js/homepage.js - Canvas Background Animations & Homepage Interface Handler

class HomepageEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.active = true;
        this.tanks = [];
        this.jets = [];
        this.helicopters = [];
        this.bullets = [];
        this.particles = [];
        this.crates = [];
        this.radarAngle = 0;
        this.lastTime = 0;
        this.lastJetTime = 0;
        this.user = null;

        // --- 45s Idle Easter Egg Properties ---
        this.lastActivityTime = Date.now();
        this.idleTimeout = 45000; // 45 seconds timeout
        this.idleSeqState = 'IDLE'; // 'IDLE', 'TANKS_ENTERING', 'SHOOTING', 'TANKS_EXITING', 'REPAIRMEN_ENTERING', 'REPAIRING', 'CURSING', 'REPAIRMEN_EXITING'
        this.idleSeqTimer = 0;
        this.superTanks = [];
        this.repairmen = [];
        this.idleBullets = [];
        this.bubbles = [];
        this.firedGreen = false;
        this.firedRed = false;
        this.titleRepaired = false;
        this.titleDamagedXe = false;
        this.titleDamagedTang = false;
    }

    init() {
        this.canvas = document.getElementById('menu-bg-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.spawnInitialTanks();
        this.spawnJet();
        this.spawnHelicopter();

        this.bindEvents();
        this.checkExistingUser();

        requestAnimationFrame((t) => this.loop(t));
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        this.active = true;
        if (this.canvas) {
            this.canvas.style.display = 'block';
        }
        this.lastActivityTime = Date.now();
        this.stopIdleEasterEgg();
    }

    stop() {
        this.active = false;
        if (this.canvas) {
            this.canvas.style.display = 'none';
        }
        this.stopIdleEasterEgg();
    }

    spawnInitialTanks() {
        this.tanks = [];
        const w = this.canvas ? this.canvas.width : window.innerWidth;
        const h = this.canvas ? this.canvas.height : window.innerHeight;

        // Green Tanks (Phe Xanh - 3 xe)
        this.tanks.push({
            id: 'green-1',
            team: 'green',
            x: w * 0.1,
            y: h * 0.2,
            targetX: w * 0.4,
            targetY: h * 0.3,
            angle: Math.PI / 6,
            turretAngle: 0,
            color: '#38bdf8',
            accent: '#22c55e',
            speed: 1.5,
            lastShoot: 0,
            shootInterval: 1200,
            hp: 100
        });

        this.tanks.push({
            id: 'green-2',
            team: 'green',
            x: w * 0.15,
            y: h * 0.75,
            targetX: w * 0.45,
            targetY: h * 0.6,
            angle: -Math.PI / 4,
            turretAngle: 0,
            color: '#38bdf8',
            accent: '#22c55e',
            speed: 1.3,
            lastShoot: 500,
            shootInterval: 1400,
            hp: 100
        });

        this.tanks.push({
            id: 'green-3',
            team: 'green',
            x: w * 0.25,
            y: h * 0.45,
            targetX: w * 0.5,
            targetY: h * 0.5,
            angle: 0,
            turretAngle: 0,
            color: '#38bdf8',
            accent: '#22c55e',
            speed: 1.4,
            lastShoot: 900,
            shootInterval: 1600,
            hp: 100
        });

        // Red Tanks (Phe Đỏ - 3 xe)
        this.tanks.push({
            id: 'red-1',
            team: 'red',
            x: w * 0.9,
            y: h * 0.2,
            targetX: w * 0.6,
            targetY: h * 0.3,
            angle: Math.PI * 0.8,
            turretAngle: Math.PI,
            color: '#ef4444',
            accent: '#f87171',
            speed: 1.4,
            lastShoot: 300,
            shootInterval: 1300,
            hp: 100
        });

        this.tanks.push({
            id: 'red-2',
            team: 'red',
            x: w * 0.85,
            y: h * 0.75,
            targetX: w * 0.55,
            targetY: h * 0.6,
            angle: Math.PI * 1.2,
            turretAngle: Math.PI,
            color: '#ef4444',
            accent: '#f87171',
            speed: 1.2,
            lastShoot: 700,
            shootInterval: 1500,
            hp: 100
        });

        this.tanks.push({
            id: 'red-3',
            team: 'red',
            x: w * 0.75,
            y: h * 0.45,
            targetX: w * 0.5,
            targetY: h * 0.5,
            angle: Math.PI,
            turretAngle: Math.PI,
            color: '#ef4444',
            accent: '#f87171',
            speed: 1.3,
            lastShoot: 1100,
            shootInterval: 1700,
            hp: 100
        });
    }

    spawnJet() {
        const w = this.canvas ? this.canvas.width : window.innerWidth;
        const h = this.canvas ? this.canvas.height : window.innerHeight;
        const startY = Math.random() * (h * 0.4) + 60;
        const dir = Math.random() > 0.5 ? 1 : -1;
        const startX = dir === 1 ? -120 : w + 120;
        const speed = (Math.random() * 4 + 7) * dir;

        this.jets.push({
            x: startX,
            y: startY,
            speedX: speed,
            speedY: (Math.random() - 0.5) * 1.5,
            angle: Math.atan2((Math.random() - 0.5) * 1.5, speed),
            scale: Math.random() * 0.3 + 0.7,
            trails: []
        });
    }

    spawnHelicopter() {
        const w = this.canvas ? this.canvas.width : window.innerWidth;
        const h = this.canvas ? this.canvas.height : window.innerHeight;
        const startY = Math.random() * (h * 0.3) + (h * 0.55);
        const dir = Math.random() > 0.5 ? 1 : -1;
        const startX = dir === 1 ? -100 : w + 100;
        const speed = (Math.random() * 1.5 + 2.5) * dir;

        this.helicopters.push({
            x: startX,
            y: startY,
            speedX: speed,
            speedY: Math.sin(Date.now() / 500) * 0.5,
            rotorAngle: 0,
            color: dir === 1 ? '#38bdf8' : '#f87171'
        });
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        if (this.active && this.ctx) {
            this.update(timestamp, dt);
            this.updateIdleSequence(dt, timestamp);
            this.draw();
            this.drawSuperTanks();
            this.drawRepairmen();
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    update(timestamp, dt) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Radar rotation
        this.radarAngle += dt * 0.8;

        // Update Tanks
        this.tanks.forEach((tank) => {
            // Move tank toward target
            const dx = tank.targetX - tank.x;
            const dy = tank.targetY - tank.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 15) {
                const targetAngle = Math.atan2(dy, dx);
                let angleDiff = targetAngle - tank.angle;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                tank.angle += angleDiff * 0.05;

                tank.x += Math.cos(tank.angle) * tank.speed;
                tank.y += Math.sin(tank.angle) * tank.speed;

                // Leave track marks
                if (Math.random() < 0.3) {
                    this.particles.push({
                        type: 'track',
                        x: tank.x - Math.cos(tank.angle) * 15,
                        y: tank.y - Math.sin(tank.angle) * 15,
                        angle: tank.angle,
                        life: 1.0,
                        decay: 0.01
                    });
                }
            } else {
                // Pick new target point in their zone
                if (tank.team === 'green') {
                    tank.targetX = Math.random() * (w * 0.4) + (w * 0.05);
                    tank.targetY = Math.random() * (h * 0.7) + (h * 0.15);
                } else {
                    tank.targetX = Math.random() * (w * 0.4) + (w * 0.55);
                    tank.targetY = Math.random() * (h * 0.7) + (h * 0.15);
                }
            }

            // Aim turret at opponent team
            const enemies = this.tanks.filter(t => t.team !== tank.team);
            if (enemies.length > 0) {
                const targetEnemy = enemies[0];
                const aimAngle = Math.atan2(targetEnemy.y - tank.y, targetEnemy.x - tank.x);
                let tDiff = aimAngle - tank.turretAngle;
                while (tDiff < -Math.PI) tDiff += Math.PI * 2;
                while (tDiff > Math.PI) tDiff -= Math.PI * 2;
                tank.turretAngle += tDiff * 0.08;

                // Shoot logic
                if (timestamp - tank.lastShoot > tank.shootInterval) {
                    tank.lastShoot = timestamp;
                    this.shootBullet(tank, aimAngle);
                }
            }
        });

        // Update Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += Math.cos(b.angle) * b.speed;
            b.y += Math.sin(b.angle) * b.speed;
            b.life -= dt;

            // Smoke trail
            this.particles.push({
                type: 'smoke',
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 3 + 2,
                color: b.color,
                alpha: 0.6,
                decay: 0.04
            });

            // Hit detection with tanks or canvas bounds
            let hit = false;
            if (b.x < 0 || b.x > w || b.y < 0 || b.y > h || b.life <= 0) {
                hit = true;
            } else {
                this.tanks.forEach(tank => {
                    if (tank.team !== b.team && Math.hypot(tank.x - b.x, tank.y - b.y) < 25) {
                        hit = true;
                        this.createExplosion(b.x, b.y, b.color);
                    }
                });
            }

            if (hit) {
                this.createExplosion(b.x, b.y, b.color);
                this.bullets.splice(i, 1);
            }
        }

        // Spawn Jet periodically
        if (timestamp - this.lastJetTime > 7000) {
            this.lastJetTime = timestamp;
            this.spawnJet();
        }

        // Update Jets
        for (let i = this.jets.length - 1; i >= 0; i--) {
            const j = this.jets[i];
            j.x += j.speedX;
            j.y += j.speedY;

            // Engine vapor trail
            j.trails.push({ x: j.x, y: j.y, alpha: 0.8 });
            if (j.trails.length > 25) j.trails.shift();
            j.trails.forEach(t => t.alpha -= 0.03);

            // Drop parachute crate
            if (!j.dropped && Math.abs(j.x - w / 2) < 200 && Math.random() < 0.05) {
                j.dropped = true;
                this.crates.push({
                    x: j.x,
                    y: j.y,
                    speedY: 1.5,
                    alpha: 1.0
                });
            }

            if (j.x < -200 || j.x > w + 200) {
                this.jets.splice(i, 1);
            }
        }

        // Update Helicopters
        for (let i = this.helicopters.length - 1; i >= 0; i--) {
            const h = this.helicopters[i];
            h.x += h.speedX;
            h.y += Math.sin(timestamp / 300) * 0.8;
            h.rotorAngle += 0.4;

            if (h.x < -150 || h.x > w + 150) {
                this.helicopters.splice(i, 1);
                setTimeout(() => this.spawnHelicopter(), 5000);
            }
        }

        // Update Crates
        for (let i = this.crates.length - 1; i >= 0; i--) {
            const c = this.crates[i];
            c.y += c.speedY;
            if (c.y > h - 100) {
                c.alpha -= dt * 0.5;
                if (c.alpha <= 0) this.crates.splice(i, 1);
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            if (p.type === 'smoke' || p.type === 'fire' || p.type === 'heavy_smoke') {
                p.x += p.vx || 0;
                p.y += p.vy || 0;
                if (p.type === 'heavy_smoke') {
                    p.radius += 0.18;
                }
                p.alpha -= p.decay || 0.02;
                if (p.alpha <= 0) this.particles.splice(i, 1);
            } else if (p.type === 'track') {
                p.life -= p.decay;
                if (p.life <= 0) this.particles.splice(i, 1);
            }
        }
    }

    shootBullet(tank, angle) {
        const muzzleX = tank.x + Math.cos(angle) * 30;
        const muzzleY = tank.y + Math.sin(angle) * 30;

        this.bullets.push({
            x: muzzleX,
            y: muzzleY,
            angle: angle,
            speed: 8,
            team: tank.team,
            color: tank.team === 'green' ? '#38bdf8' : '#f87171',
            life: 3.0
        });

        // Muzzle flash particles
        for (let i = 0; i < 6; i++) {
            const pAngle = angle + (Math.random() - 0.5) * 0.6;
            const pSpeed = Math.random() * 3 + 2;
            this.particles.push({
                type: 'fire',
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(pAngle) * pSpeed,
                vy: Math.sin(pAngle) * pSpeed,
                radius: Math.random() * 4 + 2,
                color: '#facc15',
                alpha: 1.0,
                decay: 0.08
            });
        }
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 18; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1;
            this.particles.push({
                type: 'fire',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 6 + 3,
                color: Math.random() > 0.4 ? color : '#facc15',
                alpha: 1.0,
                decay: 0.03
            });
        }
    }

    draw() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Clear canvas with dark gradient
        const bgGradient = this.ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, Math.max(w, h));
        bgGradient.addColorStop(0, '#0f172a');
        bgGradient.addColorStop(0.6, '#090d16');
        bgGradient.addColorStop(1, '#030712');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, w, h);

        // Draw Tactical Grid
        this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
        this.ctx.lineWidth = 1;
        const gridSize = 60;
        for (let x = 0; x < w; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, h);
            this.ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
            this.ctx.stroke();
        }

        // Draw Radar in Top Right
        this.ctx.save();
        this.ctx.translate(w - 100, 100);
        this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 70, 0, Math.PI * 2);
        this.ctx.arc(0, 0, 45, 0, Math.PI * 2);
        this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
        this.ctx.stroke();

        // Radar Line
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(Math.cos(this.radarAngle) * 70, Math.sin(this.radarAngle) * 70);
        this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        this.ctx.stroke();
        this.ctx.restore();

        // Draw Track Marks
        this.particles.filter(p => p.type === 'track').forEach(p => {
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.angle);
            this.ctx.fillStyle = `rgba(30, 41, 59, ${p.life * 0.4})`;
            this.ctx.fillRect(-10, -8, 20, 3);
            this.ctx.fillRect(-10, 5, 20, 3);
            this.ctx.restore();
        });

        // Draw Crates
        this.crates.forEach(c => {
            this.ctx.save();
            this.ctx.globalAlpha = c.alpha;
            // Parachute lines
            this.ctx.strokeStyle = '#94a3b8';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(c.x - 15, c.y - 20);
            this.ctx.lineTo(c.x, c.y);
            this.ctx.moveTo(c.x + 15, c.y - 20);
            this.ctx.lineTo(c.x, c.y);
            this.ctx.stroke();

            // Parachute canopy
            this.ctx.fillStyle = '#facc15';
            this.ctx.beginPath();
            this.ctx.arc(c.x, c.y - 20, 18, Math.PI, 0);
            this.ctx.fill();

            // Box
            this.ctx.fillStyle = '#b45309';
            this.ctx.fillRect(c.x - 10, c.y, 20, 20);
            this.ctx.strokeStyle = '#f59e0b';
            this.ctx.strokeRect(c.x - 10, c.y, 20, 20);
            this.ctx.restore();
        });

        // Draw Tanks
        this.tanks.forEach(tank => {
            this.ctx.save();
            this.ctx.translate(tank.x, tank.y);

            // Shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.fillRect(-22, -18, 44, 36);

            // Hull Rotation
            this.ctx.save();
            this.ctx.rotate(tank.angle);

            // Tracks
            this.ctx.fillStyle = '#1e293b';
            this.ctx.fillRect(-22, -20, 44, 8);
            this.ctx.fillRect(-22, 12, 44, 8);

            // Main Body
            this.ctx.fillStyle = tank.color;
            this.ctx.fillRect(-18, -13, 36, 26);
            this.ctx.strokeStyle = tank.accent;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(-18, -13, 36, 26);

            this.ctx.restore(); // end hull

            // Turret Rotation
            this.ctx.save();
            this.ctx.rotate(tank.turretAngle);

            // Cannon Barrel
            this.ctx.fillStyle = tank.color;
            this.ctx.fillRect(0, -4, 28, 8);
            this.ctx.strokeStyle = tank.accent;
            this.ctx.strokeRect(0, -4, 28, 8);

            // Turret Dome
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 11, 0, Math.PI * 2);
            this.ctx.fillStyle = tank.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();

            this.ctx.restore(); // end turret
            this.ctx.restore(); // end tank translate
        });

        // Draw Bullets
        this.bullets.forEach(b => {
            this.ctx.save();
            this.ctx.translate(b.x, b.y);
            this.ctx.fillStyle = b.color;
            this.ctx.shadowColor = b.color;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        // Draw Jets
        this.jets.forEach(j => {
            // Vapor Trails
            j.trails.forEach(t => {
                if (t.alpha > 0) {
                    this.ctx.fillStyle = `rgba(224, 242, 254, ${t.alpha * 0.4})`;
                    this.ctx.beginPath();
                    this.ctx.arc(t.x, t.y, 4 * j.scale, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            });

            this.ctx.save();
            this.ctx.translate(j.x, j.y);
            this.ctx.rotate(j.angle);
            this.ctx.scale(j.scale, j.scale);

            // Stealth Jet Body Silhouette
            this.ctx.fillStyle = '#334155';
            this.ctx.strokeStyle = '#38bdf8';
            this.ctx.lineWidth = 1.5;

            this.ctx.beginPath();
            this.ctx.moveTo(35, 0);
            this.ctx.lineTo(-20, -25);
            this.ctx.lineTo(-10, -6);
            this.ctx.lineTo(-30, -8);
            this.ctx.lineTo(-30, 8);
            this.ctx.lineTo(-10, 6);
            this.ctx.lineTo(-20, 25);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Cockpit Glow
            this.ctx.fillStyle = '#38bdf8';
            this.ctx.beginPath();
            this.ctx.arc(10, 0, 3, 0, Math.PI * 2);
            this.ctx.fill();

            // Engine Flame
            this.ctx.fillStyle = '#f97316';
            this.ctx.fillRect(-34, -4, 6, 8);

            this.ctx.restore();
        });

        // Draw Helicopters
        this.helicopters.forEach(h => {
            this.ctx.save();
            this.ctx.translate(h.x, h.y);

            // Body
            this.ctx.fillStyle = h.color;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, 18, 10, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Tail
            this.ctx.fillRect(-28, -2, 18, 4);

            // Spinning Rotor Blades
            this.ctx.save();
            this.ctx.rotate(h.rotorAngle);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.fillRect(-35, -2, 70, 4);
            this.ctx.restore();

            this.ctx.restore();
        });

        // Draw Particles (Smoke, Heavy Smoke & Fire)
        this.particles.forEach(p => {
            if (p.type === 'smoke' || p.type === 'fire' || p.type === 'heavy_smoke') {
                this.ctx.save();
                this.ctx.globalAlpha = Math.max(0, p.alpha);
                this.ctx.fillStyle = p.color;
                if (p.type === 'heavy_smoke') {
                    this.ctx.shadowColor = p.color;
                    this.ctx.shadowBlur = 10;
                }
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        });
    }

    bindEvents() {
        // Idle timer starts when homepage loads or returns to menu.
        // Moving mouse or clicking around on menu DOES NOT reset 45s idle timer per user requirement.
        this.lastActivityTime = Date.now();

        // Auto-unlock Web Audio API on valid user gesture (click, pointerdown, touchstart, keydown)
        const unlockAudio = () => {
            if (typeof audio !== 'undefined') {
                audio.init();
                if (audio.ctx && audio.ctx.state === 'suspended') {
                    audio.ctx.resume().catch(() => {});
                }
            }
        };
        ['click', 'pointerdown', 'mousedown', 'keydown', 'touchstart'].forEach(evt => {
            window.addEventListener(evt, unlockAudio, { passive: true });
            document.addEventListener(evt, unlockAudio, { passive: true });
        });

        // Homepage Sound Test Button
        const menuSoundBtn = document.getElementById('menu-sound-btn');
        const menuSoundStatus = document.getElementById('menu-sound-status');
        if (menuSoundBtn) {
            menuSoundBtn.addEventListener('click', () => {
                unlockAudio();
                if (typeof audio !== 'undefined') {
                    audio.playTitleRepairedChime();
                }
                if (menuSoundStatus) {
                    menuSoundStatus.innerText = 'ĐÃ BẬT';
                    menuSoundStatus.style.color = '#4ade80';
                }
            });
        }

        // Co-op Modal Toggle
        const coopBtn = document.getElementById('coop-btn');
        const coopModal = document.getElementById('coop-modal');
        const coopClose = document.getElementById('coop-modal-close');

        if (coopBtn && coopModal) {
            coopBtn.addEventListener('click', (e) => {
                if (coopBtn.classList.contains('btn-locked')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                coopModal.classList.remove('hidden');
            });
        }
        if (coopClose && coopModal) {
            coopClose.addEventListener('click', () => {
                coopModal.classList.add('hidden');
            });
        }

        // Auth Modal Toggle
        const authBtn = document.getElementById('auth-btn');
        const authModal = document.getElementById('auth-modal');
        const authClose = document.getElementById('auth-modal-close');

        if (authBtn && authModal) {
            authBtn.addEventListener('click', (e) => {
                if (authBtn.classList.contains('btn-locked')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                authModal.classList.remove('hidden');
            });
        }
        if (authClose && authModal) {
            authClose.addEventListener('click', () => {
                authModal.classList.add('hidden');
            });
        }

        // Auth Tabs
        const tabLogin = document.getElementById('tab-login');
        const tabRegister = document.getElementById('tab-register');
        const formLogin = document.getElementById('form-login');
        const formRegister = document.getElementById('form-register');

        if (tabLogin && tabRegister && formLogin && formRegister) {
            tabLogin.addEventListener('click', () => {
                tabLogin.classList.add('active');
                tabRegister.classList.remove('active');
                formLogin.classList.remove('hidden');
                formRegister.classList.add('hidden');
            });

            tabRegister.addEventListener('click', () => {
                tabRegister.classList.add('active');
                tabLogin.classList.remove('active');
                formRegister.classList.remove('hidden');
                formLogin.classList.add('hidden');
            });
        }

        // Form Submission - Login
        if (formLogin) {
            formLogin.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('login-username').value.trim();
                const password = document.getElementById('login-password').value;
                const statusEl = document.getElementById('auth-status-msg');

                try {
                    statusEl.innerText = '⏳ Đang đăng nhập...';
                    statusEl.style.color = '#38bdf8';

                    const res = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    const data = await res.json();

                    if (res.ok) {
                        statusEl.innerText = '✅ Đăng nhập thành công!';
                        statusEl.style.color = '#4ade80';
                        this.user = data.user || { username };
                        localStorage.setItem('tank_user', JSON.stringify(this.user));
                        this.updateUserUI();
                        setTimeout(() => {
                            if (authModal) authModal.classList.add('hidden');
                        }, 1000);
                    } else {
                        statusEl.innerText = '❌ ' + (data.message || 'Sai tên đăng nhập hoặc mật khẩu!');
                        statusEl.style.color = '#f87171';
                    }
                } catch (err) {
                    statusEl.innerText = '❌ Không thể kết nối tới Server API';
                    statusEl.style.color = '#f87171';
                }
            });
        }

        // Form Submission - Register
        if (formRegister) {
            formRegister.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('reg-username').value.trim();
                const password = document.getElementById('reg-password').value;
                const statusEl = document.getElementById('auth-status-msg');

                try {
                    statusEl.innerText = '⏳ Đang tạo tài khoản...';
                    statusEl.style.color = '#38bdf8';

                    const res = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    const data = await res.json();

                    if (res.ok) {
                        statusEl.innerText = '🎉 Tạo tài khoản thành công! Bạn có thể đăng nhập ngay.';
                        statusEl.style.color = '#4ade80';
                        if (tabLogin) tabLogin.click();
                    } else {
                        statusEl.innerText = '❌ ' + (data.message || 'Tên đăng nhập đã tồn tại!');
                        statusEl.style.color = '#f87171';
                    }
                } catch (err) {
                    statusEl.innerText = '❌ Lỗi kết nối Server API';
                    statusEl.style.color = '#f87171';
                }
            });
        }
    }

    checkExistingUser() {
        const saved = localStorage.getItem('tank_user');
        if (saved) {
            try {
                this.user = JSON.parse(saved);
                this.updateUserUI();
            } catch (e) {
                localStorage.removeItem('tank_user');
            }
        }
    }

    updateUserUI() {
        const btnText = document.getElementById('auth-btn-text');
        const userBadge = document.getElementById('user-badge-header');

        if (this.user && this.user.username) {
            if (btnText) btnText.innerText = `👤 TÀI KHOẢN: ${this.user.username.toUpperCase()}`;
            if (userBadge) {
                userBadge.classList.remove('hidden');
                userBadge.innerText = `🎖️ Cmdr. ${this.user.username}`;
            }
        }
    }

    // ==========================================
    // --- 45S IDLE EASTER EGG SYSTEM ---
    // ==========================================
    updateIdleSequence(dt, timestamp) {
        const w = this.canvas ? this.canvas.width : window.innerWidth;
        const h = this.canvas ? this.canvas.height : window.innerHeight;
        const now = Date.now();

        // Continuous smoke plumes rising from damaged title letters "XE" and "TĂNG"
        if (this.titleDamagedXe) {
            const titleXe = document.querySelector('.title-xe');
            if (titleXe && Math.random() < 0.7) {
                const r = titleXe.getBoundingClientRect();
                this.particles.push({
                    type: 'heavy_smoke',
                    x: r.left + Math.random() * r.width,
                    y: r.top + r.height,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: -Math.random() * 2.5 - 1,
                    radius: Math.random() * 10 + 6,
                    color: Math.random() > 0.4 ? '#334155' : '#0f172a',
                    alpha: 0.85,
                    decay: 0.018
                });
            }
        }
        if (this.titleDamagedTang) {
            const titleTang = document.querySelector('.title-tang');
            if (titleTang && Math.random() < 0.7) {
                const r = titleTang.getBoundingClientRect();
                this.particles.push({
                    type: 'heavy_smoke',
                    x: r.left + Math.random() * r.width,
                    y: r.top + r.height,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: -Math.random() * 2.5 - 1,
                    radius: Math.random() * 10 + 6,
                    color: Math.random() > 0.4 ? '#475569' : '#0f172a',
                    alpha: 0.85,
                    decay: 0.018
                });
            }
        }

        // 1. Check trigger condition (45s idle)
        if (this.idleSeqState === 'IDLE') {
            if (now - this.lastActivityTime >= this.idleTimeout) {
                this.startIdleEasterEgg();
            }
            return;
        }

        this.idleSeqTimer += dt;

        // 2. TANKS_ENTERING (2 Giant Super Tanks enter from left and right)
        if (this.idleSeqState === 'TANKS_ENTERING') {
            let allArrived = true;
            this.superTanks.forEach(st => {
                const dx = st.targetX - st.x;
                if (Math.abs(dx) > 6) {
                    st.x += Math.sign(dx) * 4.5;
                    allArrived = false;

                    // Tank engine tread rumble sound
                    if (Math.random() < 0.12 && typeof audio !== 'undefined') {
                        audio.playTankEngineRumble();
                    }

                    // Diesel Exhaust & Tread Dust Particles
                    if (Math.random() < 0.6) {
                        const exhaustX = st.x - Math.cos(st.angle) * 45;
                        const exhaustY = st.y - Math.sin(st.angle) * 45;
                        this.particles.push({
                            type: 'heavy_smoke',
                            x: exhaustX,
                            y: exhaustY,
                            vx: -Math.cos(st.angle) * 1.5 + (Math.random() - 0.5),
                            vy: -Math.sin(st.angle) * 1.5 - Math.random() * 1.5,
                            radius: Math.random() * 8 + 4,
                            color: '#475569',
                            alpha: 0.7,
                            decay: 0.025
                        });
                    }
                } else {
                    st.x = st.targetX;
                }
            });

            if (allArrived) {
                this.idleSeqState = 'SHOOTING';
                this.idleSeqTimer = 0;
            }
        }

        // 3. SHOOTING (Giant Tanks fire super shells directly at "XE" and "TĂNG")
        else if (this.idleSeqState === 'SHOOTING') {
            const titleXe = document.querySelector('.title-xe');
            const titleTang = document.querySelector('.title-tang');
            const rectXe = titleXe ? titleXe.getBoundingClientRect() : { left: w * 0.44, top: 120, width: 80, height: 60 };
            const rectTang = titleTang ? titleTang.getBoundingClientRect() : { left: w * 0.56, top: 120, width: 120, height: 60 };

            const targetXeX = rectXe.left + rectXe.width / 2;
            const targetXeY = rectXe.top + rectXe.height / 2;
            const targetTangX = rectTang.left + rectTang.width / 2;
            const targetTangY = rectTang.top + rectTang.height / 2;

            // Aim turrets at target letters
            if (this.superTanks[0]) {
                this.superTanks[0].turretAngle = Math.atan2(targetXeY - this.superTanks[0].y, targetXeX - this.superTanks[0].x);
            }
            if (this.superTanks[1]) {
                this.superTanks[1].turretAngle = Math.atan2(targetTangY - this.superTanks[1].y, targetTangX - this.superTanks[1].x);
            }

            // Fire super shells at frame timings
            if (this.idleSeqTimer > 0.4 && !this.firedGreen && this.superTanks[0]) {
                this.firedGreen = true;
                this.fireSuperShell(this.superTanks[0], targetXeX, targetXeY, 'xe');
            }
            if (this.idleSeqTimer > 0.8 && !this.firedRed && this.superTanks[1]) {
                this.firedRed = true;
                this.fireSuperShell(this.superTanks[1], targetTangX, targetTangY, 'tang');
            }

            // Move flying super shells
            for (let i = this.idleBullets.length - 1; i >= 0; i--) {
                const b = this.idleBullets[i];
                b.x += Math.cos(b.angle) * b.speed;
                b.y += Math.sin(b.angle) * b.speed;

                // Heavy flame & smoke trail
                this.particles.push({
                    type: 'heavy_smoke',
                    x: b.x,
                    y: b.y,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    radius: Math.random() * 6 + 4,
                    color: b.color,
                    alpha: 0.9,
                    decay: 0.05
                });

                const dist = Math.hypot(b.targetX - b.x, b.targetY - b.y);
                if (dist < 28 || (b.angle < 0 && b.y <= b.targetY)) {
                    // Huge explosion on title!
                    this.damageTitle(b.targetType);
                    this.idleBullets.splice(i, 1);
                }
            }

            if (this.idleSeqTimer > 2.2) {
                this.idleSeqState = 'TANKS_EXITING';
                this.idleSeqTimer = 0;
                // Rotate tanks 180 degrees ("quay xe") and retreat off-screen!
                if (this.superTanks[0]) {
                    this.superTanks[0].angle = Math.PI;
                    this.superTanks[0].targetX = -350;
                }
                if (this.superTanks[1]) {
                    this.superTanks[1].angle = 0;
                    this.superTanks[1].targetX = w + 350;
                }
            }
        }

        // 4. TANKS_EXITING (Giant Tanks turn around and exit screen)
        else if (this.idleSeqState === 'TANKS_EXITING') {
            let allExited = true;
            this.superTanks.forEach(st => {
                const dx = st.targetX - st.x;
                if (Math.abs(dx) > 10) {
                    st.x += Math.sign(dx) * 6;
                    allExited = false;

                    // Tank engine tread rumble while exiting
                    if (Math.random() < 0.12 && typeof audio !== 'undefined') {
                        audio.playTankEngineRumble();
                    }

                    // Diesel exhaust smoke while exiting
                    if (Math.random() < 0.5) {
                        this.particles.push({
                            type: 'heavy_smoke',
                            x: st.x,
                            y: st.y,
                            vx: (Math.random() - 0.5) * 2,
                            vy: -Math.random() * 2,
                            radius: Math.random() * 8 + 4,
                            color: '#475569',
                            alpha: 0.7,
                            decay: 0.025
                        });
                    }
                }
            });

            if (allExited) {
                this.superTanks = [];
                this.idleSeqState = 'REPAIRMEN_ENTERING';
                this.idleSeqTimer = 0;
                this.spawnRepairmen();
            }
        }

        // 5. REPAIRMEN_ENTERING (Prominent military mechanics run out from edges with scaffolding)
        else if (this.idleSeqState === 'REPAIRMEN_ENTERING') {
            let allArrived = true;
            this.repairmen.forEach(rm => {
                const dx = rm.targetX - rm.x;
                if (Math.abs(dx) > 6) {
                    rm.x += Math.sign(dx) * 4.5;
                    rm.animFrame += 0.25;
                    allArrived = false;

                    // Footsteps running sound
                    if (Math.random() < 0.25 && typeof audio !== 'undefined') {
                        audio.playRepairmenFootsteps();
                    }
                } else {
                    rm.x = rm.targetX;
                }
            });

            if (allArrived) {
                this.idleSeqState = 'REPAIRING';
                this.idleSeqTimer = 0;
            }
        }

        // 6. REPAIRING (Mechanics weld & hammer with plasma sparks & welding smoke)
        else if (this.idleSeqState === 'REPAIRING') {
            this.repairmen.forEach(rm => {
                rm.workFrame += 0.3;

                // Welding plasma sizzle sound & hammer clink sound
                if (Math.random() < 0.35 && typeof audio !== 'undefined') {
                    audio.playWeldingSizzle();
                }
                if (Math.random() < 0.15 && typeof audio !== 'undefined') {
                    audio.playHammerHit();
                }

                // Welding spark & plasma arc smoke particles!
                if (Math.random() < 0.85) {
                    this.particles.push({
                        type: 'fire',
                        x: rm.x + (Math.random() - 0.5) * 25,
                        y: rm.y - 65 + (Math.random() - 0.5) * 20,
                        vx: (Math.random() - 0.5) * 9,
                        vy: (Math.random() - 0.5) * 9 - 3,
                        radius: Math.random() * 5 + 2,
                        color: Math.random() > 0.4 ? '#38bdf8' : '#facc15',
                        alpha: 1.0,
                        decay: 0.08
                    });

                    // Soft white welding smoke
                    this.particles.push({
                        type: 'heavy_smoke',
                        x: rm.x + (Math.random() - 0.5) * 15,
                        y: rm.y - 70,
                        vx: (Math.random() - 0.5) * 1,
                        vy: -Math.random() * 2 - 1,
                        radius: Math.random() * 6 + 3,
                        color: '#e2e8f0',
                        alpha: 0.7,
                        decay: 0.03
                    });
                }
            });

            if (this.idleSeqTimer > 2.2 && !this.titleRepaired) {
                this.titleRepaired = true;
                this.repairTitle();
            }

            if (this.idleSeqTimer > 3.2) {
                this.idleSeqState = 'CURSING';
                this.idleSeqTimer = 0;
                this.showSpeechBubbles();
            }
        }

        // 7. CURSING (Show speech bubbles "#@!$%" above repairmen)
        else if (this.idleSeqState === 'CURSING') {
            if (this.idleSeqTimer > 3.0) {
                this.removeSpeechBubbles();
                this.idleSeqState = 'REPAIRMEN_EXITING';
                this.idleSeqTimer = 0;
                // Set repairmen to run off-screen
                if (this.repairmen[0]) this.repairmen[0].targetX = -150;
                if (this.repairmen[1]) this.repairmen[1].targetX = w + 150;
            }
        }

        // 8. REPAIRMEN_EXITING (Repairmen run off-screen and reset)
        else if (this.idleSeqState === 'REPAIRMEN_EXITING') {
            let allExited = true;
            this.repairmen.forEach(rm => {
                const dx = rm.targetX - rm.x;
                if (Math.abs(dx) > 10) {
                    rm.x += Math.sign(dx) * 5.2;
                    rm.animFrame += 0.3;
                    allExited = false;

                    // Footsteps running sound while exiting
                    if (Math.random() < 0.25 && typeof audio !== 'undefined') {
                        audio.playRepairmenFootsteps();
                    }
                }
            });

            if (allExited) {
                this.stopIdleEasterEgg();
            }
        }
    }

    startIdleEasterEgg() {
        const w = this.canvas ? this.canvas.width : window.innerWidth;
        const h = this.canvas ? this.canvas.height : window.innerHeight;

        // Auto-resume audio context
        if (typeof audio !== 'undefined') {
            audio.init();
        }

        this.idleSeqState = 'TANKS_ENTERING';
        this.idleSeqTimer = 0;
        this.firedGreen = false;
        this.firedRed = false;
        this.titleRepaired = false;

        // Giant Super Green Tank (Left)
        const superGreen = {
            team: 'green',
            x: -260,
            y: h * 0.38,
            targetX: w * 0.18,
            angle: 0,
            turretAngle: 0,
            color: '#38bdf8',
            accent: '#22c55e',
            recoil: 0
        };

        // Giant Super Red Tank (Right)
        const superRed = {
            team: 'red',
            x: w + 260,
            y: h * 0.38,
            targetX: w * 0.82,
            angle: Math.PI,
            turretAngle: Math.PI,
            color: '#ef4444',
            accent: '#f87171',
            recoil: 0
        };

        this.superTanks = [superGreen, superRed];
    }

    fireSuperShell(tank, targetX, targetY, targetType) {
        tank.recoil = 22;
        const muzzleX = tank.x + Math.cos(tank.turretAngle) * 65;
        const muzzleY = tank.y + Math.sin(tank.turretAngle) * 65;

        this.idleBullets.push({
            x: muzzleX,
            y: muzzleY,
            targetX: targetX,
            targetY: targetY,
            targetType: targetType,
            angle: Math.atan2(targetY - muzzleY, targetX - muzzleX),
            speed: 18,
            color: tank.color
        });

        // Super Cannon Blast Sound FX!
        if (typeof audio !== 'undefined') {
            audio.playSuperCannonBlast();
        }

        this.createHeavyExplosion(muzzleX, muzzleY, '#facc15');
    }

    createHeavyExplosion(x, y, color) {
        // Fireball & sparks
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 2;
            this.particles.push({
                type: 'fire',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                radius: Math.random() * 8 + 4,
                color: Math.random() > 0.3 ? color : '#facc15',
                alpha: 1.0,
                decay: 0.03
            });
        }
        // Heavy smoke cloud mushroom burst
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1;
            this.particles.push({
                type: 'heavy_smoke',
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                radius: Math.random() * 15 + 10,
                color: Math.random() > 0.4 ? '#1e293b' : '#0f172a',
                alpha: 0.9,
                decay: 0.015
            });
        }
    }

    damageTitle(targetType) {
        const titleXe = document.querySelector('.title-xe');
        const titleTang = document.querySelector('.title-tang');

        // Play metallic title knockdown crash impact sound FX
        if (typeof audio !== 'undefined') {
            audio.playTitleCrash();
        }

        if (targetType === 'xe' || !targetType) {
            if (titleXe) titleXe.classList.add('title-broken-xe');
            this.titleDamagedXe = true;
            if (titleXe) {
                const r = titleXe.getBoundingClientRect();
                this.createHeavyExplosion(r.left + r.width / 2, r.top + r.height / 2, '#38bdf8');
            }
        }
        if (targetType === 'tang' || !targetType) {
            if (titleTang) titleTang.classList.add('title-broken-tang');
            this.titleDamagedTang = true;
            if (titleTang) {
                const r = titleTang.getBoundingClientRect();
                this.createHeavyExplosion(r.left + r.width / 2, r.top + r.height / 2, '#ef4444');
            }
        }
    }

    spawnRepairmen() {
        const w = this.canvas ? this.canvas.width : window.innerWidth;
        const titleXe = document.querySelector('.title-xe');
        const titleTang = document.querySelector('.title-tang');

        const rectXe = titleXe ? titleXe.getBoundingClientRect() : { left: w * 0.44, top: 150, width: 80 };
        const rectTang = titleTang ? titleTang.getBoundingClientRect() : { left: w * 0.56, top: 150, width: 120 };

        const groundY = rectXe.top + 100;

        this.repairmen = [
            {
                id: 'rep-1',
                team: 'green',
                x: -100,
                y: groundY,
                targetX: rectXe.left + (rectXe.width / 2),
                animFrame: 0,
                workFrame: 0
            },
            {
                id: 'rep-2',
                team: 'red',
                x: w + 100,
                y: groundY,
                targetX: rectTang.left + (rectTang.width / 2),
                animFrame: 0,
                workFrame: 0
            }
        ];
    }

    repairTitle() {
        const titleXe = document.querySelector('.title-xe');
        const titleTang = document.querySelector('.title-tang');

        this.titleDamagedXe = false;
        this.titleDamagedTang = false;

        // Play triumphant repair victory chime sound FX!
        if (typeof audio !== 'undefined') {
            audio.playTitleRepairedChime();
        }

        if (titleXe) {
            titleXe.classList.remove('title-broken-xe');
            titleXe.classList.add('title-repaired-bounce');
        }
        if (titleTang) {
            titleTang.classList.remove('title-broken-tang');
            titleTang.classList.add('title-repaired-bounce');
        }

        // Burst of clean cyan/gold repair smoke particles around title
        const titleEl = document.querySelector('.main-title');
        if (titleEl) {
            const r = titleEl.getBoundingClientRect();
            for (let i = 0; i < 25; i++) {
                this.particles.push({
                    type: 'heavy_smoke',
                    x: r.left + Math.random() * r.width,
                    y: r.top + Math.random() * r.height,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3 - 1,
                    radius: Math.random() * 10 + 5,
                    color: Math.random() > 0.5 ? '#38bdf8' : '#facc15',
                    alpha: 0.8,
                    decay: 0.03
                });
            }
        }

        setTimeout(() => {
            if (titleXe) titleXe.classList.remove('title-repaired-bounce');
            if (titleTang) titleTang.classList.remove('title-repaired-bounce');
        }, 800);
    }

    showSpeechBubbles() {
        this.removeSpeechBubbles();

        // Play comic speech bubble pop sound FX!
        if (typeof audio !== 'undefined') {
            audio.playPopBubble();
        }

        this.repairmen.forEach((rm, index) => {
            const bubble = document.createElement('div');
            bubble.className = 'repairman-bubble';
            bubble.id = `repairman-bubble-${index}`;
            bubble.innerText = index === 0 
                ? "🔧 Trời ơi! Sếp lái kiểu gì bắn rụng rốn chữ XE rồi! 💥" 
                : "⚡ Chữ TĂNG nát bét! Tụi tui hàn lại đẹp hơn mới! 🛠️";

            bubble.style.left = `${rm.x - 110}px`;
            bubble.style.top = `${rm.y - 120}px`;

            document.body.appendChild(bubble);
            this.bubbles.push(bubble);
        });
    }

    removeSpeechBubbles() {
        this.bubbles.forEach(b => {
            if (b && b.parentNode) b.parentNode.removeChild(b);
        });
        this.bubbles = [];
    }

    stopIdleEasterEgg() {
        this.idleSeqState = 'IDLE';
        this.idleSeqTimer = 0;
        this.superTanks = [];
        this.repairmen = [];
        this.idleBullets = [];
        this.titleDamagedXe = false;
        this.titleDamagedTang = false;
        this.firedGreen = false;
        this.firedRed = false;
        this.titleRepaired = false;
        this.lastActivityTime = Date.now();
        this.removeSpeechBubbles();

        const titleXe = document.querySelector('.title-xe');
        const titleTang = document.querySelector('.title-tang');
        if (titleXe) {
            titleXe.classList.remove('title-broken-xe', 'title-repaired-bounce');
        }
        if (titleTang) {
            titleTang.classList.remove('title-broken-tang', 'title-repaired-bounce');
        }
    }

    drawSuperTanks() {
        if (!this.superTanks || this.superTanks.length === 0) return;
        this.superTanks.forEach(st => {
            this.ctx.save();
            this.ctx.translate(st.x, st.y);

            if (st.recoil > 0) st.recoil -= 0.9;

            // Heavy Shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(-55, -45, 110, 90);

            // Hull Rotation
            this.ctx.save();
            this.ctx.rotate(st.angle);

            // Heavy Treads
            this.ctx.fillStyle = '#0f172a';
            this.ctx.fillRect(-55, -50, 110, 18);
            this.ctx.fillRect(-55, 32, 110, 18);
            this.ctx.fillStyle = '#475569';
            for (let i = -50; i < 50; i += 12) {
                this.ctx.fillRect(i, -48, 6, 14);
                this.ctx.fillRect(i, 34, 6, 14);
            }

            // Giant Main Armor Body
            this.ctx.fillStyle = st.color;
            this.ctx.fillRect(-45, -32, 90, 64);
            this.ctx.strokeStyle = st.accent;
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(-45, -32, 90, 64);

            this.ctx.restore(); // end hull

            // Turret Rotation & Recoil
            this.ctx.save();
            this.ctx.rotate(st.turretAngle);

            const recoilX = -st.recoil;

            // Dual Heavy Cannons
            this.ctx.fillStyle = st.color;
            this.ctx.fillRect(recoilX, -12, 60, 8);
            this.ctx.fillRect(recoilX, 4, 60, 8);
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(recoilX, -12, 60, 8);
            this.ctx.strokeRect(recoilX, 4, 60, 8);

            // Turret Dome
            this.ctx.beginPath();
            this.ctx.arc(recoilX, 0, 26, 0, Math.PI * 2);
            this.ctx.fillStyle = st.color;
            this.ctx.fill();
            this.ctx.strokeStyle = st.accent;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            this.ctx.restore(); // end turret
            this.ctx.restore(); // end translate
        });
    }

    drawRepairmen() {
        if (!this.repairmen || this.repairmen.length === 0) return;
        this.repairmen.forEach(rm => {
            this.ctx.save();
            this.ctx.translate(rm.x, rm.y);

            // Ground Highlight & Shadow Aura
            const auraGradient = this.ctx.createRadialGradient(0, 0, 5, 0, 0, 45);
            auraGradient.addColorStop(0, rm.team === 'green' ? 'rgba(56, 189, 248, 0.5)' : 'rgba(239, 68, 68, 0.5)');
            auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            this.ctx.fillStyle = auraGradient;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, 45, 14, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Scale character up cleanly (Origin (0,0) is feet on ground)
            this.ctx.scale(1.8, 1.8);

            // Running / Working leg animation swing
            const legSwing = Math.sin(rm.animFrame || 0) * 8;

            // 1. Solid Heavy Combat Boots (standing on y = 0)
            this.ctx.fillStyle = '#0f172a';
            this.ctx.fillRect(-11 + legSwing * 0.3, -6, 9, 6);
            this.ctx.fillRect(2 - legSwing * 0.3, -6, 9, 6);

            // 2. Solid Camo Pants (Pants connect from y = -24 down to y = -6 with NO GAPS!)
            this.ctx.fillStyle = rm.team === 'green' ? '#14532d' : '#7f1d1d';
            // Left leg pant
            this.ctx.beginPath();
            this.ctx.moveTo(-10, -24);
            this.ctx.lineTo(-2, -24);
            this.ctx.lineTo(-2 - legSwing * 0.3, -6);
            this.ctx.lineTo(-10 - legSwing * 0.3, -6);
            this.ctx.closePath();
            this.ctx.fill();

            // Right leg pant
            this.ctx.beginPath();
            this.ctx.moveTo(2, -24);
            this.ctx.lineTo(10, -24);
            this.ctx.lineTo(10 + legSwing * 0.3, -6);
            this.ctx.lineTo(2 + legSwing * 0.3, -6);
            this.ctx.closePath();
            this.ctx.fill();

            // Utility Belt (y = -27 to -24)
            this.ctx.fillStyle = '#1e293b';
            this.ctx.fillRect(-12, -27, 24, 4);
            this.ctx.fillStyle = '#facc15'; // Belt buckle
            this.ctx.fillRect(-3, -27, 6, 4);

            // 3. High-Vis Mechanic Vest Torso (y = -48 to -27, seamless connection to belt!)
            this.ctx.fillStyle = rm.team === 'green' ? '#16a34a' : '#dc2626';
            this.ctx.fillRect(-11, -48, 22, 21);
            // Reflective stripes across vest
            this.ctx.fillStyle = '#facc15';
            this.ctx.fillRect(-11, -42, 22, 4);
            this.ctx.fillRect(-11, -34, 22, 4);
            this.ctx.fillStyle = '#ffffff'; // White reflective tape
            this.ctx.fillRect(-11, -40, 22, 1.5);
            this.ctx.fillRect(-11, -32, 22, 1.5);

            // 4. Arms & Shoulders
            this.ctx.fillStyle = rm.team === 'green' ? '#15803d' : '#b91c1c';
            // Left shoulder/arm
            this.ctx.fillRect(-15, -48, 5, 18);
            // Right shoulder/arm
            this.ctx.fillRect(10, -48, 5, 18);

            // 5. Head & Face (y = -58 to -48)
            this.ctx.fillStyle = '#fde047'; // Skin
            this.ctx.beginPath();
            this.ctx.arc(0, -53, 7, 0, Math.PI * 2);
            this.ctx.fill();

            // Army Welding Helmet (y = -61 to -53)
            this.ctx.fillStyle = rm.team === 'green' ? '#14532d' : '#7f1d1d';
            this.ctx.beginPath();
            this.ctx.arc(0, -56, 9, Math.PI, 0);
            this.ctx.fill();
            // Glowing cyan welding visor
            this.ctx.fillStyle = '#38bdf8';
            this.ctx.shadowColor = '#38bdf8';
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(-5, -57, 10, 4);
            this.ctx.shadowBlur = 0;

            // 6. Welding Torch & Plasma Arc Flash Animation
            if (this.idleSeqState === 'REPAIRING') {
                const toolAngle = Math.sin(rm.workFrame || 0) * 0.8;
                this.ctx.save();
                this.ctx.translate(0, -38);
                this.ctx.rotate(toolAngle);

                // Torch Handle
                this.ctx.fillStyle = '#0284c7';
                this.ctx.fillRect(0, -18, 6, 18);

                // Torch Nozzle
                this.ctx.fillStyle = '#38bdf8';
                this.ctx.shadowColor = '#38bdf8';
                this.ctx.shadowBlur = 25;
                this.ctx.fillRect(-3, -24, 12, 6);

                // Electric Plasma Arc Flash Starburst
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(3, -26, Math.random() * 6 + 4, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.restore();
            }

            this.ctx.restore();
        });
    }
}

// Instantiate Global Homepage Engine
const homepageEngine = new HomepageEngine();
window.addEventListener('DOMContentLoaded', () => {
    homepageEngine.init();
});
