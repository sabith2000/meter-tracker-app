// meter-tracker/server/routes/slabRateRoutes.js
const express = require('express');
const router = express.Router();
const {
    addSlabRateConfig,
    getSlabRateConfigs,
    getActiveSlabRateConfig,
    setActiveSlabRateConfig,
    deleteSlabRateConfig // Import the new controller function
} = require('../controllers/slabRateController');

router.route('/')
    .post(addSlabRateConfig)
    .get(getSlabRateConfigs);

router.route('/active')
    .get(getActiveSlabRateConfig);

router.route('/:id/activate')
   .put(setActiveSlabRateConfig);

// --- NEW ROUTE for Deleting ---
router.route('/:id')
   .delete(deleteSlabRateConfig); // Add this line for DELETE request to /api/slabs/:id

module.exports = router;