import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from nltk.stem import PorterStemmer
import string

# Local stopwords list
basic_stopwords = set("""
a about above after again against all am an and any are as at be because been before
being below between both but by could did do does doing down during each few for from
further had has have having he her here hers herself him himself his how i if in into
is it its itself just me more most my myself no nor not of off on once only or other
our ours ourselves out over own same she should so some such than that the their theirs
them themselves then there these they this those through to too under until up very was
we were what when where which while who whom why will with you your yours yourself yourselves
""".split())

# Preprocessing function
def preprocess(text):
    if pd.isna(text) or str(text).strip() == "":
        return ""
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    tokens = text.split()
    tokens = [word for word in tokens if word not in basic_stopwords]
    stemmer = PorterStemmer()
    tokens = [stemmer.stem(word) for word in tokens]
    return ' '.join(tokens)

# Load Excel file
file_path = 'Exported_Data.xlsx'
xls = pd.ExcelFile(file_path)
df_courses = xls.parse('Courses')
df_candidates = xls.parse('Candidates')

# Preprocess course and candidate texts
df_courses['text'] = df_courses['Course_Description'].fillna(df_courses['Keywords']).apply(preprocess)
df_candidates['text'] = df_candidates['Skills'].fillna("").apply(preprocess)

# Separate candidates with and without skills
candidates_with_skills = df_candidates[df_candidates['text'].str.strip() != ""].copy()
candidates_without_skills = df_candidates[df_candidates['text'].str.strip() == ""].copy()

# TF-IDF and similarity for those with skills
vectorizer = TfidfVectorizer()
course_texts = df_courses['text'].tolist()
candidate_texts = candidates_with_skills['text'].tolist()
tfidf_matrix = vectorizer.fit_transform(course_texts + candidate_texts)
course_tfidf = tfidf_matrix[:len(course_texts)]
candidate_tfidf = tfidf_matrix[len(course_texts):]
similarity_scores = cosine_similarity(candidate_tfidf, course_tfidf)

# Assign best-matching course
best_course_indices = similarity_scores.argmax(axis=1)
candidates_with_skills['Best_Matching_Course'] = df_courses.loc[best_course_indices, 'Course_Name'].values

# For candidates without skills, leave the course field blank
candidates_without_skills['Best_Matching_Course'] = None

# Combine both groups
all_candidates = pd.concat([candidates_with_skills, candidates_without_skills], ignore_index=True)

# Get top 4 (preserving original order)
top_4 = all_candidates.head(4)

# Select final columns
final_output = top_4[[
    'Student_First_Name', 'Student_Last_Name', 'Student_Email', 'Skills', 'Best_Matching_Course'
]]

# Save to Excel
output_file = 'Matched_Candidates.xlsx'
final_output.to_excel(output_file, index=False)
print(f" Final output saved to {output_file}")
