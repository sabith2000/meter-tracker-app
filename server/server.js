// meter-tracker/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Import routes
const slabRateRoutes = require('./routes/slabRateRoutes');
const meterRoutes = require('./routes/meterRoutes');
const billingCycleRoutes = require('./routes/billingCycleRoutes');
const readingRoutes = require('./routes/readingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes'); // ADD THIS LINE

// Load environment variables from .env file
dotenv.config();

// Connect to Database
connectDB();

// Initialize the Express application
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Define main routes
app.get('/', (req, res) => {
  res.send('Hello from Meter Tracker API! Database connection initiated.');
});

app.use('/api/slabs', slabRateRoutes);
app.use('/api/meters', meterRoutes);
app.use('/api/billing-cycles', billingCycleRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/dashboard', dashboardRoutes); // ADD THIS LINE

// Define the port the server will listen on
const PORT = process.env.PORT || 5001;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});