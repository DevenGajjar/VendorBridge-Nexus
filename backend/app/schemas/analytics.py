from pydantic import BaseModel
from typing import List, Dict, Any
from app.schemas.vendor import VendorIntelligenceResponse

class MonthlySpendItem(BaseModel):
    month: str
    spend: float

class DashboardAnalyticsResponse(BaseModel):
    total_vendors: int
    active_vendors: int
    inactive_vendors: int
    total_rfqs: int
    pending_approvals: int
    total_purchase_orders: int
    total_invoices: int
    monthly_spend: List[MonthlySpendItem]
    vendor_performance_ranking: List[VendorIntelligenceResponse]
    top_vendors: List[VendorIntelligenceResponse]
