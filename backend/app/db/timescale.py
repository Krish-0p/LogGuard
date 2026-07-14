import asyncpg
import json
from datetime import datetime
from typing import List, Optional, Dict
from app.config import get_settings

settings = get_settings()

class TimescalePool:
    def __init__(self):
        self.pool = None

    async def connect(self):
        """Initialize the connection pool to TimescaleDB."""
        self.pool = await asyncpg.create_pool(dsn=settings.timescale_url)

    async def disconnect(self):
        """Close the pool."""
        if self.pool:
            await self.pool.close()

# Global pool instance used in main.py
timescale_pool = TimescalePool()

async def save_anomaly_score(record: dict) -> int:
    """Persists a new anomaly score from the Inference Service."""
    query = """
        INSERT INTO anomaly_scores (
            scored_at, host, tenant_id, final_score, if_score, 
            lstm_score, is_anomaly, log_volume, error_rate, 
            feature_window_start, feature_window_end, log_text, log_problem
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id;
    """
    async with timescale_pool.pool.acquire() as conn:
        anomaly_id = await conn.fetchval(
            query,
            datetime.fromisoformat(record["scored_at"]),
            record["host"],
            record["tenant_id"],
            record["final_score"],
            record["if_score"],
            record["lstm_score"],
            record["is_anomaly"],
            record["log_volume"],
            record["error_rate"],
            datetime.fromtimestamp(record["feature_window_start"]) if record.get("feature_window_start") else None,
            datetime.fromtimestamp(record["feature_window_end"]) if record.get("feature_window_end") else None,
            record.get("log_text"),
            record.get("log_problem")
        )
        return anomaly_id

async def get_anomalies(
    tenant_id: str, 
    host: Optional[str] = None, 
    from_time: Optional[datetime] = None, 
    to_time: Optional[datetime] = None,
    min_score: float = 0.7, 
    limit: int = 50,
    anomaly_id: Optional[int] = None
) -> List[Dict]:
    """Retrieves anomaly events for the dashboard table."""
    query = "SELECT * FROM anomaly_scores WHERE tenant_id = $1"
    args = [tenant_id]
    
    if anomaly_id is not None:
        query += f" AND id = ${len(args) + 1}"
        args.append(anomaly_id)
    else:
        query += f" AND final_score >= ${len(args) + 1}"
        args.append(min_score)

        if host:
            query += f" AND host = ${len(args) + 1}"
            args.append(host)
        
        if from_time:
            query += f" AND scored_at >= ${len(args) + 1}"
            args.append(from_time)
            
        if to_time:
            query += f" AND scored_at <= ${len(args) + 1}"
            args.append(to_time)
    
    query += f" ORDER BY scored_at DESC LIMIT ${len(args) + 1}"
    args.append(limit)
    
    async with timescale_pool.pool.acquire() as conn:
        rows = await conn.fetch(query, *args)
        # Convert datetime objects to ISO format strings for JSON serialization
        results = []
        for r in rows:
            row_dict = dict(r)
            if isinstance(row_dict.get("scored_at"), datetime):
                row_dict["scored_at"] = row_dict["scored_at"].isoformat()
            if isinstance(row_dict.get("feature_window_start"), datetime):
                row_dict["feature_window_start"] = row_dict["feature_window_start"].isoformat()
            if isinstance(row_dict.get("feature_window_end"), datetime):
                row_dict["feature_window_end"] = row_dict["feature_window_end"].isoformat()
            results.append(row_dict)
        return results

async def get_anomaly_timeline(tenant_id: str, host: Optional[str], from_time: datetime, bucket_minutes: int):
    """Retrieves bucketed data for the dashboard charts."""
    args = [tenant_id, from_time]
    query = f"""
        SELECT time_bucket('{bucket_minutes} minutes', scored_at) AS bucket,
               AVG(final_score) AS avg_score,
               MAX(final_score) AS max_score,
               COUNT(*) as window_count,
               SUM(CASE WHEN is_anomaly THEN 1 ELSE 0 END) as anomaly_count
        FROM anomaly_scores
        WHERE tenant_id = $1 AND scored_at >= $2
    """
    if host:
        query += " AND host = $3"
        args.append(host)
        
    query += " GROUP BY bucket ORDER BY bucket ASC;"
    
    async with timescale_pool.pool.acquire() as conn:
        rows = await conn.fetch(query, *args)
        results = []
        for r in rows:
            row_dict = dict(r)
            if isinstance(row_dict.get("bucket"), datetime):
                row_dict["bucket"] = row_dict["bucket"].isoformat()
            results.append(row_dict)
        return results

async def get_host_stats(tenant_id: str):
    """Gets current status for all monitored hosts."""
    query = """
        SELECT host, MAX(scored_at) as last_seen, AVG(final_score) as avg_health
        FROM anomaly_scores
        WHERE tenant_id = $1 AND scored_at > NOW() - INTERVAL '1 hour'
        GROUP BY host;
    """
    async with timescale_pool.pool.acquire() as conn:
        rows = await conn.fetch(query, tenant_id)
        return [dict(r) for r in rows]
        return [dict(r) for r in rows]