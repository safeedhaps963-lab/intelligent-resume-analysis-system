"""
app/routes/builder.py - Resume Builder API Routes
===================================================
This module handles resume builder endpoints for creating
and generating ATS-friendly resumes.

Endpoints:
- POST /api/builder/save - Save resume data
- POST /api/builder/generate - Generate PDF/DOCX
- POST /api/builder/suggestions - Get AI content suggestions
- GET /api/builder/templates - Get available templates
"""

from datetime import datetime
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
import io

from app import mongo

# Create Blueprint for builder routes
builder_bp = Blueprint('builder', __name__)


# ==============================================
# AI Suggestion Templates
# ==============================================

SUMMARY_TEMPLATES = {
    'software_engineer': [
        "Results-driven {title} with {years}+ years of experience in {skills}. "
        "Proven track record of delivering high-quality software solutions that drive business value. "
        "Strong expertise in {primary_skill} with a passion for clean code and best practices.",
        
        "Innovative {title} specializing in {skills}. "
        "Experienced in full software development lifecycle from concept to deployment. "
        "Committed to building scalable, maintainable applications using modern technologies.",
        
        "Detail-oriented {title} with expertise in {skills}. "
        "Known for translating complex requirements into elegant technical solutions. "
        "Strong collaborator with excellent problem-solving abilities."
    ],
    'data_scientist': [
        "Analytical {title} with {years}+ years of experience in {skills}. "
        "Expert in transforming complex data into actionable insights that drive strategic decisions. "
        "Proficient in machine learning, statistical analysis, and data visualization.",
        
        "Data-driven {title} passionate about leveraging {skills} to solve business challenges. "
        "Experienced in building predictive models and deploying ML solutions at scale. "
        "Strong communicator who can bridge the gap between technical and business teams."
    ],
    'default': [
        "Dedicated {title} with {years}+ years of professional experience. "
        "Skilled in {skills} with a proven ability to deliver results. "
        "Strong team player committed to continuous learning and professional growth.",
        
        "Accomplished {title} bringing expertise in {skills}. "
        "Track record of success in fast-paced environments. "
        "Excellent communication and problem-solving skills."
    ]
}

ACTION_VERBS = {
    'leadership': ['Led', 'Directed', 'Managed', 'Supervised', 'Coordinated', 'Orchestrated'],
    'achievement': ['Achieved', 'Delivered', 'Exceeded', 'Accomplished', 'Attained', 'Surpassed'],
    'creation': ['Developed', 'Created', 'Designed', 'Built', 'Established', 'Launched'],
    'improvement': ['Improved', 'Enhanced', 'Optimized', 'Streamlined', 'Upgraded', 'Transformed'],
    'analysis': ['Analyzed', 'Evaluated', 'Assessed', 'Investigated', 'Researched', 'Examined'],
    'collaboration': ['Collaborated', 'Partnered', 'Facilitated', 'Contributed', 'Supported']
}


@builder_bp.route('/save', methods=['POST'])
@jwt_required()
def save_resume():
    """
    Save resume builder data.
    
    Request Body:
        - personal: Personal information object
        - experience: Array of work experience
        - education: Array of education entries
        - skills: Object with technical and soft skills
        - template: Template name (optional)
    
    Response:
        - 200: Resume saved successfully
        - 400: Validation error
    
    Example:
        POST /api/builder/save
        {
            "personal": {
                "name": "John Doe",
                "title": "Software Engineer",
                "email": "john@example.com",
                "phone": "+1 234 567 8900",
                "location": "San Francisco, CA",
                "linkedin": "linkedin.com/in/johndoe",
                "summary": "Experienced developer..."
            },
            "experience": [...],
            "education": [...],
            "skills": {
                "technical": ["Python", "React"],
                "soft": ["Leadership"]
            }
        }
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required sections
    personal = data.get('personal', {})
    
    if not personal.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    if not personal.get('email'):
        return jsonify({'error': 'Email is required'}), 400
    
    # Create resume document
    resume_doc = {
        'user_id': user_id,
        'type': 'builder',  # Distinguish from uploaded resumes
        'personal': personal,
        'experience': data.get('experience', []),
        'education': data.get('education', []),
        'skills': data.get('skills', {'technical': [], 'soft': []}),
        'template': data.get('template', 'professional'),
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    # Check if updating existing resume
    resume_id = data.get('resume_id')
    
    if resume_id:
        # Update existing
        result = mongo.db.builder_resumes.update_one(
            {
                '_id': ObjectId(resume_id),
                'user_id': user_id
            },
            {'$set': {
                'personal': resume_doc['personal'],
                'experience': resume_doc['experience'],
                'education': resume_doc['education'],
                'skills': resume_doc['skills'],
                'template': resume_doc['template'],
                'updated_at': datetime.utcnow()
            }}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Resume not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Resume updated successfully',
            'data': {
                'resume_id': resume_id
            }
        }), 200
    else:
        # Create new
        result = mongo.db.builder_resumes.insert_one(resume_doc)
        
        return jsonify({
            'success': True,
            'message': 'Resume saved successfully',
            'data': {
                'resume_id': str(result.inserted_id)
            }
        }), 201


@builder_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_resume():
    """
    Generate PDF or DOCX from resume data.
    
    Request Body:
        - resume_id: ID of saved resume
        - format: 'pdf' or 'docx'
        - template: Template name
    
    Response:
        - 200: File download
        - 404: Resume not found
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    resume_id = data.get('resume_id')
    output_format = data.get('format', 'pdf')
    template = data.get('template', 'professional')
    
    if not resume_id:
        return jsonify({'error': 'resume_id is required'}), 400
    
    # Get resume data
    resume = mongo.db.builder_resumes.find_one({
        '_id': ObjectId(resume_id),
        'user_id': user_id
    })
    
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
    
    # Generate the document
    if output_format == 'pdf':
        file_content, filename = _generate_pdf(resume, template)
        mimetype = 'application/pdf'
    else:
        file_content, filename = _generate_docx(resume, template)
        mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    
    # Return file
    return send_file(
        io.BytesIO(file_content),
        mimetype=mimetype,
        as_attachment=True,
        download_name=filename
    )


