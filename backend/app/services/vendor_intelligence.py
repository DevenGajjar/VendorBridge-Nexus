import uuid
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.repositories import vendor_repo
from app.models import Vendor, Quotation, QuotationItem, RFQItem, RFQVendor

class VendorIntelligenceService:
    @staticmethod
    def calculate_vendor_intelligence(db: Session, vendor_id: uuid.UUID) -> Dict[str, Any]:
        vendor = vendor_repo.get(db, vendor_id)
        if not vendor:
            raise ValueError(f"Vendor with ID {vendor_id} not found.")

        # 1. Price Competitiveness (price_score)
        # We look at the unit price of items quoted by this vendor compared to other bids or the target price.
        quotation_stmt = select(Quotation.id).where(Quotation.vendor_id == vendor_id)
        quotation_ids = db.scalars(quotation_stmt).all()

        price_scores = []
        if quotation_ids:
            for q_id in quotation_ids:
                # Find all quotation items
                items = db.scalars(select(QuotationItem).where(QuotationItem.quotation_id == q_id)).all()
                for item in items:
                    rfq_item = db.get(RFQItem, item.rfq_item_id)
                    if not rfq_item:
                        continue
                    
                    # Get average price for this rfq_item from all vendors
                    avg_stmt = select(func.avg(QuotationItem.unit_price)).where(QuotationItem.rfq_item_id == item.rfq_item_id)
                    avg_price = db.scalar(avg_stmt)
                    
                    if avg_price and float(item.unit_price) > 0:
                        ratio = float(avg_price) / float(item.unit_price)
                        # Normalize: ratio of 1.0 -> 85 points. Lower price -> more points. Higher price -> fewer.
                        score = min(100.0, max(30.0, ratio * 85.0))
                        price_scores.append(score)
                    elif rfq_item.target_price and float(item.unit_price) > 0:
                        # Fallback to target price
                        ratio = float(rfq_item.target_price) / float(item.unit_price)
                        score = min(100.0, max(30.0, ratio * 85.0))
                        price_scores.append(score)
        
        price_score = round(sum(price_scores) / len(price_scores), 1) if price_scores else 75.0

        # 2. Delivery Speed (delivery_score)
        # Average delivery days from submitted quotations
        delivery_stmt = select(func.avg(Quotation.delivery_days)).where(Quotation.vendor_id == vendor_id)
        avg_delivery = db.scalar(delivery_stmt)
        
        if avg_delivery is not None:
            # Let's say <= 3 days is 100, 15 days is 60, >25 days is 40.
            days = float(avg_delivery)
            delivery_score = round(max(30.0, min(100.0, 100.0 - (days - 3.0) * 3.0)), 1)
        else:
            delivery_score = 75.0

        # 3. Approval Success Rate (approval_success_rate)
        # Number of ACCEPTED quotations / Total quotations
        total_q_stmt = select(func.count(Quotation.id)).where(Quotation.vendor_id == vendor_id)
        total_q = db.scalar(total_q_stmt) or 0
        
        if total_q > 0:
            accepted_q_stmt = select(func.count(Quotation.id)).where(
                Quotation.vendor_id == vendor_id, 
                Quotation.status == "ACCEPTED"
            )
            accepted_q = db.scalar(accepted_q_stmt) or 0
            approval_success_rate = round((accepted_q / total_q) * 100.0, 1)
        else:
            approval_success_rate = 80.0

        # 4. Response Rate (response_rate)
        # Number of submitted quotations / Number of RFQ invites
        invites_stmt = select(func.count(RFQVendor.id)).where(RFQVendor.vendor_id == vendor_id)
        total_invites = db.scalar(invites_stmt) or 0
        
        if total_invites > 0:
            # How many invitations have a corresponding quotation submitted
            response_rate = round(min(100.0, (total_q / total_invites) * 100.0), 1)
        else:
            response_rate = 90.0

        # 5. Vendor Rating (vendor_rating)
        # Directly from database
        vendor_rating = vendor.rating or 0.0
        rating_score = vendor_rating * 20.0  # Convert 0-5 to 0-100

        # 6. Overall Vendor Score
        # Weighting: Price (30%), Delivery (20%), Approval Success (20%), Response Rate (15%), Rating (15%)
        overall_score = (
            (price_score * 0.3) +
            (delivery_score * 0.2) +
            (approval_success_rate * 0.2) +
            (response_rate * 0.15) +
            (rating_score * 0.15)
        )
        overall_score = round(overall_score, 1)

        # Recommendation logic
        if overall_score >= 90.0:
            recommendation = "Preferred Vendor"
        elif overall_score >= 75.0:
            recommendation = "Approved Vendor"
        elif overall_score >= 50.0:
            recommendation = "Conditional Vendor"
        else:
            recommendation = "Under Review"

        return {
            "vendor_id": vendor.id,
            "vendor_name": vendor.name,
            "overall_score": overall_score,
            "price_score": price_score,
            "delivery_score": delivery_score,
            "approval_success_rate": approval_success_rate,
            "response_rate": response_rate,
            "vendor_rating": vendor_rating,
            "recommendation": recommendation
        }

    @staticmethod
    def get_vendor_rankings(db: Session) -> List[Dict[str, Any]]:
        # Get all vendors
        vendors = db.scalars(select(Vendor)).all()
        rankings = []
        for vendor in vendors:
            try:
                intel = VendorIntelligenceService.calculate_vendor_intelligence(db, vendor.id)
                rankings.append(intel)
            except Exception:
                continue
        # Sort by overall_score descending
        rankings.sort(key=lambda x: x["overall_score"], reverse=True)
        return rankings
