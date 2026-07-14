from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import text
from app.config import get_settings

settings = get_settings()

# Async engine for PostgreSQL (Application Metadata)
postgres_engine = create_async_engine(settings.postgres_url)
async_session = sessionmaker(
    postgres_engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

Base = declarative_base()

async def get_db_session():
    """Dependency for FastAPI endpoints to get a DB session."""
    async with async_session() as session:
        yield session

async def get_alert_rules(tenant_id: str, is_active: bool = True):
    """
    Fetches active alert rules for a specific tenant.
    Used by the Alerting Engine to evaluate anomalies.
    """
    async with async_session() as session:
        query = text("""
            SELECT id, name, host_pattern, score_threshold, 
                   severity, notifier_type, notifier_config, cooldown_minutes
            FROM alert_rules
            WHERE tenant_id = :tenant_id AND is_active = :is_active
        """)
        result = await session.execute(
            query, 
            {"tenant_id": tenant_id, "is_active": is_active}
        )
        # Convert rows to a list of dictionaries
        return [dict(row._mapping) for row in result]