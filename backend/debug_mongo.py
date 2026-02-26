from app import create_app, mongo
app = create_app()
with app.app_context():
    print("Collections:", mongo.db.list_collection_names())
    print("ATS Resumes Count:", mongo.db.ats_resumes.count_documents({}))
