import sqlite3
con3 = sqlite3.connect("db1.db")

con3.execute("ATTACH 'db2.db' as db2")

con3.execute("BEGIN")
for row in con3.execute("SELECT * FROM db2.sqlite_master WHERE type='table'"):
    combine = "INSERT INTO "+ row[1] + " SELECT * FROM db2." + row[1]
    print(combine)
    con3.execute(combine)
con3.commit()
con3.execute("detach database db2")
