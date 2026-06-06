import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

# PO Item schemas
class PurchaseOrderItemResponse(BaseModel):
    id: uuid.UUID
    purchase_order_id: uuid.UUID
    item_name: str
    quantity: int
    unit_price: float
    total_price: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# PO schemas
class PurchaseOrderCreate(BaseModel):
    quotation_id: uuid.UUID
    delivery_date: Optional[datetime] = None

class PurchaseOrderUpdate(BaseModel):
    status: Optional[str] = Field(None, max_length=50)
    delivery_date: Optional[datetime] = None

class PurchaseOrderResponse(BaseModel):
    id: uuid.UUID
    po_number: str
    quotation_id: uuid.UUID
    vendor_id: uuid.UUID
    status: str
    total_amount: float
    delivery_date: Optional[datetime] = None
    created_by_id: uuid.UUID
    items: List[PurchaseOrderItemResponse] = []
    created_at: datetime
    updated_at: datetime
    vendor_name: str = ""

    model_config = ConfigDict(from_attributes=True)

