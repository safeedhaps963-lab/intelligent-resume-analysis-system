/**
 * ATSConverter.jsx - ATS Resume Converter Component
 * ================================================
 * Allows users to upload a resume and convert it to ATS-friendly format.
 *
 * Features:
 * - File upload (PDF, DOCX, TXT)
 * - Optional job keywords input
 * - Real-time conversion
 * - Download converted resume
 */

import React, { useState } from 'react';
import { FaUpload, FaDownload, FaMagic, FaFileAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ATSConverter = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobKeywords, setJobKeywords] = useState('');
  const [convertedResume, setConvertedResume] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStats, setConversionStats] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      const allowedExtensions = ['.pdf', '.docx', '.txt'];

      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);

      if (!isValidType) {
        toast.error('Please select a valid resume file (PDF, DOCX, or TXT)');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setConvertedResume('');
      setConversionStats(null);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      toast.error('Please select a resume file first');
      return;
    }

    setIsConverting(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Add job keywords if provided
      if (jobKeywords.trim()) {
        const keywords = jobKeywords.split(',').map(k => k.trim()).filter(k => k);
        formData.append('job_keywords', JSON.stringify(keywords));
      }

      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found. Please log in.');
        setIsConverting(false);
        return;
      }

      const response = await fetch('/api/resume/convert-ats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setConvertedResume(data.data.ats_resume);
        setConversionStats({
          originalLength: data.data.original_length,
          convertedLength: data.data.converted_length
        });
        toast.success('Resume converted successfully!');
      } else {
        console.error('Response error:', data);
        toast.error(data.message || 'Conversion failed');
      }
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error('Failed to convert resume. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedResume) return;

    const blob = new Blob([convertedResume], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ats-friendly-resume.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('ATS-friendly resume downloaded!');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <FaMagic className="text-purple-600 text-3xl mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">ATS Resume Converter</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Transform your resume into ATS-friendly format for better job application success
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.docx,.txt"
              className="hidden"
              id="resume-upload"
            />
            <label htmlFor="resume-upload" className="cursor-pointer">
              <FaUpload className="text-gray-400 text-4xl mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {selectedFile ? selectedFile.name : 'Click to upload your resume'}
              </p>
              <p className="text-sm text-gray-500">
                Supports PDF, DOCX, and TXT files (max 10MB)
              </p>
            </label>
          </div>
        </div>

        {/* Job Keywords Input */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Keywords (Optional)
          </label>
          <textarea
            value={jobKeywords}
            onChange={(e) => setJobKeywords(e.target.value)}
            placeholder="Enter job-specific keywords separated by commas (e.g., Python, React, Machine Learning)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={3}
          />
          <p className="text-sm text-gray-500 mt-1">
            These keywords will be integrated into your ATS-friendly resume
          </p>
        </div>

        {/* Convert Button */}
        <div className="text-center mb-8">
          <button
            onClick={handleConvert}
            disabled={!selectedFile || isConverting}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
              !selectedFile || isConverting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg'
            }`}
          >
            {isConverting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Converting...
              </div>
            ) : (
              <div className="flex items-center">
                <FaMagic className="mr-2" />
                Convert to ATS-Friendly
              </div>
            )}
          </button>
        </div>

        {/* Results Section */}
        {convertedResume && (
          <div className="border-t pt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <FaFileAlt className="mr-2 text-green-600" />
                ATS-Friendly Resume
              </h2>
              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FaDownload className="mr-2" />
                Download
              </button>
            </div>

            {/* Stats */}
            {conversionStats && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Original Length:</span>
                    <span className="ml-2 text-gray-600">{conversionStats.originalLength} characters</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Converted Length:</span>
                    <span className="ml-2 text-gray-600">{conversionStats.convertedLength} characters</span>
                  </div>
                </div>
              </div>
            )}

            {/* Resume Preview */}
            <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {convertedResume}
              </pre>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p className="font-medium mb-2">ATS-Friendly Features:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Standard section headers (CONTACT, SUMMARY, EXPERIENCE, etc.)</li>
                <li>Clean, readable formatting without complex elements</li>
                <li>Keyword optimization for better ATS matching</li>
                <li>Plain text format for maximum compatibility</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ATSConverter;