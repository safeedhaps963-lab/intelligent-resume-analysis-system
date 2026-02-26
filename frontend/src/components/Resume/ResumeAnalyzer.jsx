/**
 * ResumeAnalyzer.jsx - Resume Analysis Component
 * ================================================
 * Main component for resume upload and analysis.
 * 
 * Features:
 * - Drag and drop file upload
 * - Job description input for matching
 * - AI skill extraction display
 * - ATS score visualization
 * - Missing skills analysis
 * - Improvement recommendations
 */

import React, { useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  FaUpload, FaFilePdf, FaTimes, FaBrain, FaChartPie,
  FaCogs, FaLightbulb, FaPuzzlePiece, FaArrowLeft,
  FaPlus, FaExclamationCircle, FaStar, FaUserTie,
  FaMagic, FaBriefcase, FaBuilding, FaMapMarkerAlt, FaExternalLinkAlt
} from 'react-icons/fa';
import { AppContext } from '../../App';
import { resumeAPI, jobsAPI } from '../../services/api';

/**
 * ATSScoreCircle - Animated circular progress for ATS score
 * 
 * @param {number} score - ATS score (0-100)
 */
const ATSScoreCircle = ({ score }) => {
  // Calculate stroke offset for circular progress
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        {/* SVG Circle */}
        <svg className="w-40 h-40 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="80" cy="80" r="70"
            stroke="#e5e7eb"
            strokeWidth="10"
            fill="none"
          />
          {/* Progress circle with gradient */}
          <circle
            cx="80" cy="80" r="70"
            stroke="url(#gradient)"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              transition: 'stroke-dashoffset 1.5s ease-out'
            }}
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#667eea' }} />
              <stop offset="100%" style={{ stopColor: '#764ba2' }} />
            </linearGradient>
          </defs>
        </svg>

        {/* Score text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {score}%
            </span>
            <p className="text-gray-500 text-sm">ATS Score</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * SkillCategory - Displays skills with progress bar
 * 
 * @param {string} category - Category name
 * @param {object} data - Skills data with skills array and score
 */
const SkillCategory = ({ category, data }) => {
  // Format category name (e.g., 'programming_languages' -> 'Programming Languages')
  const formatCategoryName = (cat) => {
    return cat.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-gray-700">{formatCategoryName(category)}</span>
        <span className="text-sm text-purple-600 font-medium">{data.score}%</span>
      </div>

      {/* Skill tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {data.skills.map((skill, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-1000"
          style={{ width: `${data.score}%` }}
        />
      </div>
    </div>
  );
};

/**
 * MissingSkillsSection - Displays missing skills analysis
 * 
 * @param {object} missingSkills - Missing skills data
 * @param {function} onAddSkill - Handler to add skill to builder
 * @param {function} onAddAll - Handler to add all skills
 */
const MissingSkillsSection = ({ missingSkills, onAddSkill, onAddAll }) => {
  // If no job description was provided
  if (!missingSkills?.hasJobDescription) {
    return (
      <div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <FaExclamationCircle className="text-yellow-500 mt-1 mr-3" />
            <div>
              <p className="font-medium text-yellow-800">No Job Description Provided</p>
              <p className="text-sm text-yellow-700 mt-1">
                Add a target job description above to get personalized missing skills analysis.
              </p>
            </div>
          </div>
        </div>

        {/* Default suggestions */}
        <div className="mt-4">
          <p className="font-medium text-gray-700 mb-3">💡 Generally Recommended Skills:</p>
          <div className="flex flex-wrap gap-2">
            {[...missingSkills.critical, ...missingSkills.recommended].map((skill, i) => (
              <button
                key={i}
                onClick={() => onAddSkill(skill, 'technical')}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm 
                         hover:bg-blue-200 transition-all flex items-center gap-2 group"
              >
                <span>{skill}</span>
                <FaPlus className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate color based on match percentage
  const matchColor = missingSkills.matchPercentage >= 70 ? 'green' :
    missingSkills.matchPercentage >= 50 ? 'yellow' : 'red';

  return (
    <div>
      {/* Match Score Header */}
      <div className={`bg-${matchColor}-50 border border-${matchColor}-200 rounded-lg p-4 mb-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm text-${matchColor}-700 font-medium`}>Skills Match Score</p>
            <p className={`text-3xl font-bold text-${matchColor}-600`}>
              {missingSkills.matchPercentage}%
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm text-${matchColor}-600`}>
              {missingSkills.matchedSkills} of {missingSkills.totalJobSkills} skills matched
            </p>
            <div className={`w-32 bg-${matchColor}-200 rounded-full h-2 mt-2`}>
              <div
                className={`bg-${matchColor}-500 h-2 rounded-full transition-all duration-1000`}
                style={{ width: `${missingSkills.matchPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Critical Missing Skills */}
      {missingSkills.critical.length > 0 ? (
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2" />
            <span className="font-bold text-gray-800">Critical Skills Missing</span>
            <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
              {missingSkills.critical.length} skills
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            These skills are frequently mentioned as requirements.
          </p>
          <div className="flex flex-wrap gap-2">
            {missingSkills.critical.map((skill, i) => (
              <button
                key={i}
                onClick={() => onAddSkill(skill, 'technical')}
                className="px-3 py-2 bg-red-50 border-2 border-red-200 text-red-700 
                         rounded-lg text-sm hover:bg-red-100 hover:border-red-300 
                         transition-all flex items-center gap-2 group"
              >
                <FaExclamationCircle className="text-red-500" />
                <span>{skill}</span>
                <FaPlus className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-green-500 mr-3 text-xl">✓</span>
            <div>
              <p className="font-medium text-green-800">All Critical Skills Present!</p>
              <p className="text-sm text-green-700">
                Your resume contains all the critical skills mentioned in the job description.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Missing Skills */}
      {missingSkills.recommended.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <span className="w-3 h-3 bg-orange-500 rounded-full mr-2" />
            <span className="font-bold text-gray-800">Recommended Skills</span>
            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
              {missingSkills.recommended.length} skills
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {missingSkills.recommended.map((skill, i) => (
              <button
                key={i}
                onClick={() => onAddSkill(skill, 'technical')}
                className="px-3 py-2 bg-orange-50 border-2 border-orange-200 text-orange-700 
                         rounded-lg text-sm hover:bg-orange-100 hover:border-orange-300 
                         transition-all flex items-center gap-2 group"
              >
                <FaStar className="text-orange-400" />
                <span>{skill}</span>
                <FaPlus className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Soft Skills */}
      {missingSkills.soft.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center mb-3">
            <span className="w-3 h-3 bg-purple-500 rounded-full mr-2" />
            <span className="font-bold text-gray-800">Soft Skills to Highlight</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {missingSkills.soft.map((skill, i) => (
              <button
                key={i}
                onClick={() => onAddSkill(skill, 'soft')}
                className="px-3 py-2 bg-purple-50 border-2 border-purple-200 text-purple-700 
                         rounded-lg text-sm hover:bg-purple-100 hover:border-purple-300 
                         transition-all flex items-center gap-2 group"
              >
                <FaUserTie className="text-purple-400" />
                <span>{skill}</span>
                <FaPlus className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add All Button */}
      {(missingSkills.critical.length > 0 || missingSkills.recommended.length > 0) && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onAddAll}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white 
                     py-3 rounded-xl font-bold hover:opacity-90 transition-all 
                     flex items-center justify-center"
          >
            <FaMagic className="mr-2" />
            Add All Missing Skills to Resume Builder
          </button>
          <p className="text-center text-sm text-gray-500 mt-2">
            This will add all missing skills to your resume builder
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * ResumeAnalyzer - Main Component
 */
const ResumeAnalyzer = () => {
  // State
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  // Context and navigation
  const { setAnalysisResults, addNotification } = useContext(AppContext);
  const navigate = useNavigate();

  // File drop handler
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];

      // Validate file type (Strictly PDF and DOCX only)
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Invalid file type. Please upload PDF or DOCX only.');
        return;
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size too large. Limit is 5MB.');
        return;
      }

      setFile(selectedFile);
      toast.success(`${selectedFile.name} uploaded successfully`);
    }
  }, []);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  // Remove file handler
  const removeFile = () => {
    setFile(null);
    setResults(null);
  };

  // Analyze resume handler
  const analyzeResume = async () => {
    if (!file) {
      toast.error('Please upload a resume first');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Upload file
      const uploadResponse = await resumeAPI.upload(file);

      // Analyze
      const analysisResponse = await resumeAPI.analyze(
        uploadResponse.data.resume_id,
        jobDescription
      );

      // Get ATS score
      const atsResponse = await resumeAPI.getATSScore(
        uploadResponse.data.resume_id,
        jobDescription
      );

      // Handle missing skills format
      let missingSkillsData;
      if (analysisResponse.data.missing_skills_detailed) {
        // New detailed format from backend
        missingSkillsData = analysisResponse.data.missing_skills_detailed;
      } else if (Array.isArray(analysisResponse.data.missing_skills)) {
        // Legacy format fallback
        missingSkillsData = {
          critical: analysisResponse.data.missing_skills.slice(0, 3),
          recommended: analysisResponse.data.missing_skills.slice(3, 6),
          soft: analysisResponse.data.missing_skills.slice(6),
          hasJobDescription: !!jobDescription,
          matchPercentage: analysisResponse.data.match_score || 0,
          totalJobSkills: 0,
          matchedSkills: 0
        };
      } else {
        missingSkillsData = {
          critical: [],
          recommended: [],
          soft: [],
          hasJobDescription: !!jobDescription,
          matchPercentage: 0
        };
      }

      // Combine results
      const combinedResults = {
        ...analysisResponse.data,
        atsScore: atsResponse.data.overall_score,
        atsBreakdown: atsResponse.data.breakdown,
        recommendations: atsResponse.data.recommendations,
        missingSkills: missingSkillsData
      };

      // Fetch job recommendations after analysis
      let recommendedJobs = [];
      try {
        const jobsResponse = await jobsAPI.getRecommendations(5, 40);
        if (jobsResponse.success) {
          recommendedJobs = jobsResponse.data;
        }
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      }

      setResults({
        ...combinedResults,
        recommendedJobs
      });
      setAnalysisResults({
        ...combinedResults,
        recommendedJobs
      });

      addNotification({
        type: 'success',
        title: 'Analysis Complete',
        message: `ATS Score: ${combinedResults.atsScore}%`
      });

    } catch (error) {
      console.error('Analysis error:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Analysis failed';
      toast.error(`Error: ${errorMsg}`);

      // Do NOT simulate on error in production setup to avoid confusion
      // simulateAnalysis();
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Simulated analysis for demo
  const simulateAnalysis = () => {
    const simulatedResults = {
      skills: {
        programming: { skills: ['Python', 'JavaScript', 'TypeScript'], score: 85 },
        frameworks: { skills: ['React', 'Node.js', 'Flask'], score: 78 },
        databases: { skills: ['MongoDB', 'PostgreSQL'], score: 72 },
        cloud: { skills: ['AWS', 'Docker'], score: 68 }
      },
      atsScore: 84,
      atsBreakdown: {
        keywords: { score: 82, label: 'Keyword Optimization' },
        formatting: { score: 88, label: 'Format & Structure' },
        experience: { score: 75, label: 'Experience Relevance' },
        education: { score: 90, label: 'Education Match' },
        skills: { score: 85, label: 'Skills Coverage' }
      },
      recommendations: [
        { type: 'improvement', title: 'Add Quantifiable Achievements', description: 'Include metrics' },
        { type: 'improvement', title: 'Add Missing Keywords', description: 'Consider adding CI/CD' },
        { type: 'success', title: 'Strong Technical Skills', description: 'Well optimized' }
      ],
      missingSkills: {
        critical: jobDescription ? ['GraphQL', 'Kubernetes', 'CI/CD'] : ['Docker', 'CI/CD'],
        recommended: jobDescription ? ['Terraform', 'Redis'] : ['GraphQL', 'Microservices'],
        soft: ['Leadership', 'Public Speaking'],
        hasJobDescription: !!jobDescription,
        matchPercentage: jobDescription ? 72 : 0,
        totalJobSkills: jobDescription ? 15 : 0,
        matchedSkills: jobDescription ? 11 : 0
      }
    };

    setResults(simulatedResults);
    setAnalysisResults(simulatedResults);
  };

  // Add skill to builder
  const handleAddSkill = (skill, type) => {
    toast.success(`${skill} added to resume builder`);
    // In full implementation, this would update builder state
  };

  // Add all missing skills
  const handleAddAllSkills = () => {
    if (!results?.missingSkills) return;

    const total =
      results.missingSkills.critical.length +
      results.missingSkills.recommended.length +
      results.missingSkills.soft.length;

    toast.success(`Added ${total} skills to resume builder`);
    navigate('/builder');
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Resume Analyzer</h2>
          <p className="text-gray-600">Upload your resume for AI-powered analysis</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-purple-600 hover:text-purple-800 flex items-center"
        >
          <FaArrowLeft className="mr-2" />
          Back to Dashboard
        </button>
      </div>

      {/* Demo Note */}
      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-8 rounded-r-lg">
        <div className="flex items-center">
          <FaExclamationCircle className="text-indigo-500 mr-3" />
          <p className="text-indigo-700 text-sm font-medium">
            <span className="font-bold">Project Demo:</span> AI-based skill extraction and job matching is simulated for demonstration purposes.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <FaUpload className="mr-2 text-purple-600" />
            Upload Resume
          </h3>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer 
                       transition-all ${isDragActive
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-300 hover:border-purple-500'}`}
          >
            <input {...getInputProps()} />
            <FaUpload className="text-5xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume here'}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              or click to browse (PDF, DOC, DOCX, TXT)
            </p>
          </div>

          {/* File Info */}
          {file && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <FaFilePdf className="text-red-500 text-2xl mr-3" />
                <div>
                  <p className="font-medium text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button onClick={removeFile} className="text-red-500 hover:text-red-700">
                <FaTimes />
              </button>
            </div>
          )}

          {/* Job Description */}
          <div className="mt-6">
            <label className="block text-gray-700 font-medium mb-2">
              <FaBriefcase className="inline mr-2 text-blue-600" />
              Target Job Description (Optional)
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 
                       focus:ring-purple-500 focus:border-transparent"
              rows="4"
              placeholder="Paste the job description here for better matching analysis..."
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={analyzeResume}
            disabled={isAnalyzing}
            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 
                     text-white py-4 rounded-xl font-bold hover:opacity-90 
                     transition-all flex items-center justify-center disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <FaBrain className="mr-2" />
                Analyze Resume
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* ATS Score Card */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaChartPie className="mr-2 text-blue-600" />
              ATS Score Prediction
            </h3>

            {/* AI Profile Category */}
            {results?.category && (
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-white shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-xs font-bold uppercase tracking-wider">AI Categorized Profile</p>
                    <h4 className="text-2xl font-black">{results.category}</h4>
                  </div>
                  <FaUserTie className="text-4xl opacity-50" />
                </div>
              </div>
            )}

            {results ? (
              <>
                <ATSScoreCircle score={results.atsScore} />

                {/* Breakdown */}
                <div className="mt-6 space-y-3">
                  {Object.values(results.atsBreakdown).map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-medium">{item.score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600"
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Upload a resume to see ATS score
              </p>
            )}
          </div>

          {/* Skills Analysis */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaCogs className="mr-2 text-green-600" />
              Detected Skills
            </h3>

            {results?.skills ? (
              Object.entries(results.skills).map(([category, data]) => (
                <SkillCategory key={category} category={category} data={data} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                Upload a resume to see skill analysis
              </p>
            )}
          </div>

          {/* Missing Skills */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaPuzzlePiece className="mr-2 text-red-500" />
              Missing Skills Analysis
            </h3>

            {results?.missingSkills ? (
              <MissingSkillsSection
                missingSkills={results.missingSkills}
                onAddSkill={handleAddSkill}
                onAddAll={handleAddAllSkills}
              />
            ) : (
              <p className="text-gray-500 text-center py-8">
                Add a job description to see missing skills
              </p>
            )}
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaLightbulb className="mr-2 text-orange-600" />
              AI Recommendations
            </h3>

            {results?.recommendations ? (
              <div className="space-y-3">
                {results.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                    <span className={`mr-3 ${rec.type === 'success' ? 'text-green-500' : 'text-orange-500'
                      }`}>
                      {rec.type === 'success' ? '✓' : '⚠'}
                    </span>
                    <div>
                      <p className="font-medium text-gray-800">{rec.title}</p>
                      <p className="text-sm text-gray-600">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Recommendations will appear after analysis
              </p>
            )}
          </div>

          {/* Job Recommendations */}
          {results?.recommendedJobs && results.recommendedJobs.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaBriefcase className="mr-2 text-purple-600" />
                Intelligent Job Matches
              </h3>
              <div className="space-y-4">
                {results.recommendedJobs.map((job, index) => (
                  <div key={index} className="p-4 border border-gray-100 rounded-xl hover:border-purple-200 hover:bg-purple-50/30 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors capitalize">
                        {job.title}
                      </h4>
                      <div className="flex items-center bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {job.match_score}% Match
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-y-1 gap-x-4 text-xs text-gray-500 mb-3">
                      <span className="flex items-center"><FaBuilding className="mr-1" /> {job.company}</span>
                      <span className="flex items-center"><FaMapMarkerAlt className="mr-1" /> {job.location}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-green-600">{job.salary}</span>
                      <a
                        href={job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Apply Now <FaExternalLinkAlt className="ml-1.5 text-[10px]" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;