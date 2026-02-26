"""
app/routes/feedback.py - Feedback API Routes
==============================================
This module handles user feedback submissions.
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

from app import mongo
from app.models.feedback import Feedback
from app.models.user import User

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('', methods=['POST'])
def submit_feedback():
    """
    Submit user feedback/complaint/suggestion.
    """
    data = request.get_json()
    
    type = data.get('type')
    subject = data.get('subject')
    message = data.get('message')
    
    if not all([type, subject, message]):
        return jsonify({'error': 'Type, subject, and message are required'}), 400
        
    feedback_types = ['feedback', 'complaint', 'suggestion', 'bug']
    if type not in feedback_types:
        return jsonify({'error': f'Invalid type. Must be one of {feedback_types}'}), 400

    # Get user info if authenticated
    user_id = None
    name = data.get('name')
    email = data.get('email')
    
    # Try to get user from token
    try:
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request(optional=True)
        user_identity = get_jwt_identity()
        if user_identity:
            user_id = user_identity
            user_data = mongo.db.users.find_one({'_id': ObjectId(user_id)})
            if user_data:
                name = name or user_data.get('name')
                email = email or user_data.get('email')
    except Exception:
        pass
        
    feedback = Feedback(
        type=type,
        subject=subject,
        message=message,
        user_id=user_id,
        name=name,
        email=email
    )
    
    mongo.db.feedback.insert_one(feedback.to_dict())
    
    return jsonify({
        'success': True,
        'message': 'Feedback submitted successfully'
    }), 201
