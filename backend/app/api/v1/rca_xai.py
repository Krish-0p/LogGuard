from fastapi import APIRouter, Depends, HTTPException, Query
from app.db.timescale import timescale_pool
from app.api.deps import get_current_tenant
from datetime import datetime, timedelta, timezone
from typing import Optional
import logging
import json

router = APIRouter()
logger = logging.getLogger("logguard.rca_xai")


@router.get("/summary")
async def rca_summary(
    hours_back: int = Query(default=24, ge=1, le=168),
    tenant_id: str = Depends(get_current_tenant)
):
    """
    Aggregated Root Cause Analysis summary.
    Groups all anomalies by their root cause pattern (log_problem),
    providing a consolidated incident report for network admins.
    """
    async with timescale_pool.pool.acquire() as conn:
        from_time = datetime.now(timezone.utc) - timedelta(hours=hours_back)

        # 1. Get incident groups (anomalies grouped by root cause pattern)
        incident_groups = await conn.fetch("""
            SELECT 
                log_problem,
                COUNT(*) as occurrence_count,
                MIN(scored_at) as first_seen,
                MAX(scored_at) as last_seen,
                AVG(final_score) as avg_score,
                MAX(final_score) as max_score,
                array_agg(DISTINCT host) as affected_hosts
            FROM anomaly_scores
            WHERE tenant_id = $1 
              AND scored_at >= $2
              AND is_anomaly = True
              AND log_problem IS NOT NULL AND log_problem != ''
            GROUP BY log_problem
            ORDER BY MAX(scored_at) DESC
        """, tenant_id, from_time)

        incidents = []
        for g in incident_groups:
            # Fetch sample logs for this incident group
            sample_logs = await conn.fetch("""
                SELECT id, scored_at, host, final_score, log_text, log_problem,
                       error_rate, log_volume
                FROM anomaly_scores
                WHERE tenant_id = $1
                  AND scored_at >= $2
                  AND is_anomaly = True
                  AND log_problem = $3
                ORDER BY scored_at DESC
                LIMIT 10
            """, tenant_id, from_time, g["log_problem"])

            log_entries = [{
                "id": r["id"],
                "timestamp": r["scored_at"].isoformat(),
                "host": r["host"],
                "score": round(float(r["final_score"]), 4),
                "log_text": r["log_text"],
                "error_rate": round(float(r["error_rate"] or 0), 4),
                "log_volume": r["log_volume"]
            } for r in sample_logs]

            # Determine severity
            max_s = float(g["max_score"] or 0)
            severity = "critical" if max_s > 0.8 else "warning" if max_s > 0.5 else "info"

            incidents.append({
                "root_cause": g["log_problem"],
                "occurrence_count": g["occurrence_count"],
                "first_seen": g["first_seen"].isoformat(),
                "last_seen": g["last_seen"].isoformat(),
                "avg_score": round(float(g["avg_score"] or 0), 4),
                "max_score": round(max_s, 4),
                "severity": severity,
                "affected_hosts": list(g["affected_hosts"]) if g["affected_hosts"] else [],
                "sample_logs": log_entries
            })

        # 2. Overall stats
        stats = await conn.fetchrow("""
            SELECT 
                COUNT(*) as total_anomalies,
                COUNT(DISTINCT host) as affected_host_count,
                AVG(final_score) as overall_avg_score,
                MAX(final_score) as peak_score,
                MIN(scored_at) as earliest,
                MAX(scored_at) as latest
            FROM anomaly_scores
            WHERE tenant_id = $1
              AND scored_at >= $2
              AND is_anomaly = True
        """, tenant_id, from_time)

        overview = {
            "total_anomalies": stats["total_anomalies"] or 0,
            "unique_incidents": len(incidents),
            "affected_hosts": stats["affected_host_count"] or 0,
            "overall_avg_score": round(float(stats["overall_avg_score"] or 0), 4),
            "peak_score": round(float(stats["peak_score"] or 0), 4),
            "time_range": {
                "from": stats["earliest"].isoformat() if stats["earliest"] else None,
                "to": stats["latest"].isoformat() if stats["latest"] else None
            }
        }

        return {
            "overview": overview,
            "incidents": incidents,
            "hours_back": hours_back
        }


