// meter-tracker/routes/readingRoutes.js
const express = require('express');
const router = express.Router();
const {
  addReading,
  getAllReadings,
  getReadingById,
  updateReading,
  deleteReading,
  deleteAllReadingsGlobally // ADD THIS IMPORT
} = require('../controllers/readingController');

router.route('/')
  .post(addReading)
  .get(getAllReadings);

// New route for deleting all readings globally
// Using a more specific path for dangerous operations is good practice
router.route('/action/delete-all-globally') // ADD THIS ROUTE
    .delete(deleteAllReadingsGlobally);

router.route('/:id')
  .get(getReadingById)
  .put(updateReading)
  .delete(deleteReading);


module.exports = router;