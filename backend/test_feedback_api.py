import requests
import json
import time

BASE_URL = "http://localhost:8000/api"
TOKEN = None # Will be set after login

def test_feedback_flow():
    # 1. Login as admin (demo)
    print("Logging in as admin...")
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "demo@example.com",
        "password": "demo123"
    })
    if login_res.status_code != 200:
        print("Login failed. Make sure the server is running.")
        return
    
    token = login_res.json()['data']['access_token']
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Submit feedback
    print("Submitting feedback...")
    submit_res = requests.post(f"{BASE_URL}/feedback", json={
        "type": "complaint",
        "subject": "Test Bug",
        "message": "This is a test feedback message."
    }, headers=headers)
    
    if submit_res.status_code == 201:
        print("Feedback submitted successfully!")
    else:
        print(f"Failed to submit: {submit_res.text}")
        return

    # 3. Get all feedback (Admin)
    print("Fetching feedback list...")
    list_res = requests.get(f"{BASE_URL}/admin/feedback", headers=headers)
    feedbacks = list_res.json()['data']
    
    if len(feedbacks) > 0:
        latest = feedbacks[0]
        print(f"Found {len(feedbacks)} feedbacks. Latest: {latest['subject']} - {latest['status']}")
        feedback_id = latest['id']
        
        # 4. Resolve feedback
        print(f"Resolving feedback {feedback_id}...")
        resolve_res = requests.patch(f"{BASE_URL}/admin/feedback/{feedback_id}/resolve", headers=headers)
        if resolve_res.status_code == 200:
            print("Successfully resolved!")
        else:
            print(f"Failed to resolve: {resolve_res.text}")
            
        # 5. Delete feedback
        print(f"Deleting feedback {feedback_id}...")
        delete_res = requests.delete(f"{BASE_URL}/admin/feedback/{feedback_id}", headers=headers)
        if delete_res.status_code == 200:
            print("Successfully deleted!")
        else:
            print(f"Failed to delete: {delete_res.text}")
    else:
        print("No feedback found in list.")

if __name__ == "__main__":
    test_feedback_flow()
