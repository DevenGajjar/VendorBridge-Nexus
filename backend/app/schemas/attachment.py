import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class AttachmentBase(BaseModel):
    entity_type: str = Field(..., description="RFQ, QUOTATION, PURCHASE_ORDER, INVOICE")
    entity_id: uuid.UUID

class AttachmentCreate(AttachmentBase):
    file_name: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None

class AttachmentResponse(AttachmentBase):
    id: uuid.UUID
    file_name: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
