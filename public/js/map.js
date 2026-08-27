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
const beehives = [];
const angrySwarms = [];

// Supply Aircraft & Giant Purple Support Tank System (Map 2)
const supportTanks = [];
let supplyJet = null;
let supplyTimer = 0;

// Map 4: Ice & Snowstorm System
const nonSlipPatches = [];
let blizzardTimer = 0;
let blizzardCooldown = 480; // 8 seconds cooldown = 480 frames
let blizzardDir = { name: 'từ TRÁI sang PHẢI', vx: 2.3, vy: 0, arrow: '➡️' };
let blizzardWarningTimer = 0;
const snowstormParticles = [];

// Map 4: Electric Pylons & Thunder Cloud Maze System
const electricPylons = [];
const electricPylonRows = [];
const electricSegments = [];
let electricPhase = 'WARNING'; // Start with 3s WARNING so thunder clouds strike lightning immediately!
let electricTimer = 180;
let electricClouds = [];

function getPatchRadiusAtAngle(patch, angle) {
    const count = patch.offsets.length;
    let normAngle = angle % (Math.PI * 2);
    if (normAngle < 0) normAngle += Math.PI * 2;

    const sector = (normAngle / (Math.PI * 2)) * count;
    const idx1 = Math.floor(sector) % count;
    const idx2 = (idx1 + 1) % count;
    const t = sector - Math.floor(sector);

    const r1 = patch.baseRadius * patch.offsets[idx1];
    const r2 = patch.baseRadius * patch.offsets[idx2];

    return r1 + (r2 - r1) * t;
}

function getCraterPath(ctx, patch) {
    const { cx, cy, baseRadius, offsets } = patch;
    const count = offsets.length;
    const points = [];
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const r = baseRadius * offsets[i];
        points.push({
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r
        });
    }

    ctx.beginPath();
    const firstMid = {
        x: (points[0].x + points[count - 1].x) / 2,
        y: (points[0].y + points[count - 1].y) / 2
    };
    ctx.moveTo(firstMid.x, firstMid.y);

    for (let i = 0; i < count; i++) {
        const pCurrent = points[i];
        const pNext = points[(i + 1) % count];
        const mid = {
            x: (pCurrent.x + pNext.x) / 2,
            y: (pCurrent.y + pNext.y) / 2
        };
        ctx.quadraticCurveTo(pCurrent.x, pCurrent.y, mid.x, mid.y);
    }
    ctx.closePath();
}

function isOnNonSlipPatch(x, y) {
    if (typeof currentMapIndex !== 'undefined' && currentMapIndex !== 2) return false;
    for (const patch of nonSlipPatches) {
        if (patch.baseRadius !== undefined && patch.offsets) {
            const dx = x - patch.cx;
            const dy = y - patch.cy;
            const dist = Math.hypot(dx, dy);
            const angle = Math.atan2(dy, dx);
            const rLimit = getPatchRadiusAtAngle(patch, angle);
            if (dist <= rLimit) {
                return true;
            }
        } else if (patch.cx !== undefined) {
            const dx = (x - patch.cx) / patch.rx;
            const dy = (y - patch.cy) / patch.ry;
            if (dx * dx + dy * dy <= 1.0) {
                return true;
            }
        } else if (x >= patch.x && x <= patch.x + patch.w && y >= patch.y && y <= patch.y + patch.h) {
            return true;
        }
    }
    return false;
}


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

            w.push({ x: 220, y: 140, w: 100, h: 20, type: 'metal' }); // Right end flush at x: 320 against vertical brown wall
            w.push({ x: 220, y: 220, w: 20, h: 220, type: 'metal' });
            w.push({ x: 220, y: 500, w: 20, h: 140, type: 'metal' });

            w.push({ x: 320, y: 80, w: 20, h: 180, type: 'brick' });
            w.push({ x: 320, y: 320, w: 120, h: 20, type: 'brick' });
            w.push({ x: 320, y: 400, w: 20, h: 180, type: 'brick' });

            // Center-Left Zone
            w.push({ x: 420, y: 140, w: 20, h: 220, type: 'metal' });
            w.push({ x: 420, y: 440, w: 20, h: 220, type: 'metal' });
            w.push({ x: 440, y: 360, w: 80, h: 20, type: 'metal' }); // Attached flush to brown wall x: 440 (0% overlap)

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
            w.push({ x: 660, y: 360, w: 80, h: 20, type: 'metal' }); // Attached flush to center brown wall x: 660 (0% overlap)

            // Right Zone
            w.push({ x: 860, y: 80, w: 20, h: 180, type: 'brick' });
            w.push({ x: 760, y: 320, w: 120, h: 20, type: 'brick' });
            w.push({ x: 860, y: 400, w: 20, h: 180, type: 'brick' });

            w.push({ x: 880, y: 140, w: 100, h: 20, type: 'metal' }); // Left end flush at x: 880 against vertical brown wall
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
    },
    {
        name: "3. Sàn Băng & Bão Tuyết (Ice Rink & Random Snowstorm)",
        desc: "Mê cung trơn trượt có Bãi Băng Hố Bom không trượt & Bão Tuyết 3s mỗi 8s!",
        pro: "❄️ Lợi thế: Đường rộng thoáng dễ quặt lái & bão tuyết xô đạn né đạn hiểm.",
        con: "🌪️ Bất lợi: Xe bị quán tính trôi húc tường nảy & bão tuyết thổi bay xe + đạn!",
        playerSpawn: { x: 80, y: 670 },
        enemySpawns: [
            { x: 1120, y: 80 },
            { x: 1120, y: 670 },
            { x: 600, y: 80 }
        ],
        builder: (w) => {
            nonSlipPatches.length = 0;
            // 5 Irregular Non-Slip Bomb-Crater Ice Patches ("Bãi Băng Hố Bom Méo", Nhỏ Hơn & Hơi Méo)
            nonSlipPatches.push({ cx: 270, cy: 210, baseRadius: 65, offsets: [1.08, 0.82, 1.15, 0.88, 0.76, 1.10, 0.85, 1.05, 0.80, 1.18, 0.90, 0.82] });
            nonSlipPatches.push({ cx: 930, cy: 210, baseRadius: 65, offsets: [0.85, 1.12, 0.80, 1.18, 0.90, 0.82, 1.10, 0.88, 1.15, 0.78, 1.05, 0.88] });
            nonSlipPatches.push({ cx: 270, cy: 530, baseRadius: 65, offsets: [1.15, 0.88, 1.05, 0.80, 1.18, 0.90, 0.82, 1.12, 0.85, 1.10, 0.78, 1.05] });
            nonSlipPatches.push({ cx: 930, cy: 530, baseRadius: 65, offsets: [0.80, 1.18, 0.90, 0.82, 1.10, 0.88, 1.15, 0.85, 1.12, 0.80, 1.05, 0.78] });
            nonSlipPatches.push({ cx: 600, cy: 370, baseRadius: 82, offsets: [1.05, 0.84, 1.16, 0.88, 0.75, 1.12, 0.92, 1.08, 0.78, 1.15, 0.86, 0.82] });

            // Ice Labyrinth Corridors (Dark Ice Blue Walls with Snow Dots)
            w.push({ x: 140, y: 80, w: 20, h: 220, type: 'ice' });
            w.push({ x: 140, y: 440, w: 20, h: 230, type: 'ice' });
            w.push({ x: 60, y: 370, w: 160, h: 20, type: 'ice' });

            w.push({ x: 380, y: 120, w: 20, h: 180, type: 'ice' });
            w.push({ x: 380, y: 440, w: 20, h: 180, type: 'ice' });
            w.push({ x: 260, y: 300, w: 140, h: 20, type: 'ice' });
            w.push({ x: 260, y: 440, w: 140, h: 20, type: 'ice' });

            w.push({ x: 520, y: 80, w: 20, h: 160, type: 'ice' });
            w.push({ x: 660, y: 80, w: 20, h: 160, type: 'ice' });
            w.push({ x: 520, y: 500, w: 20, h: 170, type: 'ice' });
            w.push({ x: 660, y: 500, w: 20, h: 170, type: 'ice' });

            w.push({ x: 800, y: 120, w: 20, h: 180, type: 'ice' });
            w.push({ x: 800, y: 440, w: 20, h: 180, type: 'ice' });
            w.push({ x: 800, y: 300, w: 140, h: 20, type: 'ice' });
            w.push({ x: 800, y: 440, w: 140, h: 20, type: 'ice' });

            w.push({ x: 1040, y: 80, w: 20, h: 220, type: 'ice' });
            w.push({ x: 1040, y: 440, w: 20, h: 230, type: 'ice' });
            w.push({ x: 980, y: 370, w: 160, h: 20, type: 'ice' });

            // Bổ sung thêm các tường băng ma trận mới (Nằm hoàn toàn ở khoảng trống ngoài các bãi tuyết nổi):
            w.push({ x: 450, y: 140, w: 100, h: 20, type: 'ice' });
            w.push({ x: 650, y: 140, w: 100, h: 20, type: 'ice' });
            w.push({ x: 450, y: 600, w: 100, h: 20, type: 'ice' });
            w.push({ x: 650, y: 600, w: 100, h: 20, type: 'ice' });
            w.push({ x: 60, y: 220, w: 60, h: 20, type: 'ice' });
            w.push({ x: 1080, y: 530, w: 60, h: 20, type: 'ice' });
        }
    },
    {
        name: "4. Ma Trận Cột Lôi Điện & Mây Sấm Sét (Electric Pylons & Thunder Cloud)",
        desc: "Đường siêu rộng thoáng, 10s mây điện giật 3s kích hoạt tường điện laser 15s (Random mê cung)!",
        pro: "⚡ Lợi thế: Đường đi rất thoáng rộng, có 10s tự do chạy xuyên qua các Cột Lôi Điện.",
        con: "🌩️ Bất lợi: Mây điện giật 3s tạo tường laser 15s chặn ngõ ngách biến hóa khôn lường!",
        playerSpawn: { x: 80, y: 670 },
        enemySpawns: [
            { x: 1120, y: 80 },
            { x: 1120, y: 670 },
            { x: 600, y: 80 },
            { x: 600, y: 670 },
            { x: 1120, y: 375 }
        ],
        builder: (w) => {
            initElectricPylonsMap();
        }
    }
];

