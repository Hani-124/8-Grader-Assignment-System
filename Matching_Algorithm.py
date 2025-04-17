# Import necessary libraries
import mysql.connector  # For MySQL database connection
from mysql.connector import Error  # For handling MySQL errors
import pandas as pd  # For handling tabular data (CSV reading, DataFrames)
import numpy as np  # For handling NaN values
import os  # For file path operations
import configparser  # For reading configuration files
from sklearn.feature_extraction.text import TfidfVectorizer  # For converting text to TF-IDF matrix
from sklearn.metrics.pairwise import cosine_similarity  # For measuring similarity between text vectors
from nltk.stem import PorterStemmer  # For word stemming (reduce words to their base form)
import string  # For removing punctuation

# Global variable to store configuration object
CONFIG_OBJ = None

# Define a basic list of stopwords (common English words to remove during preprocessing)
basic_stopwords = set("""
a about above after again against all am an and any are as at be because been before
being below between both but by could did do does doing down during each few for from
further had has have having he her here hers herself him himself his how i if in into
is it its itself just me more most my myself no nor not of off on once only or other
our ours ourselves out over own same she should so some such than that the their theirs
them themselves then there these they this those through to too under until up very was
we were what when where which while who whom why will with you your yours yourself yourselves
""".split())

# Preprocessing function for text fields
def preprocess(text):
    # Return empty string if text is NaN or blank
    if pd.isna(text) or str(text).strip() == "":
        return ""
    text = text.lower()  # Convert text to lowercase
    text = text.translate(str.maketrans('', '', string.punctuation))  # Remove punctuation
    tokens = text.split()  # Tokenize text by whitespace
    tokens = [word for word in tokens if word not in basic_stopwords]  # Remove stopwords
    stemmer = PorterStemmer()
    tokens = [stemmer.stem(word) for word in tokens]  # Apply stemming
    return ' '.join(tokens)  # Rejoin tokens into a single string

# Configuration class to hold database credentials and file paths
class ConfigObject:
    def __init__(self, host, user, password, database, file_path):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.file_path = file_path

# Initialize and load config from .config file
def init_datamodule(config_path):
    global CONFIG_OBJ
    config = configparser.ConfigParser()
    config.read(config_path)

    try:
        # Read and strip config values
        host = config.get('DATABASE', 'host').strip()
        user = config.get('DATABASE', 'user').strip()
        password = config.get('DATABASE', 'password').strip()
        database = config.get('DATABASE', 'database').strip()
        file_path = config.get('FILES', 'student_file_path').strip()
    except (configparser.NoSectionError, configparser.NoOptionError) as e:
        print("Configuration error:", e)
        return None

    # Store configuration in global object
    CONFIG_OBJ = ConfigObject(host, user, password, database, file_path)
    return CONFIG_OBJ

# Load courses and candidates data from CSV and insert into MySQL
def load_data_to_db():
    # Prompt for config path and initialize config
    config_folder_path = input("Enter the path to the folder containing 'config_filev1.config': ").strip()
    config_path = os.path.join(config_folder_path, 'config_filev1.config')
    config = init_datamodule(config_path)

    if config is None:
        print("❌ Config load failed.")
        return

    # Load CSVs and replace NaNs with None
    f_course = os.path.join(CONFIG_OBJ.file_path, 'courses-table.csv')
    f_candidate = os.path.join(CONFIG_OBJ.file_path, 'sample-candidates-db.csv')
    df_courses = pd.read_csv(f_course).replace({np.nan: None})
    df_candidates = pd.read_csv(f_candidate).replace({np.nan: None})

    db = None
    cursor = None
    try:
        # Connect to MySQL database
        db = mysql.connector.connect(
            host=config.host, user=config.user, password=config.password, database=config.database
        )
        cursor = db.cursor()

        # Recreate courses table
        cursor.execute("DROP TABLE IF EXISTS courses")
        course_columns_sql = ', '.join([
            f"`{col}` TEXT" if col != 'Course_Number' else "`Course_Number` VARCHAR(255) PRIMARY KEY"
            for col in df_courses.columns
        ])
        cursor.execute(f"CREATE TABLE courses ({course_columns_sql})")

        # Insert data into courses table
        insert_courses = f"""
            INSERT INTO courses ({', '.join(df_courses.columns)})
            VALUES ({', '.join(['%s'] * len(df_courses.columns))})
            ON DUPLICATE KEY UPDATE {', '.join([f"{col}=VALUES({col})" for col in df_courses.columns if col != 'Course_Number'])}
        """
        for _, row in df_courses.iterrows():
            cursor.execute(insert_courses, tuple(row[col] for col in df_courses.columns))

        # Recreate candidates table
        cursor.execute("DROP TABLE IF EXISTS candidates")
        candidate_columns_sql = ', '.join([
            f"`{col}` TEXT" if col != 'Student_ID' else "`Student_ID` INT PRIMARY KEY"
            for col in df_candidates.columns
        ])
        cursor.execute(f"CREATE TABLE candidates ({candidate_columns_sql})")

        # Insert data into candidates table
        insert_candidates = f"""
            INSERT INTO candidates ({', '.join(df_candidates.columns)})
            VALUES ({', '.join(['%s'] * len(df_candidates.columns))})
            ON DUPLICATE KEY UPDATE {', '.join([f"{col}=VALUES({col})" for col in df_candidates.columns if col != 'Student_ID'])}
        """
        for _, row in df_candidates.iterrows():
            cursor.execute(insert_candidates, tuple(row[col] for col in df_candidates.columns))

        db.commit()  # Commit changes to DB
        print("✅ Courses and Candidates tables created and populated.")

    except Error as e:
        print("❌ Database Error:", e)
    finally:
        if cursor: cursor.close()
        if db: db.close()

