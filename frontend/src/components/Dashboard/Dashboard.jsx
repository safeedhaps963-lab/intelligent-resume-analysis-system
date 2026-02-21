/**
 * Dashboard.jsx - Main Dashboard Component
 * ==========================================
 * The landing page of the application showing:
 * - Quick stats overview
 * - Feature cards for navigation
 * - Recent activity summary
 * 
 * This component uses the AppContext to access
 * global state like analysis results and user info.
 */

import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaCogs, FaBriefcase, FaLightbulb } from 'react-icons/fa';
import { AppContext } from '../../App';

/**
 * StatCard - Displays a single statistic
 * 
 * @param {string} title - Stat label
 * @param {string} value - Stat value
 * @param {ReactNode} icon - Icon component
 * @param {string} color - Theme color (purple, blue, green, orange)
 */
const StatCard = ({ title, value, icon, color }) => {
  // Color classes mapping
  const colorClasses = {
    purple: 'text-purple-600 bg-purple-100',
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    orange: 'text-orange-600 bg-orange-100'
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        {/* Value and Label */}
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className={`text-3xl font-bold ${colorClasses[color].split(' ')[0]}`}>
            {value}
          </p>
        </div>
        
        {/* Icon Circle */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

/**
 * FeatureCard - Clickable feature navigation card
 * 
 * @param {string} title - Feature name
 * @param {string} description - Feature description
 * @param {ReactNode} icon - Icon component
 * @param {string} gradient - Tailwind gradient classes
 * @param {function} onClick - Click handler
 */
const FeatureCard = ({ title, description, icon, gradient, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl p-6 shadow-lg cursor-pointer 
                 hover:shadow-xl transition-all duration-300 hover:-translate-y-2
                 border-2 border-transparent hover:border-purple-500"
    >
      {/* Icon Container with Floating Animation */}
      <div 
        className={`w-16 h-16 ${gradient} rounded-xl flex items-center justify-center mb-4
                    animate-pulse`}
      >
        <span className="text-white text-2xl">{icon}</span>
      </div>
      
      {/* Title and Description */}
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
};

/**
 * Dashboard Component
 * 
 * Main dashboard view with stats and feature navigation.
 * Accesses global state through AppContext.
 */
const Dashboard = () => {
  // Access global state from context
  const { analysisResults } = useContext(AppContext);
  
  // Navigation hook for programmatic routing
  const navigate = useNavigate();
  
  // Calculate stats from analysis results
  const atsScore = analysisResults?.atsScore || '--';
  const skillsCount = analysisResults?.skills 
    ? Object.values(analysisResults.skills).reduce((acc, cat) => acc + (cat.skills?.length || 0), 0)
    : '--';
  const jobMatches = analysisResults?.matchingJobs || '--';
  const improvements = analysisResults?.recommendations?.filter(r => r.type === 'improvement').length || '--';

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          Intelligent Resume Analysis System
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          AI-powered resume analysis, ATS optimization, and smart job recommendations
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <StatCard 
          title="ATS Score" 
          value={typeof atsScore === 'number' ? `${atsScore}%` : atsScore}
          icon={<FaChartLine />}
          color="purple"
        />
        <StatCard 
          title="Skills Detected" 
          value={skillsCount}
          icon={<FaCogs />}
          color="blue"
        />
        <StatCard 
          title="Job Matches" 
          value={jobMatches}
          icon={<FaBriefcase />}
          color="green"
        />
        <StatCard 
          title="Improvements" 
          value={improvements}
          icon={<FaLightbulb />}
          color="orange"
        />
      </div>

      {/* Feature Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FeatureCard
          title="AI Skill Analysis"
          description="Extract and analyze skills from your resume using advanced NLP"
          icon="🔬"
          gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
          onClick={() => navigate('/analyzer')}
        />
        
        <FeatureCard
          title="ATS Score Prediction"
          description="Get your resume's ATS compatibility score with detailed insights"
          icon="🤖"
          gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
          onClick={() => navigate('/analyzer')}
        />
        
        <FeatureCard
          title="Smart Resume Builder"
          description="Build ATS-friendly resumes with AI-powered suggestions"
          icon="✨"
          gradient="bg-gradient-to-r from-green-500 to-emerald-500"
          onClick={() => navigate('/builder')}
        />
        
        <FeatureCard
          title="Job Recommendations"
          description="Get personalized job matches based on your skills profile"
          icon="💼"
          gradient="bg-gradient-to-r from-orange-500 to-red-500"
          onClick={() => navigate('/jobs')}
        />
      </div>

      {/* Getting Started Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Ready to optimize your resume?</h2>
            <p className="text-purple-200">
              Upload your resume and get instant AI-powered feedback
            </p>
          </div>
          <button 
            onClick={() => navigate('/analyzer')}
            className="mt-4 md:mt-0 bg-white text-purple-600 px-8 py-3 rounded-full font-bold
                       hover:bg-purple-100 transition-all duration-300 shadow-lg"
          >
            Get Started →
          </button>
        </div>
      </div>
    </div>
  );
};

// Export the component
export default Dashboard;