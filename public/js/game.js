// --- PUBLIC/JS/GAME.JS - TANK BATTLE GAME ENGINE & CO-OP 2V2 CONTROLLER ---

let canvas, ctx;
let player;
let remotePlayer;
let coopTanksMap = {}; // Quản lý 4 xe tăng theo slotIndex (0, 1, 2, 3)
let enemies = [];
let gameState = 'START'; // 'START' | 'PLAYING' | 'GAMEOVER' | 'WIN'
let gameMode = 'SINGLE'; // 'SINGLE' | 'COOP'
let isPaused = false;
let killCount = 0;

// Key Tracking
const keys = {};
const mousePos = { x: 0, y: 0 };

window.addEventListener('load', () => {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Controls Event Listeners
    window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        keys[k] = true;

        if (k === 'p' && (gameState === 'PLAYING' || isPaused)) {
            togglePause();
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('mousemove', (e) => {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;
        mousePos.x = (e.clientX - rect.left) * scaleX;
        mousePos.y = (e.clientY - rect.top) * scaleY;
    });

    window.addEventListener('mousedown', (e) => {
        if (e.button === 0 && gameState === 'PLAYING' && !isPaused) {
            if (e.target && (e.target.tagName === 'BUTTON' || e.target.closest('.game-modal-card') || e.target.closest('#hud-bar') || e.target.closest('#lobby-vote-overlay'))) {
                return;
            }
            audio.init();
            if (player && player.alive) {
                player.shoot(bullets);
            }
        }
    });

    // Homepage Start Single Player Button
    const startBtn = document.getElementById('start-btn') || document.getElementById('start-single-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (typeof audio !== 'undefined') audio.init();
            initSinglePlayerGame(0);
        });
    }

    // Co-op Mode Open Modal Button
    const coopBtn = document.getElementById('coop-btn') || document.getElementById('open-coop-modal-btn');
    if (coopBtn) {
        coopBtn.addEventListener('click', () => {
            if (typeof audio !== 'undefined') audio.init();
            document.getElementById('coop-mode-select-modal')?.classList.remove('hidden');
        });
    }

    // Close Co-op Modal Button
    const closeCoopModalBtn = document.getElementById('close-coop-modal-btn');
    if (closeCoopModalBtn) {
        closeCoopModalBtn.addEventListener('click', () => {
            if (typeof Multiplayer !== 'undefined' && Multiplayer.backToHomepage) {
                Multiplayer.backToHomepage();
            } else {
                document.getElementById('coop-modal')?.classList.add('hidden');
                document.getElementById('coop-mode-select-modal')?.classList.add('hidden');
                document.getElementById('start-screen')?.classList.remove('hidden');
            }
        });
    }

    // Co-op Host Create Room Button
    const createRoomBtn = document.getElementById('create-room-btn');
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', () => {
            audio.init();
            Multiplayer.createRoom();
        });
    }

    // Co-op Join Room Button
    const joinRoomBtn = document.getElementById('join-room-btn');
    const joinRoomInput = document.getElementById('join-room-input');
    if (joinRoomBtn && joinRoomInput) {
        joinRoomBtn.addEventListener('click', () => {
            audio.init();
            Multiplayer.joinRoom(joinRoomInput.value);
        });
    }

    // Copy Room Code Button
    const copyCodeBtn = document.getElementById('copy-code-btn');
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', () => {
            Multiplayer.copyRoomCode();
        });
    }

    // Refresh Room Code Button
    const refreshCodeBtn = document.getElementById('refresh-code-btn');
    if (refreshCodeBtn) {
        refreshCodeBtn.addEventListener('click', () => {
            Multiplayer.refreshCode();
        });
    }

    // Single Player Map Selection Buttons
    const mapBtn = document.getElementById('map-btn');
    if (mapBtn) {
        mapBtn.addEventListener('click', () => {
            if (gameState === 'PLAYING') return;
            document.getElementById('map-roulette-modal')?.classList.remove('hidden');
        });
    }
});

function triggerScreenShake(duration = 15, intensity = 8) {
    screenShakeTimer = duration;
    screenShakeIntensity = intensity;
}

