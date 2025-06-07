// meter-tracker/server/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path'); // Import the 'path' module

// Import routes
const slabRateRoutes = require('./routes/slabRateRoutes');
const meterRoutes = require('./routes/meterRoutes');
const billingCycleRoutes = require('./routes/billingCycleRoutes');
const readingRoutes = require('./routes/readingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

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

// --- NEW: SERVE FRONTEND IN PRODUCTION ---
if (process.env.NODE_ENV === 'production') {
  // Set static folder from the client's build output
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // Catch-all route to serve index.html for any non-API request
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
  });
}
// --- END OF NEW SECTION ---


// Define the port the server will listen on
const PORT = process.env.PORT || 5001;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});