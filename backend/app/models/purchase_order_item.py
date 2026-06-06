import uuid
from sqlalchemy import String, Numeric, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class PurchaseOrderItem(BaseModel):
    __tablename__ = "purchase_order_items"

    purchase_order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False)
    item_name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    total_price: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)

    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="items")
