// meter-tracker/client/src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ReadingsPage from './pages/ReadingsPage';
import SettingsPage from './pages/SettingsPage';
import BillingCyclesPage from './pages/BillingCyclesPage'; // --- NEW IMPORT ---

// --- NEW: Imports for react-toastify ---
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <> {/* Use a Fragment to wrap Routes and ToastContainer */}
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="readings" element={<ReadingsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="billing-cycles" element={<BillingCyclesPage />} /> {/* --- NEW ROUTE --- */}
        </Route>
      </Routes>
      
      {/* --- NEW: ToastContainer component --- */}
      {/* This component will render all toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000} // Close notifications after 5 seconds
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored" // Use "light", "dark", or "colored"
      />
    </>
  );
}

export default App;