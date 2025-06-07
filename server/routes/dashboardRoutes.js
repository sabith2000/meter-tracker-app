// meter-tracker/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboardController');

router.route('/summary')
    .get(getDashboardSummary);

module.exports = router;