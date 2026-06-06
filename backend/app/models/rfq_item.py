import uuid
from sqlalchemy import String, Numeric, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class RFQItem(BaseModel):
    __tablename__ = "rfq_items"

    rfq_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rfqs.id", ondelete="CASCADE"), nullable=False)
    item_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    target_price: Mapped[float] = mapped_column(Numeric(15, 2), nullable=True)

    # Relationships
    rfq = relationship("RFQ", back_populates="items")
    quotation_items = relationship("QuotationItem", back_populates="rfq_item", cascade="all, delete-orphan")
