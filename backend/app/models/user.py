"""
app/models/user.py - User Model
================================
MongoDB User model for authentication and profile management.

This model stores user information including:
- Authentication credentials
- Profile information
- Resume history references
- Saved jobs
"""

from datetime import datetime
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash


class User:
    """
    User Model for MongoDB
    
    Represents a user in the system with authentication
    and profile capabilities.
    
    Attributes:
        _id: MongoDB ObjectId
        email: User's email (unique)
        password_hash: Bcrypt hashed password
        name: User's display name
        created_at: Account creation timestamp
        resumes: List of resume ObjectIds
        saved_jobs: List of saved job ObjectIds
    
    Example:
        user = User(email="john@example.com", name="John Doe")
        user.set_password("secure123")
        user_dict = user.to_dict()
    """
    
    # MongoDB collection name
    collection_name = 'users'
    
    def __init__(self, email, name, password=None, _id=None):
        """
        Initialize a new User instance.
        
        Args:
            email: User's email address
            name: User's display name
            password: Plain text password (will be hashed)
            _id: MongoDB ObjectId (optional, for existing users)
        """
        self._id = _id or ObjectId()
        self.email = email.lower().strip()
        self.name = name
        self.password_hash = None
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.role = 'user'  # Default role: 'user' or 'admin'
        self.status = 'active'  # Account status: 'active', 'inactive', 'deleted'
        self.last_login = None  # Last login timestamp
        self.resumes = []  # List of resume IDs
        self.saved_jobs = []  # List of saved job IDs
        self.skills = []  # Aggregated skills from resumes
        self.preferences = {
            'job_alerts': True,
            'email_notifications': True,
            'preferred_locations': [],
            'preferred_job_types': []
        }
        
        # Set password if provided
        if password:
            self.set_password(password)
    
    def set_password(self, password):
        """
        Hash and set the user's password.
        
        Uses werkzeug's generate_password_hash with PBKDF2.
        
        Args:
            password: Plain text password to hash
        """
        self.password_hash = generate_password_hash(
            password,
            method='pbkdf2:sha256',
            salt_length=16
        )
    
    def check_password(self, password):
        """
        Verify a password against the stored hash.
        
        Args:
            password: Plain text password to verify
        
        Returns:
            bool: True if password matches, False otherwise
        """
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self, include_password=False):
        """
        Convert user to dictionary for MongoDB storage.
        
        Args:
            include_password: Whether to include password hash
        
        Returns:
            dict: User data as dictionary
        """
        data = {
            '_id': self._id,
            'email': self.email,
            'name': self.name,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'resumes': self.resumes,
            'saved_jobs': self.saved_jobs,
            'role': self.role,
            'status': self.status,
            'last_login': self.last_login,
            'skills': self.skills,
            'preferences': self.preferences
        }
        
        if include_password:
            data['password_hash'] = self.password_hash
        
        return data
    
    def to_public_dict(self):
        """
        Convert user to public-safe dictionary.
        
        Excludes sensitive information like password hash.
        
        Returns:
            dict: Public user data
        """
        return {
            'id': str(self._id),
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'status': self.status,
            'last_login': self.last_login.isoformat() if self.last_login and hasattr(self.last_login, 'isoformat') else self.last_login,
            'created_at': self.created_at.isoformat(),
            'skills_count': len(self.skills),
            'resumes_count': len(self.resumes)
        }
    
    @classmethod
    def from_dict(cls, data):
        """
        Create User instance from dictionary.
        
        Args:
            data: Dictionary with user data (from MongoDB)
        
        Returns:
            User: New User instance
        """
        user = cls(
            email=data.get('email', ''),
            name=data.get('name', ''),
            _id=data.get('_id')
        )
        user.password_hash = data.get('password_hash')
        user.created_at = data.get('created_at', datetime.utcnow())
        user.updated_at = data.get('updated_at', datetime.utcnow())
        user.resumes = data.get('resumes', [])
        user.saved_jobs = data.get('saved_jobs', [])
        user.role = data.get('role', 'user')
        user.status = data.get('status', 'active')
        user.last_login = data.get('last_login')
        user.skills = data.get('skills', [])
        user.preferences = data.get('preferences', {})
        
        return user
    
    def add_resume(self, resume_id):
        """Add a resume ID to user's resumes list."""
        if resume_id not in self.resumes:
            self.resumes.append(resume_id)
            self.updated_at = datetime.utcnow()
    
    def add_saved_job(self, job_id):
        """Add a job ID to user's saved jobs list."""
        if job_id not in self.saved_jobs:
            self.saved_jobs.append(job_id)
            self.updated_at = datetime.utcnow()
    
    def remove_saved_job(self, job_id):
        """Remove a job ID from user's saved jobs list."""
        if job_id in self.saved_jobs:
            self.saved_jobs.remove(job_id)
            self.updated_at = datetime.utcnow()
    
    def update_skills(self, new_skills):
        """
        Update user's aggregated skills list.
        
        Args:
            new_skills: List of skill strings to add
        """
        for skill in new_skills:
            if skill.lower() not in [s.lower() for s in self.skills]:
                self.skills.append(skill)
        self.updated_at = datetime.utcnow()