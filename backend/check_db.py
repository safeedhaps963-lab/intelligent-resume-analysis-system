from app import create_app, mongo
from bson import ObjectId

app = create_app()
with app.app_context():
    resumes_count = mongo.db.resumes.count_documents({})
    print(f"Total resumes: {resumes_count}")
    
    # Check for demo user
    demo_user_id = 'demo_user_id' # As seen in auth.py
    demo_resumes = mongo.db.resumes.find({'user_id': demo_user_id})
    print(f"Demo user resumes: {mongo.db.resumes.count_documents({'user_id': demo_user_id})}")
    for r in demo_resumes:
        print(f" - Resume ID: {r['_id']}, Analyzed: {r.get('analyzed')}")
