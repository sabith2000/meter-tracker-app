// meter-tracker/server/routes/readingRoutes.js
const express = require('express');
const router = express.Router();
const {
  addReading,
  getAllReadings,
  getReadingById,
  updateReading,
  deleteReading,
  deleteAllReadingsGlobally
} = require('../controllers/readingController');

router.route('/')
  .post(addReading)
  .get(getAllReadings);

router.route('/action/delete-all-globally')
    .delete(deleteAllReadingsGlobally);

router.route('/:id')
  .get(getReadingById)
  .put(updateReading)
  .delete(deleteReading);

module.exports = router;