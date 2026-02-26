import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_ats_management():
    print("1. Logging in as admin...")
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "demo@example.com",
        "password": "demo123"
    })
    token = login_res.json().get("data", {}).get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    print("2. Testing ATS conversion as user...")
    with open("test_resume.txt", "w") as f:
        f.write("This is a test resume content specifically for conversion testing.")
    
    with open("test_resume.txt", "rb") as f:
        convert_res = requests.post(
            f"{BASE_URL}/resume/convert-ats",
            headers=headers,
            files={"file": f},
            data={"job_keywords": json.dumps(["Python", "SQL"])}
        )
    print("Conversion Response:", convert_res.status_code)
    if convert_res.status_code != 200:
        print("Conversion Error:", convert_res.text)
    
    print("3. Fetching all ATS resumes as admin...")
    list_res = requests.get(f"{BASE_URL}/admin/ats-resumes", headers=headers)
    print("List Response:", list_res.status_code)
    if list_res.status_code != 200:
        print("List Error:", list_res.text)
        
    data = list_res.json()
    if data.get("success"):
        ats_list = data.get("data", [])
        print(f"Found {len(ats_list)} ATS resumes.")
        if ats_list:
            first = ats_list[0]
            print(f"First record: User={first['user_name']}, Email={first['user_email']}, Date={first['created_at']}")
            
            print("4. Deleting first ATS record...")
            del_res = requests.delete(f"{BASE_URL}/admin/ats-resumes/{first['id']}", headers=headers)
            print("Delete Response:", del_res.json())
    else:
        print("Failed to list ATS resumes")

if __name__ == "__main__":
    test_ats_management()
