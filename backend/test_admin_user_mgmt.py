import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_admin_user_mgmt():
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
    admin_id = login_res.json()['data']['user']['id']
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. List all users
    print("Listing all users...")
    users_res = requests.get(f"{BASE_URL}/admin/users", headers=headers)
    if users_res.status_code != 200:
        print(f"Failed to list users: {users_res.text}")
        return
    
    users = users_res.json()['data']
    print(f"Found {len(users)} users.")
    if users:
        print(f"Debug: First user data: {json.dumps(users[0], indent=2)}")
    
    # Find a non-admin user to test on
    target_user = next((u for u in users if u['role'] != 'admin'), None)
    if not target_user:
        print("No non-admin user found for testing. Skipping deletion test.")
    else:
        # 3. Toggle Status (Inactive)
        print(f"Setting user {target_user['email']} to inactive...")
        patch_res = requests.patch(
            f"{BASE_URL}/admin/users/{target_user['id']}", 
            headers=headers, 
            json={"status": "inactive"}
        )
        print(f"Result: {patch_res.status_code} - {patch_res.json().get('message', patch_res.json().get('error'))}")
        
        # 4. Soft Delete
        print(f"Soft-deleting user {target_user['email']}...")
        del_res = requests.delete(f"{BASE_URL}/admin/users/{target_user['id']}", headers=headers)
        print(f"Result: {del_res.status_code} - {del_res.json().get('message', del_res.json().get('error'))}")

    # 5. Test self-deletion prevention
    print("Testing self-deletion prevention...")
    self_del_res = requests.delete(f"{BASE_URL}/admin/users/{admin_id}", headers=headers)
    if self_del_res.status_code == 400:
        print("SUCCESS: Prevented self-deletion.")
    else:
        print(f"FAILURE: Self-deletion result: {self_del_res.status_code}")

if __name__ == "__main__":
    test_admin_user_mgmt()
