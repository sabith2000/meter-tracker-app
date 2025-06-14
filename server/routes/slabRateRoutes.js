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
    .get(getSlabRateConfigs)
    .post(addSlabRateConfig);

router.route('/active')
    .get(getActiveSlabRateConfig);

router.route('/:id/activate')
   .put(setActiveSlabRateConfig);

router.route('/:id')
   .delete(deleteSlabRateConfig);

module.exports = router;