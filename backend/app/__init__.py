"""
app/__init__.py - Flask Application Factory
============================================
This module contains the Flask application factory pattern.
It creates and configures the Flask application instance.

The factory pattern allows:
- Multiple instances with different configs
- Easy testing with test configurations
- Delayed binding of Flask extensions
"""

# Standard library imports
import os
from datetime import timedelta

# Flask core imports
from flask import Flask
from flask_cors import CORS  # Cross-Origin Resource Sharing
from flask_pymongo import PyMongo  # MongoDB integration
from flask_jwt_extended import JWTManager  # JWT authentication
from flask_socketio import SocketIO  # Real-time WebSocket support

# Import configuration
from .config import Config

# ==============================================
# Initialize Flask Extensions (without app binding)
# ==============================================

# MongoDB instance - will be initialized with app later
# PyMongo provides MongoDB integration for Flask
mongo = PyMongo()

# JWT Manager for handling authentication tokens
# JWTs allow stateless authentication
jwt = JWTManager()

# SocketIO for real-time bidirectional communication
# Used for instant job notifications
socketio = SocketIO()


def create_app(config_class=Config):
    """
    Application Factory Function
    
    Creates and configures the Flask application instance.
    
    Args:
        config_class: Configuration class to use (default: Config)
    
    Returns:
        Flask: Configured Flask application instance
    
    Example:
        app = create_app()
        app.run(debug=True)
    """
    
    # ==============================================
    # Create Flask Application Instance
    # ==============================================
    
    # __name__ helps Flask locate resources relative to this module
    app = Flask(__name__)
    
    # Load configuration from the config class
    # This sets up database URI, secret keys, etc.
    app.config.from_object(config_class)
    
    # ==============================================
    # Initialize Flask Extensions with App
    # ==============================================
    
    # Initialize CORS - allows frontend (React) to communicate with backend
    # origins: list of allowed domains that can make requests
    CORS(app, origins=app.config.get('CORS_ORIGINS', ['http://localhost:3000']),
         supports_credentials=True)
    
    # Initialize MongoDB connection
    # PyMongo uses MONGO_URI from config to connect to database
    mongo.init_app(app)
    
    # Initialize JWT Manager
    # Sets up token creation and verification
    jwt.init_app(app)
    
    # Initialize SocketIO for real-time features
    # cors_allowed_origins: which domains can connect via WebSocket
    # async_mode: 'eventlet' for production, 'threading' for development
    socketio.init_app(
        app,
        cors_allowed_origins="*",
        async_mode='eventlet'
    )
    
    # ==============================================
    # Register Blueprints (Route Modules)
    # ==============================================
    
    # Blueprints organize routes into modular components
    # Each blueprint handles a specific feature area
    
    # Authentication routes (login, register, logout)
    from .routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # Resume analysis routes (upload, analyze, get skills)
    from .routes.resume import resume_bp
    app.register_blueprint(resume_bp, url_prefix='/api/resume')
    
    # Resume builder routes (create, update, download)
    from .routes.builder import builder_bp
    app.register_blueprint(builder_bp, url_prefix='/api/builder')
    
    # Job recommendation routes (list, apply, save)
    from .routes.jobs import jobs_bp
    app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
    
    # AI routes (summary generation, AI tools)
    from .routes.ai import ai_bp
    app.register_blueprint(ai_bp, url_prefix='/api/ai')

    
    # ==============================================
    # Register SocketIO Event Handlers
    # ==============================================
    
    from .routes.jobs import register_socket_events
    register_socket_events(socketio)
    
    # ==============================================
    # Error Handlers
    # ==============================================
    
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 Not Found errors"""
        return {'error': 'Resource not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 Internal Server errors"""
        return {'error': 'Internal server error'}, 500
    
    # ==============================================
    # Health Check Endpoint
    # ==============================================
    
    @app.route('/api/health')
    def health_check():
        """
        Health check endpoint for monitoring.
        Returns server status and database connection state.
        """
        try:
            # Test MongoDB connection
            mongo.db.command('ping')
            db_status = 'connected'
        except Exception:
            db_status = 'disconnected'
        
        return {
            'status': 'healthy',
            'database': db_status,
            'version': '1.0.0'
        }
    
    # Return the configured application instance
    return app