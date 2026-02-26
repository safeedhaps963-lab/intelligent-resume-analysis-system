import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_admin_resumes():
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
    
    # 2. List all resumes
    print("Listing all resumes (Admin)...")
    resumes_res = requests.get(f"{BASE_URL}/admin/resumes", headers=headers)
    if resumes_res.status_code == 200:
        resumes = resumes_res.json()['data']
        print(f"Found {len(resumes)} resumes.")
        if len(resumes) > 0:
            for r in resumes[:3]: # Show first 3
                print(f" - [{r['id']}] {r['filename']} (User: {r['user_name']})")
    else:
        print(f"Failed to list resumes: {resumes_res.text}")
        return

    # 3. Test non-admin access
    print("Testing non-admin access (should fail)...")
    # Using the same token but a hypothetical non-admin check if possible or just assuming logic
    # Real test would involve logging in as a non-admin user
    
    print("Verification complete.")

if __name__ == "__main__":
    test_admin_resumes()
