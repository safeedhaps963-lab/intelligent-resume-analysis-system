"""
AI Routes - Resume AI Features
"""

from flask import Blueprint, request, jsonify
# Authentication optional for AI route during local testing
# from flask_jwt_extended import jwt_required
from transformers import pipeline

ai_bp = Blueprint("ai", __name__)

# Singleton class for local AI model loading
class LocalAISummarizer:
    _instance = None
    _pipeline = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LocalAISummarizer, cls).__new__(cls)
            print("INITIALIZING LOCAL AI MODEL (this may take a minute on first run)...")
            try:
                # Use a lightweight model optimized for summarization
                cls._pipeline = pipeline(
                    "summarization", 
                    model="t5-small",
                    device=-1 # CPU only
                )
                print("LOCAL AI MODEL LOADED SUCCESSFULLY.")
            except Exception as e:
                print(f"FAILED TO LOAD LOCAL AI MODEL: {e}")
        return cls._instance

    def summarize(self, text, min_length=30, max_length=150):
        if not self._pipeline:
            return "Local AI model not loaded."
        
        try:
            result = self._pipeline(
                text, 
                max_length=max_length, 
                min_length=min_length, 
                do_sample=False
            )
            return result[0]['summary_text']
        except Exception as e:
            return f"Summarization failed: {str(e)}"

# Initialize (lazily loaded on first request)
summarizer = None


@ai_bp.route("/generate-summary", methods=["POST"])
def generate_summary():
    """Generate a short professional ATS-friendly resume summary.

    Accepts JSON payload with: name, skills, experience, education.
    Adapts to Fresher vs. Experienced and Technical vs. Non-Technical profiles.
    """
    global summarizer
    if summarizer is None:
        summarizer = LocalAISummarizer()
    
    data = request.get_json()

    name = data.get("name") or "Professional"
    skills = data.get("skills", "")
    experience = data.get("experience", "")
    education = data.get("education", "")

    # Determine Profile Type
    is_fresher = not experience or len(experience.strip()) < 10
    is_technical = any(tech in skills.lower() for tech in ["python", "java", "react", "sql", "engineer", "developer", "aws", "cloud", "data"])

    # Fallback Template if little data is provided
    if not skills and not experience and not education:
        general_summary = "Motivated and detail-oriented professional with strong analytical and problem-solving skills. Experienced in working collaboratively within team environments and committed to delivering high-quality results. Seeking an opportunity to contribute technical expertise and grow within a dynamic organization."
        return jsonify({"success": True, "summary": general_summary, "type": "generic"})

    # Construct Enhanced Prompt
    profile_type = "Fresher" if is_fresher else "Experienced"
    domain = "Technical" if is_technical else "Professional"
    
    content = f"summarize: Generate a {profile_type} {domain} resume summary. "
    if name and name != "Professional": content += f"Candidate: {name}. "
    if education: content += f"Education: {education}. "
    if skills: content += f"Top Skills: {skills}. "
    if experience: content += f"Work History: {experience}. "
    content += "The summary should be 3-5 lines, professional, highlight strengths and value proposition."

    try:
        # Generate using AI
        summary = summarizer.summarize(content, min_length=50, max_length=200)
        
        # Post-processing to ensure professional tone if AI is too creative
        if len(summary.split()) < 15:
            # AI produced something too short, use a hybrid approach
            summary = f"Dedicated {domain} professional {('with a background in ' + education.split(',')[0]) if education else ''}. " \
                      f"Skilled in {skills.split(',')[0] if ',' in skills else skills or 'various industry tools'}. " \
                      f"Proven ability to {experience.split('.')[0] if experience else 'deliver high-quality results and contribute to team success'}."
        
        return jsonify({
            "success": True, 
            "summary": summary,
            "metadata": {
                "profile": profile_type,
                "domain": domain
            }
        })
    except Exception as e:
        # High-level fallback on failure
        fallback = "Results-driven professional with a focus on delivering excellence. "
        if skills: fallback += f"Expertise in {skills.split(',')[0]}. "
        fallback += "Committed to continuous learning and contributing to organizational goals through dedication and strategic thinking."
        
        return jsonify({"success": True, "summary": fallback, "error_note": str(e)})