def _generate_pdf(resume_data, template):
    """
    Generate PDF from resume data.
    
    In production, use reportlab or weasyprint.
    
    Args:
        resume_data: Resume document from database
        template: Template name
    
    Returns:
        Tuple of (file_content, filename)
    """
    # This is a placeholder - in production, use reportlab
    # For now, return a simple text representation
    
    personal = resume_data.get('personal', {})
    content = f"""
    {personal.get('name', 'Unknown')}
    {personal.get('title', '')}
    {personal.get('email', '')} | {personal.get('phone', '')}
    
    SUMMARY
    {personal.get('summary', '')}
    
    EXPERIENCE
    """
    
    for exp in resume_data.get('experience', []):
        content += f"\n{exp.get('title', '')} at {exp.get('company', '')}\n"
        content += f"{exp.get('start', '')} - {exp.get('end', '')}\n"
        content += f"{exp.get('description', '')}\n"
    
    content += "\nEDUCATION\n"
    for edu in resume_data.get('education', []):
        content += f"{edu.get('degree', '')} - {edu.get('school', '')} ({edu.get('year', '')})\n"
    
    content += "\nSKILLS\n"
    skills = resume_data.get('skills', {})
    content += f"Technical: {', '.join(skills.get('technical', []))}\n"
    content += f"Soft Skills: {', '.join(skills.get('soft', []))}\n"
    
    filename = f"{personal.get('name', 'resume').replace(' ', '_')}_resume.pdf"
    
    return content.encode('utf-8'), filename


def _generate_docx(resume_data, template):
    """
    Generate DOCX from resume data.
    
    In production, use python-docx library.
    """
    # Placeholder - same as PDF for demo
    personal = resume_data.get('personal', {})
    content = f"Resume for {personal.get('name', 'Unknown')}"
    filename = f"{personal.get('name', 'resume').replace(' ', '_')}_resume.docx"
    
    return content.encode('utf-8'), filename


@builder_bp.route('/suggestions', methods=['POST'])
@jwt_required()
def get_suggestions():
    """
    Get AI-powered content suggestions.
    
    Request Body:
        - section: Section to get suggestions for ('summary', 'experience', 'skills')
        - context: Current content context
    
    Response:
        - 200: Suggestions array
    
    Example:
        POST /api/builder/suggestions
        {
            "section": "summary",
            "context": {
                "title": "Software Engineer",
                "skills": ["Python", "React"]
            }
        }
    """
    data = request.get_json()
    
    section = data.get('section', '')
    context = data.get('context', {})
    
    suggestions = []
    
    if section == 'summary':
        suggestions = _generate_summary_suggestions(context)
    elif section == 'experience':
        suggestions = _generate_experience_suggestions(context)
    elif section == 'skills':
        suggestions = _generate_skill_suggestions(context)
    elif section == 'action_verbs':
        suggestions = _get_action_verbs(context.get('category', 'achievement'))
    
    return jsonify({
        'success': True,
        'data': {
            'section': section,
            'suggestions': suggestions
        }
    }), 200


