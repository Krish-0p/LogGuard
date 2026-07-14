from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.db.postgres import get_db_session
from app.api.deps import get_current_tenant
import logging
from datetime import datetime, timedelta

router = APIRouter()
logger = logging.getLogger("logguard.trends")

@router.get("/prediction")
async def get_trend_prediction(
    tenant_id: str = Depends(get_current_tenant),
    hours_ahead: int = 1
):
    """
    Predicts system crash / anomaly trends for the next hour.
    Mocking an LSTM inference that relies on historical time series data.
    """
    db = await get_db_session()
    
    # 1. Fetch recent anomaly rate to simulate basic forecasting
    current_time = datetime.utcnow()
    past_hour_record = await db.fetchrow("""
        SELECT COUNT(*) as recent_errors
        FROM anomaly_scores
        WHERE tenant_id = $1 AND scored_at >= NOW() - INTERVAL '1 hour'
    """, tenant_id)
    
    recent_errors = past_hour_record['recent_errors'] if past_hour_record else 0
    
    # Simple linear heuristic representing basic trend analysis (Mock LSTM)
    predicted_errors = int(recent_errors * 1.2 * hours_ahead) # Example trend
    crash_probability = min(1.0, predicted_errors / 10000.0) # Assuming 10k errors/hr is critical
    
    status = "stable"
    if crash_probability > 0.8:
        status = "critical - high risk of system failure"
    elif crash_probability > 0.4:
        status = "warning - degrading performance"

    return {
        "prediction_window_hours": hours_ahead,
        "predicted_error_volume": predicted_errors,
        "crash_probability": round(crash_probability * 100, 2),
        "forecast_status": status,
        "recommendation": "Scale up resources" if status != "stable" else "No action needed"
    }

@router.get("/correlation")
async def get_correlation_graph(
    tenant_id: str = Depends(get_current_tenant)
):
    """
    Generates a Dependency Graph based on incident correlation.
    If Service A fails -> Service B fails (temporal correlation).
    """
    db = await get_db_session()
    
    incidents = await db.fetch("""
        SELECT affected_hosts
        FROM incidents
        WHERE tenant_id = $1 AND array_length(affected_hosts, 1) > 1
        ORDER BY created_at DESC
        LIMIT 50
    """, tenant_id)
    
    # Build edges between hosts that co-occur in incidents
    edges = {}
    nodes = set()
    for row in incidents:
        hosts = r["affected_hosts"]
        for i in range(len(hosts)):
            for j in range(i+1, len(hosts)):
                node1 = hosts[i]
                node2 = hosts[j]
                # Sort to ensure undirected edge consistency
                pair = tuple(sorted([node1, node2]))
                edges[pair] = edges.get(pair, 0) + 1
                nodes.add(node1)
                nodes.add(node2)
                
    # Format for frontend graphs (e.g., vis.js, cytoscape)
    graph_nodes = [{"id": n, "label": n} for n in nodes]
    graph_edges = [{"source": k[0], "target": k[1], "weight": v} for k, v in edges.items()]

    return {
        "dependency_graph": {
            "nodes": graph_nodes,
            "edges": graph_edges
        },
        "insight": "Drawn from recent synchronized failures."
    }
