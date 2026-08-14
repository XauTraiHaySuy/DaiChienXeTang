// js/map.js - Ultra Dense Labyrinth Mazes, Animated Civilians & Entity Mechanics

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 750;
const WALL_THICKNESS = 20;

const GRID_COLS = 60;
const GRID_ROWS = 38;
const CELL_W = CANVAS_WIDTH / GRID_COLS; // 20px
const CELL_H = CANVAS_HEIGHT / GRID_ROWS; // ~19.73px

let grid = [];
const walls = [];
let currentMapIndex = 0;

// Interactive Entities
const tigers = [];
const traps = [];
const bombs = [];
let bomberJet = null;
let bomberTimer = 0;
const civilians = [];
const copHelicopters = [];
const whitePuddles = [];

// Supply Aircraft & Giant Purple Support Tank System (Map 2)
const supportTanks = [];
let supplyJet = null;
let supplyTimer = 0;

// 3 Ultra-Dense Labyrinth Map Definitions
const MAP_DEFINITIONS = [
    {
        name: "1. Rừng Rậm Hổ Dữ (Dense Jungle & 3 Tigers)",
        desc: "Mê cung rừng rậm siêu chật hẹp với 3 con Hổ hung dữ rình rập.",
        pro: "🌲 Lợi thế: Nhiều tường cây & ngóc ngách che chắn tốt.",
        con: "🐯 Bất lợi: Hổ vồ dính là CHẾT ngay!",
        playerSpawn: { x: 60, y: 670 },
        enemySpawns: [
            { x: 1140, y: 80 },
            { x: 1140, y: 670 },
            { x: 600, y: 80 },
            { x: 600, y: 670 },
            { x: 1140, y: 375 }
        ],
        builder: (w) => {
            // --- MAP 1: ULTRA DENSE JUNGLE LABYRINTH ---
            // Left Zone Maze Corridors
            w.push({ x: 120, y: 80, w: 20, h: 220, type: 'brick' });
            w.push({ x: 60, y: 300, w: 80, h: 20, type: 'brick' });
            w.push({ x: 120, y: 380, w: 20, h: 180, type: 'brick' });
            w.push({ x: 120, y: 620, w: 100, h: 20, type: 'brick' });

            w.push({ x: 220, y: 140, w: 140, h: 20, type: 'metal' });
            w.push({ x: 220, y: 220, w: 20, h: 220, type: 'metal' });
            w.push({ x: 220, y: 500, w: 20, h: 140, type: 'metal' });

            w.push({ x: 320, y: 80, w: 20, h: 180, type: 'brick' });
            w.push({ x: 320, y: 320, w: 120, h: 20, type: 'brick' });
            w.push({ x: 320, y: 400, w: 20, h: 180, type: 'brick' });

            // Center-Left Zone
            w.push({ x: 420, y: 140, w: 20, h: 220, type: 'metal' });
            w.push({ x: 420, y: 440, w: 20, h: 220, type: 'metal' });
            w.push({ x: 420, y: 360, w: 90, h: 20, type: 'metal' });

            // Center Fortress Rooms
            w.push({ x: 540, y: 80, w: 20, h: 160, type: 'brick' });
            w.push({ x: 540, y: 510, w: 20, h: 160, type: 'brick' });
            w.push({ x: 540, y: 300, w: 120, h: 20, type: 'brick' });
            w.push({ x: 540, y: 430, w: 120, h: 20, type: 'brick' });

            w.push({ x: 640, y: 80, w: 20, h: 160, type: 'metal' });
            w.push({ x: 640, y: 510, w: 20, h: 160, type: 'metal' });

            // Center-Right Zone
            w.push({ x: 740, y: 140, w: 20, h: 220, type: 'metal' });
            w.push({ x: 740, y: 440, w: 20, h: 220, type: 'metal' });
            w.push({ x: 690, y: 360, w: 70, h: 20, type: 'metal' });

            // Right Zone
            w.push({ x: 860, y: 80, w: 20, h: 180, type: 'brick' });
            w.push({ x: 760, y: 320, w: 120, h: 20, type: 'brick' });
            w.push({ x: 860, y: 400, w: 20, h: 180, type: 'brick' });

            w.push({ x: 960, y: 140, w: 140, h: 20, type: 'metal' });
            w.push({ x: 960, y: 220, w: 20, h: 220, type: 'metal' });
            w.push({ x: 960, y: 500, w: 20, h: 140, type: 'metal' });
            w.push({ x: 960, y: 620, w: 100, h: 20, type: 'metal' });

            w.push({ x: 1060, y: 80, w: 20, h: 220, type: 'brick' });
            w.push({ x: 1060, y: 300, w: 80, h: 20, type: 'brick' });
            w.push({ x: 1060, y: 380, w: 20, h: 180, type: 'brick' });
        }
    },
    {
        name: "2. Bão Bom & Bẫy Hố (Battlefield Airstrike & Traps)",
        desc: "Mê cung hố lầy chật hẹp & Máy Bay thả bom liên tục.",
        pro: "💥 Lợi thế: Dụ địch lọt hố bẫy bị đứng yên 3s.",
        con: "✈️ Bất lợi: Bom nổ diện rộng ngẫu nhiên trúng là CHẾT!",
        playerSpawn: { x: 60, y: 375 },
        enemySpawns: [
            { x: 1140, y: 80 },
            { x: 1140, y: 670 },
            { x: 600, y: 80 },
            { x: 600, y: 670 },
            { x: 1140, y: 375 }
        ],
        builder: (w) => {
            // --- MAP 2: ULTRA DENSE BATTLEFIELD TRENCH LABYRINTH ---
            // Outer Trench Lines
            w.push({ x: 140, y: 80, w: 20, h: 200, type: 'brick' });
            w.push({ x: 140, y: 470, w: 20, h: 200, type: 'brick' });
            w.push({ x: 60, y: 280, w: 100, h: 20, type: 'brick' });
            w.push({ x: 140, y: 470, w: 100, h: 20, type: 'brick' });

            w.push({ x: 260, y: 140, w: 140, h: 20, type: 'metal' });
            w.push({ x: 260, y: 590, w: 140, h: 20, type: 'metal' });
            w.push({ x: 260, y: 220, w: 20, h: 310, type: 'metal' });

            w.push({ x: 380, y: 80, w: 20, h: 160, type: 'brick' });
            w.push({ x: 380, y: 510, w: 20, h: 160, type: 'brick' });
            w.push({ x: 380, y: 320, w: 100, h: 20, type: 'brick' });
            w.push({ x: 380, y: 410, w: 100, h: 20, type: 'brick' });

            // Center Pitfall Buffer Pillars
            w.push({ x: 500, y: 140, w: 20, h: 200, type: 'metal' });
            w.push({ x: 500, y: 410, w: 20, h: 200, type: 'metal' });
            w.push({ x: 500, y: 360, w: 80, h: 20, type: 'metal' });

            w.push({ x: 700, y: 140, w: 20, h: 200, type: 'metal' });
            w.push({ x: 700, y: 410, w: 20, h: 200, type: 'metal' });
            w.push({ x: 620, y: 360, w: 80, h: 20, type: 'metal' });

            // Right Trench Lines
            w.push({ x: 820, y: 80, w: 20, h: 160, type: 'brick' });
            w.push({ x: 820, y: 510, w: 20, h: 160, type: 'brick' });
            w.push({ x: 720, y: 320, w: 100, h: 20, type: 'brick' });
            w.push({ x: 720, y: 410, w: 100, h: 20, type: 'brick' });

            w.push({ x: 940, y: 140, w: 140, h: 20, type: 'metal' });
            w.push({ x: 940, y: 590, w: 140, h: 20, type: 'metal' });
            w.push({ x: 940, y: 220, w: 20, h: 310, type: 'metal' });

            w.push({ x: 1060, y: 80, w: 20, h: 200, type: 'brick' });
            w.push({ x: 1060, y: 470, w: 20, h: 200, type: 'brick' });
            w.push({ x: 1040, y: 280, w: 100, h: 20, type: 'brick' });
        }
    }
];

