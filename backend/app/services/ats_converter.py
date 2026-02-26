import re
from typing import Dict, List, Optional


class ATSConverter:
    def __init__(self):
        self.section_keywords = {
            'contact': ['contact', 'personal information', 'contact info', 'personal profile', 'contact details'],
            'summary': ['summary', 'objective', 'profile', 'professional summary', 'background', 'about me', 'executive summary', 'career objective'],
            'experience': ['experience', 'work experience', 'employment', 'work history', 'professional experience', 'career history', 'professional background', 'employment history', 'work record'],
            'education': ['education', 'academic background', 'qualifications', 'academic history', 'studies', 'educational background', 'academic profile'],
            'skills': ['skills', 'technical skills', 'competencies', 'abilities', 'expertise', 'specializations', 'technologies', 'tools', 'core competencies', 'professional skills'],
            'certifications': ['certifications', 'certificates', 'licenses', 'credentials', 'courses', 'professional certifications'],
            'projects': ['projects', 'personal projects', 'portfolio', 'recent projects', 'selected projects', 'academic projects'],
            'awards': ['awards', 'honors', 'achievements', 'recognition', 'accomplishments', 'honors & awards']
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
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
        # Remove special characters that might confuse ATS
        text = re.sub(r'[•●○■□▪▫]', '-', text)
        # Normalize line breaks
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        return text.strip()

    def _extract_sections(self, text: str) -> Dict[str, str]:
        """
        Extract sections from resume text with high accuracy.
        1. Pre-extract contact info using regex to prevent it from leaking into other sections.
        2. Identify section boundaries using semantic keywords.
        3. Assign text between boundaries to corresponding sections.
        """
        sections = {}
        
        # 1. Proactively extract contact info
        contact_info = self._extract_contact_info(text)
        sections['contact'] = contact_info['raw']
        
        # 2. Identify sections
        lines = text.split('\n')
        current_section = None
        current_content = []
        
        # We'll skip lines that were already identified as specific contact info 
        # to avoid duplication, but we'll include the first few lines as "Name/Profile" 
        # if no header is found.
        
        # Heuristic: The very first few lines (usually top of resume) are "Contact/Header"
        # unless we hit a different header.
        current_section = 'contact'
        
        non_empty_line_count = 0
        for line in lines:
            line_strip = line.strip()
            if not line_strip or self._is_garbage_line(line_strip):
                continue
            
            non_empty_line_count += 1
            
            # Check if this line is a section header
            # We are stricter in the "protected zone" (first 5 lines) 
            # to avoid misidentifying the Name or Contact info as a section.
            section_type = self._identify_section(line_strip, is_protected=(non_empty_line_count < 5))
            
            # Additional safety: If we identified a name, don't let it be a section header
            if section_type and non_empty_line_count == 1:
                section_type = None

            if section_type:
                # Save previous section
                if current_content:
                    # Clean up the content before saving
                    content_text = '\n'.join(current_content).strip()
                    if current_section == 'contact':
                        # If we're moving from contact to something else, 
                        # ensure we don't overwrite if it's already robust
                        sections[current_section] = sections.get(current_section, '') + '\n' + content_text
                    else:
                        sections[current_section] = content_text
                
                # Start new section
                current_section = section_type
                current_content = []
                # Don't add the header itself to the content
            else:
                current_content.append(line_strip)
        
        # Save last section
        if current_content:
            sections[current_section] = '\n'.join(current_content).strip()
            
        # 3. Post-process sections
        # Ensure contact info is formatted well
        if 'contact' in sections:
            # Re-verify contact info to make sure it's clean
            sections['contact'] = self._format_contact_section(sections['contact'], contact_info)
            
        return sections

    def _extract_contact_info(self, text: str) -> Dict:
        """Extract specific contact entities using regex."""
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,}'
        linkedin_pattern = r'linkedin\.com/in/[a-zA-Z0-9-]+'
        github_pattern = r'github\.com/[a-zA-Z0-9-]+'
        website_pattern = r'(https?://)?(www\.)?([a-zA-Z0-9-]+)\.([a-z]{2,})(/[a-zA-Z0-9#-]+)?'
        
        emails = re.findall(email_pattern, text)
        phones = re.findall(phone_pattern, text)
        linkedin = re.findall(linkedin_pattern, text)
        github = re.findall(github_pattern, text)
        
        # Simple address detection (often multi-line, looking for Zip code or state)
        address_pattern = r'\b[A-Z]{2}\s\d{5}|\d{5}\b|Kerala|California|London|New York'
        
        # Name is usually one of the first lines
        lines = [l.strip() for l in text.split('\n') if l.strip()][:10]
        name = ""
        address_lines = []
        
        # Potential names are usually short, first few lines, and not keywords
        for line in lines[:3]:
            if len(line.split()) <= 4 and not self._identify_section(line) and not re.search(email_pattern, line):
                name = line
                break
        
        return {
            'name': name,
            'emails': list(set(emails)),
            'phones': list(set(phones)),
            'linkedin': list(set(linkedin)),
            'github': list(set(github)),
            'raw': '\n'.join([name] + emails + phones + linkedin + github)
        }

    def _format_contact_section(self, raw_content: str, extracted: Dict) -> str:
        """Combine raw header text with extracted entities for a clean contact section."""
        lines = raw_content.split('\n')
        # Keep only lines that look like name or contact info, filter out section leaks
        clean_lines = []
        seen = set()
        
        # Critical keywords that shouldn't be in contact header
        blocked_keywords = ['experience', 'education', 'skills', 'summary', 'university', 'college', 'professor']
        
        for line in lines:
            l = line.strip()
            if not l or l.lower() in seen: continue
            
            # If it's a very long line, it's probably a leaked summary or experience
            if len(l) > 120: continue
            
            # If it looks like a header for another section, skip it
            if self._identify_section(l, is_protected=False): continue
            
            # Skip if it contains blocked keywords unless it's very short
            if any(bk in l.lower() for bk in blocked_keywords) and len(l) > 20: continue
            
            clean_lines.append(l)
            seen.add(l.lower())
            
        # Ensure name is first
        if extracted['name'] and clean_lines and clean_lines[0] != extracted['name']:
            if extracted['name'] in clean_lines:
                clean_lines.remove(extracted['name'])
            clean_lines.insert(0, extracted['name'])
            
        return '\n'.join(clean_lines).strip()

    def _identify_section(self, line: str, is_protected: bool = False) -> Optional[str]:
        """Identify if a line is a section header with high strictness."""
        line = line.strip()
        # Headers usually aren't super long, but let's allow up to 60 chars
        if not line or len(line) > 60:
            return None
            
        # Headers usually don't have many words. Increased to 6.
        words = line.split()
        if len(words) > 6:
            return None

        # Headers are usually ALL CAPS or Title Case
        is_title_like = line.isupper() or line.istitle() or line.replace('&', '').istitle()
        
        # Special check for common symbols like & and /
        normalized_line = line.lower().replace('&', 'and').replace('/', ' ')
        
        for section, keywords in self.section_keywords.items():
            for keyword in keywords:
                # 1. Exact match (strongest)
                if keyword.lower() == normalized_line.strip():
                    return section
                
                # 2. Key word with symbols around it (e.g., === EXPERIENCE ===)
                if re.search(rf'^[-=•#\s]*{re.escape(keyword)}[-=•#\s]*$', line, re.IGNORECASE):
                    # In protected zone (start of file), we are even stricter
                    if is_protected and not line.isupper():
                        continue
                    return section
                    
                # 3. Keyword inside a short title-like line
                if is_title_like and keyword.lower() in normalized_line and len(words) <= 4:
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