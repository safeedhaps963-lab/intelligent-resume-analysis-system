import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
    FaUpload, FaFilePdf, FaBrain, FaChartPie,
    FaLightbulb, FaArrowLeft, FaShieldAlt, FaInfoCircle
} from 'react-icons/fa';
import { resumeAPI } from '../../services/api';
import Breadcrumbs from '../Common/Breadcrumbs';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

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
            setExistingResume(null);
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
        const loadToast = toast.loading('Calculating ATS compatibility...');
        try {
            let resumeId = existingResume?.id;

            if (file) {
                const uploadRes = await resumeAPI.upload(file);
                resumeId = uploadRes.data.resume_id;
            }

            const res = await resumeAPI.getATSScore(resumeId);
            setResults(res.data);
            toast.success('ATS Scoring complete!', { id: loadToast });
        } catch (err) {
            toast.error(err.response?.data?.error || 'Scoring failed', { id: loadToast });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getStatus = (score) => {
        if (score >= 85) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50', icon: <FaShieldAlt className="text-green-500" /> };
        if (score >= 70) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', icon: <FaInfoCircle className="text-blue-500" /> };
        return { label: 'Needs Improvement', color: 'text-orange-600', bg: 'bg-orange-50', icon: <FaLightbulb className="text-orange-500" /> };
    };

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <Breadcrumbs />

            <div className="flex items-center justify-between mb-8 px-4 sm:px-0">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tight">ATS Match Predictor</h2>
                    <p className="text-slate-500 font-medium mt-1">Simulate professional resume screening algorithms</p>
                </div>
                <button onClick={() => navigate('/')} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold flex items-center transition-all">
                    <FaArrowLeft className="mr-2" /> Dashboard
                </button>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                            <FaUpload className="mr-3 text-indigo-600" /> Upload Source
                        </h3>

                        {existingResume ? (
                            <div className="mb-6 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center">
                                    <FaFilePdf className="text-red-500 text-2xl mr-3" />
                                    <div className="max-w-[150px]">
                                        <p className="font-bold text-slate-800 truncate">{existingResume.filename}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Latest Resume</p>
                                    </div>
                                </div>
                                <button onClick={() => setExistingResume(null)} className="text-xs font-black text-indigo-600 hover:text-indigo-800">CHANGE</button>
                            </div>
                        ) : (
                            <div {...getRootProps()} className={`border-3 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50'}`}>
                                <input {...getInputProps()} />
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <FaUpload className="text-2xl text-slate-300" />
                                </div>
                                <p className="font-bold text-slate-600 text-sm">{file ? file.name : 'Target File'}</p>
                                <p className="text-[10px] text-slate-400 mt-2 uppercase font-black tracking-widest">PDF / DOCX (5MB MAX)</p>
                            </div>
                        )}

                        <button
                            onClick={handleScore}
                            disabled={isAnalyzing}
                            className="w-full mt-8 bg-slate-800 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                        >
                            {isAnalyzing ? "Processing..." : "Run Analysis"}
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-8">
                    {results ? (
                        <div className="bg-white rounded-3xl p-10 shadow-2xl border border-slate-100 animate-fadeIn overflow-hidden relative">
                            {/* High Optimization Badge */}
                            {results.overall_score > 85 && (
                                <div className="absolute top-6 right-[-40px] rotate-45 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-12 py-1 font-black text-[10px] shadow-lg flex items-center justify-center tracking-widest z-10">
                                    <FaShieldAlt className="mr-1" /> HIGHLY OPTIMIZED
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 flex items-center">
                                        Predictive Score {getStatus(results.overall_score).icon}
                                    </h3>
                                    <p className="text-slate-500 font-medium text-sm">Based on {results.overall_score >= 85 ? "Professional ATS Standards" : "General Industry Patterns"}</p>
                                </div>
                                <div className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider ${getStatus(results.overall_score).bg} ${getStatus(results.overall_score).color}`}>
                                    {getStatus(results.overall_score).label}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-12 items-center">
                                <ATSScoreCircle score={results.overall_score} />

                                <div className="h-64">
                                    <Radar
                                        data={{
                                            labels: Object.values(results.breakdown).map(i => i.label),
                                            datasets: [{
                                                label: 'Strength',
                                                data: Object.values(results.breakdown).map(i => i.score),
                                                backgroundColor: 'rgba(99, 102, 241, 0.25)',
                                                borderColor: 'rgba(99, 102, 241, 1)',
                                                borderWidth: 3,
                                                pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                                                pointBorderColor: '#fff',
                                            }]
                                        }}
                                        options={{
                                            scales: {
                                                r: {
                                                    grid: { color: '#f1f5f9' },
                                                    angleLines: { color: '#f1f5f9' },
                                                    suggestedMin: 0,
                                                    suggestedMax: 100,
                                                    ticks: { display: false }
                                                }
                                            },
                                            plugins: { legend: { display: false } },
                                            maintainAspectRatio: false
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="mt-12 space-y-6">
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Detailed Breakdown</h4>
                                {Object.entries(results.breakdown).map(([key, item]) => (
                                    <div key={key} className="group">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-slate-600 font-bold text-[13px]">{item.label}</span>
                                            <span className="font-black text-indigo-600 text-sm">{item.score}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-slate-800 transition-all duration-1000 group-hover:opacity-80"
                                                style={{ width: `${item.score}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 pt-10 border-t border-slate-100">
                                <h4 className="font-black text-slate-800 mb-6 flex items-center text-lg">
                                    <FaLightbulb className="mr-3 text-yellow-500" /> Strategic Recommendations
                                </h4>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {results.recommendations.map((rec, i) => (
                                        <div key={i} className="flex items-start p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center mr-4 flex-shrink-0 group-hover:bg-indigo-600 transition-colors">
                                                <FaShieldAlt className="text-indigo-600 group-hover:text-white transition-colors" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm leading-tight">{rec.title}</p>
                                                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">{rec.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl p-16 shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center h-full min-h-[500px]">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
                                <FaChartPie className="text-slate-300 text-5xl" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-3">Intelligence Awaiting</h3>
                            <p className="text-slate-400 max-w-xs font-medium leading-relaxed">System is ready to perform structural and semantic cross-referencing on your document.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ATSScorePage;
