import uuid
from datetime import datetime
from sqlalchemy import String, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class Invoice(BaseModel):
    __tablename__ = "invoices"

    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    purchase_order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("purchase_orders.id", ondelete="RESTRICT"), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(50), index=True, default="UNPAID", nullable=False) # UNPAID, PAID, OVERDUE

    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="invoices")
