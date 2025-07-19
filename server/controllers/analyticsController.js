// track-my-watts/server/controllers/analyticsController.js
const Reading = require('../models/Reading');
const BillingCycle = require('../models/BillingCycle');
const SlabRateConfig = require('../models/SlabRateConfig');
const mongoose = require('mongoose');

// Helper function to calculate cost. In a larger app, this would be in a shared utils file.
function calculateCostForConsumption(consumedUnits, slabConfig) {
    if (!slabConfig || consumedUnits < 0) { return 0; }
    let totalCost = 0;
    const applicableSlabs = consumedUnits <= 500 ? slabConfig.slabsLessThanOrEqual500 : slabConfig.slabsGreaterThan500;
    const sortedSlabs = [...applicableSlabs].sort((a, b) => a.fromUnit - b.fromUnit);
    let billedUnitsInPreviousTiers = 0;
    for (const slab of sortedSlabs) {
        if (consumedUnits > (slab.fromUnit - 1)) {
            const unitsActuallyInThisSlabSegment = Math.min(consumedUnits, slab.toUnit) - Math.max(billedUnitsInPreviousTiers, slab.fromUnit - 1);
            if (unitsActuallyInThisSlabSegment > 0) {
                totalCost += unitsActuallyInThisSlabSegment * slab.rate;
                billedUnitsInPreviousTiers += unitsActuallyInThisSlabSegment;
            }
        } else { break; }
        if (billedUnitsInPreviousTiers >= consumedUnits) break;
    }
    return parseFloat(totalCost.toFixed(2));
}

// @desc    Get analytics data grouped by billing cycle (for the first chart)
// @route   GET /api/analytics/cycle-summary
exports.getCycleSummary = async (req, res) => {
    try {
        console.log("Fetching analytics data for cycle summary...");
        const activeSlabConfig = await SlabRateConfig.findOne({ isCurrentlyActive: true });
        if (!activeSlabConfig) {
            console.warn("No active slab configuration found. Analytics will not include cost data.");
        }

        const cycleData = await Reading.aggregate([
            { $lookup: { from: 'billingcycles', localField: 'billingCycle', foreignField: '_id', as: 'cycleInfo' } },
            { $unwind: '$cycleInfo' },
            { $match: { 'cycleInfo.status': 'closed' } },
            { $group: { _id: '$billingCycle', totalConsumption: { $sum: '$unitsConsumedSincePrevious' }, startDate: { $first: '$cycleInfo.startDate' }, endDate: { $first: '$cycleInfo.endDate' } } },
            { $sort: { startDate: 1 } }
        ]);
        
        const analyticsData = cycleData.map(cycle => {
            const totalCost = activeSlabConfig ? calculateCostForConsumption(cycle.totalConsumption, activeSlabConfig) : 0;
            return {
                id: cycle._id,
                name: `${formatDate(cycle.startDate)} - ${formatDate(cycle.endDate)}`,
                totalConsumption: parseFloat(cycle.totalConsumption.toFixed(2)),
                totalCost: totalCost
            };
        });
        
        console.log(`Successfully aggregated analytics for ${analyticsData.length} cycles.`);
        res.status(200).json(analyticsData);

    } catch (error) {
        console.error("Error fetching cycle analytics:", error);
        res.status(500).json({ message: "Server error while fetching analytics data." });
    }
};

// --- NEW FUNCTION ADDED ---
// @desc    Get consumption data per meter, per cycle (for the new stacked bar chart)
// @route   GET /api/analytics/meter-breakdown
exports.getMeterBreakdownByCycle = async (req, res) => {
    try {
        console.log("Fetching analytics data for meter breakdown...");

        const meterBreakdownData = await Reading.aggregate([
            { $lookup: { from: 'billingcycles', localField: 'billingCycle', foreignField: '_id', as: 'cycleInfo' } },
            { $unwind: '$cycleInfo' },
            { $match: { 'cycleInfo.status': 'closed' } },
            { $lookup: { from: 'meters', localField: 'meter', foreignField: '_id', as: 'meterInfo' } },
            { $unwind: '$meterInfo' },
            {
                $group: {
                    _id: {
                        cycleId: '$billingCycle',
                        meterId: '$meter',
                        meterName: '$meterInfo.name',
                        cycleStartDate: '$cycleInfo.startDate',
                        cycleEndDate: '$cycleInfo.endDate'
                    },
                    totalConsumption: { $sum: '$unitsConsumedSincePrevious' }
                }
            },
            {
                $group: {
                    _id: '$_id.cycleId',
                    startDate: { $first: '$_id.cycleStartDate' },
                    endDate: { $first: '$_id.cycleEndDate' },
                    meterConsumptions: {
                        $push: {
                            meterId: '$_id.meterId',
                            meterName: '$_id.meterName',
                            consumption: '$totalConsumption'
                        }
                    }
                }
            },
            { $sort: { startDate: 1 } }
        ]);

        const formattedData = meterBreakdownData.map(cycle => {
            const cycleName = `${formatDate(cycle.startDate)} - ${formatDate(cycle.endDate)}`;
            const chartObject = { name: cycleName };
            cycle.meterConsumptions.forEach(meter => {
                chartObject[meter.meterName] = parseFloat(meter.consumption.toFixed(2));
            });
            return chartObject;
        });

        console.log(`Successfully aggregated meter breakdown for ${formattedData.length} cycles.`);
        res.status(200).json(formattedData);

    } catch (error) {
        console.error("Error fetching meter breakdown analytics:", error);
        res.status(500).json({ message: "Server error while fetching analytics data." });
    }
};

// Helper to format date for the 'name' field
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};