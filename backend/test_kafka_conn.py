import asyncio
import json
from aiokafka import AIOKafkaProducer

async def test_conn():
    print("Testing connection...")
    producer = AIOKafkaProducer(
        bootstrap_servers="localhost:9092",
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    try:
        print("Starting producer...")
        await producer.start()
        print("Producer started. Sending message...")
        await producer.send_and_wait("raw-logs", {"test": "hello"})
        print("Message sent! Stopping producer...")
        await producer.stop()
        print("Done.")
    except Exception as e:
        print("ERROR:", e)

asyncio.run(test_conn())
