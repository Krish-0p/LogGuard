import asyncio
from app.api.v1.auth import signup, SignupRequest
from fastapi import HTTPException
import traceback

async def main():
    try:
        req = SignupRequest(name="Krisss", email="mytest2@test.com", password="123456", otp="111111")
        
        # mock otp manually because it will fail validation otherwise
        from app.db.redis_client import redis_client
        await redis_client.connect()
        await redis_client.setex("otp:mytest2@test.com", 600, "111111")
        
        res = await signup(req)
        print("SUCCESS:", res)
    except HTTPException as he:
        print("HTTP EXCEPTION:", he.detail)
    except Exception as e:
        print("ERROR THROWN!")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
