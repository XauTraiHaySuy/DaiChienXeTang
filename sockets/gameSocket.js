// --- PHÒNG CHƠI & QUẢN LÝ REAL-TIME MULTIPLAYER (SOCKET.IO) ---
const players = {};

const initGameSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🎮 Có người chơi mới kết nối: ${socket.id}`);

    // Khởi tạo thông tin người chơi mới
    players[socket.id] = {
      id: socket.id,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      angle: 0,
      turretAngle: 0,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16)
    };

    // Gửi danh sách tất cả người chơi hiện tại cho người chơi mới
    socket.emit('current-players', players);

    // Thông báo cho các người chơi khác về người chơi mới vừa gia nhập
    socket.broadcast.emit('new-player', players[socket.id]);

    // Lắng nghe sự kiện di chuyển từ client và phát (broadcast) cho người chơi khác
    socket.on('player-move', (movementData) => {
      if (players[socket.id]) {
        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;
        players[socket.id].angle = movementData.angle;
        players[socket.id].turretAngle = movementData.turretAngle;

        // Broadcast ngay lập tức tọa độ mới cho các client khác
        socket.broadcast.emit('player-moved', players[socket.id]);
      }
    });

    // Xử lý khi người chơi ngắt kết nối
    socket.on('disconnect', () => {
      console.log(`❌ Người chơi ngắt kết nối: ${socket.id}`);
      delete players[socket.id];
      io.emit('player-disconnected', socket.id);
    });
  });
};

module.exports = initGameSocket;
