// meter-tracker/models/SlabRateConfig.js
const mongoose = require('mongoose');

// Define the structure for individual slabs
const slabSchema = new mongoose.Schema({
  fromUnit: { type: Number, required: true }, // Inclusive start of the unit range
  toUnit: { type: Number, required: true },   // Inclusive end of the unit range (can be Infinity for the last slab)
  rate: { type: Number, required: true }      // Cost per unit for this slab
}, { _id: false }); // _id: false because these are subdocuments

const slabRateConfigSchema = new mongoose.Schema({
  configName: { // e.g., "Rates from July 2024", "Default Rates"
    type: String,
    required: true,
    unique: true
  },
  effectiveDate: { // Date when these rates become effective
    type: Date,
    default: Date.now
  },
  isCurrentlyActive: { // To mark if this configuration is the one to use
    type: Boolean,
    default: false
  },
  // Slabs for consumption <= 500 units
  slabsLessThanOrEqual500: [slabSchema],
  // Slabs for consumption > 500 units
  slabsGreaterThan500: [slabSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to apply slabs and calculate cost for a given consumption
// This is an example of how you might structure the calculation logic later.
// We will refine this and place it appropriately in controllers/services.
slabRateConfigSchema.methods.calculateCost = function(consumedUnits) {
  let cost = 0;
  let remainingUnits = consumedUnits;

  const applicableSlabs = consumedUnits <= 500 ? this.slabsLessThanOrEqual500 : this.slabsGreaterThan500;

  // Sort slabs by fromUnit to ensure correct processing order
  const sortedSlabs = [...applicableSlabs].sort((a, b) => a.fromUnit - b.fromUnit);

  for (const slab of sortedSlabs) {
    if (remainingUnits <= 0) break;

    // Units billable in this slab
    // The logic here assumes 'fromUnit' is the start of the slab range (e.g., 1, 101, 201)
    // and 'toUnit' is the end (e.g., 100, 200, 400)
    // The calculation for units in slab needs to be precise:
    // e.g., if consumedUnits = 350
    // Slab 1 (1-100): unitsInSlab = min(350, 100) - (1-1) = 100
    // Slab 2 (101-200): unitsInSlab = min(350, 200) - (101-1) = 100
    // Slab 3 (201-400): unitsInSlab = min(350, 400) - (201-1) = 150

    // A simpler way for marginal calculation:
    // Determine units applicable at this slab's rate.
    // Consider consumed units relative to the slab's boundaries.
    let unitsInThisSlab = 0;
    if (consumedUnits > (slab.fromUnit -1) ) { // If consumption reaches this slab
       unitsInThisSlab = Math.min(consumedUnits, slab.toUnit) - (slab.fromUnit - 1);
       unitsInThisSlab = Math.max(0, unitsInThisSlab); // Ensure it's not negative
    }

    // Cost for this slab part
    // This part needs correction. The `unitsInThisSlab` above is trying to count all units up to a point.
    // Let's use a running total of units processed.
  }

  // Corrected Cost Calculation Logic (to be implemented in the controller/service)
  // The cost calculation logic is complex and better handled in a dedicated service/controller function
  // rather than directly as a simple Mongoose method for this initial setup.
  // For now, this method is a placeholder to show where it *could* go.
  // We will implement the precise calculation logic based on your provided rules
  // when we build the API endpoints that use it.

  console.warn("calculateCost method in SlabRateConfig model is a placeholder and needs full implementation.");
  return { cost: "Not yet calculated", details: "Implementation pending" };
};


module.exports = mongoose.model('SlabRateConfig', slabRateConfigSchema);