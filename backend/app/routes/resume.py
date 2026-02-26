"""
app/routes/resume.py - Resume Analysis API Routes
==================================================
This module contains all API endpoints related to resume analysis.

Endpoints:
- POST /api/resume/upload - Upload a resume file
- POST /api/resume/analyze - Analyze uploaded resume
- GET /api/resume/skills/<id> - Get extracted skills
- POST /api/resume/ats-score - Calculate ATS score
- GET /api/resume/history - Get user's analysis history

All endpoints require authentication except where noted.
"""

import os
import uuid
import json
from datetime import datetime
from typing import Optional

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from bson import ObjectId

# Import our application components
from app import mongo  # MongoDB instance
from app.services.nlp_analyzer import nlp_analyzer  # NLP service
from app.services.ats_scorer import ats_scorer  # ATS scoring service
from app.services.missing_skills import missing_skills_analyzer  # Skill gap analyzer
from app.services.ats_converter import ats_converter  # ATS converter service
from app.utils.pdf_parser import parse_resume_file  # File parser utility

# Create Blueprint for resume routes
# Blueprint groups related routes under a common URL prefix
resume_bp = Blueprint('resume', __name__)


def allowed_file(filename: str) -> bool:
    """
    Check if uploaded file has an allowed extension.
    
    Args:
        filename: Name of the uploaded file
    
    Returns:
        bool: True if extension is allowed, False otherwise
    
    Example:
        allowed_file('resume.pdf')  # Returns True
        allowed_file('script.exe')  # Returns False
    """
    # Get allowed extensions from config
    allowed_extensions = current_app.config.get(
        'ALLOWED_EXTENSIONS', 
        {'pdf', 'docx', 'doc', 'txt'}
    )
    
    # Check if filename has extension and it's in allowed list
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions


@resume_bp.route('/upload', methods=['POST'])
@jwt_required()  # Requires valid JWT token
def upload_resume():
    """
    Upload a resume file for analysis.
    
    Request:
        - Method: POST
        - Content-Type: multipart/form-data
        - Body: file (resume file)
    
    Response:
        - 200: Success with file ID and extracted text preview
        - 400: Bad request (no file, invalid type)
        - 413: File too large
    
    Example:
        curl -X POST -F "file=@resume.pdf" \
             -H "Authorization: Bearer <token>" \
             http://localhost:5000/api/resume/upload
    """
    # Get current user ID from JWT token
    user_id = get_jwt_identity()
    
    # ==========================================
    # Validate Request
    # ==========================================
    
    # Check if file is present in request
    if 'file' not in request.files:
        return jsonify({
            'error': 'No file provided',
            'message': 'Please upload a resume file'
        }), 400
    
    file = request.files['file']
    
    # Check if a file was actually selected
    if file.filename == '':
        return jsonify({
            'error': 'No file selected',
            'message': 'Please select a file to upload'
        }), 400
    
    # Validate file type
    if not allowed_file(file.filename):
        return jsonify({
            'error': 'Invalid file type',
            'message': 'Allowed types: PDF and DOCX only (Limit: 5MB)'
        }), 400
    
    # ==========================================
    # Process and Store File
    # ==========================================
    
    # Secure the filename to prevent path traversal attacks
    filename = secure_filename(file.filename)
    
    # Create unique filename with timestamp
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    unique_filename = f"{user_id}_{timestamp}_{filename}"
    
    # Ensure upload directory exists
    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    
    # Save file to disk
    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)
    
    # ==========================================
    # Parse Resume Content
    # ==========================================
    
    try:
        # Extract text content from the file
        resume_text = parse_resume_file(file_path)
        
        # Get preview (first 500 characters)
        preview = resume_text[:500] + '...' if len(resume_text) > 500 else resume_text
        
    except Exception as e:
        # Clean up file if parsing fails
        os.remove(file_path)
        return jsonify({
            'error': 'Failed to parse file',
            'message': str(e)
        }), 400
    
    # ==========================================
    # Store in MongoDB
    # ==========================================
    
    # Optional: Mark previous resumes as inactive (archived)
    try:
        mongo.db.resumes.update_many(
            {'user_id': user_id, 'is_active': True},
            {'$set': {'is_active': False}}
        )
    except Exception as e:
        print(f"WARNING: Failed to archive old resumes: {str(e)}")

    # Create resume document
    resume_doc = {
        'user_id': user_id,                    # Owner of the resume
        'filename': filename,                   # Original filename
        'file_path': file_path,                 # Storage path
        'content': resume_text,                 # Extracted text
        'file_size': os.path.getsize(file_path),
        'upload_date': datetime.utcnow(),       # Upload timestamp
        'analyzed': False,                       # Analysis status
        'analysis_results': None,                # Will store analysis
        'is_active': True                        # Newest is active
    }
    
    # Insert into MongoDB and get the generated ID
    result = mongo.db.resumes.insert_one(resume_doc)
    resume_id = str(result.inserted_id)
    
    # ==========================================
    # Return Response
    # ==========================================
    
    return jsonify({
        'success': True,
        'message': 'Resume uploaded successfully',
        'data': {
            'resume_id': resume_id,
            'filename': filename,
            'preview': preview,
            'word_count': len(resume_text.split())
        }
    }), 200
