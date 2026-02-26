import React, { useState, useEffect } from 'react';
import {
    FaUser, FaEnvelope, FaCalendar,
    FaArrowLeft, FaChartLine, FaBriefcase, FaFileAlt,
    FaChevronLeft, FaChevronRight, FaSearch
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const RecommendationList = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

    const navigate = useNavigate();

    useEffect(() => {
        fetchRecommendations();
    }, [pagination.page]);

    const fetchRecommendations = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm
            });

            const token = localStorage.getItem('access_token') || localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`/api/admin/recommendations?${queryParams.toString()}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            const data = await res.json();

            if (data.success) {
                setRecommendations(data.data);
                setPagination(data.pagination);
            } else {
                toast.error(data.error || 'Failed to fetch recommendations');
            }
        } catch (err) {
            toast.error('Network error. Check connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination({ ...pagination, page: 1 });
        fetchRecommendations();
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600 bg-green-50';
        if (score >= 60) return 'text-orange-600 bg-orange-50';
        return 'text-red-600 bg-red-50';
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
                        <h1 className="text-2xl font-bold">Job Matching Stats</h1>
                        <p className="text-sm text-gray-500">View matches between users and jobs</p>
                    </div>
                </div>
                <div className="bg-purple-50 text-purple-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                    <FaChartLine /> Total Matches: {pagination.total}
                </div>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by user, job title or company..."
                        className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition shadow-md">
                    Search
                </button>
            </form>

            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Details</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Match %</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center">
                                        <div className="flex justify-center flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                            <span className="text-gray-500">Loading matches...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : recommendations.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                                        No matches found
                                    </td>
                                </tr>
                            ) : recommendations.map((rec) => (
                                <tr key={rec.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                                                {rec.user_name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">{rec.user_name}</div>
                                                <div className="text-[10px] text-gray-400">ID: {rec.user_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 font-semibold">{rec.title}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                            <FaBriefcase className="text-[10px]" /> {rec.company}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(rec.match_score)}`}>
                                            {rec.match_score}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <FaCalendar className="text-gray-300" />
                                            {new Date(rec.recommended_at).toLocaleDateString()}
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
                            Page {pagination.page} of {pagination.pages}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
                                disabled={pagination.page === 1}
                                className="p-2 border rounded-lg disabled:opacity-50 hover:bg-white transition"
                            >
                                <FaChevronLeft size={12} />
                            </button>
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

export default RecommendationList;
