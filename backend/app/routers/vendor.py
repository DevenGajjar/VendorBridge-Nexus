import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.vendor import VendorCreate, VendorUpdate, VendorResponse, VendorIntelligenceResponse
from app.schemas.vendor_category import VendorCategoryResponse
from app.schemas.base import APIResponse, PaginatedResponse, PaginatedData, PaginationMeta
from app.services.vendor import VendorService
from app.services.vendor_intelligence import VendorIntelligenceService
from app.core.deps import get_current_user, RoleChecker
from app.models import User, VendorCategory

router = APIRouter(prefix="/vendors", tags=["Vendor Management"])

@router.post(
    "", 
    response_model=APIResponse[VendorResponse], 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RoleChecker(["ADMIN", "PROCUREMENT_OFFICER"]))]
)
def create_vendor(
    vendor_in: VendorCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Create a new vendor profile. Restricted to ADMIN and PROCUREMENT_OFFICER.
    """
    vendor = VendorService.create_vendor(db, vendor_in=vendor_in, current_user_id=current_user.id)
    return APIResponse(
        success=True,
        message="Vendor created successfully.",
        data=VendorResponse.model_validate(vendor)
    )

@router.put(
    "/{vendor_id}", 
    response_model=APIResponse[VendorResponse],
    dependencies=[Depends(RoleChecker(["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"]))]
)
def update_vendor(
    vendor_id: uuid.UUID, 
    vendor_in: VendorUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing vendor profile. Restricted to ADMIN, PROCUREMENT_OFFICER, and VENDOR.
    """
    vendor = VendorService.update_vendor(
        db, 
        vendor_id=vendor_id, 
        vendor_in=vendor_in, 
        current_user_id=current_user.id
    )
    return APIResponse(
        success=True,
        message="Vendor updated successfully.",
        data=VendorResponse.model_validate(vendor)
    )

@router.delete(
    "/{vendor_id}", 
    response_model=APIResponse[VendorResponse],
    dependencies=[Depends(RoleChecker(["ADMIN"]))]
)
def delete_vendor(
    vendor_id: uuid.UUID, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Remove a vendor profile. Restricted to ADMIN.
    """
    vendor = VendorService.delete_vendor(db, vendor_id=vendor_id, current_user_id=current_user.id)
    return APIResponse(
        success=True,
        message="Vendor deleted successfully.",
        data=VendorResponse.model_validate(vendor)
    )

@router.get("/categories", response_model=APIResponse[List[VendorCategoryResponse]])
def list_vendor_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all vendor categories.
    """
    from sqlalchemy import select
    categories = db.scalars(select(VendorCategory).order_by(VendorCategory.name)).all()
    return APIResponse(
        success=True,
        message="Vendor categories retrieved successfully.",
        data=[VendorCategoryResponse.model_validate(c) for c in categories]
    )

@router.get("/{vendor_id}", response_model=APIResponse[VendorResponse])
def get_vendor(vendor_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get detailed vendor profile by ID.
    """
    vendor = VendorService.get_vendor(db, vendor_id=vendor_id)
    return APIResponse(
        success=True,
        message="Vendor retrieved successfully.",
        data=VendorResponse.model_validate(vendor)
    )

@router.get("", response_model=PaginatedResponse[VendorResponse])
def list_vendors(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    sort: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    category_id: Optional[uuid.UUID] = Query(None, alias="category_id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List, filter, and search vendors. Supports pagination and custom sorting.
    """
    filters = {}
    if status_filter:
        filters["status"] = status_filter
    if category_id:
        filters["category_id"] = category_id

    items, total = VendorService.get_vendors(
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
        message="Vendors listed successfully.",
        data=PaginatedData(
            items=[VendorResponse.model_validate(x) for x in items],
            meta=PaginationMeta(
                total_count=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages
            )
        )
    )

@router.get("/{vendor_id}/intelligence", response_model=APIResponse[VendorIntelligenceResponse])
def get_vendor_intelligence(
    vendor_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve dynamic vendor intelligence scores and performance recommendations.
    """
    try:
        intel = VendorIntelligenceService.calculate_vendor_intelligence(db, vendor_id)
        return APIResponse(
            success=True,
            message="Vendor intelligence calculated successfully.",
            data=VendorIntelligenceResponse.model_validate(intel)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
