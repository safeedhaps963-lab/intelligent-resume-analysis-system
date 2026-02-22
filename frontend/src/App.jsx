import React, { useState, useEffect, createContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Builder from "./components/Builder";
import Navbar from "./components/Common/Navbar";
import Dashboard from "./components/Dashboard/Dashboard";
import ResumeAnalyzer from "./components/Resume/ResumeAnalyzer";
import ATSConverter from "./components/Resume/ATSConverter";
import Jobs from "./components/Jobs";
import Notification from "./components/Common/Notification";
import Feedback from "./components/Feedback";
import Login from "./components/Login";
import AuthGuard from "./components/Common/AuthGuard";

import "./index.css";

// Create Global Context
export const AppContext = createContext(null);

function AppContent() {
  // 🔔 Notification State
  const [notifications, setNotifications] = useState([]);

  // 📊 Resume Analysis State
  const [analysisResults, setAnalysisResults] = useState(null);

  // Reintroduce authentication state so root shows Login first when not signed in
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('authToken') || !!localStorage.getItem('token')
  );

  // Sync auth state with localStorage and listen for logout events
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem('authToken') || !!localStorage.getItem('token'));
    };

    const onAuthLogout = () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('auth:logout', onAuthLogout);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth:logout', onAuthLogout);
    };
  }, []);

  // Remove notification
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Login/logout removed: no logout handler
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    // broadcast for other listeners
    window.dispatchEvent(new CustomEvent('auth:logout'));
  };

  // Authentication state remains tracked, but app no longer forces a login page.
  // The app renders regardless of `isAuthenticated` so the login page has been removed.

  return (
    <AppContext.Provider
      value={{
        notifications,
        setNotifications,
        removeNotification,
        analysisResults,
        setAnalysisResults,
        // auth removed
        handleLogout,
        isAuthenticated,
        setIsAuthenticated,
      }}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <Navbar />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route
              path="/"
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              }
            />
            <Route
              path="/analyzer"
              element={
                <AuthGuard>
                  <ResumeAnalyzer />
                </AuthGuard>
              }
            />
            <Route
              path="/builder"
              element={
                <AuthGuard>
                  <Builder />
                </AuthGuard>
              }
            />
            <Route
              path="/converter"
              element={
                <AuthGuard>
                  <ATSConverter />
                </AuthGuard>
              }
            />
            <Route
              path="/feedback"
              element={
                <AuthGuard>
                  <Feedback />
                </AuthGuard>
              }
            />
            <Route
              path="/jobs"
              element={
                <AuthGuard>
                  <Jobs />
                </AuthGuard>
              }
            />
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Notifications */}
        <Notification />

        {/* Toast Messages */}
        <Toaster position="top-right" />
      </div>
    </AppContext.Provider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;