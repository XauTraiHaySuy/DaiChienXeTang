// js/tank.js - High-Quality Tank Rendering, Stun/Slow States & Physics

class Tank {
    constructor(x, y, colorScheme, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.radius = 18;
        this.color = colorScheme;
        this.isPlayer = isPlayer;

        this.bodyAngle = 0;
        this.turretAngle = 0;
        this.baseSpeed = isPlayer ? 3.0 : 2.2;
        this.speed = this.baseSpeed;
        this.alive = true;
        this.cooldown = 0;

        // Status Effects (Stun & Slow)
        this.stunTimer = 0; // Frames immobilized (3s = 180 frames)
        this.slowTimer = 0; // Frames slowed down by EMP

        // Recoil FX
        this.recoilOffset = 0;
        this.lastX = x;
        this.lastY = y;
        this.distanceMoved = 0;
    }

    checkWallCollide(nx, ny) {
        // 1. Strict Canvas Map Outer Border Collision Lock (Accounts for 20px outer metal walls)
        const minX = WALL_THICKNESS + this.radius;
        const maxX = CANVAS_WIDTH - WALL_THICKNESS - this.radius;
        const minY = WALL_THICKNESS + this.radius;
        const maxY = CANVAS_HEIGHT - WALL_THICKNESS - this.radius;

        if (nx < minX || nx > maxX || ny < minY || ny > maxY) {
            return true;
        }

        // 2. Maze Wall Collision Check
        for (const w of walls) {
            const closestX = Math.max(w.x, Math.min(nx, w.x + w.w));
            const closestY = Math.max(w.y, Math.min(ny, w.y + w.h));
            const dx = nx - closestX;
            const dy = ny - closestY;
            if ((dx * dx + dy * dy) < (this.radius * this.radius)) {
                return true;
            }
        }
        return false;
    }

    moveWithWallSliding(dx, dy) {
        // Apply Stun / Slow Speed Modifiers
        if (this.stunTimer > 0) {
            return; // Cannot move while stunned
        }

        let speedMultiplier = 1.0;
        if (this.slowTimer > 0) {
            speedMultiplier = 0.25; // 25% speed under EMP slow
        }

        const actualDx = dx * speedMultiplier;
        const actualDy = dy * speedMultiplier;

        let nextX = this.x + actualDx;
        let nextY = this.y + actualDy;

        let moved = false;
        if (!this.checkWallCollide(nextX, this.y)) {
            this.x = nextX;
            moved = true;
        }
        if (!this.checkWallCollide(this.x, nextY)) {
            this.y = nextY;
            moved = true;
        }

        // Hard Boundary Clamp to Canvas Map Limits (strictly inside 20px outer metal walls)
        const minX = WALL_THICKNESS + this.radius;
        const maxX = CANVAS_WIDTH - WALL_THICKNESS - this.radius;
        const minY = WALL_THICKNESS + this.radius;
        const maxY = CANVAS_HEIGHT - WALL_THICKNESS - this.radius;

        this.x = Math.max(minX, Math.min(maxX, this.x));
        this.y = Math.max(minY, Math.min(maxY, this.y));

        if (moved) {
            const dist = Math.hypot(this.x - this.lastX, this.y - this.lastY);
            this.distanceMoved += dist;
            if (this.distanceMoved > 16) {
                trackMarks.push(new TrackMark(this.x, this.y, this.bodyAngle));
                if (trackMarks.length > 250) trackMarks.shift();
                this.distanceMoved = 0;
            }
        }

        this.lastX = this.x;
        this.lastY = this.y;
    }

    getValidMuzzlePosition() {
        const maxMuzzleDist = this.radius + 14;
        const cos = Math.cos(this.turretAngle);
        const sin = Math.sin(this.turretAngle);

        let validDist = maxMuzzleDist;
        let isBlockedByWall = false;

        // Step along barrel trajectory from tank radius out to maxMuzzleDist
        for (let d = this.radius - 2; d <= maxMuzzleDist; d += 2) {
            const px = this.x + cos * d;
            const py = this.y + sin * d;
            if (typeof checkWallCollideAt === 'function' && checkWallCollideAt(px, py, 6)) {
                validDist = Math.max(this.radius - 4, d - 4);
                isBlockedByWall = true;
                break;
            }
        }

        return {
            x: this.x + cos * validDist,
            y: this.y + sin * validDist,
            dist: validDist,
            isBlockedByWall: isBlockedByWall
        };
    }

