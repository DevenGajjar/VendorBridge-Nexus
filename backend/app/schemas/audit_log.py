import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class AuditLogResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    entity_type: str
    entity_id: uuid.UUID
    action: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
