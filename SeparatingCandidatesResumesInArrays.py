# -*- coding: utf-8 -*-
"""
Created on Tue Mar 11 12:23:49 2025

@author: shuvr
"""

import fitz  # PyMuPDF
import re

def extract_resumes(pdf_path):
    doc = fitz.open(pdf_path)
    resumes = []
    current_resume = ""
    first_resume_detected = False  # Flag to ensure the first resume is captured

    for page in doc:
        page_text = page.get_text("text").lower()

        # Check if the page contains an email, indicating the start of a new resume
        if re.search(r'\b[\w.-]+@[\w.-]+\b', page_text):
            if first_resume_detected:  
                resumes.append(current_resume.strip())  # Store the previous resume
                current_resume = page_text + "\n"  # Start a new resume
            else:
                # This ensures the first resume is not skipped
                first_resume_detected = True
                current_resume = page_text + "\n"
        else:
            current_resume += page_text + "\n"  # Append to the current resume

    # Append the last resume if it exists
    if current_resume.strip():
        resumes.append(current_resume.strip())

    return resumes


# Usage
pdf_path = r"C:\CS 4485.0W1\Handshake_cleaned_documents_export_202502014-22_merge.pdf"
resumes_list = extract_resumes(pdf_path)

# Ensure we only print Resume 1 to Resume 4
for idx, resume in enumerate(resumes_list[:4]):  # Extract only the first 4 resumes
    print(f"Resume {idx + 1}:\n", resume, "\n", "-" * 80)
