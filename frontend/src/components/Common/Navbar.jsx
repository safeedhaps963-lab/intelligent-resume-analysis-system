/**
 * Navbar.jsx - Navigation Bar Component
 */

import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaBrain, FaHome, FaSearchPlus, FaFileAlt,
  FaBriefcase, FaBars, FaTimes, FaMagic, FaSignOutAlt, FaCommentAlt, FaSignInAlt, FaUserShield
} from 'react-icons/fa';
import { AppContext } from '../../App';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Context
  const { isAuthenticated, handleLogout, userRole } = useContext(AppContext);

  const navItems = userRole === 'admin'
    ? [
      { path: '/admin', icon: <FaUserShield />, label: 'Admin Panel' },
      { path: '/admin/users', icon: <FaFileAlt />, label: 'Users' },
      { path: '/admin/feedback', icon: <FaCommentAlt />, label: 'Feedback' },
    ]
    : [
      { path: '/dashboard', icon: <FaHome />, label: 'Dashboard' },
      { path: '/ats-score', icon: <FaSearchPlus />, label: 'ATS Score' },
      { path: '/skill-analysis', icon: <FaBrain />, label: 'Skill Analysis' },
      { path: '/converter', icon: <FaMagic />, label: 'ATS Converter' },
      { path: '/builder', icon: <FaFileAlt />, label: 'Builder' },
      { path: '/jobs', icon: <FaBriefcase />, label: 'Jobs' },
      { path: '/feedback', icon: <FaCommentAlt />, label: 'Feedback' },
    ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link to={userRole === 'admin' ? "/admin" : "/dashboard"} className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <FaBrain className="text-purple-600 text-xl" />
            </div>
            <span className="text-xl font-bold">RAS & JR</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all
                  ${isActive(item.path)
                    ? 'bg-white/20 font-medium'
                    : 'hover:bg-white/10'}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}


            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-all font-medium"
                title="Logout"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all font-medium"
              >
                <FaSignInAlt />
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-4 py-4 bg-purple-700 border-t border-purple-500/30">
          <div className="flex flex-col space-y-2">
            {isAuthenticated && navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
                  ${isActive(item.path)
                    ? 'bg-white/20 font-medium'
                    : 'hover:bg-white/10'}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}

            <div className="pt-2">
              {isAuthenticated ? (
                <button
                  onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition-all"
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                >
                  <FaSignInAlt />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