function showGameElements() {
    const gc = document.getElementById('gameCanvas');
    if (gc) gc.classList.remove('hidden');

    document.getElementById('start-screen')?.classList.add('hidden');

    const hud = document.getElementById('hud');
    if (hud) {
        if (gameMode === 'COOP') {
            hud.classList.add('hidden');
        } else {
            hud.classList.remove('hidden');
        }
    }
}

function hideGameElements() {
    const gc = document.getElementById('gameCanvas');
    if (gc) {
        gc.classList.add('hidden');
        gc.classList.remove('lobby-mode');
    }
    document.getElementById('hud')?.classList.add('hidden');
    document.getElementById('lobby-vote-overlay')?.classList.add('hidden');
}

function togglePause() {
    if (gameState !== 'PLAYING' && !isPaused) return;
    isPaused = !isPaused;
    const pauseScreen = document.getElementById('pause-screen');
    if (pauseScreen) {
        if (isPaused) pauseScreen.classList.remove('hidden');
        else pauseScreen.classList.add('hidden');
    }
}

function initSinglePlayerGame(mapIdx = 0) {
    gameMode = 'SINGLE';
    if (typeof homepageEngine !== 'undefined') homepageEngine.stop();
    buildMaze(mapIdx);
    const mapDef = getMapDefinition(currentMapIndex);

    particles.length = 0;
    trackMarks.length = 0;
    bullets.length = 0;
    isPaused = false;

    // Player Tank (Phe Xanh - Blue)
    player = new Tank(mapDef.playerSpawn.x, mapDef.playerSpawn.y, {
        primary: '#0284c7',
        primaryDark: '#0369a1',
        primaryLight: '#38bdf8',
        border: '#38bdf8',
        accent: '#facc15'
    }, true);
    player.team = 'blue';

    // Enemy Tanks (Phe Đỏ - Red)
    enemies = mapDef.enemySpawns.map(sp => {
        const e = new EnemyTank(sp.x, sp.y);
        e.team = 'red';
        return e;
    });

    killCount = 0;
    updateMapUI(mapDef);
    updateHUD();
    showGameElements();
    gameState = 'PLAYING';
}

const enterLobbyHostBtn = document.getElementById('enter-lobby-host-btn');
if (enterLobbyHostBtn) {
    enterLobbyHostBtn.addEventListener('click', () => {
        audio.init();
        Multiplayer.enterLobbyMap();
    });
}

const coopReadyBtn = document.getElementById('coop-ready-btn');
if (coopReadyBtn) {
    coopReadyBtn.addEventListener('click', () => {
        audio.init();
        Multiplayer.toggleReady();
    });
}

function updateMapButtonState() {
    const mapBtn = document.getElementById('map-btn') || document.getElementById('change-map-btn');
    if (mapBtn) {
        if (gameState === 'PLAYING') {
            mapBtn.disabled = true;
            mapBtn.style.opacity = '0.5';
            mapBtn.style.cursor = 'not-allowed';
        } else {
            mapBtn.disabled = false;
            mapBtn.style.opacity = '1';
            mapBtn.style.cursor = 'pointer';
        }
    }
}

function showGameOver(isWin) {
    const screen = document.getElementById('game-over-screen');
    const title = document.getElementById('game-over-title');
    const msg = document.getElementById('game-over-msg');
    if (!screen || !title || !msg) return;

    if (typeof audio !== 'undefined') {
        if (isWin) audio.playWinVoice();
        else audio.playLoseVoice();
    }

    if (isWin) {
        title.innerText = 'CHIẾN THẮNG!';
        title.className = 'win-title';
        msg.innerText = 'Tất cả xe tăng Phe Đỏ đã bị tiêu diệt!';
    } else {
        title.innerText = 'THẤT BẠI!';
        title.className = 'lose-title';
        msg.innerText = 'Xe tăng Phe Xanh đã bị tiêu diệt!';
    }

    screen.classList.remove('hidden');
    updateMapButtonState();
}

// Function to return to Homepage
function returnToHomepage() {
    gameState = 'START';
    gameMode = 'SINGLE';
    isPaused = false;
    coopTanksMap = {};
    player = null;
    remotePlayer = null;
    hideGameElements();
    document.getElementById('game-over-screen')?.classList.add('hidden');
    document.getElementById('pause-screen')?.classList.add('hidden');
    document.getElementById('map-roulette-modal')?.classList.add('hidden');
    document.getElementById('coop-modal')?.classList.add('hidden');
    document.getElementById('lobby-vote-overlay')?.classList.add('hidden');
    document.getElementById('gameCanvas')?.classList.remove('lobby-mode');
    document.getElementById('start-screen')?.classList.remove('hidden');
    if (typeof homepageEngine !== 'undefined') homepageEngine.start();
    updateMapButtonState();
}

