/**
 * index.js - React Application Entry Point
 * ==========================================
 * This is the main entry point for the React application.
 * It renders the App component into the DOM.
 * 
 * React 18 uses createRoot for concurrent rendering features.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Get the root element from index.html
const rootElement = document.getElementById('root');

// Create React 18 root for concurrent features
const root = ReactDOM.createRoot(rootElement);

// Render the App component
// StrictMode helps identify potential problems in development
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);