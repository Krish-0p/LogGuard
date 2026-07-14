import asyncio
from sqlalchemy import text
from app.db.postgres import async_session

async def test():
    async with async_session() as db:
        try:
            await db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT"))
            await db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password TEXT"))
            
            result = await db.execute(text("SELECT id FROM tenants LIMIT 1"))
            tenant = result.mappings().first()
            if not tenant:
                res_tenant = await db.execute(text("INSERT INTO tenants (name) VALUES ('Default') RETURNING id"))
                tenant_id = res_tenant.scalar()
            else:
                tenant_id = tenant['id']
            
            # Delete if exists
            await db.execute(text("DELETE FROM users WHERE email = 'testzz@test.com'"))
            
            res_new_user = await db.execute(
                text("""
                INSERT INTO users (tenant_id, email, role, hashed_password, name)
                VALUES (:tenant_id, :email, 'admin', 'fakehash', 'Test Name')
                RETURNING id, email, role, name
                """),
                {"tenant_id": tenant_id, "email": "testzz@test.com"}
            )
            print(res_new_user.mappings().first())
            await db.commit()
            print("SUCCESS")
        except Exception as e:
            print("ERROR", repr(e))

asyncio.run(test())
