const User = require('../models/User');

// Lấy danh sách Top người chơi điểm cao nhất
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await User.find()
      .select('username score kills deaths tankColor')
      .sort({ score: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
