import pytest
import asyncio
from testcontainers.kafka import KafkaContainer
from testcontainers.redis import RedisContainer
from testcontainers.postgres import PostgresContainer

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def kafka_container():
    with KafkaContainer() as kafka:
        yield kafka.get_bootstrap_server()

@pytest.fixture(scope="session")
async def redis_container():
    with RedisContainer() as redis:
        yield redis.get_connection_url()
