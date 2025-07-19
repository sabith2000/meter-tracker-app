// track-my-watts/server/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { getCycleSummary, getMeterBreakdownByCycle } = require('../controllers/analyticsController');

// Existing route for the first chart
router.route('/cycle-summary')
    .get(getCycleSummary);

// --- NEW ROUTE ADDED ---
// Route for our new stacked bar chart data
router.route('/meter-breakdown')
    .get(getMeterBreakdownByCycle);

module.exports = router;