from fastapi import Request, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import get_settings
from app.core.auth import decode_access_token

settings = get_settings()
security = HTTPBearer()

async def get_current_tenant(request: Request):
    """Fallback logic to get tenant ID securely via Auth Token or Headers"""
    tenant_id = request.headers.get("X-Tenant-ID")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="X-Tenant-ID header missing")
    return tenant_id

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Decodes JWT and retrieves User info."""
    token = credentials.credentials
    user_data = decode_access_token(token)
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
        
    return user_data

async def require_admin(user: dict = Depends(get_current_user)):
    """Role-based Auth check for Dashboards and configurations."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
