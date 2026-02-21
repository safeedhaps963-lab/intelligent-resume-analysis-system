"""
app/models/resume.py - Resume Model
====================================
MongoDB Resume model for storing uploaded resumes and analysis results.

This model stores:
- Original resume file information
- Extracted text content
- NLP analysis results (skills, experience, education)
- ATS score and breakdown
- Missing skills analysis
"""

from datetime import datetime
from bson import ObjectId


class Resume:
    """
    Resume Model for MongoDB
    
    Represents an uploaded resume with analysis results.
    
    Attributes:
        _id: MongoDB ObjectId
        user_id: Owner's user ID
        filename: Original filename
        file_path: Server storage path
        content: Extracted text content
        analyzed: Whether NLP analysis is complete
        analysis_results: Skills, experience, education data
        ats_score: ATS compatibility score
        ats_breakdown: Detailed ATS scoring breakdown
        missing_skills: Skills missing for target job
    
    Example:
        resume = Resume(user_id="user123", filename="resume.pdf")
        resume.set_content(extracted_text)
        resume.set_analysis_results(nlp_results)
    """
    
    # MongoDB collection name
    collection_name = 'resumes'
    
    def __init__(self, user_id, filename, file_path=None, _id=None):
        """
        Initialize a new Resume instance.
        
        Args:
            user_id: Owner's user ID
            filename: Original uploaded filename
            file_path: Server storage path
            _id: MongoDB ObjectId (optional)
        """
        self._id = _id or ObjectId()
        self.user_id = user_id
        self.filename = filename
        self.file_path = file_path
        self.file_size = 0
        self.content = ""  # Extracted text
        self.upload_date = datetime.utcnow()
        
        # Analysis status and results
        self.analyzed = False
        self.analysis_date = None
        self.analysis_results = {
            'skills': {},
            'experience': [],
            'education': [],
            'total_skills_found': 0
        }
        
        # ATS scoring
        self.ats_score = None
        self.ats_breakdown = {}
        self.ats_date = None
        
        # Job matching
        self.job_description = ""
        self.match_score = 0
        self.missing_skills = {
            'critical': [],
            'recommended': [],
            'soft': [],
            'match_percentage': 0
        }
        
        # Metadata
        self.word_count = 0
        self.page_count = 0
    
    def set_content(self, content, file_size=0):
        """
        Set the extracted text content.
        
        Args:
            content: Extracted text from resume
            file_size: Size of original file in bytes
        """
        self.content = content
        self.file_size = file_size
        self.word_count = len(content.split())
    
    def set_analysis_results(self, results):
        """
        Set NLP analysis results.
        
        Args:
            results: Dictionary with skills, experience, education
        """
        self.analyzed = True
        self.analysis_date = datetime.utcnow()
        self.analysis_results = {
            'skills': results.get('skills', {}),
            'experience': results.get('experience', []),
            'education': results.get('education', []),
            'total_skills_found': results.get('total_skills_found', 0),
            'match_score': results.get('match_score', 0)
        }
    
    def set_ats_score(self, score, breakdown):
        """
        Set ATS score and breakdown.
        
        Args:
            score: Overall ATS score (0-100)
            breakdown: Dictionary with category scores
        """
        self.ats_score = score
        self.ats_breakdown = breakdown
        self.ats_date = datetime.utcnow()
    
    def set_missing_skills(self, missing_skills):
        """
        Set missing skills analysis.
        
        Args:
            missing_skills: Dictionary with categorized missing skills
        """
        self.missing_skills = {
            'critical': missing_skills.get('critical', []),
            'recommended': missing_skills.get('recommended', []),
            'soft': missing_skills.get('soft', []),
            'match_percentage': missing_skills.get('match_percentage', 0),
            'total_job_skills': missing_skills.get('total_job_skills', 0),
            'matched_skills': missing_skills.get('matched_skills', 0),
            'has_job_description': missing_skills.get('has_job_description', False)
        }
    
    def to_dict(self):
        """
        Convert resume to dictionary for MongoDB storage.
        
        Returns:
            dict: Resume data as dictionary
        """
        return {
            '_id': self._id,
            'user_id': self.user_id,
            'filename': self.filename,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'content': self.content,
            'upload_date': self.upload_date,
            'analyzed': self.analyzed,
            'analysis_date': self.analysis_date,
            'analysis_results': self.analysis_results,
            'ats_score': self.ats_score,
            'ats_breakdown': self.ats_breakdown,
            'ats_date': self.ats_date,
            'job_description': self.job_description,
            'match_score': self.match_score,
            'missing_skills': self.missing_skills,
            'word_count': self.word_count,
            'page_count': self.page_count
        }
    
    def to_summary_dict(self):
        """
        Convert to summary dictionary (without full content).
        
        Returns:
            dict: Summary data for listings
        """
        return {
            'id': str(self._id),
            'filename': self.filename,
            'upload_date': self.upload_date.isoformat(),
            'analyzed': self.analyzed,
            'ats_score': self.ats_score,
            'skills_count': self.analysis_results.get('total_skills_found', 0),
            'word_count': self.word_count
        }
    
    @classmethod
    def from_dict(cls, data):
        """
        Create Resume instance from dictionary.
        
        Args:
            data: Dictionary with resume data (from MongoDB)
        
        Returns:
            Resume: New Resume instance
        """
        resume = cls(
            user_id=data.get('user_id'),
            filename=data.get('filename', 'Unknown'),
            file_path=data.get('file_path'),
            _id=data.get('_id')
        )
        
        resume.file_size = data.get('file_size', 0)
        resume.content = data.get('content', '')
        resume.upload_date = data.get('upload_date', datetime.utcnow())
        resume.analyzed = data.get('analyzed', False)
        resume.analysis_date = data.get('analysis_date')
        resume.analysis_results = data.get('analysis_results', {})
        resume.ats_score = data.get('ats_score')
        resume.ats_breakdown = data.get('ats_breakdown', {})
        resume.ats_date = data.get('ats_date')
        resume.job_description = data.get('job_description', '')
        resume.match_score = data.get('match_score', 0)
        resume.missing_skills = data.get('missing_skills', {})
        resume.word_count = data.get('word_count', 0)
        resume.page_count = data.get('page_count', 0)
        
        return resume
    
    def get_all_skills(self):
        """
        Get flat list of all extracted skills.
        
        Returns:
            list: All skill names
        """
        skills = []
        for category_data in self.analysis_results.get('skills', {}).values():
            if isinstance(category_data, dict):
                skills.extend(category_data.get('skills', []))
            elif isinstance(category_data, list):
                skills.extend(category_data)
        return skills