import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging
import asyncio

logger = logging.getLogger(__name__)

class EmailNotifier:
    def __init__(self, config: dict):
        self.config = config
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")

    async def send(self, payload: dict):
        if not self.smtp_password or not self.smtp_username:
            logger.warning("SMTP credentials not configured. Skipping email alert.")
            return False

        to_email = self.config.get("email", "admin@localhost")
        subject = payload.get("rule_name", "Anomaly Detected")
        severity = payload.get("severity", "medium")
        
        body = f"""
        <html>
            <body>
                <h2>LogGuard Alert: {subject}</h2>
                <p><strong>Severity:</strong> {severity.upper()}</p>
                <p><strong>Host:</strong> {payload.get("host")}</p>
                <p><strong>Score:</strong> {payload.get("score")}</p>
                <p><strong>Timestamp:</strong> {payload.get("timestamp")}</p>
                <p><a href="{payload.get("dashboard_url")}">View in Dashboard</a></p>
            </body>
        </html>
        """

        try:
            msg = MIMEMultipart()
            msg['From'] = self.smtp_username
            msg['To'] = to_email
            
            severity_prefix = {
                "low": "🔵 [LOW]",
                "medium": "🟡 [MEDIUM]",
                "high": "🟠 [HIGH]",
                "critical": "🔴 [CRITICAL]"
            }.get(severity, "🟡 [MEDIUM]")
            
            msg['Subject'] = f"{severity_prefix} LogGuard Alert: {subject}"
            msg.attach(MIMEText(body, 'html'))

            def send_sync():
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                text = msg.as_string()
                server.sendmail(self.smtp_username, to_email, text)
                server.quit()
            
            # Run the synchronous SMTP call in a thread pool so it doesn't block
            await asyncio.to_thread(send_sync)
            
            logger.info(f"Email alert sent successfully to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")
            return False
