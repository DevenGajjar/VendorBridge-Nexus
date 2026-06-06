import uuid
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories import vendor_repo, vendor_category_repo
from app.models import Vendor
from app.schemas.vendor import VendorCreate, VendorUpdate
from app.services.audit import AuditService

class VendorService:
    """
    Service to manage vendors and categories with validations.
    """
    @staticmethod
    def create_vendor(db: Session, *, vendor_in: VendorCreate, current_user_id: Optional[uuid.UUID] = None) -> Vendor:
        # Check uniqueness
        if vendor_repo.get_by_vendor_code(db, vendor_code=vendor_in.vendor_code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Vendor code already exists."
            )
        if vendor_repo.get_by_gst_number(db, gst_number=vendor_in.gst_number):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="GST number already exists."
            )

        # Check category
        if not vendor_category_repo.get(db, id=vendor_in.category_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Vendor category not found."
            )

        vendor = Vendor(
            name=vendor_in.name,
            vendor_code=vendor_in.vendor_code,
            email=vendor_in.email,
            phone=vendor_in.phone,
            address=vendor_in.address,
            gst_number=vendor_in.gst_number,
            rating=vendor_in.rating,
            category_id=vendor_in.category_id,
            status=vendor_in.status,
            user_id=vendor_in.user_id
        )
        created = vendor_repo.create(db, obj_in=vendor)

        # Log action
        AuditService.log_action(
            db,
            user_id=current_user_id,
            entity_type="Vendor",
            entity_id=created.id,
            action="Vendor Created",
            new_value={"name": created.name, "vendor_code": created.vendor_code}
        )
        return created

    @staticmethod
    def update_vendor(db: Session, *, vendor_id: uuid.UUID, vendor_in: VendorUpdate, current_user_id: Optional[uuid.UUID] = None) -> Vendor:
        vendor = vendor_repo.get(db, id=vendor_id)
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Vendor not found."
            )

        # Check constraints if updating code/gst
        if vendor_in.vendor_code and vendor_in.vendor_code != vendor.vendor_code:
            if vendor_repo.get_by_vendor_code(db, vendor_code=vendor_in.vendor_code):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="Vendor code already exists."
                )
        if vendor_in.gst_number and vendor_in.gst_number != vendor.gst_number:
            if vendor_repo.get_by_gst_number(db, gst_number=vendor_in.gst_number):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="GST number already exists."
                )

        if vendor_in.category_id and vendor_in.category_id != vendor.category_id:
            if not vendor_category_repo.get(db, id=vendor_in.category_id):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, 
                    detail="Vendor category not found."
                )

        old_val = {"name": vendor.name, "vendor_code": vendor.vendor_code, "status": vendor.status}
        updated = vendor_repo.update(db, db_obj=vendor, obj_in=vendor_in)

        # Log action
        AuditService.log_action(
            db,
            user_id=current_user_id,
            entity_type="Vendor",
            entity_id=updated.id,
            action="Vendor Updated",
            old_value=old_val,
            new_value={"name": updated.name, "vendor_code": updated.vendor_code, "status": updated.status}
        )
        return updated

    @staticmethod
    def delete_vendor(db: Session, *, vendor_id: uuid.UUID, current_user_id: Optional[uuid.UUID] = None) -> Vendor:
        vendor = vendor_repo.get(db, id=vendor_id)
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Vendor not found."
            )
        
        # Log action before removal
        AuditService.log_action(
            db,
            user_id=current_user_id,
            entity_type="Vendor",
            entity_id=vendor_id,
            action="Vendor Deleted",
            old_value={"name": vendor.name, "vendor_code": vendor.vendor_code}
        )
        return vendor_repo.remove(db, id=vendor_id)

    @staticmethod
    def get_vendor(db: Session, *, vendor_id: uuid.UUID) -> Vendor:
        vendor = vendor_repo.get(db, id=vendor_id)
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Vendor not found."
            )
        return vendor

    @staticmethod
    def get_vendors(
        db: Session,
        *,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        sort: Optional[str] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[Vendor], int]:
        return vendor_repo.get_multi(
            db,
            page=page,
            page_size=page_size,
            search=search,
            search_fields=["name", "vendor_code", "email", "gst_number"],
            sort=sort,
            filters=filters
        )
