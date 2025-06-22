// meter-tracker/client/src/pages/AnalyticsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../services/api';
import { toast } from 'react-toastify';

function AnalyticsPage() {
  const [cycleData, setCycleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/analytics/cycle-summary');
      setCycleData(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch analytics data.';
      setError(errorMessage);
      toast.error(errorMessage);
      setCycleData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const formatCurrencyForAxis = (value) => `₹${value}`;

  if (loading) {
    return <div className="p-6 text-center"><p className="text-lg text-gray-600">Loading Analytics Data...</p></div>;
  }

  if (error) {
    return <div className="p-6 text-center"><p className="text-lg text-red-600">Error: {error}</p></div>;
  }
  
  return (
    <div className="p-4 sm:p-6 space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Analytics</h1>

      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-700 mb-6">Consumption & Cost per Billing Cycle</h2>
        
        {cycleData.length > 0 ? (
          // ResponsiveContainer makes the chart adapt to the parent div's size
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={cycleData}
              margin={{
                top: 5,
                right: 20, // More space for Y-axis labels on the right
                left: 20,
                bottom: 50, // More space for angled X-axis labels
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} // Angle the labels to prevent overlap
                textAnchor="end" // Anchor text at the end for better alignment
                height={80} // Increase height to accommodate angled labels
                interval={0} // Ensure all labels are shown
                tick={{ fontSize: 12 }}
              />
              {/* Left Y-Axis for Consumption */}
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: 'Units (kWh)', angle: -90, position: 'insideLeft' }} />
              {/* Right Y-Axis for Cost */}
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tickFormatter={formatCurrencyForAxis} label={{ value: 'Cost (₹)', angle: -90, position: 'insideRight' }}/>
              
              <Tooltip formatter={(value, name) => name === 'Total Cost (₹)' ? `₹${value.toFixed(2)}` : `${value} kWh`} />
              <Legend verticalAlign="top" height={36} />
              
              <Bar yAxisId="left" dataKey="totalConsumption" name="Total Consumption (kWh)" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="totalCost" name="Total Cost (₹)" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-10">
            No data available for closed billing cycles. Complete a cycle to see analytics.
          </p>
        )}
      </div>

      {/* Placeholder for future charts */}
      {/* <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-slate-700 mb-4">Meter Breakdown per Cycle</h2>
          <p className="text-center text-gray-500 py-10">Stacked bar chart coming soon...</p>
      </div> */}
    </div>
  );
}

export default AnalyticsPage;