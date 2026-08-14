const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      console.warn('⚠️ MONGO_URI chưa được cấu hình trong tệp .env');
      return;
    }
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`✅ Kết nối MongoDB Atlas thành công: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Lỗi kết nối MongoDB: ${error.message}`);
  }
};

module.exports = connectDB;
