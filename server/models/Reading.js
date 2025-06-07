// meter-tracker/models/Reading.js
const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
  meter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meter', // Reference to the Meter model
    required: [true, 'Meter ID is required.']
  },
  billingCycle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BillingCycle', // Reference to the BillingCycle model
    required: [true, 'Billing cycle ID is required.']
  },
  date: { // Date and time the reading was taken
    type: Date,
    required: [true, 'Date of reading is required.'],
    default: Date.now
  },
  readingValue: { // The actual value from the meter (e.g., kWh)
    type: Number,
    required: [true, 'Meter reading value is required.'],
    min: [0, 'Reading value cannot be negative.'] // Basic validation
  },
  unitsConsumedSincePrevious: {
    // Calculated: currentReading.readingValue - previousReadingForThisMeter.readingValue
    // For the very first reading of a meter in the system, this will be 0.
    type: Number,
    required: true,
    default: 0
  },
  isEstimated: { // In case a reading is an estimate
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true }); // Adds createdAt and updatedAt

// Ensure a meter cannot have two readings on the exact same millisecond (optional, but good for data integrity)
// readingSchema.index({ meter: 1, date: 1 }, { unique: true });
// Note: A compound index for uniqueness on meter+date might be too restrictive if user wants to correct a reading
// by deleting and re-adding for the same date. Let's omit it for now for flexibility.

module.exports = mongoose.model('Reading', readingSchema);