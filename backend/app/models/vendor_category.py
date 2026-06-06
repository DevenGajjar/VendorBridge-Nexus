from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class VendorCategory(BaseModel):
    __tablename__ = "vendor_categories"

    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)

    # Relationships
    vendors = relationship("Vendor", back_populates="category")
