from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.files.storage import FileSystemStorage
from django.conf import settings
import os
import pandas as pd
import numpy as np
import mysql.connector
import zipfile
from io import BytesIO
import fitz
import re

from .models import GraderAssignment
from .serializers import GraderAssignmentSerializer, FileUploadSerializer
from core.scrapers.utd_course_scraper import scrape_utd_courses  # 👈 Make sure this file exists!


# === 1. Upload + Process 3 Files (resume, candidates, courseInfo) === #
class ResumeCourseProcessingAPI(APIView):
    def post(self, request):
        try:
            create_database_if_not_exists("student")

            file_map = {
                'resume': request.FILES.get('resume'),
                'candidates': request.FILES.get('candidates'),
                'courseInfo': request.FILES.get('courseInfo'),
            }

            for file_type, uploaded_file in file_map.items():
                if not uploaded_file:
                    continue

                sub_dir = f"uploads/{file_type}"
                storage = FileSystemStorage(
                    location=os.path.join(settings.MEDIA_ROOT, sub_dir),
                    base_url=f"{settings.MEDIA_URL}{sub_dir}/"
                )
                filename = storage.save(uploaded_file.name, uploaded_file)
                file_path = os.path.join(settings.MEDIA_ROOT, sub_dir, filename)

                if file_type == 'resume' and filename.endswith('.zip'):
                    with zipfile.ZipFile(file_path, 'r') as zip_ref:
                        for zip_info in zip_ref.infolist():
                            if zip_info.filename.endswith('.pdf'):
                                pdf_data = zip_ref.read(zip_info.filename)
                                resumes = extract_resumes(BytesIO(pdf_data))
                                for resume_text in resumes:
                                    parsed = parse_resume_to_student_dict(resume_text, zip_info.filename)
                                    update_student_with_resume_data(parsed)

                elif file_type in ['candidates', 'courseInfo']:
                    df = pd.read_csv(file_path) if filename.endswith('.csv') else pd.read_excel(file_path)
                    df.columns = [str(col).strip().replace(" ", "_") for col in df.columns]
                    df = df.replace({np.nan: None})
                    table = "students" if file_type == "candidates" else "courses"
                    insert_data_into_mysql(df, table)

             # STEP 2: Run UTD course scraper
            scrape_utd_courses()

            # STEP 3: Match students to courses
            self.assign_students_to_courses_based_on_keywords()

            return Response({"message": "All files processed successfully."}, status=201)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    def assign_students_to_courses_based_on_keywords(self):
        db = mysql.connector.connect(host="localhost", user="root", passwd="SeniorProject25", database="student")
        cursor = db.cursor()

        cursor.execute("SELECT Student_ID, Skills FROM students")
        students = cursor.fetchall()

        cursor.execute("SELECT Course_Number, Keywords FROM courses")
        courses = cursor.fetchall()

        for student_id, skills in students:
            if not skills:
                continue
            student_skills = set(skills.lower().split(", "))
            for course_number, keywords in courses:
                if not keywords:
                    continue
                course_keywords = set(keywords.lower().split(", "))
                if student_skills.intersection(course_keywords):
                    self.insert_assigned_grader(student_id, course_number)

        db.commit()
        cursor.close()
        db.close()

    def insert_assigned_grader(self, student_id, course_number):
        db = mysql.connector.connect(host="localhost", user="root", passwd="SeniorProject25", database="student")
        cursor = db.cursor()

        cursor.execute("SELECT COUNT(*) FROM assigned_grader WHERE student_id=%s AND course_number=%s",
                       (student_id, course_number))
        if cursor.fetchone()[0] == 0:
            cursor.execute(
                "INSERT INTO assigned_grader (student_id, course_number) VALUES (%s, %s)",
                (student_id, course_number)
            )
            db.commit()
        cursor.close()
        db.close()


# === 2. Simple Upload (no parsing, just stores files) === #
class SimpleFileUploadAPI(APIView):
    def post(self, request):
        serializer = FileUploadSerializer(data=request.data)
        if serializer.is_valid():
            uploaded_file = serializer.validated_data['file']
            file_type = serializer.validated_data['type']

            sub_dir = f"uploads/{file_type}"
            storage = FileSystemStorage(
                location=os.path.join(settings.MEDIA_ROOT, sub_dir),
                base_url=f"{settings.MEDIA_URL}{sub_dir}/"
            )
            filename = storage.save(uploaded_file.name, uploaded_file)

            return Response({
                'message': 'Upload successful.',
                'download_url': f"/media/{sub_dir}/{filename}"
            }, status=201)

        return Response(serializer.errors, status=400)


# === 3. Manual Edits === #
class SaveEditedAssignmentsAPIView(APIView):
    def post(self, request):
        try:
            data = request.data.get('data', [])
            if not data:
                return Response({'error': 'No data provided.'}, status=400)

            for row in data:
                course = row.get('course_number')
                professor = row.get('professor_name')
                if not course or not professor:
                    return Response({
                        'error': f'Missing Course Number or Professor Name in row: {row}'
                    }, status=400)

                GraderAssignment.objects.update_or_create(
                    course_number=course,
                    professor_name=professor,
                    defaults={
                        'assigned_grader': row.get('assigned_grader'),
                        'grader_major': row.get('grader_major'),
                        'grader_email': row.get('grader_email'),
                        'justification': row.get('justification'),
                    }
                )

            return Response({'message': 'Records saved successfully.'}, status=200)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)


