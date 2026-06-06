import uuid
from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class Vendor(BaseModel):
    __tablename__ = "vendors"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    vendor_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=True)
    address: Mapped[str] = mapped_column(String(500), nullable=True)
    gst_number: Mapped[str] = mapped_column(String(15), unique=True, index=True, nullable=False)
    rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vendor_categories.id", ondelete="RESTRICT"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), index=True, default="PENDING", nullable=False) # PENDING, APPROVED, BLOCKED
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    category = relationship("VendorCategory", back_populates="vendors")
    user = relationship("User", back_populates="vendors")
    rfq_associations = relationship("RFQVendor", back_populates="vendor", cascade="all, delete-orphan")
    quotations = relationship("Quotation", back_populates="vendor", cascade="all, delete-orphan")
    purchase_orders = relationship("PurchaseOrder", back_populates="vendor", cascade="all, delete-orphan")
