"""
AI Routes - Resume AI Features
"""

from flask import Blueprint, request, jsonify
# Authentication optional for AI route during local testing
# from flask_jwt_extended import jwt_required
import os
from openai import OpenAI

ai_bp = Blueprint("ai", __name__)

API_KEY = os.getenv("OPENAI_API_KEY")

if not API_KEY:
    # Warn in server logs if key is not set; route will return an error when called
    print("WARNING: OPENAI_API_KEY is not set. AI endpoints will fail until configured.")
    client = None
else:
    client = OpenAI(api_key=API_KEY)


@ai_bp.route("/generate-summary", methods=["POST"])
def generate_summary():
    """Generate a short professional ATS-friendly resume summary.

    Accepts JSON payload with any of: jobTitle, skills, experience.
    Tries multiple models (fallback) and returns the generated summary.
    """
    if client is None:
        return jsonify({"error": "OpenAI API key not configured"}), 500
    
    data = request.get_json()

    job_title = data.get("jobTitle", "")
    skills = data.get("skills", "")
    experience = data.get("experience", "")

    job_title = data.get("jobTitle") or data.get("job_title") or "Professional"
    skills = data.get("skills", "")
    experience = data.get("experience", "")

    prompt = f"""
    Write a professional ATS-friendly resume summary.

    Job Title: {job_title}
    Skills: {skills}
    Experience: {experience}

    Keep it 3-4 lines. Professional tone.
    """

    # Try models in order; fall back if a model is unavailable
    models_to_try = ["gpt-3.5-turbo", "gpt-4o-mini", "gpt-4o"]
    last_error = None

    for model_name in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are a professional resume writer."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                max_tokens=200
            )

            # Safely extract generated text
            summary = None
            if hasattr(response, 'choices') and len(response.choices) > 0:
                choice = response.choices[0]
                # Different SDK versions expose content in different attributes
                if hasattr(choice, 'message') and getattr(choice.message, 'content', None):
                    summary = choice.message.content
                elif isinstance(choice, dict) and choice.get('message'):
                    summary = choice['message'].get('content')
                elif isinstance(choice, dict) and choice.get('text'):
                    summary = choice.get('text')

            if not summary:
                summary = str(response)

            return jsonify({"success": True, "summary": summary})

        except Exception as e:
            # Log and try next model
            print(f"OpenAI model {model_name} failed: {e}")
            last_error = e
            continue

    # If we reach here, all models failed
    err_msg = str(last_error) if last_error else "Unknown error"
    return jsonify({"error": err_msg}), 500