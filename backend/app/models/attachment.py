import uuid
from sqlalchemy import String, Integer, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel

class Attachment(BaseModel):
    __tablename__ = "attachments"

    entity_type: Mapped[str] = mapped_column(String(50), nullable=False) # RFQ, QUOTATION, INVOICE, etc.
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(100), nullable=True)
    file_size: Mapped[int] = mapped_column(Integer, nullable=True)

    __table_args__ = (
        Index("idx_attachments_entity", "entity_type", "entity_id"),
    )
