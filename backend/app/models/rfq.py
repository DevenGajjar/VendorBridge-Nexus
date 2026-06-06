import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class RFQ(BaseModel):
    __tablename__ = "rfqs"

    rfq_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(50), index=True, default="DRAFT", nullable=False) # DRAFT, SENT, CLOSED
    created_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

    # Relationships
    created_by = relationship("User", back_populates="created_rfqs")
    items = relationship("RFQItem", back_populates="rfq", cascade="all, delete-orphan")
    vendor_associations = relationship("RFQVendor", back_populates="rfq", cascade="all, delete-orphan")
    quotations = relationship("Quotation", back_populates="rfq", cascade="all, delete-orphan")

    @property
    def vendors_count(self) -> int:
        return len(self.vendor_associations)

