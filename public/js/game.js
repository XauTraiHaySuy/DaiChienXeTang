// js/game.js - Core Game Loop with No Friendly Fire for Red Team & A* Pathfinding

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player = null;
let enemies = [];
let keys = {};
let mousePos = { x: 0, y: 0 };
let killCount = 0;
let gameState = 'START'; // 'START', 'PLAYING', 'GAMEOVER', 'WIN'
let isPaused = false;

// Key Listeners
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;

    if (key === 'p' && gameState === 'PLAYING') {
        togglePause();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mousePos.x = (e.clientX - rect.left) * scaleX;
    mousePos.y = (e.clientY - rect.top) * scaleY;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0 && gameState === 'PLAYING' && !isPaused && player && player.alive) {
        audio.init();
        player.shoot();
    }
});

// Sound Toggle Button
const soundBtn = document.getElementById('sound-toggle');
soundBtn.addEventListener('click', () => {
    audio.init();
    audio.muted = !audio.muted;
    soundBtn.innerText = audio.muted ? '🔇 Âm thanh: TẮT' : '🔊 Âm thanh: BẬT';
});

// Pause Toggle Button
const pauseBtn = document.getElementById('pause-toggle');
if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
        if (gameState === 'PLAYING') {
            togglePause();
        }
    });
}

function togglePause() {
    isPaused = !isPaused;
    audio.playPause();
    const pauseScreen = document.getElementById('pause-screen');
    if (pauseScreen) {
        if (isPaused) pauseScreen.classList.remove('hidden');
        else pauseScreen.classList.add('hidden');
    }
}

// Change Map Button
const mapBtn = document.getElementById('change-map-btn');
if (mapBtn) {
    mapBtn.addEventListener('click', () => {
        if (gameState !== 'PLAYING') {
            audio.init();
            initGame((currentMapIndex + 1) % MAP_DEFINITIONS.length);
        }
    });
}

// Start / Restart Controls & Map Roulette Wheel Animation
function triggerMapRoulette(onComplete) {
    const modal = document.getElementById('map-roulette-modal');
    const strip = document.getElementById('roulette-strip');

    if (!modal || !strip) {
        if (onComplete) onComplete(0);
        return;
    }

    // Hide other screens & show roulette modal
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.add('hidden');
    modal.classList.remove('hidden');

    // Build strip: repeat MAP_DEFINITIONS 14 times for smooth long scrolling
    strip.innerHTML = '';
    strip.style.transition = 'none';
    strip.style.transform = 'translateX(0px)';

    const totalRepeats = 14;
    const cards = [];

    for (let r = 0; r < totalRepeats; r++) {
        MAP_DEFINITIONS.forEach((mapDef, idx) => {
            const card = document.createElement('div');
            card.className = 'roulette-card';
            card.innerHTML = `
                <h4>${mapDef.name}</h4>
                <p>${mapDef.desc}</p>
            `;
            strip.appendChild(card);
            cards.push({ card, mapIdx: idx });
        });
    }

    // Randomly select winning map index
    const winningMapIdx = Math.floor(Math.random() * MAP_DEFINITIONS.length);
    const targetCardIndex = (totalRepeats - 3) * MAP_DEFINITIONS.length + winningMapIdx;

    const cardWidth = 200;
    const cardGap = 20;
    const cardSpacing = cardWidth + cardGap; // 220px

    // Center card inside 800px track (track center is 400px)
    const targetTranslateX = -(targetCardIndex * cardSpacing + (cardWidth / 2) - 400);

    // Force reflow
    void strip.offsetWidth;

    // 3-Second Spin Animation (Cubic Bezier Easing)
    strip.style.transition = 'transform 3.0s cubic-bezier(0.1, 0.85, 0.25, 1.0)';
    strip.style.transform = `translateX(${targetTranslateX}px)`;

    // Finish Spin after 3000ms
    setTimeout(() => {
        // Highlight winner card inside center frame
        if (cards[targetCardIndex]) {
            cards[targetCardIndex].card.classList.add('winner');
        }

        audio.playWinVoice();

        // Auto-launch into game after 1000ms (1 second) delay so player clearly sees chosen map
        setTimeout(() => {
            modal.classList.add('hidden');
            if (onComplete) onComplete(winningMapIdx);
        }, 1000);
    }, 3000);
}

function showGameElements() {
    const gc = document.getElementById('gameCanvas');
    const hud = document.getElementById('hud');
    const controls = document.querySelector('.controls-bar');
    if (gc) gc.classList.remove('hidden');
    if (hud) hud.classList.remove('hidden');
    if (controls) controls.classList.remove('hidden');
}

