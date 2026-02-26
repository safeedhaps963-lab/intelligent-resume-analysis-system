import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000/api"

def test_comprehensive_resume_mgmt():
    # 1. Login as admin
    print("Logging in as admin...")
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "demo@example.com",
        "password": "demo123"
    })
    if login_res.status_code != 200:
        print("Login failed.")
        return
    
    token = login_res.json()['data']['access_token']
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. List all resumes with pagination
    print("Listing resumes (page 1, limit 10)...")
    resumes_res = requests.get(f"{BASE_URL}/admin/resumes?page=1&limit=10", headers=headers)
    if resumes_res.status_code == 200:
        data = resumes_res.json()['data']
        pagination = resumes_res.json()['pagination']
        print(f"Found {pagination['total']} total resumes.")
        print(f"Page 1 count: {len(data)}")
    else:
        print(f"Failed to list resumes: {resumes_res.text}")
        return

    # 3. Test search
    if len(data) > 0:
        search_term = data[0]['user_name']
        print(f"Searching for user: {search_term}...")
        search_res = requests.get(f"{BASE_URL}/admin/resumes?search={search_term}", headers=headers)
        if search_res.status_code == 200:
            search_data = search_res.json()['data']
            print(f"Found {len(search_data)} matches for '{search_term}'.")
        else:
            print(f"Search failed: {search_res.text}")

    # 4. Test delete (avoiding real data if possible, but we need to verify no 404)
    if len(data) > 0:
        # We'll try to delete a non-existent ID format first to see if it catches the 400
        print("Testing invalid ID delete (should be 400)...")
        bad_del = requests.delete(f"{BASE_URL}/admin/resumes/invalid_id", headers=headers)
        print(f"Result: {bad_del.status_code} - {bad_del.json().get('error')}")

        # Now test a valid but missing ID format (should be 404 but with JSON error)
        print("Testing missing ID delete (should be 404 JSON)...")
        # 24 chars hex
        missing_id = "123456789012345678901234"
        missing_del = requests.delete(f"{BASE_URL}/admin/resumes/{missing_id}", headers=headers)
        print(f"Result: {missing_del.status_code} - {missing_del.json().get('error')}")
        
    print("Verification complete.")

if __name__ == "__main__":
    test_comprehensive_resume_mgmt()
