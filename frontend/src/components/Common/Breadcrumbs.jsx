import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaChevronRight, FaHome } from 'react-icons/fa';

const Breadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    const breadcrumbMap = {
        'ats-score': 'ATS Score Prediction',
        'skill-analysis': 'Skill Analysis',
        'analyzer': 'Resume Analyzer',
        'builder': 'Resume Builder',
        'converter': 'ATS Converter',
        'jobs': 'Job Matches',
        'feedback': 'Feedback',
        'admin': 'Admin Panel',
        'users': 'Users',
        'resumes': 'Resumes',
        'recommendations': 'Recommendations'
    };

    return (
        <nav className="flex items-center text-sm text-gray-500 mb-6 bg-white p-3 rounded-lg shadow-sm">
            <Link to="/" className="hover:text-purple-600 transition-colors flex items-center">
                <FaHome className="mr-1" />
                <span>Dashboard</span>
            </Link>

            {pathnames.map((name, index) => {
                const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                const displayName = breadcrumbMap[name] || name.charAt(0).toUpperCase() + name.slice(1);

                return (
                    <React.Fragment key={name}>
                        <FaChevronRight className="mx-2 text-gray-300 text-[10px]" />
                        {isLast ? (
                            <span className="font-semibold text-purple-700">{displayName}</span>
                        ) : (
                            <Link to={routeTo} className="hover:text-purple-600 transition-colors capitalize">
                                {displayName}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;
