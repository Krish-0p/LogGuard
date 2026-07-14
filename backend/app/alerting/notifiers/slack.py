import httpx
import logging

logger = logging.getLogger("logguard.slack")

class SlackNotifier:
    """
    Sends anomaly alerts to a Slack channel via Webhooks.
    """
    
    def __init__(self, config: dict):
        self.webhook_url = config["webhook_url"]
        self.channel     = config.get("channel", "#alerts")
    
    async def send(self, alert_data: dict):
        # Calculate percentage for display
        score_pct = int(alert_data.get("score", 0) * 100)
        
        # Map severity to emojis for better visibility
        severity_emoji = {
            "low": "🟡", 
            "medium": "🟠", 
            "high": "🔴", 
            "critical": "🚨"
        }.get(alert_data.get("severity", "low"), "⚠️")
        
        # Build the Slack Block Kit payload
        payload = {
            "channel": self.channel,
            "attachments": [{
                "color": "#FF0000" if alert_data.get("severity") in ("high", "critical") else "#FFA500",
                "blocks": [
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text", 
                            "text": f"{severity_emoji} LogGuard Anomaly Detected"
                        }
                    },
                    {
                        "type": "section",
                        "fields": [
                            {"type": "mrkdwn", "text": f"*Host:*\n`{alert_data.get('host', 'unknown')}`"},
                            {"type": "mrkdwn", "text": f"*Anomaly Score:*\n{score_pct}%"},
                            {"type": "mrkdwn", "text": f"*Error Rate:*\n{alert_data.get('error_rate', 0)*100:.1f}%"},
                            {"type": "mrkdwn", "text": f"*Severity:*\n{alert_data.get('severity', 'UNKNOWN').upper()}"},
                        ]
                    },
                    {
                        "type": "actions",
                        "elements": [{
                            "type": "button",
                            "text": {"type": "plain_text", "text": "View in Dashboard"},
                            "url": alert_data.get("dashboard_url", "http://localhost:3000"),
                            "style": "danger"
                        }]
                    }
                ]
            }]
        }
        
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(self.webhook_url, json=payload, timeout=5.0)
                resp.raise_for_status()
                logger.info(f"Successfully sent Slack alert for host: {alert_data.get('host')}")
        except Exception as e:
            logger.error(f"Failed to send Slack notification: {e}")