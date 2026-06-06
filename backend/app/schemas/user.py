import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from app.schemas.role import RoleResponse

class UserBase(BaseModel):
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)
    role_id: uuid.UUID

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit.")
        # Special character check
        special_chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~"
        if not any(c in special_chars for c in v):
            raise ValueError("Password must contain at least one special character.")
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    password: Optional[str] = Field(None, min_length=8, max_length=100)
    role_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit.")
        # Special character check
        special_chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~"
        if not any(c in special_chars for c in v):
            raise ValueError("Password must contain at least one special character.")
        return v

class UserResponse(UserBase):
    id: uuid.UUID
    is_active: bool
    role_id: uuid.UUID
    role: Optional[RoleResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
