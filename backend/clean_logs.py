import re

with open("app/api/v1/logs.py", "r") as f:
    text = f.read()

# Fix missing column defaults natively!
text = text.replace("df['window'] = df['timestamp_ms'].dt.floor('60s')", "if 'host' not in df.columns:\n            df['host'] = 'unknown-host'\n        df['window'] = df['timestamp_ms'].dt.floor('60s')")

with open("app/api/v1/logs.py", "w") as f:
    f.write(text)
