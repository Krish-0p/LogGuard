import httpx
import logging

logger = logging.getLogger("logguard.pagerduty")

class PagerDutyNotifier:
    """
    Sends anomaly alerts to PagerDuty Events API.
    """
    
    def __init__(self, config: dict):
        self.routing_key = config.get("routing_key")
        self.api_url = "https://events.pagerduty.com/v2/enqueue"
    
    async def send(self, alert_data: dict):
        if not self.routing_key:
            logger.warning("PagerDuty routing key not configured. Skipping.")
            return

        payload = {
            "routing_key": self.routing_key,
            "event_action": "trigger",
            "payload": {
                "summary": f"LogGuard Anomaly: {alert_data.get('host')} (Score: {int(alert_data.get('score', 0)*100)}%)",
                "severity": alert_data.get("severity", "critical"),
                "source": alert_data.get("host", "logguard-backend"),
                "timestamp": alert_data.get("timestamp"),
                "custom_details": alert_data
            }
        }
        
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(self.api_url, json=payload, timeout=5.0)
                resp.raise_for_status()
                logger.info("✅ PagerDuty alert sent.")
        except Exception as e:
            logger.error(f"❌ Failed to send PagerDuty alert: {e}")