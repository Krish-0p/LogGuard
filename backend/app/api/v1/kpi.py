from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.db.postgres import get_db_session
from app.api.deps import get_current_tenant
import logging

router = APIRouter()
logger = logging.getLogger("logguard.kpi")

@router.get("/dashboard")
async def get_kpi_dashboard(
    tenant_id: str = Depends(get_current_tenant),
    days_back: int = 7
):
    """
    Returns KPI dashboard metrics:
    - Total Anomalies
    - Top Error Types
    - System Health Score
    """
    db = await get_db_session()
    
    # 1. Total Anomalies
    total_anomalies_record = await db.fetchrow("""
        SELECT COUNT(*) as total
        FROM anomaly_scores
        WHERE tenant_id = $1 AND is_anomaly = TRUE AND scored_at >= NOW() - INTERVAL '1 day' * $2
    """, tenant_id, days_back)
    total_anomalies = total_anomalies_record['total'] if total_anomalies_record else 0

    # 2. Top Error Types (using log_problem/anomaly_type as a proxy for Drain3 templates)
    top_errors_records = await db.fetch("""
        SELECT log_problem, COUNT(*) as frequency
        FROM anomaly_scores
        WHERE tenant_id = $1 AND is_anomaly = TRUE AND log_problem IS NOT NULL AND scored_at >= NOW() - INTERVAL '1 day' * $2
        GROUP BY log_problem
        ORDER BY frequency DESC
        LIMIT 5
    """, tenant_id, days_back)
    top_errors = [{"error": r["log_problem"], "count": r["frequency"]} for r in top_errors_records]

    # 3. System Health Score (100 - anomaly_rate * factor)
    # Simple heuristic for health score
    total_logs_record = await db.fetchrow("""
        SELECT COUNT(*) as total
        FROM anomaly_scores
        WHERE tenant_id = $1 AND scored_at >= NOW() - INTERVAL '1 day' * $2
    """, tenant_id, days_back)
    total_logs = total_logs_record['total'] if total_logs_record else 0
    
    health_score = 100
    if total_logs > 0:
        anomaly_rate = total_anomalies / total_logs
        health_score = max(0, 100 - (anomaly_rate * 1000)) # Scale anomaly rate down

    return {
        "metrics": {
            "total_anomalies": total_anomalies,
            "top_errors": top_errors,
            "system_health": round(health_score, 1)
        }
    }
