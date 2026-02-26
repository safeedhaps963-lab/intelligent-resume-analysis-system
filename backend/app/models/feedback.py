"""
app/models/feedback.py - Feedback Model
========================================
MongoDB Feedback model for user feedback, complaints and suggestions.
"""

from datetime import datetime
from bson import ObjectId

class Feedback:
    """
    Feedback Model for MongoDB
    """
    collection_name = 'feedback'

    def __init__(self, type, subject, message, user_id=None, name=None, email=None, status="pending", _id=None):
        """
        Initialize a new Feedback instance.
        """
        self._id = _id or ObjectId()
        self.user_id = user_id
        self.name = name
        self.email = email
        self.type = type
        self.subject = subject
        self.message = message
        self.status = status
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def to_dict(self):
        """
        Convert feedback to dictionary for MongoDB storage.
        """
        return {
            '_id': self._id,
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'type': self.type,
            'subject': self.subject,
            'message': self.message,
            'status': self.status,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @classmethod
    def from_dict(cls, data):
        """
        Create Feedback instance from dictionary.
        """
        feedback = cls(
            type=data.get('type'),
            subject=data.get('subject'),
            message=data.get('message'),
            user_id=data.get('user_id'),
            name=data.get('name'),
            email=data.get('email'),
            status=data.get('status', 'pending'),
            _id=data.get('_id')
        )
        feedback.created_at = data.get('created_at', datetime.utcnow())
        feedback.updated_at = data.get('updated_at', datetime.utcnow())
        return feedback
