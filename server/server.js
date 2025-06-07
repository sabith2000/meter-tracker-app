// meter-tracker/server/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

// --- START OF DEBUGGING ---
console.log("Server script starting...");

console.log("Loading routes...");

// Load routes one by one with logs in between
console.log("Loading: slabRateRoutes");
const slabRateRoutes = require('./routes/slabRateRoutes');

console.log("Loading: meterRoutes");
const meterRoutes = require('./routes/meterRoutes');

console.log("Loading: billingCycleRoutes");
const billingCycleRoutes = require('./routes/billingCycleRoutes');

console.log("Loading: readingRoutes");
const readingRoutes = require('./routes/readingRoutes');

console.log("Loading: dashboardRoutes");
const dashboardRoutes = require('./routes/dashboardRoutes');

console.log("All routes loaded successfully.");
// --- END OF DEBUGGING ---


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
console.log("Applying routes to Express app...");
app.use('/api/slabs', slabRateRoutes);
app.use('/api/meters', meterRoutes);
app.use('/api/billing-cycles', billingCycleRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/dashboard', dashboardRoutes);
console.log("Routes applied.");

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
  console.log("Production environment detected. Setting up static file serving.");
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
  });
  console.log("Static file serving configured.");
}

// Define the port
const PORT = process.env.PORT || 5001;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});