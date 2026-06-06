import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator

class ApprovalRequestBase(BaseModel):
    entity_type: str = Field(..., min_length=2, max_length=50) # e.g. RFQ, QUOTATION, PURCHASE_ORDER
    entity_id: uuid.UUID
    assigned_approver_id: uuid.UUID
    comments: Optional[str] = None

class ApprovalRequestCreate(ApprovalRequestBase):
    pass

class ApprovalActionRequest(BaseModel):
    status: str = Field(..., description="Must be APPROVED or REJECTED")
    comments: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        upper_val = value.upper()
        if upper_val not in ["APPROVED", "REJECTED"]:
            raise ValueError("Status must be either APPROVED or REJECTED")
        return upper_val

class ApprovalRequestResponse(ApprovalRequestBase):
    id: uuid.UUID
    requested_by_id: uuid.UUID
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ApprovalTimelineEvent(BaseModel):
    id: uuid.UUID
    status: str
    action_by: str
    comments: Optional[str]
    timestamp: datetime
