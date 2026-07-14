import json

def patch_logs_file():
    with open("backend/app/api/v1/logs.py", "r") as f:
        content = f.read()

    insertion = """
from fastapi import UploadFile, File
import pandas as pd
import io
import time
import uuid
import uuid
import json
import logging
from aiokafka import AIOKafkaProducer

logger = logging.getLogger(__name__)

async def get_kafka_producer():
    producer = AIOKafkaProducer(
        bootstrap_servers=settings.kafka_broker,
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    await producer.start()
    return producer

@router.post("/upload-csv")
async def upload_log_csv(
    file: UploadFile = File(...),
    tenant_id: str = Depends(get_current_tenant)
):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        producer = await get_kafka_producer()
        
        count = 0
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
            }
            
            await producer.send_and_wait("raw-logs", value=log_entry)
            count += 1
            
        await producer.stop()
        return {"status": "success", "message": f"Successfully published {count} logs to the pipeline."}
    except Exception as e:
        logger.error(f"Error processing CSV upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))
"""

    with open("backend/app/api/v1/logs.py", "w") as f:
        f.write(content + insertion)

patch_logs_file()
