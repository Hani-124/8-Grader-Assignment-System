# -*- coding: utf-8 -*-
"""
Created on Tue Mar 11 12:23:49 2025

@author: shuvr
"""

import fitz  # PyMuPDF
import re
import os
import zipfile

def extract_resumes_from_pdfs(zip_path, extract_folder):
    # Extract the ZIP file
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_folder)
    
    pdf_files = [os.path.join(extract_folder, f) for f in os.listdir(extract_folder) if f.endswith(".pdf")]
    resumes = []
    
    for pdf_path in pdf_files:
        doc = fitz.open(pdf_path)
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
                    # Ensure the first resume is not skipped
                    first_resume_detected = True
                    current_resume = page_text + "\n"
            else:
                current_resume += page_text + "\n"  # Append to the current resume

        # Append the last resume if it exists
        if current_resume.strip():
            resumes.append(current_resume.strip())

        # Stop if we have collected 4 resumes
        if len(resumes) >= 4:
            break

    return resumes[:4]  # Ensure we only return the first 4 resumes

# Usage
zip_path = "C:\CS 4485.0W1\documents20250326-22-r5fg10.zip"
extract_folder = "C:\\CS 4485.0W1\\extracted_pdfs"  # Define the extraction folder

try:
    resumes_list = extract_resumes_from_pdfs(zip_path, extract_folder)
    # Print only the first 4 resumes
    for idx, resume in enumerate(resumes_list):
        print(f"Resume {idx + 1}:\n", resume, "\n", "-" * 80)
except FileNotFoundError as e:
    print(e)

