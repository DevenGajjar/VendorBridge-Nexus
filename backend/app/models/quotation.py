import uuid
from datetime import datetime
from sqlalchemy import String, Numeric, ForeignKey, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class Quotation(BaseModel):
    __tablename__ = "quotations"

    quotation_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    rfq_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rfqs.id", ondelete="RESTRICT"), nullable=False)
    vendor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="RESTRICT"), nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    delivery_days: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(50), index=True, default="SUBMITTED", nullable=False) # SUBMITTED, UNDER_REVIEW, ACCEPTED, REJECTED
    total_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)

    # Relationships
    rfq = relationship("RFQ", back_populates="quotations")
    vendor = relationship("Vendor", back_populates="quotations")
    items = relationship("QuotationItem", back_populates="quotation", cascade="all, delete-orphan")
    purchase_orders = relationship("PurchaseOrder", back_populates="quotation", cascade="all, delete-orphan")
