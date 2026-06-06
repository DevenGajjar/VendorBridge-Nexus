import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.approval import ApprovalRequestCreate, ApprovalActionRequest, ApprovalRequestResponse, ApprovalTimelineEvent
from app.schemas.base import APIResponse, PaginatedResponse, PaginatedData, PaginationMeta
from app.services.approval import ApprovalService
from app.core.deps import get_current_user, RoleChecker
from app.models import User


router = APIRouter(prefix="/approvals", tags=["Approval Workflows"])

@router.post(
    "", 
    response_model=APIResponse[ApprovalRequestResponse], 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RoleChecker(["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"]))]
)
def submit_approval_request(
    request_in: ApprovalRequestCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Submit an entity (RFQ, Quotation, PO) for approval.
    """
    req = ApprovalService.submit_request(db, request_in=request_in, current_user_id=current_user.id)
    return APIResponse(
        success=True,
        message="Approval request submitted successfully.",
        data=ApprovalRequestResponse.model_validate(req)
    )

@router.post(
    "/{request_id}/action", 
    response_model=APIResponse[ApprovalRequestResponse],
    dependencies=[Depends(RoleChecker(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"]))]
)
def approve_or_reject_request(
    request_id: uuid.UUID,
    action_in: ApprovalActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Approve or reject a pending approval request. Restricted to authorized approvers.
    """
    req = ApprovalService.process_action(
        db, 
        request_id=request_id, 
        action_in=action_in, 
        current_user_id=current_user.id
    )
    return APIResponse(
        success=True,
        message=f"Request successfully {action_in.status.lower()}.",
        data=ApprovalRequestResponse.model_validate(req)
    )

@router.get("/timeline", response_model=APIResponse[List[ApprovalTimelineEvent]])
def get_approval_timeline(
    entity_type: str = Query(...), 
    entity_id: uuid.UUID = Query(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get approval history and state change timeline for a specific entity.
    """
    timeline = ApprovalService.get_approval_timeline(db, entity_type=entity_type, entity_id=entity_id)
    return APIResponse(
        success=True,
        message="Approval timeline retrieved successfully.",
        data=timeline
    )

@router.get("", response_model=PaginatedResponse[ApprovalRequestResponse])
def list_approval_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    entity_type: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List approval requests with pagination and filtering.
    """
    filters = {}
    if status_filter:
        filters["status"] = status_filter
    if entity_type:
        filters["entity_type"] = entity_type

    items, total = ApprovalService.get_requests(db, page=page, page_size=page_size, filters=filters, current_user=current_user)
    total_pages = (total + page_size - 1) // page_size

    return PaginatedResponse(
        success=True,
        message="Approval requests retrieved successfully.",
        data=PaginatedData(
            items=[ApprovalRequestResponse.model_validate(x) for x in items],
            meta=PaginationMeta(
                total_count=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages
            )
        )
    )