function buildMaze(mapIdx = null) {
    if (mapIdx === null) {
        currentMapIndex = Math.floor(Math.random() * MAP_DEFINITIONS.length);
    } else {
        currentMapIndex = mapIdx % MAP_DEFINITIONS.length;
    }

    walls.length = 0;
    tigers.length = 0;
    traps.length = 0;
    bombs.length = 0;
    bomberJet = null;
    bomberTimer = 0;
    civilians.length = 0;
    copHelicopters.length = 0;
    whitePuddles.length = 0;
    supportTanks.length = 0;
    supplyJet = null;
    supplyTimer = 0;

    const mapDef = MAP_DEFINITIONS[currentMapIndex];

    // Boundary Outer Walls
    walls.push({ x: 0, y: 0, w: CANVAS_WIDTH, h: WALL_THICKNESS, type: 'metal' });
    walls.push({ x: 0, y: CANVAS_HEIGHT - WALL_THICKNESS, w: CANVAS_WIDTH, h: WALL_THICKNESS, type: 'metal' });
    walls.push({ x: 0, y: 0, w: WALL_THICKNESS, h: CANVAS_HEIGHT, type: 'metal' });
    walls.push({ x: CANVAS_WIDTH - WALL_THICKNESS, y: 0, w: WALL_THICKNESS, h: CANVAS_HEIGHT, type: 'metal' });

    // Build Obstacles
    mapDef.builder(walls);

    // Spawn Special Map Entities
    if (currentMapIndex === 0) {
        // MAP 1: 3 Tigers
        tigers.push(new Tiger(600, 180));
        tigers.push(new Tiger(600, 570));
        tigers.push(new Tiger(360, 375));
    } else if (currentMapIndex === 1) {
        // MAP 2: 4 Pitfall Traps
        traps.push({ x: 340, y: 240, r: 24 });
        traps.push({ x: 860, y: 240, r: 24 });
        traps.push({ x: 340, y: 510, r: 24 });
        traps.push({ x: 860, y: 510, r: 24 });
    } else if (currentMapIndex === 2) {
        // MAP 3: Detailed Pedestrians
        const shirtColors = ['#0284c7', '#16a34a', '#dc2626', '#ca8a04', '#9333ea'];
        civilians.push(new Civilian(80, 260, 'horizontal', shirtColors[0]));
        civilians.push(new Civilian(340, 260, 'vertical', shirtColors[1]));
        civilians.push(new Civilian(580, 360, 'horizontal', shirtColors[2]));
        civilians.push(new Civilian(820, 260, 'vertical', shirtColors[3]));
        civilians.push(new Civilian(600, 680, 'horizontal', shirtColors[4]));
    }

    buildPathfindingGrid();
}

// ----------------------------------------------------
// DETAILED ANIMATED CIVILIAN CLASS (MAP 3)
// ----------------------------------------------------
class Civilian {
    constructor(x, y, dir = 'horizontal', shirtColor = '#0284c7') {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.radius = 10;
        this.dir = dir;
        this.speed = 1.3;
        this.walkDist = 140;
        this.heading = 1;
        this.shirtColor = shirtColor;
        this.alive = true;
        this.animTimer = Math.random() * 100;
    }

