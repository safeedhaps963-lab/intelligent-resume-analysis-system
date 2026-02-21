import re
from typing import Dict, List, Optional


class ATSConverter:
    def __init__(self):
        pass

    def convert_resume(self, resume_text: str, job_keywords: Optional[List[str]] = None) -> str:
        # Clean the text
        cleaned_text = self._clean_text(resume_text)
        
        # Extract sections
        sections = self._extract_sections(cleaned_text)
        
        # Reformat sections with standard headers
        formatted_sections = self._format_sections(sections)
        
        # Integrate keywords if provided
        if job_keywords:
            formatted_sections = self._integrate_keywords(formatted_sections, job_keywords)
        
        # Combine into final resume
        ats_resume = self._combine_sections(formatted_sections)
        
        return ats_resume

    def _clean_text(self, text: str) -> str:
        # Remove excessive whitespace
        text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
        
        # Remove special characters that might confuse ATS
        text = re.sub(r'[•●○■□▪▫]', '-', text)
        
        # Normalize line breaks
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        
        return text.strip()

    def _extract_sections(self, text: str) -> Dict[str, str]:
        sections = {}
        lines = text.split('\n')
        
        current_section = 'summary'
        current_content = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            section_type = self._identify_section(line.lower())
            if section_type:
                if current_content:
                    sections[current_section] = '\n'.join(current_content).strip()
                
                current_section = section_type
                current_content = []
            else:
                current_content.append(line)
        
        if current_content:
            sections[current_section] = '\n'.join(current_content).strip()
        
        return sections

    def _identify_section(self, line: str) -> Optional[str]:
        section_keywords = {
            'contact': ['contact', 'personal information', 'contact info'],
            'summary': ['summary', 'objective', 'profile', 'professional summary'],
            'experience': ['experience', 'work experience', 'employment', 'work history'],
            'education': ['education', 'academic background', 'qualifications'],
            'skills': ['skills', 'technical skills', 'competencies', 'abilities'],
            'certifications': ['certifications', 'certificates', 'licenses'],
            'projects': ['projects', 'personal projects', 'portfolio'],
            'awards': ['awards', 'honors', 'achievements']
        }
        
        for section, keywords in section_keywords.items():
            for keyword in keywords:
                if keyword in line and len(line) < 50:
                    return section
        return None

    def _format_sections(self, sections: Dict[str, str]) -> Dict[str, str]:
        formatted = {}
        
        for section in sections:
            header = section.upper()
            formatted[section] = header + '\n' + '='*len(header) + '\n' + sections[section] + '\n'
        
        return formatted

    def _integrate_keywords(self, sections: Dict[str, str], keywords: List[str]) -> Dict[str, str]:
        if 'skills' in sections:
            existing_skills = sections['skills']
            for keyword in keywords:
                if keyword.lower() not in existing_skills.lower():
                    existing_skills += '\n- ' + keyword
            sections['skills'] = existing_skills
        
        return sections

    def _combine_sections(self, sections: Dict[str, str]) -> str:
        section_order = ['contact', 'summary', 'experience', 'education', 
                        'skills', 'certifications', 'projects', 'awards']
        
        resume_parts = []
        for section in section_order:
            if section in sections:
                resume_parts.append(sections[section])
        
        return '\n\n'.join(resume_parts).strip()


ats_converter = ATSConverter()