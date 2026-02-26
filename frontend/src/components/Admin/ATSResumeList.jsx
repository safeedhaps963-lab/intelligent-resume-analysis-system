import React, { useState, useEffect } from 'react';
import {
    FaFileAlt, FaUser, FaEnvelope, FaCalendar,
    FaTrash, FaEye, FaSearch, FaArrowLeft,
    FaChevronLeft, FaChevronRight, FaFileContract
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ATSResumeList = () => {
    const [atsResumes, setAtsResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
    const [search, setSearch] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        fetchATSResumes();
    }, [pagination.page]);

    const fetchATSResumes = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                search
            });

            const res = await fetch(`/api/admin/ats-resumes?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
                }
            });
            const data = await res.json();

            if (data.success) {
                setAtsResumes(data.data);
                setPagination(data.pagination);
            } else {
                toast.error(data.error || 'Failed to fetch ATS conversions');
            }
        } catch (err) {
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this ATS conversion record?')) return;

        try {
            const res = await fetch(`/api/admin/ats-resumes/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
                }
            });
            const data = await res.json();

            if (data.success) {
                toast.success('ATS Record deleted successfully');
                fetchATSResumes();
            } else {
                toast.error(data.error || 'Failed to delete record');
            }
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination({ ...pagination, page: 1 });
        fetchATSResumes();
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
                        <h1 className="text-2xl font-bold text-gray-800">ATS Conversions</h1>
                        <p className="text-sm text-gray-500">Manage optimized resume conversions</p>
                    </div>
                </div>
                <div className="bg-green-50 text-green-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                    <FaFileContract /> Total conversions: {pagination.total}
                </div>
            </div>

            {/* Quick Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by user name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversion ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Created</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : atsResumes.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                                        No conversions found
                                    </td>
                                </tr>
                            ) : atsResumes.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                <FaUser size={14} />
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">{doc.user_name}</div>
                                                <div className="text-xs text-gray-500">{doc.user_email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                            {doc.resume_id}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <FaCalendar className="text-gray-400" />
                                            {new Date(doc.created_at).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Delete Record"
                                            >
                                                <FaTrash />
                                            </button>
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
                            Page <span className="font-medium">{pagination.page}</span> of <span className="font-medium">{pagination.pages}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
                                disabled={pagination.page === 1}
                                className="p-1 border rounded disabled:opacity-50"
                            >
                                <FaChevronLeft />
                            </button>
                            <button
                                onClick={() => setPagination({ ...pagination, page: Math.min(pagination.pages, pagination.page + 1) })}
                                disabled={pagination.page === pagination.pages}
                                className="p-1 border rounded disabled:opacity-50"
                            >
                                <FaChevronRight />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ATSResumeList;