function initElectricPylonsMap() {
    electricPylons.length = 0;
    electricSegments.length = 0;
    electricClouds.length = 0;
    electricPhase = 'INACTIVE'; // Start with 5s INACTIVE phase
    electricTimer = 300; // 5 seconds = 300 frames

    // 18 Organic Battlefield Pylon Positions (staggered & non-rigid for a real tactical battlefield feel)
    const organicPylons = [
        // Upper section
        { id: 0, x: 180, y: 140 },
        { id: 1, x: 390, y: 160 },
        { id: 2, x: 600, y: 120 },
        { id: 3, x: 810, y: 155 },
        { id: 4, x: 1020, y: 135 },
        // Mid-upper section
        { id: 5, x: 270, y: 290 },
        { id: 6, x: 490, y: 310 },
        { id: 7, x: 720, y: 275 },
        { id: 8, x: 940, y: 300 },
        // Mid-lower section
        { id: 9, x: 160, y: 460 },
        { id: 10, x: 380, y: 435 },
        { id: 11, x: 610, y: 475 },
        { id: 12, x: 830, y: 440 },
        { id: 13, x: 1040, y: 465 },
        // Lower section
        { id: 14, x: 280, y: 600 },
        { id: 15, x: 500, y: 580 },
        { id: 16, x: 730, y: 615 },
        { id: 17, x: 930, y: 590 }
    ];

    organicPylons.forEach(pt => {
        electricPylons.push({ id: pt.id, x: pt.x, y: pt.y });
    });

    // Helper to add segment
    function addSeg(x1, y1, x2, y2, p1Idx = -1, p2Idx = -1, isWallConn = false) {
        electricSegments.push({
            id: electricSegments.length,
            p1: { x: x1, y: y1, pylonIdx: p1Idx },
            p2: { x: x2, y: y2, pylonIdx: p2Idx },
            p1Idx: p1Idx,
            p2Idx: p2Idx,
            isWallConn: isWallConn,
            isActive: false,
            animAlpha: 0.0
        });
    }

    // A. Inter-Pylon Segments (Horizontal & Vertical pathways)
    addSeg(180, 140, 390, 160, 0, 1);
    addSeg(390, 160, 600, 120, 1, 2);
    addSeg(600, 120, 810, 155, 2, 3);
    addSeg(810, 155, 1020, 135, 3, 4);

    addSeg(270, 290, 490, 310, 5, 6);
    addSeg(490, 310, 720, 275, 6, 7);
    addSeg(720, 275, 940, 300, 7, 8);

    addSeg(160, 460, 380, 435, 9, 10);
    addSeg(380, 435, 610, 475, 10, 11);
    addSeg(610, 475, 830, 440, 11, 12);
    addSeg(830, 440, 1040, 465, 12, 13);

    addSeg(280, 600, 500, 580, 14, 15);
    addSeg(500, 580, 730, 615, 15, 16);
    addSeg(730, 615, 930, 590, 16, 17);

    addSeg(180, 140, 270, 290, 0, 5);
    addSeg(390, 160, 490, 310, 1, 6);
    addSeg(600, 120, 720, 275, 2, 7);
    addSeg(810, 155, 940, 300, 3, 8);

    addSeg(270, 290, 160, 460, 5, 9);
    addSeg(490, 310, 380, 435, 6, 10);
    addSeg(720, 275, 610, 475, 7, 11);
    addSeg(940, 300, 830, 440, 8, 12);

    addSeg(160, 460, 280, 600, 9, 14);
    addSeg(380, 435, 500, 580, 10, 15);
    addSeg(610, 475, 730, 615, 11, 16);
    addSeg(830, 440, 930, 590, 12, 17);

    // B. Outer Pylon to Outer Boundary Wall Connections (Top y=20, Bottom y=730, Left x=20, Right x=1180)
    addSeg(180, 140, 180, 20, 0, -1, true);
    addSeg(600, 120, 600, 20, 2, -1, true);
    addSeg(1020, 135, 1020, 20, 4, -1, true);

    addSeg(280, 600, 280, 730, 14, -1, true);
    addSeg(730, 615, 730, 730, 16, -1, true);

    addSeg(180, 140, 20, 140, 0, -1, true);
    addSeg(160, 460, 20, 460, 9, -1, true);

    addSeg(1020, 135, 1180, 135, 4, -1, true);
    addSeg(1040, 465, 1180, 465, 13, -1, true);

    // Create Exactly 3 Overhead Storm Clouds (starting off-screen at Y: -100):
    electricClouds = [
        { x: 300, targetY: 70, currentY: -100, size: 85 },
        { x: 600, targetY: 65, currentY: -100, size: 95 },
        { x: 900, targetY: 70, currentY: -100, size: 85 }
    ];

    randomizeElectricMaze();
}

function randomizeElectricMaze() {
    electricSegments.forEach(seg => {
        seg.isActive = false;
    });

    const totalSegs = electricSegments.length;
    // Activate ~60% of segments (e.g. 21 out of 35 segments) so ~40% stay OPEN as wide escape corridors!
    const numActive = 20 + Math.floor(Math.random() * 3);
    const shuffled = [...Array(totalSegs).keys()].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numActive; i++) {
        const segIdx = shuffled[i];
        electricSegments[segIdx].isActive = true;
    }
}

const LOBBY_MAP_DEF = {
    name: "SẢNH CHỜ (LOBBY - BẮN KHÔNG CHẾT)",
    desc: "Sảnh chờ 4 bức tường. Thỏa sức di chuyển & bắn thử đạn (Không mất máu).",
    pro: "🛡️ Trạng thái: An toàn 100%. Bắn đạn nảy thử thoải mái.",
    con: "🎯 Hãy chọn Bản đồ ván đấu bên trên để bắt đầu!",
    playerSpawn: { x: 250, y: 375 },
    enemySpawns: []
};

function getMapDefinition(idx) {
    if (idx === -1 || idx === 'LOBBY') return LOBBY_MAP_DEF;
    return MAP_DEFINITIONS[Math.abs(idx) % 3] || MAP_DEFINITIONS[0];
}