    update() {
        if (!this.alive) return;
        this.animTimer += 0.15;

        if (this.dir === 'horizontal') {
            this.x += this.speed * this.heading;
            if (Math.abs(this.x - this.startX) > this.walkDist) this.heading *= -1;
        } else {
            this.y += this.speed * this.heading;
            if (Math.abs(this.y - this.startY) > this.walkDist) this.heading *= -1;
        }
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Walking angle rotation
        let angle = 0;
        if (this.dir === 'horizontal') {
            angle = this.heading > 0 ? 0 : Math.PI;
        } else {
            angle = this.heading > 0 ? Math.PI / 2 : -Math.PI / 2;
        }
        ctx.rotate(angle);

        // Drop Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 4, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Swinging Legs Animation
        const legOffset = Math.sin(this.animTimer * 2) * 5;
        ctx.fillStyle = '#1e293b'; // Dark pants
        ctx.fillRect(-4 + legOffset, -6, 4, 12);
        ctx.fillRect(-4 - legOffset, -6, 4, 12);

        // Shirt Body
        ctx.fillStyle = this.shirtColor;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Head & Hair
        ctx.fillStyle = '#fde047'; // Skin tone
        ctx.beginPath();
        ctx.arc(2, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#78350f'; // Hair
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ----------------------------------------------------
// TIGER ENTITY CLASS (MAP 1)
// ----------------------------------------------------
class Tiger {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.homeX = x;
        this.homeY = y;
        this.radius = 18;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = 3.2;
        this.target = null;
        this.alive = true;

        // Special Interactive States
        this.actionTimer = 0;   // 3-second pumping timer (180 frames)
        this.frozenTimer = 0;   // 5-second ice freeze timer (300 frames)
        this.victimTank = null; // Tank trapped by tiger
        this.animTimer = 0;
        this.pumpOffsetY = 0;

        // Pathfinding around walls
        this.pathNodes = [];
        this.pathIndex = 0;
        this.repathTimer = 0;
    }

    moveTigerWithWallSliding(dx, dy) {
        let nextX = this.x + dx;
        let nextY = this.y + dy;
        if (!checkWallCollideAt(nextX, this.y, this.radius)) {
            this.x = nextX;
        }
        if (!checkWallCollideAt(this.x, nextY, this.radius)) {
            this.y = nextY;
        }
    }

    update(player, enemies) {
        if (!this.alive) return;
        this.animTimer += 0.25;

        // 1. FROZEN STATE (5 Seconds / 300 Frames)
        if (this.frozenTimer > 0) {
            this.frozenTimer--;
            if (this.victimTank) {
                this.victimTank.stunTimer = 0; // Release victim tank completely!
                this.victimTank.isTrappedByTiger = false;
                this.victimTank = null;
            }
            return; // Cannot move, attack, or pull while frozen
        }

        // 2. PUMPING ACTION STATE (3 Seconds / 180 Frames)
        if (this.actionTimer > 0) {
            this.actionTimer--;
            this.pumpOffsetY = Math.sin(this.animTimer * 1.5) * 9; // Up and down pumping animation

            if (this.victimTank && this.victimTank.alive) {
                // Trap victim tank at tiger's position during pumping
                this.victimTank.x = this.x;
                this.victimTank.y = this.y + this.pumpOffsetY * 0.4;
                this.victimTank.stunTimer = 10;
                this.victimTank.isTrappedByTiger = true;
            }

            // After 3 seconds finish
            if (this.actionTimer <= 0) {
                // Spawn White Puddle on the ground
                whitePuddles.push({
                    x: this.x,
                    y: this.y,
                    r: 28
                });

                // Release trapped tank completely so it can drive away!
                if (this.victimTank && this.victimTank.alive) {
                    this.victimTank.stunTimer = 0;
                    this.victimTank.isTrappedByTiger = false;
                    // Push tank 36px outside tiger to ensure smooth departure
                    const pushAng = this.angle + Math.PI;
                    const releaseX = this.x + Math.cos(pushAng) * 36;
                    const releaseY = this.y + Math.sin(pushAng) * 36;
                    if (!checkWallCollideAt(releaseX, releaseY, this.victimTank.radius)) {
                        this.victimTank.x = releaseX;
                        this.victimTank.y = releaseY;
                    }
                }

                // Freeze ONLY THIS Tiger for 5 seconds (300 frames)
                this.frozenTimer = 300;
                this.victimTank = null;
                audio.playTrapStun();
            }
            return;
        }

        // 3. NORMAL HUNTING, PATHFINDING & PULLING STATE
        const allTanks = [player, ...enemies].filter(t => t && t.alive && !t.isTrappedByTiger);

        let closestTank = null;
        let minDist = 180; // Detection Radius

        for (const tank of allTanks) {
            const dist = Math.hypot(tank.x - this.x, tank.y - this.y);
            if (dist < minDist) {
                minDist = dist;
                closestTank = tank;
            }
        }

        const distFromHome = Math.hypot(this.x - this.homeX, this.y - this.homeY);

        if (closestTank && distFromHome < 280) {
            if (!this.target) audio.playTigerRoar();
            this.target = closestTank;

            // Check direct Line Of Sight (does tiger see tank without walls?)
            const hasLOS = hasLineOfSight({ x: this.x, y: this.y }, { x: closestTank.x, y: closestTank.y });

            let moveAngle = this.angle;
            if (hasLOS) {
                moveAngle = Math.atan2(closestTank.y - this.y, closestTank.x - this.x);
            } else {
                // Find path around walls to reach tank
                this.repathTimer--;
                if (this.repathTimer <= 0 || !this.pathNodes || this.pathNodes.length === 0) {
                    this.repathTimer = 15;
                    this.pathNodes = findPathAStar({ x: this.x, y: this.y }, { x: closestTank.x, y: closestTank.y });
                    this.pathIndex = 0;
                }

                if (this.pathNodes && this.pathNodes.length > 0) {
                    let targetNode = this.pathNodes[this.pathIndex];
                    if (targetNode && Math.hypot(targetNode.x - this.x, targetNode.y - this.y) < 20) {
                        this.pathIndex++;
                        targetNode = this.pathNodes[this.pathIndex];
                    }
                    if (targetNode) {
                        moveAngle = Math.atan2(targetNode.y - this.y, targetNode.x - this.x);
                    } else {
                        moveAngle = Math.atan2(closestTank.y - this.y, closestTank.x - this.x);
                    }
                } else {
                    moveAngle = Math.atan2(closestTank.y - this.y, closestTank.x - this.x);
                }
            }

            this.angle = moveAngle;
            const dx = Math.cos(moveAngle) * this.speed;
            const dy = Math.sin(moveAngle) * this.speed;

            // Move tiger using wall sliding (NO clipping through walls!)
            this.moveTigerWithWallSliding(dx, dy);

            // Pull tank towards tiger if in range and line of sight is clear
            if (minDist < 160 && hasLOS && !closestTank.isTrappedByTiger) {
                const pullAngle = Math.atan2(this.y - closestTank.y, this.x - closestTank.x);
                const pDx = Math.cos(pullAngle) * 3.2;
                const pDy = Math.sin(pullAngle) * 3.2;
                if (!closestTank.checkWallCollide(closestTank.x + pDx, closestTank.y + pDy)) {
                    closestTank.x += pDx;
                    closestTank.y += pDy;
                }
            }

            // Contact triggers 3-second pumping action!
            if (minDist < this.radius + closestTank.radius + 6 && !closestTank.isTrappedByTiger) {
                this.actionTimer = 180; // 3 seconds
                this.victimTank = closestTank;
                closestTank.isTrappedByTiger = true;
                audio.playTigerRoar();
            }
        } else {
            this.target = null;
            if (distFromHome > 10) {
                const homeAngle = Math.atan2(this.homeY - this.y, this.homeX - this.x);
                this.angle = homeAngle;
                const dx = Math.cos(homeAngle) * 1.8;
                const dy = Math.sin(homeAngle) * 1.8;
                this.moveTigerWithWallSliding(dx, dy);
            }
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y + this.pumpOffsetY);
        ctx.rotate(this.angle);

        // Tiger Body
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.ellipse(0, 0, 19, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stripes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-6, -12, 3, 24);
        ctx.fillRect(2, -12, 3, 24);

        // Tiger Head
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(15, 0, 9, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#facc15';
        ctx.fillRect(17, -4, 2, 2);
        ctx.fillRect(17, 2, 2, 2);

        ctx.restore();

        // UI Indicators & Ice Frozen Overlay
        if (this.actionTimer > 0) {
            ctx.save();
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`🐯 ĐANG NHẤP NHẤP... (${Math.ceil(this.actionTimer / 60)}s)`, this.x, this.y - 32);
            ctx.restore();
        } else if (this.frozenTimer > 0) {
            ctx.save();
            // Ice Crystal Enclosure Box
            ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.5;
            ctx.fillRect(this.x - 24, this.y - 18, 48, 36);
            ctx.strokeRect(this.x - 24, this.y - 18, 48, 36);

            // Ice Text
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`🧊 HỔ BỊ ĐÓNG BẰNG (${Math.ceil(this.frozenTimer / 60)}s)`, this.x, this.y - 24);
            ctx.restore();
        }
    }
}

// ----------------------------------------------------
// POLICE HELICOPTER (MAP 3)
// ----------------------------------------------------
class PoliceHelicopter {
    constructor(targetTank) {
        this.x = Math.random() < 0.5 ? 0 : CANVAS_WIDTH;
        this.y = Math.random() < 0.5 ? 0 : CANVAS_HEIGHT;
        this.targetTank = targetTank;
        this.life = 300; // 5 seconds duration (300 frames)
        this.angle = 0;
    }

