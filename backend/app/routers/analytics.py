from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.analytics import DashboardAnalyticsResponse
from app.schemas.base import APIResponse
from app.services.analytics import AnalyticsService
from app.core.deps import get_current_user
from app.models import User

router = APIRouter(prefix="/analytics", tags=["Analytics & Dashboard"])

@router.get("/dashboard", response_model=APIResponse[DashboardAnalyticsResponse])
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve comprehensive ERP analytics and KPIs for the dashboard.
    """
    data = AnalyticsService.get_dashboard_analytics(db)
    return APIResponse(
        success=True,
        message="Dashboard analytics compiled successfully.",
        data=DashboardAnalyticsResponse.model_validate(data)
    )
