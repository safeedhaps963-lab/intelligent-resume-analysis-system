"""
app/models/job.py - Job Model
==============================
MongoDB Job model for storing job listings and applications.

This model stores:
- Job posting information
- Required and preferred skills
- Salary and location details
- Application tracking
"""

from datetime import datetime
from bson import ObjectId


class Job:
    """
    Job Model for MongoDB
    
    Represents a job listing in the system.
    
    Attributes:
        _id: MongoDB ObjectId
        title: Job title
        company: Company name
        location: Job location
        remote: Whether remote work is available
        salary_min/max: Salary range
        required_skills: Must-have skills
        preferred_skills: Nice-to-have skills
        description: Full job description
    
    Example:
        job = Job(
            title="Senior Developer",
            company="TechCorp",
            location="San Francisco"
        )
    """
    
    # MongoDB collection name
    collection_name = 'jobs'
    
    def __init__(self, title, company, location, _id=None):
        """
        Initialize a new Job instance.
        
        Args:
            title: Job title
            company: Company name
            location: Job location
            _id: MongoDB ObjectId (optional)
        """
        self._id = _id or ObjectId()
        self.title = title
        self.company = company
        self.location = location
        self.remote = False
        self.level = 'mid'  # entry, mid, senior, lead
        
        # Salary information
        self.salary_min = 0
        self.salary_max = 0
        self.currency = 'USD'
        
        # Skills requirements
        self.required_skills = []
        self.preferred_skills = []
        
        # Description and details
        self.description = ""
        self.responsibilities = []
        self.benefits = []
        self.company_logo = ""
        
        # Metadata
        self.posted_date = datetime.utcnow()
        self.expires_date = None
        self.is_active = True
        self.views = 0
        self.applications = 0
    
    def to_dict(self):
        """
        Convert job to dictionary for MongoDB storage.
        
        Returns:
            dict: Job data as dictionary
        """
        return {
            '_id': self._id,
            'title': self.title,
            'company': self.company,
            'location': self.location,
            'remote': self.remote,
            'level': self.level,
            'salary_min': self.salary_min,
            'salary_max': self.salary_max,
            'currency': self.currency,
            'required_skills': self.required_skills,
            'preferred_skills': self.preferred_skills,
            'description': self.description,
            'responsibilities': self.responsibilities,
            'benefits': self.benefits,
            'company_logo': self.company_logo,
            'posted_date': self.posted_date,
            'expires_date': self.expires_date,
            'is_active': self.is_active,
            'views': self.views,
            'applications': self.applications
        }
    
    def to_public_dict(self, match_score=None):
        """
        Convert to public dictionary with optional match score.
        
        Args:
            match_score: Optional match score for personalization
        
        Returns:
            dict: Public job data
        """
        data = {
            'id': str(self._id),
            'title': self.title,
            'company': self.company,
            'location': self.location,
            'remote': self.remote,
            'level': self.level,
            'salary': f"{self.currency} {self.salary_min:,} - {self.salary_max:,}",
            'required_skills': self.required_skills,
            'preferred_skills': self.preferred_skills,
            'benefits': self.benefits,
            'logo': self.company_logo,
            'posted': self.posted_date.isoformat()
        }
        
        if match_score is not None:
            data['match_score'] = match_score
        
        return data
    
    @classmethod
    def from_dict(cls, data):
        """
        Create Job instance from dictionary.
        
        Args:
            data: Dictionary with job data (from MongoDB)
        
        Returns:
            Job: New Job instance
        """
        job = cls(
            title=data.get('title', ''),
            company=data.get('company', ''),
            location=data.get('location', ''),
            _id=data.get('_id')
        )
        
        job.remote = data.get('remote', False)
        job.level = data.get('level', 'mid')
        job.salary_min = data.get('salary_min', 0)
        job.salary_max = data.get('salary_max', 0)
        job.currency = data.get('currency', 'USD')
        job.required_skills = data.get('required_skills', [])
        job.preferred_skills = data.get('preferred_skills', [])
        job.description = data.get('description', '')
        job.responsibilities = data.get('responsibilities', [])
        job.benefits = data.get('benefits', [])
        job.company_logo = data.get('company_logo', '')
        job.posted_date = data.get('posted_date', datetime.utcnow())
        job.expires_date = data.get('expires_date')
        job.is_active = data.get('is_active', True)
        job.views = data.get('views', 0)
        job.applications = data.get('applications', 0)
        
        return job


class Application:
    """
    Job Application Model for MongoDB
    
    Tracks user applications to jobs.
    
    Attributes:
        _id: MongoDB ObjectId
        user_id: Applicant's user ID
        job_id: Job being applied to
        resume_id: Resume used for application
        status: Application status
        status_history: List of status changes
    """
    
    # MongoDB collection name
    collection_name = 'applications'
    
    # Application status options
    STATUS_SUBMITTED = 'submitted'
    STATUS_REVIEWED = 'reviewed'
    STATUS_INTERVIEW = 'interview'
    STATUS_OFFERED = 'offered'
    STATUS_REJECTED = 'rejected'
    STATUS_WITHDRAWN = 'withdrawn'
    
    def __init__(self, user_id, job_id, resume_id, _id=None):
        """
        Initialize a new Application instance.
        
        Args:
            user_id: Applicant's user ID
            job_id: Job being applied to
            resume_id: Resume used for application
            _id: MongoDB ObjectId (optional)
        """
        self._id = _id or ObjectId()
        self.user_id = user_id
        self.job_id = job_id
        self.resume_id = resume_id
        self.cover_letter = ""
        self.status = self.STATUS_SUBMITTED
        self.applied_date = datetime.utcnow()
        self.updated_date = datetime.utcnow()
        self.status_history = [{
            'status': self.STATUS_SUBMITTED,
            'date': datetime.utcnow(),
            'note': 'Application submitted'
        }]
    
    def update_status(self, new_status, note=""):
        """
        Update application status.
        
        Args:
            new_status: New status value
            note: Optional note about the change
        """
        self.status = new_status
        self.updated_date = datetime.utcnow()
        self.status_history.append({
            'status': new_status,
            'date': datetime.utcnow(),
            'note': note
        })
    
    def to_dict(self):
        """
        Convert application to dictionary for MongoDB storage.
        
        Returns:
            dict: Application data as dictionary
        """
        return {
            '_id': self._id,
            'user_id': self.user_id,
            'job_id': self.job_id,
            'resume_id': self.resume_id,
            'cover_letter': self.cover_letter,
            'status': self.status,
            'applied_date': self.applied_date,
            'updated_date': self.updated_date,
            'status_history': self.status_history
        }
    
    @classmethod
    def from_dict(cls, data):
        """
        Create Application instance from dictionary.
        
        Args:
            data: Dictionary with application data
        
        Returns:
            Application: New Application instance
        """
        app = cls(
            user_id=data.get('user_id'),
            job_id=data.get('job_id'),
            resume_id=data.get('resume_id'),
            _id=data.get('_id')
        )
        
        app.cover_letter = data.get('cover_letter', '')
        app.status = data.get('status', cls.STATUS_SUBMITTED)
        app.applied_date = data.get('applied_date', datetime.utcnow())
        app.updated_date = data.get('updated_date', datetime.utcnow())
        app.status_history = data.get('status_history', [])
        
        return app