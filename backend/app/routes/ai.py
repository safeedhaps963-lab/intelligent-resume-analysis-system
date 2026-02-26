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

    Accepts JSON payload with any of: jobTitle, skills, experience.
    Tries multiple models (fallback) and returns the generated summary.
    """
    global summarizer
    if summarizer is None:
        summarizer = LocalAISummarizer()
    
    data = request.get_json()

    job_title = data.get("jobTitle") or data.get("job_title") or "Professional"
    skills = data.get("skills", "")
    experience = data.get("experience", "")

    # Construct input for summarization (T5 model benefits from 'summarize: ' prefix)
    content = f"summarize: Job Title: {job_title}. Skills: {skills}. Experience: {experience}. Professionally summarize this person's career for a resume."

    try:
        summary = summarizer.summarize(content)
        return jsonify({"success": True, "summary": summary})
    except Exception as e:
        return jsonify({"error": str(e)}), 500