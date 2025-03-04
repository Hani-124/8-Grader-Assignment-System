import mysql.connector
import pandas as pd 

db = mysql.connector.connect(
    host="localhost",
    user="root", 
    passwd="Havishchaganti@2002",
    database = "student"
    )

mycursor = db.cursor()

#mycursor.execute("CREATE TABLE Person (Name VARCHAR(50), Age smallint Unsigned, StudentID int PRIMARY KEY AUTO_INCREMENT)")

mycursor.execute("INSERT INTO Person (Name, Age, StudentID) VALUES ('Havish Chaganti', 22, 1001), ('Sanved Paladhi', 21, 1002)")

mycursor.execute("SELECT * FROM Person")

data = mycursor.fetchall();

columns = [column[0] for column in mycursor.description]

df = pd.DataFrame(data, columns=columns)

print(df)

df.to_csv('person_data.csv', index=False)  

print("Data exported to person_data.csv")
