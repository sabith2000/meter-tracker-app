// meter-tracker/routes/billingCycleRoutes.js
const express = require('express');
const router = express.Router();
const {
  startNewBillingCycle,
  closeCurrentBillingCycle,
  getActiveBillingCycle,
  getAllBillingCycles,
  getBillingCycleById,
  updateBillingCycle
} = require('../controllers/billingCycleController');

router.route('/')
  .get(getAllBillingCycles); // Get all cycles

router.route('/start')
  .post(startNewBillingCycle); // Manually start a new cycle

router.route('/close-current')
  .post(closeCurrentBillingCycle); // Close current active and start new

router.route('/active')
  .get(getActiveBillingCycle); // Get the currently active cycle

router.route('/:id')
  .get(getBillingCycleById)    // Get specific cycle by ID
  .put(updateBillingCycle);    // Update specific cycle by ID

module.exports = router;