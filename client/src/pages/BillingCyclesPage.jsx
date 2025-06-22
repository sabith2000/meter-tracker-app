// meter-tracker/client/src/pages/BillingCyclesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import { toast } from 'react-toastify';

const todayFormattedForInput = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata'
    });
};

function BillingCyclesPage() {
  const [billingCycles, setBillingCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showStartForm, setShowStartForm] = useState(false);
  const [newStartDate, setNewStartDate] = useState(todayFormattedForInput());
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cycleToDelete, setCycleToDelete] = useState(null);

  const hasActiveCycle = billingCycles.some(cycle => cycle.status === 'active');

  const fetchBillingCycles = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const response = await apiClient.get('/billing-cycles');
      setBillingCycles(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch billing cycles.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingCycles();
  }, [fetchBillingCycles]);

  const handleStartNewCycle = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/billing-cycles/start', {
        startDate: new Date(newStartDate).toISOString(),
        notes: newNotes,
      });
      toast.success("New billing cycle started successfully!");
      setShowStartForm(false);
      setNewStartDate(todayFormattedForInput());
      setNewNotes('');
      fetchBillingCycles(); // Refresh the list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start new cycle.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openDeleteConfirm = (cycle) => {
    setCycleToDelete(cycle);
  };
  
  const closeDeleteConfirm = () => {
    setCycleToDelete(null);
  };
  
  const handleConfirmDelete = async () => {
    if (!cycleToDelete) return;
    setIsSubmitting(true);
    try {
      const response = await apiClient.delete(`/billing-cycles/${cycleToDelete._id}`);
      toast.success(response.data.message || "Billing cycle deleted successfully.");
      closeDeleteConfirm();
      fetchBillingCycles(); // Refresh the list
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete billing cycle.");
    } finally {
      setIsSubmitting(false);
    }
  };


  if (loading) {
    return <div className="p-6 text-center"><p className="text-lg text-gray-600">Loading Billing Cycles...</p></div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Billing Cycles</h1>
        {/* Only show "Start New Cycle" button if no other cycle is currently active */}
        {!hasActiveCycle && (
          <button
            onClick={() => setShowStartForm(true)}
            className="w-full sm:w-auto flex-shrink-0 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors duration-150"
          >
            + Start New Billing Cycle
          </button>
        )}
      </div>

      {error && <div className="p-3 mb-4 text-red-700 bg-red-100 rounded-md">Error: {error}</div>}

      {/* Start New Cycle Form Modal */}
      {showStartForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Start a New Billing Cycle</h3>
            <form onSubmit={handleStartNewCycle} className="space-y-4">
              <div>
                <label htmlFor="newStartDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date <span className="text-red-500">*</span></label>
                <input type="date" id="newStartDate" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 sm:text-sm" required
                />
              </div>
              <div>
                <label htmlFor="newNotes" className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea id="newNotes" rows="3" value={newNotes} onChange={(e) => setNewNotes(e.target.value)}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 sm:text-sm"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button type="button" onClick={() => setShowStartForm(false)} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50">
                  {isSubmitting ? 'Starting...' : 'Start Cycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {cycleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-1">Are you sure you want to delete the billing cycle starting on <strong className="text-gray-900">{formatDate(cycleToDelete.startDate)}</strong>?</p>
            <p className="text-sm text-red-500 my-4">This action cannot be undone. You can only delete a cycle if no readings are attached to it.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={closeDeleteConfirm} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
              <button onClick={handleConfirmDelete} disabled={isSubmitting} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50">
                {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="shadow-md rounded-lg overflow-x-auto bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Start Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">End Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Notes</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(billingCycles) && billingCycles.length > 0 ? (
              billingCycles.map((cycle) => (
                <tr key={cycle._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium">{formatDate(cycle.startDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(cycle.endDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cycle.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {cycle.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate" title={cycle.notes}>{cycle.notes || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-3">
                    {/* <button className="text-indigo-600 hover:text-indigo-900">Edit</button> */}
                    <button onClick={() => openDeleteConfirm(cycle)} className="text-red-600 hover:text-red-900 disabled:text-gray-400" disabled={cycle.status === 'active'} title={cycle.status === 'active' ? "Cannot delete an active cycle" : "Delete cycle"}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-10 text-gray-500">
                  No billing cycles found. Click "Start New Billing Cycle" to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BillingCyclesPage;