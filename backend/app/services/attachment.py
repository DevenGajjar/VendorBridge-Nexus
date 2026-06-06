import os
import uuid
import shutil
from typing import List, Optional, Any
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from app.repositories import (
    attachment_repo, rfq_repo, quotation_repo, purchase_order_repo, invoice_repo
)
from app.models import Attachment

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {"pdf", "docx", "xlsx", "png", "jpg", "jpeg", "csv", "txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

os.makedirs(UPLOAD_DIR, exist_ok=True)

class AttachmentService:
    @staticmethod
    def validate_entity(db: Session, entity_type: str, entity_id: uuid.UUID) -> None:
        entity_type_upper = entity_type.upper()
        if entity_type_upper == "RFQ":
            entity = rfq_repo.get(db, entity_id)
        elif entity_type_upper == "QUOTATION":
            entity = quotation_repo.get(db, entity_id)
        elif entity_type_upper == "PURCHASE_ORDER":
            entity = purchase_order_repo.get(db, entity_id)
        elif entity_type_upper == "INVOICE":
            entity = invoice_repo.get(db, entity_id)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported entity type: {entity_type}. Must be RFQ, QUOTATION, PURCHASE_ORDER, or INVOICE."
            )
        
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{entity_type_upper} with ID {entity_id} not found."
            )

    @staticmethod
    def upload_attachment(
        db: Session,
        file: UploadFile,
        entity_type: str,
        entity_id: uuid.UUID
    ) -> Attachment:
        # Validate Entity
        AttachmentService.validate_entity(db, entity_type, entity_id)

        # Validate file size if size is available (FastAPI / python-multipart might chunk it)
        # Note: file.size is available in modern python-multipart / fastapi
        file_size = getattr(file, "size", 0)
        # We can also seek to end to check size if file.size is 0 or None
        if not file_size:
            file.file.seek(0, 2)
            file_size = file.file.tell()
            file.file.seek(0)

        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum limit of {MAX_FILE_SIZE / (1024*1024)} MB."
            )

        # Validate extension
        filename = file.filename or "unnamed_file"
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File extension '.{ext}' is not supported. Supported extensions: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # Safe filename generation
        safe_name = "".join(c for c in filename if c.isalnum() or c in "._-")
        if not safe_name:
            safe_name = "file"
        unique_filename = f"{uuid.uuid4()}_{safe_name}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        # Save file to local storage
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Could not save file to disk: {str(e)}"
            )

        # Save to database
        attachment = Attachment(
            entity_type=entity_type.upper(),
            entity_id=entity_id,
            file_name=filename,
            file_path=file_path,
            file_type=file.content_type,
            file_size=file_size
        )
        return attachment_repo.create(db, obj_in=attachment)

    @staticmethod
    def get_attachment(db: Session, attachment_id: uuid.UUID) -> Attachment:
        attachment = attachment_repo.get(db, attachment_id)
        if not attachment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Attachment with ID {attachment_id} not found."
            )
        return attachment

    @staticmethod
    def delete_attachment(db: Session, attachment_id: uuid.UUID) -> Attachment:
        attachment = AttachmentService.get_attachment(db, attachment_id)
        
        # Delete from local storage
        if os.path.exists(attachment.file_path):
            try:
                os.remove(attachment.file_path)
            except Exception as e:
                # We can log this but continue deleting database record
                pass

        # Delete database record
        attachment_repo.remove(db, id=attachment_id)
        return attachment

    @staticmethod
    def list_attachments(
        db: Session,
        entity_type: Optional[str] = None,
        entity_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 10
    ) -> tuple[List[Attachment], int]:
        filters = {}
        if entity_type:
            filters["entity_type"] = entity_type.upper()
        if entity_id:
            filters["entity_id"] = entity_id

        return attachment_repo.get_multi(
            db,
            page=page,
            page_size=page_size,
            filters=filters
        )