    update() {
        if (!this.targetTank) return;
        this.life--;
        this.angle = Math.atan2(this.targetTank.y - this.y, this.targetTank.x - this.x);
        this.x += Math.cos(this.angle) * 5.5;
        this.y += Math.sin(this.angle) * 5.5;

        // Keep slow penalty active while police helicopter pursues guilty tank
        if (this.targetTank && this.targetTank.alive) {
            this.targetTank.slowTimer = Math.max(this.targetTank.slowTimer, 60);
        }

        const dist = Math.hypot(this.targetTank.x - this.x, this.targetTank.y - this.y);
        if (dist < 180) {
            audio.playPoliceEMP();
        }
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-16, -8, 32, 16);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(8, -4, 8, 8);

        if (this.targetTank) {
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.targetTank.x - this.x, this.targetTank.y - this.y);
            ctx.stroke();
        }
        ctx.restore();
    }
}

function triggerCivilianPunishment(guiltyTank) {
    if (!guiltyTank) return;
    audio.playPoliceSiren();
    guiltyTank.slowTimer = 300; // 5 Seconds Slow Speed (300 frames)
    copHelicopters.push(new PoliceHelicopter(guiltyTank));
    copHelicopters.push(new PoliceHelicopter(guiltyTank));
}

// Bezier Curve Trajectory Helpers
function getBezierPoint(p0, p1, p2, t) {
    const inv = 1 - t;
    return {
        x: inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
        y: inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y
    };
}

function getBezierTangent(p0, p1, p2, t) {
    const inv = 1 - t;
    return Math.atan2(
        2 * inv * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
        2 * inv * (p1.x - p0.x) + 2 * t * (p2.x - p1.x)
    );
}



