from typing import Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.repositories import notification_repo
from app.models import Notification

class NotificationService:
    """
    Service to handle application-level user notifications.
    """
    @staticmethod
    def create_notification(db: Session, *, user_id: Any, title: str, message: str) -> Notification:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            is_read=False
        )
        return notification_repo.create(db, obj_in=notif)

    @staticmethod
    def mark_as_read(db: Session, *, notification_id: Any) -> Optional[Notification]:
        notif = notification_repo.get(db, id=notification_id)
        if notif:
            notif.is_read = True
            db.add(notif)
            db.commit()
            db.refresh(notif)
        return notif

    @staticmethod
    def get_unread_count(db: Session, *, user_id: Any) -> int:
        query = select(func.count(Notification.id)).where(
            Notification.user_id == user_id, 
            Notification.is_read == False
        )
        return db.scalar(query) or 0

    @staticmethod
    def mark_all_as_read(db: Session, *, user_id: Any) -> int:
        from sqlalchemy import update
        stmt = update(Notification).where(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).values(is_read=True)
        res = db.execute(stmt)
        db.commit()
        return res.rowcount
