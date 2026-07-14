import asyncio
from app.db.timescale import timescale_pool

async def main():
    await timescale_pool.connect()
    async with timescale_pool.pool.acquire() as conn:
        print(await conn.fetch("SELECT COUNT(*) FROM anomaly_scores;"))
        print(await conn.fetch("SELECT * FROM anomaly_scores ORDER BY scored_at DESC LIMIT 1;"))
    await timescale_pool.disconnect()

asyncio.run(main())
