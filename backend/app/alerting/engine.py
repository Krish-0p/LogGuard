import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from app.alerting.notifiers.slack import SlackNotifier
from app.alerting.notifiers.pagerduty import PagerDutyNotifier
from app.alerting.correlator import IncidentCorrelator
from app.db.postgres import get_alert_rules
from app.db.redis_client import redis_client

logger = logging.getLogger("logguard.alerting")

NOTIFIER_MAP = {
    "slack":      SlackNotifier,
    "pagerduty":  PagerDutyNotifier,
}

class AlertingEngine:
    """
    Evaluates configured alert rules against a new anomaly event.
    Implements cooldown deduplication and incident correlation.
    """
    
    def __init__(self, settings):
        self.settings   = settings
        self.correlator = IncidentCorrelator(settings)
    
    async def evaluate(self, anomaly: dict, tenant_id: str):
        """
        Called for every anomaly event. Non-blocking — runs as a background task.
        """
        
        host  = anomaly["host"]
        score = anomaly["final_score"]
        
        # ── Check if host is part of a correlated incident ──
        await self.correlator.record(host, tenant_id, anomaly["scored_at"])
        incident = await self.correlator.check_incident(tenant_id)
        
        if incident:
            logger.warning(
                f"🔴 Correlated incident detected: {incident['affected_hosts']} "
                f"({incident['anomaly_count']} anomalies)"
            )
            # Fire incident-level alert (higher severity)
            await self._fire_incident_alert(incident, tenant_id)
        
        # ── Evaluate individual alert rules ──────────────────
        rules = await get_alert_rules(tenant_id=tenant_id, is_active=True)
        
        for rule in rules:
            # Skip if score below rule threshold
            if score < rule["score_threshold"]:
                continue
            
            # Skip if host doesn't match rule pattern
            if rule["host_pattern"] and not self._host_matches(host, rule["host_pattern"]):
                continue
            
            # Cooldown check — prevent alert storm
            cooldown_key = f"alert_cd:{tenant_id}:{rule['id']}:{host}"
            if await redis_client.exists(cooldown_key):
                logger.debug(f"Alert rule {rule['id']} on cooldown for {host}")
                continue
            
            # Fire the alert
            await self._fire_alert(rule, anomaly)
            
            # Set cooldown
            await redis_client.setex(
                cooldown_key,
                rule["cooldown_minutes"] * 60,
                "1"
            )
    
    async def _fire_alert(self, rule: dict, anomaly: dict):
        """Dispatch notification via configured notifier."""
        notifier_class = NOTIFIER_MAP.get(rule["notifier_type"])
        if not notifier_class:
            logger.error(f"Unknown notifier type: {rule['notifier_type']}")
            return
        
        notifier = notifier_class(rule["notifier_config"])
        
        try:
            await notifier.send({
                "rule_name": rule["name"],
                "host": anomaly["host"],
                "score": anomaly["final_score"],
                "severity": rule["severity"],
                "timestamp": anomaly["scored_at"],
                "error_rate": anomaly.get("error_rate", 0),
                "dashboard_url": f"https://app.logguard.io/anomalies/{anomaly.get('id')}"
            })
            logger.info(f"✅ Alert sent via {rule['notifier_type']} for {anomaly['host']}")
        except Exception as e:
            logger.error(f"Failed to send alert via {rule['notifier_type']}: {e}")
    
    def _host_matches(self, host: str, pattern: str) -> bool:
        import fnmatch
        return fnmatch.fnmatch(host, pattern)
    
    async def _fire_incident_alert(self, incident: dict, tenant_id: str):
        """Fire a high-severity correlated incident alert."""
        # Use the highest-priority active rule for incident notification
        logger.warning(f"Incident alert for {len(incident['affected_hosts'])} hosts")
