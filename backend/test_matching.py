from app.routes.jobs import calculate_job_match_score
from app.services.nlp_analyzer import nlp_analyzer
from app.services.adzuna import fetch_adzuna_jobs
import os
from dotenv import load_dotenv

load_dotenv()

def test_matching():
    # Sample user resume analysis (Simulated)
    user_analysis = {
        "skills": {
            "programming_languages": {"skills": ["Python"], "count": 1},
            "web_frameworks": {"skills": ["Flask"], "count": 1},
            "databases": {"skills": ["MongoDB"], "count": 1},
            "cloud_devops": {"skills": ["AWS"], "count": 1}
        },
        "total_years_experience": 5.0,
        "education_level_score": 3 # Bachelor
    }
    
    # Matching job
    job1 = {
        "title": "Backend Engineer (Python)",
        "description": "We are looking for a Python expert with Flask and Cloud experience (3+ years)."
    }
    
    # Non-matching job
    job2 = {
        "title": "Graphic Designer",
        "description": "Needs 3 years experience in Adobe Photoshop and Figma."
    }
    
    score1 = calculate_job_match_score(user_analysis, job1)
    score2 = calculate_job_match_score(user_analysis, job2)
    
    print(f"Match Score for Python Job: {score1}%")
    print(f"Match Score for Design Job: {score2}%")
    
    # Test real Adzuna fetch
    print("\nTesting Adzuna API Fetch...")
    jobs = fetch_adzuna_jobs(["Python", "Flask"])
    print(f"Fetched {len(jobs)} jobs from Adzuna.")
    if jobs:
        print(f"First job: {jobs[0].get('title')}")

if __name__ == "__main__":
    test_matching()
