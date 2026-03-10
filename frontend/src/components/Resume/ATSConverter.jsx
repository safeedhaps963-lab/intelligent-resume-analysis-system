import React, { useState } from 'react';
import {
    FaUpload, FaCheckCircle, FaRocket,
    FaSyncAlt, FaExclamationTriangle, FaDownload,
    FaFileWord, FaRobot, FaMagic, FaPlus, FaTimes, FaFilePdf,
    FaChartPie, FaEdit, FaSave, FaTrash
} from 'react-icons/fa';
import { resumeAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ATSConverter = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editableSections, setEditableSections] = useState(null);
    const [step, setStep] = useState('upload'); // upload, processing, result

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error("File size exceeds 5MB limit");
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleConvert = async () => {
        if (!file) {
            toast.error("Please select a resume file first");
            return;
        }

        setLoading(true);
        setStep('processing');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await resumeAPI.convertATS(formData);

            if (response.success) {
                setResult(response.data);
                setEditableSections(response.data.sections);
                setStep('result');
                toast.success("Resume optimized successfully!");
            } else {
                throw new Error(response.message || "Optimization failed");
            }
        } catch (error) {
            console.error("Conversion error:", error);
            const msg = error.response?.data?.message || error.message || "Failed to convert resume";
            toast.error(msg);
            setStep('upload');
        } finally {
            setLoading(false);
        }
    };

    const downloadOptimizedDOCX = async () => {
        if (!result || !result.resume_id) return;
        setLoading(true);
        try {
            const response = await resumeAPI.download(result.resume_id, 'docx');
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });
            const url = window.URL.createObjectURL(blob);

            // Trigger open/download
            window.open(url, '_blank');

            const link = document.createElement('a');
            link.href = url;
            link.download = `ATS_Optimized_${result.resume_id.substring(0, 8)}.docx`;
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 1000);

            toast.success("DOCX download started");
        } catch (e) {
            console.error(e);
            toast.error("DOCX download failed");
        } finally {
            setLoading(false);
        }
    };

    const downloadOptimizedPDF = async () => {
        if (!result || !result.resume_id) return;
        setLoading(true);
        try {
            const response = await resumeAPI.download(result.resume_id, 'pdf');
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            // Open in new tab so user can "see" it immediately
            window.open(url, '_blank');

            // Also trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = `ATS_Optimized_${result.resume_id.substring(0, 8)}.pdf`;
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 1000); // Give more time for the browser to start the download

            toast.success("PDF opened and download started");
        } catch (e) {
            console.error(e);
            toast.error("PDF download failed");
        } finally {
            setLoading(false);
        }
    };

    const addEducation = () => {
        const newEdu = {
            degree: '',
            field: '',
            institution: '',
            start_year: '',
            end_year: '',
            grade: ''
        };
        setEditableSections({
            ...editableSections,
            education: [...(editableSections.education || []), newEdu]
        });
    };

    const updateEducation = (index, field, value) => {
        const newEduList = [...editableSections.education];
        newEduList[index] = { ...newEduList[index], [field]: value };
        setEditableSections({ ...editableSections, education: newEduList });
    };

    const removeEducation = (index) => {
        const newEduList = editableSections.education.filter((_, i) => i !== index);
        setEditableSections({ ...editableSections, education: newEduList });
    };

    const handleSaveChanges = async () => {
        setLoading(true);
        try {
            const response = await resumeAPI.updateATS(result.resume_id, editableSections);
            if (response.data.success) {
                setResult({ ...result, sections: editableSections });
                setIsEditing(false);
                toast.success("Changes saved successfully!");
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Failed to save changes");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setResult(null);
        setEditableSections(null);
        setIsEditing(false);
        setStep('upload');
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 py-8 px-4">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-purple-50 text-purple-600 text-sm font-bold border border-purple-100">
                    <FaMagic className="mr-2" /> AI-Powered Optimization
                </div>
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">ATS Resume Converter</h1>

            </div>

            {step === 'upload' && (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-3xl shadow-xl shadow-purple-500/5 p-8 border border-gray-100">
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ${file ? 'border-green-200 bg-green-50' : 'border-purple-200 bg-purple-50 hover:bg-purple-100/50'}`}
                        >
                            <input
                                type="file"
                                id="resume-upload"
                                className="hidden"
                                accept=".pdf,.docx,.doc"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="resume-upload" className="flex flex-col items-center justify-center cursor-pointer">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${file ? 'bg-green-500 text-white' : 'bg-purple-600 text-white'}`}>
                                    {file ? <FaCheckCircle className="text-2xl" /> : <FaUpload className="text-2xl" />}
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">{file ? file.name : "Select Resume File"}</h3>
                                <p className="text-gray-500 mt-2">Support for PDF, DOCX (Max 5MB)</p>
                            </label>
                        </div>

                        {file && (
                            <button
                                onClick={handleConvert}
                                disabled={loading}
                                className="w-full mt-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 shadow-xl shadow-purple-200"
                            >
                                {loading ? <FaSyncAlt className="animate-spin" /> : <FaRocket />}
                                <span>{loading ? 'Optimizing...' : 'Generate Optimized ATS Resume'}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {step === 'processing' && (
                <div className="bg-white rounded-3xl shadow-2xl p-16 text-center max-w-2xl mx-auto border border-gray-50">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 border-4 border-purple-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-purple-600">
                            <FaRobot className="text-3xl" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-4 animate-pulse">Engineering Your Future...</h2>
                    <p className="text-gray-600">Our AI is restructuring your skills, experience, and achievements into a format ATS systems love.</p>
                </div>
            )}

            {step === 'result' && result && (
                <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500 pb-20">
                    {/* Header Controls */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-xl border border-purple-100">
                        <div className="flex items-center space-x-4">
                            <div className="bg-purple-100 p-3 rounded-2xl">
                                <FaCheckCircle className="text-purple-600 text-xl" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Optimization Complete</h2>
                                <p className="text-sm text-gray-500">Your ATS optimized resume is ready for download.</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button onClick={reset} className="px-4 py-2 text-gray-500 hover:text-purple-600 font-bold transition flex items-center">
                                <FaSyncAlt className="mr-2" /> Reset
                            </button>
                            <button
                                onClick={downloadOptimizedPDF}
                                disabled={loading}
                                className="bg-red-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-red-700 transition flex items-center disabled:opacity-50"
                            >
                                <FaFilePdf className="mr-2" /> {loading ? 'Preparing...' : 'Download PDF'}
                            </button>
                            <button
                                onClick={downloadOptimizedDOCX}
                                disabled={loading}
                                className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center disabled:opacity-50"
                            >
                                <FaFileWord className="mr-2" /> {loading ? 'Preparing...' : 'Download DOCX'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column: Metrics & Improvements */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Score Card */}
                            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 text-white shadow-2xl">
                                <div className="text-center space-y-4">
                                    <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">ATS Compatibility Score</p>
                                    <div className="relative inline-flex items-center justify-center">
                                        <svg className="w-32 h-32">
                                            <circle className="text-white/10" strokeWidth="8" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
                                            <circle className="text-green-400" strokeWidth="8" strokeDasharray={58 * 2 * Math.PI} strokeDashoffset={58 * 2 * Math.PI * (1 - result.improved_score / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
                                        </svg>
                                        <div className="absolute flex flex-col items-center">
                                            <span className="text-4xl font-black">{result.improved_score === 100 ? '100+' : result.improved_score}</span>
                                            <span className="text-[10px] opacity-70">TOP 1% ELITE</span>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-white/10">
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="text-indigo-200">Before: {result.original_score}%</span>
                                            <span className="text-green-300">Improvement: +{result.improved_score - result.original_score}%</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-400" style={{ width: `${result.improved_score}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Improvements List */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                                    <FaChartPie className="mr-2 text-purple-600" /> Score Breakdown
                                </h3>
                                <div className="space-y-4">
                                    {result.improved_breakdown && Object.entries(result.improved_breakdown).map(([key, item]) => (
                                        <div key={key} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-600 font-medium">{item.label}</span>
                                                <span className="font-bold text-purple-700">{item.score}%</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-400 to-indigo-600 transition-all duration-1000"
                                                    style={{ width: `${item.score}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Improvements List */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                                    <FaMagic className="mr-2 text-purple-600" /> Improvement Log
                                </h3>
                                <div className="space-y-4">
                                    {result.improvements && result.improvements.map((imp, i) => (
                                        <div key={i} className="flex items-start space-x-3 text-sm">
                                            <div className="mt-1 w-5 h-5 bg-green-50 text-green-500 rounded-full flex items-center justify-center shrink-0">
                                                <FaCheckCircle size={10} />
                                            </div>
                                            <p className="text-gray-600">{imp}</p>
                                        </div>
                                    ))}
                                    {(!result.improvements || result.improvements.length === 0) && (
                                        <p className="text-gray-400 italic text-sm text-center py-4">Optimization summary generated...</p>
                                    )}
                                </div>
                            </div>

                            {/* Format Checklist */}
                            <div className="bg-purple-50 rounded-3xl p-6 border border-purple-100">
                                <h4 className="text-sm font-bold text-purple-900 mb-3">ATS Format Engine:</h4>
                                <ul className="text-xs text-purple-700 space-y-2">
                                    <li className="flex items-center"><FaCheckCircle className="mr-2 opacity-50" /> Single-column layout preserved</li>
                                    <li className="flex items-center"><FaCheckCircle className="mr-2 opacity-50" /> Table-free structure generated</li>
                                    <li className="flex items-center"><FaCheckCircle className="mr-2 opacity-50" /> Standard web-safe fonts only</li>
                                    <li className="flex items-center"><FaCheckCircle className="mr-2 opacity-50" /> Header hierarchy optimized</li>
                                </ul>
                            </div>
                        </div>

                        {/* Right Column: Resume Preview */}
                        <div className="lg:col-span-8">
                            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex space-x-1.5">
                                            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                        </div>
                                        <span className="text-xs font-medium text-gray-400 ml-4">ATS-FRIENDLY PREVIEW</span>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        {!isEditing ? (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="text-xs font-bold text-gray-600 hover:text-purple-600 flex items-center transition-colors"
                                            >
                                                <FaEdit className="mr-1" /> EDIT VERSION
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleSaveChanges}
                                                className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center transition-colors"
                                            >
                                                <FaSave className="mr-1" /> SAVE CHANGES
                                            </button>
                                        )}
                                        <button onClick={downloadOptimizedPDF} className="text-xs font-bold text-purple-600 hover:underline flex items-center">
                                            <FaDownload className="mr-1" /> Export
                                        </button>
                                    </div>
                                </div>

                                {/* The Actual Resume Body - Single Column ATS Layout */}
                                <div className="bg-white overflow-y-auto max-h-[800px] resume-preview scrollbar-thin">
                                    <div className="p-12 space-y-8 max-w-4xl mx-auto">
                                        {/* Name & Contact */}
                                        <div className="text-center space-y-2 pb-6 border-b border-gray-100">
                                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">
                                                {result.sections?.name || "Candidate Name"}
                                            </h1>
                                            <p className="text-sm text-gray-600 flex justify-center gap-4">
                                                <span>{result.sections?.contact?.email}</span>
                                                <span className="text-gray-300">|</span>
                                                <span>{result.sections?.contact?.phone}</span>
                                                <span className="text-gray-300">|</span>
                                                <span className="truncate">{result.sections?.contact?.linkedin}</span>
                                            </p>
                                        </div>

                                        {/* Summary */}
                                        <section>
                                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 pb-1 mb-4">
                                                Professional Summary
                                            </h2>
                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                {result.sections?.summary}
                                            </p>
                                        </section>

                                        {/* Tech Skills */}
                                        <section>
                                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 pb-1 mb-4">
                                                Technical Skills
                                            </h2>
                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                {Array.isArray(result.sections?.tech_skills)
                                                    ? result.sections.tech_skills.join(', ')
                                                    : String(result.sections?.tech_skills || 'N/A')}
                                            </p>
                                        </section>

                                        {/* Experience */}
                                        <section>
                                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 pb-1 mb-6">
                                                Professional Experience
                                            </h2>
                                            <div className="space-y-6">
                                                {Array.isArray(result.sections?.experience) && result.sections.experience.map((exp, i) => (
                                                    <div key={i} className="space-y-2">
                                                        <div className="flex justify-between items-baseline">
                                                            <h3 className="text-sm font-bold text-gray-900 uppercase">{exp.title}</h3>
                                                            <span className="text-xs font-bold text-gray-500">{exp.date}</span>
                                                        </div>
                                                        <p className="text-xs font-bold text-gray-600 italic mb-1">{exp.company}</p>
                                                        <p className="text-sm text-gray-700 leading-relaxed pl-4 relative">
                                                            <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                                            {exp.description}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        {/* Education */}
                                        <section>
                                            <div className="flex justify-between items-center border-b-2 border-gray-900 mb-4 pb-1">
                                                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                                                    Education
                                                </h2>
                                                {isEditing && (
                                                    <button onClick={addEducation} className="text-[10px] font-bold text-purple-600 flex items-center hover:bg-purple-50 px-2 py-0.5 rounded transition-all">
                                                        <FaPlus className="mr-1" /> ADD ENTRY
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-6">
                                                {!isEditing ? (
                                                    // Display Mode
                                                    Array.isArray(result.sections?.education) && result.sections.education.map((edu, i) => (
                                                        <div key={i} className="space-y-1">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-900">
                                                                        {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                                                                    </p>
                                                                    <p className="text-sm text-gray-700">{edu.institution}</p>
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-500">
                                                                    {edu.start_year ? `${edu.start_year} - ${edu.end_year}` : edu.end_year || edu.year}
                                                                </span>
                                                            </div>
                                                            {edu.grade && (
                                                                <p className="text-xs text-gray-600 font-medium">Grade/GPA: {edu.grade}</p>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    // Edit Mode
                                                    Array.isArray(editableSections?.education) && editableSections.education.map((edu, i) => (
                                                        <div key={i} className="relative bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 space-y-3">
                                                            <button
                                                                onClick={() => removeEducation(i)}
                                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                                                            >
                                                                <FaTrash size={10} />
                                                            </button>

                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="col-span-1">
                                                                    <label className="text-[10px] uppercase font-bold text-gray-400">Degree</label>
                                                                    <input
                                                                        className="w-full text-xs bg-white border border-gray-200 rounded p-1.5 focus:border-purple-300 outline-none"
                                                                        value={edu.degree}
                                                                        onChange={(e) => updateEducation(i, 'degree', e.target.value)}
                                                                        placeholder="e.g. B.S."
                                                                    />
                                                                </div>
                                                                <div className="col-span-1">
                                                                    <label className="text-[10px] uppercase font-bold text-gray-400">Field of Study</label>
                                                                    <input
                                                                        className="w-full text-xs bg-white border border-gray-200 rounded p-1.5 focus:border-purple-300 outline-none"
                                                                        value={edu.field}
                                                                        onChange={(e) => updateEducation(i, 'field', e.target.value)}
                                                                        placeholder="e.g. Computer Science"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1">
                                                                <label className="text-[10px] uppercase font-bold text-gray-400">Institution</label>
                                                                <input
                                                                    className="w-full text-xs bg-white border border-gray-200 rounded p-1.5 focus:border-purple-300 outline-none"
                                                                    value={edu.institution}
                                                                    onChange={(e) => updateEducation(i, 'institution', e.target.value)}
                                                                    placeholder="e.g. Stanford University"
                                                                />
                                                            </div>

                                                            <div className="grid grid-cols-3 gap-3">
                                                                <div>
                                                                    <label className="text-[10px] uppercase font-bold text-gray-400">Start Year</label>
                                                                    <input
                                                                        className="w-full text-xs bg-white border border-gray-200 rounded p-1.5 focus:border-purple-300 outline-none"
                                                                        value={edu.start_year}
                                                                        onChange={(e) => updateEducation(i, 'start_year', e.target.value)}
                                                                        placeholder="2018"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] uppercase font-bold text-gray-400">End Year</label>
                                                                    <input
                                                                        className="w-full text-xs bg-white border border-gray-200 rounded p-1.5 focus:border-purple-300 outline-none"
                                                                        value={edu.end_year}
                                                                        onChange={(e) => updateEducation(i, 'end_year', e.target.value)}
                                                                        placeholder="2022"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] uppercase font-bold text-gray-400">Grade/GPA</label>
                                                                    <input
                                                                        className="w-full text-xs bg-white border border-gray-200 rounded p-1.5 focus:border-purple-300 outline-none"
                                                                        value={edu.grade}
                                                                        onChange={(e) => updateEducation(i, 'grade', e.target.value)}
                                                                        placeholder="3.8 / 4.0"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </section>

                                        {/* Projects & Certs */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {result.sections?.projects && result.sections.projects.length > 0 && (
                                                <section>
                                                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 pb-1 mb-4">
                                                        Projects
                                                    </h2>
                                                    <ul className="space-y-2">
                                                        {result.sections.projects.map((p, i) => (
                                                            <li key={i} className="text-sm text-gray-700 pl-4 relative">
                                                                <span className="absolute left-0 top-2 w-1 h-1 bg-gray-400 rounded-full"></span>
                                                                {p}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </section>
                                            )}
                                            {result.sections?.certifications && result.sections.certifications.length > 0 && (
                                                <section>
                                                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 pb-1 mb-4">
                                                        Certifications
                                                    </h2>
                                                    <ul className="space-y-2">
                                                        {result.sections.certifications.map((c, i) => (
                                                            <li key={i} className="text-sm text-gray-700 pl-4 relative">
                                                                <span className="absolute left-0 top-2 w-1 h-1 bg-gray-400 rounded-full"></span>
                                                                {c}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </section>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ATSConverter;

