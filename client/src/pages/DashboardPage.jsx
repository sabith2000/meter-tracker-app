// meter-tracker/client/src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
};

const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return 'N/A';
  return `₹${amount.toFixed(2)}`;
};

// Helper for default date for forms
const todayFormattedForInput = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCloseCycleForm, setShowCloseCycleForm] = useState(false);
  const [governmentCollectionDate, setGovernmentCollectionDate] = useState(todayFormattedForInput());
  const [notesForClosedCycle, setNotesForClosedCycle] = useState('');
  const [notesForNewCycle, setNotesForNewCycle] = useState('');
  const [isClosingCycle, setIsClosingCycle] = useState(false);
  const [closeCycleError, setCloseCycleError] = useState(null);
  const [closeCycleSuccess, setCloseCycleSuccess] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/dashboard/summary');
      setDashboardData(response.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch dashboard summary.');
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCloseCycleSubmit = async (e) => {
    e.preventDefault();
    setIsClosingCycle(true);
    setCloseCycleError(null);
    setCloseCycleSuccess('');

    if (!governmentCollectionDate) {
      setCloseCycleError("Government Collection Date is required.");
      setIsClosingCycle(false);
      return;
    }
    const collectionDateObj = new Date(governmentCollectionDate);
    const currentDateObj = new Date(todayFormattedForInput());

    if (collectionDateObj > currentDateObj) {
      setCloseCycleError("Government Collection Date cannot be in the future.");
      setIsClosingCycle(false);
      return;
    }
    if (dashboardData?.currentBillingCycle?.startDate && collectionDateObj < new Date(dashboardData.currentBillingCycle.startDate)) {
      setCloseCycleError("Collection Date cannot be before the current cycle's start date.");
      setIsClosingCycle(false);
      return;
    }

    try {
      const payload = {
        governmentCollectionDate: new Date(governmentCollectionDate).toISOString(),
        notesForClosedCycle,
        notesForNewCycle
      };
      const response = await apiClient.post('/billing-cycles/close-current', payload);
      setCloseCycleSuccess(response.data.message || 'Billing cycle closed and new one started successfully!');
      setShowCloseCycleForm(false);
      setGovernmentCollectionDate(todayFormattedForInput());
      setNotesForClosedCycle('');
      setNotesForNewCycle('');
      fetchDashboardData();
    } catch (err) {
      console.error("Error closing billing cycle:", err);
      setCloseCycleError(err.response?.data?.message || err.message || 'Failed to close billing cycle.');
    } finally {
      setIsClosingCycle(false);
    }
  };

  if (loading && !dashboardData) {
    return (<div className="p-6 text-center"><p className="text-lg text-gray-600">Loading dashboard data...</p></div>);
  }
  if (error && !dashboardData) {
    return (<div className="p-6 text-center"><p className="text-lg text-red-600">Initial Load Error: {error}</p></div>);
  }
  if (!dashboardData && !loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-gray-600">No dashboard data available. This could be an issue with fetching data, or no active billing cycle/slab rates are set up in the backend.</p>
        <button onClick={fetchDashboardData} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Try Reloading Data</button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard</h1>
        {dashboardData?.currentBillingCycle?.status === 'active' && (
          <button
            onClick={() => {
              setShowCloseCycleForm(true); setCloseCycleError(null); setCloseCycleSuccess('');
              setGovernmentCollectionDate(todayFormattedForInput());
              setNotesForClosedCycle(''); setNotesForNewCycle('');
            }}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded shadow whitespace-nowrap"
          >
            Close Current Billing Cycle
          </button>
        )}
      </div>
      {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">Data Refresh Error: {error} <button onClick={fetchDashboardData} className="ml-2 px-2 py-0.5 bg-red-200 text-red-800 rounded text-xs hover:bg-red-300">Retry</button></div>}

      {showCloseCycleForm && (
        <div className="my-6 p-4 sm:p-6 bg-white shadow-xl rounded-lg border border-red-300">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-700 mb-4">Close Current Billing Cycle</h2>
          {closeCycleSuccess && <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded-md">{closeCycleSuccess}</div>}
          {closeCycleError && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">{closeCycleError}</div>}

          <form onSubmit={handleCloseCycleSubmit} className="space-y-4">
            <div>
              <label htmlFor="governmentCollectionDate" className="block text-sm font-medium text-gray-700 mb-1">
                Government Collection Date <span className="text-red-500">*</span>
              </label>
              <input type="date" id="governmentCollectionDate" value={governmentCollectionDate} max={todayFormattedForInput()} onChange={(e) => setGovernmentCollectionDate(e.target.value)}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required
              />
            </div>
            <div>
              <label htmlFor="notesForClosedCycle" className="block text-sm font-medium text-gray-700 mb-1">Notes for Cycle Being Closed (Optional)</label>
              <textarea id="notesForClosedCycle" rows="2" value={notesForClosedCycle} onChange={(e) => setNotesForClosedCycle(e.target.value)}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              ></textarea>
            </div>
            <div>
              <label htmlFor="notesForNewCycle" className="block text-sm font-medium text-gray-700 mb-1">Notes for New Cycle Starting (Optional)</label>
              <textarea id="notesForNewCycle" rows="2" value={notesForNewCycle} onChange={(e) => setNotesForNewCycle(e.target.value)}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              ></textarea>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-3">
              <button type="button" onClick={() => setShowCloseCycleForm(false)}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >Cancel</button>
              <button type="submit" disabled={isClosingCycle}
                className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              > {isClosingCycle ? 'Processing...' : 'Confirm & Close Cycle'} </button>
            </div>
          </form>
        </div>
      )}

      {dashboardData && (
        <>
          {dashboardData.currentBillingCycle && (
            <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-700 mb-3">Current Billing Cycle</h2>
              <p className="text-sm sm:text-base text-gray-700">Starts: <span className="font-medium">{formatDate(dashboardData.currentBillingCycle.startDate)}</span></p>
              <p className="text-sm sm:text-base text-gray-700">Status: <span className="font-medium capitalize">{dashboardData.currentBillingCycle.status}</span></p>
              <p className="text-sm sm:text-base text-gray-700">Days in Cycle So Far: <span className="font-medium">{dashboardData.currentBillingCycle.daysInCycle}</span></p>
              {dashboardData.currentBillingCycle.notes && (<p className="text-xs sm:text-sm text-gray-500 mt-2">Notes: {dashboardData.currentBillingCycle.notes}</p>)}
            </div>
          )}

          {dashboardData.previousBillingCycle && (
            <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">Previous Billing Cycle</h3>
              <p className="text-sm sm:text-base text-gray-700">Period: <span className="font-medium">{formatDate(dashboardData.previousBillingCycle.startDate)}</span> - <span className="font-medium">{formatDate(dashboardData.previousBillingCycle.endDate)}</span></p>
              {dashboardData.previousBillingCycle.notes && (<p className="text-xs sm:text-sm text-gray-500 mt-1">Notes: {dashboardData.previousBillingCycle.notes}</p>)}
            </div>
          )}

          {dashboardData.currentCycleTotalBill !== undefined && (
            <div className="bg-sky-100 border-l-4 border-sky-500 text-sky-700 p-4 rounded-md shadow">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">Cycle Summary</h2>
              <p className="text-lg sm:text-xl">Total Estimated Bill (Current Cycle): <span className="font-bold">{formatCurrency(dashboardData.currentCycleTotalBill)}</span></p>
              {dashboardData.activeSlabConfiguration && (<p className="text-xs sm:text-sm mt-1">Using rates: {dashboardData.activeSlabConfiguration.configName}</p>)}
            </div>
          )}

          {/* This block contains the .map() call we need to fix */}
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-700 mt-6 mb-3">Meter Details</h2>
            {/* --- THE FIX --- */}
            {Array.isArray(dashboardData.meterSummaries) && dashboardData.meterSummaries.length > 0 ? (
              dashboardData.meterSummaries.map((meter) => (
                <div key={meter.meterId} className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
                  <h3 className="text-lg sm:text-xl font-semibold text-indigo-700">{meter.meterName} <span className="text-xs sm:text-sm text-gray-500">({meter.meterType})</span></h3>
                  {meter.isGeneralPurpose && (
                    <p className={`text-xs my-1 font-semibold py-0.5 px-2 inline-block rounded-full ${meter.isCurrentlyActiveGeneral ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'}`}>
                      {meter.isCurrentlyActiveGeneral ? 'ACTIVE General Meter' : 'INACTIVE General Meter'}
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 text-xs sm:text-sm">
                    <p>Consumption: <span className="font-semibold">{meter.currentCycleConsumption} units</span></p>
                    <p>Est. Cost: <span className="font-semibold">{formatCurrency(meter.currentCycleCost)}</span></p>
                    <p>Avg. Daily Use: <span className="font-semibold">{meter.averageDailyConsumption} units/day</span></p>
                    <p>Prev. Cycle Use: <span className="font-semibold">{meter.previousCycleConsumption} units</span></p>
                    {meter.unitsRemainingTo500 !== null && (
                      <>
                        <p>Units to 500: <span className="font-semibold">{meter.unitsRemainingTo500} units</span></p>
                        <p>% to 500: <span className="font-semibold">{meter.percentageTo500}%</span></p>
                        <div className="col-span-full mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${meter.percentageTo500 > 100 ? 100 : meter.percentageTo500}%` }}></div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (<p className="text-sm text-gray-600">No meter data available for summary.</p>)}
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardPage;