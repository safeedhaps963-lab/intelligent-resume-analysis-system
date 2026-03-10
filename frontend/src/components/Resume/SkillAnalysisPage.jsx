import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
    FaUpload, FaFilePdf, FaArrowLeft, FaExclamationCircle,
    FaCogs, FaPuzzlePiece, FaUserTie, FaCheckCircle,
    FaChartBar, FaPlus, FaBrain
} from 'react-icons/fa';
import { resumeAPI } from '../../services/api';
import Breadcrumbs from '../Common/Breadcrumbs';

const SkillItem = ({ name, type }) => (
    <span className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-default ${type === 'technical' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
        type === 'soft' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
            'bg-gray-100 text-gray-700 border border-gray-200'
        }`}>
        {name}
    </span>
);

const AnalysisSection = ({ title, icon, children, color }) => (
    <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-50 h-full">
        <h3 className={`text-xl font-black mb-6 flex items-center ${color}`}>
            {icon}
            <span className="ml-3 uppercase tracking-wider text-sm">{title}</span>
        </h3>
        <div className="flex flex-wrap gap-2">
            {children}
        </div>
    </div>
);

const SkillAnalysisPage = () => {
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
            toast.success(`${acceptedFiles[0].name} uploaded`);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
        maxFiles: 1
    });

    const handleAnalyze = async () => {
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

            const res = await resumeAPI.skillAnalysis(resumeId);
            setResults(res.data);
            toast.success('Skill analysis complete');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Analysis failed');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <Breadcrumbs />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-4xl font-black text-gray-800 tracking-tight">AI Skill Analysis</h2>
                    <p className="text-gray-500 font-bold mt-1">Extract technical & soft skills using advanced NLP</p>
                </div>
                <button onClick={() => navigate('/')} className="px-5 py-2 text-purple-600 hover:bg-purple-50 rounded-xl font-bold flex items-center transition-all bg-white shadow-sm border border-gray-100">
                    <FaArrowLeft className="mr-2" /> Dashboard
                </button>
            </div>

            <div className="bg-white rounded-3xl p-10 shadow-2xl border border-gray-50 mb-12">
                <div className="flex flex-col items-center">
                    <div className="w-full max-w-2xl space-y-8">
                        <div>
                            <h3 className="text-xl font-extrabold text-gray-800 mb-6 flex items-center justify-center">
                                <FaUpload className="mr-3 text-purple-600" /> Upload Source
                            </h3>

                            {existingResume ? (
                                <div className="p-6 bg-purple-50 border-2 border-purple-100 rounded-3xl flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mr-4">
                                            <FaFilePdf className="text-red-500 text-2xl" />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-800">{existingResume.filename}</p>
                                            <p className="text-xs text-purple-500 font-bold uppercase tracking-widest mt-0.5">Reuse stored resume</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setExistingResume(null)} className="px-4 py-2 text-xs font-black bg-white text-purple-600 rounded-xl shadow-sm border border-purple-100 hover:bg-purple-600 hover:text-white transition-all">Change</button>
                                </div>
                            ) : (
                                <div {...getRootProps()} className={`border-4 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${isDragActive ? 'border-purple-500 bg-purple-50 shadow-inner' : 'border-gray-100 hover:border-purple-300 hover:bg-gray-50/50'}`}>
                                    <input {...getInputProps()} />
                                    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <FaUpload className="text-3xl text-gray-300" />
                                    </div>
                                    <h4 className="text-lg font-black text-gray-700">{file ? file.name : 'Select your Resume'}</h4>
                                    <p className="text-sm text-gray-400 mt-2 font-medium">Standard PDF or Word document imports</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="w-full bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-indigo-100 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isAnalyzing ? (
                                <span className="flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing Skills...
                                </span>
                            ) : 'Start Deep Analysis'}
                        </button>
                    </div>
                </div>
            </div>

            {
                results && (
                    <div className="animate-fadeIn space-y-8 pb-12">
                        {/* AI Insights Summary */}
                        <div className="bg-white rounded-3xl p-8 shadow-xl border border-indigo-50 border-l-8 border-l-indigo-600">
                            <h3 className="text-xl font-black text-gray-800 mb-4 flex items-center">
                                <FaBrain className="mr-3 text-indigo-600" /> AI Professional Insight
                            </h3>
                            <div className="text-gray-600 leading-relaxed space-y-4">
                                <p>
                                    Based on our deep NLP analysis of your resume and the target {results.category || 'Professional'} profile, we've identified a
                                    <span className="mx-1 font-bold text-indigo-600">{
                                        results.match_percentage >= 80 ? 'highly competitive' :
                                            results.match_percentage >= 50 ? 'well-rounded' : 'developing'
                                    }</span>
                                    {Object.entries(results.skills || {}).filter(([_, d]) => d.skills && d.skills.length > 0).length > 0 ? (
                                        <>
                                            technical foundation. Your strongest area appears to be
                                            <span className="mx-1 font-bold text-gray-800">{
                                                Object.entries(results.skills)
                                                    .filter(([_, d]) => d.skills && d.skills.length > 0)
                                                    .sort((a, b) => b[1].skills.length - a[1].skills.length)[0][0]
                                                    .replace('_', ' ')
                                            }</span>,
                                            where you demonstrate significant depth.
                                        </>
                                    ) : (
                                        "professional profile. We have detected several areas for growth to better align with current industry standards."
                                    )}
                                </p>
                                {results.missing_skills?.critical?.length > 0 && (
                                    <p>
                                        To reach the elite 1% of applicants for this category, we recommend prioritizing the acquisition of
                                        <span className="mx-1 font-bold text-red-600">{results.missing_skills.critical.slice(0, 3).join(', ')}</span>.
                                        These are currently the most significant gaps preventing a perfect ATS match.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Header Stats */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-3xl shadow-xl text-white">
                                <p className="text-purple-200 text-xs font-black uppercase tracking-widest mb-2">Total Skills Found</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-5xl font-black">
                                        {Object.values(results.skills).reduce((acc, cat) => acc + cat.skills.length, 0)}
                                    </span>
                                    <span className="text-purple-200 font-bold pb-2">Technical & Soft</span>
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-50 flex items-center gap-6">
                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                    <FaChartBar className="text-2xl text-indigo-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Skill Gap</p>
                                    <h4 className="text-2xl font-black text-gray-800">
                                        {results.missing_skills.critical.length + results.missing_skills.recommended.length} Detected
                                    </h4>
                                    <p className="text-[10px] text-red-500 font-bold mt-1 truncate">
                                        PRIORITY MISSES: {results.missing_skills.critical.slice(0, 2).join(', ')}...
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-8">
                            <AnalysisSection title="Categorized Expertise" icon={<FaCogs />} color="text-purple-600">
                                <div className="space-y-6 w-full">
                                    {Object.entries(results.skills)
                                        .filter(([cat, data]) => cat !== 'soft_skills' && data.skills.length > 0)
                                        .map(([category, data]) => (
                                            <div key={category} className="space-y-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">
                                                        {category.replace('_', ' ')}
                                                    </span>
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${data.skills.length > 3 ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        {data.skills.length > 3 ? 'Strong Depth' : 'Foundational'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {data.skills.map(s => <SkillItem key={s} name={s} type="technical" />)}
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </AnalysisSection>

                            <AnalysisSection title="Professional Soft Skills" icon={<FaUserTie />} color="text-indigo-600">
                                <div className="space-y-4 w-full">
                                    <p className="text-xs text-indigo-500 font-medium italic mb-2">
                                        These interpersonal traits were detected via semantic context in your experience descriptions.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {results.skills.soft_skills?.skills.length > 0 ? (
                                            results.skills.soft_skills.skills.map(s => <SkillItem key={s} name={s} type="soft" />)
                                        ) : (
                                            <div className="w-full p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                                                <p className="text-gray-400 text-sm">No soft skills explicitly detected.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </AnalysisSection>
                        </div>

                        <div className="bg-white rounded-3xl p-10 shadow-2xl border border-gray-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-gray-800 flex items-center">
                                    <FaPuzzlePiece className="mr-3 text-red-500" />
                                    Missing Critical Skills
                                </h3>
                                <div className="px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-black uppercase tracking-widest">
                                    Action Required
                                </div>
                            </div>

                            {results.missing_skills.critical.length > 0 ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {results.missing_skills.critical.map(skill => (
                                        <div key={skill} className="p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-center justify-between group hover:bg-red-50 transition-all">
                                            <span className="font-bold text-red-700">{skill}</span>
                                            <button onClick={() => toast.success(`Added ${skill} to builder`)} className="p-2 bg-white rounded-xl shadow-sm text-red-500 hover:scale-110 active:scale-90 transition-all">
                                                <FaPlus />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 bg-green-50 border border-green-100 rounded-3xl text-center">
                                    <p className="text-green-700 font-extrabold text-lg">Fantastic! No major skill gaps detected for your profile.</p>
                                    <p className="text-green-600 text-sm mt-1">Your resume covers the essential technical and soft skills for a {results.category || 'Professional'} role.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {
                !results && !isAnalyzing && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-8 border border-gray-100">
                            <FaBrain className="text-5xl text-gray-200" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-800 mb-2">Analysis Engine Standby</h3>
                        <p className="text-gray-500 max-w-md font-medium">Select a resume to uncover skill gaps and build your comprehensive professional visualization map.</p>
                    </div>
                )
            }
        </div >
    );
};

export default SkillAnalysisPage;