# === 4. Match Results === #
class MatchResultsAPIView(APIView):
    def get(self, request):
        try:
            queryset = GraderAssignment.objects.all()
            serializer = GraderAssignmentSerializer(queryset, many=True)
            return Response({'data': serializer.data}, status=200)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# === 5. Trigger Selenium Scraping === #
class ScrapeCoursesView(APIView):
    def get(self, request):
        try:
            scrape_utd_courses()
            return Response({"message": "Courses scraped and inserted successfully."}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


# === Helper Functions === #
def extract_resumes(pdf_file):
    doc = fitz.open(stream=pdf_file, filetype="pdf")
    return ["\n".join([page.get_text("text") for page in doc])]


def parse_resume_to_student_dict(text, file_name=""):
    data = {}
    candidate_id_match = re.search(r"(\d+)(?=\D*$)", file_name)
    data["Student_ID"] = int(candidate_id_match.group(1)) if candidate_id_match else None

    lines = text.strip().split('\n')
    text_lower = text.lower()
    full_name = next((line.title() for line in lines if "@" not in line and len(line.split()) >= 2), "Unknown Name")
    parts = full_name.split()
    data["Student_First_Name"] = parts[0]
    data["Student_Last_Name"] = parts[-1]

    data["Student_Email"] = re.search(r"[\w\.-]+@[\w\.-]+\b", text).group(0) if re.search(r"[\w\.-]+@[\w\.-]+\b", text) else None
    data["Student_School_Year_Name"] = re.search(r"\b(senior|junior|sophomore|freshman)\b", text_lower).group(0).title() if re.search(r"\b(senior|junior|sophomore|freshman)\b", text_lower) else None
    data["Student_School"] = "UT Dallas" if re.search(r"utd|university of texas at dallas", text_lower) else None
    data["Student_Graduation_Date"] = re.search(r"(spring|fall|summer|winter)?\s?\d{4}", text_lower).group(0).title() if re.search(r"(spring|fall|summer|winter)?\s?\d{4}", text_lower) else None

    data["Current_Qualification"] = next((q for q in ["Bachelor's", "Master's", "Ph.D"] if q.lower() in text_lower), None)
    majors = ["computer science", "software engineering", "data science"]
    data["Majors"] = next((m.title() for m in majors if m in text_lower), None)
    gpa_match = re.search(r"gpa[:\s]*([0-3]\.[0-9]{1,2}|4\.0)", text_lower)
    data["GPA"] = gpa_match.group(1) if gpa_match else None

    skills = ["python", "java", "sql", "react", "django"]
    found = [s.title() for s in skills if s in text_lower]
    data["Skills"] = ", ".join(found) if found else None

    data["Student_Primary_College"] = None
    return data


def update_student_with_resume_data(data):
    db = mysql.connector.connect(host="localhost", user="root", passwd="SeniorProject25", database="student")
    cursor = db.cursor()

    cursor.execute("SHOW COLUMNS FROM students")
    existing = {row[0] for row in cursor.fetchall()}
    for key in data:
        if key not in existing and key != "Student_ID":
            cursor.execute(f"ALTER TABLE students ADD COLUMN `{key}` VARCHAR(255)")

    cols = ", ".join(f"`{k}`" for k in data)
    vals = ", ".join(["%s"] * len(data))
    update = ", ".join(f"`{k}`=VALUES(`{k}`)" for k in data if k != "Student_ID")

    cursor.execute(f"INSERT INTO students ({cols}) VALUES ({vals}) ON DUPLICATE KEY UPDATE {update}", tuple(data.values()))
    db.commit()
    cursor.close()
    db.close()


def insert_data_into_mysql(df, table_name):
    db = mysql.connector.connect(host="localhost", user="root", passwd="SeniorProject25", database="student")
    cursor = db.cursor()

    cursor.execute(f"SHOW COLUMNS FROM `{table_name}`")
    existing = {row[0] for row in cursor.fetchall()}
    for col in df.columns:
        if col not in existing:
            cursor.execute(f"ALTER TABLE `{table_name}` ADD COLUMN `{col}` VARCHAR(255)")

    cols = ", ".join([f"`{col}`" for col in df.columns])
    placeholders = ", ".join(["%s"] * len(df.columns))
    update = ", ".join([f"`{col}`=VALUES(`{col}`)" for col in df.columns if col != 'Student_ID'])

    insert_query = f"INSERT INTO `{table_name}` ({cols}) VALUES ({placeholders}) ON DUPLICATE KEY UPDATE {update}"
    for _, row in df.iterrows():
        cursor.execute(insert_query, tuple(row[col] for col in df.columns))

    db.commit()
    cursor.close()
    db.close()


def create_database_if_not_exists(db_name):
    db = mysql.connector.connect(host="localhost", user="root", passwd="SeniorProject25")
    cursor = db.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
    cursor.execute(f"USE {db_name}")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            Student_ID BIGINT PRIMARY KEY
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS courses (
            Course_Number INT PRIMARY KEY,
            Course_Name VARCHAR(255),
            Department VARCHAR(255),
            Professor_Name VARCHAR(255),
            Semester VARCHAR(50),
            Credits INT,
            Course_Description TEXT,
            Keywords TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS assigned_grader (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id BIGINT,
            course_number INT,
            UNIQUE(student_id, course_number)
        )
    """)
    cursor.close()
    db.close()
