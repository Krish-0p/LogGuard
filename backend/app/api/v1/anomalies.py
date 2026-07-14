from fastapi import APIRouter, Query, Depends, HTTPException
from datetime import datetime, timedelta, timezone
from typing import Optional
from app.db.timescale import get_anomalies, get_anomaly_timeline, get_host_stats
from app.core.rca import RootCauseAnalyzer
from app.api.deps import get_current_tenant

router = APIRouter()
rca_engine = RootCauseAnalyzer()

@router.get("/")
async def list_anomalies(
    host: Optional[str] = None,
    from_time: Optional[datetime] = None,
    to_time: Optional[datetime] = None,
    min_score: float = Query(default=0.70, ge=0.0, le=1.0),
    limit: int = Query(default=50, le=500),
    tenant_id: str = Depends(get_current_tenant)
):
    """
    List detected anomalies with optional filters.
    Used by dashboard anomaly table.
    """
    if from_time is None:
        from_time = datetime.now(timezone.utc) - timedelta(hours=24)
    if to_time is None:
        to_time = datetime.now(timezone.utc)
    
    anomalies = await get_anomalies(
        tenant_id=tenant_id,
        host=host,
        from_time=from_time,
        to_time=to_time,
        min_score=min_score,
        limit=limit
    )
    
    return {"anomalies": anomalies, "count": len(anomalies)}


@router.get("/timeline")
async def anomaly_timeline(
    host: Optional[str] = None,
    bucket_minutes: int = Query(default=5, ge=1, le=60),
    hours_back: int = Query(default=24, ge=1, le=168),
    tenant_id: str = Depends(get_current_tenant)
):
    """
    Time-series data for the anomaly score chart.
    Returns bucketed average scores per host over time.
    """
    from_time = datetime.now(timezone.utc) - timedelta(hours=hours_back)
    
    data = await get_anomaly_timeline(
        tenant_id=tenant_id,
        host=host,
        from_time=from_time,
        bucket_minutes=bucket_minutes
    )
    
    return {"timeline": data, "bucket_minutes": bucket_minutes}


@router.get("/{anomaly_id}/rca")
async def get_root_cause_analysis(
    anomaly_id: int,
    tenant_id: str = Depends(get_current_tenant)
):
    """
    Auto-generate Root Cause Analysis for a specific anomaly.
    Queries Elasticsearch for unusual log patterns around the anomaly time.
    """
    # Fetch anomaly details
    anomaly = await get_anomalies(
        tenant_id=tenant_id,
        anomaly_id=anomaly_id,
        limit=1
    )
    
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    
    anomaly = anomaly[0]
    rca_result = await rca_engine.analyze(
        host=anomaly["host"],
        tenant_id=tenant_id,
        anomaly_time=anomaly["scored_at"],
        window_minutes=5
    )
    
    return {"anomaly_id": anomaly_id, "rca": rca_result}
