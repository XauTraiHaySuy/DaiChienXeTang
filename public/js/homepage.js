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

        // --- 10s Idle Easter Egg Properties ---
        this.lastActivityTime = Date.now();
        this.idleTimeout = 10000; // 10 seconds timeout per user directive
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
        this.wreckedTanks = [];
        this.craters = [];
        this.battleRocks = [];
    }

    init() {
        this.canvas = document.getElementById('menu-bg-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.resize();
        this.updateTitleRects();
        window.addEventListener('resize', () => {
            this.resize();
            this.updateTitleRects();
        });

        this.spawnInitialTanks();
        this.spawnWreckedTanks();
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
        this.spawnWreckedTanks();
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

    spawnWreckedTanks() {
        const w = this.canvas ? this.canvas.width : window.innerWidth;
        const h = this.canvas ? this.canvas.height : window.innerHeight;

        // Tank Tread Scars / Track Trails on battlefield ground (Vết bánh xích cày xới)
        this.treadTracks = [
            { x1: w * 0.05, y1: h * 0.3, x2: w * 0.35, y2: h * 0.38 },
            { x1: w * 0.65, y1: h * 0.62, x2: w * 0.95, y2: h * 0.72 },
            { x1: w * 0.12, y1: h * 0.8, x2: w * 0.42, y2: h * 0.85 }
        ];

        // Sandbag barricades / defense lines (Chướng ngại vật bao cát chiến trường)
        this.sandbagBarriers = [
            { x: w * 0.28, y: h * 0.22, angle: 0.25 },
            { x: w * 0.72, y: h * 0.78, angle: -0.35 },
            { x: w * 0.45, y: h * 0.85, angle: 0.8 }
        ];

        // Generate small gravel rocks and battlefield debris
        this.battleRocks = [];
        for (let i = 0; i < 40; i++) {
            this.battleRocks.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 2 + 1,
                color: Math.random() > 0.5 ? '#1a0d06' : '#0e0602'
            });
        }

        // Create battlefield craters with irregular organic shapes (Rải rác không đều nhau, méo mó tự nhiên)
        this.craters = [
            { x: w * 0.14, y: h * 0.22, radius: 46 }, // Top-Left crater
            { x: w * 0.27, y: h * 0.78, radius: 40 }, // Lower-Middle-Left crater
            { x: w * 0.76, y: h * 0.35, radius: 42 }, // Upper-Right crater
            { x: w * 0.88, y: h * 0.65, radius: 50 }, // Far-Lower-Right crater
            { x: w * 0.44, y: h * 0.88, radius: 54 }  // Asymmetric bottom-center crater
        ];

        // Generate non-circular, irregular natural shape points for each crater
        this.craters.forEach(c => {
            const numPts = 16;
            c.outerPoints = [];
            c.innerPoints = [];
            for (let i = 0; i < numPts; i++) {
                const angle = (i / numPts) * Math.PI * 2;
                // Deform radius between 0.75x and 1.25x for dynamic natural jaggedness
                const rOuter = c.radius * (0.75 + Math.random() * 0.5);
                const rInner = c.radius * 0.48 * (0.7 + Math.random() * 0.5);
                c.outerPoints.push({
                    x: Math.cos(angle) * rOuter,
                    y: Math.sin(angle) * rOuter
                });
                c.innerPoints.push({
                    x: Math.cos(angle) * rInner,
                    y: Math.sin(angle) * rInner
                });
            }
        });

        // Single unified dynamic battlefield wind angle for ALL 4 wrecked tanks per F5 session!
        this.sessionWindAngle = (Math.random() - 0.5) * 2.2 - Math.PI / 2; // Random unified angle (-153 deg to -27 deg)

        this.wreckedTanks = [
            // Left Green Tank 1 (Top-Left battlefield zone)
            { x: w * 0.14 + 5, y: h * 0.22 - 4, angle: 0.85, turretAngle: 2.1, team: 'green' },
            // Left Green Tank 2 (Lower-Middle-Left zone)
            { x: w * 0.27 - 6, y: h * 0.78 + 5, angle: -1.2, turretAngle: -0.4, team: 'green' },
            // Right Red Tank 1 (Upper-Right zone)
            { x: w * 0.76 - 4, y: h * 0.35 + 6, angle: -2.1, turretAngle: 0.6, team: 'red' },
            // Right Red Tank 2 (Far-Lower-Right zone)
            { x: w * 0.88 + 5, y: h * 0.65 - 4, angle: 1.65, turretAngle: -2.4, team: 'red' }
        ];
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

        // Continuous dark battlefield smoke plume from 4 wrecked tanks drifting IN UNIFIED BATTLEFIELD WIND DIRECTION
        if (this.wreckedTanks && Math.random() < 0.45) {
            const windAngle = (this.sessionWindAngle !== undefined && this.sessionWindAngle !== null) ? this.sessionWindAngle : (-Math.PI / 2);

            this.wreckedTanks.forEach(wt => {
                // ALL 4 wrecked tanks blow smoke together in the EXACT SAME UNIFIED WIND DIRECTION!
                const angle = windAngle + (Math.random() - 0.5) * 0.08;
                const smokeSpeed = Math.random() * 0.15 + 0.35; // Fast visible drift speed (~0.42px/frame)

                this.particles.push({
                    type: 'slow_smoke',
                    x: wt.x + (Math.random() - 0.5) * 6,       // Engine deck origin
                    y: wt.y - 6,
                    initialY: wt.y - 6,
                    vx: Math.cos(angle) * smokeSpeed + (Math.random() - 0.5) * 0.02,
                    vy: Math.sin(angle) * smokeSpeed + (Math.random() - 0.5) * 0.02,
                    radius: Math.random() * 4 + 6,                             // 1.5x thicker smoke (6px - 10px)
                    growth: Math.random() * 0.03 + 0.035,                     // 1.5x plume expansion
                    color: wt.team === 'green' ? 'rgba(45, 40, 35, 0.55)' : 'rgba(55, 48, 40, 0.50)', // Soft translucent grey-charcoal
                    alpha: 0.55,                                              // Soft translucent smoke
                    decay: 0.0035                                             // Smooth fade out
                });
            });
        }

        // Continuous Title Fire & Spark Particle Emitter (Siêu mượt, lững lờ cực chậm)
        if (!this.titleXeRect || !this.titleTangRect) {
            this.updateTitleRects();
        }

        const activeTitleCount = this.particles.filter(p => p.type === 'title_fire' || p.type === 'title_spark').length;

        if (activeTitleCount < 20) {
            // Chữ XE (Phe Xanh)
            if (this.titleXeRect && !this.titleDamagedXe && this.titleXeRect.width > 0) {
                const r = this.titleXeRect;
                if (Math.random() < 0.12) {
                    const xeFireColors = ['#38bdf8', '#22c55e', '#7dd3fc', '#a7f3d0', '#facc15'];
                    this.particles.push({
                        type: 'title_fire',
                        x: r.left + Math.random() * r.width,
                        y: r.bottom - Math.random() * (r.height * 0.35),
                        vx: (Math.random() - 0.5) * 0.1,
                        vy: -Math.random() * 0.25 - 0.15, // Ultra-slow rising flame
                        radius: Math.random() * 6 + 3,
                        color: xeFireColors[Math.floor(Math.random() * xeFireColors.length)],
                        alpha: 0.85,
                        decay: 0.008
                    });
                }
                if (Math.random() < 0.06) {
                    this.particles.push({
                        type: 'title_spark',
                        x: r.left + Math.random() * r.width,
                        y: r.top + Math.random() * r.height,
                        vx: (Math.random() - 0.5) * 0.2,
                        vy: -Math.random() * 0.4 - 0.2, // Ultra-slow rising sparks
                        radius: Math.random() * 2 + 1,
                        color: Math.random() > 0.3 ? '#38bdf8' : '#facc15',
                        alpha: 0.9,
                        decay: 0.012
                    });
                }
            }

            // Chữ TĂNG (Phe Đỏ)
            if (this.titleTangRect && !this.titleDamagedTang && this.titleTangRect.width > 0) {
                const r = this.titleTangRect;
                if (Math.random() < 0.12) {
                    const tangFireColors = ['#ef4444', '#f87171', '#fb923c', '#fde047', '#ff4d4d'];
                    this.particles.push({
                        type: 'title_fire',
                        x: r.left + Math.random() * r.width,
                        y: r.bottom - Math.random() * (r.height * 0.35),
                        vx: (Math.random() - 0.5) * 0.1,
                        vy: -Math.random() * 0.25 - 0.15, // Ultra-slow rising flame
                        radius: Math.random() * 6 + 3,
                        color: tangFireColors[Math.floor(Math.random() * tangFireColors.length)],
                        alpha: 0.85,
                        decay: 0.008
                    });
                }
                if (Math.random() < 0.06) {
                    this.particles.push({
                        type: 'title_spark',
                        x: r.left + Math.random() * r.width,
                        y: r.top + Math.random() * r.height,
                        vx: (Math.random() - 0.5) * 0.2,
                        vy: -Math.random() * 0.4 - 0.2, // Ultra-slow rising sparks
                        radius: Math.random() * 2 + 1,
                        color: Math.random() > 0.3 ? '#ef4444' : '#fde047',
                        alpha: 0.9,
                        decay: 0.012
                    });
                }
            }
        }

        // Update Particles with Safety Cleanup
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            if (p.type === 'smoke' || p.type === 'fire' || p.type === 'heavy_smoke' || p.type === 'slow_smoke' || p.type === 'title_fire' || p.type === 'title_spark') {
                p.x += p.vx || 0;
                p.y += p.vy || 0;
                if (p.type === 'title_fire') {
                    p.radius *= 0.95; // Flame shrinks slightly as it licks upward
                } else if (p.type === 'heavy_smoke' || p.type === 'slow_smoke') {
                    p.radius += (p.growth || 0.18); // Rapid expansion as it ascends to top!
                    if (p.type === 'heavy_smoke' && p.initialY) {
                        p.x += Math.sin((p.initialY - p.y) * 0.08) * 0.14; // Natural organic turbulence sway!
                    }
                }
                p.alpha -= p.decay || 0.02;
                if (p.alpha <= 0) this.particles.splice(i, 1);
            } else if (p.type === 'track') {
                p.life -= (p.decay || 0.02);
                if (p.life <= 0) this.particles.splice(i, 1);
            } else {
                // Safety cleanup for unhandled particle types
                this.particles.splice(i, 1);
            }
        }

        // Safety soft cap if array exceeds 350 particles
        if (this.particles.length > 350) {
            this.particles = this.particles.filter(p => p.alpha > 0.1);
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

        let offsetX = 0;
        let offsetY = 0;
        if (this.screenShake > 0) {
            offsetX = (Math.random() - 0.5) * this.screenShake;
            offsetY = (Math.random() - 0.5) * this.screenShake;
            this.screenShake *= 0.88;
            if (this.screenShake < 0.5) this.screenShake = 0;
        }

        this.ctx.save();
        if (offsetX !== 0 || offsetY !== 0) {
            this.ctx.translate(offsetX, offsetY);
        }

        // Clear canvas with 1.5x darker rich battlefield earth brown gradient (#1a0f07 -> #120a03 -> #0a0501)
        const bgGradient = this.ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, Math.max(w, h));
        bgGradient.addColorStop(0, '#1a0f07');   // Rich dark chocolate mud brown
        bgGradient.addColorStop(0.55, '#120a03'); // Deep dark soil brown
        bgGradient.addColorStop(1, '#0a0501');    // Darkest pitch wet soil
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, w, h);

        // Draw Tank Tread Trails (Vết bánh xích cày rãnh đất chiến trường)
        if (this.treadTracks) {
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(12, 6, 2, 0.45)';
            this.ctx.lineWidth = 4;
            this.ctx.setLineDash([8, 6]);
            this.treadTracks.forEach(tr => {
                this.ctx.beginPath();
                this.ctx.moveTo(tr.x1, tr.y1);
                this.ctx.lineTo(tr.x2, tr.y2);
                this.ctx.stroke();
            });
            this.ctx.restore();
        }

        // Draw Sandbag Barricades (Bao cát chiến trường)
        if (this.sandbagBarriers) {
            this.sandbagBarriers.forEach(sb => {
                this.ctx.save();
                this.ctx.translate(sb.x, sb.y);
                this.ctx.rotate(sb.angle);

                // Draw 3 stacked sandbags
                this.ctx.fillStyle = '#160d07';
                this.ctx.strokeStyle = '#0a0502';
                this.ctx.lineWidth = 1;

                this.ctx.fillRect(-18, -6, 12, 6);
                this.ctx.strokeRect(-18, -6, 12, 6);

                this.ctx.fillRect(-4, -6, 12, 6);
                this.ctx.strokeRect(-4, -6, 12, 6);

                this.ctx.fillRect(10, -6, 12, 6);
                this.ctx.strokeRect(10, -6, 12, 6);

                this.ctx.fillRect(-11, -12, 12, 6);
                this.ctx.strokeRect(-11, -12, 12, 6);

                this.ctx.fillRect(3, -12, 12, 6);
                this.ctx.strokeRect(3, -12, 12, 6);

                this.ctx.restore();
            });
        }

        // Draw Small Gravel Rocks & Debris
        if (this.battleRocks) {
            this.battleRocks.forEach(br => {
                this.ctx.fillStyle = br.color;
                this.ctx.beginPath();
                this.ctx.arc(br.x, br.y, br.r, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }

        // Helper function to draw smooth irregular closed shapes (Bomb craters)
        const drawIrregularShape = (ctx, pts) => {
            if (!pts || pts.length === 0) return;
            ctx.beginPath();
            const len = pts.length;
            const p0 = pts[len - 1];
            const p1 = pts[0];
            ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
            for (let i = 0; i < len; i++) {
                const curr = pts[i];
                const next = pts[(i + 1) % len];
                ctx.quadraticCurveTo(curr.x, curr.y, (curr.x + next.x) / 2, (curr.y + next.y) / 2);
            }
            ctx.closePath();
        };

        // Draw Subtle Bomb Craters with Lighter Earthy Rim Lip (Viền hố bom màu nhạt hơn)
        if (this.craters) {
            this.craters.forEach(c => {
                this.ctx.save();
                this.ctx.translate(c.x, c.y);

                // Dark bomb crater hole gradient
                const grad = this.ctx.createRadialGradient(0, 0, c.radius * 0.1, 0, 0, c.radius * 1.25);
                grad.addColorStop(0, 'rgba(6, 3, 1, 0.95)');       // Deep crater center
                grad.addColorStop(0.5, 'rgba(12, 6, 2, 0.75)');    // Mud inner wall
                grad.addColorStop(0.85, 'rgba(20, 10, 3, 0.35)');  // Earth outer rim
                grad.addColorStop(1, 'rgba(18, 9, 3, 0)');        // Blends smoothly into brown soil

                this.ctx.fillStyle = grad;
                drawIrregularShape(this.ctx, c.outerPoints);
                this.ctx.fill();

                // Lighter earthy rim stroke (Viền hố bom màu nhạt hơn tự nhiên)
                this.ctx.strokeStyle = 'rgba(90, 55, 28, 0.55)';
                this.ctx.lineWidth = 2.2;
                this.ctx.stroke();

                // Inner crater shadow ring
                this.ctx.fillStyle = 'rgba(5, 2, 1, 0.7)';
                drawIrregularShape(this.ctx, c.innerPoints);
                this.ctx.fill();

                this.ctx.restore();
            });
        }

        // Draw Destroyed / Wrecked Tanks (CHÂN THẬT - VẾT NỨT TỰ NHIÊN, KHÓI BỐC & THỦNG GIÁP NỔ CỰC KỲ CHI TIẾT)
        if (this.wreckedTanks) {
            this.wreckedTanks.forEach(wt => {
                this.ctx.save();
                this.ctx.translate(wt.x, wt.y);

                // Ensure zero neon glow / shadowBlur
                this.ctx.shadowBlur = 0;
                this.ctx.shadowColor = 'transparent';

                const isGreen = wt.team === 'green';

                // Darkened 0.5x team colors (Zero Neon, No Border):
                // Damaged Green (Phe Xanh bên trái): Darkened 0.5x #133545
                // Damaged Red (Phe Đỏ bên phải): Darkened 0.5x #4d1616
                const bodyColor = isGreen ? '#133545' : '#4d1616';
                const trackColor = isGreen ? '#07131a' : '#1a0707';

                // Hull Rotation
                this.ctx.save();
                this.ctx.rotate(wt.angle);

                // Tracks (Shortened top track to represent broken track link!)
                this.ctx.fillStyle = trackColor;
                this.ctx.fillRect(-22, -20, 36, 8); // Top track blown off at end
                this.ctx.fillRect(-22, 12, 44, 8);  // Bottom track

                // Broken track tread piece hanging off rear (Mảnh xích đứt văng)
                this.ctx.save();
                this.ctx.translate(-24, -18);
                this.ctx.rotate(0.35);
                this.ctx.fillRect(0, 0, 9, 7);
                this.ctx.restore();

                // Main Body (-18, -13, 36, 26 - NO STROKE BORDER AT ALL!)
                this.ctx.fillStyle = bodyColor;
                this.ctx.fillRect(-18, -13, 36, 26);

                // Heavy Internal burn overlay fill
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
                this.ctx.fillRect(-15, -10, 30, 20);

                // Shell Breach Core (Vết đạn pháo đâm nổ xuyên giáp nổ ngầm)
                const breachGrad = this.ctx.createRadialGradient(-3, -1, 1, -3, -1, 7);
                breachGrad.addColorStop(0, 'rgba(234, 88, 12, 0.4)'); // Low heat ember core
                breachGrad.addColorStop(0.45, 'rgba(8, 4, 1, 0.95)');
                breachGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                this.ctx.fillStyle = breachGrad;
                this.ctx.beginPath();
                this.ctx.arc(-3, -1, 7.5, 0, Math.PI * 2);
                this.ctx.fill();

                // Realistic Organic Spiderweb Armor Cracks (Các vết nứt rải rác tự nhiên chân thật)
                this.ctx.strokeStyle = '#020101';
                this.ctx.lineWidth = 1.6;
                this.ctx.beginPath();
                // Radial cracks spreading from shell breach point (-3, -1)
                this.ctx.moveTo(-3, -1); this.ctx.lineTo(-9, -6); this.ctx.lineTo(-16, -4);
                this.ctx.moveTo(-3, -1); this.ctx.lineTo(-7, 6); this.ctx.lineTo(-13, 10);
                this.ctx.moveTo(-3, -1); this.ctx.lineTo(4, -5); this.ctx.lineTo(12, -8);
                this.ctx.moveTo(-3, -1); this.ctx.lineTo(5, 5); this.ctx.lineTo(14, 3);
                // Secondary branching sub-cracks (Vết nứt phụ nhánh)
                this.ctx.moveTo(-9, -6); this.ctx.lineTo(-6, -11);
                this.ctx.moveTo(4, -5); this.ctx.lineTo(2, -10);
                this.ctx.moveTo(5, 5); this.ctx.lineTo(8, 9);
                this.ctx.moveTo(-7, 6); this.ctx.lineTo(-4, 11);
                this.ctx.stroke();

                this.ctx.restore(); // end hull

                // Turret Rotation (Centered on body)
                this.ctx.save();
                this.ctx.rotate(wt.turretAngle);

                // Cannon Barrel (Identical size 0, -4, 28, 8 - NO STROKE BORDER!)
                this.ctx.fillStyle = bodyColor;
                this.ctx.fillRect(0, -4, 28, 8);

                // Cannon Barrel crack/burnt tip
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
                this.ctx.fillRect(18, -4, 10, 8);

                // Turret Dome (Identical size arc radius 11 - NO STROKE BORDER, NO WHITE NEON!)
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 11, 0, Math.PI * 2);
                this.ctx.fillStyle = bodyColor;
                this.ctx.fill();

                // Realistic Turret Dome Fracture Cracks
                this.ctx.strokeStyle = '#020101';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0); this.ctx.lineTo(-7, -7);
                this.ctx.moveTo(0, 0); this.ctx.lineTo(6, -6);
                this.ctx.moveTo(0, 0); this.ctx.lineTo(3, 8);
                this.ctx.stroke();

                this.ctx.restore(); // end turret
                this.ctx.restore(); // end wt translate
            });
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

        // Draw Particles (Smoke, Heavy Smoke, Slow Smoke, Fire, Title Flame & Sparks - Ultra Fast Zero-CPU Blur)
        this.particles.forEach(p => {
            if (p.type === 'smoke' || p.type === 'fire' || p.type === 'heavy_smoke' || p.type === 'slow_smoke' || p.type === 'title_fire' || p.type === 'title_spark') {
                this.ctx.save();
                this.ctx.fillStyle = p.color;

                if (p.type === 'title_fire' || p.type === 'title_spark') {
                    // Soft outer halo glow (Zero shadowBlur CPU penalty!)
                    this.ctx.globalAlpha = Math.max(0, p.alpha * 0.35);
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, p.radius * 1.8, 0, Math.PI * 2);
                    this.ctx.fill();
                }

                // Core fill
                this.ctx.globalAlpha = Math.max(0, p.alpha);
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        });

        // Draw Easter Egg elements (Super Tanks, Fallen Letters, Mechanical Repairmen)
        this.drawSuperTanks();
        this.drawFallenLetters();
        this.drawRepairmen();

        this.ctx.restore(); // end screenShake translate
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
                    audio.ctx.resume().catch(() => { });
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

        // Continuous smoke plumes rising straight UP from damaged title letters "XE" and "TĂNG" (Bốc khói siêu chậm rãi)
        if (this.titleDamagedXe) {
            const titleXe = document.querySelector('.title-xe');
            if (titleXe && Math.random() < 0.15) {
                const r = titleXe.getBoundingClientRect();
                this.particles.push({
                    type: 'heavy_smoke',
                    x: r.left + Math.random() * r.width,
                    y: r.top + r.height,
                    vx: (Math.random() - 0.5) * 0.08,
                    vy: -Math.random() * 0.12 - 0.06,  // Ultra-slow rising speed
                    radius: Math.random() * 10 + 5,
                    color: Math.random() > 0.4 ? '#334155' : '#0f172a',
                    alpha: 0.75,
                    decay: 0.004
                });
            }
        }
        if (this.titleDamagedTang) {
            const titleTang = document.querySelector('.title-tang');
            if (titleTang && Math.random() < 0.15) {
                const r = titleTang.getBoundingClientRect();
                this.particles.push({
                    type: 'heavy_smoke',
                    x: r.left + Math.random() * r.width,
                    y: r.top + r.height,
                    vx: (Math.random() - 0.5) * 0.08,
                    vy: -Math.random() * 0.12 - 0.06,  // Ultra-slow rising speed
                    radius: Math.random() * 10 + 5,
                    color: Math.random() > 0.4 ? '#475569' : '#0f172a',
                    alpha: 0.75,
                    decay: 0.004
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

        // 5. REPAIRMEN_ENTERING, REPAIRING, CURSING & EXITING (Independent per-repairman state machine!)
        else if (this.idleSeqState === 'REPAIRMEN_ENTERING' || this.idleSeqState === 'REPAIRING' || this.idleSeqState === 'CURSING' || this.idleSeqState === 'REPAIRMEN_EXITING') {
            this.idleSeqState = 'REPAIRING';
            let allDone = true;

            this.repairmen.forEach((rm, index) => {
                // NaN state recovery safeguard
                if (isNaN(rm.x) || isNaN(rm.y)) {
                    rm.x = rm.homeGroundX || w * 0.5;
                    rm.y = rm.groundY || 300;
                }

                const currentLetter = (rm.assignedLetters && rm.letterIndex < rm.assignedLetters.length) ? rm.assignedLetters[rm.letterIndex] : null;

                if (rm.state === 'RUNNING_TO_GROUND') {
                    allDone = false;
                    const targetX = currentLetter ? currentLetter.groundX : rm.x;
                    const dx = targetX - rm.x;

                    if (Math.abs(dx) > 4) {
                        rm.x += Math.sign(dx) * Math.min(Math.abs(dx), 7.0);
                        rm.animFrame += 0.5;
                        if (Math.random() < 0.25 && typeof audio !== 'undefined') audio.playRepairmenFootsteps();
                    } else {
                        rm.x = targetX;
                        rm.y = rm.groundY;
                        rm.state = 'PICKING_UP';
                        rm.workTimer = 0;
                    }
                }
                else if (rm.state === 'PICKING_UP') {
                    allDone = false;
                    rm.workTimer = (rm.workTimer || 0) + dt;
                    rm.workFrame += 0.4;
                    // Bends down & grabs letter
                    if (rm.workTimer > 0.2) {
                        rm.holdingLetter = currentLetter;
                        if (currentLetter) {
                            currentLetter.falling = false; // Stop falling physics immediately so drawFallenLetters does not fight!
                        }
                        rm.state = 'CARRYING_UP';
                        rm.workTimer = 0;
                    }
                }
                else if (rm.state === 'CARRYING_UP') {
                    allDone = false;
                    const targetX = currentLetter ? currentLetter.homeX : rm.x;
                    const targetY = currentLetter ? (currentLetter.homeY + 38) : (rm.groundY - 40);
                    const dx = targetX - rm.x;
                    const dy = targetY - rm.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist > 6) {
                        const safeDist = dist > 0.001 ? dist : 1;
                        const step = Math.min(dist, 7.5);
                        rm.x += (dx / safeDist) * step;
                        rm.y += (dy / safeDist) * step;
                        if (currentLetter) {
                            currentLetter.currentX = rm.x + (rm.team === 'green' ? 12 : -12);
                            currentLetter.currentY = rm.y - 32; // Torso level right in hands!
                            currentLetter.currentRotation = (currentLetter.rotation || 0) * (dist / 120);
                        }
                        rm.animFrame += 0.5;
                    } else {
                        rm.x = targetX;
                        rm.y = targetY;
                        rm.state = 'PLACING_LETTER';
                        rm.workTimer = 0;
                    }
                }
                else if (rm.state === 'PLACING_LETTER') {
                    allDone = false;
                    rm.workTimer = (rm.workTimer || 0) + dt;
                    if (currentLetter) {
                        currentLetter.currentX = currentLetter.homeX;
                        currentLetter.currentY = currentLetter.homeY;
                        currentLetter.currentRotation = 0;
                    }
                    if (rm.workTimer > 0.2) {
                        rm.state = 'WELDING';
                        rm.workTimer = 0;
                    }
                }
                else if (rm.state === 'WELDING') {
                    allDone = false;
                    rm.workTimer = (rm.workTimer || 0) + dt;
                    rm.workFrame += 0.4;

                    if (currentLetter) {
                        currentLetter.currentX = currentLetter.homeX;
                        currentLetter.currentY = currentLetter.homeY;
                        currentLetter.currentRotation = 0;
                    }

                    // Mechanical plasma welder sizzle sound & sparks
                    if (Math.random() < 0.4 && typeof audio !== 'undefined') audio.playWeldingSizzle();

                    if (Math.random() < 0.95) {
                        this.particles.push({
                            type: 'fire',
                            x: rm.x + (Math.random() - 0.5) * 16,
                            y: rm.y - 35 + (Math.random() - 0.5) * 10,
                            vx: (Math.random() - 0.5) * 7,
                            vy: (Math.random() - 0.5) * 7 - 2,
                            radius: Math.random() * 4 + 2,
                            color: Math.random() > 0.4 ? (rm.team === 'green' ? '#38bdf8' : '#ef4444') : '#facc15',
                            alpha: 1.0,
                            decay: 0.07
                        });
                    }

                    // Crisp 0.45s welding duration
                    if (rm.workTimer > 0.45) {
                        // Letter is welded!
                        if (currentLetter) {
                            currentLetter.repaired = true;
                            currentLetter.falling = false;
                            currentLetter.currentX = currentLetter.homeX;
                            currentLetter.currentY = currentLetter.homeY;
                            currentLetter.currentRotation = 0;
                            if (typeof audio !== 'undefined') audio.playTitleRepairedChime();
                        }
                        rm.holdingLetter = null;
                        rm.letterIndex++;

                        rm.state = 'RETURNING_TO_GROUND';
                    }
                }
                else if (rm.state === 'RETURNING_TO_GROUND') {
                    allDone = false;
                    const dy = rm.groundY - rm.y;
                    if (Math.abs(dy) > 4) {
                        rm.y += Math.sign(dy) * Math.min(Math.abs(dy), 7.5); // Smooth constant ground landing
                    } else {
                        rm.y = rm.groundY;
                        if (rm.assignedLetters && rm.letterIndex < rm.assignedLetters.length) {
                            rm.state = 'RUNNING_TO_GROUND';
                        } else {
                            // All team letters done! Stand on ground below last repaired letter & curse!
                            rm.state = 'CURSING';
                            rm.curseTimer = 0;
                            this.showSingleSpeechBubble(rm, index);
                        }
                    }
                }
                else if (rm.state === 'CURSING') {
                    allDone = false;
                    rm.curseTimer = (rm.curseTimer || 0) + dt;
                    rm.curseFrame = (rm.curseFrame || 0) + 0.25;
                    rm.y = rm.groundY; // Keep strictly at ground position under title word!

                    // Update speech bubble position dynamically as repairman curses
                    const bubble = document.getElementById(`repairman-bubble-${index}`);
                    if (bubble) {
                        bubble.style.left = `${rm.x + (index === 0 ? 7 : -7)}px`;
                        bubble.style.top = `${rm.y - 116}px`;
                    }

                    // Angry red steam puffs popping from head
                    if (Math.random() < 0.15) {
                        this.particles.push({
                            type: 'heavy_smoke',
                            x: rm.x + (Math.random() - 0.5) * 8,
                            y: rm.y - 50,
                            vx: (Math.random() - 0.5) * 1.5,
                            vy: -Math.random() * 2 - 1,
                            radius: Math.random() * 4 + 2,
                            color: '#ef4444',
                            alpha: 0.8,
                            decay: 0.04
                        });
                    }

                    if (rm.curseTimer > 2.2) {
                        this.removeSingleSpeechBubble(index);
                        rm.state = 'EXITING';
                        rm.targetX = rm.team === 'green' ? -150 : w + 150;
                    }
                }
                else if (rm.state === 'EXITING') {
                    allDone = false;
                    const dx = rm.targetX - rm.x;
                    if (Math.abs(dx) > 6) {
                        rm.x += Math.sign(dx) * Math.min(Math.abs(dx), 8.5); // 1.5x speed boost for exit running!
                        rm.animFrame += 0.5;
                        if (Math.random() < 0.25 && typeof audio !== 'undefined') audio.playRepairmenFootsteps();
                    } else {
                        rm.x = rm.targetX;
                        rm.state = 'DONE';
                    }
                }
                else if (rm.state === 'DONE') {
                    // Finished
                }
            });

            if (allDone) {
                this.idleSeqState = 'WAITING_FOR_IGNITION';
                this.ignitionTimer = 0;
            }
        }
        else if (this.idleSeqState === 'WAITING_FOR_IGNITION') {
            this.ignitionTimer = (this.ignitionTimer || 0) + dt;

            // Exactly 2.0 Seconds Delay After Both Repairmen Leave Off-Screen per user directive!
            if (this.ignitionTimer > 2.0) {
                this.idleSeqState = 'RE_IGNITING';
                this.reigniteTitleWithFireBurst();
            }
        }
    }

    reigniteTitleWithFireBurst() {
        const titleXe = document.querySelector('.title-xe');
        const titleTang = document.querySelector('.title-tang');

        // 1. Clear canvas fallen letters so HTML spans take seamless control!
        this.fallenLetters = [];

        // 2. Remove char-hidden and restore char-repaired on all letter spans
        const charEls = document.querySelectorAll('.char-l');
        charEls.forEach(el => {
            el.classList.remove('char-hidden', 'char-welded-gray', 'char-ignite-burst');
            el.classList.add('char-repaired');
        });

        // 3. Add title-igniting to title containers for 1.5s upward fire sweep animation
        if (titleXe) titleXe.classList.add('title-igniting');
        if (titleTang) titleTang.classList.add('title-igniting');

        // 4. Play dramatic ignition chime sound & explosion
        if (typeof audio !== 'undefined') {
            audio.playTitleRepairedChime();
            audio.playExplosion();
        }

        // 4. Emit 140 RISING fire particles sweeping upwards off top of screen!
        const rectXe = titleXe?.getBoundingClientRect();
        const rectTang = titleTang?.getBoundingClientRect();

        // Green/Blue Fire Wave for XE (sweeps upwards off top of screen!)
        if (rectXe) {
            for (let i = 0; i < 70; i++) {
                this.particles.push({
                    type: 'fire',
                    x: rectXe.left + Math.random() * rectXe.width,
                    y: rectXe.top + Math.random() * rectXe.height,
                    vx: (Math.random() - 0.5) * 6,
                    vy: -Math.random() * 7 - 4, // Strong upward velocity sweeping off top of screen!
                    radius: Math.random() * 9 + 4,
                    color: Math.random() > 0.4 ? '#38bdf8' : (Math.random() > 0.5 ? '#22c55e' : '#4ade80'),
                    alpha: 1.0,
                    decay: 0.022 // Long-lived particles that rise all the way off top screen!
                });
            }
        }

        // Red/Orange Fire Wave for TĂNG (sweeps upwards off top of screen!)
        if (rectTang) {
            for (let i = 0; i < 70; i++) {
                this.particles.push({
                    type: 'fire',
                    x: rectTang.left + Math.random() * rectTang.width,
                    y: rectTang.top + Math.random() * rectTang.height,
                    vx: (Math.random() - 0.5) * 6,
                    vy: -Math.random() * 7 - 4, // Strong upward velocity sweeping off top of screen!
                    radius: Math.random() * 9 + 4,
                    color: Math.random() > 0.4 ? '#ef4444' : (Math.random() > 0.5 ? '#ff4d4d' : '#facc15'),
                    alpha: 1.0,
                    decay: 0.022 // Long-lived particles that rise all the way off top screen!
                });
            }
        }

        // Sequence Complete! Remove title-igniting after 1.5s so 60 FPS keyframe animations take over
        setTimeout(() => {
            if (titleXe) titleXe.classList.remove('title-igniting');
            if (titleTang) titleTang.classList.remove('title-igniting');
            this.stopIdleEasterEgg();
        }, 1500);
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
        const w = this.canvas ? this.canvas.width : window.innerWidth;

        // Screen Shake impact when title is hit!
        this.screenShake = 22;

        // Play metallic title knockdown crash impact sound FX
        if (typeof audio !== 'undefined') {
            audio.playTitleCrash();
        }

        const rectXe = titleXe ? titleXe.getBoundingClientRect() : { left: w * 0.44, top: 120, width: 80, height: 60 };
        const rectTang = titleTang ? titleTang.getBoundingClientRect() : { left: w * 0.56, top: 120, width: 120, height: 60 };
        // Set groundY well below the title header (+85) so repairmen stand WELL BELOW title text!
        const groundY = (rectXe.bottom || (rectXe.top + 60)) + 85;

        if (!this.fallenLetters) this.fallenLetters = [];

        if (targetType === 'xe' || !targetType) {
            this.titleDamagedXe = true;
            document.querySelectorAll('.title-xe .char-l').forEach(el => {
                el.classList.add('char-hidden');
                el.classList.remove('char-repaired', 'char-ignite-burst');
            });

            if (titleXe) {
                titleXe.classList.add('title-unlit');
                titleXe.classList.remove('title-igniting');
                this.createHeavyExplosion(rectXe.left + rectXe.width / 2, rectXe.top + rectXe.height / 2, '#38bdf8');
            }

            const homeY = rectXe.top + rectXe.height / 2;
            const widthPerChar = rectXe.width / 2;

            // Scatter ground positions with ZERO overlap between letters
            const gX1 = rectXe.left - 20 + (Math.random() - 0.5) * 15;
            const gX2 = rectXe.left + widthPerChar * 1.6 + (Math.random() - 0.5) * 15;

            const rot1 = (Math.random() - 0.5) * Math.PI * 1.5;
            const rot2 = (Math.random() - 0.5) * Math.PI * 1.5;

            this.fallenLetters.push({
                id: 'xe_X',
                team: 'green',
                char: 'X',
                homeX: rectXe.left + widthPerChar * 0.45,
                homeY: homeY,
                currentX: rectXe.left + widthPerChar * 0.45,
                currentY: homeY,
                groundX: gX1,
                groundY: groundY + (Math.random() - 0.5) * 12,
                rotation: rot1,
                currentRotation: rot1,
                repaired: false,
                falling: true
            });

            this.fallenLetters.push({
                id: 'xe_E',
                team: 'green',
                char: 'E',
                homeX: rectXe.left + widthPerChar * 1.55,
                homeY: homeY,
                currentX: rectXe.left + widthPerChar * 1.55,
                currentY: homeY,
                groundX: gX2,
                groundY: groundY + (Math.random() - 0.5) * 12,
                rotation: rot2,
                currentRotation: rot2,
                repaired: false,
                falling: true
            });
        }

        if (targetType === 'tang' || !targetType) {
            this.titleDamagedTang = true;
            document.querySelectorAll('.title-tang .char-l').forEach(el => {
                el.classList.add('char-hidden');
                el.classList.remove('char-repaired', 'char-ignite-burst');
            });

            if (titleTang) {
                titleTang.classList.add('title-unlit');
                titleTang.classList.remove('title-igniting');
                this.createHeavyExplosion(rectTang.left + rectTang.width / 2, rectTang.top + rectTang.height / 2, '#ef4444');
            }

            const homeY = rectTang.top + rectTang.height / 2;
            const widthPerChar = rectTang.width / 4;
            const chars = ['T', 'Ă', 'N', 'G'];

            // Scatter 4 letters naturally across ground with zero overlap
            const baseStartX = rectTang.left - 30;
            const stepX = (rectTang.width + 60) / 3.5;

            chars.forEach((ch, idx) => {
                const gX = baseStartX + idx * stepX + (Math.random() - 0.5) * 12;
                // Specific wild rotations (e.g. Ă upside down 180 deg, T tilted sideways)
                let rot = (Math.random() - 0.5) * Math.PI * 1.6;
                if (ch === 'Ă') rot = Math.PI + (Math.random() - 0.5) * 0.4;

                this.fallenLetters.push({
                    id: `tang_${ch}_${idx}`,
                    team: 'red',
                    char: ch,
                    homeX: rectTang.left + widthPerChar * (idx + 0.5),
                    homeY: homeY,
                    currentX: rectTang.left + widthPerChar * (idx + 0.5),
                    currentY: homeY,
                    groundX: gX,
                    groundY: groundY + (Math.random() - 0.5) * 14,
                    rotation: rot,
                    currentRotation: rot,
                    repaired: false,
                    falling: true
                });
            });
        }
    }

    spawnRepairmen() {
        const w = this.canvas ? this.canvas.width : window.innerWidth;
        const titleXe = document.querySelector('.title-xe');
        const titleTang = document.querySelector('.title-tang');

        const rectXe = titleXe ? titleXe.getBoundingClientRect() : { left: w * 0.44, top: 120, width: 80, height: 60 };
        const rectTang = titleTang ? titleTang.getBoundingClientRect() : { left: w * 0.56, top: 120, width: 120, height: 60 };

        // Ground level is well below title text (+85)
        const groundY = (rectXe.bottom || (rectXe.top + 60)) + 85;

        const greenLetters = (this.fallenLetters || []).filter(l => l.team === 'green');
        const redLetters = (this.fallenLetters || []).filter(l => l.team === 'red');

        this.repairmen = [
            {
                id: 'rep-1',
                team: 'green',
                x: -100,
                y: groundY,
                groundY: groundY,
                homeGroundX: rectXe.left + (rectXe.width / 2),
                state: 'RUNNING_TO_GROUND',
                animFrame: 0,
                workFrame: 0,
                curseFrame: 0,
                curseTimer: 0,
                assignedLetters: greenLetters,
                letterIndex: 0,
                holdingLetter: null
            },
            {
                id: 'rep-2',
                team: 'red',
                x: w + 100,
                y: groundY,
                groundY: groundY,
                homeGroundX: rectTang.left + (rectTang.width / 2),
                state: 'RUNNING_TO_GROUND',
                animFrame: 0,
                workFrame: 0,
                curseFrame: 0,
                curseTimer: 0,
                assignedLetters: redLetters,
                letterIndex: 0,
                holdingLetter: null
            }
        ];
    }

    drawFallenLetters() {
        if (!this.fallenLetters || this.fallenLetters.length === 0) return;

        const titleEl = document.querySelector('.main-title') || document.querySelector('.title-xe');
        const fontSizePx = titleEl ? parseFloat(window.getComputedStyle(titleEl).fontSize) : 83;

        this.ctx.save();
        this.ctx.font = `900 ${fontSizePx}px "Be Vietnam Pro", "Montserrat", sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        this.fallenLetters.forEach(l => {
            // Smooth falling physics from title to ground
            if (l.falling) {
                l.currentY += (l.groundY - l.currentY) * 0.12;
                l.currentX += (l.groundX - l.currentX) * 0.12;
                if (Math.abs(l.currentY - l.groundY) < 1.5) {
                    l.currentY = l.groundY;
                    l.currentX = l.groundX;
                    l.falling = false;
                }
            }

            this.ctx.save();
            this.ctx.translate(l.currentX, l.currentY);
            this.ctx.rotate(l.currentRotation || 0);

            // Burnt dark charcoal letter styling with exact font & layout
            this.ctx.fillStyle = '#475569';
            this.ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
            this.ctx.lineWidth = 1.5;
            this.ctx.fillText(l.char, 0, 0);
            this.ctx.strokeText(l.char, 0, 0);

            this.ctx.restore();
        });

        this.ctx.restore();
    }

    showSingleSpeechBubble(rm, index) {
        if (typeof audio !== 'undefined') audio.playPopBubble();

        const isLeft = (index === 0);
        let bubble = document.getElementById(`repairman-bubble-${index}`);
        if (!bubble) {
            bubble = document.createElement('div');
            bubble.className = `repairman-bubble ${isLeft ? 'bubble-left' : 'bubble-right'}`;
            bubble.id = `repairman-bubble-${index}`;
            document.body.appendChild(bubble);
        }
        bubble.innerText = isLeft ? " !@$%" : "#@!#%";

        if (isLeft) {
            bubble.style.left = `${rm.x + 7}px`;
            bubble.style.top = `${rm.y - 116}px`;
        } else {
            bubble.style.left = `${rm.x - 7}px`;
            bubble.style.top = `${rm.y - 116}px`;
        }

        if (!this.bubbles) this.bubbles = [];
        if (!this.bubbles.includes(bubble)) this.bubbles.push(bubble);
    }

    removeSingleSpeechBubble(index) {
        const bubble = document.getElementById(`repairman-bubble-${index}`);
        if (bubble && bubble.parentNode) {
            bubble.parentNode.removeChild(bubble);
        }
        if (this.bubbles) {
            this.bubbles = this.bubbles.filter(b => b.id !== `repairman-bubble-${index}`);
        }
    }

    removeSpeechBubbles() {
        if (this.bubbles) {
            this.bubbles.forEach(b => {
                if (b && b.parentNode) b.parentNode.removeChild(b);
            });
        }
        this.bubbles = [];
    }

    stopIdleEasterEgg() {
        this.idleSeqState = 'IDLE';
        this.idleSeqTimer = 0;
        this.superTanks = [];
        this.repairmen = [];
        this.idleBullets = [];
        this.fallenLetters = [];
        this.titleDamagedXe = false;
        this.titleDamagedTang = false;
        this.firedGreen = false;
        this.firedRed = false;
        this.titleRepaired = false;
        this.lastActivityTime = Date.now();
        this.removeSpeechBubbles();

        document.querySelectorAll('.char-l').forEach(el => {
            el.classList.remove('char-hidden', 'char-ignite-burst');
        });

        const titleXe = document.querySelector('.title-xe');
        const titleTang = document.querySelector('.title-tang');
        if (titleXe) {
            titleXe.classList.remove('title-broken-xe', 'title-igniting', 'title-repaired-bounce');
        }
        if (titleTang) {
            titleTang.classList.remove('title-broken-tang', 'title-igniting', 'title-repaired-bounce');
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

            // Determine direction facing: 1 = face right, -1 = face left
            let dir = 1;
            if (rm.state === 'EXITING') {
                const dx = rm.targetX - rm.x;
                if (Math.abs(dx) > 1) dir = Math.sign(dx);
                else dir = rm.team === 'green' ? -1 : 1;
            } else if (rm.state === 'RUNNING_TO_GROUND') {
                const currentLetter = (rm.assignedLetters && rm.letterIndex < rm.assignedLetters.length) ? rm.assignedLetters[rm.letterIndex] : null;
                const targetX = currentLetter ? currentLetter.groundX : rm.x;
                const dx = targetX - rm.x;
                if (Math.abs(dx) > 1) dir = Math.sign(dx);
                else dir = rm.team === 'green' ? 1 : -1;
            } else {
                dir = rm.team === 'green' ? 1 : -1;
            }

            // Ground Highlight & Shadow Aura
            const auraGradient = this.ctx.createRadialGradient(0, 0, 3, 0, 0, 25);
            auraGradient.addColorStop(0, rm.team === 'green' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(239, 68, 68, 0.4)');
            auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            this.ctx.fillStyle = auraGradient;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, 25, 8, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Enlarge repairmen scale to 1.5x ("2 thợ sửa tăng kích thước lên 1 lần")
            this.ctx.scale(1.5, 1.5);

            // Running bobbing & leg/arm swing calculation
            let bob = 0;
            let legSwing = 0;
            let armLSwing = 0;
            let armRSwing = 0;
            let torsoTilt = 0;

            const isRunning = (rm.state === 'RUNNING_TO_GROUND' || rm.state === 'EXITING');
            const isCarrying = (rm.state === 'CARRYING_UP' || rm.state === 'PLACING_LETTER');
            const isCursing = (rm.state === 'CURSING');
            const isWelding = (rm.state === 'WELDING');

            if (isRunning) {
                legSwing = Math.sin(rm.animFrame || 0) * 10;
                armLSwing = -Math.sin(rm.animFrame || 0) * 12;
                armRSwing = Math.sin(rm.animFrame || 0) * 12;
                bob = Math.abs(Math.sin((rm.animFrame || 0) * 2)) * 3;
                torsoTilt = dir * 0.14; // Leans in running direction!
            }

            this.ctx.translate(0, -bob);
            this.ctx.rotate(torsoTilt);

            // Flip character horizontally according to direction
            this.ctx.scale(dir, 1);

            // 1. Combat Boots (y = -5 to 0)
            this.ctx.fillStyle = '#0f172a';
            this.ctx.fillRect(-9 - legSwing * 0.2, -5, 7, 5);
            this.ctx.fillRect(2 + legSwing * 0.2, -5, 7, 5);

            // 2. Camo Pants (y = -22 to -5)
            this.ctx.fillStyle = rm.team === 'green' ? '#14532d' : '#7f1d1d';
            // Left leg
            this.ctx.beginPath();
            this.ctx.moveTo(-8, -22);
            this.ctx.lineTo(-1, -22);
            this.ctx.lineTo(-1 - legSwing * 0.2, -5);
            this.ctx.lineTo(-8 - legSwing * 0.2, -5);
            this.ctx.closePath();
            this.ctx.fill();

            // Right leg
            this.ctx.beginPath();
            this.ctx.moveTo(1, -22);
            this.ctx.lineTo(8, -22);
            this.ctx.lineTo(8 + legSwing * 0.2, -5);
            this.ctx.lineTo(1 + legSwing * 0.2, -5);
            this.ctx.closePath();
            this.ctx.fill();

            // Utility Belt (y = -25 to -22)
            this.ctx.fillStyle = '#1e293b';
            this.ctx.fillRect(-10, -25, 20, 3);
            this.ctx.fillStyle = '#facc15';
            this.ctx.fillRect(-2.5, -25, 5, 3);

            // 3. High-Vis Vest Torso (y = -44 to -25)
            this.ctx.fillStyle = rm.team === 'green' ? '#16a34a' : '#dc2626';
            this.ctx.fillRect(-9, -44, 18, 19);
            // Reflective stripes
            this.ctx.fillStyle = '#facc15';
            this.ctx.fillRect(-9, -38, 18, 3);
            this.ctx.fillRect(-9, -31, 18, 3);

            // 4. Head & Helmet (y = -55 to -44)
            let headAngle = 0;
            if (isCursing) {
                headAngle = Math.sin((rm.curseFrame || 0) * 4) * 0.2; // Angry head shake!
            }

            this.ctx.save();
            this.ctx.translate(0, -48);
            this.ctx.rotate(headAngle);

            // Face
            this.ctx.fillStyle = '#fde047';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
            this.ctx.fill();

            // Helmet
            this.ctx.fillStyle = rm.team === 'green' ? '#14532d' : '#7f1d1d';
            this.ctx.beginPath();
            this.ctx.arc(0, -2, 7.5, Math.PI, 0);
            this.ctx.fill();

            // Visor (Glows Angry Red when cursing!)
            this.ctx.fillStyle = isCursing ? '#ef4444' : '#38bdf8';
            this.ctx.shadowColor = isCursing ? '#ef4444' : '#38bdf8';
            this.ctx.shadowBlur = 8;
            this.ctx.fillRect(-4, -3, 8, 3);
            this.ctx.shadowBlur = 0;

            this.ctx.restore(); // end head

            // 5. Arms & Actions (Carrying with 2 Hands vs Mechanical Plasma Welder Torch vs 90-Deg Cursing vs Running)
            this.ctx.fillStyle = rm.team === 'green' ? '#15803d' : '#b91c1c';

            if (isCursing) {
                // ANGRY V-SHAPE ARMS RAISED UP ANIMATION (\O/ - Dơ 2 tay LÊN ngả ra tạo hình chữ V rộng vẫy vẫy chửi!)
                const wave1 = Math.sin((rm.curseFrame || 0) * 14) * 3;
                const wave2 = Math.cos((rm.curseFrame || 0) * 14) * 3;

                this.ctx.strokeStyle = rm.team === 'green' ? '#15803d' : '#b91c1c';
                this.ctx.lineWidth = 5;
                this.ctx.lineCap = 'round';

                // Left Arm: Shoulder (-8, -38) -> UP-LEFT to (-20, -56 + wave1)
                this.ctx.beginPath();
                this.ctx.moveTo(-8, -38);
                this.ctx.lineTo(-20, -56 + wave1);
                this.ctx.stroke();

                // Left Fist
                this.ctx.fillStyle = '#fde047';
                this.ctx.beginPath();
                this.ctx.arc(-21, -57 + wave1, 3.5, 0, Math.PI * 2);
                this.ctx.fill();

                // Right Arm: Shoulder (+8, -38) -> UP-RIGHT to (+20, -56 + wave2)
                this.ctx.strokeStyle = rm.team === 'green' ? '#15803d' : '#b91c1c';
                this.ctx.beginPath();
                this.ctx.moveTo(8, -38);
                this.ctx.lineTo(20, -56 + wave2);
                this.ctx.stroke();

                // Right Fist
                this.ctx.fillStyle = '#fde047';
                this.ctx.beginPath();
                this.ctx.arc(21, -57 + wave2, 3.5, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (isCarrying) {
                // 2-HAND CARRYING POSE: BOTH ARMS EXTENDED FORWARD HOLDING LETTER AT TORSO LEVEL!
                // Left Arm reaching forward
                this.ctx.save();
                this.ctx.translate(-8, -35);
                this.ctx.rotate(Math.PI * 0.15);
                this.ctx.fillRect(-2, 0, 4, 18);
                this.ctx.fillStyle = '#fde047';
                this.ctx.beginPath();
                this.ctx.arc(0, 18, 3.5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();

                // Right Arm reaching forward
                this.ctx.save();
                this.ctx.fillStyle = rm.team === 'green' ? '#15803d' : '#b91c1c';
                this.ctx.translate(8, -35);
                this.ctx.rotate(-Math.PI * 0.15);
                this.ctx.fillRect(-2, 0, 4, 18);
                this.ctx.fillStyle = '#fde047';
                this.ctx.beginPath();
                this.ctx.arc(0, 18, 3.5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();

                // RENDER HELD LETTER DIRECTLY IN HIS 2 HANDS AT TORSO LEVEL!
                if (rm.holdingLetter) {
                    const titleEl = document.querySelector('.main-title') || document.querySelector('.title-xe');
                    const fontSizePx = titleEl ? parseFloat(window.getComputedStyle(titleEl).fontSize) : 83;
                    const carryFontSize = fontSizePx / 1.5; // Scaled down for 1.5x repairman canvas transform

                    this.ctx.save();
                    this.ctx.font = `900 ${carryFontSize}px "Be Vietnam Pro", "Montserrat", sans-serif`;
                    this.ctx.fillStyle = '#475569';
                    this.ctx.strokeStyle = rm.team === 'green' ? '#38bdf8' : '#ef4444';
                    this.ctx.lineWidth = 2;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.shadowColor = rm.team === 'green' ? '#38bdf8' : '#ef4444';
                    this.ctx.shadowBlur = 8;
                    this.ctx.strokeText(rm.holdingLetter.char, 10, -32);
                    this.ctx.fillText(rm.holdingLetter.char, 10, -32);
                    this.ctx.restore();
                }
            } else if (isWelding) {
                // Mechanical Plasma Welder Machine (Rút máy hàn cơ khí ra hàn với tia lửa hàn plasma!)
                const toolAngle = Math.sin((rm.workFrame || 0) * 0.8) * 0.4;

                this.ctx.fillRect(-11, -40, 4, 13);
                this.ctx.fillRect(7, -40, 4, 13);

                this.ctx.save();
                this.ctx.translate(5, -34);
                this.ctx.rotate(-Math.PI * 0.25 + toolAngle);

                // Heavy mechanical torch handle & plasma nozzle
                this.ctx.fillStyle = '#0284c7';
                this.ctx.fillRect(0, -16, 6, 16);
                this.ctx.fillStyle = '#38bdf8';
                this.ctx.shadowColor = '#38bdf8';
                this.ctx.shadowBlur = 12;
                this.ctx.fillRect(-3, -20, 12, 5);

                // Plasma Flash
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(3, -22, Math.random() * 5 + 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;

                this.ctx.restore();
            } else {
                // Running arm swinging
                this.ctx.save();
                this.ctx.translate(-9, -40);
                this.ctx.rotate(armLSwing * 0.05);
                this.ctx.fillRect(-2, 0, 4, 14);
                this.ctx.restore();

                this.ctx.save();
                this.ctx.translate(9, -40);
                this.ctx.rotate(armRSwing * 0.05);
                this.ctx.fillRect(-2, 0, 4, 14);
                this.ctx.restore();
            }

            this.ctx.restore();
        });
    }

    updateTitleRects() {
        const titleXeEl = document.querySelector('.title-xe');
        const titleTangEl = document.querySelector('.title-tang');
        const mainTitleEl = document.querySelector('.main-title');
        if (titleXeEl) this.titleXeRect = titleXeEl.getBoundingClientRect();
        if (titleTangEl) this.titleTangRect = titleTangEl.getBoundingClientRect();
        if (mainTitleEl) {
            const r = mainTitleEl.getBoundingClientRect();
            this.titleCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }
    }
}

// Instantiate Global Homepage Engine
const homepageEngine = new HomepageEngine();
window.addEventListener('DOMContentLoaded', () => {
    homepageEngine.init();
});
