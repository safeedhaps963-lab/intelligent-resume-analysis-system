from app import create_app
from flask_jwt_extended import create_access_token
import requests
import json
import os

app = create_app()
with app.app_context():
    # Create a real token for the demo user
    token = create_access_token(identity='demo_user_id')
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Create test resume
    with open("test_res.txt", "w") as f:
        f.write("Test Resume\nSkills: Python, React, Flask, Node.js\nExperience: Software Engineer at Google")
    
    print("\n1. Uploading...")
    files = {'file': open('test_res.txt', 'rb')}
    r1 = requests.post('http://localhost:8000/api/resume/upload', headers=headers, files=files)
    print(f"Upload Status: {r1.status_code}")
    res1 = r1.json()
    print(res1)
    
    resume_id = res1['data']['resume_id']
    
    print("\n2. Analyzing...")
    headers_post = {**headers, 'Content-Type': 'application/json'}
    r2 = requests.post('http://localhost:8000/api/resume/analyze', headers=headers_post, json={
        'resume_id': resume_id,
        'job_description': 'Looking for a Python developer with React experience.'
    })
    print(f"Analyze Status: {r2.status_code}")
    print(json.dumps(r2.json(), indent=2))
    
    print("\n3. ATS Score...")
    r3 = requests.post('http://localhost:8000/api/resume/ats-score', headers=headers_post, json={
        'resume_id': resume_id,
        'job_description': 'Looking for a Python developer with React experience.'
    })
    print(f"ATS Score Status: {r3.status_code}")
    print(json.dumps(r3.json(), indent=2))
    
    os.remove("test_res.txt")