function updateMapEntities(player, enemies, bullets) {
    const allTanks = [player, ...enemies].filter(t => t && t.alive);

    if (currentMapIndex === 0) {
        tigers.forEach(t => t.update(player, enemies));
    }

    if (currentMapIndex === 1) {
        traps.forEach(trap => {
            allTanks.forEach(tank => {
                const dist = Math.hypot(tank.x - trap.x, tank.y - trap.y);
                if (dist < tank.radius + trap.r) {
                    if (tank.stunTimer <= 0) {
                        tank.stunTimer = 180;
                        audio.playTrapStun();
                    }
                }
            });
        });

        if (bomberJet) {
            if (bomberJet.warningTimer > 0) {
                bomberJet.warningTimer--; // Warning phase
            } else {
                if (!bomberJet.soundPlayed) {
                    audio.playJetPass();
                    bomberJet.soundPlayed = true;
                }

                bomberJet.progress += 0.0065; // Slow, clear flight speed

                // Progressive bomb drop along jet Bezier flight path
                const dropPoints = [0.2, 0.35, 0.5, 0.65, 0.8];
                dropPoints.forEach((pt, idx) => {
                    if (bomberJet.progress >= pt && !bomberJet.dropped[idx]) {
                        bomberJet.dropped[idx] = true;
                        const jetPt = getBezierPoint(bomberJet.p0, bomberJet.p1, bomberJet.p2, pt);
                        const bx = jetPt.x + (Math.random() - 0.5) * 35;
                        const by = jetPt.y + (Math.random() - 0.5) * 35;
                        bombs.push({ x: bx, y: by, fuse: 85, exploded: false });
                    }
                });

                // ONLY reset cooldown timer AFTER jet finishes flight pass!
                if (bomberJet.progress >= 1) {
                    bomberJet = null;
                    bomberTimer = 0;
                }
            }
        } else {
            // Count 3-second resting cooldown (180 frames) ONLY while NO jet is flying!
            bomberTimer++;
            if (bomberTimer >= 180) {
                bomberTimer = 0;

                const typeChoice = Math.random();
                let p0, p1, p2;

                if (typeChoice < 0.35) {
                    // 1. Horizontal Flight (Bay Ngang)
                    const fromLeft = Math.random() < 0.5;
                    const sy = Math.random() * (CANVAS_HEIGHT - 280) + 140;
                    p0 = { x: fromLeft ? -120 : CANVAS_WIDTH + 120, y: sy };
                    p2 = { x: fromLeft ? CANVAS_WIDTH + 120 : -120, y: sy + (Math.random() - 0.5) * 90 };
                    p1 = { x: CANVAS_WIDTH / 2, y: (p0.y + p2.y) / 2 };
                } else if (typeChoice < 0.7) {
                    // 2. Vertical Flight (Bay Dọc)
                    const fromTop = Math.random() < 0.5;
                    const sx = Math.random() * (CANVAS_WIDTH - 360) + 180;
                    p0 = { x: sx, y: fromTop ? -120 : CANVAS_HEIGHT + 120 };
                    p2 = { x: sx + (Math.random() - 0.5) * 100, y: fromTop ? CANVAS_HEIGHT + 120 : -120 };
                    p1 = { x: (p0.x + p2.x) / 2, y: CANVAS_HEIGHT / 2 };
                } else {
                    // 3. Winding / Curved Arc (Bay Uốn Lượn)
                    const fromLeft = Math.random() < 0.5;
                    p0 = { x: fromLeft ? -120 : CANVAS_WIDTH + 120, y: Math.random() * (CANVAS_HEIGHT - 200) + 100 };
                    p2 = { x: fromLeft ? CANVAS_WIDTH + 120 : -120, y: Math.random() * (CANVAS_HEIGHT - 200) + 100 };
                    p1 = {
                        x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 500,
                        y: CANVAS_HEIGHT / 2 + (Math.random() - 0.5) * 400
                    };
                }

                bomberJet = {
                    p0, p1, p2,
                    warningTimer: 90, // 1.5s warning phase
                    progress: 0,
                    dropped: [false, false, false, false, false],
                    soundPlayed: false
                };
            }
        }

        // ----------------------------------------------------
        // SUPPLY AIRCRAFT & GIANT PURPLE SUPPORT TANK (15s Interval)
        // ----------------------------------------------------
        if (supplyJet) {
            if (supplyJet.warningTimer > 0) {
                supplyJet.warningTimer--;
            } else {
                if (!supplyJet.soundPlayed) {
                    audio.playJetPass();
                    supplyJet.soundPlayed = true;
                }
                supplyJet.progress += 0.007;

                // Drop 1 Giant Purple Support Tank at mid-flight (progress >= 0.5)
                if (supplyJet.progress >= 0.5 && !supplyJet.dropped) {
                    supplyJet.dropped = true;
                    const jetPt = getBezierPoint(supplyJet.p0, supplyJet.p1, supplyJet.p2, 0.5);

                    // Find a guaranteed open, non-wall landing spot near jetPt (radius 36px clearance)
                    let landingX = jetPt.x;
                    let landingY = jetPt.y;
                    let foundOpenSpace = false;

                    for (let r = 0; r < 280; r += 20) {
                        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
                            const testX = Math.max(60, Math.min(CANVAS_WIDTH - 60, jetPt.x + Math.cos(angle) * r));
                            const testY = Math.max(60, Math.min(CANVAS_HEIGHT - 60, jetPt.y + Math.sin(angle) * r));

                            if (!checkWallCollideAt(testX, testY, 36)) {
                                landingX = testX;
                                landingY = testY;
                                foundOpenSpace = true;
                                break;
                            }
                        }
                        if (foundOpenSpace) break;
                    }

                    // Spawn SupportTank starting AT THE JET'S EXACT LOCATION dropping to wall-free landing spot!
                    supportTanks.push(new SupportTank(jetPt.x, jetPt.y, landingX, landingY));
                }

                if (supplyJet.progress >= 1) {
                    supplyJet = null;
                    supplyTimer = 0;
                }
            }
        } else {
            // Count 15-second cooldown (900 frames)
            supplyTimer++;
            if (supplyTimer >= 900) {
                supplyTimer = 0;
                const fromLeft = Math.random() < 0.5;
                const sy = Math.random() * (CANVAS_HEIGHT - 280) + 140;
                const p0 = { x: fromLeft ? -140 : CANVAS_WIDTH + 140, y: sy };
                const p2 = { x: fromLeft ? CANVAS_WIDTH + 140 : -140, y: sy + (Math.random() - 0.5) * 120 };
                const p1 = { x: CANVAS_WIDTH / 2, y: (p0.y + p2.y) / 2 };

                supplyJet = {
                    p0, p1, p2,
                    warningTimer: 90, // 1.5s warning phase
                    progress: 0,
                    dropped: false,
                    soundPlayed: false
                };
            }
        }

        // Update Support Tanks
        supportTanks.forEach(st => st.update(player, enemies, bullets));
        for (let i = supportTanks.length - 1; i >= 0; i--) {
            if (!supportTanks[i].alive) supportTanks.splice(i, 1);
        }

        bombs.forEach(b => {
            if (b.exploded) return;
            b.fuse--;
            if (b.fuse <= 0) {
                b.exploded = true;
                audio.playBombDetonate();
                createExplosion(b.x, b.y, true);

                allTanks.forEach(t => {
                    if (Math.hypot(t.x - b.x, t.y - b.y) < 45 + t.radius) {
                        t.alive = false;
                        createExplosion(t.x, t.y, true);
                    }
                });
            }
        });
        for (let i = bombs.length - 1; i >= 0; i--) {
            if (bombs[i].exploded) bombs.splice(i, 1);
        }
    }

    if (currentMapIndex === 2) {
        civilians.forEach(c => {
            if (!c.alive) return;
            c.update();

            // 1. Tank running over pedestrian ("nghiến vào") -> Civilian disappears immediately & slows guilty tank 5s!
            allTanks.forEach(tank => {
                if (Math.hypot(tank.x - c.x, tank.y - c.y) < tank.radius + c.radius + 4) {
                    c.alive = false; // Civilian disappears immediately!
                    createExpireEffect(c.x, c.y);
                    triggerCivilianPunishment(tank);
                }
            });

            // 2. Bullet hitting pedestrian ("bắn trúng") -> Civilian disappears immediately & slows guilty tank 5s!
            bullets.forEach(b => {
                if (b.alive && Math.hypot(b.x - c.x, b.y - c.y) < b.radius + c.radius) {
                    b.alive = false;
                    c.alive = false; // Civilian disappears immediately!
                    createExpireEffect(c.x, c.y);
                    triggerCivilianPunishment(b.owner);
                }
            });
        });

        copHelicopters.forEach(h => h.update());
        for (let i = copHelicopters.length - 1; i >= 0; i--) {
            if (copHelicopters[i].life <= 0) copHelicopters.splice(i, 1);
        }
    }
}

