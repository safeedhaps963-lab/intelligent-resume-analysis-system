"""
app/routes/jobs.py
Real Job Recommendations using Adzuna API
"""

import re
from datetime import datetime
from typing import List, Dict

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_socketio import emit, join_room, leave_room

from app import mongo, socketio
from app.services.adzuna import fetch_adzuna_jobs
from app.services.nlp_analyzer import nlp_analyzer

jobs_bp = Blueprint('jobs', __name__)


# =====================================================
# MATCH SCORE CALCULATION
# =====================================================

def calculate_job_match_score(resume_analysis: Dict, job: Dict) -> int:
    """
    Calculate weighted match score between resume analysis and job description.
    Formula: Skills (50%) + Experience (25%) + Education (15%) + Similarity (10%)
    """
    job_title = job.get("title", "").lower()
    job_desc = job.get("description", "").lower()
    job_full_text = f"{job_title} {job_desc}"
    
    # 1. Skills Match (50%)
    job_skills_data = nlp_analyzer.extract_skills(job_full_text)
    job_skills = set()
    for cat in job_skills_data.values():
        job_skills.update(s.lower() for s in cat.get('skills', []))
    
    user_skills = set()
    for cat in resume_analysis.get('skills', {}).values():
        user_skills.update(s.lower() for s in cat.get('skills', []))
        
    skill_score = 0
    if job_skills:
        matched_skills = user_skills & job_skills
        skill_score = (len(matched_skills) / len(job_skills)) * 100
    else:
        # Fallback if no skills in job desc
        skill_score = 70 
    
    # 2. Experience Match (25%)
    # Try to extract required years from job desc
    req_years_matches = re.findall(r'(\d+)\+?\s*years?', job_full_text)
    req_years = float(max([int(y) for y in req_years_matches])) if req_years_matches else 2.0
    
    user_years = float(resume_analysis.get('total_years_experience', 0))
    if user_years >= req_years:
        exp_score = 100
    else:
        exp_score = (user_years / req_years) * 100 if req_years > 0 else 100
    
    # 3. Education Match (15%)
    # Simple heuristic for job education level
    job_edu_level = 3 # Bachelor default
    if any(kw in job_full_text for kw in ['phd', 'doctorate']): job_edu_level = 5
    elif any(kw in job_full_text for kw in ['master', 'mtech', 'ms']): job_edu_level = 4
    
    user_edu_level = int(resume_analysis.get('education_level_score', 0))
    if user_edu_level >= job_edu_level:
        edu_score = 100
    else:
        edu_score = (user_edu_level / job_edu_level) * 100 if job_edu_level > 0 else 100
        
    # 4. Keyword Similarity (10%)
    resume_text = " ".join(user_skills) # Use skills as keyword proxy if content not available
    similarity = nlp_analyzer.get_similarity(resume_text, job_full_text)
    sim_score = similarity * 100
    
    # Final Weighted Score
    final_score = (skill_score * 0.50) + (exp_score * 0.25) + (edu_score * 0.15) + (sim_score * 0.10)
    
    return min(100, int(final_score))


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
    try:
        resume = mongo.db.resumes.find_one(
            {'user_id': user_id, 'analyzed': True},
            sort=[('analysis_date', -1)]
        )
    except Exception as e:
        print(f"ERROR: Database error fetching resume: {str(e)}")
        resume = None
    
    user_skills = []

    if resume and isinstance(resume.get('analysis_results'), dict):
        skills_data = resume.get('analysis_results', {}).get('skills', {})
        if isinstance(skills_data, dict):
            for category in skills_data.values():
                if isinstance(category, dict) and 'skills' in category:
                    user_skills.extend(category.get('skills', []))

    # Fetch jobs from Adzuna
    print(f"Fetching jobs for user {user_id} with skills: {user_skills[:5]}...")
    adzuna_jobs = fetch_adzuna_jobs(user_skills, country="in")
    
    # Fallback to Mock Jobs if Adzuna is empty or keys are missing
    is_fallback = False
    if not adzuna_jobs:
        is_fallback = True
        print("Using fallback mock jobs.")
        adzuna_jobs = [
            {
                "title": "Senior Software Engineer",
                "company": {"display_name": "TechGlobal Solutions"},
                "location": {"display_name": "Bangalore, India"},
                "description": "Looking for a full-stack engineer with experience in Python, React, and AWS cloud architecture.",
                "salary_min": 1800000, "salary_max": 2500000, "currency": "INR",
                "redirect_url": "https://example.com/jobs/1"
            },
            {
                "title": "Full Stack Developer",
                "company": {"display_name": "Innovate AI"},
                "location": {"display_name": "Remote"},
                "description": "Join our fast-paced startup to build cutting-edge AI features using MERN stack and Python.",
                "salary_min": 1200000, "salary_max": 1800000, "currency": "INR",
                "redirect_url": "https://example.com/jobs/2"
            },
            {
                "title": "System Architect",
                "company": {"display_name": "Enterprise Systems"},
                "location": {"display_name": "Mumbai, India"},
                "description": "Lead the design of scalable backend systems and mentor junior developers in best practices.",
                "salary_min": 2500000, "salary_max": 3500000, "currency": "INR",
                "redirect_url": "https://example.com/jobs/3"
            }
        ]

    matched_jobs = []
    # Get analysis results for matching
    analysis_results = resume.get('analysis_results', {}) if resume else {}

    for job in adzuna_jobs:
        # Standardize Adzuna company/location nested format if present
        if isinstance(job.get('company'), dict):
            job['company_name'] = job['company'].get('display_name', 'N/A')
        else:
            job['company_name'] = job.get('company', 'N/A')
            
        if isinstance(job.get('location'), dict):
            job['location_name'] = job['location'].get('display_name', 'N/A')
        else:
            job['location_name'] = job.get('location', 'N/A')

        try:
            # Use the new scoring function with analysis results
            match_score = calculate_job_match_score(analysis_results, job)
        except Exception as e:
            print(f"ERROR: Scoring failed for job {job.get('title')}: {str(e)}")
            match_score = 0

        # Only filter if we have real jobs, for mock jobs we show all to avoid empty list
        if is_fallback or match_score >= min_match:
            job['match_score'] = match_score
            matched_jobs.append(job)

    matched_jobs.sort(key=lambda x: x.get('match_score', 0), reverse=True)
    matched_jobs = matched_jobs[:limit]

    formatted_jobs = []

    for job in matched_jobs:
        title = str(job.get('title', 'N/A'))
        company = str(job.get('company_name', 'N/A'))
        location = str(job.get('location_name', 'N/A'))
        currency = str(job.get('currency', 'INR'))
        
        try:
            salary_min = job.get('salary_min', 0) or 0
            salary_max = job.get('salary_max', 0) or 0
            salary_str = f"{currency} {salary_min:,} - {salary_max:,}"
        except:
            salary_str = f"{currency} Negotiable"

        job_data = {
            'id': str(job.get('_id', job.get('id', hash(title)))),
            'title': title,
            'company': company,
            'location': location,
            'salary': salary_str,
            'match_score': int(job.get('match_score', 0)),
            'apply_url': str(job.get('redirect_url', '#'))
        }
        
        # Save recommendation to database for admin tracking
        try:
            mongo.db.job_recommendations.update_one(
                {'user_id': user_id, 'job_id': job_data['id']},
                {'$set': {
                    'user_id': user_id,
                    'user_name': resume.get('user_name', 'Unknown') if resume else 'Unknown',
                    'job_id': job_data['id'],
                    'title': title,
                    'company': company,
                    'match_score': job_data['match_score'],
                    'recommended_at': datetime.utcnow()
                }},
                upsert=True
            )
        except Exception as e:
            print(f"ERROR: Failed to save recommendation: {str(e)}")

        formatted_jobs.append(job_data)

    return jsonify({
        'success': True,
        'data': formatted_jobs,
        'total': len(formatted_jobs),
        'resume_info': {
            'filename': resume.get('filename', 'N/A') if resume else None,
            'id': str(resume.get('_id')) if resume else None,
            'analysis_date': resume.get('analysis_date').isoformat() if resume and resume.get('analysis_date') else None
        },
        'skills_used': [str(skill) for skill in user_skills[:10]],
        'is_mock': is_fallback
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
