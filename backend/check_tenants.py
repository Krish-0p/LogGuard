import asyncio
from app.db.postgres import async_session
from sqlalchemy import text

async def fix():
    async with async_session() as db:
        res = await db.execute(text("SELECT COUNT(*) as c FROM anomaly_scores WHERE tenant_id = 'tenant-xyz'"))
        row = res.mappings().first()
        print("Rows with tenant-xyz:", row["c"])

        res2 = await db.execute(text("SELECT COUNT(*) as c FROM anomaly_scores WHERE tenant_id = 'fda5918c-41a1-4638-9eb2-7e303b98a46c'"))
        row2 = res2.mappings().first()
        print("Rows with correct UUID:", row2["c"])

asyncio.run(fix())
