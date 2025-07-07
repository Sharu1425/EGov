import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserCircleIcon, DocumentTextIcon, ArrowRightOnRectangleIcon, SunIcon, MoonIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = localStorage.getItem('role');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Don't show layout on auth pages
  if (['/login', '/signup'].includes(location.pathname)) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center space-x-2 group">
                  <DocumentTextIcon className="h-8 w-8 text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text transform group-hover:scale-110 transition-all duration-300" />
                  <span className="text-2xl font-bold text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text transform group-hover:translate-x-1 transition-all duration-300">
                    E-Gov
                  </span>
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className={`${
                    location.pathname === '/dashboard'
                      ? 'border-indigo-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 hover:scale-105`}
                >
                  <DocumentTextIcon className="h-5 w-5 mr-1.5" />
                  My Dashboard
                </Link>
                <Link
                  to="/public-hub"
                  className={`${
                    location.pathname === '/public-hub'
                      ? 'border-indigo-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 hover:scale-105`}
                >
                  <GlobeAltIcon className="h-5 w-5 mr-1.5" />
                  Public Docs Hub
                </Link>
                {role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className={`${
                      location.pathname === '/admin/dashboard'
                        ? 'border-indigo-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 hover:scale-105`}
                  >
                    Admin Panel
                  </Link>
                )}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? (
                  <SunIcon className="h-6 w-6" />
                ) : (
                  <MoonIcon className="h-6 w-6" />
                )}
              </button>
              
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-600">
                <UserCircleIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.firstName} {user.lastName}
                  {role === 'admin' && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full">
                      Admin
                    </span>
                  )}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transform hover:scale-105 transition-all duration-300"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1.5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout; 