def _generate_summary_suggestions(context):
    """Generate professional summary suggestions."""
    title = context.get('title', 'Professional').lower()
    skills = context.get('skills', [])[:4]
    years = context.get('years', '5')
    
    # Select template based on title
    if any(kw in title for kw in ['software', 'developer', 'engineer', 'programmer']):
        templates = SUMMARY_TEMPLATES['software_engineer']
    elif any(kw in title for kw in ['data', 'analyst', 'scientist', 'ml', 'ai']):
        templates = SUMMARY_TEMPLATES['data_scientist']
    else:
        templates = SUMMARY_TEMPLATES['default']
    
    # Fill in templates
    skills_str = ', '.join(skills) if skills else 'various technologies'
    primary_skill = skills[0] if skills else 'technology'
    
    suggestions = []
    for template in templates:
        summary = template.format(
            title=context.get('title', 'Professional'),
            years=years,
            skills=skills_str,
            primary_skill=primary_skill
        )
        suggestions.append(summary)
    
    return suggestions


def _generate_experience_suggestions(context):
    """Generate experience description suggestions."""
    current_text = context.get('description', '')
    role = context.get('role', '')
    
    # Suggest improvements using action verbs
    suggestions = []
    
    # Provide enhanced versions
    enhancements = [
        f"Developed and maintained scalable applications, resulting in improved system performance",
        f"Led cross-functional team initiatives that delivered projects ahead of schedule",
        f"Implemented automated testing frameworks that reduced bugs by 40%",
        f"Collaborated with stakeholders to gather requirements and translate them into technical specifications",
        f"Optimized database queries resulting in 50% improvement in response times"
    ]
    
    return enhancements[:3]


def _generate_skill_suggestions(context):
    """Generate skill suggestions based on job title."""
    title = context.get('title', '').lower()
    current_skills = [s.lower() for s in context.get('current_skills', [])]
    
    skill_suggestions = {
        'frontend': ['React', 'TypeScript', 'Vue.js', 'CSS', 'Redux', 'Webpack', 'Jest'],
        'backend': ['Python', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'REST API', 'GraphQL'],
        'fullstack': ['React', 'Node.js', 'Python', 'MongoDB', 'AWS', 'Docker', 'TypeScript'],
        'data': ['Python', 'SQL', 'Pandas', 'TensorFlow', 'Tableau', 'Apache Spark', 'R'],
        'devops': ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'Jenkins', 'CI/CD', 'Linux'],
        'default': ['Git', 'Agile', 'Problem Solving', 'Communication', 'Team Collaboration']
    }
    
    # Determine relevant skills based on title
    if 'frontend' in title or 'react' in title or 'ui' in title:
        relevant = skill_suggestions['frontend']
    elif 'backend' in title or 'python' in title or 'java' in title:
        relevant = skill_suggestions['backend']
    elif 'full' in title or 'stack' in title:
        relevant = skill_suggestions['fullstack']
    elif 'data' in title or 'ml' in title or 'scientist' in title:
        relevant = skill_suggestions['data']
    elif 'devops' in title or 'sre' in title or 'cloud' in title:
        relevant = skill_suggestions['devops']
    else:
        relevant = skill_suggestions['default']
    
    # Filter out skills user already has
    new_suggestions = [s for s in relevant if s.lower() not in current_skills]
    
    return new_suggestions[:6]


def _get_action_verbs(category):
    """Get action verbs for a specific category."""
    return ACTION_VERBS.get(category, ACTION_VERBS['achievement'])


@builder_bp.route('/templates', methods=['GET'])
def get_templates():
    """
    Get available resume templates.
    
    Response:
        - 200: List of templates
    """
    templates = [
        {
            'id': 'professional',
            'name': 'Professional',
            'description': 'Clean and modern design for corporate roles',
            'preview': '/templates/professional.png'
        },
        {
            'id': 'creative',
            'name': 'Creative',
            'description': 'Stylish design for creative industries',
            'preview': '/templates/creative.png'
        },
        {
            'id': 'minimal',
            'name': 'Minimal',
            'description': 'Simple and elegant ATS-friendly format',
            'preview': '/templates/minimal.png'
        },
        {
            'id': 'technical',
            'name': 'Technical',
            'description': 'Optimized for technical roles with skills focus',
            'preview': '/templates/technical.png'
        }
    ]
    
    return jsonify({
        'success': True,
        'data': templates
    }), 200


@builder_bp.route('/list', methods=['GET'])
@jwt_required()
def list_resumes():
    """
    List user's saved resumes from builder.
    
    Response:
        - 200: List of resume summaries
    """
    user_id = get_jwt_identity()  # get the logged-in user's ID

    # Fetch resumes from MongoDB
    resumes_cursor = mongo.db.builder_resumes.find(
        {'user_id': user_id}
    ).sort('updated_at', -1)  # newest first

    # Convert cursor to list and format for JSON
    resumes = []
    for resume in resumes_cursor:
        resumes.append({
            "id": str(resume.get("_id")),  # convert ObjectId to string
            "name": resume.get("name"),
            "created_at": resume.get("created_at"),
            "updated_at": resume.get("updated_at"),
            "summary": resume.get("summary")
        })

    return jsonify(resumes), 200