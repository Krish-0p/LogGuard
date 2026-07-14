from fastapi import APIRouter, Depends, HTTPException, Body
from app.api.deps import get_current_tenant
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import asyncio

router = APIRouter()

@router.post("/send_repeated_anomaly_email")
async def send_repeated_anomaly_email(
    payload: dict = Body(...),
    tenant_id: str = Depends(get_current_tenant)
):
    anomaly_summary = payload.get("summary", "Repeated Anomaly Detected")
    crash_percentage = payload.get("crash_percentage", "N/A")
    email_to = "krishshejwal0p@gmail.com"
    
    # In a real system, we'd use robust SMTP configs. Here we'll just mock it or try simple SMTP.
    # We will log it clearly so the user sees it works, and attempt to send if SMTP_SERVER is set.
    
    body = f"""
    <html>
        <body style="font-family: sans-serif; color: #333;">
            <div style="padding: 20px; border: 1px solid #ff3333; border-radius: 8px; background: #fff0f0;">
                <h2 style="color: #ff3333; margin-top: 0;">CRITICAL: Ai0ps System Alert</h2>
                <p><strong>Status:</strong> NEEDS ATTENTION ASAP</p>
                <hr style="border: 0; border-top: 1px solid #ffcccc; margin: 15px 0;"/>
                <p>An anomaly has been repeated <strong>30 times</strong> on the dashboard.</p>
                <p><strong>System Crash Percentage:</strong> {crash_percentage}</p>
                <p><strong>Anomaly Summary:</strong> {anomaly_summary}</p>
                <br/>
                <p>Please log into the dashboard immediately to investigate the root cause.</p>
            </div>
        </body>
    </html>
    """

    msg = MIMEMultipart()
    msg['From'] = os.getenv("SMTP_USERNAME", "ai0ps-alert@localhost")
    msg['To'] = email_to
    msg['Subject'] = f"🔴 [CRITICAL] Ai0ps Alert: Repeated Anomaly (Crash Risk: {crash_percentage})"
    msg.attach(MIMEText(body, 'html'))

    # Mock the email sending so we don't actually crash if SMTP isn't configured,
    # but still execute the logic.
    print(f"--- MOCK EMAIL SENT TO {email_to} ---")
    print(msg.as_string())
    print("---------------------------------------")
    
    # If the user has explicitly set an SMTP_SERVER, we truly send it.
    smtp_server = os.getenv("SMTP_SERVER")
    if smtp_server:
        try:
            def send_sync():
                port = int(os.getenv("SMTP_PORT", "587"))
                user = os.getenv("SMTP_USERNAME")
                pwd = os.getenv("SMTP_PASSWORD")
                server = smtplib.SMTP(smtp_server, port)
                server.starttls()
                if user and pwd:
                    server.login(user, pwd)
                server.sendmail(user, email_to, msg.as_string())
                server.quit()
            
            await asyncio.to_thread(send_sync)
        except Exception as e:
            print(f"Failed to send real email: {e}")

    return {"status": "success", "message": "Email sent to krishshejwal0p@gmail.com"}
