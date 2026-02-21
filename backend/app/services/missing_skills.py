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
    
    def analyze(
        self,
        resume_skills: List[str],
        job_description: str
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
        
        Example:
            result = analyzer.analyze(
                ['Python', 'React', 'AWS'],
                'Looking for developer with Python, Django, Docker...'
            )
        """
        # Handle empty job description
        if not job_description or len(job_description.strip()) < 20:
            return self._get_default_suggestions(resume_skills)
        
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
            'critical': missing_critical[:10],  # Top 10
            'recommended': missing_recommended[:8],  # Top 8
            'soft': missing_soft[:5],  # Top 5
            'match_percentage': match_percentage,
            'total_job_skills': total_job_skills,
            'matched_skills': matched_count,
            'matched_skills_list': matched_skills,
            'has_job_description': True
        }
    
    def _extract_skills_from_text(self, text: str) -> List[str]:
        """
        Extract skills mentioned in text using pattern matching.
        
        Args:
            text: Text to analyze (job description)
        
        Returns:
            List of unique skills found in text
        """
        text_lower = text.lower()
        found_skills = set()
        
        # Search for each skill in our database
        for category, skills in self.skills_database.items():
            for skill in skills:
                # Create pattern for whole word matching
                # Handle special characters in skill names
                skill_pattern = re.escape(skill.lower())
                
                # Match as whole word or with common boundaries
                pattern = r'(?:^|[\s,;:()\[\]./])' + skill_pattern + r'(?:[\s,;:()\[\]./]|$)'
                
                if re.search(pattern, text_lower):
                    found_skills.add(skill)
        
        return list(found_skills)
    
    def _categorize_by_importance(
        self,
        skills: List[str],
        job_description: str
    ) -> Dict[str, List[str]]:
        """
        Categorize skills by their importance level.
        
        Uses context clues in the job description to determine
        whether skills are required, recommended, or soft skills.
        
        Args:
            skills: List of skills found in job description
            job_description: Original job description text
        
        Returns:
            Dict with 'critical', 'recommended', 'soft' skill lists
        """
        text_lower = job_description.lower()
        
        critical = []
        recommended = []
        soft = []
        
        # Check for required/preferred sections
        has_required_section = any(kw in text_lower for kw in self.required_keywords)
        has_preferred_section = any(kw in text_lower for kw in self.preferred_keywords)
        
        for skill in skills:
            skill_lower = skill.lower()
            
            # Check if skill is a soft skill
            if skill in self.skills_database.get('soft_skills', []):
                soft.append(skill)
                continue
            
            # Determine if critical or recommended based on context
            is_critical = False
            is_recommended = False
            
            # Find skill context in job description
            skill_pattern = re.escape(skill_lower)
            
            # Look for skill near required keywords
            for keyword in self.required_keywords:
                # Check if skill is within 200 characters of required keyword
                keyword_pos = text_lower.find(keyword)
                if keyword_pos != -1:
                    skill_match = re.search(skill_pattern, text_lower)
                    if skill_match:
                        distance = abs(skill_match.start() - keyword_pos)
                        if distance < 300:
                            is_critical = True
                            break
            
            # Look for skill near preferred keywords
            if not is_critical:
                for keyword in self.preferred_keywords:
                    keyword_pos = text_lower.find(keyword)
                    if keyword_pos != -1:
                        skill_match = re.search(skill_pattern, text_lower)
                        if skill_match:
                            distance = abs(skill_match.start() - keyword_pos)
                            if distance < 300:
                                is_recommended = True
                                break
            
            # Categorize skill
            if is_critical:
                critical.append(skill)
            elif is_recommended:
                recommended.append(skill)
            else:
                # Default: if no clear section, technical skills are critical
                if skill not in self.skills_database.get('soft_skills', []):
                    critical.append(skill)
                else:
                    soft.append(skill)
        
        return {
            'critical': critical,
            'recommended': recommended,
            'soft': soft
        }
    
    def _get_default_suggestions(self, resume_skills: List[str]) -> Dict:
        """
        Get default skill suggestions when no job description provided.
        
        Args:
            resume_skills: Current resume skills
        
        Returns:
            Dict with general skill suggestions
        """
        resume_skills_lower = set(skill.lower() for skill in resume_skills)
        
        # Suggest commonly required skills not in resume
        common_critical = [
            'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Git',
            'REST API', 'SQL', 'Agile', 'Unit Testing'
        ]
        
        common_recommended = [
            'GraphQL', 'Microservices', 'TypeScript', 'Redis',
            'Terraform', 'Monitoring', 'Security'
        ]
        
        common_soft = [
            'Leadership', 'Communication', 'Problem Solving',
            'Team Collaboration', 'Project Management'
        ]
        
        # Filter out skills already in resume
        missing_critical = [
            s for s in common_critical 
            if s.lower() not in resume_skills_lower
        ][:5]
        
        missing_recommended = [
            s for s in common_recommended 
            if s.lower() not in resume_skills_lower
        ][:4]
        
        missing_soft = [
            s for s in common_soft 
            if s.lower() not in resume_skills_lower
        ][:3]
        
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
        """
        Get learning resources for a specific skill.
        
        Args:
            skill: Skill name to find resources for
        
        Returns:
            Dict with learning resources
        """
        # This would integrate with learning platforms API
        # For now, return placeholder suggestions
        return {
            'skill': skill,
            'resources': [
                {
                    'type': 'course',
                    'platform': 'Udemy',
                    'name': f'Complete {skill} Masterclass'
                },
                {
                    'type': 'documentation',
                    'platform': 'Official Docs',
                    'name': f'{skill} Documentation'
                },
                {
                    'type': 'tutorial',
                    'platform': 'YouTube',
                    'name': f'{skill} Tutorial for Beginners'
                }
            ]
        }


# Create singleton instance
missing_skills_analyzer = MissingSkillsAnalyzer()