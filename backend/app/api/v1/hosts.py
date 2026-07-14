from fastapi import APIRouter, Depends
from typing import List
from app.db.timescale import get_host_stats
from app.api.deps import get_current_tenant

router = APIRouter()

@router.get("/")
async def list_hosts(tenant_id: str = Depends(get_current_tenant)):
    """
    Returns a list of all hosts and their current health status.
    Used for the dashboard 'Host Status' card.
    """
    stats = await get_host_stats(tenant_id)
    return {"hosts": stats}

@router.get("/{host}/status")
async def get_single_host_status(host: str, tenant_id: str = Depends(get_current_tenant)):
    """Detailed status for a specific host."""
    return {"host": host, "status": "active", "tenant_id": tenant_id}