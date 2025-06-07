// meter-tracker/client/src/components/AddReadingForm.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

// Helper function to get current local date and time in YYYY-MM-DDTHH:MM format
const getCurrentLocalDateTimeString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function AddReadingForm({ onReadingAdded, availableMeters }) {
  const [meterId, setMeterId] = useState('');
  const [date, setDate] = useState(getCurrentLocalDateTimeString()); 
  const [readingValue, setReadingValue] = useState('');
  const [notes, setNotes] = useState('');
  const [isEstimated, setIsEstimated] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // MODIFIED: Added Array.isArray() check for robustness
    if (!meterId && Array.isArray(availableMeters) && availableMeters.length > 0) {
      setMeterId(availableMeters[0]._id);
    }
  }, [availableMeters, meterId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage('');

    if (!meterId) {
      setError('Please select a meter.');
      setIsSubmitting(false);
      return;
    }
    if (!readingValue || isNaN(parseFloat(readingValue)) || parseFloat(readingValue) < 0) {
        setError('Please enter a valid, non-negative reading value.');
        setIsSubmitting(false);
        return;
    }
    if (!date) {
        setError('Please enter a valid date and time for the reading.');
        setIsSubmitting(false);
        return;
    }

    try {
      const readingData = {
        meterId,
        date: new Date(date).toISOString(), 
        readingValue: parseFloat(readingValue),
        notes,
        isEstimated,
      };
      await apiClient.post('/readings', readingData);
      setSuccessMessage('Reading added successfully!');
      
      if (onReadingAdded) {
        onReadingAdded(); 
      }
    } catch (err) {
      console.error("Error adding reading:", err);
      setError(err.response?.data?.message || err.message || 'Failed to add reading.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="my-6 p-6 bg-white shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-2xl font-semibold text-slate-700 mb-4">Add New Reading</h2>
      {successMessage && <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded-md">{successMessage}</div>}
      {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="meter" className="block text-sm font-medium text-gray-700 mb-1">
            Meter
          </label>
          <select
            id="meter"
            name="meter"
            value={meterId}
            onChange={(e) => setMeterId(e.target.value)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          >
            <option value="" disabled>Select a meter</option>
            {/* --- THE FIX --- */}
            {Array.isArray(availableMeters) && availableMeters.map((meter) => (
              <option key={meter._id} value={meter._id}>
                {meter.name} ({meter.meterType})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date and Time of Reading
          </label>
          <input
            type="datetime-local" 
            id="date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="readingValue" className="block text-sm font-medium text-gray-700 mb-1">
            Reading Value (units)
          </label>
          <input
            type="number"
            id="readingValue"
            name="readingValue"
            value={readingValue}
            onChange={(e) => setReadingValue(e.target.value)}
            placeholder="e.g., 12345.6"
            step="any"
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows="2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          ></textarea>
        </div>

        <div className="flex items-center">
          <input
            id="isEstimated"
            name="isEstimated"
            type="checkbox"
            checked={isEstimated}
            onChange={(e) => setIsEstimated(e.target.checked)}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="isEstimated" className="ml-2 block text-sm text-gray-900">
            This reading is an estimate
          </label>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add Reading'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddReadingForm;