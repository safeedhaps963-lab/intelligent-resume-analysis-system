import React, { useState, useEffect } from 'react';
import {
    FaFileAlt, FaUser, FaEnvelope, FaCalendar,
    FaTrash, FaEye, FaSearch, FaFilter,
    FaChevronLeft, FaChevronRight, FaArrowLeft,
    FaChartBar, FaCheckCircle, FaUpload
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ResumeList = () => {
    // State
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

    const navigate = useNavigate();

    useEffect(() => {
        fetchResumes();
    }, [pagination.page]);

    const fetchResumes = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit
            });

            const res = await fetch(`/api/admin/resumes?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
                }
            });
            const data = await res.json();

            if (data.success) {
                setResumes(data.data);
                setPagination(data.pagination);
            } else {
                toast.error(data.error || 'Failed to fetch resumes');
            }
        } catch (err) {
            toast.error('Network error. Check connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this resume?')) return;

        try {
            const res = await fetch(`/api/admin/resumes/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
                }
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Resume deleted successfully');
                fetchResumes();
            } else {
                toast.error(data.error || 'Failed to delete resume');
            }
        } catch (err) {
            toast.error('Delete failed');
        }
    };


    const getScoreColor = (score) => {
        if (!score && score !== 0) return 'text-gray-400';
        if (score >= 80) return 'text-green-500 font-bold';
        if (score >= 60) return 'text-yellow-500 font-bold';
        return 'text-red-500 font-bold';
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
                        <h1 className="text-2xl font-bold">Manage Resumes</h1>
                        <p className="text-sm text-gray-500">View and manage all system resumes</p>
                    </div>
                </div>
                <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                    <FaFileAlt /> Total: {pagination.total}
                </div>
            </div>

            {/* Simple list view - filters removed */}

            {/* Resume Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User / Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Details</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">ATS Score</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Upload Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center">
                                        <div className="flex justify-center flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                            <span className="text-gray-500">Loading resumes...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : resumes.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                                        No resumes found matching your criteria
                                    </td>
                                </tr>
                            ) : resumes.map((resume) => (
                                <tr key={resume.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                <FaUser />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{resume.user_name}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    <FaEnvelope className="text-[10px]" /> {resume.user_email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 font-medium">{resume.filename}</div>
                                        <div className="text-xs text-gray-400">ID: {resume.id}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {resume.ats_score ? (
                                            <div className="flex flex-col items-center">
                                                <span className={`text-lg ${getScoreColor(resume.ats_score)}`}>
                                                    {resume.ats_score}%
                                                </span>
                                                <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                    <div className={`h-full ${resume.ats_score >= 80 ? 'bg-green-500' : resume.ats_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${resume.ats_score}%` }}></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-300">N/A</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${resume.status === 'Scored' ? 'bg-green-100 text-green-700' :
                                            resume.status === 'Analyzed' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {resume.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <FaCalendar className="text-gray-400" />
                                            {new Date(resume.upload_date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => navigate(`/admin/view-resume/${resume.id}`)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                title="View Details"
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(resume.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Delete Resume"
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
                                {[...Array(pagination.pages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPagination({ ...pagination, page: i + 1 })}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition ${pagination.page === i + 1 ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white border text-gray-600'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
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

export default ResumeList;
