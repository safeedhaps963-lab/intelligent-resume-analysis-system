"""
app/services/missing_skills_analyzer.py - Missing Skills Analysis Service
==========================================================================
This module analyzes job descriptions to identify skills that are
missing from a user's resume. It provides categorized suggestions
for improving resume-job matching.

Key Features:
- Extract required skills from job descriptions
- Compare with resume skills
- Categorize missing skills by importance
- Calculate match percentage
"""

import re
import random
from typing import Dict, List, Set, Tuple
from collections import defaultdict


class MissingSkillsAnalyzer:
    """
    Missing Skills Analyzer
    
    Compares resume skills against job requirements to identify
    gaps and provide improvement suggestions.
    
    The analyzer categorizes missing skills into:
    - Critical: Required skills frequently mentioned
    - Recommended: Nice-to-have skills
    - Soft Skills: Interpersonal skills to highlight
    
    Example:
        analyzer = MissingSkillsAnalyzer()
        result = analyzer.analyze(resume_skills, job_description)
        print(f"Match: {result['match_percentage']}%")
        print(f"Missing critical: {result['critical']}")
    """
    
    def __init__(self):
        """Initialize the analyzer with skill databases."""
        
        # Comprehensive skills database organized by category
        self.skills_database = {
            # Programming Languages
            'programming': [
                'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#',
                'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala',
                'R', 'MATLAB', 'Perl', 'Haskell', 'Lua', 'Dart', 'Objective-C',
                'Shell', 'Bash', 'PowerShell', 'SQL', 'NoSQL'
            ],
            
            # Web Frameworks & Libraries
            'frameworks': [
                'React', 'React.js', 'Angular', 'Vue.js', 'Vue', 'Next.js',
                'Node.js', 'Express', 'Express.js', 'Django', 'Flask',
                'FastAPI', 'Spring Boot', 'Spring', 'ASP.NET', '.NET Core',
                'Ruby on Rails', 'Rails', 'Laravel', 'Symfony', 'jQuery',
                'Bootstrap', 'Tailwind CSS', 'Svelte', 'Nuxt.js', 'Gatsby',
                'Redux', 'MobX', 'Vuex', 'GraphQL', 'REST API', 'RESTful'
            ],
            
            # Databases
            'databases': [
                'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Oracle',
                'SQL Server', 'Redis', 'Elasticsearch', 'Cassandra',
                'DynamoDB', 'Firebase', 'Neo4j', 'MariaDB', 'CouchDB',
                'InfluxDB', 'TimescaleDB', 'Supabase', 'PlanetScale'
            ],
            
            # Cloud & DevOps
            'cloud_devops': [
                'AWS', 'Amazon Web Services', 'Azure', 'Google Cloud', 'GCP',
                'Docker', 'Kubernetes', 'K8s', 'Terraform', 'Ansible',
                'Jenkins', 'CircleCI', 'GitHub Actions', 'GitLab CI',
                'Travis CI', 'Heroku', 'Vercel', 'Netlify', 'DigitalOcean',
                'CloudFormation', 'Pulumi', 'Helm', 'ArgoCD', 'Istio',
                'Prometheus', 'Grafana', 'ELK Stack', 'Datadog', 'New Relic',
                'CI/CD', 'DevOps', 'SRE', 'Infrastructure as Code', 'IaC'
            ],
            
            # Data Science & ML
            'data_science': [
                'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
                'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib',
                'Seaborn', 'Jupyter', 'Apache Spark', 'Hadoop', 'NLP',
                'Natural Language Processing', 'Computer Vision', 'OpenCV',
                'Neural Networks', 'Data Mining', 'Data Analysis',
                'Statistics', 'A/B Testing', 'Feature Engineering',
                'MLOps', 'Model Deployment', 'Hugging Face', 'LLM',
                'GPT', 'BERT', 'Transformers', 'RAG'
            ],
            
            # Tools & Platforms
            'tools': [
                'Git', 'GitHub', 'GitLab', 'Bitbucket', 'JIRA', 'Confluence',
                'Trello', 'Asana', 'Slack', 'VS Code', 'IntelliJ', 'PyCharm',
                'Postman', 'Insomnia', 'Figma', 'Sketch', 'Adobe XD',
                'Linux', 'Unix', 'macOS', 'Windows Server',
                'Nginx', 'Apache', 'Load Balancing', 'CDN'
            ],
            
            # Security
            'security': [
                'OAuth', 'JWT', 'Authentication', 'Authorization',
                'OWASP', 'Penetration Testing', 'Security Audit',
                'Encryption', 'SSL/TLS', 'HTTPS', 'Firewall',
                'IAM', 'SSO', 'SAML', 'LDAP'
            ],
            
            # Testing
            'testing': [
                'Unit Testing', 'Integration Testing', 'E2E Testing',
                'Jest', 'Mocha', 'Chai', 'Pytest', 'JUnit', 'Selenium',
                'Cypress', 'Playwright', 'TestNG', 'TDD', 'BDD',
                'Test Automation', 'QA', 'Quality Assurance'
            ],
            
            # Methodologies
            'methodologies': [
                'Agile', 'Scrum', 'Kanban', 'Waterfall', 'Lean',
                'SAFe', 'XP', 'Extreme Programming', 'Sprint Planning',
                'Code Review', 'Pair Programming', 'Mob Programming'
            ],
            
            # Soft Skills
            'soft_skills': [
                'Leadership', 'Communication', 'Problem Solving',
                'Team Collaboration', 'Teamwork', 'Time Management',
                'Critical Thinking', 'Adaptability', 'Creativity',
                'Project Management', 'Mentoring', 'Coaching',
                'Presentation', 'Public Speaking', 'Negotiation',
                'Conflict Resolution', 'Decision Making', 'Strategic Thinking',
                'Emotional Intelligence', 'Customer Focus', 'Innovation'
            ]
        }
        
        # Keywords that indicate required vs preferred skills
        self.required_keywords = [
            'required', 'must have', 'must-have', 'essential',
            'mandatory', 'necessary', 'need to have', 'requirements',
            'qualifications', 'you have', 'you bring'
        ]
        
        self.preferred_keywords = [
            'preferred', 'nice to have', 'nice-to-have', 'bonus',
            'plus', 'advantage', 'ideally', 'optional', 'desired',
            'good to have', 'beneficial'
        ]

        # Category-specific default skills for fallback analysis
        self.category_skills = {
            'Developer': {
                'critical': ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Unit Testing', 'Git', 'REST API', 'SQL', 'System Architecture', 'Microservices'],
                'recommended': ['GraphQL', 'Redis', 'Terraform', 'TypeScript', 'Serverless', 'Message Queues', 'Elasticsearch', 'Monitoring'],
                'soft': ['Agile', 'Code Review', 'Problem Solving', 'Team Collaboration', 'Technical Documentation']
            },
            'Data Scientist/Analyst': {
                'critical': ['Pandas', 'NumPy', 'Scikit-learn', 'SQL', 'Data Visualization', 'Statistics', 'Python', 'Feature Engineering'],
                'recommended': ['Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Apache Spark', 'MLOps', 'Tableau', 'Power BI'],
                'soft': ['Critical Thinking', 'Communication', 'Presentation', 'Business Intelligence', 'Data Storytelling']
            },
            'Designer': {
                'critical': ['Figma', 'Adobe XD', 'Sketch', 'UI/UX Design', 'Prototyping', 'User Research', 'Design Systems'],
                'recommended': ['Motion Design', 'Typography', 'Illustrator', 'Photoshop', 'Brand Identity', 'Interaction Design'],
                'soft': ['Creativity', 'Empathy', 'Adaptability', 'Communication', 'Design Thinking']
            },
            'Management': {
                'critical': ['Project Management', 'Agile', 'Scrum', 'Budgeting', 'Stakeholder Management', 'Strategic Planning', 'Risk Management'],
                'recommended': ['Change Management', 'KPI Tracking', 'Product Strategy', 'Roadmapping', 'Resource Allocation'],
                'soft': ['Leadership', 'Negotiation', 'Conflict Resolution', 'Decision Making', 'Coaching']
            },
            'Professional': {
                'critical': ['Microsoft Office', 'Project Coordination', 'Communication', 'Time Management', 'Problem Solving', 'Digital Literacy'],
                'recommended': ['Customer Focus', 'Strategic Thinking', 'Public Speaking', 'Innovation', 'Business Writing'],
                'soft': ['Leadership', 'Collaboration', 'Adaptability', 'Emotional Intelligence', 'Active Listening']
            }
        }
    
    def analyze(
        self,
        resume_skills: List[str],
        job_description: str,
        category: str = "Professional"
    ) -> Dict:
        """
        Analyze missing skills between resume and job description.
        
        Args:
            resume_skills: List of skills extracted from resume
            job_description: Target job description text
        
        Returns:
            Dict containing:
                - critical: List of critical missing skills
                - recommended: List of recommended missing skills
                - soft: List of missing soft skills
                - match_percentage: Skill match percentage
                - total_job_skills: Total skills found in job
                - matched_skills: Number of matched skills
                - matched_skills_list: List of matched skill names
                - has_job_description: Whether job description was provided
        """
        # Handle empty job description
        if not job_description or len(job_description.strip()) < 20:
            return self._get_default_suggestions(resume_skills, category)
        
        # Normalize resume skills to lowercase for comparison
        resume_skills_lower = set(skill.lower() for skill in resume_skills)
        
        # Extract skills from job description
        job_skills = self._extract_skills_from_text(job_description)
        
        # Categorize job skills by importance
        categorized_job_skills = self._categorize_by_importance(
            job_skills,
            job_description
        )
        
        # Find missing skills
        missing_critical = []
        missing_recommended = []
        missing_soft = []
        matched_skills = []
        
        # Check critical skills
        for skill in categorized_job_skills['critical']:
            if skill.lower() in resume_skills_lower:
                matched_skills.append(skill)
            else:
                missing_critical.append(skill)
        
        # Check recommended skills
        for skill in categorized_job_skills['recommended']:
            if skill.lower() in resume_skills_lower:
                matched_skills.append(skill)
            else:
                missing_recommended.append(skill)
        
        # Check soft skills
        for skill in categorized_job_skills['soft']:
            if skill.lower() in resume_skills_lower:
                matched_skills.append(skill)
            else:
                missing_soft.append(skill)
        
        # Calculate match percentage
        total_job_skills = len(job_skills)
        matched_count = len(matched_skills)
        
        if total_job_skills > 0:
            match_percentage = round((matched_count / total_job_skills) * 100)
        else:
            match_percentage = 0
        
        return {
            'critical': missing_critical[:10],
            'recommended': missing_recommended[:8],
            'soft': missing_soft[:5],
            'match_percentage': match_percentage,
            'total_job_skills': total_job_skills,
            'matched_skills': matched_count,
            'matched_skills_list': matched_skills,
            'has_job_description': True
        }
    
    def _extract_skills_from_text(self, text: str) -> List[str]:
        """Extract skills mentioned in text using pattern matching."""
        text_lower = text.lower()
        found_skills = set()
        
        for category, skills in self.skills_database.items():
            for skill in skills:
                skill_pattern = re.escape(skill.lower())
                pattern = r'(?:^|[\s,;:()\[\]./])' + skill_pattern + r'(?:[\s,;:()\[\]./]|$)'
                if re.search(pattern, text_lower):
                    found_skills.add(skill)
        
        return list(found_skills)
    
    def _categorize_by_importance(
        self,
        skills: List[str],
        job_description: str
    ) -> Dict[str, List[str]]:
        """Categorize skills by importance level."""
        text_lower = job_description.lower()
        critical = []
        recommended = []
        soft = []
        
        for skill in skills:
            skill_lower = skill.lower()
            if skill in self.skills_database.get('soft_skills', []):
                soft.append(skill)
                continue
            
            is_critical = False
            is_recommended = False
            skill_pattern = re.escape(skill_lower)
            
            for keyword in self.required_keywords:
                keyword_pos = text_lower.find(keyword)
                if keyword_pos != -1:
                    skill_match = re.search(skill_pattern, text_lower)
                    if skill_match and abs(skill_match.start() - keyword_pos) < 300:
                        is_critical = True
                        break
            
            if not is_critical:
                for keyword in self.preferred_keywords:
                    keyword_pos = text_lower.find(keyword)
                    if keyword_pos != -1:
                        skill_match = re.search(skill_pattern, text_lower)
                        if skill_match and abs(skill_match.start() - keyword_pos) < 300:
                            is_recommended = True
                            break
            
            if is_critical:
                critical.append(skill)
            elif is_recommended:
                recommended.append(skill)
            else:
                if skill not in self.skills_database.get('soft_skills', []):
                    critical.append(skill)
                else:
                    soft.append(skill)
        
        return {
            'critical': critical,
            'recommended': recommended,
            'soft': soft
        }

    def _get_default_suggestions(self, resume_skills: List[str], category: str = "Professional") -> Dict:
        """Get default skill suggestions when no job description provided."""
        resume_skills_lower = set(skill.lower() for skill in resume_skills)
        cat_data = self.category_skills.get(category, self.category_skills['Professional'])
        
        avail_critical = [s for s in cat_data['critical'] if s.lower() not in resume_skills_lower]
        avail_recommended = [s for s in cat_data['recommended'] if s.lower() not in resume_skills_lower]
        avail_soft = [s for s in cat_data['soft'] if s.lower() not in resume_skills_lower]
        
        # Randomly sample to provide variety and address "static" request
        missing_critical = random.sample(avail_critical, min(len(avail_critical), 7))
        missing_recommended = random.sample(avail_recommended, min(len(avail_recommended), 6))
        missing_soft = random.sample(avail_soft, min(len(avail_soft), 4))
        
        return {
            'critical': missing_critical,
            'recommended': missing_recommended,
            'soft': missing_soft,
            'match_percentage': 0,
            'total_job_skills': 0,
            'matched_skills': 0,
            'matched_skills_list': [],
            'has_job_description': False
        }
    
    def get_skill_learning_resources(self, skill: str) -> Dict:
        """Get learning resources for a specific skill."""
        return {
            'skill': skill,
            'resources': [
                {'type': 'course', 'platform': 'Udemy', 'name': f'Complete {skill} Masterclass'},
                {'type': 'documentation', 'platform': 'Official Docs', 'name': f'{skill} Documentation'},
                {'type': 'tutorial', 'platform': 'YouTube', 'name': f'{skill} Tutorial for Beginners'}
            ]
        }


# Create singleton instance
missing_skills_analyzer = MissingSkillsAnalyzer()