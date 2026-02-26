import os, requests

def fetch_adzuna_jobs(
    skills,
    country="in",
    location="",
    page=1,
    per_page=20,
    salary_min=None,
    remote=None
):
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")

    if not app_id or not app_key:
        print("WARNING: ADZUNA_APP_ID or ADZUNA_APP_KEY not set in environment.")
        return []

    endpoint = f"https://api.adzuna.com/v1/api/jobs/{country}/search/{page}"

    params = {
        "app_id": app_id,
        "app_key": app_key,
        "what": " ".join(skills[:8]),   # keep query concise
        "where": location,
        "results_per_page": per_page,
        "content-type": "application/json",
    }

    if salary_min:
        params["salary_min"] = salary_min
    if remote is True:
        params["full_time"] = 1

    try:
        r = requests.get(endpoint, params=params, timeout=15)
        r.raise_for_status()
        return r.json().get("results", [])
    except Exception as e:
        print(f"ERROR: Adzuna API request failed: {str(e)}")
        # Return empty list to trigger fallback in the route
        return []
