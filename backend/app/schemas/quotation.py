import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator

# Quotation Item schemas
class QuotationItemBase(BaseModel):
    rfq_item_id: uuid.UUID
    unit_price: float = Field(..., gt=0.0, description="Unit price must be greater than 0")

class QuotationItemCreate(QuotationItemBase):
    pass

class QuotationItemResponse(QuotationItemBase):
    id: uuid.UUID
    quotation_id: uuid.UUID
    total_price: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Quotation schemas
class QuotationBase(BaseModel):
    rfq_id: uuid.UUID
    delivery_days: int = Field(..., gt=0, description="Delivery days must be at least 1")
    status: str = Field("SUBMITTED", max_length=50)

class QuotationCreate(BaseModel):
    rfq_id: uuid.UUID
    delivery_days: int = Field(..., gt=0)
    items: List[QuotationItemCreate] = Field(..., min_length=1)

class QuotationUpdate(BaseModel):
    delivery_days: Optional[int] = Field(None, gt=0)
    status: Optional[str] = Field(None, max_length=50)
    items: Optional[List[QuotationItemCreate]] = None

class QuotationResponse(QuotationBase):
    id: uuid.UUID
    quotation_number: str
    vendor_id: uuid.UUID
    total_amount: float
    submitted_at: datetime
    items: List[QuotationItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Quotation Comparison matrix models
class ComparisonItem(BaseModel):
    vendor_name: str
    vendor_rating: float
    unit_price: float
    total_price: float
    delivery_days: int

class ComparisonMatrixEntry(BaseModel):
    rfq_item_id: uuid.UUID
    item_name: str
    quantity: int
    quotes: List[ComparisonItem]

class QuotationComparisonResponse(BaseModel):
    rfq_id: uuid.UUID
    lowest_price_quotation: Optional[QuotationResponse] = None
    fastest_delivery_quotation: Optional[QuotationResponse] = None
    highest_rating_vendor_quotation: Optional[QuotationResponse] = None
    recommended_quotation: Optional[QuotationResponse] = None
    comparison_matrix: List[ComparisonMatrixEntry] = []
