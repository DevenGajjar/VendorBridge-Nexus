import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class VendorCategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=255)

class VendorCategoryCreate(VendorCategoryBase):
    pass

class VendorCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=255)

class VendorCategoryResponse(VendorCategoryBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
