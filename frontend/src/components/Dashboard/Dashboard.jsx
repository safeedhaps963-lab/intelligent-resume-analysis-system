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
import { FaChartLine, FaCogs, FaBriefcase, FaLightbulb, FaFilePdf, FaExclamationCircle, FaExternalLinkAlt, FaBuilding, FaMapMarkerAlt } from 'react-icons/fa';
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
          RAS & JR
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Resume Analysis System & Job Recommendation
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

      {/* Latest Resume Insight & Quick Matches */}
      {analysisResults && (
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Latest Resume Card */}
          <div className="lg:col-span-1 bg-white rounded-xl p-6 shadow-lg border-t-4 border-purple-600">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaFilePdf className="mr-2 text-red-500" />
              Latest Analysis
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Resume Profile</p>
                <p className="text-lg font-bold text-purple-700">{analysisResults.category || 'Professional'}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-700 font-medium">ATS Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-purple-200 rounded-full">
                    <div
                      className="h-2 bg-purple-600 rounded-full"
                      style={{ width: `${analysisResults.atsScore || 0}%` }}
                    />
                  </div>
                  <span className="font-bold text-purple-800">{analysisResults.atsScore || 0}%</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/ats-score')}
                className="w-full py-2 text-sm font-bold text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
              >
                View Full Analysis
              </button>
            </div>
          </div>

          {/* Quick Recommendations Card */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-lg border-t-4 border-indigo-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <FaBriefcase className="mr-2 text-indigo-600" />
                Quick Job Matches
              </h3>
              <button
                onClick={() => navigate('/jobs')}
                className="text-indigo-600 text-sm font-bold hover:underline"
              >
                See All
              </button>
            </div>

            <div className="space-y-3">
              {analysisResults.recommendedJobs?.slice(0, 3).map((job, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-indigo-50/30 transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-800 truncate">{job.title}</h4>
                      <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded font-bold">
                        {job.match_score}%
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><FaBuilding className="text-[10px]" /> {job.company}</span>
                      <span className="flex items-center gap-1"><FaMapMarkerAlt className="text-[10px]" /> {job.location}</span>
                    </div>
                  </div>
                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <FaExternalLinkAlt className="text-sm" />
                  </a>
                </div>
              )) || (
                  <p className="text-gray-500 text-sm italic text-center py-4">
                    No recommendations found. Try re-analyzing with a job description.
                  </p>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Feature Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FeatureCard
          title="AI Skill Analysis"
          description="Extract and analyze skills from your resume using advanced NLP"
          icon="🔬"
          gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
          onClick={() => navigate('/skill-analysis')}
        />

        <FeatureCard
          title="ATS Score Prediction"
          description="Get your resume's ATS compatibility score with detailed insights"
          icon="🤖"
          gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
          onClick={() => navigate('/ats-score')}
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

        <FeatureCard
          title="ATS Resume Converter"
          description="Transform your resume into a clean, ATS-optimized document"
          icon="🔄"
          gradient="bg-gradient-to-r from-pink-500 to-rose-500"
          onClick={() => navigate('/converter')}
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
            onClick={() => navigate('/ats-score')}
            className="mt-4 md:mt-0 bg-white text-purple-600 px-8 py-3 rounded-full font-bold
                       hover:bg-purple-100 transition-all duration-300 shadow-lg"
          >
            Get Started →
          </button>
        </div>
      </div>

      {/* Demo Footer Note */}
      <div className="mt-12 text-center text-gray-500 border-t border-gray-200 pt-8 pb-12">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FaExclamationCircle className="text-orange-400" />
          <p className="text-sm font-medium">Project Demo Note</p>
        </div>
        <p className="text-xs max-w-lg mx-auto leading-relaxed">
          The Intelligent Resume Analysis System is a technical demonstration.
          AI-based matching, skill extraction, and ATS scoring are simulated for demonstration purposes.
          Job data is fetched from live APIs where available or provided via mock datasets.
        </p>
      </div>
    </div>
  );
};

// Export the component
export default Dashboard;