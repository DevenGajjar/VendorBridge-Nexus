import uuid
import time
import random
from datetime import datetime, timezone
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories import purchase_order_repo, purchase_order_item_repo, quotation_repo, vendor_repo
from app.models import PurchaseOrder, PurchaseOrderItem
from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderUpdate
from app.services.audit import AuditService
from app.services.notification import NotificationService
from app.services.pdf import PDFService
from app.services.email import EmailService

class PurchaseOrderService:
    """
    Service managing PO creation, status management, and line items copy from accepted quotes.
    """
    @staticmethod
    def generate_po_number(db: Session) -> str:
        for _ in range(10):
            num = f"PO-{time.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
            if not purchase_order_repo.get_by_po_number(db, po_number=num):
                return num
        return f"PO-{time.strftime('%Y%m%d')}-{random.randint(10000, 99999)}"

    @classmethod
    def generate_purchase_order(cls, db: Session, *, po_in: PurchaseOrderCreate, current_user_id: uuid.UUID) -> PurchaseOrder:
        # Load quotation
        quotation = quotation_repo.get(db, id=po_in.quotation_id)
        if not quotation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quotation not found."
            )
        
        # Verify quotation is accepted
        if quotation.status != "ACCEPTED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot generate Purchase Order: Quotation status is {quotation.status}. It must be ACCEPTED first."
            )

        # Generate PO code
        po_num = cls.generate_po_number(db)

        # Create PO
        po = PurchaseOrder(
            po_number=po_num,
            quotation_id=quotation.id,
            vendor_id=quotation.vendor_id,
            status="SENT",
            total_amount=quotation.total_amount,
            delivery_date=po_in.delivery_date,
            created_by_id=current_user_id
        )
        db_po = purchase_order_repo.create(db, obj_in=po)

        # Copy items from quotation items
        for q_item in quotation.items:
            po_item = PurchaseOrderItem(
                purchase_order_id=db_po.id,
                item_name=q_item.rfq_item.item_name if q_item.rfq_item else "Item",
                quantity=q_item.rfq_item.quantity if q_item.rfq_item else 1,
                unit_price=q_item.unit_price,
                total_price=q_item.total_price
            )
            purchase_order_item_repo.create(db, obj_in=po_item)

        # PDF Generation
        try:
            pdf_path = PDFService.generate_purchase_order_pdf(db, db_po.id)
        except Exception as e:
            pdf_path = None

        # Notify Vendor via Email & System Notification
        vendor = vendor_repo.get(db, id=quotation.vendor_id)
        if vendor:
            if pdf_path:
                EmailService.send_purchase_order(
                    recipient_email=vendor.email,
                    vendor_name=vendor.name,
                    po_number=po_num,
                    total_amount=float(db_po.total_amount),
                    pdf_path=pdf_path
                )
            
            if vendor.user_id:
                NotificationService.create_notification(
                    db,
                    user_id=vendor.user_id,
                    title="Purchase Order Received",
                    message=f"You have received Purchase Order {po_num} for total amount {db_po.total_amount}."
                )

        # Log Action
        AuditService.log_action(
            db,
            user_id=current_user_id,
            entity_type="Purchase Order",
            entity_id=db_po.id,
            action="PO Generated",
            new_value={"po_number": po_num, "total_amount": float(db_po.total_amount)}
        )

        return db_po

    @staticmethod
    def update_purchase_order(db: Session, *, po_id: uuid.UUID, po_in: PurchaseOrderUpdate, current_user_id: uuid.UUID) -> PurchaseOrder:
        po = purchase_order_repo.get(db, id=po_id)
        if not po:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase Order not found."
            )

        if po_in.status and po_in.status != po.status:
            allowed = {
                "DRAFT": ["SENT", "CANCELLED"],
                "SENT": ["ACCEPTED", "CANCELLED"],
                "ACCEPTED": ["DELIVERED", "CANCELLED"],
                "DELIVERED": [],
                "CANCELLED": []
            }
            if po_in.status not in allowed.get(po.status, []):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid PO status transition from {po.status} to {po_in.status}."
                )

        old_val = {"status": po.status}
        updated = purchase_order_repo.update(db, db_obj=po, obj_in=po_in)

        # Log Action
        AuditService.log_action(
            db,
            user_id=current_user_id,
            entity_type="Purchase Order",
            entity_id=updated.id,
            action="PO Updated",
            old_value=old_val,
            new_value={"status": updated.status}
        )

        return updated

    @staticmethod
    def get_purchase_order(db: Session, *, po_id: uuid.UUID) -> PurchaseOrder:
        po = purchase_order_repo.get(db, id=po_id)
        if not po:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase Order not found."
            )
        return po

    @staticmethod
    def get_purchase_orders(
        db: Session,
        *,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        sort: Optional[str] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[PurchaseOrder], int]:
        return purchase_order_repo.get_multi(
            db,
            page=page,
            page_size=page_size,
            search=search,
            search_fields=["po_number", "status"],
            sort=sort,
            filters=filters
        )
