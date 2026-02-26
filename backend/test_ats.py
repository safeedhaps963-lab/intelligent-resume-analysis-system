import requests
import json

def test_ats_conversion():
    url = "http://localhost:8000/api/resume/convert-ats"
    # Need a token for this. Assuming user is logged in or I can bypass if I had a test token.
    # For now, I'll just check if the route is registered and responds (even if with 401).
    try:
        response = requests.post(url)
        print(f"ATS Convert Status: {response.status_code}")
        # Expected 401 if unauthorized, which is fine for route verification.
    except Exception as e:
        print(f"Error: {e}")

def test_docx_download():
    url = "http://localhost:8000/api/resume/download-ats-docx"
    try:
        response = requests.post(url)
        print(f"DOCX Download Status: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_ats_conversion()
    test_docx_download()
