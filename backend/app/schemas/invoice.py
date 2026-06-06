import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class InvoiceCreate(BaseModel):
    purchase_order_id: uuid.UUID
    due_date: datetime

class InvoiceUpdate(BaseModel):
    status: Optional[str] = Field(None, max_length=50) # UNPAID, PAID, OVERDUE

class InvoiceResponse(BaseModel):
    id: uuid.UUID
    invoice_number: str
    purchase_order_id: uuid.UUID
    total_amount: float
    due_date: datetime
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
