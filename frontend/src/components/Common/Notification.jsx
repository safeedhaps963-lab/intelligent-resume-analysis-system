/**
 * Notifications.jsx - Real-time Notifications Component
 * =======================================================
 * Displays toast-style notifications for:
 * - New job matches
 * - Application updates
 * - System messages
 * 
 * Features:
 * - Slide-in animation
 * - Auto-dismiss after 5 seconds
 * - Click to navigate
 * - Dismiss button
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCheckCircle, FaExclamationCircle, FaInfoCircle, 
  FaBriefcase, FaTimes 
} from 'react-icons/fa';

/**
 * NotificationItem - Single notification toast
 * 
 * @param {object} notification - Notification data
 * @param {function} onDismiss - Dismiss handler
 */
const NotificationItem = ({ notification, onDismiss }) => {
  const navigate = useNavigate();

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  // Icon and color based on type
  const getTypeStyles = () => {
    switch (notification.type) {
      case 'success':
        return {
          icon: <FaCheckCircle />,
          bgColor: 'bg-green-500',
          borderColor: 'border-green-500'
        };
      case 'error':
        return {
          icon: <FaExclamationCircle />,
          bgColor: 'bg-red-500',
          borderColor: 'border-red-500'
        };
      case 'job':
        return {
          icon: <FaBriefcase />,
          bgColor: 'bg-purple-500',
          borderColor: 'border-purple-500'
        };
      case 'info':
      default:
        return {
          icon: <FaInfoCircle />,
          bgColor: 'bg-blue-500',
          borderColor: 'border-blue-500'
        };
    }
  };

  const styles = getTypeStyles();

  // Handle click to navigate (for job notifications)
  const handleClick = () => {
    if (notification.type === 'job' && notification.data) {
      navigate('/jobs');
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-lg p-4 mb-3 flex items-start space-x-3 
                  border-l-4 ${styles.borderColor} animate-slide-in cursor-pointer
                  hover:shadow-xl transition-shadow`}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={`w-8 h-8 ${styles.bgColor} rounded-full flex items-center 
                       justify-center flex-shrink-0`}>
        <span className="text-white text-sm">{styles.icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800">{notification.title}</p>
        <p className="text-sm text-gray-600 truncate">{notification.message}</p>
        
        {/* Action link for job notifications */}
        {notification.type === 'job' && (
          <button 
            className="text-purple-600 text-sm font-medium mt-1 hover:text-purple-800"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/jobs');
            }}
          >
            View Job →
          </button>
        )}
      </div>

      {/* Dismiss button */}
      <button 
        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(notification.id);
        }}
      >
        <FaTimes />
      </button>
    </div>
  );
};

/**
 * Notifications Container Component
 * 
 * @param {array} notifications - Array of notification objects
 * @param {function} onDismiss - Handler to dismiss a notification
 */
const Notifications = ({ notifications = [], onDismiss }) => {
  // Only show the most recent 5 notifications
  const visibleNotifications = notifications.slice(0, 5);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full pointer-events-none">
      <div className="pointer-events-auto">
        {visibleNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
};

export default Notifications;