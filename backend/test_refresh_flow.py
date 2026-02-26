import requests
import time

BASE_URL = "http://127.0.0.1:8000/api"

def test_refresh_flow():
    print("Testing Login...")
    login_data = {
        "email": "demo@example.com",
        "password": "demo123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.status_code} - {response.text}")
        return

    data = response.json()
    access_token = data['data']['access_token']
    refresh_token = data['data']['refresh_token']
    print("Login successful.")

    print("Testing Refresh Token...")
    refresh_headers = {"Authorization": f"Bearer {refresh_token}"}
    refresh_response = requests.post(f"{BASE_URL}/auth/refresh", headers=refresh_headers)
    
    if refresh_response.status_code == 200:
        refresh_data = refresh_response.json()
        new_access_token = refresh_data['access_token']
        print("Refresh successful. New access token obtained.")
        
        print("Testing New Access Token...")
        validate_headers = {"Authorization": f"Bearer {new_access_token}"}
        validate_response = requests.get(f"{BASE_URL}/auth/validate", headers=validate_headers)
        
        if validate_response.status_code == 200:
            print("Validation with new token successful.")
        else:
            print(f"Validation failed: {validate_response.status_code} - {validate_response.text}")
    else:
        print(f"Refresh failed: {refresh_response.status_code} - {refresh_response.text}")

if __name__ == "__main__":
    test_refresh_flow()
