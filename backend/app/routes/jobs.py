"""
app/routes/jobs.py
Real Job Recommendations using Adzuna API
"""

from datetime import datetime
from typing import List, Dict

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_socketio import emit, join_room, leave_room

from app import mongo, socketio
from app.services.adzuna import fetch_adzuna_jobs

jobs_bp = Blueprint('jobs', __name__)


# =====================================================
# MATCH SCORE CALCULATION
# =====================================================

def calculate_job_match_score(user_skills: List[str], job: Dict) -> int:
    user_skills_lower = set(s.lower() for s in user_skills)
    job_text = (job.get("title", "") + " " + job.get("description", "")).lower()

    matched = sum(1 for skill in user_skills_lower if skill in job_text)

    if not user_skills:
        return 50

    score = int((matched / len(user_skills_lower)) * 100)
    return min(100, score)


# =====================================================
# JOB RECOMMENDATIONS (ADZUNA)
# =====================================================

@jobs_bp.route('/recommendations', methods=['GET'])
@jwt_required()
def get_job_recommendations():

    user_id = get_jwt_identity()

    limit = request.args.get('limit', 10, type=int)
    min_match = request.args.get('min_match', 40, type=int)

    # Get latest analyzed resume
    resume = mongo.db.resumes.find_one(
        {'user_id': user_id, 'analyzed': True},
        sort=[('analysis_date', -1)]
    )

    user_skills = []

    if resume:
        skills_data = resume.get('analysis_results', {}).get('skills', {})
        for category in skills_data.values():
            user_skills.extend(category.get('skills', []))

    # Fetch jobs from Adzuna
    adzuna_jobs = fetch_adzuna_jobs(user_skills, country="in")

    matched_jobs = []

    for job in adzuna_jobs:
        match_score = calculate_job_match_score(user_skills, job)

        if match_score >= min_match:
            job['match_score'] = match_score
            matched_jobs.append(job)

    matched_jobs.sort(key=lambda x: x['match_score'], reverse=True)
    matched_jobs = matched_jobs[:limit]

    formatted_jobs = []

    for job in matched_jobs:
        formatted_jobs.append({
            'id': str(job.get('_id', '')),
            'title': str(job.get('title', 'N/A')),
            'company': str(job.get('company', 'N/A')),
            'location': str(job.get('location', 'N/A')),
            'salary': f"{str(job.get('currency', 'INR'))} {job.get('salary_min', 0):,} - {job.get('salary_max', 0):,}",
            'match_score': int(job.get('match_score', 0)),
            'apply_url': str(job.get('redirect_url', '#'))
        })

    return jsonify({
        'success': True,
        'data': formatted_jobs,
        'total': len(formatted_jobs),
        'skills_used': [str(skill) for skill in user_skills[:10]]
    }), 200


# =====================================================
# SEARCH (LIVE ADZUNA SEARCH)
# =====================================================

@jobs_bp.route('/search', methods=['GET'])
def search_jobs():

    query = request.args.get('q', 'software developer')
    location = request.args.get('location', 'india')

    jobs = fetch_adzuna_jobs([query], country="in")

    results = []

    for job in jobs:
        results.append({
            'id': job.get('_id'),
            'title': job.get('title'),
            'company': job.get('company'),
            'location': job.get('location'),
            'salary': f"{job.get('currency')} {job.get('salary_min', 0):,} - {job.get('salary_max', 0):,}",
            'apply_url': job.get('redirect_url')
        })

    return jsonify({
        'success': True,
        'data': results,
        'total': len(results)
    }), 200


# =====================================================
# SAVE JOB
# =====================================================

@jobs_bp.route('/save/<job_id>', methods=['POST'])
@jwt_required()
def save_job(job_id):

    user_id = get_jwt_identity()

    existing = mongo.db.saved_jobs.find_one({
        'user_id': user_id,
        'job_id': job_id
    })

    if existing:
        mongo.db.saved_jobs.delete_one({'_id': existing['_id']})
        return jsonify({
            'success': True,
            'message': 'Job removed from saved list',
            'saved': False
        }), 200

    mongo.db.saved_jobs.insert_one({
        'user_id': user_id,
        'job_id': job_id,
        'saved_date': datetime.utcnow()
    })

    return jsonify({
        'success': True,
        'message': 'Job saved successfully',
        'saved': True
    }), 200


# =====================================================
# GET SAVED JOBS
# =====================================================

@jobs_bp.route('/saved', methods=['GET'])
@jwt_required()
def get_saved_jobs():

    user_id = get_jwt_identity()

    saved = mongo.db.saved_jobs.find({'user_id': user_id})
    saved_ids = [s['job_id'] for s in saved]

    return jsonify({
        'success': True,
        'data': saved_ids,
        'total': len(saved_ids)
    }), 200


# =====================================================
# SOCKET EVENTS
# =====================================================

def register_socket_events(socketio):

    @socketio.on('connect')
    def handle_connect():
        emit('connected', {'message': 'Connected to job service'})

    @socketio.on('subscribe_jobs')
    def handle_subscribe(data):
        user_id = data.get('user_id')
        if user_id:
            join_room(f'user_{user_id}')
            emit('subscribed', {'message': 'Subscribed to job alerts'})

    @socketio.on('unsubscribe_jobs')
    def handle_unsubscribe(data):
        user_id = data.get('user_id')
        if user_id:
            leave_room(f'user_{user_id}')
            emit('unsubscribed', {'message': 'Unsubscribed'})
