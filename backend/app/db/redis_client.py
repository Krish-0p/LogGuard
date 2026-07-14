import redis.asyncio as redis
from app.config import get_settings

settings = get_settings()

class RedisWrapper:
    def __init__(self):
        self.client = None

    async def connect(self):
        self.client = redis.from_url(settings.redis_url, decode_responses=True)
        print("✅ Connected to Redis")

    async def disconnect(self):
        if self.client:
            await self.client.close()

    async def get(self, key):
        return await self.client.get(key)
        
    async def setex(self, key, time, value):
        return await self.client.setex(key, time, value)

redis_client = RedisWrapper()
