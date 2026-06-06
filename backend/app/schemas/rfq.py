import uuid
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator

# RFQ Item schemas
class RFQItemBase(BaseModel):
    item_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None)
    quantity: int = Field(..., ge=1, description="Quantity must be at least 1")
    target_price: Optional[float] = Field(None, gt=0.0, description="Target price must be positive")

class RFQItemCreate(RFQItemBase):
    pass

class RFQItemUpdate(BaseModel):
    id: Optional[uuid.UUID] = None
    item_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    quantity: Optional[int] = Field(None, ge=1)
    target_price: Optional[float] = Field(None, gt=0.0)

class RFQItemResponse(RFQItemBase):
    id: uuid.UUID
    rfq_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# RFQ schemas
class RFQBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    deadline: datetime
    status: str = Field("DRAFT", max_length=50)

    @field_validator("deadline")
    @classmethod
    def validate_deadline(cls, value: datetime) -> datetime:
        # Check if deadline is in the future
        now = datetime.now(timezone.utc) if value.tzinfo else datetime.utcnow()
        if value < now:
            raise ValueError("RFQ deadline must be a future datetime.")
        return value

class RFQCreate(RFQBase):
    assigned_vendors: List[uuid.UUID] = Field(default_factory=list, description="List of vendor IDs assigned to this RFQ")
    items: List[RFQItemCreate] = Field(..., min_length=1, description="An RFQ must contain at least one item")

class RFQUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = Field(None, max_length=50)
    assigned_vendors: Optional[List[uuid.UUID]] = None
    items: Optional[List[RFQItemUpdate]] = None

    @field_validator("deadline")
    @classmethod
    def validate_deadline(cls, value: Optional[datetime]) -> Optional[datetime]:
        if value is None:
            return value
        now = datetime.now(timezone.utc) if value.tzinfo else datetime.utcnow()
        if value < now:
            raise ValueError("RFQ deadline must be a future datetime.")
        return value

class RFQResponse(RFQBase):
    id: uuid.UUID
    rfq_number: str
    created_by_id: uuid.UUID
    items: List[RFQItemResponse] = []
    created_at: datetime
    updated_at: datetime
    vendors_count: int = 0

    model_config = ConfigDict(from_attributes=True)

