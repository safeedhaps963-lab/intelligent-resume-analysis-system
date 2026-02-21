import os, requests

ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")

def fetch_adzuna_jobs(
    skills,
    country="in",
    location="",
    page=1,
    per_page=20,
    salary_min=None,
    remote=None
):
    endpoint = f"https://api.adzuna.com/v1/api/jobs/{country}/search/{page}"

    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "what": " ".join(skills[:8]),   # keep query concise
        "where": location,
        "results_per_page": per_page,
        "content-type": "application/json",
    }

    if salary_min:
        params["salary_min"] = salary_min
    if remote is True:
        params["full_time"] = 1

    r = requests.get(endpoint, params=params, timeout=20)
    r.raise_for_status()
    return r.json().get("results", [])
