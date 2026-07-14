import asyncio
import logging
from app.db.postgres import get_db_session
from app.alerting.notifiers.email import EmailNotifier
from datetime import datetime, timedelta

logger = logging.getLogger("logguard.anomaly_monitor")

async def monitor_active_anomalies():
    """Background task to check for >20 active anomalies and send an email alert."""
    logger.info("Starting anomaly monitor background task...")
    
    # Use empty config to rely on environment variables
    email_notifier = EmailNotifier({})
    
    while True:
        try:
            await asyncio.sleep(60) # Check every minute
            
            db = await get_db_session()
            if not db:
                continue
                
            # Count anomalies in the last 10 minutes (considered "active")
            count = await db.fetchval("""
                SELECT COUNT(*) FROM anomaly_scores 
                WHERE is_anomaly = TRUE AND scored_at >= NOW() - INTERVAL '10 minutes'
            """)
            
            if count and count > 20:
                logger.warning(f"🚨 CRITICAL SPIKE: {count} active anomalies detected in the last 10 minutes!")
                
                # Fetch all registered users to email them
                users = await db.fetch("SELECT email FROM users")
                
                for user in users:
                    user_email = user["email"]
                    
                    payload = {
                        "rule_name": f"CRITICAL SPIKE: {count} Anomalies Detected",
                        "severity": "critical",
                        "host": "Multiple cluster nodes",
                        "score": 1.0,
                        "timestamp": str(datetime.utcnow()),
                        "dashboard_url": "http://localhost:5173/dashboard",
                        "email": user_email
                    }
                    
                    await email_notifier.send(payload)
                
                # Sleep for 15 minutes after sending an alert to avoid spamming
                await asyncio.sleep(15 * 60)
                
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Anomaly monitor error: {e}")
