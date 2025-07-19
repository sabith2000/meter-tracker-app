// track-my-watts/server/models/Settings.js
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Using a unique key to ensure we only ever have one settings document
  key: {
    type: String,
    default: 'user_settings',
    unique: true
  },
  consumptionTarget: {
    type: Number,
    required: [true, 'Consumption target is required.'],
    min: [1, 'Consumption target must be a positive number.'],
    default: 500 // Default to 500 if not set
  }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingsSchema);