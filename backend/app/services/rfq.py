import uuid
import time
import random
from datetime import datetime, timezone
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories import rfq_repo, rfq_item_repo, rfq_vendor_repo, vendor_repo
from app.models import RFQ, RFQItem, RFQVendor
from app.schemas.rfq import RFQCreate, RFQUpdate
from app.services.audit import AuditService
from app.services.notification import NotificationService
from app.services.email import EmailService

class RFQService:
    """
    Service to manage RFQs, items, vendor assignments, and status lifecycles.
    """
    @staticmethod
    def generate_rfq_number(db: Session) -> str:
        for _ in range(10):
            # Format: RFQ-YYYYMMDD-XXXX
            num = f"RFQ-{time.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
            if not rfq_repo.get_by_rfq_number(db, rfq_number=num):
                return num
        return f"RFQ-{time.strftime('%Y%m%d')}-{random.randint(10000, 99999)}"

    @classmethod
    def create_rfq(cls, db: Session, *, rfq_in: RFQCreate, current_user_id: uuid.UUID) -> RFQ:
        # Validate deadline
        now = datetime.now(timezone.utc) if rfq_in.deadline.tzinfo else datetime.utcnow()
        if rfq_in.deadline < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="RFQ deadline must be in the future."
            )

        # Generate number
        rfq_num = cls.generate_rfq_number(db)

        # Create RFQ
        rfq = RFQ(
            rfq_number=rfq_num,
            title=rfq_in.title,
            description=rfq_in.description,
            deadline=rfq_in.deadline,
            status="DRAFT",
            created_by_id=current_user_id
        )
        db_rfq = rfq_repo.create(db, obj_in=rfq)

        # Create RFQ Items
        for item in rfq_in.items:
            rfq_item = RFQItem(
                rfq_id=db_rfq.id,
                item_name=item.item_name,
                description=item.description,
                quantity=item.quantity,
                target_price=item.target_price
            )
            rfq_item_repo.create(db, obj_in=rfq_item)

        # Assign Vendors if any
        if rfq_in.assigned_vendors:
            for vendor_id in rfq_in.assigned_vendors:
                vendor = vendor_repo.get(db, id=vendor_id)
                if not vendor:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND, 
                        detail=f"Vendor with ID {vendor_id} not found."
                    )
                rfq_v = RFQVendor(rfq_id=db_rfq.id, vendor_id=vendor_id)
                rfq_vendor_repo.create(db, obj_in=rfq_v)

                # Send RFQ Invitation email
                try:
                    item_names = [item.item_name for item in db_rfq.items]
                    deadline_str = db_rfq.deadline.strftime("%Y-%m-%d %H:%M") if db_rfq.deadline else "N/A"
                    EmailService.send_rfq_invitation(
                        recipient_email=vendor.email,
                        vendor_name=vendor.name,
                        rfq_number=rfq_num,
                        rfq_title=db_rfq.title,
                        deadline=deadline_str,
                        items=item_names
                    )
                except Exception as e:
                    pass

                # Notify Vendor User if linked
                if vendor.user_id:
                    NotificationService.create_notification(
                        db,
                        user_id=vendor.user_id,
                        title="New RFQ Assigned",
                        message=f"You have been assigned to bid on RFQ {rfq_num}: {db_rfq.title}."
                    )

        # Log action
        AuditService.log_action(
            db,
            user_id=current_user_id,
            entity_type="RFQ",
            entity_id=db_rfq.id,
            action="RFQ Created",
            new_value={"rfq_number": db_rfq.rfq_number, "title": db_rfq.title}
        )

        return db_rfq

    @staticmethod
    def update_rfq(db: Session, *, rfq_id: uuid.UUID, rfq_in: RFQUpdate, current_user_id: uuid.UUID) -> RFQ:
        rfq = rfq_repo.get(db, id=rfq_id)
        if not rfq:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="RFQ not found."
            )

        # Validate deadline
        if rfq_in.deadline:
            now = datetime.now(timezone.utc) if rfq_in.deadline.tzinfo else datetime.utcnow()
            if rfq_in.deadline < now:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="RFQ deadline must be in the future."
                )

        # Validate status change if present
        if rfq_in.status and rfq_in.status != rfq.status:
            allowed = {
                "DRAFT": ["SENT"],
                "SENT": ["CLOSED"],
                "CLOSED": []
            }
            if rfq_in.status not in allowed.get(rfq.status, []):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid RFQ status transition from {rfq.status} to {rfq_in.status}."
                )

        old_val = {"title": rfq.title, "status": rfq.status}
        updated = rfq_repo.update(db, db_obj=rfq, obj_in=rfq_in)

        # Log action
        AuditService.log_action(
            db,
            user_id=current_user_id,
            entity_type="RFQ",
            entity_id=updated.id,
            action="RFQ Updated",
            old_value=old_val,
            new_value={"title": updated.title, "status": updated.status}
        )

        return updated

    @staticmethod
    def delete_rfq(db: Session, *, rfq_id: uuid.UUID, current_user_id: uuid.UUID) -> RFQ:
        rfq = rfq_repo.get(db, id=rfq_id)
        if not rfq:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="RFQ not found."
            )

        # Log action before deletion
        AuditService.log_action(
            db,
            user_id=current_user_id,
            entity_type="RFQ",
            entity_id=rfq_id,
            action="RFQ Deleted",
            old_value={"rfq_number": rfq.rfq_number, "title": rfq.title}
        )
        return rfq_repo.remove(db, id=rfq_id)

    @staticmethod
    def get_rfq(db: Session, *, rfq_id: uuid.UUID) -> RFQ:
        rfq = rfq_repo.get(db, id=rfq_id)
        if not rfq:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="RFQ not found."
            )
        return rfq

    @staticmethod
    def get_rfqs(
        db: Session,
        *,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        sort: Optional[str] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[RFQ], int]:
        return rfq_repo.get_multi(
            db,
            page=page,
            page_size=page_size,
            search=search,
            search_fields=["title", "rfq_number", "description"],
            sort=sort,
            filters=filters
        )