function hideGameElements() {
    const gc = document.getElementById('gameCanvas');
    const hud = document.getElementById('hud');
    const controls = document.querySelector('.controls-bar');
    if (gc) gc.classList.add('hidden');
    if (hud) hud.classList.add('hidden');
    if (controls) controls.classList.add('hidden');
}

document.getElementById('start-btn').addEventListener('click', () => {
    audio.init();
    if (typeof homepageEngine !== 'undefined') homepageEngine.stop();
    document.getElementById('start-screen').classList.add('hidden');
    showGameElements();
    initGame();
    gameState = 'PLAYING';
    isPaused = false;
    updateMapButtonState();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    audio.init();
    if (typeof homepageEngine !== 'undefined') homepageEngine.stop();
    triggerMapRoulette((selectedMapIdx) => {
        showGameElements();
        initGame(selectedMapIdx);
        gameState = 'PLAYING';
        isPaused = false;
        updateMapButtonState();
    });
});

// Function to return to Homepage
function returnToHomepage() {
    gameState = 'START';
    isPaused = false;
    hideGameElements();
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('map-roulette-modal').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
    if (typeof homepageEngine !== 'undefined') homepageEngine.start();
    updateMapButtonState();
}

const homeBtn = document.getElementById('home-btn');
if (homeBtn) {
    homeBtn.addEventListener('click', returnToHomepage);
}

const overHomeBtn = document.getElementById('over-home-btn');
if (overHomeBtn) {
    overHomeBtn.addEventListener('click', returnToHomepage);
}

function updateMapButtonState() {
    if (mapBtn) {
        if (gameState === 'PLAYING') {
            mapBtn.disabled = true;
            mapBtn.style.opacity = '0.5';
            mapBtn.style.cursor = 'not-allowed';
            mapBtn.title = 'Không thể đổi bản đồ khi đang thi đấu';
        } else {
            mapBtn.disabled = false;
            mapBtn.style.opacity = '1';
            mapBtn.style.cursor = 'pointer';
            mapBtn.title = '';
        }
    }
}

function initGame(mapIdx = null) {
    buildMaze(mapIdx);
    const mapDef = MAP_DEFINITIONS[currentMapIndex];

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

    // Enemy Tanks (Phe Đỏ - Red)
    enemies = mapDef.enemySpawns.map(sp => new EnemyTank(sp.x, sp.y));

    killCount = 0;
    updateMapUI(mapDef);
    updateHUD();
    updateMapButtonState();
}

function updateMapUI(mapDef) {
    const mapTitleEl = document.getElementById('hud-map-title');
    if (mapTitleEl) mapTitleEl.innerText = mapDef.name;

    const startMapName = document.getElementById('start-map-name');
    const startMapDesc = document.getElementById('start-map-desc');
    const startMapPro = document.getElementById('start-map-pro');
    const startMapCon = document.getElementById('start-map-con');

    if (startMapName) startMapName.innerText = mapDef.name;
    if (startMapDesc) startMapDesc.innerText = mapDef.desc;
    if (startMapPro) startMapPro.innerText = mapDef.pro;
    if (startMapCon) startMapCon.innerText = mapDef.con;
}

function updateHUD() {
    const playerBulletCount = player ? getActiveBulletsCount(player) : 0;
    document.getElementById('player-status').innerText = player && player.alive ? 'Sống' : 'Đã Tiêu Diệt';
    document.getElementById('enemy-count').innerText = enemies.filter(e => e.alive).length;
    document.getElementById('kill-count').innerText = killCount;
    document.getElementById('bullet-count').innerText = `${playerBulletCount} / 3`;
}

function showGameOver(isWin) {
    if (gameState === 'GAMEOVER' || gameState === 'WIN') return;
    gameState = isWin ? 'WIN' : 'GAMEOVER';

    const screen = document.getElementById('game-over-screen');
    const title = document.getElementById('game-over-title');
    const msg = document.getElementById('game-over-msg');
    document.getElementById('final-kills').innerText = killCount;

    if (isWin) {
        title.innerText = 'CHIẾN THẮNG!';
        title.className = 'win-title';
        msg.innerText = `Phe Xanh xuất sắc tiêu diệt toàn bộ Phe Đỏ!`;
        audio.playWinVoice();
    } else {
        title.innerText = 'THẤT BẠI!';
        title.className = 'lose-title';
        msg.innerText = 'Xe tăng Phe Xanh đã bị tiêu diệt!';
    }

    screen.classList.remove('hidden');
    updateMapButtonState();
}

