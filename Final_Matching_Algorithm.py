# ----------- matching_algorithm_config.py (Config File Based) -----------
import os
import mysql.connector
import pandas as pd
import numpy as np
import configparser
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from nltk.stem import PorterStemmer
import string

# Define stopwords globally
basic_stopwords = set("""
a about above after again against all am an and any are as at be because been before
being below between both but by could did do does doing down during each few for from
further had has have having he her here hers herself him himself his how i if in into
is it its itself just me more most my myself no nor not of off on once only or other
our ours ourselves out over own same she should so some such than that the their theirs
them themselves then there these they this those through to too under until up very was
we were what when where which while who whom why will with you your yours yourself yourselves
""".split())

def preprocess(text):
    if pd.isna(text) or str(text).strip() == "":
        return ""
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    tokens = text.split()
    tokens = [t for t in tokens if t not in basic_stopwords]
    stemmer = PorterStemmer()
    tokens = [stemmer.stem(word) for word in tokens]
    return ' '.join(tokens)

def load_config(config_path):
    config = configparser.ConfigParser()
    config.read(config_path)
    return (
        config.get('DATABASE', 'host').strip(),
        config.get('DATABASE', 'user').strip(),
        config.get('DATABASE', 'password').strip(),
        config.get('DATABASE', 'database').strip(),
        config.get('TABLES', 'courses_table').strip(),
        config.get('TABLES', 'candidates_table').strip()
    )

def match_and_insert(host, user, password, database, courses_table, candidates_table):
    matched_table = input("Enter name for the matched_candidates table to create: ").strip()

    db = mysql.connector.connect(host=host, user=user, password=password, database=database)
    cursor = db.cursor(dictionary=True)

    cursor.execute(f"SELECT * FROM {courses_table}")
    courses = pd.DataFrame(cursor.fetchall())

    cursor.execute(f"SELECT * FROM {candidates_table}")
    candidates = pd.DataFrame(cursor.fetchall())

    courses['text'] = courses['Keywords'].fillna("").apply(preprocess)
    candidates['text'] = candidates['Majors'].fillna("").apply(preprocess)
    courses = courses[courses['text'].str.strip() != ""]
    candidates = candidates[candidates['text'].str.strip() != ""]

    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(courses['text'].tolist() + candidates['text'].tolist())
    course_tfidf = tfidf_matrix[:len(courses)]
    candidate_tfidf = tfidf_matrix[len(courses):]

    similarity_scores = cosine_similarity(course_tfidf, candidate_tfidf)
    matched_students = set()
    matches = []

    for i in range(min(len(courses), similarity_scores.shape[0])):
        course_row = courses.iloc[i]
        sims = similarity_scores[i]
        best_match = None
        for j in np.argsort(sims)[::-1]:
            if j >= len(candidates): continue
            if j not in matched_students:
                best_match = j
                break
        if best_match is not None:
            cand_row = candidates.iloc[best_match]
            matches.append({
                "Professor_Name": course_row.get("Professor_Name"),
                "Professor_Email": course_row.get("Professor_Email"),
                "Course_Number": course_row.get("Course_Number"),
                "Section": course_row.get("Section"),
                "Course_Name": course_row.get("Course_Name"),
                "Recommended_Student_Name": f"{cand_row.get('Student_First_Name', '')} {cand_row.get('Student_Last_Name', '')}".strip(),
                "Recommended_Student_Email": cand_row.get("Student_Email", "N/A")
            })
            matched_students.add(best_match)

    cursor.execute(f"DROP TABLE IF EXISTS {matched_table}")
    cursor.execute(f"""
        CREATE TABLE {matched_table} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            Professor_Name TEXT,
            Professor_Email TEXT,
            Course_Number TEXT,
            Section TEXT,
            Course_Name TEXT,
            Recommended_Student_Name TEXT,
            Recommended_Student_Email TEXT
        )
    """)

    insert_query = f"""
        INSERT INTO {matched_table} (
            Professor_Name, Professor_Email, Course_Number,
            Section, Course_Name, Recommended_Student_Name, Recommended_Student_Email
        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    for match in matches:
        cursor.execute(insert_query, (
            match["Professor_Name"], match["Professor_Email"], match["Course_Number"],
            match["Section"], match["Course_Name"],
            match["Recommended_Student_Name"], match["Recommended_Student_Email"]
        ))

    db.commit()
    print(f"✅ Inserted {len(matches)} matched records into {matched_table}.")

    cursor.close()
    db.close()
