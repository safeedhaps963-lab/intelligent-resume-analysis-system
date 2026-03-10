import React, { useState, useEffect } from 'react';
import {
    FaChartBar, FaUser, FaEnvelope, FaCalendar,
    FaSearch, FaArrowLeft, FaChevronLeft, FaChevronRight,
    FaRegLightbulb
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminSkillAnalysis = () => {
    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

    const navigate = useNavigate();

    useEffect(() => {
        fetchAnalyses();
    }, [pagination.page]);

    const fetchAnalyses = async (search = searchTerm) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                search: search
            });

            const token = localStorage.getItem('access_token') || localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`/api/admin/skill-analyses?${queryParams.toString()}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            const data = await res.json();

            if (data.success) {
                setAnalyses(data.data);
                setPagination(data.pagination);
            } else {
                toast.error(data.error || 'Failed to fetch analyses');
            }
        } catch (err) {
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination({ ...pagination, page: 1 });
        fetchAnalyses(searchTerm);
    };

    const renderSkills = (skills) => {
        if (!skills) return 'N/A';

        let allSkills = [];
        Object.values(skills).forEach(category => {
            if (category.skills) {
                allSkills = [...allSkills, ...category.skills];
            } else if (Array.isArray(category)) {
                allSkills = [...allSkills, ...category];
            }
        });

        if (allSkills.length === 0) return 'None extracted';

        return (
            <div className="flex flex-wrap gap-1">
                {allSkills.slice(0, 5).map((skill, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] border border-blue-100">
                        {skill}
                    </span>
                ))}
                {allSkills.length > 5 && (
                    <span className="text-[10px] text-gray-400">+{allSkills.length - 5} more</span>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin')}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Skill Analysis Dashboard</h1>
                        <p className="text-sm text-gray-500">In-depth insights into candidate skill extractions</p>
                    </div>
                </div>
                <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                    <FaRegLightbulb /> Total Analyses: {pagination.total}
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Name, Email or Resume ID..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Analysis Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resume ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Extracted Skills</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Match %</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Analysis Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center">
                                        <div className="flex justify-center flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <span className="text-gray-500">Loading analysis data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : analyses.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                                        No skill analyses found
                                    </td>
                                </tr>
                            ) : analyses.map((analysis) => (
                                <tr key={analysis.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-mono text-gray-400 truncate w-24" title={analysis.resume_id}>
                                            {analysis.resume_id}
                                        </div>
                                        <div className="text-[10px] text-gray-500 truncate w-32">{analysis.filename}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs">
                                                <FaUser />
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">{analysis.user_name}</div>
                                                <div className="text-xs text-gray-500">{analysis.user_email || 'No email'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {renderSkills(analysis.skills)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(analysis.match_score || 0) >= 80 ? 'bg-green-100 text-green-800' :
                                                (analysis.match_score || 0) >= 50 ? 'bg-blue-100 text-blue-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {Math.round(analysis.match_score || 0)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <FaCalendar className="text-gray-400" />
                                            {new Date(analysis.analyzed_at).toLocaleDateString()}
                                        </div>
                                        <div className="text-[10px] text-gray-400">
                                            {new Date(analysis.analyzed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && pagination.pages > 1 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
                                disabled={pagination.page === 1}
                                className="p-2 border rounded-lg disabled:opacity-50 hover:bg-white transition"
                            >
                                <FaChevronLeft size={12} />
                            </button>
                            <div className="flex items-center gap-1">
                                {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                                    // Simple pagination window
                                    let pageNum = pagination.page <= 3 ? i + 1 : pagination.page - 2 + i;
                                    if (pageNum > pagination.pages) return null;

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPagination({ ...pagination, page: pageNum })}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition ${pagination.page === pageNum ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-white border text-gray-600'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setPagination({ ...pagination, page: Math.min(pagination.pages, pagination.page + 1) })}
                                disabled={pagination.page === pagination.pages}
                                className="p-2 border rounded-lg disabled:opacity-50 hover:bg-white transition"
                            >
                                <FaChevronRight size={12} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSkillAnalysis;
