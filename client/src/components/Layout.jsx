// meter-tracker/client/src/components/Layout.jsx
import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

// Simple SVG icons for menu (can be replaced with an icon library later)
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
  const location = useLocation(); // To close menu on navigation

  // Function to close mobile menu, e.g., when a link is clicked
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    closeMobileMenu();
  }, [location]);


  return (
    <div className="min-h-screen flex flex-col bg-slate-100"> {/* Added bg-slate-100 to body if needed */}
      {/* Navbar */}
      <nav className="bg-slate-800 text-white shadow-lg sticky top-0 z-50"> {/* Made navbar sticky */}
        <div className="container mx-auto px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-xl font-semibold hover:text-slate-300" onClick={closeMobileMenu}>
              MeterTracker
            </Link>

            {/* Desktop Menu Links - Hidden on small screens, visible on md and up */}
            <div className="hidden md:flex space-x-3">
              <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors">
                Dashboard
              </Link>
              <Link to="/readings" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors">
                Readings
              </Link>
              {/* --- NEW LINK --- */}
              <Link to="/billing-cycles" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors">Billing Cycles</Link>
              {/* --- NEW LINK --- */}
              <Link to="/analytics" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors">Analytics</Link>
              <Link to="/settings" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors">
                Settings
              </Link>
            </div>

            {/* Mobile Menu Button - Visible on small screens, hidden on md and up */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu - Conditionally rendered based on isMobileMenuOpen state */}
        {isMobileMenuOpen && (
          <div className="md:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/"
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700 transition-colors"
                onClick={closeMobileMenu}
              >
                Dashboard
              </Link>
              <Link
                to="/readings"
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700 transition-colors"
                onClick={closeMobileMenu}
              >
                Readings
              </Link>
              {/* --- NEW LINK --- */}
              <Link to="/billing-cycles" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700 transition-colors" onClick={closeMobileMenu}>Billing Cycles</Link>
              {/* --- NEW LINK --- */}
              <Link to="/analytics" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700" onClick={closeMobileMenu}>Analytics</Link>
              <Link
                to="/settings"
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700 transition-colors"
                onClick={closeMobileMenu}
              >
                Settings
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      {/* Added `pt-4` or similar to prevent content from hiding under sticky nav if needed, adjust as per your nav height */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 py-6">
        <Outlet /> {/* Child route components will be rendered here */}
      </main>

      {/* Footer */}
      <footer className="bg-slate-200 text-slate-700 text-center p-4 mt-auto"> {/* Added mt-auto to push footer down */}
        © {new Date().getFullYear()} Meter Tracker App
      </footer>
    </div>
  );
}

// Need to import useEffect if not already present (it's used for closing menu on navigation)
import { useEffect } from 'react'; // Ensure this import is present at the top

export default Layout;