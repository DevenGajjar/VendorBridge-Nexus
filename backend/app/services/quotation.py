import uuid
import time
import random
from datetime import datetime, timezone
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status
from app.repositories import quotation_repo, quotation_item_repo, rfq_repo, rfq_item_repo, vendor_repo, user_repo
from app.models import Quotation, QuotationItem
from app.schemas.quotation import QuotationCreate, QuotationUpdate, QuotationComparisonResponse, ComparisonMatrixEntry, ComparisonItem
from app.services.audit import AuditService
from app.services.notification import NotificationService

class QuotationService:
    """
    Service to manage vendor quotations, line items, status changes, and comparison analytics.
    """
    @staticmethod
    def generate_quotation_number(db: Session) -> str:
        for _ in range(10):
            num = f"QT-{time.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
            if not quotation_repo.get_by_quotation_number(db, quotation_number=num):
                return num
        return f"QT-{time.strftime('%Y%m%d')}-{random.randint(10000, 99999)}"

    @classmethod
    def submit_quotation(cls, db: Session, *, quotation_in: QuotationCreate, current_vendor_user_id: uuid.UUID) -> Quotation:
        # Resolve vendor from user_id
        stmt = select(vendor_repo.model).where(vendor_repo.model.user_id == current_vendor_user_id)
        vendor = db.scalar(stmt)
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Current user is not associated with any registered vendor profile."
            )

        # Check RFQ
        rfq = rfq_repo.get(db, id=quotation_in.rfq_id)
        if not rfq:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="RFQ not found."
            )
        
        # Validate deadline
        now = datetime.now(timezone.utc) if rfq.deadline.tzinfo else datetime.utcnow()
        if rfq.deadline < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot submit quotation: RFQ deadline has passed."
            )

        # Calculate totals & validate items
        total_amount = 0.0
        quotation_items_to_create = []

        for item_in in quotation_in.items:
            rfq_item = rfq_item_repo.get(db, id=item_in.rfq_item_id)
            if not rfq_item or rfq_item.rfq_id != rfq.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid RFQ item ID {item_in.rfq_item_id}."
                )
            
            line_total = item_in.unit_price * rfq_item.quantity
            total_amount += line_total
            
            quotation_items_to_create.append((rfq_item, item_in.unit_price, line_total))

        # Create Quotation
        qt_num = cls.generate_quotation_number(db)
        quotation = Quotation(
            quotation_number=qt_num,
            rfq_id=rfq.id,
            vendor_id=vendor.id,
            delivery_days=quotation_in.delivery_days,
            status="SUBMITTED",
            total_amount=total_amount,
            submitted_at=datetime.utcnow()
        )
        db_quotation = quotation_repo.create(db, obj_in=quotation)

        # Create Quotation Items
        for rfq_item, unit_price, total_price in quotation_items_to_create:
            q_item = QuotationItem(
                quotation_id=db_quotation.id,
                rfq_item_id=rfq_item.id,
                unit_price=unit_price,
                total_price=total_price
            )
            quotation_item_repo.create(db, obj_in=q_item)

        # Notify Procurement Officer (RFQ creator)
        NotificationService.create_notification(
            db,
            user_id=rfq.created_by_id,
            title="Quotation Submitted",
            message=f"Vendor {vendor.name} submitted quotation {qt_num} for RFQ {rfq.rfq_number}."
        )

        # Log Action
        AuditService.log_action(
            db,
            user_id=current_vendor_user_id,
            entity_type="Quotation",
            entity_id=db_quotation.id,
            action="Quotation Submitted",
            new_value={"quotation_number": qt_num, "total_amount": total_amount}
        )

        return db_quotation

    @staticmethod
    def update_quotation(db: Session, *, quotation_id: uuid.UUID, quotation_in: QuotationUpdate, current_user_id: uuid.UUID) -> Quotation:
        quotation = quotation_repo.get(db, id=quotation_id)
        if not quotation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Quotation not found."
            )

        # Validate status change if present
        if quotation_in.status and quotation_in.status != quotation.status:
            allowed = {
                "SUBMITTED": ["UNDER_REVIEW", "ACCEPTED", "REJECTED"],
                "UNDER_REVIEW": ["ACCEPTED", "REJECTED"],
                "ACCEPTED": [],
                "REJECTED": []
            }
            if quotation_in.status not in allowed.get(quotation.status, []):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid quotation status transition from {quotation.status} to {quotation_in.status}."
                )

        old_val = {"status": quotation.status, "total_amount": float(quotation.total_amount)}
        updated = quotation_repo.update(db, db_obj=quotation, obj_in=quotation_in)

        # Log action
        AuditService.log_action(
            db,
            user_id=current_user_id,
            entity_type="Quotation",
            entity_id=updated.id,
            action="Quotation Updated",
            old_value=old_val,
            new_value={"status": updated.status, "total_amount": float(updated.total_amount)}
        )

        return updated

    @staticmethod
    def get_quotation(db: Session, *, quotation_id: uuid.UUID) -> Quotation:
        quotation = quotation_repo.get(db, id=quotation_id)
        if not quotation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Quotation not found."
            )
        return quotation

    @staticmethod
    def get_quotations(
        db: Session,
        *,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        sort: Optional[str] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[Quotation], int]:
        return quotation_repo.get_multi(
            db,
            page=page,
            page_size=page_size,
            search=search,
            search_fields=["quotation_number", "status"],
            sort=sort,
            filters=filters
        )

    @staticmethod
    def compare_quotations(db: Session, *, rfq_id: uuid.UUID) -> QuotationComparisonResponse:
        # Load RFQ
        rfq = rfq_repo.get(db, id=rfq_id)
        if not rfq:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="RFQ not found."
            )

        # Load all quotations for this RFQ
        stmt = select(Quotation).where(Quotation.rfq_id == rfq_id)
        quotations = list(db.scalars(stmt).all())

        if not quotations:
            return QuotationComparisonResponse(
                rfq_id=rfq_id,
                comparison_matrix=[]
            )

        # 1. Lowest Price Quotation
        lowest_price_q = min(quotations, key=lambda q: q.total_amount)

        # 2. Fastest Delivery Quotation
        fastest_delivery_q = min(quotations, key=lambda q: q.delivery_days)

        # 3. Highest Vendor Rating Quotation
        highest_rating_q = max(quotations, key=lambda q: q.vendor.rating if q.vendor else 0.0)

        # 4. Recommended Vendor/Quotation based on score logic
        # 60% price, 20% delivery, 20% rating
        min_price = float(lowest_price_q.total_amount)
        min_days = float(fastest_delivery_q.delivery_days)

        recommended_q = None
        best_score = -1.0

        for q in quotations:
            # Price Score: lower is better
            price_score = min_price / float(q.total_amount) if q.total_amount > 0 else 0.0
            
            # Delivery Score: lower is better
            delivery_score = min_days / float(q.delivery_days) if q.delivery_days > 0 else 0.0
            
            # Rating Score: higher is better (normalized by max rating 5.0)
            rating_score = (q.vendor.rating / 5.0) if q.vendor and q.vendor.rating else 0.0

            combined_score = (0.6 * price_score) + (0.2 * delivery_score) + (0.2 * rating_score)
            
            if combined_score > best_score:
                best_score = combined_score
                recommended_q = q

        # 5. Build Comparison Matrix
        matrix = []
        for rfq_item in rfq.items:
            quotes_for_item = []
            for q in quotations:
                # Find matching quotation item
                q_item = next((qi for qi in q.items if qi.rfq_item_id == rfq_item.id), None)
                if q_item:
                    quotes_for_item.append(
                        ComparisonItem(
                            vendor_name=q.vendor.name if q.vendor else "Unknown",
                            vendor_rating=q.vendor.rating if q.vendor else 0.0,
                            unit_price=float(q_item.unit_price),
                            total_price=float(q_item.total_price),
                            delivery_days=q.delivery_days
                        )
                    )
            matrix.append(
                ComparisonMatrixEntry(
                    rfq_item_id=rfq_item.id,
                    item_name=rfq_item.item_name,
                    quantity=rfq_item.quantity,
                    quotes=quotes_for_item
                )
            )

        return QuotationComparisonResponse(
            rfq_id=rfq_id,
            lowest_price_quotation=lowest_price_q,
            fastest_delivery_quotation=fastest_delivery_q,
            highest_rating_vendor_quotation=highest_rating_q,
            recommended_quotation=recommended_q,
            comparison_matrix=matrix
        )
