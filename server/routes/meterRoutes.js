// meter-tracker/server/routes/meterRoutes.js
const express = require('express');
const router = express.Router();
const {
  addMeter,
  getAllMeters,
  getMeterById,
  updateMeter,
  setActiveGeneralMeter
} = require('../controllers/meterController');

router.route('/')
  .post(addMeter)
  .get(getAllMeters);

router.route('/:id')
  .get(getMeterById)
  .put(updateMeter);

router.route('/:id/set-active-general')
  .put(setActiveGeneralMeter);

module.exports = router;