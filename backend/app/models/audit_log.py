import uuid
from sqlalchemy import String, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class AuditLog(BaseModel):
    __tablename__ = "audit_logs"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False) # CREATE, UPDATE, DELETE, etc.
    old_value: Mapped[str] = mapped_column(Text, nullable=True) # JSON string of prior state
    new_value: Mapped[str] = mapped_column(Text, nullable=True) # JSON string of new state

    # Composite Index
    __table_args__ = (
        Index("idx_audit_logs_entity", "entity_type", "entity_id"),
    )
