# -*- coding: utf-8 -*-
"""
Spyder Editor

This is a temporary script file.
"""


import fitz
import re
import sqlite3

def extract_text_from_pdf(pdf_path):
    
    with fitz.open(pdf_path) as doc:
        text = ""
        for page in doc:
            text += page.get_text("text") + "\n"
    return text

# Correct function call
pdf_path = r"C:\SanvedLatestResume\SanvedPaladhi_Resume.pdf"  # Use raw string or double backslashes
text = extract_text_from_pdf(pdf_path)
print(text)  # Print extracted text

# Function to parse details from text
def parse_resume_details(text):
    details = {}

    # Extract name (Assuming first line is name)
    details["Sanved Paladhi"] = text.split("\n")[0].strip()

    # Extract email
    email_match = re.search(r"[\w\.-]+@[\w\.-]+", text)
    details["sanvedpaladhi@gmail.com"] = email_match.group(0) if email_match else None
    
    # Extract phone number
    phone_match = re.search(r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
    details["210-355-3075"] = phone_match.group(0) if phone_match else None
    
    # Extract LinkedIn
    linkedin_match = re.search(r"https?://(www\.)?linkedin\.com/in/[a-zA-Z0-9-]+", text)
    details["linkedln"] = linkedin_match.group(0) if linkedin_match else None
    
    # Extract skills (simple keyword-based extraction)
    skills_start = text.find("Java")
    skills_start = text.find("JavaScript")
    skills_start = text.find("C")
    skills_start = text.find("C++")
    skills_start = text.find("HTML")
    skills_start = text.find("CSS")
    skills_start = text.find("SQL")
    
    
    experience_start = text.find("Intern")
     
    if skills_start != -1 and experience_start != -1:
        details["Java"] = text[skills_start + 6:experience_start].strip()
        details["JavaScript"] = text[skills_start + 6:experience_start].strip()
        details["C"] = text[skills_start + 6:experience_start].strip()
        details["C++"] = text[skills_start + 6:experience_start].strip()
        details["HTML"] = text[skills_start + 6:experience_start].strip()
        details["CSS"] = text[skills_start + 6:experience_start].strip()
        details["SQL"] = text[skills_start + 6:experience_start].strip()

    return details     
    
# Function to store extracted data into SQLite
def store_data_in_db(details):
    conn = sqlite3.connect("resumes.db")
    cursor = conn.cursor()    
   
    cursor.execute('''CREATE TABLE IF NOT EXISTS resumes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name String,
                        email String,
                        phone String,
                        linkedin String,
                        skills String,)''')
    
    cursor.execute("INSERT INTO resumes (name, email, phone, linkedin, skills) VALUES (?, ?, ?, ?, ?, ?)",
                  (details["Sanved Paladhi"], details["sanvedpaladhi@gmail.com"], details["210-355-3075"], details["linkedin"], details["Java"], 
                   details["JavaScript"],  details["C"], details["C++"], details["HTML"], details["CSS"], details["SQL"]))
   
   # Process the provided resume file
pdf_path = "C:\SanvedLatestResume\SanvedPaladhi_Resume.pdf"
text = extract_text_from_pdf(pdf_path)
resume_details = parse_resume_details(text)
store_data_in_db(resume_details)

print("Resume data extracted and stored successfully.")
    
    
