import re
from typing import Dict, List, Optional


class ATSConverter:
    def __init__(self):
        self.section_keywords = {
            'contact': ['contact', 'personal information', 'contact info', 'personal profile'],
            'summary': ['summary', 'objective', 'profile', 'professional summary', 'background', 'about me'],
            'experience': ['experience', 'work experience', 'employment', 'work history', 'professional experience', 'career history', 'professional background'],
            'education': ['education', 'academic background', 'qualifications', 'academic history', 'studies'],
            'skills': ['skills', 'technical skills', 'competencies', 'abilities', 'expertise', 'specializations', 'technologies', 'tools'],
            'certifications': ['certifications', 'certificates', 'licenses', 'credentials', 'courses'],
            'projects': ['projects', 'personal projects', 'portfolio', 'recent projects', 'selected projects'],
            'awards': ['awards', 'honors', 'achievements', 'recognition', 'accomplishments']
        }

    def convert_resume(self, resume_text: str, job_keywords: Optional[List[str]] = None) -> Dict:
        # Clean the text
        cleaned_text = self._clean_text(resume_text)
        
        # Extract sections
        sections = self._extract_sections(cleaned_text)
        
        # Integrate keywords if provided
        if job_keywords:
            sections = self._integrate_keywords(sections, job_keywords)
            
        # Reformat sections with standard headers for the raw text output
        ats_resume_text = self._combine_sections_text(sections)
        
        return {
            'ats_resume': ats_resume_text,
            'sections': sections
        }

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
        
        current_section = 'contact'  # Assume first lines are contact info
        current_content = []
        
        non_empty_count = 0
        for line in lines:
            line = line.strip()
            if not line or self._is_garbage_line(line):
                continue
            
            non_empty_count += 1
            is_protected_zone = non_empty_count <= 10
            section_type = self._identify_section(line.lower(), is_protected=is_protected_zone)
            
            # Additional safety: The very first real line is ALWAYS assumed to be contact (Name)
            if section_type and non_empty_count == 1:
                section_type = None

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

    def _identify_section(self, line: str, is_protected: bool = False) -> Optional[str]:
        """Identify if a line is a section header with high strictness."""
        line = line.strip()
        if not line or len(line) > 40:
            return None
            
        # Headers usually don't have many words
        words = line.split()
        if len(words) > 3:
            return None

        # Headers are usually ALL CAPS or Title Case
        is_title_like = line.isupper() or line.istitle()
        
        for section, keywords in self.section_keywords.items():
            for keyword in keywords:
                # 1. Exact match (strongest)
                if keyword.lower() == line.lower():
                    return section
                
                # 2. Key word with symbols around it (e.g., === EXPERIENCE ===)
                if re.search(rf'^[-=•#\s]*{re.escape(keyword)}[-=•#\s]*$', line, re.IGNORECASE):
                    # In protected zone (start of file), we are even stricter
                    if is_protected and not line.isupper():
                        continue
                    return section
                    
                # 3. Keyword inside a short title-like line
                if is_title_like and keyword.lower() in line.lower() and len(words) <= 2:
                    if is_protected and not line.isupper():
                        continue
                    return section
                    
        return None

    def _is_garbage_line(self, line: str) -> bool:
        """Identify lines that look like footers, page numbers, or system logs."""
        line_lower = line.lower()
        # Page numbers
        if re.search(r'page \d+ of \d+', line_lower) or re.search(r'^\d+\s*/\s*\d+$', line_lower):
            return True
        # File timestamps or paths
        if re.search(r'\d{4}-\d{2}-\d{2}', line_lower) or line.startswith('/') or line.startswith('C:\\'):
            return True
        # Very short single characters
        if len(line.strip()) < 2:
            return True
        return False

    def _integrate_keywords(self, sections: Dict[str, str], keywords: List[str]) -> Dict[str, str]:
        if 'skills' in sections:
            existing_skills = sections['skills']
            for keyword in keywords:
                if keyword.lower() not in existing_skills.lower():
                    existing_skills += '\n- ' + keyword
            sections['skills'] = existing_skills
        else:
            sections['skills'] = '\n'.join([f"- {k}" for k in keywords])
            
        return sections

    def _combine_sections_text(self, sections: Dict[str, str]) -> str:
        section_order = ['contact', 'summary', 'experience', 'education', 
                        'skills', 'certifications', 'projects', 'awards']
        
        resume_parts = []
        for section in section_order:
            if section in sections:
                header = section.upper()
                content = sections[section]
                resume_parts.append(f"{header}\n{'='*len(header)}\n{content}")
        
        return '\n\n'.join(resume_parts).strip()

    def generate_docx(self, sections: Dict[str, str]) -> bytes:
        """Generate a structured, standard single-column ATS-optimized DOCX file."""
        from docx import Document
        from docx.shared import Pt, RGBColor, Inches
        from docx.enum.text import WD_ALIGN_PARAGRAPH
        from io import BytesIO
        
        doc = Document()
        
        # Set standard margins
        sections_doc = doc.sections
        for section in sections_doc:
            section.top_margin = Inches(1.0)
            section.bottom_margin = Inches(1.0)
            section.left_margin = Inches(1.0)
            section.right_margin = Inches(1.0)

        # 1. Contact Section
        if 'contact' in sections:
            contact_lines = sections['contact'].split('\n')
            name = contact_lines[0].upper()
            
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(name)
            run.font.size = Pt(16)
            run.font.bold = True
            
            rest = contact_lines[1:]
            p = doc.add_paragraph(' | '.join(rest))
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.style.font.size = Pt(10)
            
            doc.add_paragraph() # Spacer

        # 2. Main Sections (Single Column)
        section_order = ['summary', 'experience', 'education', 'skills', 'certifications', 'projects', 'awards']
        
        for section_key in section_order:
            if section_key in sections and sections[section_key]:
                # Section Title
                title = section_key.upper()
                h = doc.add_heading(title, level=1)
                run = h.runs[0]
                run.font.size = Pt(12)
                run.font.bold = True
                run.font.color.rgb = RGBColor(0, 0, 0) # Strictly Black for ATS
                
                # Add horizontal line below header
                # (Simple approach in python-docx: add a paragraph with borders or just a line of symbols)
                # But for ATS, keeping it simple is better. We'll stick to bold headers.
                
                # Content
                content = sections[section_key]
                for line in content.split('\n'):
                    line = line.strip()
                    if not line: continue
                    
                    if line.startswith('-') or line.startswith('*') or line.startswith('•'):
                        text = re.sub(r'^[*\-•]\s*', '', line).strip()
                        p = doc.add_paragraph(text, style='List Bullet')
                        p.style.font.size = Pt(11)
                    else:
                        p = doc.add_paragraph(line)
                        p.style.font.size = Pt(11)
                
                doc.add_paragraph() # Section Spacer
        
        target = BytesIO()
        doc.save(target)
        target.seek(0)
        return target.getvalue()


ats_converter = ATSConverter()