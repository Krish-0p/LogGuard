with open("app/api/v1/logs.py", "r") as f:
    text = f.read()

text = text.replace("df.set_index('timestamp', inplace=True)", "df.set_index('timestamp', inplace=True)\n        df.sort_index(inplace=True)")

with open("app/api/v1/logs.py", "w") as f:
    f.write(text)
