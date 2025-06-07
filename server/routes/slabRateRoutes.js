// meter-tracker/server/routes/slabRateRoutes.js
const express = require('express');
const router = express.Router();
const {
    addSlabRateConfig,
    getSlabRateConfigs,
    getActiveSlabRateConfig,
    setActiveSlabRateConfig,
    deleteSlabRateConfig
} = require('../controllers/slabRateController');

router.route('/')
    .post(addSlabRateConfig)
    .get(getSlabRateConfigs);

router.route('/active')
    .get(getActiveSlabRateConfig);

// Route for activating a specific slab config
router.route('/:id/activate')
   .put(setActiveSlabRateConfig);

// Route for deleting a specific slab config
router.route('/:id')
   .delete(deleteSlabRateConfig);

module.exports = router;