    shoot() {
        if (!this.alive || this.cooldown > 0 || this.stunTimer > 0) return false;

        if (getActiveBulletsCount(this) >= 3) {
            return false;
        }

        const muzzle = this.getValidMuzzlePosition();

        // 💥 BARREL JAMMED AT POINT-BLANK RANGE AGAINST WALL:
        // If firing with muzzle jammed against wall, the shot backfires, ricochets backward into the tank, and destroys it ("nổ chết")!
        if (muzzle.isBlockedByWall) {
            this.cooldown = 18;
            this.recoilOffset = 8;
            if (typeof audio !== 'undefined') {
                audio.playShoot(this.isPlayer);
                audio.playExplosion();
            }

            // Muzzle explosion on near face of wall
            createMuzzleFlash(muzzle.x, muzzle.y, this.turretAngle, this.isPlayer);
            createExplosion(muzzle.x, muzzle.y, true);

            // Bounced backward bullet heading right back at the tank
            const backAngle = this.turretAngle + Math.PI;
            const backBullet = new Bullet(muzzle.x, muzzle.y, backAngle, this);
            backBullet.hasBounced = true;
            bullets.push(backBullet);

            // Tank is destroyed by self-backfire explosion!
            this.alive = false;
            createExplosion(this.x, this.y, true);

            return true;
        }

        bullets.push(new Bullet(muzzle.x, muzzle.y, this.turretAngle, this));
        this.cooldown = 18;

        this.recoilOffset = 6;
        createMuzzleFlash(muzzle.x, muzzle.y, this.turretAngle, this.isPlayer);
        audio.playShoot(this.isPlayer);
        return true;
    }

    update() {
        if (this.cooldown > 0) this.cooldown--;
        if (this.recoilOffset > 0) this.recoilOffset *= 0.8;

        if (this.stunTimer > 0) this.stunTimer--;
        if (this.slowTimer > 0) this.slowTimer--;
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Status Effects Indicator Above Tank
        if (this.stunTimer > 0) {
            ctx.save();
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`🕸️ BỊ DÍNH BẪY (${Math.ceil(this.stunTimer / 60)}s)`, 0, -this.radius - 16);
            ctx.restore();
        } else if (this.slowTimer > 0) {
            ctx.save();
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`⚡ BỊ LÀM CHẬM (${Math.ceil(this.slowTimer / 60)}s)`, 0, -this.radius - 16);
            ctx.restore();
        }

        // 1. Headlight / Laser Sight (Truncated at nearest wall face)
        let laserDist = 180;
        const cosT = Math.cos(this.turretAngle);
        const sinT = Math.sin(this.turretAngle);
        if (typeof checkWallCollideAt === 'function') {
            for (let d = 20; d <= 180; d += 6) {
                const lx = this.x + cosT * d;
                const ly = this.y + sinT * d;
                if (checkWallCollideAt(lx, ly, 3)) {
                    laserDist = d;
                    break;
                }
            }
        }

        ctx.save();
        ctx.rotate(this.turretAngle);
        const laserWidthAtEnd = Math.max(3, (laserDist / 180) * 18);
        const grad = ctx.createLinearGradient(0, 0, laserDist, 0);
        grad.addColorStop(0, this.isPlayer ? 'rgba(56, 189, 248, 0.25)' : 'rgba(239, 68, 68, 0.25)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(laserDist, -laserWidthAtEnd);
        ctx.lineTo(laserDist, laserWidthAtEnd);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 2. Tank Body
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        ctx.rotate(this.bodyAngle);

        // Tread Tracks
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-this.radius - 3, -this.radius - 1, 8, this.radius * 2 + 2);
        ctx.fillRect(this.radius - 5, -this.radius - 1, 8, this.radius * 2 + 2);

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        for (let i = -this.radius; i <= this.radius; i += 6) {
            ctx.beginPath();
            ctx.moveTo(-this.radius - 3, i);
            ctx.lineTo(-this.radius + 5, i);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(this.radius - 5, i);
            ctx.lineTo(this.radius + 3, i);
            ctx.stroke();
        }

        // Chassis Body Plate
        const bodyGrad = ctx.createLinearGradient(-this.radius, 0, this.radius, 0);
        bodyGrad.addColorStop(0, this.color.primaryDark);
        bodyGrad.addColorStop(0.5, this.color.primary);
        bodyGrad.addColorStop(1, this.color.primaryLight);
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(-this.radius + 3, -this.radius + 3, (this.radius - 3) * 2, (this.radius - 3) * 2);

        ctx.strokeStyle = this.color.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.radius + 3, -this.radius + 3, (this.radius - 3) * 2, (this.radius - 3) * 2);

        ctx.fillStyle = '#cbd5e1';
        const rOff = this.radius - 6;
        [[-rOff, -rOff], [rOff, -rOff], [-rOff, rOff], [rOff, rOff]].forEach(([rx, ry]) => {
            ctx.beginPath();
            ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();

        // 3. Turret Cannon & Head
        ctx.save();
        ctx.rotate(this.turretAngle);

        const muzzleInfo = this.getValidMuzzlePosition();
        const maxBarrelLen = this.radius + 12 - this.recoilOffset;
        const barrelLength = Math.max(4, Math.min(maxBarrelLen, muzzleInfo.dist - this.recoilOffset));

        const barrelGrad = ctx.createLinearGradient(0, -4, 0, 4);
        barrelGrad.addColorStop(0, '#64748b');
        barrelGrad.addColorStop(0.5, '#1e293b');
        barrelGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = barrelGrad;
        ctx.fillRect(4, -4, barrelLength, 8);

        ctx.fillStyle = this.color.accent;
        ctx.fillRect(barrelLength - 2, -5, 4, 10);

        const domeGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, 11);
        domeGrad.addColorStop(0, '#ffffff');
        domeGrad.addColorStop(0.3, this.color.primaryLight);
        domeGrad.addColorStop(1, this.color.primaryDark);
        ctx.fillStyle = domeGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        ctx.restore();
    }
}

