import json
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.repositories import audit_log_repo
from app.models import AuditLog

class AuditService:
    """
    Service to manage audit logs across the application.
    Logs entity actions, old states, and new states.
    """
    @staticmethod
    def log_action(
        db: Session,
        *,
        user_id: Optional[Any] = None,
        entity_type: str,
        entity_id: Any,
        action: str,
        old_value: Optional[Any] = None,
        new_value: Optional[Any] = None
    ) -> AuditLog:
        # Normalize objects to JSON strings if they are dicts or lists
        old_str = (
            json.dumps(old_value) 
            if isinstance(old_value, (dict, list)) 
            else str(old_value) if old_value is not None else None
        )
        new_str = (
            json.dumps(new_value) 
            if isinstance(new_value, (dict, list)) 
            else str(new_value) if new_value is not None else None
        )

        log = AuditLog(
            user_id=user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            old_value=old_str,
            new_value=new_str
        )
        return audit_log_repo.create(db, obj_in=log)
