from app import create_app
from flask_jwt_extended import create_access_token
import requests
import json

app = create_app()
with app.app_context():
    # Create a real token for the demo user
    token = create_access_token(identity='demo_user_id')
    print(f"Token: {token}")
    
    # Test the endpoint
    print("\nTesting /api/jobs/recommendations...")
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        r = requests.get('http://localhost:8000/api/jobs/recommendations?limit=15&min_match=40', headers=headers, timeout=30)
        print(f"Status: {r.status_code}")
        print(f"Response: {json.dumps(r.json(), indent=2)}")
    except Exception as e:
        print(f"Request failed: {str(e)}")
