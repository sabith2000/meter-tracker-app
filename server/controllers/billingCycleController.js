// meter-tracker/controllers/billingCycleController.js
const BillingCycle = require('../models/BillingCycle');
const Reading = require('../models/Reading');
const SlabRateConfig = require('../models/SlabRateConfig'); // Needed for slab rate snapshot

// @desc    Start a new billing cycle (manually, or called when an old one closes)
// @route   POST /api/billing-cycles/start
// @access  Public
exports.startNewBillingCycle = async (req, res) => {
  try {
    const { startDate, notes } = req.body;

    if (!startDate) {
      return res.status(400).json({ message: 'Start date is required.' });
    }

    // Ensure no other cycle is currently active before starting a new one.
    // The "closeCurrentBillingCycle" endpoint is the preferred way to manage this transition.
    const existingActiveCycle = await BillingCycle.findOne({ status: 'active' });
    if (existingActiveCycle) {
      return res.status(400).json({
        message: `An active billing cycle (ID: ${existingActiveCycle._id}) already exists starting ${existingActiveCycle.startDate}. Please close it before starting a new one.`,
      });
    }

    // Optionally, find the currently active slab rate config to associate
    // const activeSlabConfig = await SlabRateConfig.findOne({ isCurrentlyActive: true });
    // let slabRateConfigId = activeSlabConfig ? activeSlabConfig._id : null;

    const newCycle = new BillingCycle({
      startDate,
      notes,
      status: 'active',
      // slabRateConfigId // Store if you want to snapshot the rates used for this cycle
    });

    const savedCycle = await newCycle.save();
    res.status(201).json(savedCycle);
  } catch (error) {
    console.error('Error starting new billing cycle:', error);
    res.status(500).json({ message: 'Server error while starting new billing cycle.' });
  }
};

// @desc    Close the current active billing cycle and start a new one
// @route   POST /api/billing-cycles/close-current
// @access  Public
exports.closeCurrentBillingCycle = async (req, res) => {
  try {
    const { governmentCollectionDate, notesForClosedCycle, notesForNewCycle } = req.body;

    if (!governmentCollectionDate) {
      return res.status(400).json({ message: 'Government collection date is required to close a cycle.' });
    }

    const collectionDate = new Date(governmentCollectionDate);

    const currentActiveCycle = await BillingCycle.findOne({ status: 'active' });

    if (!currentActiveCycle) {
      return res.status(404).json({ message: 'No active billing cycle found to close.' });
    }

    if (collectionDate < currentActiveCycle.startDate) {
        return res.status(400).json({ message: 'Government collection date cannot be before the active cycle\'s start date.' });
    }

    // Close the current cycle
    currentActiveCycle.endDate = collectionDate;
    currentActiveCycle.governmentCollectionDate = collectionDate;
    currentActiveCycle.status = 'closed';
    if (notesForClosedCycle) currentActiveCycle.notes = notesForClosedCycle;
    // Here you would typically trigger calculation of final consumption and costs for this cycle.
    // For now, we just save it. Calculation will be done when fetching readings.
    await currentActiveCycle.save();

    // Start a new billing cycle
    // The new cycle starts on the day the old one was collected
    const newCycleStartDate = collectionDate;

    const newCycle = new BillingCycle({
      startDate: newCycleStartDate,
      status: 'active',
      notes: notesForNewCycle || 'New cycle started automatically.'
    });
    const savedNewCycle = await newCycle.save();

    res.status(200).json({
      message: 'Billing cycle closed and new one started successfully.',
      closedCycle: currentActiveCycle,
      newActiveCycle: savedNewCycle,
    });
  } catch (error) {
    console.error('Error closing current billing cycle:', error);
    res.status(500).json({ message: 'Server error while closing billing cycle.' });
  }
};

