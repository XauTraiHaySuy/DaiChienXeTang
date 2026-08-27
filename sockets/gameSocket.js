// --- PHÒNG CHƠI & QUẢN LÝ REAL-TIME MULTIPLAYER (SOCKET.IO) FOR 2-PLAYER & 4-PLAYER MODE ---
const rooms = {};

// Hàm tạo mã phòng 6 ký tự viết hoa ngẫu nhiên
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms[code] ? generateRoomCode() : code;
}

// Bộ đếm ngược 10s trong Bảng Vote Map giữa màn hình
function startVoteTimer(io, room) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }

  room.voteTimer = 10;
  io.to(room.code).emit('vote-timer-tick', { timeLeft: room.voteTimer });

  room.timerInterval = setInterval(() => {
    if (!rooms[room.code] || room.status === 'PLAYING') {
      if (room.timerInterval) clearInterval(room.timerInterval);
      room.timerInterval = null;
      return;
    }

    room.voteTimer--;
    io.to(room.code).emit('vote-timer-tick', { timeLeft: room.voteTimer });

    if (room.voteTimer <= 0) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;

      // Hết 10s: Tự động chọn map ngẫu nhiên (0, 1, 2)
      room.selectedMapIdx = Math.floor(Math.random() * 3);

      console.log(`⏰ Hết 10s vote! Hệ thống tự động chọn Map ${room.selectedMapIdx + 1} cho phòng ${room.code}`);

      io.to(room.code).emit('map-selected-auto-random', {
        selectedMapIdx: room.selectedMapIdx
      });

      setTimeout(() => {
        if (!rooms[room.code]) return;
        room.status = 'PLAYING';
        room.players.forEach(p => { p.isReady = false; p.isAlive = true; });

        io.to(room.code).emit('match-started', {
          mapIdx: room.selectedMapIdx,
          voteTurnSlot: getVoteTurnSlot(room),
          players: room.players,
          maxPlayers: room.maxPlayers
        });
      }, 1000);
    }
  }, 1000);
}

function getVoteTurnSlot(room) {
  if (!room.players || room.players.length === 0) return 0;
  const currentP = room.players[room.voteTurnIndex % room.players.length];
  return currentP ? currentP.slotIndex : 0;
}

const initGameSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🎮 Kết nối Socket mới: ${socket.id}`);

    // 1. TẠO PHÒNG MỚI (Host - Slot 0, Team Blue)
    socket.on('create-room', (data) => {
      const maxPlayers = (data && data.maxPlayers === 2) ? 2 : 4;
      const playerName = (data && data.playerName) ? data.playerName.trim() : 'Xe Tăng Host';
      const code = generateRoomCode();
      const hostPlayer = {
        socketId: socket.id,
        slotIndex: 0,
        team: 'blue',
        playerName: playerName,
        roleName: (maxPlayers === 2) ? 'Host (Xe Xanh)' : 'Host (Xe Xanh 1)',
        isReady: false,
        isAlive: true
      };

      rooms[code] = {
        code: code,
        maxPlayers: maxPlayers,
        hostSocketId: socket.id,
        players: [hostPlayer],
        spectators: [],
        status: 'LOBBY',
        voteTurnIndex: 0,
        selectedMapIdx: 0,
        blueScore: 0,
        redScore: 0,
        voteTimer: 10,
        timerInterval: null
      };

      socket.roomCode = code;
      socket.slotIndex = 0;
      socket.team = 'blue';
      socket.playerName = playerName;
      socket.isSpectator = false;
      socket.join(code);

      console.log(`🏡 Phòng mới ${maxPlayers} người được tạo: ${code} bởi Host ${playerName} (${socket.id})`);

      socket.emit('room-created', {
        roomCode: code,
        maxPlayers: maxPlayers,
        slotIndex: 0,
        team: 'blue',
        playerName: playerName,
        players: rooms[code].players,
        voteTurnSlot: 0,
        selectedMapIdx: 0,
        blueScore: 0,
        redScore: 0
      });
    });

    // REFRESH MÃ PHÒNG MỚI
    socket.on('refresh-code', (data) => {
      const oldCode = socket.roomCode;
      const maxPlayers = (oldCode && rooms[oldCode]) ? rooms[oldCode].maxPlayers : ((data && data.maxPlayers === 2) ? 2 : 4);
      const playerName = (data && data.playerName) ? data.playerName.trim() : (socket.playerName || 'Xe Tăng Host');

      if (oldCode && rooms[oldCode]) {
        delete rooms[oldCode];
      }

      const newCode = generateRoomCode();
      const hostPlayer = {
        socketId: socket.id,
        slotIndex: 0,
        team: 'blue',
        playerName: playerName,
        roleName: (maxPlayers === 2) ? 'Host (Xe Xanh)' : 'Host (Xe Xanh 1)',
        isReady: false,
        isAlive: true
      };

      rooms[newCode] = {
        code: newCode,
        maxPlayers: maxPlayers,
        hostSocketId: socket.id,
        players: [hostPlayer],
        spectators: [],
        status: 'LOBBY',
        voteTurnIndex: 0,
        selectedMapIdx: 0,
        blueScore: 0,
        redScore: 0,
        voteTimer: 10,
        timerInterval: null
      };

      socket.roomCode = newCode;
      socket.slotIndex = 0;
      socket.team = 'blue';
      socket.playerName = playerName;
      socket.isSpectator = false;
      if (oldCode) socket.leave(oldCode);
      socket.join(newCode);

      console.log(`🔄 Host đổi mã phòng mới: ${newCode} (${maxPlayers} người)`);

      socket.emit('room-created', {
        roomCode: newCode,
        maxPlayers: maxPlayers,
        slotIndex: 0,
        team: 'blue',
        playerName: playerName,
        players: rooms[newCode].players,
        voteTurnSlot: 0,
        selectedMapIdx: 0,
        blueScore: 0,
        redScore: 0
      });
    });

    // 2. THAM GIA PHÒNG
    socket.on('join-room', (inputData) => {
      const code = (typeof inputData === 'string' ? inputData : (inputData ? inputData.roomCode : '')).trim().toUpperCase();
      const playerName = (typeof inputData === 'object' && inputData.playerName) ? inputData.playerName.trim() : 'Xe Tăng Player';
      const room = rooms[code];

      if (!room) {
        return socket.emit('room-error', 'Mã phòng không tồn tại! Vui lòng kiểm tra lại.');
      }

      if (room.status === 'PLAYING') {
        return socket.emit('room-in-progress', { roomCode: code });
      }

      const maxLimit = room.maxPlayers || 4;
      if (room.players.length >= maxLimit) {
        return socket.emit('room-error', `Phòng này đã đầy (Tối đa ${maxLimit} người chơi)!`);
      }

      const usedSlots = room.players.map(p => p.slotIndex);
      let nextSlot = 0;

      if (maxLimit === 2) {
        nextSlot = usedSlots.includes(0) ? 1 : 0;
      } else {
        for (let i = 0; i < 4; i++) {
          if (!usedSlots.includes(i)) {
            nextSlot = i;
            break;
          }
        }
      }

      const team = (maxLimit === 2)
        ? (nextSlot === 0 ? 'blue' : 'red')
        : ((nextSlot === 0 || nextSlot === 1) ? 'blue' : 'red');

      const roleName = (maxLimit === 2)
        ? (nextSlot === 0 ? 'Host (Xe Xanh)' : 'Guest (Xe Đỏ)')
        : (nextSlot === 0 ? 'Host (Xe Xanh 1)' :
           nextSlot === 1 ? 'Đồng Đội (Xe Xanh 2)' :
           nextSlot === 2 ? 'Đối Thủ (Xe Đỏ 1)' : 'Đối Thủ (Xe Đỏ 2)');

      const newPlayer = {
        socketId: socket.id,
        slotIndex: nextSlot,
        team: team,
        playerName: playerName,
        roleName: roleName,
        isReady: false,
        isAlive: true
      };

      room.players.push(newPlayer);
      socket.roomCode = code;
      socket.slotIndex = nextSlot;
      socket.team = team;
      socket.playerName = playerName;
      socket.isSpectator = false;
      socket.join(code);

      console.log(`🤝 Người chơi ${playerName} (Slot ${nextSlot}, Phe ${team}) đã vào phòng ${code} (${maxLimit} người)`);

      io.to(code).emit('room-joined', {
        roomCode: code,
        maxPlayers: room.maxPlayers,
        joinedPlayer: newPlayer,
        players: room.players,
        voteTurnSlot: getVoteTurnSlot(room),
        selectedMapIdx: room.selectedMapIdx,
        blueScore: room.blueScore,
        redScore: room.redScore
      });
    });

    // 2B. THAM GIA VỚI TƯ CÁCH KHÁN GIẢ (SPECTATOR) KHI TRẬN ĐANG ĐẤU
    socket.on('join-as-spectator', (inputCode) => {
      const code = (inputCode || '').trim().toUpperCase();
      const room = rooms[code];

      if (!room) {
        return socket.emit('room-error', 'Mã phòng không tồn tại!');
      }

      socket.roomCode = code;
      socket.isSpectator = true;
      socket.slotIndex = -1;
      socket.team = 'spectator';
      socket.join(code);

      if (!room.spectators.includes(socket.id)) {
        room.spectators.push(socket.id);
      }

      console.log(`👁️ Khán giả ${socket.id} đã vào xem trực tiếp phòng ${code}`);

      socket.emit('spectator-joined', {
        roomCode: code,
        maxPlayers: room.maxPlayers,
        players: room.players,
        selectedMapIdx: room.selectedMapIdx,
        blueScore: room.blueScore,
        redScore: room.redScore
      });
    });

    // TOGGLE TRẠNG THÁI SẴN SÀNG IN LOBBY
    socket.on('player-ready', () => {
      const room = rooms[socket.roomCode];
      if (!room || socket.isSpectator) return;

      const p = room.players.find(pl => pl.socketId === socket.id);
      if (p) {
        p.isReady = !p.isReady;
      }

      io.to(room.code).emit('ready-state-changed', {
        players: room.players
      });

      const activePlayers = room.players;
      const minRequired = 2;
      const allReady = (activePlayers.length >= minRequired) && activePlayers.every(pl => pl.isReady);

      if (allReady) {
        console.log(`✅ Tất cả ${activePlayers.length} người chơi phòng ${room.code} đã SẴN SÀNG! Đếm ngược 3s...`);

        let count = 3;
        io.to(room.code).emit('both-ready-countdown', { count: count });

        const readyInterval = setInterval(() => {
          count--;
          if (count > 0) {
            io.to(room.code).emit('both-ready-countdown', { count: count });
          } else {
            clearInterval(readyInterval);
            io.to(room.code).emit('open-vote-modal', {
              voteTurnSlot: getVoteTurnSlot(room),
              players: room.players
            });
            startVoteTimer(io, room);
          }
        }, 1000);
      }
    });

    // 3. ĐỒNG BỘ DI CHUYỂN & NÒNG PHÁO REAL-TIME
    socket.on('player-sync', (data) => {
      if (socket.roomCode && !socket.isSpectator) {
        socket.to(socket.roomCode).emit('player-synced', {
          slotIndex: socket.slotIndex,
          team: socket.team,
          x: data.x,
          y: data.y,
          angle: data.angle,
          turretAngle: data.turretAngle,
          speed: data.speed,
          hp: data.hp,
          isSliding: data.isSliding,
          isReady: data.isReady
        });
      }
    });

    // 4. ĐỒNG BỘ BẮN ĐẠN REAL-TIME
    socket.on('player-shoot', (bulletData) => {
      if (socket.roomCode && !socket.isSpectator) {
        socket.to(socket.roomCode).emit('player-shot', {
          slotIndex: socket.slotIndex,
          team: socket.team,
          x: bulletData.x,
          y: bulletData.y,
          angle: bulletData.angle,
          speed: bulletData.speed,
          bulletId: bulletData.bulletId
        });
      }
    });

    // 5. ĐỒNG BỘ VOTE MAP KHI CHỌN CHỦ ĐỘNG
    socket.on('vote-map', (data) => {
      const room = rooms[socket.roomCode];
      if (!room || socket.isSpectator) return;

      const currentTurnSlot = getVoteTurnSlot(room);
      if (socket.slotIndex !== currentTurnSlot) {
        return socket.emit('room-error', 'Chưa đến lượt bạn chọn bản đồ!');
      }

      if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
      }

      room.selectedMapIdx = data.mapIdx;
      console.log(`🗺️ Slot ${socket.slotIndex} đã chọn Map ${data.mapIdx + 1}. Vào ván sau 3s!`);

      io.to(room.code).emit('map-selected-user', {
        selectedMapIdx: room.selectedMapIdx,
        votedBySlot: socket.slotIndex
      });

      let count = 3;
      io.to(room.code).emit('start-match-countdown', { count: count });

      const startInterval = setInterval(() => {
        count--;
        if (count > 0) {
          io.to(room.code).emit('start-match-countdown', { count: count });
        } else {
          clearInterval(startInterval);
          room.status = 'PLAYING';
          room.players.forEach(p => { p.isReady = false; p.isAlive = true; });

          io.to(room.code).emit('match-started', {
            mapIdx: room.selectedMapIdx,
            voteTurnSlot: getVoteTurnSlot(room),
            players: room.players,
            maxPlayers: room.maxPlayers
          });
        }
      }, 1000);
    });

    // 7. XỬ LÝ KHI 1 XE TĂNG BỊ TIÊU DIỆT (Thắng thua Phe Xanh vs Phe Đỏ)
    socket.on('player-died', (data) => {
      const room = rooms[socket.roomCode];
      if (!room || room.status !== 'PLAYING') return;

      const victimSlot = data.victimSlot;
      const victimP = room.players.find(p => p.slotIndex === victimSlot);
      if (victimP) {
        victimP.isAlive = false;
      }

      const blueAlive = room.players.filter(p => p.team === 'blue' && p.isAlive).length;
      const redAlive = room.players.filter(p => p.team === 'red' && p.isAlive).length;

      if (blueAlive === 0 || redAlive === 0) {
        const winningTeam = (blueAlive > 0) ? 'blue' : 'red';
        if (winningTeam === 'blue') room.blueScore++;
        else room.redScore++;

        room.voteTurnIndex++;
        room.status = 'LOBBY';
        room.players.forEach(p => { p.isReady = false; p.isAlive = true; });

        const maxLimit = room.maxPlayers || 4;
        if (room.spectators.length > 0 && room.players.length < maxLimit) {
          for (let i = room.spectators.length - 1; i >= 0; i--) {
            if (room.players.length >= maxLimit) break;
            const specId = room.spectators[i];
            const specSocket = io.sockets.sockets.get(specId);
            if (specSocket) {
              const usedSlots = room.players.map(p => p.slotIndex);
              let nextSlot = 0;
              for (let s = 0; s < maxLimit; s++) {
                if (!usedSlots.includes(s)) { nextSlot = s; break; }
              }
              const team = (maxLimit === 2) ? (nextSlot === 0 ? 'blue' : 'red') : ((nextSlot === 0 || nextSlot === 1) ? 'blue' : 'red');
              const roleName = (maxLimit === 2)
                ? (nextSlot === 0 ? 'Host (Xe Xanh)' : 'Guest (Xe Đỏ)')
                : (nextSlot === 0 ? 'Host (Xe Xanh 1)' : nextSlot === 1 ? 'Đồng Đội (Xe Xanh 2)' : nextSlot === 2 ? 'Đối Thủ (Xe Đỏ 1)' : 'Đối Thủ (Xe Đỏ 2)');

              const newPlayer = {
                socketId: specId,
                slotIndex: nextSlot,
                team: team,
                playerName: specSocket.playerName || 'Khán Giả',
                roleName: roleName,
                isReady: false,
                isAlive: true
              };

              room.players.push(newPlayer);
              specSocket.slotIndex = nextSlot;
              specSocket.team = team;
              specSocket.isSpectator = false;
              room.spectators.splice(i, 1);

              console.log(`🎉 Khán giả ${specId} đã được gia nhập thành người chơi chính thức (Slot ${nextSlot})!`);
            }
          }
        }

        console.log(`🏆 Ván đấu phòng ${room.code} kết thúc! Phe thắng: ${winningTeam.toUpperCase()}. Tỉ số Xanh ${room.blueScore} - ${room.redScore} Đỏ`);

        io.to(room.code).emit('match-ended', {
          winningTeam: winningTeam,
          blueScore: room.blueScore,
          redScore: room.redScore,
          voteTurnSlot: getVoteTurnSlot(room),
          players: room.players,
          maxPlayers: room.maxPlayers
        });
      }
    });

    // 8. RỜI PHÒNG & NGẮT KẾT NỐI
    const handleLeave = () => {
      const code = socket.roomCode;
      if (code && rooms[code]) {
        const room = rooms[code];

        if (socket.isSpectator) {
          room.spectators = room.spectators.filter(id => id !== socket.id);
          return;
        }

        if (socket.slotIndex === 0) {
          if (room.timerInterval) clearInterval(room.timerInterval);
          socket.to(code).emit('host-left');
          delete rooms[code];
          console.log(`🚪 Chủ phòng Host đã out. Phòng ${code} đã được xóa!`);
        } else {
          const leftPlayer = room.players.find(p => p.socketId === socket.id);
          const leftTeam = leftPlayer ? leftPlayer.team : socket.team;
          const playerName = leftPlayer ? leftPlayer.playerName : (socket.playerName || 'Người chơi');

          room.players = room.players.filter(p => p.socketId !== socket.id);
          if (room.timerInterval) {
            clearInterval(room.timerInterval);
            room.timerInterval = null;
          }

          const is1v1 = (room.maxPlayers === 2);
          if (is1v1) {
            room.status = 'LOBBY';
            room.players.forEach(p => { p.isReady = false; p.isAlive = true; });
          }

          socket.to(code).emit('player-left', {
            leftSlot: socket.slotIndex,
            leftTeam: leftTeam,
            playerName: playerName,
            players: room.players,
            is1v1: is1v1
          });
          console.log(`🚪 Người chơi ${playerName} (Slot ${socket.slotIndex}, Phe ${leftTeam}) đã out phòng ${code}. Phòng còn ${room.players.length} người!`);
        }
      }
    };

    socket.on('leave-room', handleLeave);
    socket.on('disconnect', handleLeave);
  });
};

module.exports = initGameSocket;
