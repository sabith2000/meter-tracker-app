// meter-tracker/server/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { getCycleSummary } = require('../controllers/analyticsController');

// Defines the route for our chart data
router.route('/cycle-summary')
    .get(getCycleSummary);

module.exports = router;