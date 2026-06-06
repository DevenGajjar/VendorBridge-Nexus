import uuid
from sqlalchemy import Numeric, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class QuotationItem(BaseModel):
    __tablename__ = "quotation_items"

    quotation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False)
    rfq_item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rfq_items.id", ondelete="RESTRICT"), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    total_price: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)

    __table_args__ = (
        UniqueConstraint("quotation_id", "rfq_item_id", name="uq_quotation_item"),
    )

    # Relationships
    quotation = relationship("Quotation", back_populates="items")
    rfq_item = relationship("RFQItem", back_populates="quotation_items")