// Core Game Loop
function gameLoop() {
    if (gameState === 'START') {
        requestAnimationFrame(gameLoop);
        return;
    }

    if (gameState === 'PLAYING' && !isPaused) {
        if (player) player.update();

        // Player Movement (WASD)
        if (player && player.alive) {
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
            }

            player.turretAngle = Math.atan2(mousePos.y - player.y, mousePos.x - player.x);
        }

        // Update Enemies AI (Pass allEnemies for mutual separation)
        enemies.forEach(enemy => enemy.update(player, bullets, enemies));

        // Update Special Map Entities
        updateMapEntities(player, enemies, bullets);

        // Update Bullets
        bullets.forEach(bullet => bullet.update());
        for (let i = bullets.length - 1; i >= 0; i--) {
            if (!bullets[i].alive) bullets.splice(i, 1);
        }

        // Check Bullet Collisions
        bullets.forEach(bullet => {
            if (!bullet.alive) return;

            // Player (Phe Xanh) can be killed by enemy bullets or red support tank bullets
            if (player && player.alive) {
                const dist = Math.hypot(bullet.x - player.x, bullet.y - player.y);
                if (dist < player.radius + bullet.radius) {
                    const isBlueSupport = bullet.owner && (bullet.owner instanceof SupportTank) && bullet.owner.team === 'blue';
                    const isPlayerOwnBullet = bullet.owner === player && !bullet.hasBounced && bullet.life > bullet.maxLife - 5;

                    if (!isBlueSupport && !isPlayerOwnBullet) {
                        bullet.alive = false;
                        player.alive = false;
                        createExplosion(player.x, player.y, true);
                    }
                }
            }

            // Red Tanks (Phe Đỏ) destroyed by Player, Bounced Red Bullets, or Blue Support Tank
            enemies.forEach(enemy => {
                if (enemy.alive) {
                    const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
                    if (dist < enemy.radius + bullet.radius) {
                        const isPlayerBullet = bullet.owner && bullet.owner.isPlayer;
                        const isBouncedRedBullet = bullet.owner && !bullet.owner.isPlayer && bullet.hasBounced && !(bullet.owner instanceof SupportTank);
                        const isBlueSupportBullet = bullet.owner && (bullet.owner instanceof SupportTank) && bullet.owner.team === 'blue';

                        if (isPlayerBullet || isBouncedRedBullet || isBlueSupportBullet) {
                            bullet.alive = false;
                            enemy.alive = false;
                            killCount++;
                            createExplosion(enemy.x, enemy.y, true);
                        }
                    }
                }
            });

            // Giant Purple Support Tank Collision (Requires 2 Bullet Hits to Destroy!)
            supportTanks.forEach(st => {
                if (st.alive && !st.isLanding && !st.isCalibrating) {
                    const dist = Math.hypot(bullet.x - st.x, bullet.y - st.y);
                    if (dist < st.radius + bullet.radius) {
                        let isDamaged = false;
                        if (st.team === 'blue') {
                            // Blue support tank hit by Red bullets
                            if (bullet.owner && !bullet.owner.isPlayer && bullet.owner !== st) {
                                isDamaged = true;
                            }
                        } else if (st.team === 'red') {
                            // Red support tank hit by Player bullets or Blue support bullets
                            if ((bullet.owner && bullet.owner.isPlayer) || (bullet.owner && (bullet.owner instanceof SupportTank) && bullet.owner.team === 'blue')) {
                                isDamaged = true;
                            }
                        }

                        if (isDamaged) {
                            bullet.alive = false;
                            st.hp--;
                            createSparks(st.x, st.y);
                            if (st.hp <= 0) {
                                st.alive = false;
                                if (st.team === 'red' && bullet.owner && bullet.owner.isPlayer) killCount++;
                                createExplosion(st.x, st.y, true);
                            }
                        }
                    }
                }
            });
        });

        // WIN / LOSE CONDITIONS CHECK
        if (player && !player.alive) {
            updateHUD();
            setTimeout(() => showGameOver(false), 900);
        } 
        else if (enemies.length > 0 && enemies.every(e => !e.alive)) {
            updateHUD();
            setTimeout(() => showGameOver(true), 900);
        }

        // Update Particles & Track Marks
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
    if (player) player.draw(ctx);
    enemies.forEach(enemy => enemy.draw(ctx));
    bullets.forEach(bullet => bullet.draw(ctx));

    ctx.restore();

    requestAnimationFrame(gameLoop);
}

// Initial Setup
buildMaze(0);
updateMapUI(MAP_DEFINITIONS[0]);
gameLoop();
