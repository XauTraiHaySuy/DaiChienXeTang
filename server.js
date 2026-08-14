require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const connectDB = require('./config/db');
const initGameSocket = require('./sockets/gameSocket');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- 1. KẾT NỐI DATABASE MONGODB ---
connectDB();

// --- 2. MIDDLEWARE PARSE DỮ LIỆU ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 3. ĐĂNG KÝ CÁC TUYẾN ĐƯỜNG REST API ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));

// --- 4. PHỤC VỤ TỆP TĨNH FRONTEND ---
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 5. KHỞI TẠO REAL-TIME MULTIPLAYER GAME SOCKET ---
initGameSocket(io);

// --- 6. KHỞI ĐỘNG SERVER ---
const PORT = (process.env.PORT && Number(process.env.PORT) >= 1000) ? process.env.PORT : 3000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Cổng ${PORT} đang được sử dụng bởi một tiến trình khác!`);
    console.error(`👉 Vui lòng tắt server cũ hoặc sử dụng lệnh giải phóng cổng ${PORT}.`);
  } else {
    console.error('❌ Lỗi Server:', err);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
