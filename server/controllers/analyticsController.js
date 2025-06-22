// meter-tracker/server/controllers/analyticsController.js
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

// @desc    Get analytics data grouped by billing cycle
// @route   GET /api/analytics/cycle-summary
exports.getCycleSummary = async (req, res) => {
    try {
        console.log("Fetching analytics data for cycle summary...");

        // For cost calculation, we need to know the slab rates.
        // This example assumes we use the *currently active* slab rates to re-calculate historical costs.
        // A more complex implementation could snapshot slab rates with each billing cycle.
        const activeSlabConfig = await SlabRateConfig.findOne({ isCurrentlyActive: true });
        if (!activeSlabConfig) {
            // If no active slabs, we can still return consumption data without cost.
            console.warn("No active slab configuration found. Analytics will not include cost data.");
        }

        const cycleData = await Reading.aggregate([
            // Stage 1: Lookup billing cycle information for each reading
            {
                $lookup: {
                    from: 'billingcycles', // The actual collection name in MongoDB (plural, lowercase)
                    localField: 'billingCycle',
                    foreignField: '_id',
                    as: 'cycleInfo'
                }
            },
            // Stage 2: Deconstruct the cycleInfo array field from the input documents to output a document for each element.
            {
                $unwind: '$cycleInfo'
            },
            // Stage 3: Filter for readings that belong to 'closed' cycles only
            {
                $match: {
                    'cycleInfo.status': 'closed'
                }
            },
            // Stage 4: Group documents by billingCycle to calculate total consumption
            {
                $group: {
                    _id: '$billingCycle', // Group by the billingCycle's ID
                    totalConsumption: { $sum: '$unitsConsumedSincePrevious' },
                    // Get the cycle details from the first document in each group
                    startDate: { $first: '$cycleInfo.startDate' },
                    endDate: { $first: '$cycleInfo.endDate' }
                }
            },
            // Stage 5: Sort the results by start date to get a chronological view
            {
                $sort: {
                    startDate: 1 // 1 for ascending order
                }
            }
        ]);
        
        // Stage 6 (in application code): Calculate cost for each cycle and format the data
        const analyticsData = cycleData.map(cycle => {
            const totalCost = activeSlabConfig 
                ? calculateCostForConsumption(cycle.totalConsumption, activeSlabConfig) 
                : 0;
            
            return {
                id: cycle._id,
                // Create a user-friendly label for the chart
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

// Helper to format date for the 'name' field
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};