import uuid
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class RFQVendor(BaseModel):
    __tablename__ = "rfq_vendors"

    rfq_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rfqs.id", ondelete="CASCADE"), nullable=False)
    vendor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        UniqueConstraint("rfq_id", "vendor_id", name="uq_rfq_vendor"),
    )

    # Relationships
    rfq = relationship("RFQ", back_populates="vendor_associations")
    vendor = relationship("Vendor", back_populates="rfq_associations")
