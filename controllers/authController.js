const User = require('../models/User');

// Đăng ký người chơi mới
exports.register = async (req, res) => {
  try {
    const { username, password, tankColor } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ username và password.' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Tên người dùng đã tồn tại.' });
    }

    const user = await User.create({
      username,
      password,
      tankColor: tankColor || '#3b82f6'
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      data: {
        id: user._id,
        username: user.username,
        tankColor: user.tankColor,
        score: user.score
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Đăng nhập người chơi
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên người dùng và mật khẩu.' });
    }

    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        id: user._id,
        username: user.username,
        tankColor: user.tankColor,
        score: user.score,
        kills: user.kills,
        deaths: user.deaths
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy thông tin cá nhân
exports.getProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người chơi.' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