// Core Game Loop
function gameLoop() {
    if (gameState === 'START') {
        requestAnimationFrame(gameLoop);
        return;
    }

    if (gameState === 'PLAYING' && !isPaused) {
        // Update Local Player Movement
        if (player && player.alive) {
            player.update();
            let dx = 0;
            let dy = 0;
            if (keys['w'] || keys['arrowup']) dy -= player.speed;
            if (keys['s'] || keys['arrowdown']) dy += player.speed;
            if (keys['a'] || keys['arrowleft']) dx -= player.speed;
            if (keys['d'] || keys['arrowright']) dx += player.speed;

            if (dx !== 0 || dy !== 0) {
                if (dx !== 0 && dy !== 0) {
                    dx *= 0.7071;
                    dy *= 0.7071;
                }
                player.moveWithWallSliding(dx, dy);
                player.bodyAngle = Math.atan2(dy, dx);
            } else {
                player.moveWithWallSliding(0, 0);
            }

            player.turretAngle = Math.atan2(mousePos.y - player.y, mousePos.x - player.x);

            // Broadcast Move
            if (gameMode === 'COOP' && typeof Multiplayer !== 'undefined' && !Multiplayer.isSpectator) {
                Multiplayer.sendMove(player);
            }
        }

        // Update Remote Tanks in Co-op mode
        if (gameMode === 'COOP') {
            Object.values(coopTanksMap).forEach(t => {
                if (t && t !== player && t.alive) t.update();
            });
        }

        // Update Single Player Enemies
        if (gameMode === 'SINGLE') {
            enemies.forEach(enemy => enemy.update(player, bullets, enemies));
        }

        updateMapEntities(player, enemies, bullets);

        // Update Bullets
        bullets.forEach(bullet => bullet.update());
        for (let i = bullets.length - 1; i >= 0; i--) {
            if (!bullets[i].alive) bullets.splice(i, 1);
        }

        // Check Bullet Collisions
        bullets.forEach(bullet => {
            if (!bullet.alive) return;

            const isLobbyMap = (typeof currentMapIndex !== 'undefined' && currentMapIndex === -1);

            // Single Player Collision
            if (gameMode === 'SINGLE' && player && player.alive) {
                const dist = Math.hypot(bullet.x - player.x, bullet.y - player.y);
                if (dist < player.radius + bullet.radius) {
                    const isBlueSupport = bullet.owner && (bullet.owner instanceof SupportTank) && bullet.owner.team === 'blue';
                    const isPlayerOwnUnbounced = (bullet.owner === player && !bullet.hasBounced);

                    if (!isBlueSupport && !isPlayerOwnUnbounced) {
                        bullet.alive = false;
                        player.alive = false;
                        createExplosion(player.x, player.y, true);
                    }
                }
            }

            // Co-op 2v2 Mode Bullet Collisions across all 4 Tanks
            if (gameMode === 'COOP') {
                Object.values(coopTanksMap).forEach(targetTank => {
                    if (!targetTank || !targetTank.alive) return;
                    const dist = Math.hypot(bullet.x - targetTank.x, bullet.y - targetTank.y);
                    if (dist < targetTank.radius + bullet.radius) {
                        const isUnbouncedOwn = (bullet.owner === targetTank && !bullet.hasBounced);

                        if (!isUnbouncedOwn) {
                            bullet.alive = false;

                            // BẮN ĐỒNG ĐỘI CÙNG PHE HOẶC SẢNH CHỜ: 0 SÁT THƯƠNG, CHỈ HIỆN TIA LỬA ĐIỆN!
                            const isSameTeam = bullet.owner && targetTank.team && (bullet.owner.team === targetTank.team);

                            if (isLobbyMap || isSameTeam) {
                                createSparks(targetTank.x, targetTank.y);
                            } else {
                                targetTank.alive = false;
                                createExplosion(targetTank.x, targetTank.y, true);
                                if (targetTank === player && typeof Multiplayer !== 'undefined') {
                                    Multiplayer.notifyDied();
                                }
                            }
                        }
                    }
                });
            }
        });

        // WIN / LOSE CONDITIONS CHECK (Single Player Mode Only)
        if (gameMode === 'SINGLE') {
            if (player && !player.alive) {
                updateHUD();
                setTimeout(() => showGameOver(false), 900);
            }
            else if (enemies.length > 0 && enemies.every(e => !e.alive)) {
                updateHUD();
                setTimeout(() => showGameOver(true), 900);
            }
        }

        particles.forEach(p => p.update());
        for (let i = particles.length - 1; i >= 0; i--) {
            if (particles[i].life <= 0) particles.splice(i, 1);
        }

        trackMarks.forEach(tm => tm.update());
        for (let i = trackMarks.length - 1; i >= 0; i--) {
            if (trackMarks[i].life <= 0) trackMarks.splice(i, 1);
        }

        updateHUD();
    }

    // Render Frame
    ctx.save();

    if (screenShakeTimer > 0 && !isPaused) {
        screenShakeTimer--;
        const shakeX = (Math.random() - 0.5) * screenShakeIntensity;
        const shakeY = (Math.random() - 0.5) * screenShakeIntensity;
        ctx.translate(shakeX, shakeY);
    }

    drawBackgroundAndWalls(ctx);

    particles.forEach(p => p.draw(ctx));
    bullets.forEach(bullet => bullet.draw(ctx));

    // Render Tanks
    if (gameMode === 'COOP') {
        Object.values(coopTanksMap).forEach(t => {
            if (t && t.alive) t.draw(ctx);
        });
    } else {
        if (player && player.alive) player.draw(ctx);
        enemies.forEach(enemy => {
            if (enemy.alive) enemy.draw(ctx);
        });
    }

    ctx.restore();

    requestAnimationFrame(gameLoop);
}

