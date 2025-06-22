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
      {/* --- MODIFIED: Updated Navbar --- */}
      {/* Changed background to a darker navy-like blue */}
      <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-2"> {/* Reduced vertical padding slightly */}
          <div className="flex justify-between items-center">
            
            <Link to="/" className="flex items-center gap-3" onClick={closeMobileMenu}>
              {/* This img tag will display your logo from the /public folder */}
              <img src="/logo.png" alt="TrackMyWatts Logo" className="h-10 w-10" />
              {/* Container for the text */}
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-wider text-green-400 uppercase">
                  Track My Watts
                </span>
                <span className="text-xs font-medium text-yellow-400 italic -mt-1 self-end">
                  By LMS
                </span>
              </div>
            </Link>

            {/* Desktop Menu Links */}
            <div className="hidden md:flex space-x-1">
              <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors duration-200">Dashboard</Link>
              <Link to="/readings" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors duration-200">Readings</Link>
              <Link to="/billing-cycles" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors duration-200">Billing Cycles</Link>
              <Link to="/analytics" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors duration-200">Analytics</Link>
              <Link to="/settings" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors duration-200">Settings</Link>
            </div>

            {/* Mobile Menu Button */}
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
              <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700" onClick={closeMobileMenu}>Dashboard</Link>
              <Link to="/readings" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700" onClick={closeMobileMenu}>Readings</Link>
              <Link to="/billing-cycles" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700" onClick={closeMobileMenu}>Billing Cycles</Link>
              <Link to="/analytics" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700" onClick={closeMobileMenu}>Analytics</Link>
              <Link to="/settings" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700" onClick={closeMobileMenu}>Settings</Link>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow container mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

       {/* --- MODIFIED: Updated Footer --- */}
      <footer className="bg-slate-200 text-slate-700 text-center p-4 mt-auto">
        <div className="flex justify-center items-center gap-4 text-sm">
            <span>© {new Date().getFullYear()} TrackMyWatts by LMS</span>
            <span className="text-slate-400">|</span>
            {/* This will display the version from your client/package.json */}
            <span>Version {import.meta.env.VITE_APP_VERSION}</span>
        </div>
      </footer>
    </div>
  );
}
export default Layout;