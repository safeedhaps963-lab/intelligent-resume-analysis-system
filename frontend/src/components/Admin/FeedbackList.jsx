import React, { useState, useEffect } from 'react';
import { FaCommentAlt, FaUser, FaCalendar, FaArrowLeft, FaCheck, FaTrash, FaTag, FaEnvelope } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const FeedbackList = () => {
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            const res = await fetch('/api/admin/feedback', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setFeedback(data.data);
            } else {
                toast.error(data.error || 'Failed to fetch feedback');
            }
        } catch (err) {
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id) => {
        try {
            const res = await fetch(`/api/admin/feedback/${id}/resolve`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
                }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Feedback marked as resolved');
                fetchFeedback();
            } else {
                toast.error(data.error || 'Failed to resolve feedback');
            }
        } catch (err) {
            toast.error('Network error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this feedback?')) return;

        try {
            const res = await fetch(`/api/admin/feedback/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
                }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Feedback deleted successfully');
                fetchFeedback();
            } else {
                toast.error(data.error || 'Failed to delete feedback');
            }
        } catch (err) {
            toast.error('Network error');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

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
                    <h1 className="text-2xl font-bold">User Feedback & Complaints</h1>
                </div>
                <div className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-sm font-medium">
                    {feedback.length} Total Submissions
                </div>
            </div>

            {feedback.length === 0 ? (
                <div className="bg-white p-12 rounded-xl shadow-md text-center">
                    <FaCommentAlt className="text-4xl text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500">No feedback submissions found yet.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {feedback.map((item) => (
                        <div key={item.id} className={`bg-white p-6 rounded-xl shadow-md border-l-4 ${item.status === 'resolved' ? 'border-green-500' : 'border-orange-500'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 ${item.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'} rounded-full flex items-center justify-center`}>
                                        <FaUser />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{item.name || 'Anonymous User'}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <FaEnvelope className="text-xs" /> {item.email || 'No email provided'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                                        <FaCalendar /> {new Date(item.created_at).toLocaleString()}
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                        {item.status ? item.status.toUpperCase() : 'PENDING'}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <FaTag className="text-xs text-indigo-400" />
                                    <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">{item.type}</span>
                                </div>
                                <h4 className="font-bold text-gray-800 mb-2">{item.subject}</h4>
                                <div className="bg-gray-50 p-4 rounded-lg text-gray-700 border border-gray-100">
                                    {item.message || item.content}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-50">
                                {item.status !== 'resolved' && (
                                    <button
                                        onClick={() => handleResolve(item.id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-medium transition"
                                    >
                                        <FaCheck className="text-sm" /> Mark Resolved
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium transition"
                                >
                                    <FaTrash className="text-sm" /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FeedbackList;
