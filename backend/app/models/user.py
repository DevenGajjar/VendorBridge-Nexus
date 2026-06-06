import uuid
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class User(BaseModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    role_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False)

    # Relationships
    role = relationship("Role", back_populates="users")
    vendors = relationship("Vendor", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    created_rfqs = relationship("RFQ", back_populates="created_by")
    created_pos = relationship("PurchaseOrder", back_populates="created_by")
    approval_requests_made = relationship("ApprovalRequest", foreign_keys="[ApprovalRequest.requested_by_id]", back_populates="requested_by")
    approval_requests_assigned = relationship("ApprovalRequest", foreign_keys="[ApprovalRequest.assigned_approver_id]", back_populates="assigned_approver")