// ----------------------------------------------------
// A* PATHFINDING ALGORITHM
// ----------------------------------------------------
function checkWallCollideAt(nx, ny, radius = 18) {
    const minX = WALL_THICKNESS + radius;
    const maxX = CANVAS_WIDTH - WALL_THICKNESS - radius;
    const minY = WALL_THICKNESS + radius;
    const maxY = CANVAS_HEIGHT - WALL_THICKNESS - radius;

    if (nx < minX || nx > maxX || ny < minY || ny > maxY) {
        return true;
    }
    for (const w of walls) {
        const closestX = Math.max(w.x, Math.min(nx, w.x + w.w));
        const closestY = Math.max(w.y, Math.min(ny, w.y + w.h));
        const dx = nx - closestX;
        const dy = ny - closestY;
        if ((dx * dx + dy * dy) < (radius * radius)) {
            return true;
        }
    }
    return false;
}

function destroyWallsAt(x, y, radius = 48) {
    let wallsDestroyed = false;
    // Keep outer boundaries (0..3), shatter inner maze walls overlapping landing radius
    for (let i = walls.length - 1; i >= 4; i--) {
        const w = walls[i];
        const closestX = Math.max(w.x, Math.min(x, w.x + w.w));
        const closestY = Math.max(w.y, Math.min(y, w.y + w.h));
        const dx = x - closestX;
        const dy = y - closestY;

        if ((dx * dx + dy * dy) < (radius * radius)) {
            createExplosion(w.x + w.w / 2, w.y + w.h / 2, true);
            walls.splice(i, 1);
            wallsDestroyed = true;
        }
    }
    if (wallsDestroyed) {
        if (typeof audio !== 'undefined' && audio.playBombDetonate) audio.playBombDetonate();
        buildPathfindingGrid();
    }
}

function buildPathfindingGrid() {
    grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0));

    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            const cx = c * CELL_W + CELL_W / 2;
            const cy = r * CELL_H + CELL_H / 2;
            if (checkWallCollideAt(cx, cy, 18)) {
                grid[r][c] = 1;
            }
        }
    }
}

function posToGrid(x, y) {
    const col = Math.floor(Math.max(0, Math.min(CANVAS_WIDTH - 1, x)) / CELL_W);
    const row = Math.floor(Math.max(0, Math.min(CANVAS_HEIGHT - 1, y)) / CELL_H);
    return { col, row };
}

function gridToPos(col, row) {
    return { x: col * CELL_W + CELL_W / 2, y: row * CELL_H + CELL_H / 2 };
}

function findPathAStar(startPos, targetPos) {
    const start = posToGrid(startPos.x, startPos.y);
    const target = posToGrid(targetPos.x, targetPos.y);

    const openStart = findNearestWalkableCell(start.col, start.row);
    const openTarget = findNearestWalkableCell(target.col, target.row);

    const openSet = [];
    const closedSet = new Set();

    const startNode = {
        col: openStart.col,
        row: openStart.row,
        g: 0,
        h: heuristic(openStart, openTarget),
        f: heuristic(openStart, openTarget),
        parent: null
    };

    openSet.push(startNode);

    while (openSet.length > 0) {
        let lowestIdx = 0;
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].f < openSet[lowestIdx].f) lowestIdx = i;
        }

        const current = openSet[lowestIdx];

        if (current.col === openTarget.col && current.row === openTarget.row) {
            const path = [];
            let curr = current;
            while (curr) {
                path.push(gridToPos(curr.col, curr.row));
                curr = curr.parent;
            }
            return path.reverse();
        }

        openSet.splice(lowestIdx, 1);
        closedSet.add(`${current.col},${current.row}`);

        const neighbors = [
            { col: current.col + 1, row: current.row, cost: 1 },
            { col: current.col - 1, row: current.row, cost: 1 },
            { col: current.col, row: current.row + 1, cost: 1 },
            { col: current.col, row: current.row - 1, cost: 1 },
            { col: current.col + 1, row: current.row + 1, cost: 1.414 },
            { col: current.col - 1, row: current.row + 1, cost: 1.414 },
            { col: current.col + 1, row: current.row - 1, cost: 1.414 },
            { col: current.col - 1, row: current.row - 1, cost: 1.414 }
        ];

        for (const nb of neighbors) {
            if (nb.col < 0 || nb.col >= GRID_COLS || nb.row < 0 || nb.row >= GRID_ROWS) continue;
            if (grid[nb.row][nb.col] === 1) continue;
            // Prevent diagonal corner clipping through adjacent wall cells
            if (nb.col !== current.col && nb.row !== current.row) {
                if (grid[current.row][nb.col] === 1 || grid[nb.row][current.col] === 1) continue;
            }
            if (closedSet.has(`${nb.col},${nb.row}`)) continue;

            const tentativeG = current.g + nb.cost;
            let neighborNode = openSet.find(n => n.col === nb.col && n.row === nb.row);

            if (!neighborNode) {
                neighborNode = {
                    col: nb.col,
                    row: nb.row,
                    g: tentativeG,
                    h: heuristic(nb, openTarget),
                    f: tentativeG + heuristic(nb, openTarget),
                    parent: current
                };
                openSet.push(neighborNode);
            } else if (tentativeG < neighborNode.g) {
                neighborNode.g = tentativeG;
                neighborNode.f = tentativeG + neighborNode.h;
                neighborNode.parent = current;
            }
        }
    }
    return [];
}

function heuristic(a, b) {
    return Math.hypot(a.col - b.col, a.row - b.row);
}

function findNearestWalkableCell(col, row) {
    if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS && grid[row][col] === 0) {
        return { col, row };
    }
    const maxSearch = Math.max(GRID_COLS, GRID_ROWS);
    for (let r = 1; r < maxSearch; r++) {
        for (let dc = -r; dc <= r; dc++) {
            for (let dr = -r; dr <= r; dr++) {
                const nc = col + dc;
                const nr = row + dr;
                if (nc >= 0 && nc < GRID_COLS && nr >= 0 && nr < GRID_ROWS && grid[nr][nc] === 0) {
                    return { col: nc, row: nr };
                }
            }
        }
    }
    return { col: Math.max(1, Math.min(GRID_COLS - 2, col)), row: Math.max(1, Math.min(GRID_ROWS - 2, row)) };
}

