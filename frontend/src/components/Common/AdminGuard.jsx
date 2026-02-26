import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppContext } from '../../App';

const AdminGuard = ({ children }) => {
    const { isAuthenticated, userRole } = useContext(AppContext);
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (userRole !== 'admin') {
        // Redirect to dashboard if not an admin
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default AdminGuard;
