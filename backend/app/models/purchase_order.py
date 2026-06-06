import uuid
from datetime import datetime
from sqlalchemy import String, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class PurchaseOrder(BaseModel):
    __tablename__ = "purchase_orders"

    po_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    quotation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quotations.id", ondelete="RESTRICT"), nullable=False)
    vendor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="RESTRICT"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), index=True, default="DRAFT", nullable=False) # DRAFT, SENT, ACCEPTED, DELIVERED, CANCELLED
    total_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    delivery_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

    # Relationships
    quotation = relationship("Quotation", back_populates="purchase_orders")
    vendor = relationship("Vendor", back_populates="purchase_orders")
    created_by = relationship("User", back_populates="created_pos")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="purchase_order", cascade="all, delete-orphan")

    @property
    def vendor_name(self) -> str:
        return self.vendor.name if self.vendor else ""

