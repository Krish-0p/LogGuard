from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, EmailStr
from app.core.auth import create_access_token, get_password_hash, verify_password
from app.db.postgres import async_session
from app.db.redis_client import redis_client
from sqlalchemy import text
from datetime import datetime, timedelta
import logging
import smtplib
from email.mime.text import MIMEText
import os
import asyncio
import uuid
import json

router = APIRouter()
logger = logging.getLogger("logguard.auth")

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, description="User's full name")
    email: EmailStr
    password: str = Field(..., min_length=8, description="Standard password")

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

async def send_verification_email_task(to_email: str, token: str):
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    if smtp_password:
        smtp_password = smtp_password.replace(" ", "")
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    verification_link = f"{frontend_url}/verify-email?token={token}"

    if not smtp_password or not smtp_username:
        logger.warning(f"SMTP credentials not configured. Verification email not sent. Link: {verification_link}")
        return False

    def send_sync():
        msg = MIMEText(f"Thank you for registering for LogGuard.\n\nPlease verify your email by entering the following verification code:\n\n{token}\n\nThis code will expire in 1 hour.", 'plain')
        msg['Subject'] = "LogGuard Security: Verify your email"
        msg['From'] = smtp_username
        msg['To'] = to_email

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.sendmail(smtp_username, to_email, msg.as_string())
        server.quit()

    try:
        await asyncio.to_thread(send_sync)
        logger.info(f"Verification email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send verification email to {to_email}: {e}")
        return False

@router.post("/signup")
async def signup(credentials: SignupRequest):
    """
    Sign up endpoint. Generates a verification token and sends an email.
    The user is not fully registered until the email is verified.
    """
    async with async_session() as db:
        result_user = await db.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": credentials.email}
        )
        if result_user.mappings().first():
            raise HTTPException(status_code=400, detail="Email already registered. Please login.")

    import random
    token = str(random.randint(100000, 999999))
    
    # Store registration data in Redis with 1 hour expiration (3600 seconds)
    user_data = {
        "name": credentials.name,
        "email": credentials.email,
        "password": get_password_hash(credentials.password) # Store hashed password temporarily
    }
    
    await redis_client.setex(f"verify_email:{credentials.email}:{token}", 3600, json.dumps(user_data))
    
    # Async background email sending
    asyncio.create_task(send_verification_email_task(credentials.email, token))
    
    return {"message": "A verification email has been sent. Please check your inbox to activate your account."}

@router.post("/verify-email")
async def verify_email(req: VerifyEmailRequest):
    """
    Verifies the email link token, registers the user in Postgres, and returns an access token.
    """
    stored_data_json = await redis_client.get(f"verify_email:{req.email}:{req.code}")
    if not stored_data_json:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")
        
    user_data = json.loads(stored_data_json)

    async with async_session() as db:
        # Check if user already got registered
        result_user = await db.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": user_data["email"]}
        )
        if result_user.mappings().first():
            await redis_client.delete(f"verify_email:{req.email}:{req.code}")
            raise HTTPException(status_code=400, detail="Email already verified")

        # Check if tenant exists, or create a default one
        result = await db.execute(text("SELECT id FROM tenants LIMIT 1"))
        tenant = result.mappings().first()
        
        if not tenant:
            res_tenant = await db.execute(text("INSERT INTO tenants (name) VALUES ('Default') RETURNING id"))
            tenant_id = res_tenant.scalar()
            await db.commit()
        else:
            tenant_id = tenant['id']

        # Ensure schema allows for password storage and name
        await db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT"))
        await db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password TEXT"))
        
        res_new_user = await db.execute(
            text("""
            INSERT INTO users (tenant_id, email, role, hashed_password, name)
            VALUES (:tenant_id, :email, 'admin', :hashed_password, :name)
            RETURNING id, email, role, name
            """),
            {
                "tenant_id": tenant_id, 
                "email": user_data["email"], 
                "hashed_password": user_data["password"], 
                "name": user_data["name"]
            }
        )
        await db.commit()
        user = res_new_user.mappings().first()

        # Delete token so it cannot be reused
        await redis_client.delete(f"verify_email:{req.email}:{req.code}")

        access_token = create_access_token(
            data={"sub": str(user["id"]), "email": user["email"], "role": user["role"], "tenant_id": str(tenant_id)},
            expires_delta=timedelta(minutes=60 * 24)
        )
        
        return {"access_token": access_token, "token_type": "bearer", "user": {"email": user["email"], "name": user["name"], "role": user["role"]}}

@router.post("/login")
async def login(credentials: LoginRequest):
    """
    Login endpoint. Validates password against stored hash.
    """
    async with async_session() as db:
        # Safeguard schema 
        await db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password TEXT"))
        await db.commit()
        
        result_user = await db.execute(
            text("SELECT id, email, role, hashed_password, tenant_id FROM users WHERE email = :email"),
            {"email": credentials.email}
        )
        user = result_user.mappings().first()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        if not user["hashed_password"] or not verify_password(credentials.password, user["hashed_password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        access_token = create_access_token(
            data={"sub": str(user["id"]), "email": user["email"], "role": user["role"], "tenant_id": str(user["tenant_id"])},
            expires_delta=timedelta(minutes=60 * 24)
        )
        
        return {"access_token": access_token, "token_type": "bearer", "user": {"email": user["email"], "role": user["role"]}}
