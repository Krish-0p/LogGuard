from fastapi import APIRouter, Depends
from app.api.deps import get_current_tenant

router = APIRouter()

@router.get("/")
async def get_all_alerts(tenant_id: str = Depends(get_current_tenant)):
    return {"alerts": [], "tenant_id": tenant_id}

@router.post("/rules")
async def create_alert_rule(rule: dict, tenant_id: str = Depends(get_current_tenant)):
    return {"status": "created", "rule": rule}