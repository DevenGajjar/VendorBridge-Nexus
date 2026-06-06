import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.quotation import QuotationCreate, QuotationUpdate, QuotationResponse, QuotationComparisonResponse
from app.schemas.base import APIResponse, PaginatedResponse, PaginatedData, PaginationMeta
from app.services.quotation import QuotationService
from app.core.deps import get_current_user, RoleChecker
from app.models import User

router = APIRouter(prefix="/quotations", tags=["Quotation Management"])

@router.post(
    "", 
    response_model=APIResponse[QuotationResponse], 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RoleChecker(["VENDOR"]))]
)
def submit_quotation(
    quotation_in: QuotationCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Submit a quotation response to an RFQ. Restricted to VENDOR role.
    """
    quotation = QuotationService.submit_quotation(
        db, 
        quotation_in=quotation_in, 
        current_vendor_user_id=current_user.id
    )
    return APIResponse(
        success=True,
        message="Quotation submitted successfully.",
        data=QuotationResponse.model_validate(quotation)
    )

@router.put(
    "/{quotation_id}", 
    response_model=APIResponse[QuotationResponse],
    dependencies=[Depends(RoleChecker(["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"]))]
)
def update_quotation(
    quotation_id: uuid.UUID, 
    quotation_in: QuotationUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Update quotation details or change workflow status.
    """
    quotation = QuotationService.update_quotation(
        db, 
        quotation_id=quotation_id, 
        quotation_in=quotation_in, 
        current_user_id=current_user.id
    )
    return APIResponse(
        success=True,
        message="Quotation updated successfully.",
        data=QuotationResponse.model_validate(quotation)
    )

@router.get(
    "/compare", 
    response_model=APIResponse[QuotationComparisonResponse],
    dependencies=[Depends(RoleChecker(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"]))]
)
def compare_quotations(rfq_id: uuid.UUID = Query(...), db: Session = Depends(get_db)):
    """
    Compare quotation bids for a given RFQ. Evaluates lowest price, fastest delivery, highest rating, and recommendation score.
    """
    comparison = QuotationService.compare_quotations(db, rfq_id=rfq_id)
    return APIResponse(
        success=True,
        message="Quotations compared successfully.",
        data=comparison
    )

@router.get("/{quotation_id}", response_model=APIResponse[QuotationResponse])
def get_quotation(quotation_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Retrieve details of a specific quotation.
    """
    quotation = QuotationService.get_quotation(db, quotation_id=quotation_id)
    return APIResponse(
        success=True,
        message="Quotation retrieved successfully.",
        data=QuotationResponse.model_validate(quotation)
    )

@router.get("", response_model=PaginatedResponse[QuotationResponse])
def list_quotations(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    sort: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    vendor_id: Optional[uuid.UUID] = Query(None, alias="vendor_id"),
    rfq_id: Optional[uuid.UUID] = Query(None, alias="rfq_id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List quotations with filters and sorting.
    VENDORS only see their own quotations.
    """
    filters = {}
    if status_filter:
        filters["status"] = status_filter
    
    # Force vendor_id for VENDOR role
    if current_user.role and current_user.role.name == "VENDOR":
        from app.models import Vendor
        from sqlalchemy import select
        vendor = db.scalar(select(Vendor).where(Vendor.user_id == current_user.id))
        if vendor:
            filters["vendor_id"] = vendor.id
        else:
            return PaginatedResponse(
                success=True,
                message="No vendor profile linked to this user.",
                data=PaginatedData(items=[], meta=PaginationMeta(total_count=0, page=page, page_size=page_size, total_pages=0))
            )
    elif vendor_id:
        filters["vendor_id"] = vendor_id

    if rfq_id:
        filters["rfq_id"] = rfq_id

    items, total = QuotationService.get_quotations(
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
        message="Quotations listed successfully.",
        data=PaginatedData(
            items=[QuotationResponse.model_validate(x) for x in items],
            meta=PaginationMeta(
                total_count=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages
            )
        )
    )