// ----------------------------------------------------
// GIANT PURPLE SUPPORT TANK CLASS (SUPPLY AIRDROP)
// ----------------------------------------------------
class SupportTank extends Tank {
    constructor(startX, startY, targetX, targetY) {
        super(targetX, targetY, {
            primary: '#a855f7',
            primaryDark: '#7e22ce',
            primaryLight: '#c084fc',
            border: '#e9d5ff',
            accent: '#facc15'
        }, false);

        this.radius = 28; // Giant Heavy Tank!
        this.baseSpeed = 3.6; // High Speed Pursuit
        this.speed = this.baseSpeed;

        // Smooth Air-Drop Landing FX starting from plane's position
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.x = startX;
        this.y = startY;

        this.dropProgress = 0;
        this.isLanding = true;

        // 2-Second Alignment Calibration Phase
        this.isCalibrating = false;
        this.calibrationTimer = 120; // 2s (120 frames)
        this.team = null; // 'blue' or 'red'

        // Health (2 bullet hits required to destroy)
        this.hp = 2;
        this.maxHp = 2;

        // 8-Second Lifetime
        this.lifeTimer = 480; // 8 seconds at 60fps
        this.maxLifeTimer = 480;

        this.shootTimer = Math.floor(Math.random() * 15) + 10;
        this.target = null;

        // AI Pathfinding & Anti-Stuck System
        this.pathNodes = [];
        this.pathIndex = 0;
        this.repathTimer = 0;
        this.stuckTimer = 0;
        this.lastPos = { x: targetX, y: targetY };
    }

