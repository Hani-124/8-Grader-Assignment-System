from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import mysql.connector
import re
import time

# ✅ MySQL connection setup
conn = mysql.connector.connect(
    host="localhost",
    user="root",         # ← your MySQL username
    password="admin",    # ← your MySQL password
    database="gasdatabase"
)
cursor = conn.cursor()

# ✅ Drop and recreate the table (includes course_level column)
cursor.execute("DROP TABLE IF EXISTS cs_courses")
cursor.execute("""
    CREATE TABLE cs_courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_code VARCHAR(20) UNIQUE,
        course_title TEXT,
        keywords TEXT,
        course_level VARCHAR(20)
    )
""")
conn.commit()
print("🧹 Reset cs_courses table.\n")

# ✅ Keyword extraction with full cleanup
def extract_keywords(text):
    text = text.lower()

    # 🔥 Remove parenthetical admin notes
    text = re.sub(r'\([^)]*(semester credit hours|same as|cross-listed|corequisite|prerequisite)[^)]*\)', '', text)
    text = re.sub(r'\(\d+-\d+\)', '', text)
    text = re.sub(r'\(\d+ semester credit hours\)', '', text)

    # 🔥 All admin/registration fluff
    admin_phrases = [
        r'\d+ semester credit hour[s]?',
        r'lab fee.*?required',
        r'credit cannot be received.*?\.',
        r'may not be used.*?\.',
        r'(pre|co)requisite[s]?:?.*?\.',
        r'note that.*?\.',
        r'same as .*?\.',
        r'cross-listed.*?\.',
        r'repeatable for credit.*?\.',
        r'school of engineering and computer science',
        r'this class is open to students.*?only',
        r'a grade of [a-z] or better in .*? is required.*?\.',
        r'students will also be registered for an exam section.*?\.',
        r'students will be required to participate.*?\.',
        r'during the course.*?\.',
        r'this class is restricted to .*?\.',
        r'satisfy.*?requirement[s]?.*?\.',
        r'requirement[s]? for.*?\.',
        r'the class is open to students in .*? only',
        r'a grade of .*? is required to register for .*?\.',
        r'students will also be registered for .*?\.',
        r'additional preparatory topics for .*? majors',
        r'or can substitute for this course.*?\.',
        r'may substitute for this course.*?\.',
        r'or .*? may substitute for .*?\.',
        r'this course can substitute for .*?\.',
    ]
    for pattern in admin_phrases:
        text = re.sub(pattern, '', text)

    # 🔥 Remove course codes like cs1334, ce3354, se 3354, etc.
    text = re.sub(r'\b[a-z]{2,4}\s?\d{4}\b', '', text)

    # ✅ Cleanup
    text = re.sub(r'\(\s*\)', '', text)
    text = re.sub(r'\.\s*\.', '.', text)
    text = re.sub(r'\s+', ' ', text).strip()

    # ✅ Extract meaningful phrases
    return [t.strip() for t in text.split('.') if len(t.strip().split()) > 2]

# ✅ Selenium setup
options = Options()
options.add_argument("--start-maximized")
# options.add_argument("--headless")  # Optional

driver = webdriver.Chrome(options=options)

# ✅ URLs to process
urls = {
    "Undergraduate": "https://catalog.utdallas.edu/2024/undergraduate/courses/cs",
    "Graduate": "https://catalog.utdallas.edu/2024/graduate/courses/cs"
}

for level, url in urls.items():
    print(f"\n🌐 Processing {level} courses...")
    driver.get(url)

    WebDriverWait(driver, 15).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "article.page-body p[id^='cs']"))
    )

    courses = driver.find_elements(By.CSS_SELECTOR, "article.page-body p[id^='cs']")
    print(f"🔍 Found {len(courses)} {level} course blocks")

    for course in courses:
        try:
            course_code = course.find_element(By.CLASS_NAME, "course_address").text.strip()
            course_title = course.find_element(By.CLASS_NAME, "course_title").text.strip()
            full_text = course.text.strip()
        except Exception as e:
            print("⚠️ Skipping course block due to parsing error:", e)
            continue

        # Remove code/title/hours from description
        description = full_text
        for part in [course_code, course_title]:
            description = description.replace(part, "")
        description = re.sub(r'\(\d+ semester credit hours\)', '', description).strip()

        print(f"\n📘 {course_code} - {course_title} ({level})")

        keyword_phrases = extract_keywords(description)
        if not keyword_phrases:
            print("⚠️ No keywords found.")
            continue

        keywords_combined = ' || '.join(keyword_phrases)
        print(f"📥 Inserting → {keywords_combined[:80]}...")

        try:
            cursor.execute(
                "INSERT INTO cs_courses (course_code, course_title, keywords, course_level) VALUES (%s, %s, %s, %s)",
                (course_code, course_title, keywords_combined, level)
            )
        except mysql.connector.IntegrityError:
            print(f"⚠️ Skipped duplicate course: {course_code}")

# ✅ Save HTML for review
with open("selenium_output.html", "w", encoding="utf-8") as f:
    f.write(driver.page_source)

# ✅ Done
conn.commit()
cursor.close()
conn.close()
driver.quit()

print("\n✅ All course keywords inserted from both undergrad and graduate pages.")
