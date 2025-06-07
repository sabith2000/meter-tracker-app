// meter-tracker/models/BillingCycle.js
const mongoose = require('mongoose');

const billingCycleSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: [true, 'Start date of the billing cycle is required.'],
    default: Date.now // Default to now, but will usually be set explicitly
  },
  endDate: { // Set when the government officer collects readings
    type: Date,
    default: null // Null until the cycle is officially closed
  },
  governmentCollectionDate: { // The actual date officer collected readings
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  // We might store a snapshot of the active slab rates ID here for historical accuracy
  // slabRateConfigId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'SlabRateConfig',
  //   required: false // Or true if we always want to link it
  // },
  notes: { // Optional notes for the cycle
    type: String,
    trim: true
  },
  // Summary fields that could be populated when closing a cycle (optional optimization)
  // totalUnitsConsumedMeter1: { type: Number, default: 0 },
  // totalUnitsConsumedMeter2: { type: Number, default: 0 },
  // totalUnitsConsumedMeter3: { type: Number, default: 0 },
  // totalCostMeter1: { type: Number, default: 0 },
  // totalCostMeter2: { type: Number, default: 0 },
  // totalCostMeter3: { type: Number, default: 0 },
  // grandTotalCost: { type: Number, default: 0 },
}, { timestamps: true }); // timestamps will add createdAt and updatedAt

// Middleware to ensure only one 'active' billing cycle exists
billingCycleSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'active') {
    // If a new cycle is being created as 'active',
    // ensure all other cycles are 'closed'.
    // This is a simple approach. A more robust one might be needed
    // if cycles can be created in the past or future out of order.
    // For this app's logic (one active cycle at a time, new one starts when old one closes),
    // this should mostly be handled by the "close cycle" endpoint logic.
    // However, this provides a basic safeguard.
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, status: 'active' },
      { $set: { status: 'closed' } } // Or handle this more gracefully
    );
  }
  next();
});

module.exports = mongoose.model('BillingCycle', billingCycleSchema);