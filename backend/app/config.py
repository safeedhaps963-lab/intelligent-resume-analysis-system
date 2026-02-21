"""
app/config.py - Application Configuration
==========================================
This module contains all configuration settings for the Flask application.
Configurations are loaded from environment variables for security.

Environment variables should be set in .env file for development
and in the server environment for production.
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
# This must be called before accessing os.environ
load_dotenv()


class Config:
    """
    Base Configuration Class
    
    Contains all configuration settings for the Flask application.
    Values are loaded from environment variables with fallback defaults.
    
    Attributes:
        SECRET_KEY: Flask secret key for session signing
        MONGO_URI: MongoDB connection string
        JWT_SECRET_KEY: Secret key for JWT token signing
        etc.
    """
    
    # ==============================================
    # Flask Core Settings
    # ==============================================
    
    # Secret key for Flask sessions and security features
    # IMPORTANT: Change this in production!
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Debug mode - enables detailed error pages and auto-reload
    # Should be False in production
    DEBUG = os.environ.get('FLASK_DEBUG', '1') == '1'
    
    # ==============================================
    # MongoDB Configuration
    # ==============================================
    
    # MongoDB connection URI
    # Format: mongodb://[username:password@]host:port/database
    MONGO_URI = os.environ.get(
        'MONGODB_URI',
        'mongodb://localhost:27017/resume_analyzer'
    )
    
    # ==============================================
    # JWT (JSON Web Token) Configuration
    # ==============================================
    
    # Secret key for signing JWT tokens
    # Must be different from Flask SECRET_KEY
    JWT_SECRET_KEY = os.environ.get(
        'JWT_SECRET_KEY',
        'jwt-secret-key-change-in-production'
    )
    
    # Token expiration time
    # Access tokens expire after 1 hour by default
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 3600))
    )
    
    # Refresh token expiration (30 days)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Where to look for JWT token
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    
    # ==============================================
    # CORS (Cross-Origin Resource Sharing) Settings
    # ==============================================
    
    # List of allowed origins for CORS requests
    # Frontend URL(s) that can access this API
    CORS_ORIGINS = os.environ.get(
        'CORS_ORIGINS',
        'http://localhost:3000'
    ).split(',')
    
    # ==============================================
    # File Upload Configuration
    # ==============================================
    
    # Maximum file size for uploads (16MB)
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))
    
    # Directory for storing uploaded files
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
    
    # Allowed file extensions for resume uploads
    ALLOWED_EXTENSIONS = set(
        os.environ.get('ALLOWED_EXTENSIONS', 'pdf,doc,docx,txt').split(',')
    )
    
    # ==============================================
    # NLP & AI Configuration
    # ==============================================
    
    # SpaCy model to use for NLP processing
    SPACY_MODEL = 'en_core_web_lg'
    
    # Minimum confidence score for skill extraction
    SKILL_CONFIDENCE_THRESHOLD = 0.7
    
    # ==============================================
    # Rate Limiting
    # ==============================================
    
    # Maximum requests per minute per IP
    RATE_LIMIT = os.environ.get('RATE_LIMIT', '60/minute')


class DevelopmentConfig(Config):
    """Development-specific configuration"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production-specific configuration"""
    DEBUG = False
    TESTING = False
    
    # Enforce HTTPS in production
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True


class TestingConfig(Config):
    """Testing-specific configuration"""
    TESTING = True
    DEBUG = True
    
    # Use separate test database
    MONGO_URI = 'mongodb://localhost:27017/resume_analyzer_test'


# Configuration dictionary for easy selection
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}