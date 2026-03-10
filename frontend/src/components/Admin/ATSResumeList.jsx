/**
 * ATSResumeList.jsx - Admin view of optimized resumes
 * ===================================================
 */

import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { FaFileWord, FaDownload, FaEye, FaSearch, FaUser } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ATSResumeList = () => {
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const response = await adminAPI.getATSResumes();
                if (response.success) {
                    setResumes(response.data || []);
                }
            } catch (error) {
                console.error("Fetch error:", error);
                setResumes([]);
            } finally {
                setLoading(false);
            }
        };

        fetchResumes();
    }, []);

    const filteredResumes = (resumes || []).filter(r =>
        (r.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.user_email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">ATS Optimized Resumes</h1>
                    <p className="text-gray-500">History of all resumes processed through the converter engine.</p>
                </div>

                <div className="relative w-full md:w-96">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search candidate or email..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-5">Candidate</th>
                                <th className="px-8 py-5">Optimized DOCX</th>
                                <th className="px-8 py-5">Generation Date</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredResumes.length > 0 ? filteredResumes.map((resume) => (
                                <tr key={resume.resume_id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                                                <FaUser />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 mb-0.5">{resume.user_name}</p>
                                                <p className="text-xs text-gray-400 font-medium">{resume.user_email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <FaFileWord className="text-blue-500" />
                                            <span className="text-xs font-bold text-gray-600">{resume.filename || 'ATS_Optimized.docx'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-xs font-bold text-gray-500">{new Date(resume.created_at).toLocaleDateString()}</p>
                                        <p className="text-[10px] text-gray-300 font-medium">{new Date(resume.created_at).toLocaleTimeString()}</p>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 border border-gray-100 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-white hover:shadow-sm transition-all">
                                                <FaEye size={14} />
                                            </button>
                                            <button className="p-2 border border-gray-100 rounded-lg text-gray-400 hover:text-green-600 hover:bg-white hover:shadow-sm transition-all">
                                                <FaDownload size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center">
                                        <div className="max-w-xs mx-auto space-y-4">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                                                <FaFileWord size={24} />
                                            </div>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No optimization history found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ATSResumeList;