// KHỞI TẠO GAME CO-OP 4 NGƯỜI 2V2 & SPECTATOR
function initGameCoop(mapIdx = -1, mySlotIndex = 0, playersList = []) {
    gameMode = 'COOP';
    if (typeof homepageEngine !== 'undefined') homepageEngine.stop();
    buildMaze(mapIdx);
    const mapDef = getMapDefinition(currentMapIndex);

    particles.length = 0;
    trackMarks.length = 0;
    bullets.length = 0;
    isPaused = false;
    enemies.length = 0;
    coopTanksMap = {};
    player = null;
    remotePlayer = null;

    // Định nghĩa màu sắc cho 4 Slot
    const blueTeamColor1 = { primary: '#0284c7', primaryDark: '#0369a1', primaryLight: '#38bdf8', border: '#38bdf8', accent: '#facc15' }; // Slot 0 (Host Xanh)
    const blueTeamColor2 = { primary: '#06b6d4', primaryDark: '#0e7490', primaryLight: '#67e8f9', border: '#22d3ee', accent: '#facc15' }; // Slot 1 (Xanh 2)
    const redTeamColor1 = { primary: '#dc2626', primaryDark: '#991b1b', primaryLight: '#f87171', border: '#ef4444', accent: '#facc15' }; // Slot 2 (Đỏ 1)
    const redTeamColor2 = { primary: '#ea580c', primaryDark: '#9a3412', primaryLight: '#fb923c', border: '#f97316', accent: '#facc15' }; // Slot 3 (Đỏ 2)

    // Định nghĩa Màu sắc & Spawn linh hoạt dựa trên p.team và p.slotIndex (1v1 vs 2v2)
    const getTankColor = (p) => {
        if (p.team === 'red') {
            return (p.slotIndex === 3) ? redTeamColor2 : redTeamColor1;
        }
        return (p.slotIndex === 1) ? blueTeamColor2 : blueTeamColor1;
    };

    const getSpawnPos = (p) => {
        const slot = p.slotIndex;
        const team = p.team;
        if (currentMapIndex === -1) {
            // Sảnh chờ 4 Bức tường
            if (slot === 0) return { x: 250, y: 375 }; // Host Xanh (Bên Trái x: 250)
            if (team === 'red' && slot === 1) return { x: 950, y: 375 }; // 1v1 Guest Đỏ (Bên Phải x: 950)
            if (slot === 1) return { x: 350, y: 375 }; // 2v2 Blue 2 (Bên Trái x: 350)
            if (slot === 2) return { x: 850, y: 375 }; // 2v2 Red 1 (Bên Phải x: 850)
            return { x: 950, y: 375 }; // 2v2 Red 2 (Bên Phải x: 950)
        } else {
            // Map thi đấu
            if (slot === 0) return mapDef.playerSpawn;
            if (team === 'red' && slot === 1) return (mapDef.enemySpawns && mapDef.enemySpawns[0]) ? mapDef.enemySpawns[0] : { x: 950, y: 375 };
            if (slot === 1) return { x: mapDef.playerSpawn.x + 40, y: mapDef.playerSpawn.y };
            if (slot === 2) return (mapDef.enemySpawns && mapDef.enemySpawns[0]) ? mapDef.enemySpawns[0] : { x: 950, y: 375 };
            return (mapDef.enemySpawns && mapDef.enemySpawns[1]) ? mapDef.enemySpawns[1] : { x: 950, y: 450 };
        }
    };

    // Nếu chưa có danh sách từ server, tự tạo xe mặc định theo slot của mình
    if (!playersList || playersList.length === 0) {
        const defaultTeam = (mySlotIndex === 0 || mySlotIndex === 1) ? 'blue' : 'red';
        playersList = [{ slotIndex: mySlotIndex, team: defaultTeam }];
    }

    // Tạo xe cho từng người chơi có mặt trong danh sách
    playersList.forEach(p => {
        const slot = p.slotIndex;
        const spawn = getSpawnPos(p);
        const color = getTankColor(p);
        const isLocal = (slot === mySlotIndex && mySlotIndex !== -1);

        const tankObj = new Tank(spawn.x, spawn.y, color, isLocal);
        tankObj.team = p.team;
        tankObj.slotIndex = slot;
        tankObj.playerName = p.playerName || (typeof Multiplayer !== 'undefined' && isLocal ? Multiplayer.playerName : (p.team === 'red' ? 'Guest Đỏ' : (slot === 0 ? 'Host Xanh' : 'Xanh 2')));
        tankObj.isReady = p.isReady || false;

        coopTanksMap[slot] = tankObj;
        if (isLocal) {
            player = tankObj;
        }
    });

    killCount = 0;
    updateMapUI(mapDef);
    updateHUD();
    showGameElements();

    const gc = document.getElementById('gameCanvas');
    if (gc) {
        if (currentMapIndex === -1) {
            gc.classList.add('lobby-mode');
        } else {
            gc.classList.remove('lobby-mode');
        }
    }

    gameState = 'PLAYING';
}

