import requests
import json
import os

def test_ats_conversion():
    url = "http://localhost:8000/api/resume/convert-ats"
    # Create a dummy file
    with open("dummy_resume.txt", "w") as f:
        f.write("John Doe\njohn@example.com\n555-0199\n\nSUMMARY\nExperienced developer.\n\nEXPERIENCE\nWorked at Google.\n\nEDUCATION\nMIT CS.")
    
    files = {'file': open('dummy_resume.txt', 'rb')}
    
    try:
        # Note: We need a token. I'll try to just hit it and see if I get 401 or 500.
        # If the user is seeing 500, it means they ARE authorized.
        # For this test, I'll just see what the server says.
        response = requests.post(url, files=files)
        print(f"Status: {response.status_code}")
        try:
            print(f"Response: {response.json()}")
        except:
            print(f"Raw Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if os.path.exists("dummy_resume.txt"):
            os.remove("dummy_resume.txt")

if __name__ == "__main__":
    test_ats_conversion()
