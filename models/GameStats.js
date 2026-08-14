const mongoose = require('mongoose');

const gameStatsSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    playerName: {
      type: String,
      required: true
    },
    highScore: {
      type: Number,
      default: 0
    },
    totalKills: {
      type: Number,
      default: 0
    },
    matchesPlayed: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('GameStats', gameStatsSchema);
