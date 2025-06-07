// meter-tracker/client/src/pages/SettingsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import { toast } from 'react-toastify'; // Import toast

const getCurrentDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

let slabRuleIdCounter = 0;
const generateSlabRuleId = () => {
  slabRuleIdCounter += 1;
  return `slabRule-${Date.now()}-${slabRuleIdCounter}`;
};

const SlabRuleInputs = React.memo(({ slab, index, onChange, onRemove, category }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 items-center mb-2 p-2 border rounded-md bg-white sm:bg-transparent">
      <div className="sm:col-span-2">
        <label htmlFor={`${category}-fromUnit-${slab.id}`} className="text-xs text-gray-600">From Unit</label>
        <input type="number" id={`${category}-fromUnit-${slab.id}`} value={slab.fromUnit} onChange={(e) => onChange(index, 'fromUnit', e.target.value, category)} placeholder="e.g., 1" min="0" step="1" className="mt-1 w-full p-1.5 border border-gray-300 rounded-md text-sm" required />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${category}-toUnit-${slab.id}`} className="text-xs text-gray-600">To Unit</label>
        <input type="number" id={`${category}-toUnit-${slab.id}`} value={slab.toUnit} onChange={(e) => onChange(index, 'toUnit', e.target.value, category)} placeholder="e.g., 100" min="0" step="1" className="mt-1 w-full p-1.5 border border-gray-300 rounded-md text-sm" required />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${category}-rate-${slab.id}`} className="text-xs text-gray-600">Rate (₹)</label>
        <input type="number" id={`${category}-rate-${slab.id}`} value={slab.rate} onChange={(e) => onChange(index, 'rate', e.target.value, category)} placeholder="e.g., 2.35" min="0" step="0.01" className="mt-1 w-full p-1.5 border border-gray-300 rounded-md text-sm" required />
      </div>
      <div className="sm:col-span-1 flex items-end justify-end sm:justify-center pt-2 sm:pt-0">
        <button type="button" onClick={() => onRemove(index, category)} className="text-red-500 hover:text-red-700 text-sm p-1.5" title="Remove this slab rule">
          Remove
        </button>
      </div>
    </div>
  );
});
SlabRuleInputs.displayName = 'SlabRuleInputs';

