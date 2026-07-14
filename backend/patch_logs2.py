with open("backend/app/api/v1/logs.py", "r") as f:
    text = f.read()

# Replace parsing logic to properly handle na
old_loop = """        count = 0
        for index, row in df.iterrows():
            timestamp_ms = int(time.time() * 1000)
            if 'timestamp' in row and pd.notna(row['timestamp']):
                try:
                    timestamp_ms = int(pd.to_datetime(row['timestamp']).timestamp() * 1000)
                except:
                    pass
            
            log_entry = {
                "log_id": str(uuid.uuid4()),
                "timestamp": timestamp_ms,
                "host": row.get('host', 'unknown-host'),
                "source": row.get('source', 'csv-upload'),
                "severity": row.get('severity', 'INFO').upper() if pd.notna(row.get('severity')) else 'INFO',
                "raw_message": str(row.get('raw_message', row.get('message', ''))),
                "service_name": row.get('service_name', None),
                "container_id": row.get('container_id', None),
                "tenant_id": tenant_id
            }"""

new_loop = """        count = 0
        df = df.where(pd.notnull(df), None) # Replace NaN with None
        for index, row in df.iterrows():
            row_dict = row.to_dict()
            timestamp_ms = int(time.time() * 1000)
            if row_dict.get('timestamp') is not None:
                try:
                    timestamp_ms = int(pd.to_datetime(row_dict['timestamp']).timestamp() * 1000)
                except:
                    pass
            
            log_entry = {
                "log_id": str(uuid.uuid4()),
                "timestamp": timestamp_ms,
                "host": row_dict.get('host') or 'unknown-host',
                "source": row_dict.get('source') or 'csv-upload',
                "severity": (row_dict.get('severity') or 'INFO').upper(),
                "raw_message": str(row_dict.get('raw_message') or row_dict.get('message') or ''),
                "service_name": row_dict.get('service_name'),
                "container_id": row_dict.get('container_id'),
                "tenant_id": tenant_id
            }"""

text = text.replace(old_loop, new_loop)

with open("backend/app/api/v1/logs.py", "w") as f:
    f.write(text)