@router.get("/{anomaly_id}/explain")
async def explain_anomaly(
    anomaly_id: str,
    tenant_id: str = Depends(get_current_tenant)
):
    """
    Provides Anomaly Explanation (XAI) and Root Cause Analysis (RCA)
    for a single anomaly.
    """
    async with timescale_pool.pool.acquire() as conn:

        if anomaly_id == "latest":
            anomaly = await conn.fetchrow("""
                SELECT *
                FROM anomaly_scores
                WHERE tenant_id = $1 AND is_anomaly = True
                ORDER BY scored_at DESC
                LIMIT 1
            """, tenant_id)
        else:
            try:
                aid = int(anomaly_id)
                anomaly = await conn.fetchrow("""
                    SELECT *
                    FROM anomaly_scores
                    WHERE id = $1 AND tenant_id = $2
                """, aid, tenant_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid anomaly id format")

        if not anomaly:
            raise HTTPException(status_code=404, detail="Anomaly not found")

        # Feature Importance
        important_features = []
        error_rate = anomaly.get("error_rate", 0) or 0
        log_volume = anomaly.get("log_volume", 0) or 0
        final_score = anomaly.get("final_score", 0) or 0
        if_score = anomaly.get("if_score", 0) or 0
        lstm_score = anomaly.get("lstm_score", 0) or 0

        if error_rate > 0.3:
            important_features.append({"feature": "error_rate", "value": round(error_rate, 4), "impact": "high"})
        if log_volume > 500:
            important_features.append({"feature": "log_volume_spike", "value": log_volume, "impact": "high"})
        if final_score > 0.7:
            important_features.append({"feature": "ensemble_score", "value": round(final_score, 4), "impact": "high"})
        if if_score > 0.5:
            important_features.append({"feature": "isolation_forest", "value": round(if_score, 4), "impact": "medium"})
        if lstm_score > 0.5:
            important_features.append({"feature": "lstm_autoencoder", "value": round(lstm_score, 4), "impact": "medium"})

        window_start = anomaly['scored_at'] - timedelta(minutes=15)
        window_end = anomaly['scored_at'] + timedelta(minutes=5)

        related_logs = await conn.fetch("""
            SELECT log_problem as drain_template, COUNT(*) as frequency
            FROM anomaly_scores
            WHERE tenant_id = $1 AND host = $2 
              AND scored_at BETWEEN $3 AND $4
              AND log_problem IS NOT NULL AND log_problem != ''
            GROUP BY log_problem
            ORDER BY frequency DESC
        """, tenant_id, anomaly['host'], window_start, window_end)

        rca_clusters = [{"template": r["drain_template"], "count": r["frequency"]} for r in related_logs]

        raw_logs = await conn.fetch("""
            SELECT scored_at, log_text, host, final_score, is_anomaly
            FROM anomaly_scores
            WHERE tenant_id = $1 AND host = $2 
              AND scored_at BETWEEN $3 AND $4
              AND is_anomaly = True
            ORDER BY scored_at DESC
            LIMIT 20
        """, tenant_id, anomaly['host'], window_start, window_end)

        anomaly_log_entries = [{
            "timestamp": r["scored_at"].isoformat(),
            "log_text": r["log_text"],
            "host": r["host"],
            "score": round(float(r["final_score"]), 4)
        } for r in raw_logs]

        explanation_text = "Anomaly detected. "
        if important_features:
            top_feature = important_features[0]['feature']
            explanation_text += f"Spike likely driven by abnormal {top_feature}. "
        if rca_clusters:
            top_cluster = rca_clusters[0]['template']
            explanation_text += f"The most prevalent error pattern is: '{top_cluster}'"

        return {
            "anomaly_id": anomaly["id"],
            "host": anomaly["host"],
            "scored_at": anomaly["scored_at"].isoformat(),
            "final_score": round(float(final_score), 4),
            "explanation": explanation_text,
            "feature_importance": important_features,
            "rca_clusters": rca_clusters,
            "anomaly_logs": anomaly_log_entries
        }
