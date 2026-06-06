import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.audit_log import AuditLogResponse
from app.schemas.base import PaginatedResponse, PaginatedData, PaginationMeta
from app.core.deps import get_current_user, RoleChecker
from app.repositories import audit_log_repo
from app.models import User

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get(
    "", 
    response_model=PaginatedResponse[AuditLogResponse],
    dependencies=[Depends(RoleChecker(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"]))]
)
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    sort: Optional[str] = None,
    entity_type: Optional[str] = Query(None, alias="entity_type"),
    entity_id: Optional[uuid.UUID] = Query(None, alias="entity_id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List audit logs. Restricted to ADMIN, PROCUREMENT_OFFICER, and MANAGER.
    """
    filters = {}
    if entity_type:
        filters["entity_type"] = entity_type
    if entity_id:
        filters["entity_id"] = entity_id

    items, total = audit_log_repo.get_multi(
        db,
        page=page,
        page_size=page_size,
        search=search,
        search_fields=["action", "entity_type", "old_value", "new_value"],
        sort=sort,
        filters=filters
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return PaginatedResponse(
        success=True,
        message="Audit logs listed successfully.",
        data=PaginatedData(
            items=[AuditLogResponse.model_validate(x) for x in items],
            meta=PaginationMeta(
                total_count=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages
            )
        )
    )
