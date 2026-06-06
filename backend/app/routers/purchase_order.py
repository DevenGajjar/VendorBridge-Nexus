import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderResponse
from app.schemas.base import APIResponse, PaginatedResponse, PaginatedData, PaginationMeta
from app.services.purchase_order import PurchaseOrderService
from app.core.deps import get_current_user, RoleChecker
from app.models import User

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])

@router.post(
    "", 
    response_model=APIResponse[PurchaseOrderResponse], 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RoleChecker(["ADMIN", "PROCUREMENT_OFFICER"]))]
)
def generate_purchase_order(
    po_in: PurchaseOrderCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Generate a new Purchase Order from an accepted vendor quotation. Restricted to ADMIN and PROCUREMENT_OFFICER.
    """
    po = PurchaseOrderService.generate_purchase_order(db, po_in=po_in, current_user_id=current_user.id)
    return APIResponse(
        success=True,
        message="Purchase Order generated successfully.",
        data=PurchaseOrderResponse.model_validate(po)
    )

@router.put(
    "/{po_id}", 
    response_model=APIResponse[PurchaseOrderResponse],
    dependencies=[Depends(RoleChecker(["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"]))]
)
def update_purchase_order(
    po_id: uuid.UUID, 
    po_in: PurchaseOrderUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Update PO details or track status transition. Restricted to ADMIN, PROCUREMENT_OFFICER, and VENDOR.
    """
    po = PurchaseOrderService.update_purchase_order(
        db, 
        po_id=po_id, 
        po_in=po_in, 
        current_user_id=current_user.id
    )
    return APIResponse(
        success=True,
        message="Purchase Order updated successfully.",
        data=PurchaseOrderResponse.model_validate(po)
    )

@router.get("/{po_id}", response_model=APIResponse[PurchaseOrderResponse])
def get_purchase_order(po_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get detailed Purchase Order information by ID.
    """
    po = PurchaseOrderService.get_purchase_order(db, po_id=po_id)
    return APIResponse(
        success=True,
        message="Purchase Order retrieved successfully.",
        data=PurchaseOrderResponse.model_validate(po)
    )

@router.get("", response_model=PaginatedResponse[PurchaseOrderResponse])
def list_purchase_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    sort: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    vendor_id: Optional[uuid.UUID] = Query(None, alias="vendor_id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List Purchase Orders with search, filters, pagination, and sorting.
    """
    filters = {}
    if status_filter:
        filters["status"] = status_filter
    if vendor_id:
        filters["vendor_id"] = vendor_id

    items, total = PurchaseOrderService.get_purchase_orders(
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
        message="Purchase Orders listed successfully.",
        data=PaginatedData(
            items=[PurchaseOrderResponse.model_validate(x) for x in items],
            meta=PaginationMeta(
                total_count=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages
            )
        )
    )