function updateRemoteTankSync(data) {
    const targetTank = coopTanksMap[data.slotIndex];
    if (targetTank) {
        targetTank.x = data.x;
        targetTank.y = data.y;
        targetTank.angle = data.angle;
        targetTank.turretAngle = data.turretAngle;
        targetTank.hp = data.hp;
        targetTank.isSliding = data.isSliding;
        targetTank.isReady = data.isReady;
    }
}

function spawnRemoteBullet(bData) {
    const ownerTank = coopTanksMap[bData.slotIndex];
    if (ownerTank && typeof Bullet !== 'undefined') {
        const b = new Bullet(bData.x, bData.y, bData.angle, ownerTank, false, bData.speed);
        b.team = ownerTank.team;
        bullets.push(b);
        if (typeof audio !== 'undefined') audio.playShoot(false);
    }
}

function updateMapUI(mapDef) {
    const mapTitleEl = document.getElementById('hud-map-title');
    if (mapTitleEl) mapTitleEl.innerText = mapDef.name;
}

function updateHUD() {
    const playerBulletCount = player ? getActiveBulletsCount(player) : 0;
    document.getElementById('player-status').innerText = player && player.alive ? 'Sống' : 'Đã Tiêu Diệt';
    document.getElementById('enemy-count').innerText = enemies.filter(e => e.alive).length;
    document.getElementById('kill-count').innerText = killCount;
    document.getElementById('bullet-count').innerText = `${playerBulletCount} / 3`;
}

// Initial Setup
buildMaze(0);
updateMapUI(MAP_DEFINITIONS[0]);
gameLoop();