@resume_bp.route('/latest', methods=['GET'])
@jwt_required()
def get_latest_resume():
    """
    Get the user's most recently uploaded active resume.
    """
    user_id = get_jwt_identity()
    
    try:
        resume = mongo.db.resumes.find_one(
            {'user_id': user_id, 'is_active': True},
            {'content': 0}  # Exclude content
        )
        
        if not resume:
            # Fallback to the latest uploaded by date
            resume = mongo.db.resumes.find_one(
                {'user_id': user_id},
                {'content': 0},
                sort=[('upload_date', -1)]
            )
            
        if not resume:
            return jsonify({
                'success': False, 
                'message': 'No resume found. Please upload one.'
            }), 404
            
        resume['id'] = str(resume['_id'])
        del resume['_id']
        
        # Ensure upload_date is stringified
        if 'upload_date' in resume and hasattr(resume['upload_date'], 'isoformat'):
            resume['upload_date'] = resume['upload_date'].isoformat()
            
        return jsonify({
            'success': True,
            'data': resume
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500



@resume_bp.route('/analyze', methods=['POST'])
@jwt_required()
def analyze_resume():
    """
    Analyze an uploaded resume using NLP.
    
    Request:
        - Method: POST
        - Body (JSON):
            - resume_id: ID of uploaded resume
            - job_description: Optional job description for matching
    
    Response:
        - 200: Analysis results (skills, experience, education)
        - 404: Resume not found
    
    This endpoint performs:
    1. Skill extraction using NLP
    2. Experience parsing
    3. Education identification
    4. Job matching (if description provided)
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # ==========================================
    # Validate and Fetch Resume
    # ==========================================
    
    resume_id = data.get('resume_id')
    job_description = data.get('job_description', '')
    
    if not resume_id:
        return jsonify({'error': 'resume_id is required'}), 400
    
    # Find resume in MongoDB
    try:
        resume = mongo.db.resumes.find_one({
            '_id': ObjectId(resume_id),
            'user_id': user_id  # Ensure user owns this resume
        })
    except Exception:
        return jsonify({'error': 'Invalid resume ID'}), 400
    
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
    
    # ==========================================
    # Perform NLP Analysis
    # ==========================================
    
    try:
        # Get resume content
        resume_text = resume.get('content')
        if not resume_text:
            return jsonify({
                'success': False,
                'error': 'Missing content',
                'message': 'This resume has no text content to analyze.'
            }), 400

        # Use NLP analyzer to extract information
        analysis_results = nlp_analyzer.analyze_resume(
            resume_text, 
            job_description
        )
        
        # Extract flattened resume skills for missing skills analyzer
        resume_skills_flat = []
        for cat_data in analysis_results.get('skills', {}).values():
            resume_skills_flat.extend(cat_data.get('skills', []))
        
        # Perform detailed missing skills analysis
        missing_analysis = missing_skills_analyzer.analyze(
            resume_skills_flat,
            job_description
        )
        
        # Merge results
        analysis_results['missing_skills_detailed'] = missing_analysis
        
    except Exception as e:
        import traceback
        current_app.logger.error(f"Analysis failed: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': 'Analysis engine failure',
            'message': str(e)
        }), 500
    
    # ==========================================
    # Update MongoDB Document
    # ==========================================
    
    # Get user details for metadata
    user_data = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    user_name = user_data.get('name', 'Unknown') if user_data else 'Unknown'
    user_email = user_data.get('email', 'Unknown') if user_data else 'Unknown'

    # Store analysis results in the resume document
    mongo.db.resumes.update_one(
        {'_id': ObjectId(resume_id)},
        {
            '$set': {
                'user_id': user_id,
                'user_name': user_name,
                'user_email': user_email,
                'analyzed': True,
                'analysis_results': analysis_results,
                'analysis_date': datetime.utcnow(),
                'job_description': job_description,
                'status': 'Analyzed',
                'created_at': resume.get('created_at', datetime.utcnow())
            }
        }
    )
    
    # ==========================================
    # Return Results
    # ==========================================
    
    return jsonify({
        'success': True,
        'data': {
            'resume_id': resume_id,
            'skills': analysis_results['skills'],
            'experience': analysis_results['experience'],
            'education': analysis_results['education'],
            'match_score': analysis_results['match_score'],
            'missing_skills': analysis_results['missing_skills'],  # Keep for backward compatibility
            'missing_skills_detailed': analysis_results.get('missing_skills_detailed'),
            'total_skills': analysis_results['total_skills_found']
        }
    }), 200


@resume_bp.route('/skill-analysis', methods=['POST'])
@jwt_required()
def skill_analysis():
    """
    Perform dedicated skill analysis and store results separately.
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    resume_id = data.get('resume_id')
    job_description = data.get('job_description', '')
    
    if not resume_id:
        return jsonify({'error': 'resume_id is required'}), 400
    
    try:
        resume = mongo.db.resumes.find_one({
            '_id': ObjectId(resume_id),
            'user_id': user_id
        })
    except Exception:
        return jsonify({'error': 'Invalid resume ID'}), 400
    
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
    
    try:
        # Perform NLP Analysis
        resume_text = resume.get('content')
        analysis_results = nlp_analyzer.analyze_resume(resume_text, job_description)
        
        # Skill analysis
        resume_skills_flat = []
        for cat_data in analysis_results.get('skills', {}).values():
            resume_skills_flat.extend(cat_data.get('skills', []))
            
        missing_analysis = missing_skills_analyzer.analyze(
            resume_skills_flat,
            job_description,
            category=analysis_results.get('category', 'Professional')
        )
        
        skill_data = {
            'user_id': user_id,
            'resume_id': str(resume_id),
            'skills': analysis_results['skills'],
            'missing_skills': missing_analysis,
            'match_score': analysis_results['match_score'],
            'analyzed_at': datetime.utcnow()
        }
        
        # Store separately
        mongo.db.skill_analysis.update_one(
            {'resume_id': str(resume_id), 'user_id': user_id},
            {'$set': skill_data},
            upsert=True
        )
        
        return jsonify({
            'success': True,
            'data': skill_data
        }), 200
        
    except Exception as e:
        import traceback
        current_app.logger.error(f"Skill analysis failed: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'success': False, 
            'error': 'Analysis engine failure',
            'message': str(e)
        }), 500


@resume_bp.route('/ats-score', methods=['POST'])
@jwt_required()
def calculate_ats_score():
    """
    Calculate ATS compatibility score for a resume.
    
    Request:
        - Method: POST
        - Body (JSON):
            - resume_id: ID of the resume to score
            - job_description: Target job description (optional)
    
    Response:
        - 200: ATS score with detailed breakdown
        - 404: Resume not found
    
    Returns:
        - Overall ATS score (0-100)
        - Breakdown by category (keywords, formatting, etc.)
        - Improvement recommendations
        - Keyword analysis (matched/missing)
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Get resume from database
    resume_id = data.get('resume_id')
    job_description = data.get('job_description', '')
    
    try:
        resume = mongo.db.resumes.find_one({
            '_id': ObjectId(resume_id),
            'user_id': user_id
        })
    except Exception:
        return jsonify({'error': 'Invalid resume ID'}), 400
    
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
    
    # ==========================================
    # Calculate ATS Score
    # ==========================================
    
    try:
        # Use ATS scorer service
        ats_results = ats_scorer.calculate_ats_score(
            resume['content'],
            job_description
        )
    except Exception as e:
        import traceback
        current_app.logger.error(f"ATS scoring failed: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': 'ATS scoring failure',
            'message': str(e)
        }), 500
    
    # ==========================================
    # Store Results
    # ==========================================
    
    # Get user details for metadata
    user_data = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    user_name = user_data.get('name', 'Unknown') if user_data else 'Unknown'
    user_email = user_data.get('email', 'Unknown') if user_data else 'Unknown'

    # Update resume with ATS results (legacy support)
    mongo.db.resumes.update_one(
        {'_id': ObjectId(resume_id)},
        {
            '$set': {
                'ats_score': ats_results['overall_score'],
                'ats_breakdown': ats_results['breakdown'],
                'ats_date': datetime.utcnow(),
                'status': 'Scored'
            }
        }
    )

    # Store ATS results separately
    ats_data = {
        'user_id': user_id,
        'resume_id': str(resume_id),
        'overall_score': ats_results['overall_score'],
        'breakdown': ats_results['breakdown'],
        'recommendations': ats_results['recommendations'],
        'scored_at': datetime.utcnow()
    }
    
    mongo.db.ats_results.update_one(
        {'resume_id': str(resume_id), 'user_id': user_id},
        {'$set': ats_data},
        upsert=True
    )
    
    return jsonify({
        'success': True,
        'data': ats_results
    }), 200

@resume_bp.route('/save', methods=['POST'])
@jwt_required()
def save_resume_metadata():
    """
    Manually save or update resume metadata.
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    resume_id = data.get('resume_id')
    
    if not resume_id:
        return jsonify({'error': 'resume_id is required'}), 400
        
    user_data = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    if not user_data:
        return jsonify({'error': 'User not found'}), 404
        
    update_fields = {
        'user_id': user_id,
        'user_name': user_data.get('name'),
        'user_email': user_data.get('email'),
        'updated_at': datetime.utcnow()
    }
    
    if 'ats_score' in data:
        update_fields['ats_score'] = data['ats_score']
    if 'status' in data:
        update_fields['status'] = data['status']
        
    mongo.db.resumes.update_one(
        {'_id': ObjectId(resume_id), 'user_id': user_id},
        {'$set': update_fields}
    )
    
    return jsonify({
        'success': True,
        'message': 'Resume metadata saved successfully'
    }), 200


@resume_bp.route('/skills/<resume_id>', methods=['GET'])
@jwt_required()
def get_skills(resume_id: str):
    """
    Get extracted skills for a specific resume.
    
    Args:
        resume_id: MongoDB ObjectId of the resume
    
    Response:
        - 200: Skills categorized by type
        - 404: Resume not found or not analyzed
    """
    user_id = get_jwt_identity()
    
    try:
        resume = mongo.db.resumes.find_one({
            '_id': ObjectId(resume_id),
            'user_id': user_id
        })
    except Exception:
        return jsonify({'error': 'Invalid resume ID'}), 400
    
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
    
    if not resume.get('analyzed'):
        return jsonify({'error': 'Resume not yet analyzed'}), 400
    
    skills = resume.get('analysis_results', {}).get('skills', {})
    
    return jsonify({
        'success': True,
        'data': {
            'resume_id': resume_id,
            'skills': skills
        }
    }), 200


@resume_bp.route('/history', methods=['GET'])
@jwt_required()
def get_analysis_history():
    """
    Get user's resume analysis history.
    
    Returns list of all analyzed resumes with summary information.
    
    Query Parameters:
        - limit: Max results to return (default: 10)
        - skip: Results to skip for pagination (default: 0)
    
    Response:
        - 200: List of resume summaries
    """
    user_id = get_jwt_identity()
    
    # Get pagination parameters
    limit = request.args.get('limit', 10, type=int)
    skip = request.args.get('skip', 0, type=int)
    
    # Query MongoDB for user's resumes
    resumes = mongo.db.resumes.find(
        {'user_id': user_id},
        {
            'content': 0,  # Exclude full content for performance
            'file_path': 0
        }
    ).sort('upload_date', -1).skip(skip).limit(limit)
    
    # Format response
    history = []
    for resume in resumes:
        history.append({
            'resume_id': str(resume['_id']),
            'filename': resume['filename'],
            'upload_date': resume['upload_date'].isoformat(),
            'analyzed': resume.get('analyzed', False),
            'ats_score': resume.get('ats_score'),
            'skills_count': resume.get('analysis_results', {}).get('total_skills_found', 0)
        })
    
    return jsonify({
        'success': True,
        'data': history,
        'pagination': {
            'limit': limit,
            'skip': skip
        }
    }), 200


@resume_bp.route('/analyze-text', methods=['POST'])
def analyze_text():
    """
    Analyze resume text directly without file upload.
    
    This endpoint doesn't require authentication and is useful for
    quick analysis without creating an account.
    
    Request:
        - Method: POST
        - Body (JSON):
            - text: Resume text content
            - job_description: Optional job description
    
    Response:
        - 200: Analysis results
    """
    data = request.get_json()
    
    resume_text = data.get('text', '')
    job_description = data.get('job_description', '')
    
    if not resume_text or len(resume_text) < 100:
        return jsonify({
            'error': 'Invalid input',
            'message': 'Resume text must be at least 100 characters'
        }), 400
    
    # Perform analysis
    analysis = nlp_analyzer.analyze_resume(resume_text, job_description)
    ats_results = ats_scorer.calculate_ats_score(resume_text, job_description)
    
    return jsonify({
        'success': True,
        'data': {
            'skills': analysis['skills'],
            'experience': analysis['experience'],
            'education': analysis['education'],
            'ats_score': ats_results['overall_score'],
            'ats_breakdown': ats_results['breakdown'],
            'recommendations': ats_results['recommendations']
        }
    })


@resume_bp.route('/convert-ats', methods=['POST'])
@jwt_required()
def convert_ats():
    """
    Convert a resume to ATS-friendly format.
    
    Request:
        - Method: POST
        - Content-Type: multipart/form-data
        - Body: file (resume file), optional: job_keywords (JSON array)
    
    Response:
        - 200: Success with converted resume text
        - 400: Bad request
        - 500: Server error
    """
    user_id = get_jwt_identity()
    temp_path = None
    
    # Validate file
    if 'file' not in request.files:
        return jsonify({
            'error': 'No file provided',
            'message': 'Please upload a resume file'
        }), 400
    
    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({
            'error': 'Invalid file',
            'message': 'Please upload a valid resume file (PDF, DOCX, TXT)'
        }), 400
    
    # Get optional job keywords
    job_keywords = None
    if 'job_keywords' in request.form:
        try:
            import json
            job_keywords = json.loads(request.form['job_keywords'])
        except:
            job_keywords = None
    
    try:
        # Create uploads folder if it doesn't exist
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join(upload_folder, f"temp_{user_id}_{filename}")
        file.save(temp_path)
        
        # Parse resume text
        resume_text = parse_resume_file(temp_path)
        current_app.logger.info(f"DEBUG: Extracted text length for {filename}: {len(resume_text) if resume_text else 0}")
        
        if not resume_text:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            current_app.logger.error(f"DEBUG: Extraction failed for {filename}")
            return jsonify({
                'error': 'Extraction Failed',
                'message': 'Could not extract any text from this file. This appears to be a scanned image or "flattened" PDF. Please upload a standard digital PDF or DOCX file.'
            }), 400
            
        if resume_text == "__IMAGE_ONLY_PDF__":
             if os.path.exists(temp_path):
                os.remove(temp_path)
             return jsonify({
                'error': 'Scanned Document Detected',
                'message': 'This PDF contains only images and no selectable text. For accurate analysis, please provide a digital version exported from Word, Canva (without flattening), or Google Docs.'
            }), 400

        if len(resume_text) < 20:
            # Still proceed but warn or logs? Let's just allow it if it's not empty, 
            # but maybe 10 was too strict for some very minimalist templates.
            # Actually, let's keep it but make the error better.
            pass
        # Use ATS Converter
        result = ats_converter.convert_resume(resume_text, job_keywords)
        
        # Get user details for metadata
        user_data = mongo.db.users.find_one({'_id': ObjectId(user_id)})
        user_name = user_data.get('name', 'Unknown') if user_data else 'Unknown'
        user_email = user_data.get('email', 'Unknown') if user_data else 'Unknown'

        # Ensure contact section has at least the name if extraction failed
        if not result.get('sections'):
            result['sections'] = {}
            
        if not result['sections'].get('contact') or len(result['sections']['contact'].strip()) < 2:
            # Fallback to user profile name
            result['sections']['contact'] = user_name

        # Save to database
        resume_id = str(uuid.uuid4())
        mongo.db.ats_resumes.insert_one({
            'resume_id': resume_id,
            'user_id': user_id,
            'user_name': user_name,
            'user_email': user_email,
            'ats_resume': result['ats_resume'],
            'sections': result['sections'],
            'created_at': datetime.utcnow()
        })

        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

        return jsonify({
            'success': True,
            'data': {
                'resume_id': resume_id,
                'ats_resume': result['ats_resume'],
                'sections': result['sections'],
                'original_length': len(resume_text),
                'converted_length': len(result['ats_resume'])
            }
        }), 200
        
    except Exception as e:
        # Clean up on error
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        
        import traceback
        print(f"Conversion error: {str(e)}")
        print(traceback.format_exc())
        
        return jsonify({
            'error': 'Conversion failed',
            'message': str(e)
        }), 500
@resume_bp.route('/download-ats-docx', methods=['POST'])
@jwt_required()
def download_ats_docx():
    """Download the converted ATS resume as a DOCX file."""
    try:
        data = request.get_json()
        sections = data.get('sections')
        
        if not sections:
            # Fallback to parsing text if sections not provided
            ats_text = data.get('ats_resume')
            if not ats_text:
                return jsonify({'error': 'No resume data provided'}), 400
            sections = ats_converter._extract_sections(ats_text)
            
        docx_bytes = ats_converter.generate_docx(sections)
        
        from flask import send_file
        import io
        
        return send_file(
            io.BytesIO(docx_bytes),
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            as_attachment=True,
            download_name='ats_friendly_resume.docx'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500
