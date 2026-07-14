from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict

class AnomalyResponse(BaseModel):
    id: int
    scored_at: datetime
    host: str
    final_score: float
    is_anomaly: bool
    breakdown: Optional[Dict] = None

    class Config:
        from_attributes = True