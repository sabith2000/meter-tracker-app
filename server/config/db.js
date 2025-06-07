// meter-tracker/config/db.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables (if not already loaded by server.js, good for standalone scripts too)
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      // These options are good defaults but might change with Mongoose versions
      // Mongoose 6+ generally doesn't require these explicitly
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;