function SettingsPage() {
  const [meters, setMeters] = useState([]);
  const [generalPurposeMeters, setGeneralPurposeMeters] = useState([]);
  const [selectedActiveMeterId, setSelectedActiveMeterId] = useState('');
  const [loadingMeters, setLoadingMeters] = useState(true);
  const [isUpdatingMeter, setIsUpdatingMeter] = useState(false);

  const [slabConfigs, setSlabConfigs] = useState([]);
  const [loadingSlabs, setLoadingSlabs] = useState(true);
  const [selectedActiveSlabConfigId, setSelectedActiveSlabConfigId] = useState('');
  const [isUpdatingSlab, setIsUpdatingSlab] = useState(false);

  const [showAddSlabForm, setShowAddSlabForm] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');
  const [newEffectiveDate, setNewEffectiveDate] = useState(getCurrentDateString());
  const [newLte500Slabs, setNewLte500Slabs] = useState(() => [{ id: generateSlabRuleId(), fromUnit: '', toUnit: '', rate: '' }]);
  const [newGt500Slabs, setNewGt500Slabs] = useState(() => [{ id: generateSlabRuleId(), fromUnit: '', toUnit: '', rate: '' }]);
  const [isAddingSlab, setIsAddingSlab] = useState(false);

  const [showDeleteSlabConfirm, setShowDeleteSlabConfirm] = useState(false);
  const [slabConfigToDelete, setSlabConfigToDelete] = useState(null);
  const [isDeletingSlabConfig, setIsDeletingSlabConfig] = useState(false);

  const fetchMeters = useCallback(async () => {
    try {
      setLoadingMeters(true);
      const response = await apiClient.get('/meters');
      const allMeters = response.data || [];
      setMeters(allMeters);
      const gpMeters = Array.isArray(allMeters) ? allMeters.filter(meter => meter.isGeneralPurpose) : [];
      setGeneralPurposeMeters(gpMeters);
      const currentActiveGPMeter = gpMeters.find(meter => meter.isCurrentlyActiveGeneral);
      if (currentActiveGPMeter) setSelectedActiveMeterId(currentActiveGPMeter._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch meters.');
    } finally { setLoadingMeters(false); }
  }, []);

  const fetchSlabConfigs = useCallback(async () => {
    try {
      setLoadingSlabs(true);
      const response = await apiClient.get('/slabs');
      const allSlabs = response.data || [];
      setSlabConfigs(Array.isArray(allSlabs) ? allSlabs : []);
      const currentActiveSlab = allSlabs.find(sc => sc.isCurrentlyActive);
      if (currentActiveSlab) setSelectedActiveSlabConfigId(currentActiveSlab._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch slab configs.');
    } finally { setLoadingSlabs(false); }
  }, []);

  useEffect(() => { fetchMeters(); fetchSlabConfigs(); }, [fetchMeters, fetchSlabConfigs]);

  const handleActiveMeterChange = (meterId) => setSelectedActiveMeterId(meterId);
  const handleSaveActiveMeter = async () => {
    if (!selectedActiveMeterId) { toast.warn("Please select a meter to activate."); return; }
    setIsUpdatingMeter(true);
    try {
      await apiClient.put(`/meters/${selectedActiveMeterId}/set-active-general`);
      toast.success('Active general meter updated successfully!'); fetchMeters();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update active meter.');
    } finally { setIsUpdatingMeter(false); }
  };

  const handleActiveSlabConfigChange = (configId) => setSelectedActiveSlabConfigId(configId);
  const handleSaveActiveSlabConfig = async () => {
    if (!selectedActiveSlabConfigId) { toast.warn("Please select a slab configuration to activate."); return; }
    setIsUpdatingSlab(true);
    try {
      await apiClient.put(`/slabs/${selectedActiveSlabConfigId}/activate`);
      toast.success('Slab rate configuration activated successfully!'); fetchSlabConfigs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate slab configuration.');
    } finally { setIsUpdatingSlab(false); }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' });
  };

  const handleSlabRuleChange = useCallback((index, field, value, slabCategory) => {
    const setter = slabCategory === 'lte500' ? setNewLte500Slabs : setNewGt500Slabs;
    setter(prevSlabs => prevSlabs.map((slab, i) => i === index ? { ...slab, [field]: value } : slab));
  }, []);

  const addSlabRule = useCallback((slabCategory) => {
    const newRule = { id: generateSlabRuleId(), fromUnit: '', toUnit: '', rate: '' };
    const setter = slabCategory === 'lte500' ? setNewLte500Slabs : setNewGt500Slabs;
    setter(prevSlabs => [...prevSlabs, newRule]);
  }, []);

  const removeSlabRule = useCallback((index, slabCategory) => {
    const setter = slabCategory === 'lte500' ? setNewLte500Slabs : setNewGt500Slabs;
    setter(prevSlabs => {
      if (prevSlabs.length <= 1) return prevSlabs;
      return prevSlabs.filter((_, i) => i !== index);
    });
  }, []);

  const validateSlabRules = (slabArray) => {
    for (const slab of slabArray) {
      if (slab.fromUnit === '' || slab.toUnit === '' || slab.rate === '') return false;
      const from = parseFloat(slab.fromUnit); const to = parseFloat(slab.toUnit); const rateVal = parseFloat(slab.rate);
      if (isNaN(from) || isNaN(to) || isNaN(rateVal)) return false;
      if (from < 0 || to < 0 || rateVal < 0) return false; if (to < from) return false;
    }
    return true;
  };

  const handleAddNewSlabConfig = async (e) => {
    e.preventDefault();
    setIsAddingSlab(true);
    if (!newConfigName.trim() || !newEffectiveDate) {
      toast.error("Configuration name and effective date are required."); setIsAddingSlab(false); return;
    }
    if (!validateSlabRules(newLte500Slabs) || !validateSlabRules(newGt500Slabs)) {
      toast.error("Fill all slab fields with valid non-negative numbers. 'To Unit' >= 'From Unit'."); setIsAddingSlab(false); return;
    }
    const parseSlabs = (slabs) => slabs.map(s => ({ fromUnit: parseFloat(s.fromUnit), toUnit: parseFloat(s.toUnit), rate: parseFloat(s.rate) }));
    const payload = {
      configName: newConfigName.trim(), effectiveDate: new Date(newEffectiveDate).toISOString(),
      slabsLessThanOrEqual500: parseSlabs(newLte500Slabs), slabsGreaterThan500: parseSlabs(newGt500Slabs),
      isCurrentlyActive: false,
    };
    try {
      await apiClient.post('/slabs', payload);
      toast.success(`Slab configuration "${newConfigName.trim()}" added successfully!`);
      setShowAddSlabForm(false);
      fetchSlabConfigs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add new slab configuration.');
    } finally {
      setIsAddingSlab(false);
    }
  };

  const openDeleteSlabConfirmModal = (config) => {
    setSlabConfigToDelete(config);
    setShowDeleteSlabConfirm(true);
  };
  const closeDeleteSlabConfirmModal = () => {
    setSlabConfigToDelete(null);
    setShowDeleteSlabConfirm(false);
  };
  const handleConfirmDeleteSlabConfig = async () => {
    if (!slabConfigToDelete) return;
    setIsDeletingSlabConfig(true);
    try {
      await apiClient.delete(`/slabs/${slabConfigToDelete._id}`);
      toast.success(`"${slabConfigToDelete.configName}" deleted successfully.`);
      closeDeleteSlabConfirmModal(); fetchSlabConfigs();
      if (selectedActiveSlabConfigId === slabConfigToDelete._id) setSelectedActiveSlabConfigId('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete slab configuration.');
    } finally {
      setIsDeletingSlabConfig(false);
    }
  };

  if (loadingMeters || loadingSlabs) {
    return <div className="p-6 text-center"><p className="text-lg text-gray-600">Loading settings...</p></div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Settings</h1>
      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-700 mb-1">Active General Purpose Meter</h2>
        <p className="text-sm text-gray-500 mb-4">Select which general purpose meter is currently in use.</p>
        {/* --- MODIFIED: Added Array.isArray() check --- */}
        {Array.isArray(generalPurposeMeters) && generalPurposeMeters.length > 0 ? (
          <div className="space-y-3">
            {generalPurposeMeters.map((meter) => (
              <label key={meter._id} className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-400">
                <input type="radio" name="activeGeneralMeter" value={meter._id} checked={selectedActiveMeterId === meter._id} onChange={() => handleActiveMeterChange(meter._id)} className="h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                <span className="ml-3 text-gray-800 font-medium">{meter.name}</span><span className="ml-2 text-sm text-gray-500">({meter.meterType})</span>
                {meter.isCurrentlyActiveGeneral && (<span className="ml-auto text-xs font-semibold py-0.5 px-2 bg-green-200 text-green-800 rounded-full">Currently Active</span>)}
              </label>
            ))}
            <div className="mt-6">
              <button onClick={handleSaveActiveMeter} disabled={isUpdatingMeter || !selectedActiveMeterId || (generalPurposeMeters.find(m => m._id === selectedActiveMeterId)?.isCurrentlyActiveGeneral)} className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow disabled:opacity-50 disabled:cursor-not-allowed">
                {isUpdatingMeter ? 'Saving...' : 'Set Selected Meter as Active'}
              </button>
            </div>
          </div>
        ) : (<p className="text-gray-600">No general purpose meters found.</p>)}
      </div>

      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-700 mb-1">Slab Rate Configurations</h2>
            <p className="text-sm text-gray-500">Manage electricity tariff structures.</p>
          </div>
          <button
            onClick={() => {
              setShowAddSlabForm(!showAddSlabForm);
              if (!showAddSlabForm) {
                setNewConfigName(''); setNewEffectiveDate(getCurrentDateString());
                setNewLte500Slabs([{ id: generateSlabRuleId(), fromUnit: '', toUnit: '', rate: '' }]);
                setNewGt500Slabs([{ id: generateSlabRuleId(), fromUnit: '', toUnit: '', rate: '' }]);
              }
            }}
            className={`w-full sm:w-auto flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md shadow whitespace-nowrap ${showAddSlabForm ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
          >
            {showAddSlabForm ? 'Cancel Adding Slab' : '+ Add New Slab Configuration'}
          </button>
        </div>
        {showAddSlabForm && (
          <form onSubmit={handleAddNewSlabConfig} className="my-6 p-4 border border-dashed border-gray-300 rounded-lg space-y-6 bg-slate-50">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-600 border-b pb-2">New Slab Configuration Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="newConfigName" className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input type="text" id="newConfigName" value={newConfigName} onChange={(e) => setNewConfigName(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm" required />
              </div>
              <div>
                <label htmlFor="newEffectiveDate" className="block text-sm font-medium text-gray-700 mb-1">Effective Date <span className="text-red-500">*</span></label>
                <input type="date" id="newEffectiveDate" value={newEffectiveDate} onChange={(e) => setNewEffectiveDate(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm" required />
              </div>
            </div>
            <div>
              <h4 className="text-base sm:text-md font-semibold text-slate-600 mb-2">Slabs for Consumption &le; 500 Units</h4>
              {Array.isArray(newLte500Slabs) && newLte500Slabs.map((slab, index) => (
                <SlabRuleInputs key={slab.id} slab={slab} index={index} onChange={handleSlabRuleChange} onRemove={removeSlabRule} category="lte500" />
              ))}
              <button type="button" onClick={() => addSlabRule('lte500')} className="mt-1 text-sm text-blue-600 hover:text-blue-800">+ Add Rule for &le; 500</button>
            </div>
            <div>
              <h4 className="text-base sm:text-md font-semibold text-slate-600 mb-2">Slabs for Consumption &gt; 500 Units</h4>
              {Array.isArray(newGt500Slabs) && newGt500Slabs.map((slab, index) => (
                <SlabRuleInputs key={slab.id} slab={slab} index={index} onChange={handleSlabRuleChange} onRemove={removeSlabRule} category="gt500" />
              ))}
              <button type="button" onClick={() => addSlabRule('gt500')} className="mt-1 text-sm text-blue-600 hover:text-blue-800">+ Add Rule for &gt; 500</button>
            </div>
            <div className="pt-4 flex justify-end">
              <button type="submit" disabled={isAddingSlab} className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow disabled:opacity-50">
                {isAddingSlab ? 'Saving...' : 'Save New Configuration'}
              </button>
            </div>
          </form>
        )}

        {/* --- MODIFIED: Added Array.isArray() check --- */}
        {Array.isArray(slabConfigs) && slabConfigs.length > 0 && !showAddSlabForm ? (
          <div className="space-y-3 mt-6 border-t pt-6">
            <h3 className="text-base sm:text-lg font-semibold text-slate-600 mb-2">Activate Existing Configuration</h3>
            {slabConfigs.map(config => (
              <div key={config._id} className={`p-3 border rounded-md ${selectedActiveSlabConfigId === config._id ? 'bg-indigo-50 border-indigo-300' : 'hover:bg-gray-50'}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <label className="flex items-center cursor-pointer flex-grow mr-2">
                    <input type="radio" name="activeSlabConfig" value={config._id} checked={selectedActiveSlabConfigId === config._id} onChange={() => handleActiveSlabConfigChange(config._id)} className="h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500 flex-shrink-0" />
                    <div className="ml-3">
                      <span className="text-sm sm:text-base text-gray-800 font-medium">{config.configName}</span>
                      <span className="block text-xs sm:text-sm text-gray-500">Effective Date: {formatDate(config.effectiveDate)}</span>
                    </div>
                  </label>
                  <div className="flex items-center self-end sm:self-center w-full sm:w-auto mt-2 sm:mt-0">
                    {config.isCurrentlyActive && (<span className="text-xs font-semibold py-0.5 px-2 bg-green-200 text-green-800 rounded-full whitespace-nowrap ml-auto">Currently Active</span>)}
                    {!config.isCurrentlyActive && (
                      <button onClick={() => openDeleteSlabConfirmModal(config)} className="ml-auto px-3 py-1 text-xs font-medium text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-md transition-colors whitespace-nowrap" title={`Delete ${config.configName}`}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-6">
              <button onClick={handleSaveActiveSlabConfig} disabled={isUpdatingSlab || !selectedActiveSlabConfigId || (slabConfigs.find(sc => sc._id === selectedActiveSlabConfigId)?.isCurrentlyActive)} className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow disabled:opacity-50 disabled:cursor-not-allowed">
                {isUpdatingSlab ? 'Activating...' : 'Set Selected Slabs as Active'}
              </button>
            </div>
          </div>
        ) : !showAddSlabForm && (<p className="text-gray-600 mt-4">No slab rate configurations found.</p>)}
      </div>

      {showDeleteSlabConfirm && slabConfigToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 id="modal-title" className="text-xl font-semibold text-gray-800 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-1">Are you sure you want to delete the slab configuration:</p>
            <p className="font-semibold text-gray-900 mb-6">{slabConfigToDelete.configName}?</p>
            <p className="text-sm text-red-500 mb-4">This action cannot be undone.</p>
            {isDeletingSlabConfig && <div className="mb-4 p-2 text-sm text-yellow-700 bg-yellow-100 rounded-md">Processing...</div>}
            <div className="flex justify-end space-x-3">
              <button onClick={closeDeleteSlabConfirmModal} disabled={isDeletingSlabConfig} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
              <button onClick={handleConfirmDeleteSlabConfig} disabled={isDeletingSlabConfig} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50">
                {isDeletingSlabConfig ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;