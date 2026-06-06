import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse
from app.schemas.base import APIResponse, PaginatedResponse, PaginatedData, PaginationMeta
from app.services.invoice import InvoiceService
from app.core.deps import get_current_user, RoleChecker
from app.models import User

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.post(
    "", 
    response_model=APIResponse[InvoiceResponse], 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RoleChecker(["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"]))]
)
def generate_invoice(
    invoice_in: InvoiceCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Generate an invoice from an accepted or delivered Purchase Order.
    """
    invoice = InvoiceService.generate_invoice(db, invoice_in=invoice_in, current_user_id=current_user.id)
    return APIResponse(
        success=True,
        message="Invoice generated successfully.",
        data=InvoiceResponse.model_validate(invoice)
    )

@router.put(
    "/{invoice_id}", 
    response_model=APIResponse[InvoiceResponse],
    dependencies=[Depends(RoleChecker(["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"]))]
)
def update_invoice(
    invoice_id: uuid.UUID, 
    invoice_in: InvoiceUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Update invoice status (e.g., mark as PAID).
    """
    invoice = InvoiceService.update_invoice(
        db, 
        invoice_id=invoice_id, 
        invoice_in=invoice_in, 
        current_user_id=current_user.id
    )
    return APIResponse(
        success=True,
        message="Invoice updated successfully.",
        data=InvoiceResponse.model_validate(invoice)
    )

@router.get("/{invoice_id}", response_model=APIResponse[InvoiceResponse])
def get_invoice(invoice_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get detailed invoice details by ID.
    """
    invoice = InvoiceService.get_invoice(db, invoice_id=invoice_id)
    return APIResponse(
        success=True,
        message="Invoice retrieved successfully.",
        data=InvoiceResponse.model_validate(invoice)
    )

@router.get("", response_model=PaginatedResponse[InvoiceResponse])
def list_invoices(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    sort: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List invoices with filters, pagination, and sorting.
    """
    filters = {}
    if status_filter:
        filters["status"] = status_filter

    items, total = InvoiceService.get_invoices(
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
        message="Invoices listed successfully.",
        data=PaginatedData(
            items=[InvoiceResponse.model_validate(x) for x in items],
            meta=PaginationMeta(
                total_count=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages
            )
        )
    )
