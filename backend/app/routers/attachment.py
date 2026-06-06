import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.attachment import AttachmentResponse
from app.schemas.base import APIResponse, PaginatedResponse, PaginatedData, PaginationMeta
from app.services.attachment import AttachmentService
from app.core.deps import get_current_user
from app.models import User

router = APIRouter(prefix="/attachments", tags=["Attachment Management"])

@router.post(
    "", 
    response_model=APIResponse[AttachmentResponse], 
    status_code=status.HTTP_201_CREATED
)
def upload_attachment(
    entity_type: str = Form(..., description="RFQ, QUOTATION, PURCHASE_ORDER, INVOICE"),
    entity_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload an attachment associated with a given entity.
    """
    attachment = AttachmentService.upload_attachment(
        db, 
        file=file, 
        entity_type=entity_type, 
        entity_id=entity_id
    )
    return APIResponse(
        success=True,
        message="Attachment uploaded successfully.",
        data=AttachmentResponse.model_validate(attachment)
    )

@router.get("/{attachment_id}", response_model=APIResponse[AttachmentResponse])
def get_attachment_metadata(
    attachment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve attachment metadata.
    """
    attachment = AttachmentService.get_attachment(db, attachment_id)
    return APIResponse(
        success=True,
        message="Attachment metadata retrieved successfully.",
        data=AttachmentResponse.model_validate(attachment)
    )

@router.get("/{attachment_id}/download")
def download_attachment_file(
    attachment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Download the actual attachment file.
    """
    attachment = AttachmentService.get_attachment(db, attachment_id)
    import os
    if not os.path.exists(attachment.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical file not found on disk."
        )
    return FileResponse(
        path=attachment.file_path,
        filename=attachment.file_name,
        media_type=attachment.file_type
    )

@router.delete("/{attachment_id}", response_model=APIResponse[AttachmentResponse])
def delete_attachment(
    attachment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete an attachment metadata and its physical file.
    """
    attachment = AttachmentService.delete_attachment(db, attachment_id)
    return APIResponse(
        success=True,
        message="Attachment deleted successfully.",
        data=AttachmentResponse.model_validate(attachment)
    )

@router.get("", response_model=PaginatedResponse[AttachmentResponse])
def list_attachments(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List and filter attachments.
    """
    items, total = AttachmentService.list_attachments(
        db,
        entity_type=entity_type,
        entity_id=entity_id,
        page=page,
        page_size=page_size
    )
    total_pages = (total + page_size - 1) // page_size
    return PaginatedResponse(
        success=True,
        message="Attachments retrieved successfully.",
        data=PaginatedData(
            items=[AttachmentResponse.model_validate(x) for x in items],
            meta=PaginationMeta(
                total_count=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages
            )
        )
    )
