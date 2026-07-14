import logging
from datetime import datetime, timedelta
from app.db.redis_client import redis_client

logger = logging.getLogger("logguard.correlator")

class IncidentCorrelator:
    """
    Correlates multiple anomalies across different hosts to identify 
    larger-scale incidents.
    """
    
    def __init__(self, settings):
        self.window = settings.incident_correlation_window_seconds
        self.min_hosts = settings.incident_min_hosts

    async def record(self, host: str, tenant_id: str, timestamp: str):
        """Records an anomaly event in Redis for correlation analysis."""
        key = f"incid_corr:{tenant_id}"
        # Store the host and timestamp in a Redis set or list
        await redis_client.client.sadd(key, host)
        # Set expiration so the correlation window slides
        await redis_client.client.expire(key, self.window)

    async def check_incident(self, tenant_id: str) -> dict | None:
        """
        Checks if the number of affected hosts exceeds the 
        threshold within the window.
        """
        key = f"incid_corr:{tenant_id}"
        affected_hosts = await redis_client.client.smembers(key)
        
        if len(affected_hosts) >= self.min_hosts:
            return {
                "affected_hosts": list(affected_hosts),
                "anomaly_count": len(affected_hosts),
                "severity": "critical"
            }
        return None