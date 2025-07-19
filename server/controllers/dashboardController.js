// meter-tracker/controllers/dashboardController.js
const Meter = require('../models/Meter');
const Reading = require('../models/Reading');
const BillingCycle = require('../models/BillingCycle');
const SlabRateConfig = require('../models/SlabRateConfig');
const Setting = require('../models/Settings'); // --- NEW IMPORT ---

// Helper function to calculate cost based on slabs
// This function will be called for each meter's consumption
function calculateCostForConsumption(consumedUnits, slabConfig) {
    if (!slabConfig || consumedUnits < 0) {
        return 0; // Or handle error appropriately
    }

    let totalCost = 0;
    let unitsToBill = consumedUnits;

    const applicableSlabs = consumedUnits <= 500 ? slabConfig.slabsLessThanOrEqual500 : slabConfig.slabsGreaterThan500;

    // Ensure slabs are sorted by fromUnit, just in case they aren't stored perfectly.
    const sortedSlabs = [...applicableSlabs].sort((a, b) => a.fromUnit - b.fromUnit);

    let billedUnitsInPreviousTiers = 0;

    for (const slab of sortedSlabs) {
        if (unitsToBill <= 0) break;

        // Determine how many units fall into this current slab tier
        const unitsInThisTierMax = slab.toUnit - (slab.fromUnit - 1);
        const unitsBillableInThisTier = Math.min(unitsToBill, unitsInThisTierMax);

        // Check if the consumption even reaches this slab
        if (consumedUnits > (slab.fromUnit - 1)) {
            const unitsActuallyInThisSlabSegment = Math.min(consumedUnits, slab.toUnit) - Math.max(billedUnitsInPreviousTiers, slab.fromUnit - 1);

            if (unitsActuallyInThisSlabSegment > 0) {
                totalCost += unitsActuallyInThisSlabSegment * slab.rate;
                billedUnitsInPreviousTiers += unitsActuallyInThisSlabSegment;
            }
        } else {
            break; // Consumption doesn't reach this slab
        }
        if (billedUnitsInPreviousTiers >= consumedUnits) break;

    }
    return parseFloat(totalCost.toFixed(2)); // Return cost rounded to 2 decimal places
}


// @desc    Get dashboard summary data
// @route   GET /api/dashboard/summary
// @access  Public
exports.getDashboardSummary = async (req, res) => {
    try {
        const activeCycle = await BillingCycle.findOne({ status: 'active' });
        if (!activeCycle) { return res.status(404).json({ message: 'No active billing cycle found.' }); }

        const activeSlabConfig = await SlabRateConfig.findOne({ isCurrentlyActive: true });
        if (!activeSlabConfig) { return res.status(404).json({ message: 'No active slab rate configuration found.' }); }

        const meters = await Meter.find();
        if (!meters || meters.length === 0) { return res.status(404).json({ message: 'No meters found.' }); }

        // --- NEW: Fetch User Settings ---
        let settings = await Setting.findOne({ key: 'user_settings' });
        if (!settings) {
            settings = new Setting(); // Create default settings if they don't exist
            await settings.save();
        }
        const consumptionTarget = settings.consumptionTarget; // Get the target value

        const now = new Date();
        const cycleStartDate = new Date(activeCycle.startDate);
        const effectiveNow = now < cycleStartDate ? cycleStartDate : now;
        let daysInCycle = Math.ceil((effectiveNow - cycleStartDate) / (1000 * 60 * 60 * 24));
        if (daysInCycle <= 0) daysInCycle = 1;

        const meterSummaries = [];
        let currentCycleTotalBill = 0;

        for (const meter of meters) {
            const readingsInCurrentCycle = await Reading.find({ meter: meter._id, billingCycle: activeCycle._id }).sort({ date: 'asc' });
            let currentCycleConsumption = 0;
            readingsInCurrentCycle.forEach(reading => { currentCycleConsumption += reading.unitsConsumedSincePrevious; });
            currentCycleConsumption = parseFloat(currentCycleConsumption.toFixed(2));
            const currentCycleCost = calculateCostForConsumption(currentCycleConsumption, activeSlabConfig);
            currentCycleTotalBill += currentCycleCost;
            const averageDailyConsumption = daysInCycle > 0 ? parseFloat((currentCycleConsumption / daysInCycle).toFixed(2)) : 0;
            
            // --- MODIFIED: Use the custom consumptionTarget ---
            const unitsRemainingToTarget = currentCycleConsumption <= consumptionTarget ? parseFloat((consumptionTarget - currentCycleConsumption).toFixed(2)) : 0;
            const percentageToTarget = currentCycleConsumption <= consumptionTarget ? parseFloat(((currentCycleConsumption / consumptionTarget) * 100).toFixed(2)) : 100;

            let previousCycleConsumption = 0;
            const previousCycle = await BillingCycle.findOne({ status: 'closed', endDate: { $lte: activeCycle.startDate }, _id: { $ne: activeCycle._id } }).sort({ endDate: -1 });
            if (previousCycle) {
                const readingsInPreviousCycle = await Reading.find({ meter: meter._id, billingCycle: previousCycle._id });
                readingsInPreviousCycle.forEach(reading => { previousCycleConsumption += reading.unitsConsumedSincePrevious; });
                previousCycleConsumption = parseFloat(previousCycleConsumption.toFixed(2));
            }

            meterSummaries.push({
                meterId: meter._id, meterName: meter.name, meterType: meter.meterType,
                isGeneralPurpose: meter.isGeneralPurpose, isCurrentlyActiveGeneral: meter.isCurrentlyActiveGeneral,
                currentCycleConsumption, currentCycleCost, averageDailyConsumption,
                // --- MODIFIED: Send new target-based values to frontend ---
                unitsRemainingToTarget,
                percentageToTarget,
                consumptionTarget, // Also send the target itself for display
                previousCycleConsumption
            });
        }
        
        const overallPreviousCycle = await BillingCycle.findOne({ status: 'closed', endDate: { $lte: activeCycle.startDate }, _id: { $ne: activeCycle._id } }).sort({ endDate: -1 });

        res.status(200).json({
            currentBillingCycle: {
                id: activeCycle._id, startDate: activeCycle.startDate, endDate: activeCycle.endDate,
                status: activeCycle.status, notes: activeCycle.notes, daysInCycle: daysInCycle
            },
            previousBillingCycle: overallPreviousCycle ? { id: overallPreviousCycle._id, startDate: overallPreviousCycle.startDate, endDate: overallPreviousCycle.endDate, status: overallPreviousCycle.status, notes: overallPreviousCycle.notes } : null,
            activeSlabConfiguration: { id: activeSlabConfig._id, configName: activeSlabConfig.configName, effectiveDate: activeSlabConfig.effectiveDate },
            meterSummaries,
            currentCycleTotalBill: parseFloat(currentCycleTotalBill.toFixed(2))
        });

    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ message: 'Server error while fetching dashboard summary.', details: error.message });
    }
};