function buildMaze(mapIdx = null) {
    if (mapIdx === -1 || mapIdx === 'LOBBY') {
        currentMapIndex = -1;
    } else if (mapIdx === null) {
        currentMapIndex = Math.floor(Math.random() * 3); // Random equal probability 1/3 across active 3 maps
    } else {
        currentMapIndex = Math.abs(mapIdx) % 3; // Active 3 maps (0: Tiger, 1: Bomb, 2: Snowstorm)
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
    nonSlipPatches.length = 0;
    blizzardTimer = 0;
    blizzardCooldown = 600;
    blizzardWarningTimer = 0;
    snowstormParticles.length = 0;
    if (typeof audio !== 'undefined' && typeof audio.stopBlizzardWind === 'function') {
        audio.stopBlizzardWind();
    }
    if (typeof audio !== 'undefined' && typeof audio.stopElectricHum === 'function') {
        audio.stopElectricHum();
    }

    // Boundary Outer Walls
    walls.push({ x: 0, y: 0, w: CANVAS_WIDTH, h: WALL_THICKNESS, type: 'metal' });
    walls.push({ x: 0, y: CANVAS_HEIGHT - WALL_THICKNESS, w: CANVAS_WIDTH, h: WALL_THICKNESS, type: 'metal' });
    walls.push({ x: 0, y: 0, w: WALL_THICKNESS, h: CANVAS_HEIGHT, type: 'metal' });
    walls.push({ x: CANVAS_WIDTH - WALL_THICKNESS, y: 0, w: WALL_THICKNESS, h: CANVAS_HEIGHT, type: 'metal' });

    if (currentMapIndex === -1) {
        // --- SẢNH CHỜ (LOBBY MAP - 4 BỨC TƯỜNG, BẮN KHÔNG CHẾT) ---
        return;
    }

    const mapDef = MAP_DEFINITIONS[currentMapIndex];
    if (mapDef && mapDef.builder) {
        mapDef.builder(walls);
    }

    // Spawn Special Map Entities
    if (currentMapIndex === 0) {
        // MAP 1: 3 Tigers
        tigers.push(new Tiger(600, 180));
        tigers.push(new Tiger(600, 570));
        tigers.push(new Tiger(360, 375));

        // MAP 1: 6 Angry Beehives Hanging Underneath Horizontal Maze Walls (0% đè lên tường)
        beehives.push(new Beehive(290, 184, 'hanging'));        // Hanging under horizontal wall (220,140)
        beehives.push(new Beehive(170, 664, 'hanging'));        // Hanging under middle of bottom-left wall (120,620) near Player Tank
        beehives.push(new Beehive(600, 344, 'hanging'));        // Hanging under center fortress wall (540,300)
        beehives.push(new Beehive(700, 404, 'hanging'));        // Hanging under center-right metal wall (660,360)
        beehives.push(new Beehive(820, 364, 'hanging'));        // Hanging under right wall (760,320)
        beehives.push(new Beehive(1030, 184, 'hanging'));       // Hanging under top-right wall (960,140)
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

        // Pathfinding around walls & LOS caching
        this.pathNodes = [];
        this.pathIndex = 0;
        this.repathTimer = 0;
        this.losTimer = Math.floor(Math.random() * 4);
        this.cachedLOS = false;
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
                // Spawn White Puddle on the ground (capped max 6 to prevent memory leaks)
                whitePuddles.push({
                    x: this.x,
                    y: this.y,
                    r: 28
                });
                if (whitePuddles.length > 6) whitePuddles.shift();

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

            // Check direct Line Of Sight (Cached once every 5 frames for 60FPS performance)
            this.losTimer--;
            if (this.losTimer <= 0) {
                this.losTimer = 5;
                this.cachedLOS = hasLineOfSight({ x: this.x, y: this.y }, { x: closestTank.x, y: closestTank.y });
            }
            const hasLOS = this.cachedLOS;

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

        const isSleeping = this.frozenTimer > 0;
        const isAction = this.actionTimer > 0;
        const isHunting = !isSleeping && !isAction && (this.target || Math.hypot(this.x - this.homeX, this.y - this.homeY) > 10);

        ctx.save();

        // 0. Red Predator Aura when hunting/chasing
        if (isHunting) {
            ctx.save();
            ctx.translate(this.x, this.y);
            const auraGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 28);
            auraGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
            auraGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(0, 0, 28, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.translate(this.x, this.y + this.pumpOffsetY);
        ctx.rotate(this.angle);

        // Slow breathing when sleeping vs active leg swing
        const breathBounce = isSleeping ? Math.sin(this.animTimer * 0.4) * 1.5 : 0;
        const legPhase = isHunting ? Math.sin(this.animTimer * 1.4) * 8 : (isSleeping ? 0 : Math.sin(this.animTimer * 0.4) * 2);
        const tailPhase = isSleeping ? Math.sin(this.animTimer * 0.3) * 0.15 : Math.sin(this.animTimer * 0.8) * 0.4;

        // 1. Dynamic Tail with Black Stripes & Tip
        ctx.save();
        ctx.translate(-18, 0);
        ctx.rotate(tailPhase);
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-12, Math.sin(this.animTimer * 0.8) * 6, -20, Math.sin(this.animTimer * 0.8 + 1) * 8);
        ctx.stroke();
        // Tail Tip (Dark charcoal)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-20, Math.sin(this.animTimer * 0.8 + 1) * 8, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Four Paws & Sharp Predator Claws (Chân tay dũng mãnh & vuốt sắc)
        const pawColor = '#ea580c';
        const stripeColor = '#0f172a';
        const padColor = '#fef08a';
        const clawColor = '#ffffff';

        // Helper to draw paw with sharp white claws
        const drawPaw = (px, py, rotation, scaleY = 1) => {
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(rotation);
            if (scaleY < 0) ctx.scale(1, -1);
            ctx.fillStyle = pawColor;
            ctx.beginPath();
            ctx.ellipse(0, 0, 7.5, 4.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = padColor;
            ctx.fillRect(-2, 2, 5, 2);

            // Sharp Claws (only when awake/hunting!)
            if (!isSleeping) {
                ctx.fillStyle = clawColor;
                ctx.beginPath();
                ctx.moveTo(5, -2); ctx.lineTo(9, -3); ctx.lineTo(6, 0);
                ctx.moveTo(6, 0); ctx.lineTo(10, 0); ctx.lineTo(6, 2);
                ctx.moveTo(5, 2); ctx.lineTo(9, 3); ctx.lineTo(5, 4);
                ctx.fill();
            }
            ctx.restore();
        };

        // Back Left Paw
        drawPaw(-10 + legPhase, 12, 0.2, 1);
        // Back Right Paw
        drawPaw(-10 - legPhase, -12, -0.2, -1);
        // Front Left Paw
        drawPaw(12 - legPhase, 13, -0.1, 1);
        // Front Right Paw
        drawPaw(12 + legPhase, -13, 0.1, -1);

        // 3. Main Muscular Tiger Body (Sleek Orange Torso with Breathing)
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.ellipse(0, 0, 20 + breathBounce * 0.5, 13 + breathBounce * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // White Underbelly Highlight
        ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dark Tiger Body Stripes (Vằn hổ sắc nét)
        ctx.fillStyle = stripeColor;
        // Stripe 1
        ctx.beginPath(); ctx.moveTo(-10, -13); ctx.lineTo(-7, 0); ctx.lineTo(-10, 13); ctx.lineTo(-12, 13); ctx.lineTo(-9, 0); ctx.lineTo(-12, -13); ctx.fill();
        // Stripe 2
        ctx.beginPath(); ctx.moveTo(-1, -13); ctx.lineTo(2, 0); ctx.lineTo(-1, 13); ctx.lineTo(-3, 13); ctx.lineTo(0, 0); ctx.lineTo(-3, -13); ctx.fill();
        // Stripe 3
        ctx.beginPath(); ctx.moveTo(8, -12); ctx.lineTo(10, 0); ctx.lineTo(8, 12); ctx.lineTo(6, 12); ctx.lineTo(8, 0); ctx.lineTo(6, -12); ctx.fill();

        // 4. Fierce Tiger Head (Đầu hổ hung dữ / Đầu hổ ngủ)
        ctx.save();
        ctx.translate(16, 0);

        // Ears (Pinned back when angry)
        const earAngle = isHunting ? -0.2 : 0;
        ctx.save(); ctx.rotate(earAngle);
        ctx.fillStyle = '#ea580c';
        ctx.beginPath(); ctx.arc(-2, -9, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-2, 9, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fecdd3';
        ctx.beginPath(); ctx.arc(-2, -9, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-2, 9, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Head Main Skull
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
        ctx.fill();

        // White Snout & Cheeks
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.ellipse(4, 0, 5.5, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Open Roaring Mouth & Sharp Fangs (Khi hung dữ)
        if (!isSleeping) {
            // Mouth cavity
            ctx.fillStyle = '#450a0a';
            ctx.beginPath();
            ctx.ellipse(6, 0, 3.5, 4.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Sharp White Fangs / Canine Teeth
            ctx.fillStyle = '#ffffff';
            // Upper left fang
            ctx.beginPath(); ctx.moveTo(5, -3); ctx.lineTo(8, -2); ctx.lineTo(5, -1); ctx.fill();
            // Upper right fang
            ctx.beginPath(); ctx.moveTo(5, 3); ctx.lineTo(8, 2); ctx.lineTo(5, 1); ctx.fill();
            // Lower fangs
            ctx.beginPath(); ctx.moveTo(6, -2); ctx.lineTo(4, -1); ctx.lineTo(6, 0); ctx.fill();
            ctx.beginPath(); ctx.moveTo(6, 2); ctx.lineTo(4, 1); ctx.lineTo(6, 0); ctx.fill();
        }

        // Nose (Dark Pink / Black)
        ctx.fillStyle = '#881337';
        ctx.beginPath();
        ctx.arc(8, 0, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // EYES: Closed when Sleeping vs Fierce Glowing Eyes when Hunting
        if (isSleeping) {
            // Closed Sleeping Eyelines (u u)
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(3, -5, 2.5, 0, Math.PI); // Left sleeping eye
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(3, 5, 2.5, 0, Math.PI); // Right sleeping eye
            ctx.stroke();

            // Translucent Sleep Snot Bubble (Bong bóng ngái ngủ)
            const bubbleRadius = Math.max(1, 3.5 + Math.sin(this.animTimer * 0.6) * 3);
            ctx.save();
            ctx.fillStyle = 'rgba(56, 189, 248, 0.65)';
            ctx.strokeStyle = '#e0f2fe';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(9.5, -2, bubbleRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // White shine highlight on bubble
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(9.5 - bubbleRadius * 0.3, -2 - bubbleRadius * 0.3, bubbleRadius * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            // FIERCE GLOWING PREDATOR EYES (Mắt hổ hung dữ rực lửa)
            ctx.fillStyle = '#ef4444'; // Glowing red iris
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 8;
            ctx.beginPath(); ctx.arc(3, -5, 2.8, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(3, 5, 2.8, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;

            // Slit Pupil
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(3.2, -6.5, 1.2, 4.5);
            ctx.fillRect(3.2, 4.5, 1.2, 4.5);

            // Sharp Angry Eyebrows (Lông mày giận giữ)
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(5, -6); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(5, 6); ctx.stroke();
        }

        // Forehead "王" Stripe Mark
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-3, -3, 5, 1.2);
        ctx.fillRect(-1, -5, 1.2, 10);
        ctx.fillRect(-3, 3, 5, 1.2);

        ctx.restore(); // end head
        ctx.restore(); // end tiger translate

        // 5. Floating "Zzz..." & Sleep Animation Effects during Exhaustion
        if (isSleeping) {
            ctx.save();
            // Floating Zzz Letters drifting up gently (Speed +1.5x total)
            const zHeight = 28;
            const floatProgress = this.animTimer * 2.4;
            const z1Y = floatProgress % zHeight;
            const z2Y = (floatProgress + 9.3) % zHeight;
            const z3Y = (floatProgress + 18.6) % zHeight;

            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 12px sans-serif';
            ctx.globalAlpha = Math.max(0, 1 - (z1Y / zHeight));
            ctx.fillText('z', this.x + 14, this.y - 18 - z1Y);

            ctx.font = 'bold 14px sans-serif';
            ctx.globalAlpha = Math.max(0, 1 - (z2Y / zHeight));
            ctx.fillText('Z', this.x + 22, this.y - 22 - z2Y);

            ctx.font = 'bold 16px sans-serif';
            ctx.globalAlpha = Math.max(0, 1 - (z3Y / zHeight));
            ctx.fillText('Z', this.x + 32, this.y - 26 - z3Y);

            ctx.restore();

            // Animated Exhausted Text (smaller 10px font)
            const dotCycle = Math.floor((Date.now() / 520) % 4);
            const dots = '.'.repeat(dotCycle);

            ctx.save();
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`💤 Hổ đã kiệt sức${dots}`, this.x, this.y - 36);
            ctx.restore();
        } else if (this.actionTimer > 0) {
            // Animated Humping Text (smaller 10px font)
            const dotCycle = Math.floor((Date.now() / 520) % 4);
            const dots = '.'.repeat(dotCycle);

            ctx.save();
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`🐯 Hổ đang nhấp${dots}`, this.x, this.y - 32);
            ctx.restore();
        }
    }
}

// ----------------------------------------------------
// ANGRY BEEHIVE & 3 BEES SWARM SYSTEM (MAP 1)
// ----------------------------------------------------
class Beehive {
    constructor(x, y, mountType = 'hanging') {
        this.x = x;
        this.y = y;
        this.mountType = mountType; // 'hanging', 'attached_left', 'attached_right', 'corner'
        this.radius = 12;
        this.alive = true;
        this.respawnTimer = 0;
    }

    update() {
        if (!this.alive) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) {
                this.alive = true;
            }
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Thin Hanging Vine String connecting wall bottom edge (y = -24) down to hive top (y = -6)
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.lineTo(0, -6);
        ctx.stroke();

        // Vine Green Leaves Details
        ctx.fillStyle = '#16a34a';
        ctx.beginPath(); ctx.ellipse(-4, -18, 4, 2, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(4, -14, 4, 2, 0.4, 0, Math.PI * 2); ctx.fill();

        // Teardrop / Pear-shaped Honeycomb Hive Body
        const hiveGrad = ctx.createRadialGradient(0, 3, 2, 0, 3, 14);
        hiveGrad.addColorStop(0, '#fef08a');
        hiveGrad.addColorStop(0.5, '#eab308');
        hiveGrad.addColorStop(1, '#b45309');
        ctx.fillStyle = hiveGrad;
        ctx.beginPath();
        ctx.ellipse(0, 3, 11, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Honeycomb Ring Segments
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.ellipse(0, -2, 9, 3, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 3, 10, 3.5, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 8, 8, 2.5, 0, 0, Math.PI * 2); ctx.stroke();

        // Dark Entrance Hole at Bottom
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.ellipse(0, 9, 3.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Subtle Pollen particles
        const t = Date.now() / 220;
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(Math.sin(t) * 14, Math.cos(t * 1.3) * 14, 2, 2);
        ctx.fillRect(Math.cos(t * 0.9) * 12, Math.sin(t * 1.5) * 12, 2, 2);

        ctx.restore();
    }
}

class AngrySwarm {
    constructor(startX, startY, targetTank) {
        this.x = startX;
        this.y = startY;
        this.targetTank = targetTank;
        this.speed = 4.8;
        this.alive = true;
        this.animTimer = 0;

        // 3 Bees offsets in swarm
        this.bees = [
            { rx: -9, ry: -7, phase: 0 },
            { rx: 9, ry: -5, phase: 2.1 },
            { rx: 0, ry: 9, phase: 4.2 }
        ];
    }

    update() {
        if (!this.alive || !this.targetTank || !this.targetTank.alive) {
            this.alive = false;
            return;
        }

        this.animTimer += 0.3;

        // Pursue target tank
        const angle = Math.atan2(this.targetTank.y - this.y, this.targetTank.x - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;

        // Check if swarm reaches target tank
        const dist = Math.hypot(this.targetTank.x - this.x, this.targetTank.y - this.y);
        if (dist < this.targetTank.radius + 12) {
            // APPLY BEE STUNG DEBUFF (4 SECONDS = 240 FRAMES, -40% SPEED)
            this.targetTank.beeStungTimer = 240;

            // Trigger Screen Shake if player tank is stung (Rung màn hình)
            if (this.targetTank.isPlayer && typeof triggerScreenShake === 'function') {
                triggerScreenShake(12, 24); // 24 frames screen vibration (0.4s)
            }

            // Audio FX (Play synthesized Angry Bee Swarm Buzzing Sound FX)
            if (typeof audio !== 'undefined' && typeof audio.playBeeSwarm === 'function') {
                audio.playBeeSwarm();
            }

            // Honey drip explosion particles
            for (let i = 0; i < 8; i++) {
                const vx = (Math.random() - 0.5) * 4;
                const vy = (Math.random() - 0.5) * 4;
                const p = new Particle(this.x, this.y, '#facc15', vx, vy, Math.random() * 3 + 2, 20, 'circle');
                if (typeof addParticle === 'function') addParticle(p);
                else if (typeof particles !== 'undefined') particles.push(p);
            }

            this.alive = false;
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        const angle = this.targetTank ? Math.atan2(this.targetTank.y - this.y, this.targetTank.x - this.x) : 0;

        // Draw 3 Angry Bees in Swarm (3 con ong đuổi theo)
        this.bees.forEach((b, idx) => {
            const bx = this.x + b.rx + Math.sin(this.animTimer * 2 + b.phase) * 4;
            const by = this.y + b.ry + Math.cos(this.animTimer * 2 + b.phase) * 4;

            ctx.save();
            ctx.translate(bx, by);
            ctx.rotate(angle + Math.PI / 2);

            // Bee Body
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.ellipse(0, 0, 5, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Black Stripes
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-3, -4, 2, 8);
            ctx.fillRect(1, -4, 2, 8);

            // Red Angry Eyes
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(2, -3, 2, 2);
            ctx.fillRect(2, 1, 2, 2);

            // Buzzing Wings
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            const wingW = 4 + Math.sin(this.animTimer * 12 + idx) * 2;
            ctx.beginPath();
            ctx.ellipse(-2, -4, wingW, 2.5, -0.3, 0, Math.PI * 2);
            ctx.ellipse(-2, 4, wingW, 2.5, 0.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });

        ctx.restore();
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
        beehives.forEach(bh => bh.update());

        // Bullet Collisions with Beehives (Bắn trúng tổ ong)
        if (bullets && bullets.length > 0) {
            bullets.forEach(bullet => {
                if (!bullet.alive) return;
                beehives.forEach(bh => {
                    if (bh.alive) {
                        const dist = Math.hypot(bullet.x - bh.x, bullet.y - bh.y);
                        if (dist < bh.radius + bullet.radius + 6) {
                            bullet.alive = false;
                            bh.alive = false;
                            bh.respawnTimer = 900; // Respawns after 15s

                            if (typeof audio !== 'undefined' && typeof audio.playBeeSwarm === 'function') {
                                audio.playBeeSwarm();
                            }
                            for (let i = 0; i < 15; i++) {
                                if (typeof particles !== 'undefined') {
                                    particles.push(new Particle(bh.x, bh.y, '#eab308', Math.random() * 6 + 2, 30));
                                }
                            }

                            // Determine target tank (the tank that fired or closest tank)
                            let targetTank = bullet.owner && bullet.owner.alive ? bullet.owner : null;
                            if (!targetTank) {
                                let minDist = 9999;
                                allTanks.forEach(t => {
                                    const d = Math.hypot(t.x - bh.x, t.y - bh.y);
                                    if (d < minDist) {
                                        minDist = d;
                                        targetTank = t;
                                    }
                                });
                            }

                            if (targetTank) {
                                angrySwarms.push(new AngrySwarm(bh.x, bh.y, targetTank));
                            }
                        }
                    }
                });
            });
        }

        // Update & Filter Active Angry Swarms
        for (let i = angrySwarms.length - 1; i >= 0; i--) {
            const swarm = angrySwarms[i];
            swarm.update();
            if (!swarm.alive) {
                angrySwarms.splice(i, 1);
            }
        }
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
        updateSnowstormMapEntities(player, enemies, bullets);
    } else if (currentMapIndex === 3) {
        updateElectricMapEntities(player, enemies, bullets);
    }
}

function pushTanksAwayFromElectricWalls(player, enemies) {
    if (currentMapIndex !== 3) return;

    const allTanks = [];
    if (player && player.alive) allTanks.push(player);
    if (enemies) enemies.forEach(e => { if (e && e.alive) allTanks.push(e); });
    if (typeof supportTanks !== 'undefined') supportTanks.forEach(st => { if (st && st.alive) allTanks.push(st); });

    allTanks.forEach(tank => {
        electricSegments.forEach(seg => {
            if (!seg.isActive) return;
            const p1 = seg.p1;
            const p2 = seg.p2;

            const dist = distToSegment(tank.x, tank.y, p1.x, p1.y, p2.x, p2.y);
            const safeDist = tank.radius + 16; // 34px

            if (dist < safeDist) {
                // Tank is standing inside active laser wall segment! Knock tank back outward!
                const segDx = p2.x - p1.x;
                const segDy = p2.y - p1.y;
                const segLen = Math.hypot(segDx, segDy);

                let nx = 0, ny = -1;
                if (segLen > 0) {
                    nx = -segDy / segLen;
                    ny = segDx / segLen;

                    // Choose direction pointing towards tank position
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;
                    const dot = (tank.x - midX) * nx + (tank.y - midY) * ny;
                    if (dot < 0) {
                        nx = -nx;
                        ny = -ny;
                    }
                }

                // Push tank out by pushDist
                const pushDist = (safeDist - dist) + 14;
                let targetX = tank.x + nx * pushDist;
                let targetY = tank.y + ny * pushDist;

                // Clamp inside canvas boundary
                targetX = Math.max(WALL_THICKNESS + tank.radius + 5, Math.min(CANVAS_WIDTH - WALL_THICKNESS - tank.radius - 5, targetX));
                targetY = Math.max(WALL_THICKNESS + tank.radius + 5, Math.min(CANVAS_HEIGHT - WALL_THICKNESS - tank.radius - 5, targetY));

                tank.x = targetX;
                tank.y = targetY;

                // Create electric shock spark particles
                if (typeof createSparks === 'function') {
                    createSparks(tank.x, tank.y);
                }
            }
        });
    });
}

function updateElectricMapEntities(player, enemies, bullets) {
    if (currentMapIndex !== 3) {
        if (typeof audio !== 'undefined' && typeof audio.stopElectricHum === 'function') {
            audio.stopElectricHum();
        }
        return;
    }

    if (electricTimer > 0) {
        electricTimer--;
    }

    // Cloud Y-Position Descending/Ascending Animation
    electricClouds.forEach(cloud => {
        if (electricPhase === 'WARNING' || electricPhase === 'ACTIVE') {
            if (cloud.currentY < cloud.targetY) cloud.currentY = Math.min(cloud.targetY, cloud.currentY + 5);
        } else {
            if (cloud.currentY > -100) cloud.currentY = Math.max(-100, cloud.currentY - 5);
        }
    });

    // Smooth Alpha animation for active laser wall segments
    electricSegments.forEach(seg => {
        if (electricPhase === 'ACTIVE' && seg.isActive) {
            if (seg.animAlpha < 1.0) seg.animAlpha = Math.min(1.0, seg.animAlpha + 0.08);
        } else {
            if (seg.animAlpha > 0) seg.animAlpha = Math.max(0, seg.animAlpha - 0.08);
        }
    });

    // Phase Transitions:
    if (electricPhase === 'INACTIVE') {
        if (typeof audio !== 'undefined' && typeof audio.stopElectricHum === 'function') {
            audio.stopElectricHum();
        }

        if (electricTimer <= 0) {
            // Start 3s WARNING Phase (180 frames)
            electricPhase = 'WARNING';
            electricTimer = 180;
            randomizeElectricMaze();

            if (typeof audio !== 'undefined' && typeof audio.playElectricThunder === 'function') {
                audio.playElectricThunder();
            }
        }
    } else if (electricPhase === 'WARNING') {
        if (typeof audio !== 'undefined' && typeof audio.stopElectricHum === 'function') {
            audio.stopElectricHum();
        }

        if (electricTimer <= 0) {
            // Start 15s ACTIVE Phase (900 frames)
            electricPhase = 'ACTIVE';
            electricTimer = 900;

            // Immediately knock back any tanks standing inside active laser wall segments!
            pushTanksAwayFromElectricWalls(player, enemies);

            if (typeof buildPathfindingGrid === 'function') buildPathfindingGrid();

            if (typeof audio !== 'undefined' && typeof audio.startElectricHum === 'function') {
                audio.startElectricHum();
            }
        }
    } else if (electricPhase === 'ACTIVE') {
        if (typeof audio !== 'undefined' && typeof audio.startElectricHum === 'function') {
            audio.startElectricHum();
        }

        if (electricTimer <= 0) {
            // Start 5s INACTIVE Phase (300 frames)
            electricPhase = 'INACTIVE';
            electricTimer = 300;
            if (typeof buildPathfindingGrid === 'function') buildPathfindingGrid();

            if (typeof audio !== 'undefined' && typeof audio.stopElectricHum === 'function') {
                audio.stopElectricHum();
            }
        }
    }
}

function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return Math.hypot(px - projX, py - projY);
}

function checkElectricWallCollideAt(nx, ny, radius = 18) {
    if (currentMapIndex !== 3) return false;

    // 1. Always check solid circle collision with individual Tesla Pylons (Tanks CANNOT drive over pylons in ANY state!)
    for (let i = 0; i < electricPylons.length; i++) {
        const pylon = electricPylons[i];
        const dx = nx - pylon.x;
        const dy = ny - pylon.y;
        if (dx * dx + dy * dy < (radius + 12) * (radius + 12)) {
            return true;
        }
    }

    // 2. When Active: check solid line segment collision with connecting laser beams
    for (let i = 0; i < electricSegments.length; i++) {
        const seg = electricSegments[i];
        if (!seg.isActive || seg.animAlpha < 0.25) continue;
        const p1 = seg.p1;
        const p2 = seg.p2;
        const dist = distToSegment(nx, ny, p1.x, p1.y, p2.x, p2.y);
        if (dist < radius + 10) {
            return true;
        }
    }
    return false;
}

function updateSnowstormMapEntities(player, enemies, bullets) {
    if (currentMapIndex !== 2) {
        if (typeof audio !== 'undefined' && typeof audio.stopBlizzardWind === 'function') {
            audio.stopBlizzardWind();
        }
        return;
    }

    if (blizzardTimer > 0) {
        blizzardTimer--;

        // Play continuous howling wind sound during snowstorm
        if (typeof audio !== 'undefined' && typeof audio.startBlizzardWind === 'function') {
            audio.startBlizzardWind();
        }

        const windX = blizzardDir.vx;
        const windY = blizzardDir.vy;

        // Push Player
        if (player && player.alive) {
            if (typeof player.applyWindPush === 'function') {
                player.applyWindPush(windX, windY);
            } else {
                player.moveWithWallSliding(windX, windY);
            }
        }

        // Push Enemies
        enemies.forEach(enemy => {
            if (enemy && enemy.alive) {
                if (typeof enemy.applyWindPush === 'function') {
                    enemy.applyWindPush(windX, windY);
                } else {
                    enemy.moveWithWallSliding(windX, windY);
                }
            }
        });

        // Push Support Tanks if any
        supportTanks.forEach(st => {
            if (st && st.alive) {
                if (typeof st.applyWindPush === 'function') {
                    st.applyWindPush(windX, windY);
                } else {
                    st.moveWithWallSliding(windX, windY);
                }
            }
        });

        // Push Bullets
        bullets.forEach(bullet => {
            if (bullet && bullet.alive) {
                bullet.vx += windX * 0.10;
                bullet.vy += windY * 0.10;
            }
        });

        // Spawn blowing snow particles
        for (let i = 0; i < 5; i++) {
            let px, py;
            if (blizzardDir.vx > 0) { px = Math.random() * 200 - 100; py = Math.random() * CANVAS_HEIGHT; }
            else if (blizzardDir.vx < 0) { px = CANVAS_WIDTH + Math.random() * 100; py = Math.random() * CANVAS_HEIGHT; }
            else if (blizzardDir.vy > 0) { px = Math.random() * CANVAS_WIDTH; py = Math.random() * 200 - 100; }
            else { px = Math.random() * CANVAS_WIDTH; py = CANVAS_HEIGHT + Math.random() * 100; }

            snowstormParticles.push({
                x: px,
                y: py,
                vx: blizzardDir.vx * (2.8 + Math.random() * 2) + (blizzardDir.vy !== 0 ? (Math.random() - 0.5) * 3 : 0),
                vy: blizzardDir.vy * (2.8 + Math.random() * 2) + (blizzardDir.vx !== 0 ? (Math.random() - 0.5) * 3 : 0),
                size: Math.random() * 3 + 1.5,
                alpha: Math.random() * 0.7 + 0.3,
                life: 90
            });
        }

        if (blizzardTimer <= 0) {
            // Snowstorm ended! Stop wind sound and reset to 8s interval (480 frames)
            if (typeof audio !== 'undefined' && typeof audio.stopBlizzardWind === 'function') {
                audio.stopBlizzardWind();
            }
            blizzardCooldown = 480;
        }
    } else {
        // Stop wind sound when snowstorm is not blowing
        if (typeof audio !== 'undefined' && typeof audio.stopBlizzardWind === 'function') {
            audio.stopBlizzardWind();
        }

        // Countdown for next blizzard (8s interval = 480 frames)
        if (blizzardCooldown > 0) {
            blizzardCooldown--;
            if (blizzardCooldown <= 120) { // 2s warning
                if (blizzardCooldown === 120 && typeof audio !== 'undefined' && typeof audio.playBlizzardWarning === 'function') {
                    audio.playBlizzardWarning();
                }
                blizzardWarningTimer = blizzardCooldown;
            } else {
                blizzardWarningTimer = 0;
            }
        }

        if (blizzardCooldown <= 0) {
            // Trigger Random Blizzard lasting 3 seconds (180 frames)
            const dirs = [
                { name: 'từ TRÁI sang PHẢI', vx: 2.3, vy: 0, arrow: '➡️' },
                { name: 'từ PHẢI sang TRÁI', vx: -2.3, vy: 0, arrow: '⬅️' },
                { name: 'từ TRÊN xuống DƯỚI', vx: 0, vy: 2.3, arrow: '⬇️' },
                { name: 'từ DƯỚI lên TRÊN', vx: 0, vy: -2.3, arrow: '⬆️' }
            ];
            blizzardDir = dirs[Math.floor(Math.random() * dirs.length)];
            blizzardTimer = 180; // 3 seconds duration (180 frames)
            blizzardCooldown = 480; // 8 seconds interval (480 frames)
            blizzardWarningTimer = 0;

            if (typeof audio !== 'undefined' && typeof audio.startBlizzardWind === 'function') {
                audio.startBlizzardWind();
            }
        }
    }

    // Update snowstorm particles
    for (let i = snowstormParticles.length - 1; i >= 0; i--) {
        const sp = snowstormParticles[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.life--;
        if (sp.life <= 0 || sp.x < -120 || sp.x > CANVAS_WIDTH + 120 || sp.y < -120 || sp.y > CANVAS_HEIGHT + 120) {
            snowstormParticles.splice(i, 1);
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

    if (currentMapIndex === 3 && typeof checkElectricWallCollideAt === 'function') {
        if (checkElectricWallCollideAt(nx, ny, radius)) {
            return true;
        }
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
    const closedGrid = new Uint8Array(GRID_COLS * GRID_ROWS);

    const startNode = {
        col: openStart.col,
        row: openStart.row,
        g: 0,
        h: heuristic(openStart, openTarget),
        f: heuristic(openStart, openTarget),
        parent: null
    };

    openSet.push(startNode);

    let maxSteps = 250;
    while (openSet.length > 0 && maxSteps-- > 0) {
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
        closedGrid[current.row * GRID_COLS + current.col] = 1;

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
            if (closedGrid[nb.row * GRID_COLS + nb.col] === 1) continue;

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

    // Map 4: Check Ray Intersection with Electric Pylons and Active Electric Laser Walls
    if (currentMapIndex === 3) {
        // A. Check Raycast with individual Tesla Pylons (24x24 box obstacle)
        for (let pIdx = 0; pIdx < electricPylons.length; pIdx++) {
            const pylon = electricPylons[pIdx];
            const pylonWall = { x: pylon.x - 12, y: pylon.y - 12, w: 24, h: 24 };
            const segments = getWallSegments(pylonWall);
            for (const seg of segments) {
                const hit = rayIntersectSegment(origin, dir, seg.p1, seg.p2);
                if (hit && hit.param < minDistance) {
                    minDistance = hit.param;
                    closestHit = {
                        point: { x: hit.x, y: hit.y },
                        distance: hit.param,
                        normal: seg.normal,
                        wall: pylonWall
                    };
                }
            }
        }

        // B. Check Raycast with Active Laser Wall Segments (including outer wall connections)
        for (let sIdx = 0; sIdx < electricSegments.length; sIdx++) {
            const seg = electricSegments[sIdx];
            if (!seg.isActive || seg.animAlpha < 0.25) continue;
            const p1 = seg.p1;
            const p2 = seg.p2;
            const segDx = p2.x - p1.x;
            const segDy = p2.y - p1.y;
            const segLen = Math.hypot(segDx, segDy);
            if (segLen > 0) {
                const nx = -segDy / segLen;
                const ny = segDx / segLen;
                const hit = rayIntersectSegment(origin, dir, p1, p2);
                if (hit && hit.param < minDistance) {
                    minDistance = hit.param;
                    closestHit = {
                        point: { x: hit.x, y: hit.y },
                        distance: hit.param,
                        normal: { x: nx, y: ny }
                    };
                }
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

function predictBulletPoints(bullet, maxSteps = 18) {
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

// ----------------------------------------------------
// HIGH-PERFORMANCE PROCEDURAL JUNGLE TERRAIN (MAP 1)
// ----------------------------------------------------
let offscreenJungleCanvas = null;
let jungleWorms = [];

function buildOffscreenJungleGround() {
    if (offscreenJungleCanvas) return;

    offscreenJungleCanvas = document.createElement('canvas');
    offscreenJungleCanvas.width = CANVAS_WIDTH;
    offscreenJungleCanvas.height = CANVAS_HEIGHT;
    const octx = offscreenJungleCanvas.getContext('2d');

    // 1. Deep Jungle Forest Gradient Base
    const forestGrad = octx.createRadialGradient(
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 100,
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 700
    );
    forestGrad.addColorStop(0, '#0a2316');
    forestGrad.addColorStop(0.6, '#061a10');
    forestGrad.addColorStop(1, '#030d08');
    octx.fillStyle = forestGrad;
    octx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Organic Mud & Earth Dirt Tracks (Vệt bùn đất)
    const jungleDirtPatches = [
        { cx: 200, cy: 360, rx: 125, ry: 85, rot: 0.2 },
        { cx: 600, cy: 375, rx: 155, ry: 95, rot: -0.15 },
        { cx: 980, cy: 360, rx: 125, ry: 85, rot: 0.1 },
        { cx: 360, cy: 180, rx: 100, ry: 70, rot: -0.3 },
        { cx: 840, cy: 570, rx: 105, ry: 75, rot: 0.25 },
        { cx: 170, cy: 640, rx: 95, ry: 60, rot: 0.1 }
    ];

    jungleDirtPatches.forEach(d => {
        octx.save();
        octx.translate(d.cx, d.cy);
        octx.rotate(d.rot);

        const dirtGrad = octx.createRadialGradient(0, 0, 5, 0, 0, d.rx);
        dirtGrad.addColorStop(0, 'rgba(54, 34, 17, 0.85)');
        dirtGrad.addColorStop(0.55, 'rgba(40, 25, 12, 0.55)');
        dirtGrad.addColorStop(1, 'rgba(10, 35, 22, 0)');

        octx.fillStyle = dirtGrad;
        octx.beginPath();
        octx.ellipse(0, 0, d.rx, d.ry, 0, 0, Math.PI * 2);
        octx.fill();
        octx.restore();
    });

    // 3. Scattered Forest Rocks & Mossy Boulders (Đá rải rác)
    const jungleRocks = [
        { x: 140, y: 120, rx: 11, ry: 8, rot: 0.3 },
        { x: 310, y: 260, rx: 14, ry: 9, rot: -0.4 },
        { x: 500, y: 160, rx: 12, ry: 8, rot: 0.1 },
        { x: 680, y: 240, rx: 15, ry: 10, rot: 0.6 },
        { x: 880, y: 180, rx: 13, ry: 8, rot: -0.2 },
        { x: 260, y: 480, rx: 12, ry: 8, rot: 0.5 },
        { x: 490, y: 560, rx: 16, ry: 11, rot: -0.1 },
        { x: 740, y: 520, rx: 13, ry: 9, rot: 0.2 },
        { x: 920, y: 460, rx: 14, ry: 9, rot: -0.5 },
        { x: 1040, y: 640, rx: 12, ry: 8, rot: 0.3 },
        { x: 180, y: 700, rx: 15, ry: 10, rot: -0.2 }
    ];

    jungleRocks.forEach(rk => {
        octx.save();
        octx.translate(rk.x, rk.y);
        octx.rotate(rk.rot);

        // Rock Shadow
        octx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        octx.beginPath();
        octx.ellipse(2, 3, rk.rx, rk.ry, 0, 0, Math.PI * 2);
        octx.fill();

        // Rock Body
        const rkGrad = octx.createRadialGradient(-3, -3, 2, 0, 0, rk.rx);
        rkGrad.addColorStop(0, '#64748b');
        rkGrad.addColorStop(0.6, '#334155');
        rkGrad.addColorStop(1, '#1e293b');
        octx.fillStyle = rkGrad;
        octx.beginPath();
        octx.ellipse(0, 0, rk.rx, rk.ry, 0, 0, Math.PI * 2);
        octx.fill();

        // Moss Cap on Rock Top
        octx.fillStyle = '#15803d';
        octx.beginPath();
        octx.ellipse(-2, -rk.ry * 0.3, rk.rx * 0.6, rk.ry * 0.4, 0, 0, Math.PI * 2);
        octx.fill();

        octx.restore();
    });

    // 4. Fallen Forest Leaves & Pebbles (Lá rụng & Sỏi nhỏ)
    let rng2 = 67890;
    function rand2() {
        rng2 = (rng2 * 9301 + 49297) % 233280;
        return rng2 / 233280;
    }
    for (let i = 0; i < 110; i++) {
        const px = 30 + rand2() * (CANVAS_WIDTH - 60);
        const py = 30 + rand2() * (CANVAS_HEIGHT - 60);
        const type = rand2() < 0.6 ? 'leaf' : 'pebble';
        const color = type === 'leaf' 
            ? (rand2() < 0.4 ? '#b45309' : (rand2() < 0.7 ? '#ca8a04' : '#166534'))
            : (rand2() < 0.5 ? '#334155' : '#1e293b');
        const size = type === 'leaf' ? 3 + rand2() * 4 : 2 + rand2() * 3;
        const rot = rand2() * Math.PI * 2;

        octx.save();
        octx.translate(px, py);
        octx.rotate(rot);
        octx.fillStyle = color;

        if (type === 'leaf') {
            octx.beginPath();
            octx.ellipse(0, 0, size, size * 0.5, 0, 0, Math.PI * 2);
            octx.fill();
        } else {
            octx.beginPath();
            octx.arc(0, 0, size, 0, Math.PI * 2);
            octx.fill();
        }
        octx.restore();
    }

    // 5. Pre-rendered Completely Static Grass Tufts (Giảm 30% cỏ, 100% đứng im cho game mượt 60 FPS!)
    let rng = 12345;
    function rand() {
        rng = (rng * 9301 + 49297) % 233280;
        return rng / 233280;
    }

    for (let i = 0; i < 60; i++) { // Reduced by 30% (60 clusters max)
        const gx = 40 + rand() * (CANVAS_WIDTH - 80);
        const gy = 40 + rand() * (CANVAS_HEIGHT - 80);
        const bladesCount = 3 + Math.floor(rand() * 4); // 3-6 static blades

        octx.save();
        octx.translate(gx, gy);

        for (let b = 0; b < bladesCount; b++) {
            const ang = (rand() - 0.5) * 1.3;
            const len = 7 + rand() * 8;
            const color = rand() < 0.35 ? '#22c55e' : (rand() < 0.7 ? '#15803d' : '#166534');

            octx.strokeStyle = color;
            octx.lineWidth = 1.5;
            octx.beginPath();
            octx.moveTo(0, 0);
            octx.lineTo(Math.sin(ang) * len, -Math.cos(ang) * len);
            octx.stroke();
        }
        octx.restore();
    }
}

function updateAndDrawJungleDynamicTerrain(ctx) {
    buildOffscreenJungleGround();

    // Fast 1-call Blit of Static Offscreen Jungle Terrain (0.01ms render time, locked 60 FPS!)
    ctx.drawImage(offscreenJungleCanvas, 0, 0);
}

function drawBackgroundAndWalls(ctx) {
    if (currentMapIndex === 0) {
        // MAP 1: High-Performance Offscreen Cached Jungle Terrain + Earthworms (60 FPS!)
        updateAndDrawJungleDynamicTerrain(ctx);
    } else {
        // MAP 2 & MAP 3: Grid Floor
        ctx.fillStyle = currentMapIndex === 2 ? '#041527' : '#0b0f19';
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
        // 1. Draw Non-Slip Irregular Bomb-Crater Ice Patches ("Bãi Băng Hố Bom Méo" - Không tròn vo, Nhỏ hơn, Bỏ nét đứt)
        nonSlipPatches.forEach((patch) => {
            ctx.save();

            if (patch.baseRadius !== undefined && patch.offsets) {
                getCraterPath(ctx, patch);

                const grad = ctx.createRadialGradient(patch.cx, patch.cy, 5, patch.cx, patch.cy, patch.baseRadius * 1.1);
                grad.addColorStop(0, '#1e3a8a');
                grad.addColorStop(0.65, '#0c2a4a');
                grad.addColorStop(1, '#080d1a');
                ctx.fillStyle = grad;
                ctx.fill();

                // Solid glowing cyan crater rim
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = '#38bdf8';
                ctx.stroke();
            } else {
                ctx.beginPath();
                if (patch.cx !== undefined) {
                    ctx.ellipse(patch.cx, patch.cy, patch.rx, patch.ry, 0, 0, Math.PI * 2);
                } else {
                    ctx.rect(patch.x, patch.y, patch.w, patch.h);
                }
                ctx.fillStyle = '#0c2a4a';
                ctx.fill();
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            ctx.restore();
        });

        // 2. Draw Blizzard Particles
        snowstormParticles.forEach(sp => {
            ctx.save();
            ctx.globalAlpha = sp.alpha;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // 3. Draw Warning & Active Blizzard Text Banner
        if (blizzardWarningTimer > 0) {
            ctx.save();
            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`⚠️ NGUY HIỂM: BÃỎ TUYẾT SẮP THỔI SẮP ĐẾN! (${Math.ceil(blizzardWarningTimer / 60)}s)`, CANVAS_WIDTH / 2, 45);
            ctx.restore();
        } else if (blizzardTimer > 0) {
            ctx.save();
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`🌪️ BÃỎ TUYẾT ĐANG THỔI ${blizzardDir.arrow} ${blizzardDir.name.toUpperCase()}! (${Math.ceil(blizzardTimer / 60)}s)`, CANVAS_WIDTH / 2, 45);
            ctx.restore();
        }
    }

    walls.forEach(w => {
        ctx.save();

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
        } else if (w.type === 'ice' || currentMapIndex === 2) {
            // Dark Ice Blue Wall with Snow Speckles (lấm tấm hạt tuyết)
            const grad = ctx.createLinearGradient(w.x, w.y, w.x + w.w, w.y + w.h);
            grad.addColorStop(0, '#1e3a8a');
            grad.addColorStop(0.5, '#1e40af');
            grad.addColorStop(1, '#172554');
            ctx.fillStyle = grad;
            ctx.fillRect(w.x, w.y, w.w, w.h);

            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 2;
            ctx.strokeRect(w.x, w.y, w.w, w.h);

            ctx.strokeStyle = 'rgba(186, 230, 253, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(w.x + 2, w.y + 2, w.w - 4, w.h - 4);

            // Render Snow Dots on Wall surface
            ctx.fillStyle = '#ffffff';
            const numSnowDots = Math.floor((w.w * w.h) / 220);
            let seed = w.x * 31 + w.y * 17;
            for (let i = 0; i < numSnowDots; i++) {
                seed = (seed * 9301 + 49297) % 233280;
                const dx = (seed / 233280) * (w.w - 6) + 3;
                seed = (seed * 9301 + 49297) % 233280;
                const dy = (seed / 233280) * (w.h - 6) + 3;
                seed = (seed * 9301 + 49297) % 233280;
                const r = (seed / 233280) * 1.5 + 1;

                ctx.beginPath();
                ctx.arc(w.x + dx, w.y + dy, r, 0, Math.PI * 2);
                ctx.fill();
            }
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
        beehives.forEach(bh => bh.draw(ctx));
        tigers.forEach(t => t.draw(ctx));
        angrySwarms.forEach(sw => sw.draw(ctx));
    } else if (currentMapIndex === 3) {
        drawElectricPylonsAndGrid(ctx);
    }
}

function drawElectricPylonsAndGrid(ctx) {
    if (currentMapIndex !== 3) return;

    // 1. Draw Active Electric Laser Wall Segments between connected pylons
    electricSegments.forEach(seg => {
        if (seg.animAlpha > 0) {
            const alpha = seg.animAlpha;
            const p1 = seg.p1;
            const p2 = seg.p2;

            if (!p1 || !p2) return;

            ctx.save();
            ctx.globalAlpha = alpha;

            // Outer Laser Glow
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 14;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Inner Bright Electric Beam
            ctx.strokeStyle = '#e0f2fe';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Animated High-Frequency Electric Zigzag Arc
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 0;
            ctx.beginPath();
            const steps = 8;
            ctx.moveTo(p1.x, p1.y);
            for (let s = 1; s < steps; s++) {
                const t = s / steps;
                const mx = p1.x + (p2.x - p1.x) * t + (Math.random() - 0.5) * 8;
                const my = p1.y + (p2.y - p1.y) * t + (Math.random() - 0.5) * 8;
                ctx.lineTo(mx, my);
            }
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            ctx.restore();
        }
    });

    // 2. Draw Tesla Pylons
    electricPylons.forEach(pylon => {
        ctx.save();
        ctx.translate(pylon.x, pylon.y);

        // Metal Base Plate
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Metallic Coil Rings
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-6, -6, 12, 12);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-6, -6, 12, 12);

        // Top Glass Orb Antenna
        const isTargeted = (electricPhase === 'WARNING' || electricPhase === 'ACTIVE');

        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        if (isTargeted) {
            ctx.fillStyle = '#38bdf8';
        } else {
            ctx.fillStyle = '#475569';
        }
        ctx.fill();

        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
    });

    // 3. Draw 3 Overhead Storm Clouds & Localized Lightning Arcs (WARNING Phase)
    if (electricPhase === 'WARNING') {
        // Render Exactly 3 Volumetric Storm Clouds (Animated Y descending from top)
        electricClouds.forEach(cloud => {
            const cy = cloud.currentY !== undefined ? cloud.currentY : cloud.targetY;
            if (cy < -60) return; // Hidden off-screen

            ctx.save();
            ctx.translate(cloud.x, cy);

            // Volumetric Dark Indigo/Purple Cloud Body
            ctx.fillStyle = 'rgba(49, 46, 129, 0.92)';
            ctx.shadowColor = '#6366f1';
            ctx.shadowBlur = 25;

            ctx.beginPath();
            ctx.arc(-35, 0, cloud.size * 0.42, 0, Math.PI * 2);
            ctx.arc(0, -15, cloud.size * 0.52, 0, Math.PI * 2);
            ctx.arc(35, 0, cloud.size * 0.42, 0, Math.PI * 2);
            ctx.fill();

            // Cloud Flashing Thunder Core
            const flashAlpha = 0.6 + Math.random() * 0.4;
            ctx.fillStyle = `rgba(129, 140, 248, ${flashAlpha})`;
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 22;
            ctx.beginPath();
            ctx.arc(0, -8, cloud.size * 0.28, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            // ONLY AFTER clouds have finished descending and stopped (final 1s of warning phase, electricTimer <= 60):
            // Burst lightning bolts & screen flash!
            if (electricTimer <= 65 && cy >= cloud.targetY - 5) {
                // Screen Flashing Lightning Effect ("Sét hiện ra nhấp nháy màn hình luôn")
                if (Math.random() < 0.45) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(224, 242, 254, 0.32)';
                    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                    ctx.restore();
                }

                // Localized Lightning Bolts right beneath each cloud
                for (let b = 0; b < 3; b++) {
                    const boltOffsetX = (b - 1) * 35 + (Math.random() - 0.5) * 15;
                    const startX = cloud.x + boltOffsetX;
                    const startY = cy + 18;

                    ctx.save();
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 4.5;
                    ctx.shadowColor = '#06b6d4';
                    ctx.shadowBlur = 18;
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);

                    const midX1 = startX + (Math.random() - 0.5) * 22;
                    const midY1 = startY + 35;
                    const endX = startX + (Math.random() - 0.5) * 30;
                    const endY = startY + 85;

                    ctx.lineTo(midX1, midY1);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();

                    // Inner White Hot Lightning Core
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 0;
                    ctx.stroke();

                    ctx.restore();
                }
            }
        });
    }

    // 4. UI Text Banner
    ctx.save();
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';

    if (electricPhase === 'WARNING') {
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`🌩️ CẢNH BÁO: MÂY SẤM SÉT ĐANG GIẬT ĐIỆN VÀO TẤT CẢ CỘT LÔI ĐIỆN! (${Math.ceil(electricTimer / 60)}s)`, CANVAS_WIDTH / 2, 45);
    } else if (electricPhase === 'ACTIVE') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`⚡ MA TRẬN TƯỜNG LÔI ĐIỆN ĐANG KÍCH HOẠT! (${Math.ceil(electricTimer / 60)}s)`, CANVAS_WIDTH / 2, 45);
    } else if (electricPhase === 'INACTIVE') {
        ctx.fillStyle = '#22c55e';
        ctx.fillText(`⚡ CỘT LÔI ĐIỆN ĐANG TẮT (XE CHẠY XUYÊN KHE CỘT ĐƯỢC): ${Math.ceil(electricTimer / 60)}s`, CANVAS_WIDTH / 2, 45);
    }
    ctx.restore();
}
