# -*- coding: utf-8 -*-
"""
Created on Tue Mar 11 12:23:49 2025

@author: shuvr
"""

import fitz  # PyMuPDF

def extract_resumes(pdf_path):
    doc = fitz.open(pdf_path)
    resumes = []
    resume_text = ""
    
    for page in doc:
        text = page.get_text("text")
        
        # Assuming resumes start with a name and job title, and end with EDUCATION or SKILLS
        if "EDUCATION" in text or "SKILLS" in text:
            resume_text += text + "\n"
            resumes.append(resume_text.strip())  # Store the completed resume
            resume_text = ""  # Reset for the next resume
        else:
            resume_text += text + "\n"  # Append text to the current resume
    
    if resume_text:  # In case the last resume does not explicitly end with EDUCATION or SKILLS
        resumes.append(resume_text.strip())
    
    return resumes

# Usage
pdf_path = "C:\CS 4485.0W1\Handshake_cleaned_documents_export_202502014-22_merge.pdf"
resumes_list = extract_resumes(pdf_path)

# Store all resumes in an array
if len(resumes_list) >= 4:
    extracted_resumes = resumes_list[:4]  # Extract first 4 resumes
else:
    extracted_resumes = resumes_list  # If less than 4 resumes exist, store all

for idx, resume in enumerate(extracted_resumes):
    print(f"Resume {idx + 1}:\n", resume, "\n", "-" * 80)
