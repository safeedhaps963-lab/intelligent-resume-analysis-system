from app import create_app
from app.services.nlp_analyzer import nlp_analyzer
import json

app = create_app()
with app.app_context():
    resume_text = "Test Resume\nSkills: Python, React, Flask, Node.js\nExperience: Software Engineer at Google"
    job_desc = "Looking for a Python developer with React experience."
    try:
        results = nlp_analyzer.analyze_resume(resume_text, job_desc)
        print(json.dumps(results, indent=2))
    except Exception as e:
        import traceback
        traceback.print_exc()