    update(player, enemies, bullets) {
        if (!this.alive) return;

        // 1. Landing Drop Phase from Plane to Ground
        if (this.isLanding) {
            this.dropProgress += 0.022; // ~45 frames smooth drop
            if (this.dropProgress >= 1) {
                this.dropProgress = 1;
                this.x = this.targetX;
                this.y = this.targetY;
                this.isLanding = false;
                this.isCalibrating = true;
                this.calibrationTimer = 120; // 2s calibration phase
                createExplosion(this.x, this.y, false);
                audio.playTrapStun();

                // Shatter any maze walls at the landing location!
                if (typeof destroyWallsAt === 'function') {
                    destroyWallsAt(this.x, this.y, 48);
                }
            } else {
                // Interpolate from plane startPos to ground targetPos
                this.x = this.startX + (this.targetX - this.startX) * this.dropProgress;
                this.y = this.startY + (this.targetY - this.startY) * this.dropProgress;
            }
            return;
        }

        // 2. Calibration Phase (2 seconds)
        if (this.isCalibrating) {
            this.calibrationTimer--;
            if (this.calibrationTimer <= 0) {
                this.isCalibrating = false;
                this.team = Math.random() < 0.5 ? 'blue' : 'red';
                if (this.team === 'blue') audio.playWinVoice();
                else audio.playJetPass();
            }
            return;
        }

        // 3. Active Lifetime (30 seconds)
        this.lifeTimer--;
        if (this.lifeTimer <= 0) {
            this.alive = false;
            createExplosion(this.x, this.y, true);
            return;
        }

        super.update();

        // 4. Target Acquisition based on Team
        if (this.team === 'blue') {
            let closestEnemy = null;
            let minDist = 9999;
            enemies.forEach(e => {
                if (e && e.alive) {
                    const d = Math.hypot(e.x - this.x, e.y - this.y);
                    if (d < minDist) {
                        minDist = d;
                        closestEnemy = e;
                    }
                }
            });
            this.target = closestEnemy;
        } else if (this.team === 'red') {
            this.target = (player && player.alive) ? player : null;
        }

        // 5. Active Pursuit Movement & Shooting (A* Pathfinding & Anti-Stuck)
        if (this.target && this.target.alive) {
            const aimAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            this.turretAngle = aimAngle;

            // Anti-stuck watchdog
            const distMoved = Math.hypot(this.x - this.lastPos.x, this.y - this.lastPos.y);
            if (distMoved < 0.3) this.stuckTimer++;
            else this.stuckTimer = Math.max(0, this.stuckTimer - 1);
            this.lastPos = { x: this.x, y: this.y };

            // Repath A* periodically
            this.repathTimer--;
            if (this.repathTimer <= 0 || this.stuckTimer > 6 || !this.pathNodes || this.pathNodes.length === 0) {
                this.repathTimer = 12;
                if (typeof findPathAStar === 'function') {
                    this.pathNodes = findPathAStar({ x: this.x, y: this.y }, { x: this.target.x, y: this.target.y });
                    this.pathIndex = 0;
                }
                if (this.stuckTimer > 6) {
                    this.stuckTimer = 0;
                }
            }

            let moveAngle = aimAngle;
            if (this.pathNodes && this.pathNodes.length > 0) {
                while (this.pathIndex < this.pathNodes.length - 1) {
                    const nextNode = this.pathNodes[this.pathIndex + 1];
                    const distToCurrent = Math.hypot(this.pathNodes[this.pathIndex].x - this.x, this.pathNodes[this.pathIndex].y - this.y);
                    if (distToCurrent < 20) {
                        this.pathIndex++;
                    } else {
                        break;
                    }
                }
                const targetNode = this.pathNodes[this.pathIndex];
                if (targetNode) {
                    moveAngle = Math.atan2(targetNode.y - this.y, targetNode.x - this.x);
                }
            }

            // Move fast towards target with Wall Sliding
            const dx = Math.cos(moveAngle) * this.speed;
            const dy = Math.sin(moveAngle) * this.speed;
            this.moveWithWallSliding(dx, dy);
            this.bodyAngle = moveAngle;

            // Rapid Shooting while pursuing
            this.shootTimer--;
            if (this.shootTimer <= 0) {
                this.shootTimer = 18;
                const muzzleDist = this.radius + 18;
                const bx = this.x + Math.cos(this.turretAngle) * muzzleDist;
                const by = this.y + Math.sin(this.turretAngle) * muzzleDist;

                const b = new Bullet(bx, by, this.turretAngle, this);
                b.radius = 7;
                bullets.push(b);
                createMuzzleFlash(bx, by, this.turretAngle, this.team === 'blue');
                audio.playShoot(this.team === 'blue');
            }
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();

        // 1. Landing Phase: Falling from plane to ground
        if (this.isLanding) {
            const currentAltitude = (1 - this.dropProgress) * 220;

            // Ground Drop Target Indicator & Shadow
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.ellipse(this.targetX, this.targetY, this.radius * (0.6 + this.dropProgress * 0.6), this.radius * 0.4 * (0.6 + this.dropProgress * 0.6), 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(192, 132, 252, 0.7)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.arc(this.targetX, this.targetY, this.radius + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Render Parachute & Tank falling from plane
            ctx.save();
            ctx.translate(this.x, this.y - currentAltitude);

            ctx.fillStyle = '#a855f7';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, -60, 42, Math.PI, 0);
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-40, -60); ctx.lineTo(-this.radius, -10);
            ctx.moveTo(40, -60); ctx.lineTo(this.radius, -10);
            ctx.moveTo(-18, -60); ctx.lineTo(0, -10);
            ctx.moveTo(18, -60); ctx.lineTo(0, -10);
            ctx.stroke();

            this.drawTankBody(ctx);
            ctx.restore();
            ctx.restore();
            return;
        }

        // Ground Drawing
        ctx.save();
        ctx.translate(this.x, this.y);
        this.drawTankBody(ctx);

        if (this.isCalibrating) {
            ctx.save();
            ctx.fillStyle = '#c084fc';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            const progressSec = (this.calibrationTimer / 60).toFixed(1);
            ctx.fillText(`⏳ ĐANG PHÂN TÍCH PHE (${progressSec}s)`, 0, -this.radius - 22);

            ctx.strokeStyle = `rgba(192, 132, 252, ${0.4 + Math.sin(Date.now() * 0.01) * 0.4})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        } else if (this.team) {
            ctx.save();
            const isBlue = this.team === 'blue';
            ctx.fillStyle = isBlue ? '#38bdf8' : '#ef4444';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            const lifeSec = Math.ceil(this.lifeTimer / 60);
            const teamText = isBlue ? '💙 VIỆN TRỢ PHE XANH' : '🔴 VIỆN TRỢ PHE ĐỎ';
            ctx.fillText(`${teamText} (${lifeSec}s)`, 0, -this.radius - 22);

            const barW = 64;
            const barH = 5;
            const lifeRatio = Math.max(0, this.lifeTimer / this.maxLifeTimer);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(-barW / 2, -this.radius - 14, barW, barH);
            ctx.fillStyle = isBlue ? '#38bdf8' : '#ef4444';
            ctx.fillRect(-barW / 2, -this.radius - 14, barW * lifeRatio, barH);
            ctx.restore();
        }

        ctx.restore();
        ctx.restore();
    }

    drawTankBody(ctx) {
        ctx.save();
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 18;

        ctx.rotate(this.bodyAngle);
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(-this.radius - 5, -this.radius - 2, 12, this.radius * 2 + 4);
        ctx.fillRect(this.radius - 7, -this.radius - 2, 12, this.radius * 2 + 4);

        const grad = ctx.createLinearGradient(-this.radius, 0, this.radius, 0);
        grad.addColorStop(0, '#581c87');
        grad.addColorStop(0.5, '#7e22ce');
        grad.addColorStop(1, '#a855f7');
        ctx.fillStyle = grad;
        ctx.fillRect(-this.radius + 4, -this.radius + 4, (this.radius - 4) * 2, (this.radius - 4) * 2);
        ctx.strokeStyle = '#e9d5ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(-this.radius + 4, -this.radius + 4, (this.radius - 4) * 2, (this.radius - 4) * 2);
        ctx.restore();

        ctx.save();
        ctx.rotate(this.turretAngle);
        const barrelLength = this.radius + 18;
        ctx.fillStyle = '#312e81';
        ctx.fillRect(6, -6, barrelLength, 12);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(barrelLength - 3, -7, 5, 14);

        const domeGrad = ctx.createRadialGradient(-3, -3, 3, 0, 0, 16);
        domeGrad.addColorStop(0, '#ffffff');
        domeGrad.addColorStop(0.4, '#c084fc');
        domeGrad.addColorStop(1, '#6b21a8');
        ctx.fillStyle = domeGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
    }
}

