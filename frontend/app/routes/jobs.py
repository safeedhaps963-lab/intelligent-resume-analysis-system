from flask import Blueprint, jsonify, request

jobs_bp = Blueprint("jobs", __name__)

@jobs_bp.route("/recommend", methods=["POST"])
def recommend_jobs():
    data = request.json
    skills = data.get("skills", [])

    jobs = [
        {"title": "Software Developer"},
        {"title": "Data Analyst"}
    ]

    return jsonify(jobs)