function rayIntersectSegment(rayOrigin, rayDir, segP1, segP2) {
    const r_px = rayOrigin.x;
    const r_py = rayOrigin.y;
    const r_dx = rayDir.x;
    const r_dy = rayDir.y;

    const s_px = segP1.x;
    const s_py = segP1.y;
    const s_dx = segP2.x - segP1.x;
    const s_dy = segP2.y - segP1.y;

    const r_mag = Math.hypot(r_dx, r_dy);
    const s_mag = Math.hypot(s_dx, s_dy);

    if (r_dx / r_mag === s_dx / s_mag && r_dy / r_mag === s_dy / s_mag) return null;

    const T2 = (r_dx * (s_py - r_py) + r_dy * (r_px - s_px)) / (s_dx * r_dy - s_dy * r_dx);
    const T1 = (s_px + s_dx * T2 - r_px) / r_dx;

    if (T1 < 0 || T2 < 0 || T2 > 1) return null;

    return {
        x: r_px + r_dx * T1,
        y: r_py + r_dy * T1,
        param: T1,
        normal: { x: -s_dy / s_mag, y: s_dx / s_mag }
    };
}

function getWallSegments(wall) {
    return [
        { p1: { x: wall.x, y: wall.y }, p2: { x: wall.x + wall.w, y: wall.y }, normal: { x: 0, y: -1 } },
        { p1: { x: wall.x + wall.w, y: wall.y }, p2: { x: wall.x + wall.w, y: wall.y + wall.h }, normal: { x: 1, y: 0 } },
        { p1: { x: wall.x + wall.w, y: wall.y + wall.h }, p2: { x: wall.x, y: wall.y + wall.h }, normal: { x: 0, y: 1 } },
        { p1: { x: wall.x, y: wall.y + wall.h }, p2: { x: wall.x, y: wall.y }, normal: { x: -1, y: 0 } }
    ];
}

function castRay(origin, angle, maxLength = 1200) {
    const dir = { x: Math.cos(angle), y: Math.sin(angle) };
    let closestHit = null;
    let minDistance = maxLength;

    for (const w of walls) {
        const segments = getWallSegments(w);
        for (const seg of segments) {
            const hit = rayIntersectSegment(origin, dir, seg.p1, seg.p2);
            if (hit && hit.param < minDistance) {
                minDistance = hit.param;
                closestHit = {
                    point: { x: hit.x, y: hit.y },
                    distance: hit.param,
                    normal: seg.normal,
                    wall: w
                };
            }
        }
    }
    return closestHit;
}

function hasLineOfSight(p1, p2, radiusOffset = 14) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return true;

    const angle = Math.atan2(dy, dx);
    const hit = castRay(p1, angle, dist);
    if (hit && hit.distance < dist - 8) {
        return false;
    }

    const perpX = -Math.sin(angle) * radiusOffset;
    const perpY = Math.cos(angle) * radiusOffset;

    const hitLeft = castRay({ x: p1.x + perpX, y: p1.y + perpY }, angle, dist);
    if (hitLeft && hitLeft.distance < dist - 8) return false;

    const hitRight = castRay({ x: p1.x - perpX, y: p1.y - perpY }, angle, dist);
    if (hitRight && hitRight.distance < dist - 8) return false;

    return true;
}

function predictBulletPoints(bullet, maxSteps = 35) {
    const points = [];
    if (!bullet || !bullet.alive) return points;

    let curX = bullet.x;
    let curY = bullet.y;
    let vx = bullet.vx;
    let vy = bullet.vy;

    for (let s = 0; s < maxSteps; s++) {
        points.push({ x: curX, y: curY });
        const nextX = curX + vx;
        const nextY = curY + vy;

        for (const w of walls) {
            if (nextX >= w.x && nextX <= w.x + w.w && nextY >= w.y && nextY <= w.y + w.h) {
                const prevInX = (curX >= w.x && curX <= w.x + w.w);
                const prevInY = (curY >= w.y && curY <= w.y + w.h);
                if (!prevInX) vx = -vx;
                if (!prevInY) vy = -vy;
                break;
            }
        }
        curX += vx;
        curY += vy;
    }
    return points;
}

