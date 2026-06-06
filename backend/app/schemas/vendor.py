import uuid
import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from app.schemas.vendor_category import VendorCategoryResponse

GST_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$")

class VendorBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    vendor_code: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=500)
    gst_number: str = Field(..., min_length=15, max_length=15, strip_whitespace=True)
    rating: float = Field(0.0, ge=0.0, le=5.0)
    category_id: uuid.UUID
    status: str = Field("PENDING", max_length=50)
    user_id: Optional[uuid.UUID] = None

    @field_validator("gst_number")
    @classmethod
    def validate_gst(cls, value: str) -> str:
        val_upper = value.upper()
        if not GST_REGEX.match(val_upper):
            raise ValueError("Invalid GST number format. It must follow the 15-character Indian GST format.")
        return val_upper

    @field_validator("vendor_code")
    @classmethod
    def validate_vendor_code(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Vendor code cannot be empty.")
        return value.strip()

class VendorCreate(VendorBase):
    pass

class VendorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    vendor_code: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=500)
    gst_number: Optional[str] = Field(None, min_length=15, max_length=15)
    rating: Optional[float] = Field(None, ge=0.0, le=5.0)
    category_id: Optional[uuid.UUID] = None
    status: Optional[str] = Field(None, max_length=50)
    user_id: Optional[uuid.UUID] = None

    @field_validator("gst_number")
    @classmethod
    def validate_gst(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        val_upper = value.upper()
        if not GST_REGEX.match(val_upper):
            raise ValueError("Invalid GST number format. It must follow the 15-character Indian GST format.")
        return val_upper

class VendorResponse(VendorBase):
    id: uuid.UUID
    category: Optional[VendorCategoryResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class VendorIntelligenceResponse(BaseModel):
    vendor_id: uuid.UUID
    vendor_name: str
    overall_score: float
    price_score: float
    delivery_score: float
    approval_success_rate: float
    response_rate: float
    vendor_rating: float
    recommendation: str

    model_config = ConfigDict(from_attributes=True)
