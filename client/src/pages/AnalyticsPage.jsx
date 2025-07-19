// meter-tracker/client/src/pages/AnalyticsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../services/api';
import { toast } from 'react-toastify';

// A set of predefined colors for the stacked bar chart
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

function AnalyticsPage() {
  const [cycleSummaryData, setCycleSummaryData] = useState([]);
  const [meterBreakdownData, setMeterBreakdownData] = useState([]);
  const [meterNames, setMeterNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data for both charts in parallel for efficiency
      const [summaryRes, breakdownRes] = await Promise.all([
        apiClient.get('/analytics/cycle-summary'),
        apiClient.get('/analytics/meter-breakdown')
      ]);

      // Set data for the first chart
      setCycleSummaryData(Array.isArray(summaryRes.data) ? summaryRes.data : []);
      
      // Set data for the new stacked bar chart
      const breakdownData = Array.isArray(breakdownRes.data) ? breakdownRes.data : [];
      setMeterBreakdownData(breakdownData);

      // Dynamically get all unique meter names from the breakdown data
      // This is needed to create a <Bar> component for each meter
      if (breakdownData.length > 0) {
        const allKeys = breakdownData.reduce((keys, item) => {
          Object.keys(item).forEach(key => {
            if (key !== 'name') { // 'name' is the cycle label, not a meter
              keys.add(key);
            }
          });
          return keys;
        }, new Set());
        setMeterNames(Array.from(allKeys));
      }

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch analytics data.';
      setError(errorMessage);
      toast.error(errorMessage);
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

      {/* --- NEW: Meter Consumption Breakdown Chart --- */}
      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-700 mb-6">Meter Consumption Breakdown per Cycle</h2>
        
        {meterBreakdownData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={meterBreakdownData}
              margin={{ top: 5, right: 20, left: 20, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis label={{ value: 'Units (units)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `${value.toFixed(2)} units`} />
              <Legend verticalAlign="top" height={36} />
              
              {/* Dynamically create a <Bar> for each meter */}
              {meterNames.map((meterName, index) => (
                <Bar 
                  key={meterName} 
                  dataKey={meterName} 
                  stackId="a" // This makes the bars stack on top of each other
                  fill={COLORS[index % COLORS.length]} // Cycle through our predefined colors
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-10">
            No meter breakdown data available. At least one billing cycle must be closed to see data here.
          </p>
        )}
      </div>

      {/* --- Existing Consumption & Cost Chart --- */}
      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-700 mb-6">Total Consumption & Cost per Cycle</h2>
        
        {cycleSummaryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={cycleSummaryData}
              margin={{ top: 5, right: 20, left: 20, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: 'Units (units)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tickFormatter={formatCurrencyForAxis} label={{ value: 'Cost (₹)', angle: -90, position: 'insideRight' }}/>
              <Tooltip formatter={(value, name) => name === 'Total Cost (₹)' ? `₹${value.toFixed(2)}` : `${value} units`} />
              <Legend verticalAlign="top" height={36} />
              <Bar yAxisId="left" dataKey="totalConsumption" name="Total Consumption (units)" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="totalCost" name="Total Cost (₹)" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-10">
            No total consumption data available.
          </p>
        )}
      </div>
    </div>
  );
}

export default AnalyticsPage;