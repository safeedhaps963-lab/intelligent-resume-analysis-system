"""
app/services/ats_scorer.py - ATS Score Prediction Service
==========================================================
This module provides ATS (Applicant Tracking System) score prediction
for resumes. It analyzes various aspects of a resume to predict how
well it will perform when processed by ATS software.

ATS systems are used by companies to filter resumes based on:
- Keyword matching
- Format compatibility
- Section structure
- Experience relevance
- Education requirements

Key Features:
- Multi-factor ATS scoring
- Detailed breakdown by category
- Improvement recommendations
- Keyword gap analysis
"""

import re
from typing import Dict, List, Tuple
from dataclasses import dataclass

from .nlp_analyzer import nlp_analyzer


@dataclass
class ScoreComponent:
    """
    Represents a single component of the ATS score.
    
    Attributes:
        name: Component name (e.g., 'keywords', 'formatting')
        score: Score value (0-100)
        weight: Weight in overall calculation
        feedback: Specific feedback for this component
    """
    name: str
    score: int
    weight: float
    feedback: str


class ATSScorer:
    """
    ATS Score Prediction Engine
    
    Analyzes resumes and predicts their ATS compatibility score.
    Uses multiple factors weighted by their importance to ATS systems.
    
    Scoring Factors:
    1. Keyword Optimization (30%)
    2. Format & Structure (25%)
    3. Experience Relevance (20%)
    4. Education Match (15%)
    5. Skills Coverage (10%)
    
    Example:
        scorer = ATSScorer()
        result = scorer.calculate_ats_score(resume_text, job_description)
        print(f"ATS Score: {result['overall_score']}%")
    """
    
    def __init__(self):
        """Initialize the ATS scorer with default weights and patterns."""
        
        # Scoring weights for each component
        # These reflect the typical importance in ATS systems
        self.weights = {
            'keywords': 0.30,      # Most important - keyword matching
            'formatting': 0.25,    # Structure and readability
            'experience': 0.20,    # Work experience relevance
            'education': 0.15,     # Educational qualifications
            'skills': 0.10         # Technical skills coverage
        }
        
        # Essential resume sections that ATS looks for
        self.required_sections = [
            'experience', 'education', 'skills', 'summary',
            'contact', 'work history', 'employment'
        ]
        
        # Action verbs that strengthen resume content
        self.action_verbs = [
            'achieved', 'improved', 'developed', 'created', 'managed',
            'led', 'designed', 'implemented', 'increased', 'reduced',
            'launched', 'built', 'delivered', 'optimized', 'streamlined',
            'spearheaded', 'orchestrated', 'executed', 'transformed'
        ]
        
        # Patterns that ATS may have trouble parsing
        self.problematic_patterns = [
            r'[^\x00-\x7F]+',           # Non-ASCII characters
            r'\|',                       # Pipe characters (table formatting)
            r'[\u2022\u2023\u25E6]',     # Fancy bullet points
            r'(?:^|\s)([A-Z]\.){2,}',    # Excessive abbreviations
        ]
    
    def calculate_ats_score(
        self, 
        resume_text: str, 
        job_description: str = ""
    ) -> Dict:
        """
        Calculate comprehensive ATS score for a resume.
        
        Args:
            resume_text: The full text of the resume
            job_description: Optional job description for keyword matching
        
        Returns:
            Dict containing:
                - overall_score: Weighted total score (0-100)
                - breakdown: Individual component scores
                - recommendations: List of improvement suggestions
                - keyword_analysis: Matched and missing keywords
        
        Example:
            result = scorer.calculate_ats_score(resume, job_desc)
            print(f"Score: {result['overall_score']}%")
            for rec in result['recommendations']:
                print(f"- {rec}")
        """
        # Calculate individual component scores
        keyword_score = self._score_keywords(resume_text, job_description)
        format_score = self._score_formatting(resume_text)
        experience_score = self._score_experience(resume_text)
        education_score = self._score_education(resume_text)
        skills_score = self._score_skills(resume_text)
        
        # Create score components
        components = [
            ScoreComponent('keywords', keyword_score['score'], 
                          self.weights['keywords'], keyword_score['feedback']),
            ScoreComponent('formatting', format_score['score'],
                          self.weights['formatting'], format_score['feedback']),
            ScoreComponent('experience', experience_score['score'],
                          self.weights['experience'], experience_score['feedback']),
            ScoreComponent('education', education_score['score'],
                          self.weights['education'], education_score['feedback']),
            ScoreComponent('skills', skills_score['score'],
                          self.weights['skills'], skills_score['feedback']),
        ]
        
        # Calculate weighted overall score
        overall_score = sum(c.score * c.weight for c in components)
        overall_score = min(100, max(0, int(overall_score)))
        
        # Generate recommendations based on low-scoring areas
        recommendations = self._generate_recommendations(components)
        
        # Format breakdown for response
        breakdown = {
            c.name: {
                'score': c.score,
                'weight': int(c.weight * 100),
                'label': self._get_component_label(c.name),
                'feedback': c.feedback
            }
            for c in components
        }
        
        return {
            'overall_score': overall_score,
            'breakdown': breakdown,
            'recommendations': recommendations,
            'keyword_analysis': keyword_score.get('analysis', {}),
            'score_label': self._get_score_label(overall_score)
        }
    
    def _score_keywords(self, resume_text: str, job_description: str) -> Dict:
        """
        Score keyword optimization.
        
        Analyzes how well the resume matches keywords from the job description.
        If no job description is provided, checks for common industry keywords.
        
        Args:
            resume_text: Resume content
            job_description: Target job description
        
        Returns:
            Dict with score, feedback, and keyword analysis
        """
        resume_lower = resume_text.lower()
        
        if job_description:
            # Extract skills from both resume and job description
            resume_skills = nlp_analyzer.extract_skills(resume_text)
            job_skills = nlp_analyzer.extract_skills(job_description)
            
            # Flatten skill lists
            resume_skills_flat = set()
            for cat in resume_skills.values():
                resume_skills_flat.update(s.lower() for s in cat['skills'])
            
            job_skills_flat = set()
            for cat in job_skills.values():
                job_skills_flat.update(s.lower() for s in cat['skills'])
            
            # Calculate match percentage
            if job_skills_flat:
                matched = resume_skills_flat & job_skills_flat
                missing = job_skills_flat - resume_skills_flat
                match_percentage = len(matched) / len(job_skills_flat) * 100
            else:
                matched, missing = set(), set()
                match_percentage = 50  # Default if no skills found
            
            score = min(100, int(match_percentage + 20))  # Base bonus
            
            analysis = {
                'matched_keywords': list(matched)[:15],
                'missing_keywords': list(missing)[:10],
                'match_rate': round(match_percentage, 1)
            }
            
            if match_percentage >= 70:
                feedback = "Excellent keyword match with job description"
            elif match_percentage >= 50:
                feedback = "Good keyword coverage, consider adding missing terms"
            else:
                feedback = "Low keyword match - add more relevant skills"
        
        else:
            # Score based on general keyword presence
            common_keywords = [
                'experience', 'developed', 'managed', 'team', 'project',
                'skills', 'implemented', 'designed', 'improved', 'led'
            ]
            
            found = sum(1 for kw in common_keywords if kw in resume_lower)
            score = min(100, found * 10 + 40)
            analysis = {'general_keywords_found': found}
            feedback = "Add job-specific keywords for better matching"
        
        return {
            'score': score,
            'feedback': feedback,
            'analysis': analysis
        }
    
    def _score_formatting(self, resume_text: str) -> Dict:
        """
        Score resume formatting and structure.
        
        Checks for:
        - Presence of standard sections
        - Clean formatting (no problematic characters)
        - Appropriate length
        - Consistent structure
        
        Args:
            resume_text: Resume content
        
        Returns:
            Dict with score and feedback
        """
        score = 100  # Start with perfect score
        issues = []
        
        text_lower = resume_text.lower()
        
        # Check for required sections
        sections_found = sum(
            1 for section in self.required_sections 
            if section in text_lower
        )
        section_score = (sections_found / len(self.required_sections)) * 30
        
        if sections_found < 3:
            issues.append("Missing key resume sections")
            score -= 20
        
        # Check for problematic formatting
        for pattern in self.problematic_patterns:
            if re.search(pattern, resume_text):
                score -= 5
                issues.append("Contains characters that may not parse correctly")
                break
        
        # Check length (ideal: 400-1500 words)
        word_count = len(resume_text.split())
        if word_count < 200:
            score -= 15
            issues.append("Resume appears too short")
        elif word_count > 2000:
            score -= 10
            issues.append("Resume may be too long for ATS")
        
        # Check for contact information patterns
        has_email = bool(re.search(r'\b[\w.-]+@[\w.-]+\.\w+\b', resume_text))
        has_phone = bool(re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', resume_text))
        
        if not has_email:
            score -= 10
            issues.append("No email address detected")
        if not has_phone:
            score -= 5
            issues.append("No phone number detected")
        
        score = max(0, min(100, score))
        
        if issues:
            feedback = issues[0]  # Return first issue
        else:
            feedback = "Well-formatted resume structure"
        
        return {'score': score, 'feedback': feedback}
    
    def _score_experience(self, resume_text: str) -> Dict:
        """
        Score work experience section.
        
        Evaluates:
        - Use of action verbs
        - Quantifiable achievements
        - Chronological clarity
        
        Args:
            resume_text: Resume content
        
        Returns:
            Dict with score and feedback
        """
        text_lower = resume_text.lower()
        score = 60  # Base score
        
        # Check for action verbs
        action_verb_count = sum(
            1 for verb in self.action_verbs 
            if verb in text_lower
        )
        
        if action_verb_count >= 8:
            score += 25
            feedback = "Strong use of action verbs"
        elif action_verb_count >= 4:
            score += 15
            feedback = "Good action verb usage, could add more"
        else:
            feedback = "Add more action verbs to describe achievements"
        
        # Check for quantifiable achievements (numbers, percentages)
        numbers = re.findall(r'\d+%|\$\d+|\d+\+', resume_text)
        if len(numbers) >= 3:
            score += 15
            feedback = "Excellent use of quantifiable metrics"
        elif len(numbers) >= 1:
            score += 8
        
        score = min(100, score)
        
        return {'score': score, 'feedback': feedback}
    
    def _score_education(self, resume_text: str) -> Dict:
        """
        Score education section.
        
        Checks for:
        - Degree mentions
        - Institution names
        - Graduation years
        
        Args:
            resume_text: Resume content
        
        Returns:
            Dict with score and feedback
        """
        text_lower = resume_text.lower()
        score = 50  # Base score
        
        # Check for degree keywords
        degree_keywords = [
            'bachelor', 'master', 'phd', 'doctorate', 'mba',
            'b.s.', 'm.s.', 'b.a.', 'm.a.', 'degree'
        ]
        
        has_degree = any(kw in text_lower for kw in degree_keywords)
        if has_degree:
            score += 30
        
        # Check for education-related words
        edu_keywords = ['university', 'college', 'institute', 'school']
        has_institution = any(kw in text_lower for kw in edu_keywords)
        if has_institution:
            score += 15
        
        # Check for graduation year
        year_pattern = r'(19|20)\d{2}'
        has_year = bool(re.search(year_pattern, resume_text))
        if has_year:
            score += 5
        
        if has_degree and has_institution:
            feedback = "Education section is complete"
        elif has_degree:
            feedback = "Consider adding institution details"
        else:
            feedback = "Add formal education credentials"
        
        return {'score': min(100, score), 'feedback': feedback}
    
    def _score_skills(self, resume_text: str) -> Dict:
        """
        Score technical and soft skills section.
        
        Uses NLP analyzer to extract and count skills.
        
        Args:
            resume_text: Resume content
        
        Returns:
            Dict with score and feedback
        """
        skills = nlp_analyzer.extract_skills(resume_text)
        
        total_skills = sum(cat['count'] for cat in skills.values())
        
        if total_skills >= 15:
            score = 95
            feedback = "Comprehensive skills section"
        elif total_skills >= 10:
            score = 85
            feedback = "Good skills coverage"
        elif total_skills >= 5:
            score = 70
            feedback = "Consider adding more relevant skills"
        else:
            score = 50
            feedback = "Skills section needs improvement"
        
        return {'score': score, 'feedback': feedback}
    
    def _generate_recommendations(self, components: List[ScoreComponent]) -> List[Dict]:
        """
        Generate improvement recommendations based on scores.
        
        Identifies the weakest areas and provides actionable advice.
        
        Args:
            components: List of score components
        
        Returns:
            List of recommendation dictionaries
        """
        recommendations = []
        
        # Sort components by score to prioritize improvements
        sorted_components = sorted(components, key=lambda c: c.score)
        
        for comp in sorted_components:
            if comp.score < 70:
                rec = {
                    'category': comp.name,
                    'priority': 'high' if comp.score < 50 else 'medium',
                    'title': self._get_recommendation_title(comp.name),
                    'description': comp.feedback,
                    'icon': self._get_recommendation_icon(comp.name)
                }
                recommendations.append(rec)
        
        # Add general recommendations if score is good
        if all(c.score >= 70 for c in components):
            recommendations.append({
                'category': 'general',
                'priority': 'low',
                'title': 'Great Job!',
                'description': 'Your resume is well-optimized for ATS systems',
                'icon': 'check-circle'
            })
        
        return recommendations[:5]  # Return top 5 recommendations
    
    def _get_component_label(self, name: str) -> str:
        """Get human-readable label for component name."""
        labels = {
            'keywords': 'Keyword Optimization',
            'formatting': 'Format & Structure',
            'experience': 'Experience Relevance',
            'education': 'Education Match',
            'skills': 'Skills Coverage'
        }
        return labels.get(name, name.title())
    
    def _get_score_label(self, score: int) -> str:
        """Get label based on overall score."""
        if score >= 90:
            return 'Excellent'
        elif score >= 75:
            return 'Good'
        elif score >= 60:
            return 'Fair'
        else:
            return 'Needs Improvement'
    
    def _get_recommendation_title(self, category: str) -> str:
        """Get recommendation title based on category."""
        titles = {
            'keywords': 'Add More Keywords',
            'formatting': 'Improve Resume Structure',
            'experience': 'Enhance Experience Section',
            'education': 'Complete Education Details',
            'skills': 'Expand Skills Section'
        }
        return titles.get(category, 'Improve ' + category.title())
    
    def _get_recommendation_icon(self, category: str) -> str:
        """Get icon name for recommendation category."""
        icons = {
            'keywords': 'search',
            'formatting': 'file-text',
            'experience': 'briefcase',
            'education': 'graduation-cap',
            'skills': 'tools'
        }
        return icons.get(category, 'lightbulb')


# Create singleton instance
ats_scorer = ATSScorer()