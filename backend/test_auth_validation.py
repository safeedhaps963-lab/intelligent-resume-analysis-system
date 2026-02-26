import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/auth"

def test_registration_validation():
    print("Testing Registration Validation...")
    
    # Test invalid email
    payload = {"email": "invalid-email", "password": "password123", "name": "Test User"}
    r = requests.post(f"{BASE_URL}/register", json=payload)
    print(f"Invalid email: {r.status_code} - {r.json().get('error')}")
    assert r.status_code == 400
    
    # Test short password
    payload = {"email": "valid@example.com", "password": "123", "name": "Test User"}
    r = requests.post(f"{BASE_URL}/register", json=payload)
    print(f"Short password: {r.status_code} - {r.json().get('error')}")
    assert r.status_code == 400
    
    # Test missing name
    payload = {"email": "valid@example.com", "password": "password123"}
    r = requests.post(f"{BASE_URL}/register", json=payload)
    print(f"Missing name: {r.status_code} - {r.json().get('error')}")
    assert r.status_code == 400

def test_login_validation():
    print("\nTesting Login Validation...")
    
    # Test missing fields
    payload = {"email": ""}
    r = requests.post(f"{BASE_URL}/login", json=payload)
    print(f"Missing fields: {r.status_code} - {r.json().get('error')}")
    assert r.status_code == 400

def test_demo_login():
    print("\nTesting Demo Login...")
    payload = {"email": "demo@example.com", "password": "demo123"}
    r = requests.post(f"{BASE_URL}/login", json=payload)
    print(f"Demo login: {r.status_code} - {r.json().get('success')}")
    assert r.status_code == 200
    assert r.json().get('success') is True

if __name__ == "__main__":
    try:
        test_registration_validation()
        test_login_validation()
        test_demo_login()
        print("\nAll backend validation tests passed!")
    except Exception as e:
        print(f"\nTests failed: {e}")
