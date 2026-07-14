from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Literal
from app.db.postgres import get_db_session
from app.api.deps import get_current_user
import logging

router  = APIRouter()
logger  = logging.getLogger("logguard.feedback")

class FeedbackRequest(BaseModel):
    anomaly_id:    int
    scored_at:     str  # ISO timestamp
    host:          str
    feedback_type: Literal["true_positive", "false_positive"]
    notes:         str | None = None

@router.post("/")
async def submit_feedback(
    body: FeedbackRequest,
    user=Depends(get_current_user),
    db=Depends(get_db_session)
):
    """
    Submit analyst feedback on a detected anomaly.
    This data is used by the ML team's weekly retraining pipeline.
    
    Example:
      POST /api/v1/feedback
      {"anomaly_id": 4521, "scored_at": "2024-01-15T14:23:00Z",
       "host": "web-01", "feedback_type": "false_positive"}
    """
    
    await db.execute("""
        INSERT INTO anomaly_feedback
          (tenant_id, anomaly_id, scored_at, host, feedback_type, submitted_by, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    """,
        user.tenant_id,
        body.anomaly_id,
        body.scored_at,
        body.host,
        body.feedback_type,
        user.id,
        body.notes
    )
    
    logger.info(
        f"Feedback recorded: anomaly_id={body.anomaly_id} "
        f"type={body.feedback_type} by {user.email}"
    )
    
    return {"status": "recorded", "feedback_type": body.feedback_type}
