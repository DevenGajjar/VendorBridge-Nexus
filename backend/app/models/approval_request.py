import uuid
from sqlalchemy import String, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class ApprovalRequest(BaseModel):
    __tablename__ = "approval_requests"

    entity_type: Mapped[str] = mapped_column(String(50), nullable=False) # RFQ, QUOTATION, PURCHASE_ORDER, etc.
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    requested_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    assigned_approver_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), index=True, default="PENDING", nullable=False) # PENDING, APPROVED, REJECTED
    comments: Mapped[str] = mapped_column(Text, nullable=True)

    # Relationships
    requested_by = relationship("User", foreign_keys=[requested_by_id], back_populates="approval_requests_made")
    assigned_approver = relationship("User", foreign_keys=[assigned_approver_id], back_populates="approval_requests_assigned")
