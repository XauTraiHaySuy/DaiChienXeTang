const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3
    },
    password: {
      type: String,
      required: true,
      minlength: 4
    },
    tankColor: {
      type: String,
      default: '#3b82f6'
    },
    score: {
      type: Number,
      default: 0
    },
    kills: {
      type: Number,
      default: 0
    },
    deaths: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