# Match candidates to courses using TF-IDF and cosine similarity
def match_and_insert():
    db = None
    cursor = None
    try:
        # Connect to MySQL
        db = mysql.connector.connect(
            host=CONFIG_OBJ.host, user=CONFIG_OBJ.user,
            password=CONFIG_OBJ.password, database=CONFIG_OBJ.database
        )
        cursor = db.cursor(dictionary=True)

        # Load tables into DataFrames
        cursor.execute("SELECT * FROM courses")
        courses = pd.DataFrame(cursor.fetchall())
        cursor.execute("SELECT * FROM candidates")
        candidates = pd.DataFrame(cursor.fetchall())

        # Preprocess course and candidate text fields
        courses['text'] = courses['Course_Description'].fillna(courses['Keywords']).apply(preprocess)
        candidates['text'] = candidates['Skills'].fillna("").apply(preprocess)

        # Split candidates based on whether they have skill data
        with_skills = candidates[candidates['text'].str.strip() != ""].copy()
        without_skills = candidates[candidates['text'].str.strip() == ""].copy()

        # Vectorize text using TF-IDF
        vectorizer = TfidfVectorizer()
        course_texts = courses['text'].tolist()
        candidate_texts = with_skills['text'].tolist()
        tfidf_matrix = vectorizer.fit_transform(course_texts + candidate_texts)
        course_tfidf = tfidf_matrix[:len(course_texts)]
        candidate_tfidf = tfidf_matrix[len(course_texts):]

        # Compute similarity between each candidate and all courses
        similarity_scores = cosine_similarity(candidate_tfidf, course_tfidf)

        # Find index of best matching course for each candidate
        best_indices = similarity_scores.argmax(axis=1)
        with_skills['Best_Matching_Course'] = courses.loc[best_indices, 'Course_Name'].values
        without_skills['Best_Matching_Course'] = None

        # Combine both sets
        matched = pd.concat([with_skills, without_skills], ignore_index=True)

        # Assign a Candidate_ID and limit to top 4 matches
        matched['Candidate_ID'] = range(1, len(matched) + 1)
        final_output = matched[[  # Select required columns
            'Candidate_ID', 'Student_First_Name', 'Student_Last_Name',
            'Student_Email', 'Skills', 'Best_Matching_Course'
        ]].head(4)

        # Recreate matched_candidates table
        cursor.execute("DROP TABLE IF EXISTS matched_candidates")
        cursor.execute("""
            CREATE TABLE matched_candidates (
                Candidate_ID INT PRIMARY KEY,
                Student_First_Name TEXT,
                Student_Last_Name TEXT,
                Student_Email TEXT,
                Skills TEXT,
                Best_Matching_Course TEXT
            )
        """)

        # Insert matched candidates into the new table
        insert_query = """
            INSERT INTO matched_candidates (
                Candidate_ID, Student_First_Name, Student_Last_Name,
                Student_Email, Skills, Best_Matching_Course
            ) VALUES (%s, %s, %s, %s, %s, %s)
        """
        final_output = final_output.replace({np.nan: None})
        for _, row in final_output.iterrows():
            cursor.execute(insert_query, tuple(row))

        db.commit()  # Save changes to DB
        print("✅ Matching results inserted into matched_candidates table (only top 4 rows).")

    except Error as e:
        print("❌ Database Error:", e)
    finally:
        if cursor: cursor.close()
        if db: db.close()

# Entry point for the script
if __name__ == "__main__":
    load_data_to_db()  # Load CSV data into DB
    match_and_insert()  # Perform matching and insert top matches
