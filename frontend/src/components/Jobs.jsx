import React, { useState, useEffect } from 'react';
import { FaBriefcase, FaMapMarkerAlt, FaDollarSign, FaExternalLinkAlt, FaSpinner, FaUpload, FaFilePdf, FaFileWord, FaCheckCircle, FaTrashAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { jobsAPI, resumeAPI } from '../services/api';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [matchFilter, setMatchFilter] = useState(40);
  const [resumeInfo, setResumeInfo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchJobRecommendations();
  }, []);

  const fetchJobRecommendations = async (minMatch = 40) => {
    setIsLoading(true);
    try {
      const data = await jobsAPI.getRecommendations(15, minMatch);
      setJobs(data.data);
      setResumeInfo(data.resume_info);
      if (data.total > 0) {
        toast.success(`Found ${data.total} job recommendations!`);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch job recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setMatchFilter(newFilter);
    fetchJobRecommendations(newFilter);
  };

  const getMatchScoreInfo = (score) => {
    if (score >= 80) return { color: 'text-green-600', bg: 'bg-green-100', bar: 'bg-green-500', label: 'Highly Recommended' };
    if (score >= 60) return { color: 'text-orange-600', bg: 'bg-orange-100', bar: 'bg-orange-500', label: 'Good Match' };
    return { color: 'text-red-600', bg: 'bg-red-100', bar: 'bg-red-500', label: 'Low Match' };
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF or DOCX.');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload
      const uploadRes = await resumeAPI.upload(file, (progress) => {
        setUploadProgress(progress);
      });

      // 2. Analyze
      toast.loading('Analyzing your resume...', { id: 'analyze' });
      await resumeAPI.analyze(uploadRes.data.resume_id);
      toast.success('Resume analyzed successfully!', { id: 'analyze' });

      // 3. Refresh jobs
      fetchJobRecommendations(matchFilter);
    } catch (error) {
      console.error('Upload/Analysis error:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to process resume. Please try again.';
      toast.error(errorMsg, { id: 'analyze' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <FaBriefcase className="text-purple-600 text-3xl mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Job Recommendations</h1>
        </div>

        {/* Resume Status / Upload Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                {resumeInfo ? <FaCheckCircle className="text-3xl text-green-300" /> : <FaUpload className="text-3xl" />}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {resumeInfo ? 'Your AI Profile is Active' : 'Boost Your Job Matches'}
                </h2>
                <p className="text-purple-100 text-sm opacity-90">
                  {resumeInfo
                    ? `Matching based on: ${resumeInfo.filename}`
                    : 'Upload your resume to get personalized job recommendations.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <label className={`
                cursor-pointer px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2
                ${isUploading ? 'bg-white/10 opacity-50 cursor-not-allowed' : 'bg-white text-purple-700 hover:bg-purple-50 shadow-lg hover:scale-105 active:scale-95'}
              `}>
                {isUploading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Processing {uploadProgress}%</span>
                  </>
                ) : (
                  <>
                    <FaUpload />
                    <span>{resumeInfo ? 'Replace Resume' : 'Upload Resume'}</span>
                  </>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
              {resumeInfo && (
                <p className="text-[10px] text-purple-200">
                  Last updated: {new Date(resumeInfo.analysis_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {isUploading && (
            <div className="mt-6">
              <div className="flex justify-between text-xs mb-1">
                <span>Analyzing skills and experience...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Min Match Score</p>
              <div className="flex flex-wrap gap-2">
                {[40, 50, 60, 70, 80].map((score) => (
                  <button
                    key={score}
                    onClick={() => handleFilterChange(score)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${matchFilter === score
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {score}%+
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <FaSpinner className="text-4xl text-purple-600 animate-spin mb-4" />
          <p className="text-gray-500 animate-pulse">Finding your perfect match...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaBriefcase className="text-4xl text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Matching Jobs Found</h3>
          <p className="text-gray-500 max-w-sm mx-auto">We couldn't find any jobs matching your profile at the {matchFilter}% threshold. Try lowering the match filter or updating your resume.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {jobs.map((job, index) => {
            const jobId = String(job.id || index);
            const title = String(job.title || 'Job Title');
            const company = String(job.company || 'Company');
            const location = String(job.location || 'Location');
            const salary = String(job.salary || 'Salary');
            const matchScore = Number(job.match_score) || 0;
            const applyUrl = String(job.apply_url || '#');
            const scoreInfo = getMatchScoreInfo(matchScore);

            return (
              <div
                key={jobId}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all p-6 border border-gray-100 overflow-hidden relative"
              >
                {/* Score Banner */}
                <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-wider ${scoreInfo.bg} ${scoreInfo.color}`}>
                  {scoreInfo.label}
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-extrabold text-gray-900 leading-tight mb-1">{title}</h3>
                        <p className="text-purple-600 font-bold">{company}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mb-6 text-sm font-medium text-gray-500">
                      <div className="flex items-center">
                        <FaMapMarkerAlt className="mr-2 text-purple-400" />
                        {location}
                      </div>
                      <div className="flex items-center">
                        <FaDollarSign className="mr-2 text-green-400" />
                        {salary}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <a
                        href={applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 hover:shadow-lg transition-all"
                      >
                        <FaExternalLinkAlt className="mr-2 text-sm" />
                        Apply Now
                      </a>
                      <button
                        onClick={() => toast.success('Job saved!')}
                        className="px-6 py-2.5 bg-gray-50 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all border border-gray-200"
                      >
                        Save for Later
                      </button>
                    </div>
                  </div>

                  {/* Match Score Progress Section */}
                  <div className="md:w-64 flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-6">
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Match Score</span>
                      <span className={`text-2xl font-black ${scoreInfo.color}`}>{matchScore}%</span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full ${scoreInfo.bar} transition-all duration-1000 ease-out`}
                        style={{ width: `${matchScore}%` }}
                      ></div>
                    </div>

                    <p className="text-[10px] text-gray-400 font-medium italic">Based on your latest resume analysis</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Jobs;