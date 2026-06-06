from typing import Optional, Any, List
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models import (
    Role, User, VendorCategory, Vendor, RFQ, RFQItem, RFQVendor,
    Quotation, QuotationItem, ApprovalRequest, PurchaseOrder,
    PurchaseOrderItem, Invoice, Notification, AuditLog, Attachment
)

class UserRepository(BaseRepository[User]):
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.scalars(select(self.model).where(self.model.email == email)).first()

class VendorRepository(BaseRepository[Vendor]):
    def get_by_vendor_code(self, db: Session, vendor_code: str) -> Optional[Vendor]:
        return db.scalars(select(self.model).where(self.model.vendor_code == vendor_code)).first()

    def get_by_gst_number(self, db: Session, gst_number: str) -> Optional[Vendor]:
        return db.scalars(select(self.model).where(self.model.gst_number == gst_number)).first()

class RFQRepository(BaseRepository[RFQ]):
    def get_by_rfq_number(self, db: Session, rfq_number: str) -> Optional[RFQ]:
        return db.scalars(select(self.model).where(self.model.rfq_number == rfq_number)).first()

class QuotationRepository(BaseRepository[Quotation]):
    def get_by_quotation_number(self, db: Session, quotation_number: str) -> Optional[Quotation]:
        return db.scalars(select(self.model).where(self.model.quotation_number == quotation_number)).first()

class PurchaseOrderRepository(BaseRepository[PurchaseOrder]):
    def get_by_po_number(self, db: Session, po_number: str) -> Optional[PurchaseOrder]:
        return db.scalars(select(self.model).where(self.model.po_number == po_number)).first()

class InvoiceRepository(BaseRepository[Invoice]):
    def get_by_invoice_number(self, db: Session, invoice_number: str) -> Optional[Invoice]:
        return db.scalars(select(self.model).where(self.model.invoice_number == invoice_number)).first()

class AttachmentRepository(BaseRepository[Attachment]):
    def get_by_entity(self, db: Session, entity_type: str, entity_id: Any) -> List[Attachment]:
        return list(db.scalars(select(self.model).where(self.model.entity_type == entity_type, self.model.entity_id == entity_id)).all())

# Repository Instances
role_repo = BaseRepository[Role](Role)
user_repo = UserRepository(User)
vendor_category_repo = BaseRepository[VendorCategory](VendorCategory)
vendor_repo = VendorRepository(Vendor)
rfq_repo = RFQRepository(RFQ)
rfq_item_repo = BaseRepository[RFQItem](RFQItem)
rfq_vendor_repo = BaseRepository[RFQVendor](RFQVendor)
quotation_repo = QuotationRepository(Quotation)
quotation_item_repo = BaseRepository[QuotationItem](QuotationItem)
approval_request_repo = BaseRepository[ApprovalRequest](ApprovalRequest)
purchase_order_repo = PurchaseOrderRepository(PurchaseOrder)
purchase_order_item_repo = BaseRepository[PurchaseOrderItem](PurchaseOrderItem)
invoice_repo = InvoiceRepository(Invoice)
notification_repo = BaseRepository[Notification](Notification)
audit_log_repo = BaseRepository[AuditLog](AuditLog)
attachment_repo = AttachmentRepository(Attachment)

__all__ = [
    "role_repo",
    "user_repo",
    "vendor_category_repo",
    "vendor_repo",
    "rfq_repo",
    "rfq_item_repo",
    "rfq_vendor_repo",
    "quotation_repo",
    "quotation_item_repo",
    "approval_request_repo",
    "purchase_order_repo",
    "purchase_order_item_repo",
    "invoice_repo",
    "notification_repo",
    "audit_log_repo",
    "attachment_repo",
]
