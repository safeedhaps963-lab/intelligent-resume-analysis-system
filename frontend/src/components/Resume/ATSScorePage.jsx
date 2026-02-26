import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
    FaUpload, FaFilePdf, FaTimes, FaBrain, FaChartPie,
    FaLightbulb, FaArrowLeft, FaExclamationCircle, FaShieldAlt
} from 'react-icons/fa';
import { resumeAPI } from '../../services/api';
import Breadcrumbs from '../Common/Breadcrumbs';

const ATSScoreCircle = ({ score }) => {
    const circumference = 2 * Math.PI * 70;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex items-center justify-center">
            <div className="relative">
                <svg className="w-48 h-48 transform -rotate-90">
                    <circle cx="96" cy="96" r="70" stroke="#f3f4f6" strokeWidth="12" fill="none" />
                    <circle
                        cx="96" cy="96" r="70"
                        stroke="url(#ats-gradient)"
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: offset,
                            transition: 'stroke-dashoffset 1.5s ease-out'
                        }}
                    />
                    <defs>
                        <linearGradient id="ats-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: '#8b5cf6' }} />
                            <stop offset="100%" style={{ stopColor: '#6366f1' }} />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <span className="text-5xl font-black text-gray-800">{score}%</span>
                        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Match Score</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ATSScorePage = () => {
    const [file, setFile] = useState(null);
    const [existingResume, setExistingResume] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLatest = async () => {
            try {
                const res = await resumeAPI.getLatest();
                if (res.success) {
                    setExistingResume(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch latest resume", err);
            }
        };
        fetchLatest();
    }, []);

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setExistingResume(null); // Clear existing if new one dropped
            toast.success(`${acceptedFiles[0].name} ready for scoring`);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
        maxFiles: 1
    });

    const handleScore = async () => {
        if (!file && !existingResume) {
            toast.error('Please upload or select a resume');
            return;
        }

        setIsAnalyzing(true);
        try {
            let resumeId = existingResume?.id;

            if (file) {
                const uploadRes = await resumeAPI.upload(file);
                resumeId = uploadRes.data.resume_id;
            }

            const res = await resumeAPI.getATSScore(resumeId);
            setResults(res.data);
            toast.success('ATS Scoring complete!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Scoring failed');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getStatus = (score) => {
        if (score >= 80) return { label: 'Good', color: 'text-green-600', bg: 'bg-green-50' };
        if (score >= 60) return { label: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-50' };
        return { label: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-50' };
    };

    return (
        <div className="max-w-6xl mx-auto">
            <Breadcrumbs />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-gray-800">ATS Score Prediction</h2>
                    <p className="text-gray-500 font-medium">Evaluate your resume's compatibility with Applicant Tracking Systems</p>
                </div>
                <button onClick={() => navigate('/')} className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-bold flex items-center transition-all">
                    <FaArrowLeft className="mr-2" /> Back
                </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                            <FaUpload className="mr-3 text-indigo-600" />
                            Upload or Select Resume
                        </h3>

                        {existingResume ? (
                            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                                <div className="flex items-center">
                                    <FaFilePdf className="text-red-500 text-2xl mr-3" />
                                    <div>
                                        <p className="font-bold text-gray-800">{existingResume.filename}</p>
                                        <p className="text-xs text-gray-500">Last uploaded: {new Date(existingResume.upload_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <button onClick={() => setExistingResume(null)} className="text-xs font-bold text-indigo-600 hover:underline">Change</button>
                            </div>
                        ) : (
                            <div {...getRootProps()} className={`border-3 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-400'}`}>
                                <input {...getInputProps()} />
                                <FaUpload className="text-4xl text-gray-300 mx-auto mb-4" />
                                <p className="font-bold text-gray-600">{file ? file.name : 'Drop resume here or click to browse'}</p>
                                <p className="text-xs text-gray-400 mt-2">PDF or DOCX only (Max 5MB)</p>
                            </div>
                        )}


                        <button
                            onClick={handleScore}
                            disabled={isAnalyzing}
                            className="w-full mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-black text-lg shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            {isAnalyzing ? 'Calculating Score...' : 'Predict ATS Score'}
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {results ? (
                        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 animate-fadeIn">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-extrabold text-gray-800">Scoring Analysis</h3>
                                <div className={`px-4 py-1 rounded-full font-bold text-sm ${getStatus(results.overall_score).bg} ${getStatus(results.overall_score).color}`}>
                                    {getStatus(results.overall_score).label}
                                </div>
                            </div>

                            <ATSScoreCircle score={results.overall_score} />

                            <div className="mt-12 space-y-5">
                                {Object.entries(results.breakdown).map(([key, item]) => (
                                    <div key={key}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-gray-500 font-bold text-xs uppercase tracking-wider">{item.label}</span>
                                            <span className="font-black text-indigo-600">{item.score}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3">
                                            <div
                                                className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
                                                style={{ width: `${item.score}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10 pt-8 border-t border-gray-100">
                                <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                                    <FaLightbulb className="mr-2 text-yellow-500" /> Improvement Suggestions
                                </h4>
                                <div className="space-y-3">
                                    {results.recommendations.map((rec, i) => (
                                        <div key={i} className="flex items-start p-4 bg-gray-50 rounded-xl">
                                            <FaShieldAlt className={`mt-1 mr-3 flex-shrink-0 ${rec.type === 'success' ? 'text-green-500' : 'text-indigo-400'}`} />
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{rec.title}</p>
                                                <p className="text-xs text-gray-500 mt-1">{rec.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-12 shadow-xl border border-gray-100 flex flex-col items-center justify-center text-center h-full min-h-[500px]">
                            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                                <FaChartPie className="text-indigo-400 text-4xl" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to Score</h3>
                            <p className="text-gray-500 max-w-xs">Upload your resume and click predict to see your ATS compatibility breakdown.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ATSScorePage;
