import uuid
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.models import Vendor, RFQ, ApprovalRequest, PurchaseOrder, Invoice
from app.services.vendor_intelligence import VendorIntelligenceService

class AnalyticsService:
    @staticmethod
    def get_dashboard_analytics(db: Session) -> Dict[str, Any]:
        # 1. Vendor Counts
        total_vendors = db.scalar(select(func.count(Vendor.id))) or 0
        active_vendors = db.scalar(select(func.count(Vendor.id)).where(Vendor.status == "APPROVED")) or 0
        inactive_vendors = total_vendors - active_vendors

        # 2. RFQ Counts
        total_rfqs = db.scalar(select(func.count(RFQ.id))) or 0

        # 3. Pending Approvals
        pending_approvals = db.scalar(select(func.count(ApprovalRequest.id)).where(ApprovalRequest.status == "PENDING")) or 0

        # 4. Purchase Orders
        total_pos = db.scalar(select(func.count(PurchaseOrder.id))) or 0

        # 5. Invoices
        total_invoices = db.scalar(select(func.count(Invoice.id))) or 0

        # 6. Monthly Spend (Grouped by YYYY-MM)
        # Using to_char on PostgreSQL
        spend_stmt = select(
            func.to_char(PurchaseOrder.created_at, "YYYY-MM").label("month"),
            func.sum(PurchaseOrder.total_amount).label("spend")
        ).group_by(
            func.to_char(PurchaseOrder.created_at, "YYYY-MM")
        ).order_by(
            func.to_char(PurchaseOrder.created_at, "YYYY-MM")
        )
        
        spend_results = db.execute(spend_stmt).all()
        monthly_spend = [
            {"month": row.month, "spend": float(row.spend or 0.0)}
            for row in spend_results if row.month is not None
        ]

        # 7. Vendor Performance Ranking & Top Vendors
        rankings = VendorIntelligenceService.get_vendor_rankings(db)
        top_vendors = rankings[:5]  # Top 5 vendors

        return {
            "total_vendors": total_vendors,
            "active_vendors": active_vendors,
            "inactive_vendors": inactive_vendors,
            "total_rfqs": total_rfqs,
            "pending_approvals": pending_approvals,
            "total_purchase_orders": total_pos,
            "total_invoices": total_invoices,
            "monthly_spend": monthly_spend,
            "vendor_performance_ranking": rankings,
            "top_vendors": top_vendors
        }
