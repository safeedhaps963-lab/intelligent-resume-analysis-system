from .jobs import jobs_bp

def register_routes(app):
    app.register_blueprint(jobs_bp, url_prefix="/api/jobs")
