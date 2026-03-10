import React, { useState, useEffect } from 'react';
import {
    FaChartLine, FaUser, FaEnvelope, FaCalendar,
    FaSearch, FaArrowLeft, FaChevronLeft, FaChevronRight,
    FaTrophy
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminATSScore = () => {
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

    const navigate = useNavigate();

    useEffect(() => {
        fetchScores();
    }, [pagination.page]);

    const fetchScores = async (search = searchTerm) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                search: search
            });

            const token = localStorage.getItem('access_token') || localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`/api/admin/ats-scores?${queryParams.toString()}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            const data = await res.json();

            if (data.success) {
                setScores(data.data);
                setPagination(data.pagination);
            } else {
                toast.error(data.error || 'Failed to fetch score data');
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
        fetchScores(searchTerm);
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-indigo-600';
        if (score >= 40) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getRanking = (score) => {
        if (score >= 90) return { label: 'Top Tier', color: 'bg-green-100 text-green-800' };
        if (score >= 80) return { label: 'Highly Qualified', color: 'bg-emerald-100 text-emerald-800' };
        if (score >= 70) return { label: 'Qualified', color: 'bg-blue-100 text-blue-800' };
        if (score >= 50) return { label: 'Average', color: 'bg-gray-100 text-gray-800' };
        return { label: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
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
                        <h1 className="text-2xl font-bold">ATS Score Analytics</h1>
                        <p className="text-sm text-gray-500">System-wide performance scores and rankings</p>
                    </div>
                </div>
                <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                    <FaTrophy /> Total Scored: {pagination.total}
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Candidate or ID..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                        Filter
                    </button>
                </form>
            </div>

            {/* Score Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resume ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate Name</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">ATS Score</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ranking</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calculation Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center">
                                        <div className="flex justify-center flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                            <span className="text-gray-500">Retrieving ATS data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : scores.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                                        No ATS scores available
                                    </td>
                                </tr>
                            ) : scores.map((item) => {
                                const rank = getRanking(item.overall_score || 0);
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-mono text-gray-400 truncate w-24">
                                                {item.resume_id}
                                            </div>
                                            <div className="text-[10px] text-gray-500 truncate w-32">{item.filename}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs">
                                                    <FaUser />
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900">{item.user_name}</div>
                                                    <div className="text-xs text-gray-500">{item.user_email || 'System Record'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`text-xl font-bold ${getScoreColor(item.overall_score)}`}>
                                                    {Math.round(item.overall_score || 0)}%
                                                </span>
                                                <div className="w-12 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                    <div
                                                        className={`h-full ${item.overall_score >= 80 ? 'bg-green-500' : item.overall_score >= 60 ? 'bg-indigo-500' : 'bg-red-500'}`}
                                                        style={{ width: `${item.overall_score}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${rank.color}`}>
                                                    {rank.label}
                                                </span>
                                                {item.overall_score >= 90 && (
                                                    <span className="bg-yellow-400 text-white px-2 py-0.5 rounded-full text-[8px] font-black flex items-center gap-1">
                                                        <FaTrophy size={8} /> OPTIMIZED
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <FaCalendar className="text-gray-400" />
                                                {new Date(item.scored_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-[10px] text-gray-400">
                                                {new Date(item.scored_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Similar to Skill Analysis) */}
                {!loading && pagination.pages > 1 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> results
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
                                    let pageNum = pagination.page <= 3 ? i + 1 : pagination.page - 2 + i;
                                    if (pageNum > pagination.pages) return null;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPagination({ ...pagination, page: pageNum })}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition ${pagination.page === pageNum ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white border text-gray-600'}`}
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

export default AdminATSScore;
