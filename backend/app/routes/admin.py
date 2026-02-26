"""
app/routes/admin.py - Administrative API Routes
================================================
This module handles admin-specific endpoints.

Endpoints:
- GET /api/admin/stats - System-wide statistics
- GET /api/admin/users - List all users
- GET /api/admin/feedback - List all feedback submissions
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from bson import ObjectId
from datetime import datetime
from app import mongo
from app.models.user import User

# Create Blueprint for admin routes
admin_bp = Blueprint('admin', __name__)

def admin_required(fn):
    """
    Decorator to ensure the current user is an admin.
    Verifies role from JWT claims for performance.
    """
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
            
        return fn(*args, **kwargs)
    
    # Required for Flask-JWT-Extended to correctly handle the wrapper
    wrapper.__name__ = fn.__name__
    return wrapper

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_system_stats():
    """
    Get system-wide statistics for the admin dashboard.
    """
    total_users = mongo.db.users.count_documents({})
    total_resumes = mongo.db.resumes.count_documents({})
    total_ats_conversions = mongo.db.ats_resumes.count_documents({})
    
    # Get feedback count (if collection exists)
    try:
        total_feedback = mongo.db.feedback.count_documents({})
    except:
        total_feedback = 0
        
    total_ats_scores = mongo.db.ats_results.count_documents({})
    total_skill_analyses = mongo.db.skill_analysis.count_documents({})
    total_recommendations = mongo.db.job_recommendations.count_documents({})
    
    return jsonify({
        'success': True,
        'data': {
            'total_users': total_users,
            'total_resumes': total_resumes,
            'total_ats_conversions': total_ats_conversions,
            'total_feedback': total_feedback,
            'total_ats_scores': total_ats_scores,
            'total_skill_analyses': total_skill_analyses,
            'total_recommendations': total_recommendations
        }
    }), 200

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users():
    """
    Get a list of all registered users (excluding deleted ones).
    """
    try:
        # Filter out users with status 'deleted'
        users_data = mongo.db.users.find({'status': {'$ne': 'deleted'}}, {'password_hash': 0})
        users = []
        for user_data in users_data:
            user = User.from_dict(user_data)
            public_user = user.to_public_dict()
            users.append(public_user)
            
        return jsonify({
            'success': True,
            'data': users
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/users/<user_id>', methods=['PATCH'])
@admin_required
def update_user_admin(user_id):
    """
    Update a user's role or status.
    """
    if not ObjectId.is_valid(user_id):
        return jsonify({'error': 'Invalid user ID format'}), 400
        
    current_admin_id = get_jwt_identity()
    data = request.get_json()
    
    # Prevent self-update of role/status if it could lock the admin out
    # (Though usually admins can update themselves, specifically role changes should be careful)
    
    update_data = {}
    if 'role' in data:
        update_data['role'] = data['role']
    if 'status' in data:
        update_data['status'] = data['status']
        
    if not update_data:
        return jsonify({'error': 'No fields to update'}), 400

    update_data['updated_at'] = datetime.utcnow()
    
    result = mongo.db.users.update_one(
        {'_id': ObjectId(user_id)},
        {'$set': update_data}
    )
    
    if result.matched_count == 0:
        return jsonify({'error': 'User not found'}), 404
        
    return jsonify({
        'success': True,
        'message': 'User updated successfully'
    }), 200

@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@admin_required
def delete_user_admin(user_id):
    """
    Soft delete a user by setting status to 'deleted'.
    """
    if not ObjectId.is_valid(user_id):
        return jsonify({'error': 'Invalid user ID format'}), 400
        
    current_admin_id = get_jwt_identity()
    
    # Prevent self-deletion
    if user_id == current_admin_id:
        return jsonify({'error': 'You cannot delete your own account'}), 400
        
    # Optional: Logic to prevent deleting other admins unless Super Admin
    # For now, let's keep it simple or implement the check
    user_to_delete = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    if not user_to_delete:
        return jsonify({'error': 'User not found'}), 404
        
    if user_to_delete.get('role') == 'admin':
        # Check if the current user is a "Super Admin" or just an admin
        # In this system, we don't have super_admin yet, but we can check if there's more than one admin
        pass

    result = mongo.db.users.update_one(
        {'_id': ObjectId(user_id)},
        {'$set': {
            'status': 'deleted',
            'updated_at': datetime.utcnow()
        }}
    )
    
    return jsonify({
        'success': True,
        'message': 'User soft-deleted successfully'
    }), 200

@admin_bp.route('/feedback', methods=['GET'])
@admin_required
def get_all_feedback():
    """
    Get a list of all feedback submissions.
    """
    try:
        feedback_data = mongo.db.feedback.find().sort('created_at', -1)
        feedback_list = []
        for item in feedback_data:
            item['id'] = str(item['_id'])
            del item['_id']
            # Ensure created_at is stringified for JSON compatibility if it's a datetime object
            if 'created_at' in item and hasattr(item['created_at'], 'isoformat'):
                item['created_at'] = item['created_at'].isoformat()
            if 'updated_at' in item and hasattr(item['updated_at'], 'isoformat'):
                item['updated_at'] = item['updated_at'].isoformat()
            feedback_list.append(item)
    except Exception as e:
        print(f"Error fetching feedback: {e}")
        feedback_list = []
        
    return jsonify({
        'success': True,
        'data': feedback_list
    }), 200

@admin_bp.route('/feedback/<feedback_id>/resolve', methods=['PATCH'])
@admin_required
def resolve_feedback(feedback_id):
    """
    Mark a feedback submission as resolved.
    """
    if not ObjectId.is_valid(feedback_id):
        return jsonify({'error': 'Invalid feedback ID'}), 400
        
    from datetime import datetime
    result = mongo.db.feedback.update_one(
        {'_id': ObjectId(feedback_id)},
        {'$set': {
            'status': 'resolved',
            'updated_at': datetime.utcnow()
        }}
    )
    
    if result.matched_count == 0:
        return jsonify({'error': 'Feedback not found'}), 404
        
    return jsonify({
        'success': True,
        'message': 'Feedback marked as resolved'
    }), 200

@admin_bp.route('/feedback/<feedback_id>', methods=['DELETE'])
@admin_required
def delete_feedback(feedback_id):
    """
    Delete a feedback submission.
    """
    if not ObjectId.is_valid(feedback_id):
        return jsonify({'error': 'Invalid feedback ID'}), 400
        
    result = mongo.db.feedback.delete_one({'_id': ObjectId(feedback_id)})
    
    if result.deleted_count == 0:
        return jsonify({'error': 'Feedback not found'}), 404
        
    return jsonify({
        'success': True,
        'message': 'Feedback deleted successfully'
    }), 200
@admin_bp.route('/resumes', methods=['GET'])
@admin_required
def get_all_resumes():
    """
    Get a list of all uploaded resumes with filters, search and pagination.
    """
    try:
        # Get query parameters
        search = request.args.get('search', '')
        status = request.args.get('status', 'all')
        min_score = request.args.get('min_score')
        max_score = request.args.get('max_score')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        # Build query
        query = {}
        
        # Search filter
        if search:
            query['$or'] = [
                {'user_name': {'$regex': search, '$options': 'i'}},
                {'user_email': {'$regex': search, '$options': 'i'}},
                {'filename': {'$regex': search, '$options': 'i'}}
            ]
            
        # Status filter
        if status != 'all':
            query['status'] = status
            
        # ATS Score range filter
        if min_score or max_score:
            score_query = {}
            if min_score:
                score_query['$gte'] = float(min_score)
            if max_score:
                score_query['$lte'] = float(max_score)
            query['ats_score'] = score_query
            
        # Date range filter
        if start_date or end_date:
            date_query = {}
            if start_date:
                date_query['$gte'] = datetime.fromisoformat(start_date)
            if end_date:
                date_query['$lte'] = datetime.fromisoformat(end_date)
            query['upload_date'] = date_query

        # Execute query with pagination
        total_count = mongo.db.resumes.count_documents(query)
        resumes_data = mongo.db.resumes.find(query).sort('upload_date', -1).skip((page - 1) * limit).limit(limit)
        
        resumes = []
        for resume in resumes_data:
            # Ensure basic fields exist (for older documents)
            if 'user_name' not in resume or not resume['user_name']:
                user_id_val = resume.get('user_id')
                if user_id_val and ObjectId.is_valid(user_id_val):
                    user = mongo.db.users.find_one({'_id': ObjectId(user_id_val)})
                    resume['user_name'] = user.get('name') if user else 'Unknown'
                    resume['user_email'] = user.get('email') if user else 'Unknown'
                else:
                    resume['user_name'] = 'Unknown'
                    resume['user_email'] = 'Unknown'

            resumes.append({
                'id': str(resume['_id']),
                'filename': resume['filename'],
                'user_name': resume.get('user_name', 'Unknown'),
                'user_email': resume.get('user_email', 'Unknown'),
                'upload_date': resume['upload_date'].isoformat() if hasattr(resume['upload_date'], 'isoformat') else str(resume['upload_date']),
                'status': resume.get('status', 'Uploaded'),
                'analyzed': resume.get('analyzed', False),
                'ats_score': resume.get('ats_score')
            })
        
        return jsonify({
            'success': True,
            'data': resumes,
            'pagination': {
                'total': total_count,
                'page': page,
                'limit': limit,
                'pages': (total_count + limit - 1) // limit
            }
        }), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@admin_bp.route('/resumes/<resume_id>', methods=['DELETE'])
@admin_required
def delete_resume_admin(resume_id):
    """
    Delete a resume submission as admin.
    """
    if not ObjectId.is_valid(resume_id):
        return jsonify({'error': 'Invalid resume ID format'}), 400
        
    result = mongo.db.resumes.delete_one({'_id': ObjectId(resume_id)})
    
    if result.deleted_count == 0:
        return jsonify({'error': 'Resume not found'}), 404
        
    return jsonify({
        'success': True,
        'message': 'Resume deleted successfully'
    }), 200
@admin_bp.route('/ats-resumes', methods=['GET'])
@admin_required
def get_all_ats_resumes():
    """
    Get a list of all ATS-converted resumes.
    """
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        search = request.args.get('search', '')
        
        query = {}
        if search:
            query['$or'] = [
                {'user_name': {'$regex': search, '$options': 'i'}},
                {'user_email': {'$regex': search, '$options': 'i'}}
            ]
            
        total_count = mongo.db.ats_resumes.count_documents(query)
        ats_resumes_data = mongo.db.ats_resumes.find(query).sort('created_at', -1).skip((page - 1) * limit).limit(limit)
        
        ats_resumes = []
        for doc in ats_resumes_data:
            # For older documents without metadata
            if 'user_name' not in doc or not doc['user_name']:
                user_id_val = doc.get('user_id')
                if user_id_val and ObjectId.is_valid(user_id_val):
                    user = mongo.db.users.find_one({'_id': ObjectId(user_id_val)})
                    doc['user_name'] = user.get('name') if user else 'Unknown'
                    doc['user_email'] = user.get('email') if user else 'Unknown'
                else:
                    doc['user_name'] = 'Unknown'
                    doc['user_email'] = 'Unknown'

            created_at = doc.get('created_at', datetime.utcnow())
            ats_resumes.append({
                'id': str(doc['_id']),
                'resume_id': doc.get('resume_id'),
                'user_name': doc.get('user_name', 'Unknown'),
                'user_email': doc.get('user_email', 'Unknown'),
                'created_at': created_at.isoformat() if hasattr(created_at, 'isoformat') else str(created_at)
            })
            
        return jsonify({
            'success': True,
            'data': ats_resumes,
            'pagination': {
                'total': total_count,
                'page': page,
                'limit': limit,
                'pages': (total_count + limit - 1) // limit
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/ats-resumes/<id>', methods=['DELETE'])
@admin_required
def delete_ats_resume(id):
    """
    Delete an ATS-converted resume.
    """
    if not ObjectId.is_valid(id):
        return jsonify({'error': 'Invalid ID format'}), 400
        
    result = mongo.db.ats_resumes.delete_one({'_id': ObjectId(id)})
    
    if result.deleted_count == 0:
        return jsonify({'error': 'ATS Resume not found'}), 404
        
    return jsonify({
        'success': True,
        'message': 'ATS Resume deleted successfully'
    }), 200
@admin_bp.route('/recommendations', methods=['GET'])
@admin_required
def get_all_recommendations():
    """
    Get a list of all job recommendations/matches across the system.
    """
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        search = request.args.get('search', '')
        
        query = {}
        if search:
            query['$or'] = [
                {'user_name': {'$regex': search, '$options': 'i'}},
                {'title': {'$regex': search, '$options': 'i'}},
                {'company': {'$regex': search, '$options': 'i'}}
            ]
            
        total_count = mongo.db.job_recommendations.count_documents(query)
        recommendations_data = mongo.db.job_recommendations.find(query).sort('recommended_at', -1).skip((page - 1) * limit).limit(limit)
        
        recommendations = []
        for doc in recommendations_data:
            doc['id'] = str(doc['_id'])
            del doc['_id']
            # Format date
            if 'recommended_at' in doc and hasattr(doc['recommended_at'], 'isoformat'):
                doc['recommended_at'] = doc['recommended_at'].isoformat()
            
            # Remove resume details as requested
            doc.pop('resume_id', None)
            doc.pop('resume_filename', None)
            
            recommendations.append(doc)
            
        return jsonify({
            'success': True,
            'data': recommendations,
            'pagination': {
                'total': total_count,
                'page': page,
                'limit': limit,
                'pages': (total_count + limit - 1) // limit
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/ats-scores', methods=['GET'])
@admin_required
def get_all_ats_scores():
    """Get all ATS scores calculated across the system."""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        total_count = mongo.db.ats_results.count_documents({})
        scores_data = mongo.db.ats_results.find().sort('scored_at', -1).skip((page - 1) * limit).limit(limit)
        
        scores = []
        for doc in scores_data:
            doc['id'] = str(doc['_id'])
            del doc['_id']
            if 'scored_at' in doc and hasattr(doc['scored_at'], 'isoformat'):
                doc['scored_at'] = doc['scored_at'].isoformat()
            
            # Fetch user info if missing
            if 'user_name' not in doc:
                user = mongo.db.users.find_one({'_id': ObjectId(doc['user_id'])})
                doc['user_name'] = user.get('name') if user else 'Unknown'
            
            scores.append(doc)
            
        return jsonify({
            'success': True,
            'data': scores,
            'pagination': {
                'total': total_count,
                'page': page,
                'limit': limit,
                'pages': (total_count + limit - 1) // limit
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/skill-analyses', methods=['GET'])
@admin_required
def get_all_skill_analyses():
    """Get all skill analyses performed across the system."""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        total_count = mongo.db.skill_analysis.count_documents({})
        analyses_data = mongo.db.skill_analysis.find().sort('analyzed_at', -1).skip((page - 1) * limit).limit(limit)
        
        analyses = []
        for doc in analyses_data:
            doc['id'] = str(doc['_id'])
            del doc['_id']
            if 'analyzed_at' in doc and hasattr(doc['analyzed_at'], 'isoformat'):
                doc['analyzed_at'] = doc['analyzed_at'].isoformat()
                
            # Fetch user info if missing
            if 'user_name' not in doc:
                user = mongo.db.users.find_one({'_id': ObjectId(doc['user_id'])})
                doc['user_name'] = user.get('name') if user else 'Unknown'
                
            analyses.append(doc)
            
        return jsonify({
            'success': True,
            'data': analyses,
            'pagination': {
                'total': total_count,
                'page': page,
                'limit': limit,
                'pages': (total_count + limit - 1) // limit
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
