// meter-tracker/client/src/components/Layout.jsx
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const closeMobileMenu = () => { setIsMobileMenuOpen(false); };

  useEffect(() => { closeMobileMenu(); }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <nav className="bg-slate-800 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-xl font-semibold hover:text-slate-300 transition-colors duration-200">
              MeterTracker
            </Link>

            {/* Desktop Menu Links */}
            <div className="hidden md:flex space-x-1">
              <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors duration-200">Dashboard</Link>
              <Link to="/readings" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors duration-200">Readings</Link>
              <Link to="/billing-cycles" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors duration-200">Billing Cycles</Link>
              <Link to="/analytics" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors duration-200">Analytics</Link>
              <Link to="/settings" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors duration-200">Settings</Link>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} type="button" className="inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700 transition-colors duration-200" onClick={closeMobileMenu}>Dashboard</Link>
              <Link to="/readings" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700 transition-colors duration-200" onClick={closeMobileMenu}>Readings</Link>
              <Link to="/billing-cycles" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700 transition-colors duration-200" onClick={closeMobileMenu}>Billing Cycles</Link>
              <Link to="/analytics" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700 transition-colors duration-200" onClick={closeMobileMenu}>Analytics</Link>
              <Link to="/settings" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700 transition-colors duration-200" onClick={closeMobileMenu}>Settings</Link>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow container mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      <footer className="bg-slate-200 text-slate-700 text-center p-4 mt-auto">
        © {new Date().getFullYear()} Meter Tracker App
      </footer>
    </div>
  );
}

export default Layout;