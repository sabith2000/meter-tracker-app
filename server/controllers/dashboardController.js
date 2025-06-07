// meter-tracker/controllers/dashboardController.js
const Meter = require('../models/Meter');
const Reading = require('../models/Reading');
const BillingCycle = require('../models/BillingCycle');
const SlabRateConfig = require('../models/SlabRateConfig');

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
        if (!activeCycle) {
            return res.status(404).json({ message: 'No active billing cycle found. Please start one.' });
        }

        const activeSlabConfig = await SlabRateConfig.findOne({ isCurrentlyActive: true });
        if (!activeSlabConfig) {
            return res.status(404).json({ message: 'No active slab rate configuration found. Cost calculations cannot be performed.' });
        }

        const meters = await Meter.find();
        if (!meters || meters.length === 0) {
            return res.status(404).json({ message: 'No meters found. Please add meters.' });
        }

        // Calculate days in current cycle so far
        const now = new Date();
        const cycleStartDate = new Date(activeCycle.startDate);
        // Ensure 'now' is not before cycleStartDate for day calculation
        const effectiveNow = now < cycleStartDate ? cycleStartDate : now;
        let daysInCycle = Math.ceil((effectiveNow - cycleStartDate) / (1000 * 60 * 60 * 24));
        if (daysInCycle <= 0) daysInCycle = 1; // Min 1 day if start date is today

        const meterSummaries = [];
        let currentCycleTotalBill = 0;

        for (const meter of meters) {
            const readingsInCurrentCycle = await Reading.find({
                meter: meter._id,
                billingCycle: activeCycle._id
            }).sort({ date: 'asc' }); // Sort to ensure correct order for summing consumption

            let currentCycleConsumption = 0;
            readingsInCurrentCycle.forEach(reading => {
                currentCycleConsumption += reading.unitsConsumedSincePrevious;
            });
            currentCycleConsumption = parseFloat(currentCycleConsumption.toFixed(2));


            const currentCycleCost = calculateCostForConsumption(currentCycleConsumption, activeSlabConfig);
            currentCycleTotalBill += currentCycleCost;

            const averageDailyConsumption = daysInCycle > 0 ? parseFloat((currentCycleConsumption / daysInCycle).toFixed(2)) : 0;

            const unitsRemainingTo500 = currentCycleConsumption <= 500 ? parseFloat((500 - currentCycleConsumption).toFixed(2)) : null;
            const percentageTo500 = currentCycleConsumption <= 500 ? parseFloat(((currentCycleConsumption / 500) * 100).toFixed(2)) : 100;


            // Previous Cycle Consumption
            let previousCycleConsumption = 0;
            const previousCycles = await BillingCycle.find({
                status: 'closed',
                endDate: { $lte: activeCycle.startDate }, // Use $lte
                _id: { $ne: activeCycle._id }             // Ensure not the same cycle
            })
                .sort({ endDate: -1 })
                .limit(1);
            let previousBillingCycleDetails = null;

            if (previousCycles.length > 0) {
                const previousCycle = previousCycles[0];
                previousBillingCycleDetails = {
                    id: previousCycle._id,
                    startDate: previousCycle.startDate,
                    endDate: previousCycle.endDate,
                    status: previousCycle.status
                };

                const readingsInPreviousCycle = await Reading.find({
                    meter: meter._id,
                    billingCycle: previousCycle._id
                });
                readingsInPreviousCycle.forEach(reading => {
                    previousCycleConsumption += reading.unitsConsumedSincePrevious;
                });
                previousCycleConsumption = parseFloat(previousCycleConsumption.toFixed(2));
            }


            meterSummaries.push({
                meterId: meter._id,
                meterName: meter.name,
                meterType: meter.meterType,
                isGeneralPurpose: meter.isGeneralPurpose,
                isCurrentlyActiveGeneral: meter.isCurrentlyActiveGeneral,
                currentCycleConsumption,
                currentCycleCost,
                averageDailyConsumption,
                unitsRemainingTo500,
                percentageTo500,
                previousCycleConsumption
            });
        }

        // Find the overall previous cycle for the top-level summary
        const overallPreviousCycle = await BillingCycle.findOne({
            status: 'closed',
            endDate: { $lte: activeCycle.startDate }, // Use $lte
            _id: { $ne: activeCycle._id }             // Ensure not the same cycle
        })
            .sort({ endDate: -1 });


        res.status(200).json({
            currentBillingCycle: {
                id: activeCycle._id,
                startDate: activeCycle.startDate,
                endDate: activeCycle.endDate, // will be null for active
                status: activeCycle.status,
                notes: activeCycle.notes,
                daysInCycle: daysInCycle
            },
            previousBillingCycle: overallPreviousCycle ? {
                id: overallPreviousCycle._id,
                startDate: overallPreviousCycle.startDate,
                endDate: overallPreviousCycle.endDate,
                status: overallPreviousCycle.status,
                notes: overallPreviousCycle.notes
            } : null,
            activeSlabConfiguration: {
                id: activeSlabConfig._id,
                configName: activeSlabConfig.configName,
                effectiveDate: activeSlabConfig.effectiveDate
                // You can choose to send the full slab details if frontend needs to display them
                // slabsLessThanOrEqual500: activeSlabConfig.slabsLessThanOrEqual500,
                // slabsGreaterThan500: activeSlabConfig.slabsGreaterThan500,
            },
            meterSummaries,
            currentCycleTotalBill: parseFloat(currentCycleTotalBill.toFixed(2))
        });

    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ message: 'Server error while fetching dashboard summary.', details: error.message });
    }
};