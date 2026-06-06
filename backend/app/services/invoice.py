import uuid
import time
import random
from datetime import datetime, timezone
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories import invoice_repo, purchase_order_repo, user_repo
from app.models import Invoice
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate
from app.services.audit import AuditService
from app.services.notification import NotificationService
from app.services.pdf import PDFService
from app.services.email import EmailService

class InvoiceService:
    """
    Service managing invoice lifecycles, payments, PDFs, and email dispatch placeholders.
    """
    @staticmethod
    def generate_invoice_number(db: Session) -> str:
        for _ in range(10):
            num = f"INV-{time.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
            if not invoice_repo.get_by_invoice_number(db, invoice_number=num):
                return num
        return f"INV-{time.strftime('%Y%m%d')}-{random.randint(10000, 99999)}"

    @classmethod
    def generate_invoice(cls, db: Session, *, invoice_in: InvoiceCreate, current_user_id: uuid.UUID) -> Invoice:
        # Load PO
        po = purchase_order_repo.get(db, id=invoice_in.purchase_order_id)
        if not po:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase Order not found."
            )
        
        # Verify PO status
        if po.status not in ["ACCEPTED", "DELIVERED"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot generate invoice: Purchase Order status is {po.status}. It must be ACCEPTED or DELIVERED first."
            )

        # Generate Invoice Code
        invoice_num = cls.generate_invoice_number(db)

        # Create Invoice
        invoice = Invoice(
            invoice_number=invoice_num,
            purchase_order_id=po.id,
            total_amount=po.total_amount,
            due_date=invoice_in.due_date,
            status="UNPAID"
        )
        db_invoice = invoice_repo.create(db, obj_in=invoice)

        # PDF Generation
        try:
            pdf_path = PDFService.generate_invoice_pdf(db, db_invoice.id)
        except Exception as e:
            pdf_path = None
        
        # Email Sending
        if po.vendor and pdf_path:
            due_date_str = db_invoice.due_date.strftime("%Y-%m-%d") if db_invoice.due_date else "N/A"
            EmailService.send_invoice_notification(
                recipient_email=po.vendor.email,
                invoice_number=invoice_num,
                po_number=po.po_number,
                total_amount=float(db_invoice.total_amount),
                due_date=due_date_str,
                pdf_path=pdf_path
            )
            
            # Notify Vendor User if linked
            if po.vendor.user_id:
                NotificationService.create_notification(
                    db,
                    user_id=po.vendor.user_id,
                    title="Invoice Generated",
                    message=f"An invoice {invoice_num} has been issued for Purchase Order {po.po_number}."
                )

        # Notify PO Creator
        NotificationService.create_notification(
            db,
            user_id=po.created_by_id,
            title="Invoice Generated",
            message=f"Invoice {invoice_num} generated for Purchase Order {po.po_number}."
        )

        # Log Action
        AuditService.log_action(
            db,
            user_id=current_user_id,
            entity_type="Invoice",
            entity_id=db_invoice.id,
            action="Invoice Generated",
            new_value={"invoice_number": invoice_num, "total_amount": float(db_invoice.total_amount)}
        )

        return db_invoice

    @staticmethod
    def update_invoice(db: Session, *, invoice_id: uuid.UUID, invoice_in: InvoiceUpdate, current_user_id: uuid.UUID) -> Invoice:
        invoice = invoice_repo.get(db, id=invoice_id)
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found."
            )

        old_val = {"status": invoice.status}
        updated = invoice_repo.update(db, db_obj=invoice, obj_in=invoice_in)

        # Log Action
        AuditService.log_action(
            db,
            user_id=current_user_id,
            entity_type="Invoice",
            entity_id=updated.id,
            action="Invoice Updated",
            old_value=old_val,
            new_value={"status": updated.status}
        )

        return updated

    @staticmethod
    def get_invoice(db: Session, *, invoice_id: uuid.UUID) -> Invoice:
        invoice = invoice_repo.get(db, id=invoice_id)
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found."
            )
        return invoice

    @staticmethod
    def get_invoices(
        db: Session,
        *,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        sort: Optional[str] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[Invoice], int]:
        return invoice_repo.get_multi(
            db,
            page=page,
            page_size=page_size,
            search=search,
            search_fields=["invoice_number", "status"],
            sort=sort,
            filters=filters
        )

    # Placeholders
    @staticmethod
    def generate_invoice_pdf_placeholder(invoice_id: uuid.UUID) -> bytes:
        """
        Placeholder for PDF generation.
        Returns dummy PDF binary stream.
        """
        # print(f"[PDF Generation Placeholder] Generated PDF for invoice {invoice_id}")
        return b"%PDF-1.4 ... invoice metadata pdf representation placeholder bytes ..."

    @staticmethod
    def send_invoice_email_placeholder(email: str, invoice_number: str) -> None:
        """
        Placeholder for email dispatch.
        """
        # print(f"[Email Dispatch Placeholder] Dispatched invoice email for {invoice_number} to {email}")
        pass
