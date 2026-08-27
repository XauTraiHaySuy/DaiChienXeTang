// --- PUBLIC/JS/MULTIPLAYER.JS - REAL-TIME 4-PLAYER 2V2 CO-OP & SPECTATOR CONTROLLER ---

const Multiplayer = {
    socket: null,
    roomCode: null,
    slotIndex: 0, // 0..3 (Hoặc -1 nếu là Khán giả Spectator)
    team: 'blue', // 'blue' | 'red' | 'spectator'
    isSpectator: false,
    status: 'IDLE', // 'IDLE' | 'LOBBY' | 'PLAYING'
    players: [],
    voteTurnSlot: 0,
    selectedMapIdx: 0,
    blueScore: 0,
    redScore: 0,
    isReady: false,
    selectedMaxPlayers: 4,
    maxPlayers: 4,
    pendingRoomCode: null,
    playerName: localStorage.getItem('coop_player_name') || '',

    getPlayerName(isMandatory = false) {
        const input = document.getElementById('coop-username-input');
        let name = input ? input.value.trim() : this.playerName;

        if (!name) {
            if (isMandatory) {
                if (input) {
                    input.style.borderColor = '#ef4444';
                    input.focus();
                }
                this.showNotice('Vui lòng nhập Tên Người Chơi để vào sảnh!', true);
                return null;
            } else {
                name = 'Host Xanh';
            }
        }

        if (name.length > 16) name = name.slice(0, 16);
        if (input && name !== 'Host Xanh') input.style.borderColor = '#38bdf8';
        localStorage.setItem('coop_player_name', name);
        this.playerName = name;
        return name;
    },

    selectCoopMode(maxPlayers) {
        this.selectedMaxPlayers = maxPlayers;
        document.getElementById('coop-mode-select-modal')?.classList.add('hidden');
        
        const coopModal = document.getElementById('coop-modal');
        if (coopModal) {
            coopModal.classList.remove('hidden');
            const card = coopModal.querySelector('.game-modal-card');
            if (card) {
                card.classList.remove('modal-pop-anim');
                void card.offsetWidth; // Trigger reflow to restart CSS animation
                card.classList.add('modal-pop-anim');
            }
        }
        document.getElementById('coop-modal-msg')?.classList.add('hidden');

        const titleEl = document.getElementById('coop-modal-title');
        const descEl = document.getElementById('coop-modal-subtitle');

        if (maxPlayers === 2) {
            if (titleEl) titleEl.innerText = 'CHẾ ĐỘ 1 VS 1';
            if (descEl) descEl.innerText = 'Thách đấu 1 vs 1 trên 2 máy khác nhau.';
        } else {
            if (titleEl) titleEl.innerText = 'CHẾ ĐỘ 2 VS 2';
            if (descEl) descEl.innerText = 'Thách đấu 2 vs 2 trên 4 máy khác nhau.';
        }

        const savedName = localStorage.getItem('coop_player_name');
        const nameInput = document.getElementById('coop-username-input');
        if (nameInput) {
            if (savedName && !nameInput.value) {
                nameInput.value = savedName;
            }
            nameInput.oninput = () => {
                if (nameInput.value.trim().length > 0) {
                    nameInput.style.borderColor = '#38bdf8';
                    document.getElementById('coop-modal-msg')?.classList.add('hidden');
                }
            };
        }
    },

    backToHomepage() {
        document.getElementById('coop-modal')?.classList.add('hidden');
        document.getElementById('coop-mode-select-modal')?.classList.add('hidden');
        document.getElementById('coop-modal-msg')?.classList.add('hidden');
        
        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            startScreen.classList.remove('hidden');
            startScreen.classList.remove('screen-fade-in');
            void startScreen.offsetWidth;
            startScreen.classList.add('screen-fade-in');
        }
    },

    init() {
        if (this.socket) return;
        this.socket = (typeof socket !== 'undefined' && socket) ? socket : io();

        // 1. Nhận thông tin phòng mới tạo (Host - Slot 0, Team Blue)
        this.socket.on('room-created', (data) => {
            this.roomCode = data.roomCode;
            this.slotIndex = data.slotIndex;
            this.team = data.team;
            this.maxPlayers = data.maxPlayers || 4;
            this.isSpectator = false;
            this.status = 'WAITING';
            this.players = data.players || [];
            this.voteTurnSlot = data.voteTurnSlot;
            this.selectedMapIdx = data.selectedMapIdx;
            this.blueScore = data.blueScore;
            this.redScore = data.redScore;

            const displayEl = document.getElementById('display-created-code');
            if (displayEl) displayEl.innerText = data.roomCode;

            document.getElementById('room-info-box')?.classList.remove('hidden');
            this.pendingCreatedNotice = true;
        });

        // 2. Gia nhập phòng thành công
        this.socket.on('room-joined', (data) => {
            const isMe = (this.socket && data.joinedPlayer && this.socket.id === data.joinedPlayer.socketId);
            this.roomCode = data.roomCode;
            this.players = data.players || [];
            this.maxPlayers = data.maxPlayers || 4;
            this.status = 'LOBBY';
            this.voteTurnSlot = data.voteTurnSlot;
            this.selectedMapIdx = data.selectedMapIdx;
            this.blueScore = data.blueScore;
            this.redScore = data.redScore;

            const myPlayer = this.players.find(p => p.socketId === this.socket.id);
            if (myPlayer) {
                this.slotIndex = myPlayer.slotIndex;
                this.team = myPlayer.team;
                this.isSpectator = false;
            }

            if (isMe) {
                this.showToast(`Bạn đã gia nhập phòng ${this.roomCode}!`, 'success');
            } else if (data.joinedPlayer) {
                const jp = data.joinedPlayer;
                const teamName = (jp.team === 'red') ? 'Xe tăng Đỏ' : 'Xe tăng Xanh';
                const name = jp.playerName || teamName;
                this.showToast(`${name} (${teamName}) đã gia nhập phòng!`, 'success');
            }

            this.updateCoopUI();
            this.enterLobbyMap();
        });

        // 2B. Xử lý khi Phòng Đang Diễn Ra (PLAYING): Mở Modal Khán Giả Xem Trận!
        this.socket.on('room-in-progress', (data) => {
            this.pendingRoomCode = data.roomCode;
            document.getElementById('coop-spectator-modal')?.classList.remove('hidden');
        });

        // 2C. Đã gia nhập phòng với tư cách Khán Giả Spectator!
        this.socket.on('spectator-joined', (data) => {
            this.roomCode = data.roomCode;
            this.players = data.players || [];
            this.status = 'PLAYING';
            this.isSpectator = true;
            this.slotIndex = -1;
            this.team = 'spectator';
            this.selectedMapIdx = data.selectedMapIdx;
            this.blueScore = data.blueScore;
            this.redScore = data.redScore;

            document.getElementById('coop-spectator-modal')?.classList.add('hidden');
            this.showNotice('Bạn đang XEM TRỰC TIẾP trận đấu! (Sẽ gia nhập thi đấu ván sau)', false);
            this.startMatchMap(this.selectedMapIdx);
        });

        // 3. Xử lý lỗi phòng
        this.socket.on('room-error', (msg) => {
            this.showNotice(msg, true);
        });

        // 4. Đồng bộ vị trí & trạng thái xe của các người chơi
        this.socket.on('player-synced', (data) => {
            if (typeof updateRemoteTankSync === 'function') {
                updateRemoteTankSync(data);
            }
        });

        // 5. Đồng bộ bắn đạn từ các người chơi
        this.socket.on('player-shot', (bData) => {
            if (typeof spawnRemoteBullet === 'function') {
                spawnRemoteBullet(bData);
            }
        });

        // 6. Đồng bộ khi thay đổi trạng thái Sẵn Sàng (Ready)
        this.socket.on('ready-state-changed', (data) => {
            this.players = data.players || [];
            const myPlayer = this.players.find(p => p.socketId === this.socket.id);
            if (myPlayer) {
                this.isReady = myPlayer.isReady;
                if (typeof player !== 'undefined' && player) player.isReady = this.isReady;
            }
            this.updateReadyButtonUI();
        });

        // 7. Đếm ngược 3s khi TẤT CẢ ĐÃ SẴN SÀNG!
        this.socket.on('both-ready-countdown', (data) => {
            const countdownOverlay = document.getElementById('coop-ready-countdown');
            const countdownNum = document.getElementById('coop-ready-countdown-num');
            if (countdownOverlay && countdownNum) {
                countdownOverlay.classList.remove('hidden');
                countdownNum.innerText = data.count;
            }
        });

        // 8. Mở Bảng Vote Map giữa màn hình
        this.socket.on('open-vote-modal', (data) => {
            document.getElementById('coop-ready-countdown')?.classList.add('hidden');
            document.getElementById('coop-vote-modal')?.classList.remove('hidden');
            this.voteTurnSlot = data.voteTurnSlot;
            this.updateVoteCardsUI();
        });

        // Đếm ngược 10s vote
        this.socket.on('vote-timer-tick', (data) => {
            const timerEl = document.getElementById('coop-vote-timer');
            if (timerEl) {
                timerEl.innerText = `${data.timeLeft}s`;
                if (data.timeLeft <= 3) {
                    timerEl.style.color = '#ef4444';
                    timerEl.style.borderColor = '#ef4444';
                } else {
                    timerEl.style.color = '#facc15';
                    timerEl.style.borderColor = '#facc15';
                }
            }
        });

        // 9. Đồng bộ chọn map chủ động
        this.socket.on('map-selected-user', (data) => {
            this.selectedMapIdx = data.selectedMapIdx;
            this.updateVoteCardsUI();

            const voterP = this.players.find(p => p.slotIndex === data.votedBySlot);
            const voterName = voterP ? voterP.roleName : `Slot ${data.votedBySlot + 1}`;
            const msgEl = document.getElementById('coop-vote-status-msg');
            if (msgEl) msgEl.innerText = `${voterName} đã chọn Map! Vào trận sau 3s...`;
        });

        this.socket.on('start-match-countdown', (data) => {
            const msgEl = document.getElementById('coop-vote-status-msg');
            if (msgEl) msgEl.innerText = `Chuẩn bị vào trận sau ${data.count}s...`;
        });

        // 10. Tự động chọn map ngẫu nhiên khi hết 10s
        this.socket.on('map-selected-auto-random', (data) => {
            this.selectedMapIdx = data.selectedMapIdx;
            this.updateVoteCardsUI();

            const card = document.getElementById(`vote-card-${data.selectedMapIdx}`);
            if (card) card.classList.add('blink-highlight');

            const msgEl = document.getElementById('coop-vote-status-msg');
            if (msgEl) msgEl.innerText = `Hết 10s! Hệ thống tự chọn ngẫu nhiên Map ${data.selectedMapIdx + 1}!`;
        });

        // 11. Đồng bộ khi ván đấu bắt đầu!
        this.socket.on('match-started', (data) => {
            this.status = 'PLAYING';
            this.selectedMapIdx = data.mapIdx;
            this.voteTurnSlot = data.voteTurnSlot;
            this.players = data.players || [];
            document.getElementById('coop-vote-modal')?.classList.add('hidden');
            document.querySelectorAll('.coop-vote-card').forEach(c => c.classList.remove('blink-highlight'));
            this.startMatchMap(this.selectedMapIdx);
        });

        // 12. Đồng bộ khi ván đấu kết thúc
        this.socket.on('match-ended', (data) => {
            this.status = 'LOBBY';
            this.blueScore = data.blueScore;
            this.redScore = data.redScore;
            this.voteTurnSlot = data.voteTurnSlot;
            this.players = data.players || [];
            this.isReady = false;

            // Nếu là Khán giả Spectator -> Giờ đã chuyển thành Người chơi chính thức!
            const myPlayer = this.players.find(p => p.socketId === this.socket.id);
            if (myPlayer) {
                this.slotIndex = myPlayer.slotIndex;
                this.team = myPlayer.team;
                this.isSpectator = false;
            }

            if (typeof player !== 'undefined' && player) player.isReady = false;

            const isWin = (data.winningTeam === this.team);
            const winnerText = isWin ? "PHE BẠN ĐÃ CHIẾN THẮNG!" : "PHE BẠN ĐÃ BỊ TIÊU DIỆT!";

            if (typeof audio !== 'undefined') {
                if (isWin) audio.playWinVoice();
                else audio.playLoseVoice();
            }

            this.showNotice(`${winnerText} Tỉ số: Xanh ${this.blueScore} - ${this.redScore} Đỏ`, !isWin);
            this.enterLobbyMap();
        });

        // 13. Đồng bộ khi có 1 người chơi rời phòng
        this.socket.on('player-left', (data) => {
            this.players = data.players || [];
            const teamName = (data.leftTeam === 'red') ? 'Xe tăng Đỏ' : 'Xe tăng Xanh';
            const name = data.playerName || teamName;

            if (data.is1v1 || this.maxPlayers === 2) {
                this.status = 'LOBBY';
                this.isReady = false;
                document.getElementById('coop-vote-modal')?.classList.add('hidden');
                document.getElementById('coop-ready-countdown')?.classList.add('hidden');
                this.showToast(`Đối thủ (${name}) đã rời khỏi phòng. Đã quay trở lại sảnh chờ!`, 'warning');
                this.enterLobbyMap();
            } else {
                this.showToast(`1 người chơi bên ${teamName} (${name}) đã rời khỏi phòng!`, 'warning');
                this.updateCoopUI();
                if (this.status === 'LOBBY') {
                    this.enterLobbyMap();
                }
            }
        });

        // 14. Đồng bộ khi Chủ phòng (Host - Slot 0) rời phòng -> Giải tán phòng
        this.socket.on('host-left', () => {
            this.showToast('Chủ phòng đã giải tán phòng!', 'error');
            this.resetToHomepage();
        });
    },

    showToast(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-item ${type}`;

        const icon = type === 'error' ? '🚪' : type === 'warning' ? '⚠️' : type === 'success' ? '🎉' : '📢';
        toast.innerHTML = `
            <span style="font-size: 1.3rem;">${icon}</span>
            <span style="flex: 1; word-break: break-word;">${msg}</span>
            <div class="toast-progress"></div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.35s ease-in forwards';
            setTimeout(() => {
                toast.remove();
            }, 350);
        }, 4000);
    },

    showNotice(msg, isError = false) {
        const msgEl = document.getElementById('coop-modal-msg');
        if (msgEl) {
            msgEl.innerText = msg;
            msgEl.style.background = isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)';
            msgEl.style.border = isError ? '1px solid #ef4444' : '1px solid #22c55e';
            msgEl.style.color = isError ? '#f87171' : '#4ade80';
            msgEl.classList.remove('hidden');

            setTimeout(() => {
                msgEl.classList.add('hidden');
            }, 3500);
        }
    },

    createRoom() {
        const name = this.getPlayerName(false);

        this.init();
        document.getElementById('room-info-box')?.classList.remove('hidden');
        if (this.socket) {
            this.socket.emit('create-room', {
                maxPlayers: this.selectedMaxPlayers || 4,
                playerName: name
            });
        }
    },

    refreshCode() {
        const name = this.getPlayerName(false);

        this.init();
        if (this.socket) {
            this.socket.emit('refresh-code', {
                maxPlayers: this.selectedMaxPlayers || 4,
                playerName: name
            });
        }
    },

    copyRoomCode() {
        const displayEl = document.getElementById('display-created-code');
        const code = displayEl ? displayEl.innerText.trim() : this.roomCode;
        if (code && code !== '------') {
            navigator.clipboard.writeText(code).then(() => {
                this.showNotice(`Đã sao chép mã phòng: ${code}`, false);
            }).catch(() => {
                this.showNotice(`Mã phòng của bạn: ${code}`, false);
            });
        }
    },

    joinRoom(code) {
        const name = this.getPlayerName(true);
        if (!name) return;

        if (!code || code.trim().length < 4) {
            this.showNotice('Vui lòng nhập mã phòng hợp lệ (VD: A8K2X9)!', true);
            return;
        }
        this.init();
        this.showNotice(`Đang kết nối vào phòng ${code.trim().toUpperCase()}...`, false);
        if (this.socket) {
            this.socket.emit('join-room', {
                roomCode: code.trim().toUpperCase(),
                preferredMaxPlayers: this.selectedMaxPlayers || 4,
                playerName: name
            });
        }
    },

    joinAsSpectator() {
        if (this.socket && this.pendingRoomCode) {
            this.socket.emit('join-as-spectator', this.pendingRoomCode);
        }
    },

    cancelSpectator() {
        document.getElementById('coop-spectator-modal')?.classList.add('hidden');
        this.pendingRoomCode = null;
    },

    toggleReady() {
        if (this.socket && !this.isSpectator) {
            this.socket.emit('player-ready');
        }
    },

    sendMove(tank) {
        if (this.socket && this.roomCode && tank && !this.isSpectator) {
            this.socket.emit('player-sync', {
                x: tank.x,
                y: tank.y,
                angle: tank.angle,
                turretAngle: tank.turretAngle,
                speed: tank.speed,
                hp: tank.hp,
                isSliding: tank.isSliding,
                isReady: tank.isReady || false
            });
        }
    },

    sendShoot(x, y, angle, speed) {
        if (this.socket && this.roomCode && !this.isSpectator) {
            this.socket.emit('player-shoot', {
                x: x,
                y: y,
                angle: angle,
                speed: speed,
                bulletId: Date.now() + Math.random()
            });
        }
    },

    voteMap(mapIdx) {
        if (this.isSpectator) {
            this.showNotice('Khán giả không thể chọn bản đồ!', true);
            return;
        }
        if (this.slotIndex !== this.voteTurnSlot) {
            this.showNotice('Chưa đến lượt bạn chọn bản đồ!', true);
            return;
        }
        this.selectedMapIdx = mapIdx;
        if (this.socket) {
            this.socket.emit('vote-map', { mapIdx: mapIdx });
        }
        this.updateVoteCardsUI();
    },

    notifyDied() {
        if (this.socket && this.status === 'PLAYING' && !this.isSpectator) {
            this.socket.emit('player-died', { victimSlot: this.slotIndex });
        }
    },

    enterLobbyMap() {
        const name = this.getPlayerName(true);
        if (!name) return;

        document.getElementById('hud')?.classList.add('hidden');
        document.getElementById('start-screen')?.classList.add('hidden');
        document.getElementById('coop-modal')?.classList.add('hidden');
        document.getElementById('coop-ready-btn')?.classList.remove('hidden');
        document.getElementById('lobby-vote-overlay')?.classList.remove('hidden');

        if (this.isSpectator) {
            document.getElementById('coop-ready-btn')?.classList.add('hidden');
        }

        const validPlayers = (this.players && this.players.length > 0)
            ? this.players
            : [{ slotIndex: this.slotIndex, team: this.team, playerName: name }];

        if (typeof initGameCoop === 'function') {
            initGameCoop(-1, this.slotIndex, validPlayers);
        }

        if (this.pendingCreatedNotice && this.roomCode) {
            this.showToast(`Tạo phòng thành công! Mã phòng: ${this.roomCode}`, 'success');
            this.pendingCreatedNotice = false;
        }

        this.updateCoopUI();
    },

    startMatchMap(mapIdx) {
        document.getElementById('hud')?.classList.add('hidden');
        document.getElementById('start-screen')?.classList.add('hidden');
        document.getElementById('coop-modal')?.classList.add('hidden');
        document.getElementById('coop-vote-modal')?.classList.add('hidden');
        document.getElementById('lobby-vote-overlay')?.classList.remove('hidden');
        document.getElementById('coop-ready-btn')?.classList.add('hidden');

        const validPlayers = (this.players && this.players.length > 0)
            ? this.players
            : [{ slotIndex: this.slotIndex, team: this.team }];

        if (typeof initGameCoop === 'function') {
            initGameCoop(mapIdx, this.slotIndex, validPlayers);
        }
    },

    updateCoopUI() {
        const roomCodeEl = document.getElementById('coop-room-code-display');
        const scoreEl = document.getElementById('coop-score-display');
        if (roomCodeEl) roomCodeEl.innerText = this.roomCode || '---';

        if (scoreEl) {
            if (this.maxPlayers === 2) {
                scoreEl.innerText = `Phe Xanh (Host): ${this.blueScore} - ${this.redScore} Phe Đỏ (Guest) (${this.players.length}/2 Người)`;
            } else {
                scoreEl.innerText = `Phe Xanh: ${this.blueScore} - ${this.redScore} Phe Đỏ (${this.players.length}/4 Người)`;
            }
        }

        this.updateReadyButtonUI();
        this.updateVoteCardsUI();
    },

    updateReadyButtonUI() {
        const readyBtn = document.getElementById('coop-ready-btn');
        if (readyBtn) {
            if (this.isSpectator) {
                readyBtn.classList.add('hidden');
                return;
            }
            readyBtn.classList.remove('hidden');
            if (this.isReady) {
                readyBtn.innerText = 'ĐÃ SẴN SÀNG';
                readyBtn.style.background = 'linear-gradient(135deg, #eab308, #ca8a04)';
                readyBtn.style.boxShadow = '0 0 10px rgba(234, 179, 8, 0.5)';
            } else {
                readyBtn.innerText = 'SẴN SÀNG';
                readyBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
                readyBtn.style.boxShadow = '0 0 10px rgba(34, 197, 94, 0.5)';
            }
        }
    },

    updateVoteCardsUI() {
        const isMyTurn = (!this.isSpectator && this.slotIndex === this.voteTurnSlot);
        const voterP = this.players.find(p => p.slotIndex === this.voteTurnSlot);
        const voterName = voterP ? (voterP.playerName || voterP.roleName) : `Slot ${this.voteTurnSlot + 1}`;
        const voterTeam = voterP ? voterP.team : ((this.maxPlayers === 2 ? this.voteTurnSlot === 0 : (this.voteTurnSlot === 0 || this.voteTurnSlot === 1)) ? 'blue' : 'red');

        const isBlue = (voterTeam === 'blue');
        const themeColor = isBlue ? '#38bdf8' : '#ef4444';
        const shadowRgba = isBlue ? 'rgba(56, 189, 248, 0.5)' : 'rgba(239, 68, 68, 0.5)';
        const textShadowRgba = isBlue ? 'rgba(56, 189, 248, 0.8)' : 'rgba(239, 68, 68, 0.8)';

        const modalCard = document.getElementById('coop-vote-card-modal');
        if (modalCard) {
            modalCard.style.borderColor = themeColor;
            modalCard.style.boxShadow = `0 0 50px ${shadowRgba}`;
        }

        const modalTitle = document.getElementById('coop-vote-title');
        if (modalTitle) {
            modalTitle.style.color = themeColor;
            modalTitle.style.textShadow = `0 0 20px ${textShadowRgba}`;
        }

        const turnEl = document.getElementById('coop-vote-turn-display');
        if (turnEl) {
            if (isMyTurn) {
                turnEl.innerHTML = 'LƯỢT BẠN CHỌN MAP!';
                turnEl.style.color = '#4ade80';
            } else {
                turnEl.innerHTML = `Đang chờ <strong style="color: ${themeColor}">${voterName}</strong> đang chọn map<span class="animated-dots"></span>`;
                turnEl.style.color = themeColor;
            }
        }

        const cards = document.querySelectorAll('.coop-vote-card');
        cards.forEach((card, idx) => {
            if (idx === this.selectedMapIdx) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    },

    confirmLeaveRoom() {
        const confirmTextEl = document.getElementById('coop-leave-confirm-text');
        if (confirmTextEl) {
            confirmTextEl.innerText = (this.slotIndex === 0 && !this.isSpectator)
                ? 'Bạn là Chủ phòng. Nếu rời phòng, phòng chơi sẽ bị giải tán hoàn toàn! Bạn có chắc chắn muốn rời phòng không?'
                : 'Bạn có chắc chắn muốn rời phòng không?';
        }
        document.getElementById('coop-leave-confirm-modal')?.classList.remove('hidden');
    },

    cancelLeaveRoom() {
        document.getElementById('coop-leave-confirm-modal')?.classList.add('hidden');
    },

    executeLeaveRoom() {
        document.getElementById('coop-leave-confirm-modal')?.classList.add('hidden');
        this.resetToHomepage();
    },

    resetToHomepage() {
        this.status = 'IDLE';
        this.roomCode = null;
        this.slotIndex = 0;
        this.team = 'blue';
        this.isSpectator = false;
        this.isReady = false;
        this.players = [];
        if (this.socket) {
            this.socket.emit('leave-room');
        }
        document.getElementById('room-info-box')?.classList.add('hidden');
        document.getElementById('coop-modal-msg')?.classList.add('hidden');
        document.getElementById('coop-modal')?.classList.add('hidden');
        document.getElementById('lobby-vote-overlay')?.classList.add('hidden');
        document.getElementById('coop-vote-modal')?.classList.add('hidden');
        document.getElementById('coop-ready-countdown')?.classList.add('hidden');
        document.getElementById('coop-leave-confirm-modal')?.classList.add('hidden');
        document.getElementById('coop-spectator-modal')?.classList.add('hidden');
        if (typeof returnToHomepage === 'function') {
            returnToHomepage();
        }
    }
};

window.Multiplayer = Multiplayer;

// Tự động khởi tạo kết nối Socket.io ngay khi trang vừa tải xong
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    Multiplayer.init();
} else {
    window.addEventListener('DOMContentLoaded', () => {
        Multiplayer.init();
    });
}
