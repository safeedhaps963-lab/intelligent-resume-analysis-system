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
    get_jwt,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies
)
import hashlib
from bson import ObjectId

from app import mongo
from app.models.user import User
from app.config import Config

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
    
    import re
    email_regex = r'^[a-zA-Z0-9._%+-]+@ [a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'.replace(' ', '')
    if not re.match(email_regex, email):
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
    access_token = create_access_token(
        identity=str(user._id),
        additional_claims={'role': user.role}
    )
    refresh_token = create_refresh_token(identity=str(user._id))
    
    return jsonify({
        'success': True,
        'message': 'User registered successfully',
        'data': {
            'user': user.to_public_dict(),
            'role': user.role,
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
    
    # Basic validation
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Valid ObjectId for demo user
    DEMO_USER_ID = '507f191e810c19729de860ea'
    
    # Check for demo login
    if email == 'demo@example.com' and password == 'demo123':
        # Ensure demo user exists in DB
        user_in_db = mongo.db.users.find_one({'email': 'demo@example.com'})
        if not user_in_db:
            # Create demo user if not exists
            demo_user_obj = User(
                email='demo@example.com',
                name='Demo User',
                password='demo123' # Not used directly but for consistency
            )
            demo_user_obj.role = 'admin'
            user_data = demo_user_obj.to_dict(include_password=True)
            user_data['_id'] = ObjectId(DEMO_USER_ID)
            mongo.db.users.insert_one(user_data)
        else:
            # Ensure role is admin
            if user_in_db.get('role') != 'admin':
                mongo.db.users.update_one(
                    {'_id': user_in_db['_id']},
                    {'$set': {'role': 'admin'}}
                )
        
        # Create JWT tokens for demo
        access_token = create_access_token(
            identity=DEMO_USER_ID,
            additional_claims={'role': 'admin'}
        )
        refresh_token = create_refresh_token(identity=DEMO_USER_ID)
        
        return jsonify({
            'success': True,
            'message': 'Demo login successful',
            'data': {
                'user': {
                    'id': DEMO_USER_ID,
                    'name': 'Demo User',
                    'email': 'demo@example.com',
                    'role': 'admin'
                },
                'role': 'admin',
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
    access_token = create_access_token(
        identity=str(user._id),
        additional_claims={'role': user.role}
    )
    refresh_token = create_refresh_token(identity=str(user._id))
    
    return jsonify({
        'success': True,
        'message': 'Login successful',
        'data': {
            'user': user.to_public_dict(),
            'role': user.role,
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
    
    response = jsonify({
        'success': True,
        'message': 'Logged out successfully'
    })
    unset_jwt_cookies(response)
    return response, 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh the access token using a valid refresh token.
    
    Response:
        - 200: New access token created
        - 401: Invalid refresh token
    """
    user_id = get_jwt_identity()
    user_data = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    
    if not user_data:
        return jsonify({'error': 'User not found'}), 401
    
    user = User.from_dict(user_data)
    
    # Create new access token
    access_token = create_access_token(
        identity=str(user._id),
        additional_claims={'role': user.role}
    )
    
    return jsonify({
        'success': True,
        'access_token': access_token,
        'user': user.to_public_dict(),
        'role': user.role
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
    
    try:
        if not ObjectId.is_valid(user_id):
            return jsonify({'valid': False, 'error': 'Invalid user ID format'}), 401
            
        # Find user in database
        user_data = mongo.db.users.find_one({'_id': ObjectId(user_id)})
        
        if not user_data:
            return jsonify({'valid': False, 'error': 'User not found'}), 401
            
    except Exception as e:
        # Return 500 for server/db errors, NOT 401, to prevent frontend logout
        return jsonify({'valid': False, 'error': str(e)}), 500
    
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
    
    if not ObjectId.is_valid(user_id):
        return jsonify({'error': 'Invalid user ID format'}), 400
        
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