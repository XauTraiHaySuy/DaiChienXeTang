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
    }

    stop() {
        this.active = false;
        if (this.canvas) {
            this.canvas.style.display = 'none';
        }
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
            this.draw();
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
            if (p.type === 'smoke' || p.type === 'fire') {
                p.x += p.vx || 0;
                p.y += p.vy || 0;
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

        // Draw Particles (Smoke & Fire)
        this.particles.forEach(p => {
            if (p.type === 'smoke' || p.type === 'fire') {
                this.ctx.save();
                this.ctx.globalAlpha = p.alpha;
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        });
    }

    bindEvents() {
        // Co-op Modal Toggle
        const coopBtn = document.getElementById('coop-btn');
        const coopModal = document.getElementById('coop-modal');
        const coopClose = document.getElementById('coop-modal-close');

        if (coopBtn && coopModal) {
            coopBtn.addEventListener('click', () => {
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
            authBtn.addEventListener('click', () => {
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
}

// Instantiate Global Homepage Engine
const homepageEngine = new HomepageEngine();
window.addEventListener('DOMContentLoaded', () => {
    homepageEngine.init();
});
