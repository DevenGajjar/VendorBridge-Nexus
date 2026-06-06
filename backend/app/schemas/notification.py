import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class NotificationCreate(BaseModel):
    user_id: uuid.UUID
    title: str
    message: str

class ExternalNotificationCreate(BaseModel):
    recipient_email: str
    title: str
    message: str

class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    message: str
    is_read: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationUnreadCountResponse(BaseModel):
    unread_count: int
