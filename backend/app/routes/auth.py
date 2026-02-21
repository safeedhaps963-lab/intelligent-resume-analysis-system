"""
app/routes/auth.py - Authentication API Routes
================================================
This module handles user authentication endpoints.

Endpoints:
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login existing user
- POST /api/auth/logout - Logout current user
- GET /api/auth/validate - Validate JWT token
- GET /api/auth/me - Get current user info
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from bson import ObjectId

from app import mongo
from app.models.user import User

# Create Blueprint for auth routes
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user.
    
    Request Body:
        - email: User's email address (required)
        - password: User's password (required, min 6 chars)
        - name: User's display name (required)
    
    Response:
        - 201: User created successfully with token
        - 400: Validation error
        - 409: Email already exists
    
    Example:
        POST /api/auth/register
        {
            "email": "user@example.com",
            "password": "secure123",
            "name": "John Doe"
        }
    """
    # Get request data
    data = request.get_json()
    
    # Validate required fields
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    name = data.get('name', '').strip()
    
    # Validation checks
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    if not password or len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    if not name:
        return jsonify({'error': 'Name is required'}), 400
    
    # Check email format (basic validation)
    if '@' not in email or '.' not in email:
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Check if email already exists
    existing_user = mongo.db.users.find_one({'email': email})
    if existing_user:
        return jsonify({'error': 'Email already registered'}), 409
    
    # Create new user
    user = User(email=email, name=name, password=password)
    
    # Save to MongoDB
    mongo.db.users.insert_one(user.to_dict(include_password=True))
    
    # Create JWT tokens
    access_token = create_access_token(identity=str(user._id))
    refresh_token = create_refresh_token(identity=str(user._id))
    
    return jsonify({
        'success': True,
        'message': 'User registered successfully',
        'data': {
            'user': user.to_public_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login existing user.
    
    Request Body:
        - email: User's email address
        - password: User's password
    
    Response:
        - 200: Login successful with tokens
        - 401: Invalid credentials
    
    Example:
        POST /api/auth/login
        {
            "email": "user@example.com",
            "password": "secure123"
        }
    """
    data = request.get_json()
    
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    # Check for demo login
    if email == 'demo@example.com' and password == 'demo123':
        # Create demo user data
        demo_user = {
            '_id': 'demo_user_id',
            'name': 'Demo User',
            'email': 'demo@example.com',
            'created_at': datetime.utcnow(),
            'last_login': datetime.utcnow()
        }
        
        # Create JWT tokens for demo
        access_token = create_access_token(identity='demo_user_id')
        refresh_token = create_refresh_token(identity='demo_user_id')
        
        return jsonify({
            'success': True,
            'message': 'Demo login successful',
            'data': {
                'user': {
                    'id': 'demo_user_id',
                    'name': 'Demo User',
                    'email': 'demo@example.com'
                },
                'access_token': access_token,
                'refresh_token': refresh_token
            }
        }), 200
    
    # Find user in database
    user_data = mongo.db.users.find_one({'email': email})
    
    if not user_data:
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Create user object and verify password
    user = User.from_dict(user_data)
    
    if not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Update last login time
    mongo.db.users.update_one(
        {'_id': user._id},
        {'$set': {'last_login': datetime.utcnow()}}
    )
    
    # Create JWT tokens
    access_token = create_access_token(identity=str(user._id))
    refresh_token = create_refresh_token(identity=str(user._id))
    
    return jsonify({
        'success': True,
        'message': 'Login successful',
        'data': {
            'user': user.to_public_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout current user.
    
    In a production system, you would:
    - Add the token to a blacklist
    - Clear session data
    - Invalidate refresh tokens
    
    Response:
        - 200: Logout successful
    """
    # In production, add token to blacklist
    # For now, just return success (client should delete token)
    
    return jsonify({
        'success': True,
        'message': 'Logged out successfully'
    }), 200


@auth_bp.route('/validate', methods=['GET'])
@jwt_required()
def validate_token():
    """
    Validate JWT token and return user info.
    
    Used by frontend to check if stored token is still valid.
    
    Response:
        - 200: Token valid with user info
        - 401: Token invalid/expired
    """
    user_id = get_jwt_identity()
    
    # Find user in database
    user_data = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    
    if not user_data:
        return jsonify({'valid': False}), 401
    
    user = User.from_dict(user_data)
    
    return jsonify({
        'valid': True,
        'user': user.to_public_dict()
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current authenticated user's information.
    
    Response:
        - 200: User information
        - 404: User not found
    """
    user_id = get_jwt_identity()
    
    user_data = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    
    if not user_data:
        return jsonify({'error': 'User not found'}), 404
    
    user = User.from_dict(user_data)
    
    return jsonify({
        'success': True,
        'data': user.to_public_dict()
    }), 200


@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    """
    Update current user's profile.
    
    Request Body:
        - name: Updated name (optional)
        - preferences: Updated preferences (optional)
    
    Response:
        - 200: Profile updated
        - 404: User not found
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Build update object
    update_data = {'updated_at': datetime.utcnow()}
    
    if 'name' in data:
        update_data['name'] = data['name'].strip()
    
    if 'preferences' in data:
        update_data['preferences'] = data['preferences']
    
    # Update in database
    result = mongo.db.users.update_one(
        {'_id': ObjectId(user_id)},
        {'$set': update_data}
    )
    
    if result.matched_count == 0:
        return jsonify({'error': 'User not found'}), 404
    
    # Get updated user
    user_data = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    user = User.from_dict(user_data)
    
    return jsonify({
        'success': True,
        'message': 'Profile updated successfully',
        'data': user.to_public_dict()
    }), 200


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """
    Change user's password.
    
    Request Body:
        - current_password: Current password
        - new_password: New password (min 6 chars)
    
    Response:
        - 200: Password changed
        - 400: Validation error
        - 401: Current password incorrect
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    
    if not current_password or not new_password:
        return jsonify({'error': 'Both passwords are required'}), 400
    
    if len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    
    # Get user and verify current password
    user_data = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    
    if not user_data:
        return jsonify({'error': 'User not found'}), 404
    
    user = User.from_dict(user_data)
    
    if not user.check_password(current_password):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    # Set new password
    user.set_password(new_password)
    
    # Update in database
    mongo.db.users.update_one(
        {'_id': ObjectId(user_id)},
        {'$set': {
            'password_hash': user.password_hash,
            'updated_at': datetime.utcnow()
        }}
    )
    
    return jsonify({
        'success': True,
        'message': 'Password changed successfully'
    }), 200