import mysql.connector
from mysql.connector import errorcode
import pandas as pd
import os

# 🗂️ Path to the Excel file (you can modify this path if needed)
excel_path = os.path.join("media", "result", "courses_assignment_final_reasoned.xlsx")

# 🔧 MySQL connection settings
DB_HOST = "localhost"
DB_USER = "root"
DB_PASSWORD = "admin"  # change to your password
DB_NAME = "gasbackend"

# 🧱 Table creation SQL
TABLES = {}
TABLES['core_graderassignment'] = (
    """
    CREATE TABLE IF NOT EXISTS core_graderassignment (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_number VARCHAR(50),
        professor_name VARCHAR(100),
        assigned_grader VARCHAR(100),
        grader_major VARCHAR(100),
        grader_email VARCHAR(100),
        justification TEXT
    )
    """
)

try:
    # 🌐 Connect to MySQL Server
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD
    )
    cursor = conn.cursor()

    # 📦 Create database if not exists
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
    conn.database = DB_NAME

    # 🧱 Create table
    for table_name in TABLES:
        cursor.execute(TABLES[table_name])
        print(f"✅ Table `{table_name}` created or already exists.")

    # 📥 Load Excel data
    df = pd.read_excel(excel_path)
    df.columns = [col.strip() for col in df.columns]

    # 🧹 Clean up: remove old data
    cursor.execute("DELETE FROM core_graderassignment")
    print("🧹 Cleared existing data in core_graderassignment")

    # 📝 Insert data
    insert_sql = """
        INSERT INTO core_graderassignment
        (course_number, professor_name, assigned_grader, grader_major, grader_email, justification)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    for _, row in df.iterrows():
        cursor.execute(insert_sql, (
            row.get("Course Number", ""),
            row.get("Professor Name", ""),
            row.get("Assigned Grader", ""),
            row.get("Grader Major", ""),
            row.get("Grader Email", ""),
            row.get("Justification", "")
        ))

    conn.commit()
    print(f"✅ Inserted {len(df)} records into `core_graderassignment`")

    cursor.close()
    conn.close()

except mysql.connector.Error as err:
    if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
        print("❌ Access denied: Check your username or password.")
    elif err.errno == errorcode.ER_BAD_DB_ERROR:
        print("❌ Database does not exist.")
    else:
        print(f"❌ MySQL Error: {err}")
