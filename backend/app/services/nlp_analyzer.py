"""
app/services/nlp_analyzer.py - NLP Resume Analyzer Service
===========================================================
This module contains the AI-powered NLP analyzer for extracting
skills, experience, and other information from resumes.

Uses spaCy for Named Entity Recognition (NER) and custom
pattern matching for technical skill extraction.

Key Features:
- Skill extraction using NLP
- Experience parsing
- Education identification
- Keyword matching for ATS scoring
"""

import re
from typing import Dict, List, Tuple, Optional
from collections import Counter

import spacy
from spacy.matcher import PhraseMatcher
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords

# Download required NLTK data (run once)
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')


class NLPResumeAnalyzer:
    """
    AI-Powered Resume Analyzer using NLP
    
    This class provides methods to analyze resumes using Natural Language
    Processing techniques including:
    - Named Entity Recognition (NER)
    - Pattern Matching for skills
    - Text classification
    - Keyword extraction
    
    Attributes:
        nlp: spaCy language model
        skill_matcher: PhraseMatcher for skill detection
        skill_database: Dictionary of known skills by category
    
    Example:
        analyzer = NLPResumeAnalyzer()
        skills = analyzer.extract_skills("Experienced Python developer...")
    """
    
    def __init__(self, model_name: str = 'en_core_web_lg'):
        """
        Initialize the NLP analyzer with spaCy model.
        
        Args:
            model_name: Name of spaCy model to load (default: en_core_web_lg)
        
        Raises:
            OSError: If the spaCy model is not installed
        """
        # Load the spaCy English language model
        # 'en_core_web_lg' is a large model with word vectors
        try:
            self.nlp = spacy.load(model_name)
        except OSError:
            # If model not found, download it
            print(f"Downloading spaCy model: {model_name}")
            spacy.cli.download(model_name)
            self.nlp = spacy.load(model_name)
        
        # Initialize the skill database with categorized skills
        self.skill_database = self._initialize_skill_database()
        
        # Create phrase matcher for skill detection
        self.skill_matcher = self._create_skill_matcher()
        
        # Load English stopwords for text cleaning
        self.stopwords = set(stopwords.words('english'))
    
    def _initialize_skill_database(self) -> Dict[str, List[str]]:
        """
        Initialize the database of known skills by category.
        
        Returns:
            Dict mapping category names to lists of skills
        
        This database is used for pattern matching to identify
        skills mentioned in resumes.
        """
        return {
            # Programming Languages
            'programming_languages': [
                'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#',
                'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala',
                'R', 'MATLAB', 'Perl', 'Haskell', 'Lua', 'Dart', 'Objective-C'
            ],
            
            # Web Frameworks & Libraries
            'web_frameworks': [
                'React', 'React.js', 'Angular', 'Vue.js', 'Vue', 'Next.js',
                'Node.js', 'Express', 'Express.js', 'Django', 'Flask',
                'FastAPI', 'Spring Boot', 'Spring', 'ASP.NET', 'Ruby on Rails',
                'Laravel', 'Symfony', 'jQuery', 'Bootstrap', 'Tailwind CSS'
            ],
            
            # Databases
            'databases': [
                'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Oracle',
                'SQL Server', 'Redis', 'Elasticsearch', 'Cassandra',
                'DynamoDB', 'Firebase', 'Neo4j', 'MariaDB', 'CouchDB'
            ],
            
            # Cloud Platforms & DevOps
            'cloud_devops': [
                'AWS', 'Amazon Web Services', 'Azure', 'Google Cloud', 'GCP',
                'Docker', 'Kubernetes', 'K8s', 'Terraform', 'Ansible',
                'Jenkins', 'CircleCI', 'GitHub Actions', 'GitLab CI',
                'Heroku', 'Vercel', 'Netlify', 'DigitalOcean'
            ],
            
            # Data Science & ML
            'data_science': [
                'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
                'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib',
                'Seaborn', 'Jupyter', 'Apache Spark', 'Hadoop', 'NLP',
                'Computer Vision', 'Neural Networks', 'Data Mining'
            ],
            
            # Tools & Platforms
            'tools': [
                'Git', 'GitHub', 'GitLab', 'Bitbucket', 'JIRA', 'Confluence',
                'Trello', 'Slack', 'VS Code', 'IntelliJ', 'Postman', 'Figma',
                'Adobe XD', 'Linux', 'Unix', 'Bash', 'PowerShell'
            ],
            
            # Soft Skills
            'soft_skills': [
                'Leadership', 'Communication', 'Problem Solving', 'Teamwork',
                'Project Management', 'Agile', 'Scrum', 'Critical Thinking',
                'Time Management', 'Collaboration', 'Mentoring', 'Presentation'
            ]
        }
    
    def _create_skill_matcher(self) -> PhraseMatcher:
        """
        Create a spaCy PhraseMatcher for skill detection.
        
        Returns:
            PhraseMatcher configured with all skills from database
        
        PhraseMatcher efficiently finds exact matches of skill phrases
        in text, which is faster than regex for known terms.
        """
        # Create matcher with case-insensitive matching
        matcher = PhraseMatcher(self.nlp.vocab, attr='LOWER')
        
        # Add all skills from each category to the matcher
        for category, skills in self.skill_database.items():
            # Convert skills to spaCy Doc objects
            patterns = [self.nlp.make_doc(skill.lower()) for skill in skills]
            # Add patterns with category as label
            matcher.add(category, patterns)
        
        return matcher
    
    def extract_skills(self, text: str) -> Dict[str, Dict]:
        """
        Extract skills from resume text using NLP.
        
        Args:
            text: Resume text content
        
        Returns:
            Dict with categorized skills and confidence scores
            
        Example:
            {
                'programming_languages': {
                    'skills': ['Python', 'JavaScript'],
                    'score': 85
                },
                'web_frameworks': {
                    'skills': ['React', 'Flask'],
                    'score': 78
                }
            }
        """
        # Process text with spaCy NLP pipeline
        doc = self.nlp(text.lower())
        
        # Find all skill matches
        matches = self.skill_matcher(doc)
        
        # Organize matches by category
        categorized_skills = {}
        
        for match_id, start, end in matches:
            # Get the category name from match ID
            category = self.nlp.vocab.strings[match_id]
            
            # Get the matched skill text
            skill = doc[start:end].text.title()
            
            # Initialize category if not exists
            if category not in categorized_skills:
                categorized_skills[category] = set()
            
            # Add skill to category
            categorized_skills[category].add(skill)
        
        # Calculate scores and format output
        result = {}
        for category, skills in categorized_skills.items():
            # Score based on number of skills found vs. total in category
            total_in_category = len(self.skill_database.get(category, []))
            found_count = len(skills)
            score = min(100, int((found_count / max(total_in_category, 1)) * 100) + 50)
            
            result[category] = {
                'skills': list(skills),
                'count': found_count,
                'score': score
            }
        
        return result
    
    def extract_experience(self, text: str) -> List[Dict]:
        """
        Extract work experience entries from resume text.
        
        Args:
            text: Resume text content
        
        Returns:
            List of experience dictionaries with company, title, dates
        
        Uses NER to identify organizations and dates, combined with
        pattern matching for job titles.
        """
        doc = self.nlp(text)
        
        experiences = []
        
        # Extract organization entities
        organizations = [ent.text for ent in doc.ents if ent.label_ == 'ORG']
        
        # Extract date entities
        dates = [ent.text for ent in doc.ents if ent.label_ == 'DATE']
        
        # Common job title patterns
        job_title_patterns = [
            r'(Senior|Junior|Lead|Principal|Staff)?\s*(Software|Frontend|Backend|Full Stack|DevOps|Data|ML|AI|Cloud|Systems?|Solutions?)?\s*(Engineer|Developer|Architect|Scientist|Analyst|Manager|Director|Consultant)',
            r'(CTO|CEO|CFO|VP|Director|Manager|Lead)\s*(of)?\s*\w+',
        ]
        
        # Find job titles using patterns
        job_titles = []
        for pattern in job_title_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            job_titles.extend([' '.join(m).strip() for m in matches if m])
        
        # Combine extracted information
        # In production, use more sophisticated parsing
        for i, org in enumerate(organizations[:5]):  # Limit to 5 experiences
            exp = {
                'company': org,
                'title': job_titles[i] if i < len(job_titles) else 'Position',
                'dates': dates[i*2:i*2+2] if i*2+2 <= len(dates) else [],
                'description': ''
            }
            experiences.append(exp)
        
        return experiences
    
    def extract_education(self, text: str) -> List[Dict]:
        """
        Extract education information from resume text.
        
        Args:
            text: Resume text content
        
        Returns:
            List of education dictionaries with degree, institution, year
        """
        doc = self.nlp(text)
        
        education = []
        
        # Degree patterns
        degree_patterns = [
            r"(Bachelor'?s?|Master'?s?|Ph\.?D\.?|MBA|B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?)\s*(of|in)?\s*(Science|Arts|Engineering|Business|Computer Science|Information Technology)?",
            r"(BSc|MSc|BEng|MEng|BTech|MTech)\s*(in)?\s*\w+",
        ]
        
        # Find degrees
        degrees = []
        for pattern in degree_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            degrees.extend([' '.join(m).strip() for m in matches if m])
        
        # Find educational institutions (ORG entities that look like universities)
        edu_keywords = ['university', 'college', 'institute', 'school', 'academy']
        institutions = [
            ent.text for ent in doc.ents 
            if ent.label_ == 'ORG' and 
            any(kw in ent.text.lower() for kw in edu_keywords)
        ]
        
        # Extract years
        year_pattern = r'(19|20)\d{2}'
        years = re.findall(year_pattern, text)
        
        # Combine into education entries
        for i, degree in enumerate(degrees[:3]):  # Limit to 3 entries
            edu = {
                'degree': degree,
                'institution': institutions[i] if i < len(institutions) else '',
                'year': years[i] if i < len(years) else ''
            }
            education.append(edu)
        
        return education
    
    def get_keyword_density(self, text: str, keywords: List[str]) -> float:
        """
        Calculate keyword density in text.
        
        Args:
            text: Text to analyze
            keywords: List of keywords to search for
        
        Returns:
            Float representing keyword density (0.0 to 1.0)
        """
        # Tokenize text
        words = word_tokenize(text.lower())
        
        # Remove stopwords
        words = [w for w in words if w not in self.stopwords and w.isalnum()]
        
        if not words:
            return 0.0
        
        # Count keyword occurrences
        keyword_set = set(kw.lower() for kw in keywords)
        keyword_count = sum(1 for w in words if w in keyword_set)
        
        return keyword_count / len(words)
    
    def analyze_resume(self, text: str, job_description: str = "") -> Dict:
        """
        Perform complete resume analysis.
        
        Args:
            text: Resume text content
            job_description: Optional job description for matching
        
        Returns:
            Complete analysis results including skills, experience, 
            education, and recommendations
        """
        # Extract all components
        skills = self.extract_skills(text)
        experience = self.extract_experience(text)
        education = self.extract_education(text)
        
        # Calculate match score if job description provided
        match_score = 0
        missing_skills = []
        
        if job_description:
            job_skills = self.extract_skills(job_description)
            
            # Find matching and missing skills
            resume_skills_flat = set()
            for cat_data in skills.values():
                resume_skills_flat.update(s.lower() for s in cat_data['skills'])
            
            job_skills_flat = set()
            for cat_data in job_skills.values():
                job_skills_flat.update(s.lower() for s in cat_data['skills'])
            
            if job_skills_flat:
                matched = resume_skills_flat & job_skills_flat
                match_score = int(len(matched) / len(job_skills_flat) * 100)
                missing_skills = list(job_skills_flat - resume_skills_flat)
        
        return {
            'skills': skills,
            'experience': experience,
            'education': education,
            'match_score': match_score,
            'missing_skills': missing_skills[:10],  # Top 10 missing
            'total_skills_found': sum(d['count'] for d in skills.values())
        }


# Create singleton instance for use across application
nlp_analyzer = NLPResumeAnalyzer()