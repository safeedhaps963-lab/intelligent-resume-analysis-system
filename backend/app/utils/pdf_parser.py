"""
app/utils/pdf_parser.py - PDF and Document Parser Utility
==========================================================
This module provides utilities for parsing resume files
in various formats (PDF, DOCX, TXT).

Supports:
- PDF files (using PyPDF2)
- DOCX files (using python-docx)
- TXT files (plain text)

Each parser extracts text content while preserving
structure as much as possible.
"""

import os
import re
from typing import Optional, Tuple


def parse_resume_file(file_path: str) -> str:
    """
    Parse a resume file and extract text content.
    
    Automatically detects file type based on extension
    and uses the appropriate parser.
    
    Args:
        file_path: Path to the resume file
    
    Returns:
        str: Extracted text content
    
    Raises:
        ValueError: If file type is not supported
        FileNotFoundError: If file doesn't exist
    
    Example:
        text = parse_resume_file('/uploads/resume.pdf')
        print(f"Extracted {len(text)} characters")
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    # Get file extension
    _, ext = os.path.splitext(file_path)
    ext = ext.lower()
    
    # Parse based on extension
    if ext == '.pdf':
        return parse_pdf(file_path)
    elif ext == '.docx':
        return parse_docx(file_path)
    elif ext == '.doc':
        return parse_doc(file_path)
    elif ext == '.txt':
        return parse_txt(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def parse_pdf(file_path: str) -> str:
    """
    Parse PDF file and extract text.
    
    Uses PyPDF2 library to read PDF pages and extract text.
    Handles multi-page documents and attempts to preserve
    paragraph structure.
    
    Args:
        file_path: Path to PDF file
    
    Returns:
        str: Extracted text content
    
    Example:
        text = parse_pdf('/uploads/resume.pdf')
    """
    try:
        # Import PyPDF2 - installed via requirements.txt
        from PyPDF2 import PdfReader
        
        # Open and read PDF
        reader = PdfReader(file_path)
        
        # Extract text from all pages
        text_parts = []
        
        for page_num, page in enumerate(reader.pages):
            # Extract text from page
            page_text = page.extract_text()
            
            if page_text:
                # Clean up the text
                page_text = _clean_extracted_text(page_text)
                text_parts.append(page_text)
        
        # Join all pages with double newline
        full_text = '\n\n'.join(text_parts)
        
        return full_text.strip()
    
    except ImportError:
        raise ImportError("PyPDF2 is required. Install with: pip install PyPDF2")
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {str(e)}")


def parse_docx(file_path: str) -> str:
    """
    Parse DOCX file and extract text.
    
    Uses python-docx library to read Word documents.
    Extracts text from paragraphs and tables.
    
    Args:
        file_path: Path to DOCX file
    
    Returns:
        str: Extracted text content
    
    Example:
        text = parse_docx('/uploads/resume.docx')
    """
    try:
        # Import python-docx - installed via requirements.txt
        from docx import Document
        
        # Open document
        doc = Document(file_path)
        
        text_parts = []
        
        # Extract paragraphs
        for paragraph in doc.paragraphs:
            text = paragraph.text.strip()
            if text:
                text_parts.append(text)
        
        # Extract text from tables
        for table in doc.tables:
            for row in table.rows:
                row_text = []
                for cell in row.cells:
                    cell_text = cell.text.strip()
                    if cell_text:
                        row_text.append(cell_text)
                if row_text:
                    text_parts.append(' | '.join(row_text))
        
        # Join all parts
        full_text = '\n'.join(text_parts)
        
        return _clean_extracted_text(full_text)
    
    except ImportError:
        raise ImportError("python-docx is required. Install with: pip install python-docx")
    except Exception as e:
        raise ValueError(f"Failed to parse DOCX: {str(e)}")


def parse_doc(file_path: str) -> str:
    """
    Parse legacy DOC file and extract text.
    
    Legacy .doc files are more difficult to parse.
    This function attempts to extract text using antiword
    or returns a message to convert the file.
    
    Args:
        file_path: Path to DOC file
    
    Returns:
        str: Extracted text content
    """
    try:
        # Try using antiword (must be installed on system)
        import subprocess
        
        result = subprocess.run(
            ['antiword', file_path],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            return _clean_extracted_text(result.stdout)
        else:
            raise ValueError("antiword failed to parse file")
    
    except FileNotFoundError:
        # antiword not installed
        raise ValueError(
            "Cannot parse .doc files. Please convert to .docx or .pdf, "
            "or install antiword on the system."
        )
    except Exception as e:
        raise ValueError(f"Failed to parse DOC: {str(e)}")


def parse_txt(file_path: str) -> str:
    """
    Parse plain text file.
    
    Simply reads the file content with proper encoding handling.
    
    Args:
        file_path: Path to TXT file
    
    Returns:
        str: File content
    
    Example:
        text = parse_txt('/uploads/resume.txt')
    """
    # Try different encodings
    encodings = ['utf-8', 'utf-16', 'latin-1', 'cp1252']
    
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                content = f.read()
            return _clean_extracted_text(content)
        except UnicodeDecodeError:
            continue
    
    raise ValueError("Could not decode text file with supported encodings")


def _clean_extracted_text(text: str) -> str:
    """
    Clean up extracted text.
    
    Performs various cleaning operations:
    - Remove excessive whitespace
    - Fix line breaks
    - Remove special characters
    - Normalize unicode
    
    Args:
        text: Raw extracted text
    
    Returns:
        str: Cleaned text
    """
    if not text:
        return ""
    
    # Replace multiple spaces with single space
    text = re.sub(r'[ \t]+', ' ', text)
    
    # Replace multiple newlines with double newline
    text = re.sub(r'\n\s*\n', '\n\n', text)
    
    # Remove leading/trailing whitespace from lines
    lines = [line.strip() for line in text.split('\n')]
    text = '\n'.join(lines)
    
    # Remove non-printable characters (except newlines)
    text = re.sub(r'[^\x20-\x7E\n]', '', text)
    
    # Remove excessive newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()


def get_file_info(file_path: str) -> dict:
    """
    Get information about a file.
    
    Args:
        file_path: Path to the file
    
    Returns:
        dict: File information (size, type, etc.)
    """
    if not os.path.exists(file_path):
        return {}
    
    stat = os.stat(file_path)
    _, ext = os.path.splitext(file_path)
    
    return {
        'size': stat.st_size,
        'extension': ext.lower(),
        'filename': os.path.basename(file_path),
        'modified': stat.st_mtime
    }


def estimate_page_count(text: str) -> int:
    """
    Estimate the number of pages based on text length.
    
    Uses average words per page (approximately 400-500 words).
    
    Args:
        text: Resume text content
    
    Returns:
        int: Estimated page count
    """
    word_count = len(text.split())
    
    # Assume ~450 words per page average
    pages = max(1, round(word_count / 450))
    
    return pages