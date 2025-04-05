import mysql.connector
from mysql.connector import Error
import pandas as pd
import numpy as np
import os
import configparser

def init_datamodule(config_path):
    """Reads configuration file and initializes ConfigObject"""
    config = configparser.ConfigParser()
    config.read(config_path)

    try:
        host = config.get('DATABASE', 'host').strip()
        user = config.get('DATABASE', 'user').strip()
        password = config.get('DATABASE', 'password').strip()
        database = config.get('DATABASE', 'database').strip()
        file_path = config.get('FILES', 'student_file_path').strip()
    except (configparser.NoSectionError, configparser.NoOptionError) as e:
        print("Configuration error:", e)
        return None

    return ConfigObject(host, user, password, database, file_path)

class ConfigObject:
    def __init__(self, host, user, password, database, file_path):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.file_path = file_path

def excel_db(student_filepath):
    config = init_datamodule(os.path.join(student_filepath, 'config_file.config'))
    if config is None:
        print("Failed to load configuration. Check config file.")
        return

    f_studfile = os.path.join(config.file_path, 'Student.xlsx')

    try:
        db = mysql.connector.connect(
            host=config.host,
            user=config.user,
            passwd=config.password,
            database=config.database
        )
        cursor = db.cursor()

        df1 = pd.read_excel(f_studfile)
        df1.columns = [col.replace(" ", "_") for col in df1.columns]
        df1 = df1.replace({np.nan: None})

        table_name = "students1"
        create_table_query = f"""
        CREATE TABLE IF NOT EXISTS `{table_name}` (
            Student_ID INT PRIMARY KEY,
            {", ".join([f"`{col}` VARCHAR(255)" for col in df1.columns if col != 'Student_ID'])},
            UNIQUE KEY unique_student (Student_ID, Student_First_Name, Student_Last_Name, Student_Email)
        )
        """
        cursor.execute(create_table_query)

        columns = ", ".join([f"`{col}`" for col in df1.columns])
        placeholders = ", ".join(["%s"] * len(df1.columns))
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

        for _, row in df1.iterrows():
            cursor.execute(insert_query, tuple(row[col] for col in df1.columns))

        db.commit()
        print(f"Data successfully inserted into `{table_name}` table.")

    except Error as e:
        print("Error while inserting:", e)

    finally:
        cursor.close()
        db.close()

def table_excel(table):
    config = init_datamodule(os.path.join(os.getcwd(), 'config_file.config'))
    if config is None:
        print("Failed to load configuration. Check config file.")
        return

    try:
        with mysql.connector.connect(
            host=config.host,
            user=config.user,
            passwd=config.password,
            database=config.database
        ) as db:
            with db.cursor() as mycursor:
                query = f"SELECT * FROM `{table}`"
                mycursor.execute(query)
                columns = [column[0] for column in mycursor.description]
                data = mycursor.fetchall()

        df = pd.DataFrame(data, columns=columns)
        os.makedirs(config.file_path, exist_ok=True)
        output_path = os.path.join(config.file_path, 'Spring-25_Assignment.xlsx')
        df.to_excel(output_path, index=False)

        print(f"Data successfully saved to {output_path}")
        return df

    except mysql.connector.Error as err:
        print(f"Database error: {err}")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    student_filepath = input("Enter path to student file: ").strip()
    excel_db(student_filepath)

    db_table = "students1"
    table_excel(db_table)
