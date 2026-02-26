import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaFileAlt, FaSync, FaComments, FaChartLine } from 'react-icons/fa';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon, onClick, color }) => (
    <div
        onClick={onClick}
        className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border-t-4 border-indigo-500"
    >
        <div className="flex justify-between items-center">
            <div>
                <p className="text-sm text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            </div>
            <div className={`text-3xl ${color}`}>
                {icon}
            </div>
        </div>
    </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            const data = await res.json();
            if (data.success) {
                setStats(data.data);
            } else {
                toast.error('Failed to fetch stats');
            }
        } catch (err) {
            toast.error('Network error');
        } finally {
            setLoading(false);
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
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
                    <p className="text-gray-600">Overview of system activity and management tools</p>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    <FaSync className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats?.total_users || 0}
                    icon={<FaUsers />}
                    color="text-blue-500"
                    onClick={() => navigate('/admin/users')}
                />
                <StatCard
                    title="Total Resumes"
                    value={stats?.total_resumes || 0}
                    icon={<FaFileAlt />}
                    color="text-purple-500"
                    onClick={() => navigate('/admin/resumes')}
                />
                <StatCard
                    title="ATS Conversions"
                    value={stats?.total_ats_conversions || 0}
                    icon={<FaFileAlt />}
                    color="text-green-500"
                    onClick={() => navigate('/admin/ats-resumes')}
                />
                <StatCard
                    title="Feedback Received"
                    value={stats?.total_feedback || 0}
                    icon={<FaComments />}
                    color="text-orange-500"
                    onClick={() => navigate('/admin/feedback')}
                />
                <StatCard
                    title="ATS Scores"
                    value={stats?.total_ats_scores || 0}
                    icon={<FaChartLine />}
                    color="text-indigo-500"
                    onClick={() => navigate('/admin/resumes')} // Fallback or new view
                />
                <StatCard
                    title="Skill Analyses"
                    value={stats?.total_skill_analyses || 0}
                    icon={<FaChartLine />}
                    color="text-blue-500"
                    onClick={() => navigate('/admin/resumes')} // Fallback or new view
                />
                <StatCard
                    title="Job Matches"
                    value={stats?.total_recommendations || 'View'}
                    icon={<FaChartLine />}
                    color="text-purple-500"
                    onClick={() => navigate('/admin/recommendations')}
                />
            </div>

            <div className="grid gap-8">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold mb-4">Quick Links</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <button
                            onClick={() => navigate('/admin/users')}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                        >
                            <div className="flex items-center gap-3">
                                <FaUsers className="text-blue-500" />
                                <span>Manage Users</span>
                            </div>
                            <span className="text-gray-400">→</span>
                        </button>
                        <button
                            onClick={() => navigate('/admin/feedback')}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                        >
                            <div className="flex items-center gap-3">
                                <FaComments className="text-orange-500" />
                                <span>Review Feedback</span>
                            </div>
                            <span className="text-gray-400">→</span>
                        </button>
                        <button
                            onClick={() => navigate('/admin/recommendations')}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                        >
                            <div className="flex items-center gap-3">
                                <FaChartLine className="text-purple-500" />
                                <span>Matching Stats</span>
                            </div>
                            <span className="text-gray-400">→</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