// @desc    Get the current active billing cycle
// @route   GET /api/billing-cycles/active
// @access  Public
exports.getActiveBillingCycle = async (req, res) => {
  try {
    const activeCycle = await BillingCycle.findOne({ status: 'active' });
    if (!activeCycle) {
      // If no active cycle, maybe offer to create one or return appropriate status
      // For now, let's prompt the user to create one if none exists.
      const totalCycles = await BillingCycle.countDocuments();
      if (totalCycles === 0) {
         return res.status(404).json({ message: 'No billing cycles found. Please start the first billing cycle.' });
      }
      return res.status(404).json({ message: 'No active billing cycle found. Please ensure a cycle is marked active or start a new one after closing the previous.' });
    }
    res.status(200).json(activeCycle);
  } catch (error) {
    console.error('Error fetching active billing cycle:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// @desc    Get all billing cycles (paginated or sorted)
// @route   GET /api/billing-cycles
// @access  Public
exports.getAllBillingCycles = async (req, res) => {
  try {
    const cycles = await BillingCycle.find().sort({ startDate: -1 }); // Show newest first
    res.status(200).json(cycles);
  } catch (error) {
    console.error('Error fetching all billing cycles:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// @desc    Get a single billing cycle by ID
// @route   GET /api/billing-cycles/:id
// @access  Public
exports.getBillingCycleById = async (req, res) => {
    try {
        const cycle = await BillingCycle.findById(req.params.id);
        if (!cycle) {
            return res.status(404).json({ message: 'Billing cycle not found.' });
        }
        res.status(200).json(cycle);
    } catch (error) {
        console.error('Error fetching billing cycle by ID:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// @desc    Update a billing cycle (e.g., notes, or correcting dates if needed, carefully)
// @route   PUT /api/billing-cycles/:id
// @access  Public
exports.updateBillingCycle = async (req, res) => {
    try {
        const { startDate, endDate, governmentCollectionDate, notes, status } = req.body;
        const cycleId = req.params.id;

        const cycle = await BillingCycle.findById(cycleId);
        if (!cycle) {
            return res.status(404).json({ message: 'Billing cycle not found.' });
        }

        // Basic validation: endDate should not be before startDate
        if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({ message: 'End date cannot be before start date.' });
        }
        if (endDate && cycle.startDate && new Date(endDate) < new Date(cycle.startDate)) {
             return res.status(400).json({ message: 'End date cannot be before cycle\'s start date.' });
        }
         if (startDate && cycle.endDate && new Date(cycle.endDate) < new Date(startDate)) {
             return res.status(400).json({ message: 'Start date cannot be after cycle\'s end date.' });
        }


        // If trying to set this cycle to 'active', ensure no other cycle is active
        if (status === 'active' && cycle.status !== 'active') {
            const existingActive = await BillingCycle.findOne({ status: 'active', _id: { $ne: cycleId } });
            if (existingActive) {
                return res.status(400).json({ message: `Another cycle (ID: ${existingActive._id}) is already active. Cannot set this one to active.` });
            }
        }

        // Update fields
        if (startDate) cycle.startDate = startDate;
        if (endDate !== undefined) cycle.endDate = endDate; // Allow null
        if (governmentCollectionDate !== undefined) cycle.governmentCollectionDate = governmentCollectionDate; // Allow null
        if (notes !== undefined) cycle.notes = notes;
        if (status) cycle.status = status;

        const updatedCycle = await cycle.save();
        res.status(200).json(updatedCycle);

    } catch (error) {
        console.error('Error updating billing cycle:', error);
        res.status(500).json({ message: 'Server error while updating billing cycle.' });
    }
};

exports.deleteBillingCycle = async (req, res) => {
  try {
    const cycleId = req.params.id;
    const cycleToDelete = await BillingCycle.findById(cycleId);

    if (!cycleToDelete) {
      return res.status(404).json({ message: 'Billing cycle not found.' });
    }

    // IMPORTANT: Check for associated readings before deleting
    const associatedReadingsCount = await Reading.countDocuments({ billingCycle: cycleId });

    if (associatedReadingsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete this billing cycle because it has ${associatedReadingsCount} reading(s) associated with it. Please delete the readings first.`,
      });
    }

    await BillingCycle.findByIdAndDelete(cycleId);

    res.status(200).json({ message: 'Billing cycle deleted successfully.' });

  } catch (error) {
    console.error('Error deleting billing cycle:', error);
    res.status(500).json({ message: 'Server error while deleting billing cycle.' });
  }
};