import mysql.connector
import pandas as pd
import numpy as np

# Connect to MySQL
db = mysql.connector.connect(
    host="localhost",
    user="root", 
    passwd="Havishchaganti@2002",
    database="student1"
)

cursor = db.cursor()

# Load Excel Data
df = pd.read_excel('C:\\Users\\havis\\OneDrive\\Documents\\Documents\\Havish UTD\\Senior Second Semester\\CS 4485\\Student.xlsx')
print(df)

# Clean column names (replace spaces with underscores)
df.columns = [col.replace(" ", "_") for col in df.columns]

# Replace NaN values with None (for SQL NULL values)
df = df.replace({np.nan: None})

# Define table name
table_name = "students"

# Ensure table exists and create it if not
create_table_query = f"""
CREATE TABLE IF NOT EXISTS `{table_name}` (
    Student_ID INT PRIMARY KEY,
    {", ".join([f"`{col}` VARCHAR(255)" for col in df.columns if col != 'Student_ID'])},
    UNIQUE KEY unique_student (Student_ID, Student_First_Name, Student_Last_Name, Student_Email)
)
"""
cursor.execute(create_table_query)

# Insert data into MySQL table while avoiding duplicates
columns = ", ".join([f"`{col}`" for col in df.columns])
placeholders = ", ".join(["%s"] * len(df.columns))
insert_query = f"""
INSERT INTO `{table_name}` ({columns}) 
VALUES ({placeholders}) 
ON DUPLICATE KEY UPDATE 
    Student_Email = VALUES(Student_Email), 
    Current_Qualification = VALUES(Current_Qualification),
    Contact = VALUES(Contact),
    Address = VALUES(Address),
    Student_School_Year_Name = VALUES(Student_School_Year_Name),
    Student_School = VALUES(Student_School),
    Student_Primary_College = VALUES(Student_Primary_College),
    Student_Graduation_Date = VALUES(Student_Graduation_Date),
    Majors = VALUES(Majors)
"""

for _, row in df.iterrows():
    cursor.execute(insert_query, tuple(row[col] for col in df.columns))

db.commit()

print(f"Data successfully inserted into `{table_name}` table with correct Student_ID values.")

# Close the connection
cursor.close()
db.close()
