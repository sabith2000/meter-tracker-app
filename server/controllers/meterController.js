// meter-tracker/controllers/meterController.js
const Meter = require('../models/Meter');

// @desc    Add a new meter
// @route   POST /api/meters
// @access  Public (for now)
exports.addMeter = async (req, res) => {
  try {
    const { name, meterType, isGeneralPurpose, description, isCurrentlyActiveGeneral } = req.body;

    if (!name || !meterType) {
      return res.status(400).json({ message: 'Meter name and type are required.' });
    }
    if (isGeneralPurpose === undefined) { // Explicitly check for undefined
        return res.status(400).json({ message: 'isGeneralPurpose field is required (true or false).' });
    }

    const newMeter = new Meter({
      name,
      meterType,
      isGeneralPurpose,
      description,
      isCurrentlyActiveGeneral: isGeneralPurpose ? (isCurrentlyActiveGeneral || false) : false // Only active if general purpose
    });

    const savedMeter = await newMeter.save();
    res.status(201).json(savedMeter);
  } catch (error) {
    console.error('Error adding meter:', error);
    if (error.code === 11000) { // Duplicate key error for name
      return res.status(400).json({ message: 'Meter name already exists.' });
    }
    res.status(500).json({ message: 'Server error while adding meter.' });
  }
};

// @desc    Get all meters
// @route   GET /api/meters
// @access  Public
exports.getAllMeters = async (req, res) => {
  try {
    const meters = await Meter.find().sort({ createdAt: 1 }); // Sort by creation order
    res.status(200).json(meters);
  } catch (error) {
    console.error('Error fetching meters:', error);
    res.status(500).json({ message: 'Server error while fetching meters.' });
  }
};

// @desc    Get a single meter by ID
// @route   GET /api/meters/:id
// @access  Public
exports.getMeterById = async (req, res) => {
  try {
    const meter = await Meter.findById(req.params.id);
    if (!meter) {
      return res.status(404).json({ message: 'Meter not found.' });
    }
    res.status(200).json(meter);
  } catch (error) {
    console.error('Error fetching meter by ID:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// @desc    Update a meter
// @route   PUT /api/meters/:id
// @access  Public
exports.updateMeter = async (req, res) => {
    try {
        const { name, meterType, description, isGeneralPurpose } = req.body;
        // Note: isCurrentlyActiveGeneral is handled by a separate endpoint for clarity

        const meter = await Meter.findById(req.params.id);
        if (!meter) {
            return res.status(404).json({ message: 'Meter not found.' });
        }

        // Update fields if they are provided in the request body
        if (name) meter.name = name;
        if (meterType) meter.meterType = meterType;
        if (description !== undefined) meter.description = description; // Allow empty string
        if (isGeneralPurpose !== undefined) {
            meter.isGeneralPurpose = isGeneralPurpose;
            // If it's no longer a general purpose meter, it cannot be the active general meter
            if (!isGeneralPurpose) {
                meter.isCurrentlyActiveGeneral = false;
            }
        }

        const updatedMeter = await meter.save();
        res.status(200).json(updatedMeter);
    } catch (error) {
        console.error('Error updating meter:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Meter name already exists for another meter.' });
        }
        res.status(500).json({ message: 'Server error while updating meter.' });
    }
};


// @desc    Set a general purpose meter as the active one
// @route   PUT /api/meters/:id/set-active-general
// @access  Public
exports.setActiveGeneralMeter = async (req, res) => {
  try {
    const meterToActivate = await Meter.findById(req.params.id);

    if (!meterToActivate) {
      return res.status(404).json({ message: 'Meter not found.' });
    }

    if (!meterToActivate.isGeneralPurpose) {
      return res.status(400).json({ message: 'This meter is not a general purpose meter and cannot be set as active general.' });
    }

    // The pre-save hook in Meter.js will handle deactivating others if this is set to true
    meterToActivate.isCurrentlyActiveGeneral = true;
    await meterToActivate.save();

    // Fetch all meters to show the updated state (optional, or just return the activated meter)
    // const allMeters = await Meter.find();
    // res.status(200).json(allMeters);
    res.status(200).json(meterToActivate);

  } catch (error) {
    console.error('Error setting active general meter:', error);
    res.status(500).json({ message: 'Server error while setting active general meter.' });
  }
};