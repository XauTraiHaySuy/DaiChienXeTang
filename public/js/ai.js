// js/ai.js - Smart Enemy AI with Advanced A* Pathfinding, Tactical Bullet Evasion & Predictive Ricochet Aiming

function findWallSlideDirection(tank, targetX, targetY) {
    let bestAngle = tank.bodyAngle;
    let minScore = 999999;

    for (let i = 0; i < 24; i++) {
        const ang = (i * Math.PI) / 12;
        const testX = tank.x + Math.cos(ang) * 20;
        const testY = tank.y + Math.sin(ang) * 20;

        if (!tank.checkWallCollide(testX, testY)) {
            const distToTarget = Math.hypot(targetX - testX, targetY - testY);
            if (distToTarget < minScore) {
                minScore = distToTarget;
                bestAngle = ang;
            }
        }
    }
    return bestAngle;
}

class EnemyTank extends Tank {
    constructor(x, y) {
        super(x, y, {
            primary: '#b91c1c',
            primaryDark: '#7f1d1d',
            primaryLight: '#f87171',
            border: '#ef4444',
            accent: '#facc15'
        }, false);

        this.baseSpeed = 2.4; // Upgraded tactical speed
        this.speed = this.baseSpeed;

        this.pathNodes = [];
        this.pathIndex = 0;
        this.repathTimer = Math.floor(Math.random() * 6);
        this.shootTimer = Math.floor(Math.random() * 20) + 10;

        this.aiState = 'search'; // 'search' or 'attack'
        this.patrolTarget = null;
        this.patrolTimer = 0;

        // Anti-Stuck Watchdog & Motion Tracking
        this.stuckTimer = 0;
        this.lastPosition = { x, y };
        this.unStuckForceTimer = 0;
        this.unStuckDir = 0;
        this.lastDistMoved = 1.0;
    }

    findRandomPatrolPoint() {
        for (let attempt = 0; attempt < 35; attempt++) {
            const testX = Math.floor(Math.random() * (CANVAS_WIDTH - 160)) + 80;
            const testY = Math.floor(Math.random() * (CANVAS_HEIGHT - 160)) + 80;
            if (!checkWallCollideAt(testX, testY, this.radius + 10)) {
                return { x: testX, y: testY };
            }
        }
        return { x: this.x, y: this.y };
    }

    update(player, allBullets, allEnemies) {
        if (!this.alive) return;
        super.update();

        // ----------------------------------------------------
        // 1. TANK-TO-TANK SEPARATION (Prevent Clumping)
        // ----------------------------------------------------
        if (allEnemies) {
            allEnemies.forEach(other => {
                if (other !== this && other.alive) {
                    const dist = Math.hypot(other.x - this.x, other.y - this.y);
                    const minDist = this.radius + other.radius + 10;
                    if (dist < minDist && dist > 0) {
                        const pushX = (this.x - other.x) / dist * 2.2;
                        const pushY = (this.y - other.y) / dist * 2.2;
                        this.moveWithWallSliding(pushX, pushY);
                    }
                }
            });
        }

        // ----------------------------------------------------
        // 2. ANTI-STUCK WATCHDOG (Wall-Safe Escape)
        // ----------------------------------------------------
        const distMoved = Math.hypot(this.x - this.lastPosition.x, this.y - this.lastPosition.y);
        this.lastDistMoved = distMoved;
        if (distMoved < 0.3) {
            this.stuckTimer++;
        } else {
            this.stuckTimer = Math.max(0, this.stuckTimer - 1);
        }
        this.lastPosition = { x: this.x, y: this.y };

        if (this.stuckTimer > 6) {
            let escapeAngle = this.bodyAngle + Math.PI;
            for (let a = 0; a < 24; a++) {
                const testA = (a * Math.PI) / 12;
                const testX = this.x + Math.cos(testA) * 22;
                const testY = this.y + Math.sin(testA) * 22;
                if (!this.checkWallCollide(testX, testY)) {
                    escapeAngle = testA;
                    break;
                }
            }
            this.unStuckForceTimer = 10;
            this.unStuckDir = escapeAngle;
            this.stuckTimer = 0;
            this.pathNodes = [];
            this.patrolTarget = null;
        }

        // ----------------------------------------------------
        // 3. ULTRA TACTICAL BULLET EVASION & STRAFING SYSTEM
        // ----------------------------------------------------
        let dodgeAngle = null;
        let highestDanger = 0;
        const threatPoints = [];
        const threatVectors = [];

        if (allBullets) {
            for (const b of allBullets) {
                // Dodge Player bullets or Blue Support Tank bullets
                if (!b.alive || !b.owner) continue;
                const isHostileBullet = b.owner.isPlayer || (b.owner.team === 'blue');
                if (!isHostileBullet) continue;

                const distToBullet = Math.hypot(b.x - this.x, b.y - this.y);
                if (distToBullet < 480) {
                    // Predict 50 trajectory steps (including wall ricochets)
                    const trajectory = predictBulletPoints(b, 50);
                    for (let i = 0; i < trajectory.length; i++) {
                        const pt = trajectory[i];
                        const distToPt = Math.hypot(pt.x - this.x, pt.y - this.y);
                        if (distToPt < this.radius + 40) {
                            highestDanger++;
                            threatPoints.push(pt);
                            threatVectors.push({ vx: b.vx, vy: b.vy });
                        }
                    }
                }
            }
        }

        if (highestDanger > 0) {
            let bestAngle = null;
            let maxSafetyScore = -999999;

            // Evaluate 24 candidate dodge angles (15-degree resolution)
            for (let i = 0; i < 24; i++) {
                const candAngle = (i * Math.PI) / 12;
                const testStep = 22;
                const candX = this.x + Math.cos(candAngle) * testStep;
                const candY = this.y + Math.sin(candAngle) * testStep;

                if (this.checkWallCollide(candX, candY)) continue;

                let minDistToBullet = 999;
                for (const tp of threatPoints) {
                    const d = Math.hypot(candX - tp.x, candY - tp.y);
                    if (d < minDistToBullet) minDistToBullet = d;
                }

                // Prefer strafing perpendicular to bullet trajectory
                let strafeBonus = 0;
                for (const tv of threatVectors) {
                    const bulletAngle = Math.atan2(tv.vy, tv.vx);
                    const angleDiff = Math.abs(Math.atan2(Math.sin(candAngle - bulletAngle), Math.cos(candAngle - bulletAngle)));
                    // Highest bonus for perpendicular movement (around Math.PI / 2)
                    strafeBonus += Math.sin(angleDiff) * 30;
                }

                const safetyScore = minDistToBullet * 2.0 + strafeBonus;
                if (safetyScore > maxSafetyScore) {
                    maxSafetyScore = safetyScore;
                    bestAngle = candAngle;
                }
            }

            if (bestAngle !== null) {
                dodgeAngle = bestAngle;
            }
        }

        // ----------------------------------------------------
        // 4. SMART PURSUIT & MAZE PATHFINDING (State Machine)
        // ----------------------------------------------------
        const hasLOS = (player && player.alive) ? hasLineOfSight({ x: this.x, y: this.y }, { x: player.x, y: player.y }) : false;
        const distToPlayer = (player && player.alive) ? Math.hypot(player.x - this.x, player.y - this.y) : 9999;

        // Radio / Sensor Awareness: Switch to attack if in LOS or within 450px
        if (player && player.alive && (hasLOS || distToPlayer < 450)) {
            this.aiState = 'attack';
        } else {
            this.aiState = 'search';
        }

        let moveAngle = this.bodyAngle;

        if (this.unStuckForceTimer > 0) {
            this.unStuckForceTimer--;
            moveAngle = this.unStuckDir;
        } else if (dodgeAngle !== null) {
            moveAngle = dodgeAngle; // Execute high-priority dodge vector
        } else if (this.aiState === 'attack' && player && player.alive) {
            // --- STATE B: ATTACK & PURSUE MODE ---
            const wasBlocked = distMoved < 0.3;
            this.repathTimer--;

            if (!hasLOS || wasBlocked || this.repathTimer <= 0 || !this.pathNodes || this.pathNodes.length === 0) {
                this.repathTimer = hasLOS ? 10 : 6;
                this.pathNodes = findPathAStar({ x: this.x, y: this.y }, { x: player.x, y: player.y });
                this.pathIndex = 0;
            }

            if (this.pathNodes && this.pathNodes.length > 0) {
                while (this.pathIndex < this.pathNodes.length - 1) {
                    const nextNode = this.pathNodes[this.pathIndex + 1];
                    const distToCurrent = Math.hypot(this.pathNodes[this.pathIndex].x - this.x, this.pathNodes[this.pathIndex].y - this.y);
                    if (distToCurrent < 18 || hasLineOfSight({ x: this.x, y: this.y }, nextNode, 12)) {
                        this.pathIndex++;
                    } else {
                        break;
                    }
                }

                let targetNode = this.pathNodes[this.pathIndex];
                if (targetNode) {
                    moveAngle = Math.atan2(targetNode.y - this.y, targetNode.x - this.x);
                } else if (hasLOS) {
                    moveAngle = Math.atan2(player.y - this.y, player.x - this.x);
                } else {
                    moveAngle = findWallSlideDirection(this, player.x, player.y);
                }
            } else {
                if (hasLOS) {
                    moveAngle = Math.atan2(player.y - this.y, player.x - this.x);
                } else {
                    moveAngle = findWallSlideDirection(this, player.x, player.y);
                }
            }
        } else {
            // --- STATE A: SEARCH & MAZE PATROL MODE ---
            this.patrolTimer--;
            const distToPatrol = this.patrolTarget ? Math.hypot(this.patrolTarget.x - this.x, this.patrolTarget.y - this.y) : 0;

            if (!this.patrolTarget || this.patrolTimer <= 0 || distToPatrol < 28) {
                this.patrolTarget = this.findRandomPatrolPoint();
                this.patrolTimer = Math.floor(Math.random() * 150) + 120;
                this.pathNodes = findPathAStar({ x: this.x, y: this.y }, this.patrolTarget);
                this.pathIndex = 0;
            }

            if (this.pathNodes && this.pathNodes.length > 0) {
                while (this.pathIndex < this.pathNodes.length - 1) {
                    const nextNode = this.pathNodes[this.pathIndex + 1];
                    const distToCurrent = Math.hypot(this.pathNodes[this.pathIndex].x - this.x, this.pathNodes[this.pathIndex].y - this.y);
                    if (distToCurrent < 18 || hasLineOfSight({ x: this.x, y: this.y }, nextNode, 12)) {
                        this.pathIndex++;
                    } else {
                        break;
                    }
                }

                let targetNode = this.pathNodes[this.pathIndex];
                if (targetNode) {
                    moveAngle = Math.atan2(targetNode.y - this.y, targetNode.x - this.x);
                } else {
                    moveAngle = Math.atan2(this.patrolTarget.y - this.y, this.patrolTarget.x - this.x);
                }
            } else if (this.patrolTarget) {
                moveAngle = Math.atan2(this.patrolTarget.y - this.y, this.patrolTarget.x - this.x);
            }
        }

        // Execute Tactical Movement with Wall Sliding
        const dx = Math.cos(moveAngle) * this.speed;
        const dy = Math.sin(moveAngle) * this.speed;

        const prevX = this.x;
        const prevY = this.y;
        this.moveWithWallSliding(dx, dy);

        if (Math.hypot(this.x - prevX, this.y - prevY) > 0.1) {
            this.bodyAngle = moveAngle;
        }

        // ----------------------------------------------------
        // 5. PREDICTIVE AIMING & WALL-BOUNCE SNIPE SHOOTING
        // ----------------------------------------------------
        if (player && player.alive && (this.aiState === 'attack' || hasLOS)) {
            // Predict Player Position (Lead target by 8 frames)
            const pDx = player.x - (player.lastX || player.x);
            const pDy = player.y - (player.lastY || player.y);
            const targetPos = {
                x: player.x + pDx * 8,
                y: player.y + pDy * 8
            };

            let chosenAimAngle = Math.atan2(targetPos.y - this.y, targetPos.x - this.x);
            let hasShotOpportunity = false;

            const directHit = castRay({ x: this.x, y: this.y }, chosenAimAngle);
            const distToTarget = Math.hypot(targetPos.x - this.x, targetPos.y - this.y);

            if (directHit && directHit.distance >= distToTarget - 16) {
                hasShotOpportunity = true;
            } else {
                // 36 Radial Angles Ricochet Bounce Scanner
                for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2 / 36)) {
                    const hit1 = castRay({ x: this.x, y: this.y }, a, 900);
                    if (hit1) {
                        const rx = Math.cos(a);
                        const ry = Math.sin(a);
                        const dot = rx * hit1.normal.x + ry * hit1.normal.y;
                        const refX = rx - 2 * dot * hit1.normal.x;
                        const refY = ry - 2 * dot * hit1.normal.y;
                        const refAngle = Math.atan2(refY, refX);

                        const hit2 = castRay(hit1.point, refAngle, 700);
                        const distFromHit1ToTarget = Math.hypot(targetPos.x - hit1.point.x, targetPos.y - hit1.point.y);

                        if (hit2 && Math.abs(hit2.distance - distFromHit1ToTarget) < 36) {
                            chosenAimAngle = a;
                            hasShotOpportunity = true;
                            break;
                        }
                    }
                }
            }

            // Rapid Turret Lock-On Speed (0.28 rad/frame)
            const angleDiff = Math.atan2(Math.sin(chosenAimAngle - this.turretAngle), Math.cos(chosenAimAngle - this.turretAngle));
            this.turretAngle += angleDiff * 0.28;

            this.shootTimer--;
            if (this.shootTimer <= 0) {
                this.shootTimer = Math.floor(Math.random() * 25) + 12;
                if (hasShotOpportunity && Math.abs(angleDiff) < 0.45) {
                    this.shoot();
                }
            }
        } else {
            // Gentle Turret Scan in Patrol Mode
            this.turretAngle += 0.04;
        }
    }
}
