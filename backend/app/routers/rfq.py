import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.rfq import RFQCreate, RFQUpdate, RFQResponse
from app.schemas.base import APIResponse, PaginatedResponse, PaginatedData, PaginationMeta
from app.services.rfq import RFQService
from app.core.deps import get_current_user, RoleChecker
from app.models import User

router = APIRouter(prefix="/rfqs", tags=["RFQ Management"])

@router.post(
    "", 
    response_model=APIResponse[RFQResponse], 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RoleChecker(["ADMIN", "PROCUREMENT_OFFICER"]))]
)
def create_rfq(
    rfq_in: RFQCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Create a Request for Quotation (RFQ). Restricted to ADMIN and PROCUREMENT_OFFICER.
    """
    rfq = RFQService.create_rfq(db, rfq_in=rfq_in, current_user_id=current_user.id)
    return APIResponse(
        success=True,
        message="RFQ created successfully.",
        data=RFQResponse.model_validate(rfq)
    )

@router.put(
    "/{rfq_id}", 
    response_model=APIResponse[RFQResponse],
    dependencies=[Depends(RoleChecker(["ADMIN", "PROCUREMENT_OFFICER"]))]
)
def update_rfq(
    rfq_id: uuid.UUID, 
    rfq_in: RFQUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Update an RFQ details or transition its status. Restricted to ADMIN and PROCUREMENT_OFFICER.
    """
    rfq = RFQService.update_rfq(db, rfq_id=rfq_id, rfq_in=rfq_in, current_user_id=current_user.id)
    return APIResponse(
        success=True,
        message="RFQ updated successfully.",
        data=RFQResponse.model_validate(rfq)
    )

@router.delete(
    "/{rfq_id}", 
    response_model=APIResponse[RFQResponse],
    dependencies=[Depends(RoleChecker(["ADMIN", "PROCUREMENT_OFFICER"]))]
)
def delete_rfq(
    rfq_id: uuid.UUID, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Remove an RFQ. Restricted to ADMIN and PROCUREMENT_OFFICER.
    """
    rfq = RFQService.delete_rfq(db, rfq_id=rfq_id, current_user_id=current_user.id)
    return APIResponse(
        success=True,
        message="RFQ deleted successfully.",
        data=RFQResponse.model_validate(rfq)
    )

@router.get("/{rfq_id}", response_model=APIResponse[RFQResponse])
def get_rfq(rfq_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get details of a specific RFQ.
    """
    rfq = RFQService.get_rfq(db, rfq_id=rfq_id)
    return APIResponse(
        success=True,
        message="RFQ details retrieved.",
        data=RFQResponse.model_validate(rfq)
    )

@router.get("", response_model=PaginatedResponse[RFQResponse])
def list_rfqs(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    sort: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List RFQs with search, status filters, sorting, and pagination.
    """
    filters = {}
    if status_filter:
        filters["status"] = status_filter

    items, total = RFQService.get_rfqs(
        db,
        page=page,
        page_size=page_size,
        search=search,
        sort=sort,
        filters=filters
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return PaginatedResponse(
        success=True,
        message="RFQs listed successfully.",
        data=PaginatedData(
            items=[RFQResponse.model_validate(x) for x in items],
            meta=PaginationMeta(
                total_count=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages
            )
        )
    )