function drawBackgroundAndWalls(ctx) {
    ctx.fillStyle = currentMapIndex === 0 ? '#062016' : (currentMapIndex === 2 ? '#1e293b' : '#0b0f19');
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += CELL_W) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += CELL_H) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
    }

    trackMarks.forEach(tm => tm.draw(ctx));

    // Render White Liquid Puddles
    whitePuddles.forEach(p => {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(p.x - p.r * 0.3, p.y - p.r * 0.2, p.r * 0.4, p.r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    if (currentMapIndex === 1) {
        traps.forEach(t => {
            ctx.save();
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        });

        // 1. Red Dashed Flight Path Trajectory Curve
        if (bomberJet) {
            ctx.save();
            ctx.setLineDash([14, 10]);
            ctx.lineDashOffset = -bomberJet.progress * 80;
            ctx.strokeStyle = bomberJet.warningTimer > 0 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(239, 68, 68, 0.45)';
            ctx.lineWidth = bomberJet.warningTimer > 0 ? 3.5 : 2.5;

            ctx.beginPath();
            const steps = 50;
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const pt = getBezierPoint(bomberJet.p0, bomberJet.p1, bomberJet.p2, t);
                if (i === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Flight Warning Banner Text
            if (bomberJet.warningTimer > 0) {
                ctx.save();
                ctx.fillStyle = '#ef4444';
                ctx.font = 'bold 15px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`⚠️ NGUY HIỂM: ĐƯỜNG BAY MÁY BAY THẢ BOM! (${Math.ceil(bomberJet.warningTimer / 60)}s)`, CANVAS_WIDTH / 2, 45);
                ctx.restore();
            }
        }

        // 2. Bomb Target Reticles & Exploding Fuses
        bombs.forEach(b => {
            ctx.save();
            const fuseProgress = 1 - b.fuse / 85;
            const radius = fuseProgress * 48;

            ctx.strokeStyle = fuseProgress > 0.7 ? '#ef4444' : '#facc15';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.arc(b.x, b.y, Math.max(8, radius), 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(b.x - 14, b.y); ctx.lineTo(b.x + 14, b.y);
            ctx.moveTo(b.x, b.y - 14); ctx.lineTo(b.x, b.y + 14);
            ctx.stroke();

            ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
            ctx.beginPath();
            ctx.arc(b.x, b.y, Math.max(8, radius), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // 3. Stealth Fighter Jet Aircraft Animation (Appears after warning phase)
        if (bomberJet && bomberJet.warningTimer <= 0) {
            ctx.save();
            const jetPt = getBezierPoint(bomberJet.p0, bomberJet.p1, bomberJet.p2, bomberJet.progress);
            const jetAngle = getBezierTangent(bomberJet.p0, bomberJet.p1, bomberJet.p2, bomberJet.progress);

            const jx = jetPt.x;
            const jy = jetPt.y;

            // Ground Drop Shadow (3D Altitude Effect)
            ctx.save();
            ctx.translate(jx + 25, jy + 35);
            ctx.rotate(jetAngle);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.beginPath();
            ctx.moveTo(35, 0);
            ctx.lineTo(-25, -28);
            ctx.lineTo(-10, 0);
            ctx.lineTo(-25, 28);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // Stealth Jet Aircraft Body
            ctx.save();
            ctx.translate(jx, jy);
            ctx.rotate(jetAngle);

            // Jet Engine Thruster Flame
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(-18, -4);
            ctx.lineTo(-32 - Math.random() * 8, 0);
            ctx.lineTo(-18, 4);
            ctx.closePath();
            ctx.fill();

            // Jet Fuselage & Delta Wings
            const jetGrad = ctx.createLinearGradient(-25, 0, 35, 0);
            jetGrad.addColorStop(0, '#0f172a');
            jetGrad.addColorStop(0.5, '#334155');
            jetGrad.addColorStop(1, '#64748b');
            ctx.fillStyle = jetGrad;

            ctx.beginPath();
            ctx.moveTo(38, 0);       // Nose cone
            ctx.lineTo(-25, -30);    // Left wingtip
            ctx.lineTo(-12, -8);     // Left wing joint
            ctx.lineTo(-22, 0);      // Tail notch
            ctx.lineTo(-12, 8);      // Right wing joint
            ctx.lineTo(-25, 30);     // Right wingtip
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Cockpit Glass
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.ellipse(10, 0, 8, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            ctx.restore();
        }

        // 4. Supply Cargo Aircraft Trajectory & Purple Cargo Jet Model
        if (supplyJet) {
            ctx.save();
            ctx.setLineDash([12, 8]);
            ctx.lineDashOffset = -supplyJet.progress * 80;
            ctx.strokeStyle = supplyJet.warningTimer > 0 ? 'rgba(192, 132, 252, 0.95)' : 'rgba(192, 132, 252, 0.55)';
            ctx.lineWidth = supplyJet.warningTimer > 0 ? 3.5 : 2.5;

            ctx.beginPath();
            const steps = 50;
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const pt = getBezierPoint(supplyJet.p0, supplyJet.p1, supplyJet.p2, t);
                if (i === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            if (supplyJet.warningTimer > 0) {
                ctx.save();
                ctx.fillStyle = '#c084fc';
                ctx.font = 'bold 15px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`📦 VIỆN TRỢ: MÁY BAY THẢ XE TĂNG PURPLE GIANT! (${Math.ceil(supplyJet.warningTimer / 60)}s)`, CANVAS_WIDTH / 2, 75);
                ctx.restore();
            }

            if (supplyJet.warningTimer <= 0) {
                ctx.save();
                const jetPt = getBezierPoint(supplyJet.p0, supplyJet.p1, supplyJet.p2, supplyJet.progress);
                const jetAngle = getBezierTangent(supplyJet.p0, supplyJet.p1, supplyJet.p2, supplyJet.progress);

                const jx = jetPt.x;
                const jy = jetPt.y;

                // Shadow
                ctx.save();
                ctx.translate(jx + 25, jy + 35);
                ctx.rotate(jetAngle);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
                ctx.beginPath();
                ctx.moveTo(35, 0);
                ctx.lineTo(-25, -28);
                ctx.lineTo(-10, 0);
                ctx.lineTo(-25, 28);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                // Supply Cargo Jet Aircraft Body
                ctx.save();
                ctx.translate(jx, jy);
                ctx.rotate(jetAngle);

                // Cyan/Purple Engine Flame
                ctx.fillStyle = '#c084fc';
                ctx.beginPath();
                ctx.moveTo(-18, -5);
                ctx.lineTo(-35 - Math.random() * 8, 0);
                ctx.lineTo(-18, 5);
                ctx.closePath();
                ctx.fill();

                const cargoGrad = ctx.createLinearGradient(-25, 0, 35, 0);
                cargoGrad.addColorStop(0, '#581c87');
                cargoGrad.addColorStop(0.5, '#7e22ce');
                cargoGrad.addColorStop(1, '#c084fc');
                ctx.fillStyle = cargoGrad;

                ctx.beginPath();
                ctx.moveTo(38, 0);
                ctx.lineTo(-25, -34);
                ctx.lineTo(-12, -10);
                ctx.lineTo(-22, 0);
                ctx.lineTo(-12, 10);
                ctx.lineTo(-25, 34);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = '#e9d5ff';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.ellipse(10, 0, 8, 3.5, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
                ctx.restore();
            }
        }

        // Render Support Tanks
        supportTanks.forEach(st => st.draw(ctx));
    }

    if (currentMapIndex === 2) {
        civilians.forEach(c => c.draw(ctx));
        copHelicopters.forEach(h => h.draw(ctx));
    }

    walls.forEach(w => {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;

        if (w.type === 'metal') {
            const grad = ctx.createLinearGradient(w.x, w.y, w.x + w.w, w.y + w.h);
            grad.addColorStop(0, '#475569');
            grad.addColorStop(0.5, '#1e293b');
            grad.addColorStop(1, '#0f172a');
            ctx.fillStyle = grad;
            ctx.fillRect(w.x, w.y, w.w, w.h);

            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
            ctx.strokeRect(w.x, w.y, w.w, w.h);

            ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(w.x + 2, w.y + 2, w.w - 4, w.h - 4);
        } else {
            const grad = ctx.createLinearGradient(w.x, w.y, w.x, w.y + w.h);
            grad.addColorStop(0, '#78350f');
            grad.addColorStop(0.5, '#451a03');
            grad.addColorStop(1, '#1c1917');
            ctx.fillStyle = grad;
            ctx.fillRect(w.x, w.y, w.w, w.h);

            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 2;
            ctx.strokeRect(w.x, w.y, w.w, w.h);

            ctx.strokeStyle = 'rgba(251, 191, 36, 0.15)';
            ctx.lineWidth = 1;
            ctx.strokeRect(w.x + 3, w.y + 3, w.w - 6, w.h - 6);
        }

        ctx.restore();
    });

    if (currentMapIndex === 0) {
        tigers.forEach(t => t.draw(ctx));
    }
}
