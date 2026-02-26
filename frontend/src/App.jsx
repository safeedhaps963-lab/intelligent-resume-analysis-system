import React, { useState, useEffect, createContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Builder from "./components/Builder";
import Navbar from "./components/Common/Navbar";
import Dashboard from "./components/Dashboard/Dashboard";
import ResumeAnalyzer from "./components/Resume/ResumeAnalyzer";
import ATSScorePage from "./components/Resume/ATSScorePage";
import SkillAnalysisPage from "./components/Resume/SkillAnalysisPage";
import ATSConverter from "./components/Resume/ATSConverter";
import Jobs from "./components/Jobs";

import Feedback from "./components/Feedback";
import Login from "./components/Login";
import AuthGuard from "./components/Common/AuthGuard";
import AdminGuard from "./components/Common/AdminGuard";
import UserGuard from "./components/Common/UserGuard";
import { authAPI } from "./services/api";
import AdminDashboard from "./components/Admin/AdminDashboard";
import UserList from "./components/Admin/UserList";
import FeedbackList from "./components/Admin/FeedbackList";
import ResumeList from "./components/Admin/ResumeList";
import ATSResumeList from "./components/Admin/ATSResumeList";
import RecommendationList from "./components/Admin/RecommendationList";

import "./index.css";

// Create Global Context
export const AppContext = createContext(null);

function AppContent() {

  // 📊 Resume Analysis State
  const [analysisResults, setAnalysisResults] = useState(null);

  // Reintroduce authentication state so root shows Login first when not signed in
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('access_token') || !!localStorage.getItem('authToken') || !!localStorage.getItem('token')
  );
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'user');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');

  // Sync auth state with localStorage and listen for logout events
  useEffect(() => {
    const validateAuth = async () => {
      const token = localStorage.getItem('access_token') || localStorage.getItem('authToken') || localStorage.getItem('token');
      if (token) {
        try {
          const data = await authAPI.validateToken(token);
          if (data.valid) {
            setIsAuthenticated(true);
            const role = data.user?.role || 'user';
            const name = data.user?.name || '';
            setUserRole(role);
            setUserName(name);
            localStorage.setItem('userRole', role);
            if (name) localStorage.setItem('userName', name);
          } else {
            handleLogout();
          }
        } catch (err) {
          console.error('Auth validation failed', err);
        }
      }
    };

    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem('access_token') || !!localStorage.getItem('authToken') || !!localStorage.getItem('token'));
      setUserRole(localStorage.getItem('userRole') || 'user');
      setUserName(localStorage.getItem('userName') || '');
    };

    const onAuthLogout = () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      setAnalysisResults(null); // Clear session data
      setIsAuthenticated(false);
      setUserRole('user');
      setUserName('');
    };

    validateAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('auth:logout', onAuthLogout);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth:logout', onAuthLogout);
    };
  }, []);


  // Login/logout removed: no logout handler
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    setUserRole('user');
    // broadcast for other listeners
    window.dispatchEvent(new CustomEvent('auth:logout'));
  };



  return (
    <AppContext.Provider
      value={{
        analysisResults,
        setAnalysisResults,
        // auth removed
        handleLogout,
        isAuthenticated,
        setIsAuthenticated,
        userRole,
        setUserRole,
        userName,
        setUserName
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
                  {userRole === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />}
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard"
              element={
                <UserGuard>
                  <Dashboard />
                </UserGuard>
              }
            />
            <Route
              path="/analyzer"
              element={
                <UserGuard>
                  <ResumeAnalyzer />
                </UserGuard>
              }
            />
            <Route
              path="/ats-score"
              element={
                <UserGuard>
                  <ATSScorePage />
                </UserGuard>
              }
            />
            <Route
              path="/skill-analysis"
              element={
                <UserGuard>
                  <SkillAnalysisPage />
                </UserGuard>
              }
            />
            <Route
              path="/builder"
              element={
                <UserGuard>
                  <Builder />
                </UserGuard>
              }
            />
            <Route
              path="/converter"
              element={
                <UserGuard>
                  <ATSConverter />
                </UserGuard>
              }
            />
            <Route
              path="/feedback"
              element={
                <UserGuard>
                  <Feedback />
                </UserGuard>
              }
            />
            <Route
              path="/jobs"
              element={
                <UserGuard>
                  <Jobs />
                </UserGuard>
              }
            />
            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminGuard>
                  <UserList />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/feedback"
              element={
                <AdminGuard>
                  <FeedbackList />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/resumes"
              element={
                <AdminGuard>
                  <ResumeList />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/ats-resumes"
              element={
                <AdminGuard>
                  <ATSResumeList />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/recommendations"
              element={
                <AdminGuard>
                  <RecommendationList />
                </AdminGuard>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>


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