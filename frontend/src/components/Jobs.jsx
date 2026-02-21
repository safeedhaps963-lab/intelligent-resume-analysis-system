import React, { useState, useEffect } from 'react';
import { FaBriefcase, FaMapMarkerAlt, FaDollarSign, FaExternalLinkAlt, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { jobsAPI } from '../services/api';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [matchFilter, setMatchFilter] = useState(40);
  const [skillsUsed, setSkillsUsed] = useState([]);

  useEffect(() => {
    fetchJobRecommendations();
  }, []);

  const fetchJobRecommendations = async (minMatch = 40) => {
    setIsLoading(true);
    try {
      const data = await jobsAPI.getRecommendations(15, minMatch);
      setJobs(data.data);
      setSkillsUsed(data.skills_used);
      toast.success(`Found ${data.total} job recommendations!`);
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

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <FaBriefcase className="text-purple-600 text-3xl mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Job Recommendations</h1>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Match Score Filter</p>
              <div className="flex gap-2">
                {[40, 50, 60, 70, 80].map((score) => (
                  <button
                    key={score}
                    onClick={() => handleFilterChange(score)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      matchFilter === score
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {score}%+
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Skills Matched</p>
              <div className="flex flex-wrap gap-2">
                {skillsUsed.slice(0, 5).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
                {skillsUsed.length > 5 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    +{skillsUsed.length - 5} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="text-4xl text-purple-600 animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FaBriefcase className="text-5xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No jobs found matching your criteria</p>
          <p className="text-gray-400 text-sm mt-2">Try analyzing a resume first to get better recommendations</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job, index) => {
            // Safely convert all values to strings
            const jobId = String(job.id || index);
            const title = String(job.title || 'Job Title');
            const company = String(job.company || 'Company');
            const location = String(job.location || 'Location');
            const salary = String(job.salary || 'Salary');
            const matchScore = Number(job.match_score) || 50;
            const applyUrl = String(job.apply_url || '#');

            return (
              <div
                key={jobId}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-l-4 border-purple-600"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{title}</h3>
                    <p className="text-gray-600 font-medium">{company}</p>
                  </div>
                  <div className={`rounded-full w-16 h-16 flex items-center justify-center ${getMatchScoreColor(matchScore)}`}>
                    <span className="text-white font-bold text-lg">{matchScore}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <FaMapMarkerAlt className="mr-2 text-purple-600" />
                    {location}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaDollarSign className="mr-2 text-green-600" />
                    {salary}
                  </div>
                </div>

                <div className="flex gap-3">
                  <a
                    href={applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <FaExternalLinkAlt className="mr-2" />
                    Apply Now
                  </a>
                  <button
                    onClick={() => toast.success('Job saved!')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Save Job
                  </button>
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