/**
 * services/socket.js - WebSocket Service
 * =======================================
 * This module manages the Socket.IO connection for real-time
 * features like job notifications and application updates.
 * 
 * Uses Socket.IO client to connect to Flask-SocketIO backend.
 * 
 * Features:
 * - Automatic reconnection
 * - Event subscription management
 * - Connection state tracking
 * 
 * Usage:
 *   import { socketService } from './services/socket';
 *   socketService.connect();
 *   socketService.onNewJob((job) => console.log('New job:', job));
 */

import { io } from 'socket.io-client';

// ==========================================
// Socket.IO Configuration
// ==========================================

/**
 * Socket.IO server URL
 * In development, uses the same host as the Flask backend
 * In production, update to your deployed server URL
 */
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

/**
 * Socket.IO connection options
 */
const SOCKET_OPTIONS = {
  // Auto-connect is disabled; we connect manually when needed
  autoConnect: false,
  
  // Reconnection settings
  reconnection: true,           // Enable automatic reconnection
  reconnectionAttempts: 5,      // Max reconnection attempts
  reconnectionDelay: 1000,      // Delay between reconnections (ms)
  reconnectionDelayMax: 5000,   // Max delay between reconnections
  
  // Timeout settings
  timeout: 20000,               // Connection timeout (ms)
  
  // Transport settings
  transports: ['websocket', 'polling'], // Preferred transports
};

// ==========================================
// Socket Service Class
// ==========================================

/**
 * SocketService - Manages WebSocket connections
 * 
 * Singleton class that provides methods for:
 * - Connecting/disconnecting from server
 * - Subscribing to job notifications
 * - Handling real-time events
 * 
 * @example
 * // Connect and subscribe
 * socketService.connect();
 * socketService.subscribeToJobs('user123', ['Python', 'React']);
 * 
 * // Listen for events
 * socketService.onNewJob((job) => {
 *   alert(`New job: ${job.title}`);
 * });
 */
class SocketService {
  constructor() {
    /**
     * Socket.IO client instance
     * @type {Socket|null}
     */
    this.socket = null;
    
    /**
     * Connection status
     * @type {boolean}
     */
    this.isConnected = false;
    
    /**
     * Event listeners registry
     * Stores callbacks for different event types
     * @type {Object.<string, Function[]>}
     */
    this.listeners = {
      newJob: [],
      applicationUpdate: [],
      connectionChange: []
    };
    
    /**
     * User ID for personal room subscription
     * @type {string|null}
     */
    this.userId = null;
    
    /**
     * User's skills for job matching
     * @type {string[]}
     */
    this.userSkills = [];
  }
  
  // ==========================================
  // Connection Management
  // ==========================================
  
  /**
   * Connect to the Socket.IO server
   * 
   * Establishes WebSocket connection and sets up event handlers.
   * Safe to call multiple times - will not create duplicate connections.
   * 
   * @returns {void}
   * 
   * @example
   * socketService.connect();
   */
  connect() {
    // Don't connect if already connected
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }
    
    // Create new socket connection
    this.socket = io(SOCKET_URL, SOCKET_OPTIONS);
    
    // Setup connection event handlers
    this._setupEventHandlers();
    
    // Connect to server
    this.socket.connect();
    
