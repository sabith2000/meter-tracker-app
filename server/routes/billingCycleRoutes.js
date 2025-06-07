// meter-tracker/server/routes/billingCycleRoutes.js
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
  .get(getAllBillingCycles);

router.route('/start')
  .post(startNewBillingCycle);

router.route('/close-current')
  .post(closeCurrentBillingCycle);

router.route('/active')
  .get(getActiveBillingCycle);

router.route('/:id')
  .get(getBillingCycleById)
  .put(updateBillingCycle);

module.exports = router;