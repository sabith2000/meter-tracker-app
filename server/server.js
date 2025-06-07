// meter-tracker/server/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

// Import routes
const slabRateRoutes = require('./routes/slabRateRoutes');
const meterRoutes = require('./routes/meterRoutes');
const billingCycleRoutes = require('./routes/billingCycleRoutes');
const readingRoutes = require('./routes/readingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const Meter = require('./models/Meter'); // Import the Meter model for our test

// Load environment variables from .env file
dotenv.config();

// Connect to Database
connectDB();

// Initialize the Express application
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Define API routes
app.use('/api/slabs', slabRateRoutes);
app.use('/api/meters', meterRoutes);
app.use('/api/billing-cycles', billingCycleRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
  });
}

// Define the port
const PORT = process.env.PORT || 5001;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // --- NEW CANARY TEST ---
  // This test runs 5 seconds after the server starts to check the database.
  setTimeout(async () => {
    try {
      console.log("-----------------------------------------");
      console.log("RUNNING CANARY TEST...");
      const meterCount = await Meter.countDocuments({});
      console.log(`CANARY TEST RESULT: Found ${meterCount} documents in the 'meters' collection.`);

      if (meterCount === 0) {
        console.log("CANARY WARNING: The meters collection appears to be empty according to the live server.");
      } else {
        console.log("CANARY SUCCESS: The server CAN see data in the meters collection.");
      }
      console.log("-----------------------------------------");

    } catch (err) {
      console.error("CANARY TEST FAILED with an error:", err);
      console.log("-----------------------------------------");
    }
  }, 5000); // Wait 5 seconds to ensure DB connection is fully established
  // --- END CANARY TEST ---
});