    console.log('Socket connecting to:', SOCKET_URL);
  }
  
  /**
   * Disconnect from the Socket.IO server
   * 
   * Cleanly disconnects and clears all subscriptions.
   * 
   * @returns {void}
   */
  disconnect() {
    if (this.socket) {
      // Unsubscribe from rooms before disconnecting
      if (this.userId) {
        this.socket.emit('unsubscribe_jobs', { user_id: this.userId });
      }
      
      // Disconnect socket
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.userId = null;
      
      console.log('Socket disconnected');
    }
  }
  
  /**
   * Setup internal event handlers
   * 
   * Configures listeners for Socket.IO events like
   * connect, disconnect, error, etc.
   * 
   * @private
   */
  _setupEventHandlers() {
    // Connection successful
    this.socket.on('connect', () => {
      console.log('Socket connected with ID:', this.socket.id);
      this.isConnected = true;
      
      // Re-subscribe if we have user info (reconnection scenario)
      if (this.userId) {
        this.subscribeToJobs(this.userId, this.userSkills);
      }
      
      // Notify listeners
      this._notifyListeners('connectionChange', { connected: true });
    });
    
    // Connection lost
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      
      // Notify listeners
      this._notifyListeners('connectionChange', { connected: false, reason });
    });
    
    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.isConnected = false;
    });
    
    // Server confirmation of subscription
    this.socket.on('subscribed', (data) => {
      console.log('Subscribed to job notifications:', data);
    });
    
    // New job notification from server
    this.socket.on('new_job', (data) => {
      console.log('New job notification:', data);
      this._notifyListeners('newJob', data.job);
    });
    
    // Application status update
    this.socket.on('application_update', (data) => {
      console.log('Application update:', data);
      this._notifyListeners('applicationUpdate', data);
    });
  }
  
  // ==========================================
  // Subscription Methods
  // ==========================================
  
  /**
   * Subscribe to job notifications
   * 
   * Joins a personal room to receive job notifications
   * matched to the user's skills.
   * 
   * @param {string} userId - User's unique ID
   * @param {string[]} skills - User's skills for matching
   * @returns {void}
   * 
   * @example
   * socketService.subscribeToJobs('user123', ['Python', 'React', 'AWS']);
   */
  subscribeToJobs(userId, skills = []) {
    if (!this.socket?.connected) {
      console.warn('Cannot subscribe: socket not connected');
      return;
    }
    
    // Store for reconnection
    this.userId = userId;
    this.userSkills = skills;
    
    // Send subscription request to server
    this.socket.emit('subscribe_jobs', {
      user_id: userId,
      skills: skills
    });
    
    console.log('Subscribing to jobs for user:', userId);
  }
  
  /**
   * Unsubscribe from job notifications
   * 
   * @returns {void}
   */
  unsubscribeFromJobs() {
    if (this.socket?.connected && this.userId) {
      this.socket.emit('unsubscribe_jobs', { user_id: this.userId });
      this.userId = null;
      this.userSkills = [];
      
      console.log('Unsubscribed from job notifications');
    }
  }
  
  // ==========================================
  // Event Listener Methods
  // ==========================================
  
  /**
   * Register callback for new job notifications
   * 
   * @param {Function} callback - Function to call when new job arrives
   * @returns {Function} Unsubscribe function
   * 
   * @example
   * const unsubscribe = socketService.onNewJob((job) => {
   *   console.log('New job:', job.title);
   * });
   * 
   * // Later, to stop listening:
   * unsubscribe();
   */
  onNewJob(callback) {
    this.listeners.newJob.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.newJob = this.listeners.newJob.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Register callback for application updates
   * 
   * @param {Function} callback - Function to call on application update
   * @returns {Function} Unsubscribe function
   */
  onApplicationUpdate(callback) {
    this.listeners.applicationUpdate.push(callback);
    
    return () => {
      this.listeners.applicationUpdate = 
        this.listeners.applicationUpdate.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Register callback for connection state changes
   * 
   * @param {Function} callback - Function to call on connection change
   * @returns {Function} Unsubscribe function
   */
  onConnectionChange(callback) {
    this.listeners.connectionChange.push(callback);
    
    return () => {
      this.listeners.connectionChange = 
        this.listeners.connectionChange.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notify all listeners of an event
   * 
   * @private
   * @param {string} eventType - Type of event
   * @param {*} data - Event data to pass to listeners
   */
  _notifyListeners(eventType, data) {
    const listeners = this.listeners[eventType] || [];
    
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${eventType} listener:`, error);
      }
    });
  }
  
  // ==========================================
  // Utility Methods
  // ==========================================
  
  /**
   * Get current connection status
   * 
   * @returns {boolean} True if connected
   */
  getConnectionStatus() {
    return this.socket?.connected || false;
  }
  
  /**
   * Get socket ID (useful for debugging)
   * 
   * @returns {string|null} Socket ID or null if not connected
   */
  getSocketId() {
    return this.socket?.id || null;
  }
}

// ==========================================
// Export Singleton Instance
// ==========================================

/**
 * Singleton instance of SocketService
 * 
 * Use this throughout the application to ensure
 * a single WebSocket connection.
 */
export const socketService = new SocketService();

// Also export the class for testing purposes
export { SocketService };