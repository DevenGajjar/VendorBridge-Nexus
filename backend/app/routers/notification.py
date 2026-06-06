import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.notification import NotificationResponse, NotificationUnreadCountResponse, ExternalNotificationCreate
from app.schemas.base import APIResponse, PaginatedResponse, PaginatedData, PaginationMeta
from app.services.notification import NotificationService
from app.core.deps import get_current_user
from app.repositories import notification_repo
from app.models import User
from fastapi import APIRouter, Depends, Query, status, HTTPException
router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.post("/send-by-email", response_model=APIResponse[NotificationResponse])
def send_notification_by_email(
    payload: ExternalNotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send an internal notification to a user by their email address.
    """
    from app.repositories import user_repo
    recipient = user_repo.get_by_email(db, email=payload.recipient_email)
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email {payload.recipient_email} not found."
        )
    
    notif = NotificationService.create_notification(
        db,
        user_id=recipient.id,
        title=payload.title,
        message=payload.message
    )
    return APIResponse(
        success=True,
        message="Notification sent successfully.",
        data=NotificationResponse.model_validate(notif)
    )

@router.post("/read-all", response_model=APIResponse[int])
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark all unread notifications of the current user as read.
    """
    count = NotificationService.mark_all_as_read(db, user_id=current_user.id)
    return APIResponse(
        success=True,
        message=f"All {count} notifications marked as read.",
        data=count
    )

@router.post("/{notification_id}/read", response_model=APIResponse[NotificationResponse])
def mark_notification_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a notification as read.
    """
    notif = NotificationService.mark_as_read(db, notification_id=notification_id)
    if not notif or notif.user_id != current_user.id:
        return APIResponse(
            success=False,
            message="Notification not found or access denied.",
            data=None
        )
    return APIResponse(
        success=True,
        message="Notification marked as read.",
        data=NotificationResponse.model_validate(notif)
    )

@router.get("/unread-count", response_model=APIResponse[NotificationUnreadCountResponse])
def get_unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get the count of unread notifications for the currently logged-in user.
    """
    count = NotificationService.get_unread_count(db, user_id=current_user.id)
    return APIResponse(
        success=True,
        message="Unread notifications count retrieved.",
        data=NotificationUnreadCountResponse(unread_count=count)
    )

@router.get("", response_model=PaginatedResponse[NotificationResponse])
def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    sort: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all notifications for the currently logged-in user.
    """
    # Enforce current user filter
    filters = {"user_id": current_user.id}

    items, total = notification_repo.get_multi(
        db,
        page=page,
        page_size=page_size,
        search=search,
        search_fields=["title", "message"],
        sort=sort,
        filters=filters
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return PaginatedResponse(
        success=True,
        message="Notifications listed successfully.",
        data=PaginatedData(
            items=[NotificationResponse.model_validate(x) for x in items],
            meta=PaginationMeta(
                total_count=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages
            )
        )
    )
