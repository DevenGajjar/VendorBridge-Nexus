import uuid
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status
from app.repositories import approval_request_repo, user_repo, rfq_repo, quotation_repo, purchase_order_repo
from app.models import ApprovalRequest
from app.schemas.approval import ApprovalRequestCreate, ApprovalActionRequest, ApprovalTimelineEvent
from app.services.audit import AuditService
from app.services.notification import NotificationService
from app.services.email import EmailService

class ApprovalService:
    """
    Service managing multi-entity approvals, state machines, and timeline histories.
    """
    @staticmethod
    def submit_request(db: Session, *, request_in: ApprovalRequestCreate, current_user_id: uuid.UUID) -> ApprovalRequest:
        # Verify approver user exists
        approver = user_repo.get(db, id=request_in.assigned_approver_id)
        if not approver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned approver not found."
            )

        # Check entity existence and status
        if request_in.entity_type == "RFQ":
            entity = rfq_repo.get(db, id=request_in.entity_id)
        elif request_in.entity_type == "QUOTATION":
            entity = quotation_repo.get(db, id=request_in.entity_id)
        elif request_in.entity_type == "PURCHASE_ORDER":
            entity = purchase_order_repo.get(db, id=request_in.entity_id)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported entity type for approvals: {request_in.entity_type}"
            )

        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target {request_in.entity_type} entity with ID {request_in.entity_id} not found."
            )

        # Create approval request
        app_req = ApprovalRequest(
            entity_type=request_in.entity_type,
            entity_id=request_in.entity_id,
            requested_by_id=current_user_id,
            assigned_approver_id=request_in.assigned_approver_id,
            status="PENDING",
            comments=request_in.comments
        )
        created = approval_request_repo.create(db, obj_in=app_req)

        # Notify Approver
        NotificationService.create_notification(
            db,
            user_id=request_in.assigned_approver_id,
            title="Approval Request Assigned",
            message=f"You have been assigned to review a {request_in.entity_type} approval request."
        )

        # Send Email to Approver
        try:
            EmailService.send_approval_notification(
                recipient_email=approver.email,
                user_name=f"{approver.first_name} {approver.last_name}",
                entity_type=request_in.entity_type,
                entity_number=str(request_in.entity_id),
                status="PENDING",
                comments=request_in.comments
            )
        except Exception:
            pass

        # Log action
        AuditService.log_action(
            db,
            user_id=current_user_id,
            entity_type=request_in.entity_type,
            entity_id=request_in.entity_id,
            action="Approval Requested",
            new_value={"comments": request_in.comments}
        )

        return created

    @staticmethod
    def process_action(db: Session, *, request_id: uuid.UUID, action_in: ApprovalActionRequest, current_user_id: uuid.UUID) -> ApprovalRequest:
        req = approval_request_repo.get(db, id=request_id)
        if not req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Approval request not found."
            )

        # Verify only assigned approver can approve/reject
        if req.assigned_approver_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the assigned approver can take action on this request."
            )

        if req.status != "PENDING":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Approval request already processed. Current status is {req.status}."
            )

        # Update request status
        req.status = action_in.status
        req.comments = action_in.comments
        db.add(req)
        db.commit()
        db.refresh(req)

        # Cascade status update to the target entity
        target_status = "ACCEPTED" if action_in.status == "APPROVED" else "REJECTED"
        if req.entity_type == "RFQ":
            entity = rfq_repo.get(db, id=req.entity_id)
            if entity:
                # RFQs map ACCEPTED to SENT or CLOSED, but let's set status appropriately
                entity.status = "SENT" if action_in.status == "APPROVED" else "DRAFT"
                db.add(entity)
        elif req.entity_type == "QUOTATION":
            entity = quotation_repo.get(db, id=req.entity_id)
            if entity:
                entity.status = "ACCEPTED" if action_in.status == "APPROVED" else "REJECTED"
                db.add(entity)
                
                # Automatically generate Purchase Order if approved
                if action_in.status == "APPROVED":
                    from app.services.purchase_order import PurchaseOrderService
                    from app.schemas.purchase_order import PurchaseOrderCreate
                    
                    try:
                        po_in = PurchaseOrderCreate(quotation_id=entity.id)
                        PurchaseOrderService.generate_purchase_order(
                            db, 
                            po_in=po_in, 
                            current_user_id=current_user_id
                        )
                    except Exception as e:
                        # Log error but don't fail the approval action
                        print(f"Failed to auto-generate PO: {e}")
        elif req.entity_type == "PURCHASE_ORDER":
            entity = purchase_order_repo.get(db, id=req.entity_id)
            if entity:
                entity.status = "SENT" if action_in.status == "APPROVED" else "CANCELLED"
                db.add(entity)

        db.commit()

        # Notify requester
        NotificationService.create_notification(
            db,
            user_id=req.requested_by_id,
            title=f"Approval Request {action_in.status}",
            message=f"Your approval request for {req.entity_type} was {action_in.status.lower()}."
        )

        try:
            requester = user_repo.get(db, id=req.requested_by_id)
            if requester:
                EmailService.send_approval_notification(
                    recipient_email=requester.email,
                    user_name=f"{requester.first_name} {requester.last_name}",
                    entity_type=req.entity_type,
                    entity_number=str(req.entity_id),
                    status=action_in.status,
                    comments=action_in.comments
                )
        except Exception:
            pass

        # Log action
        action_name = "Approval Approved" if action_in.status == "APPROVED" else "Approval Rejected"
        AuditService.log_action(
            db,
            user_id=current_user_id,
            entity_type=req.entity_type,
            entity_id=req.entity_id,
            action=action_name,
            new_value={"comments": action_in.comments}
        )

        return req

    @staticmethod
    def get_approval_timeline(db: Session, *, entity_type: str, entity_id: uuid.UUID) -> List[ApprovalTimelineEvent]:
        # Query approval requests matching entity
        stmt = select(ApprovalRequest).where(
            ApprovalRequest.entity_type == entity_type,
            ApprovalRequest.entity_id == entity_id
        ).order_by(ApprovalRequest.created_at.asc())
        
        requests = db.scalars(stmt).all()
        
        timeline = []
        for r in requests:
            approver_name = "System"
            if r.assigned_approver:
                approver_name = f"{r.assigned_approver.first_name} {r.assigned_approver.last_name}"
            
            timeline.append(
                ApprovalTimelineEvent(
                    id=r.id,
                    status=r.status,
                    action_by=approver_name,
                    comments=r.comments,
                    timestamp=r.created_at
                )
            )
        return timeline

    @staticmethod
    def get_requests(db: Session, *, page: int = 1, page_size: int = 10, filters: dict, current_user) -> Tuple[List[ApprovalRequest], int]:
        # Managers only see requests assigned to them
        if current_user.role.name == "MANAGER":
            filters["assigned_approver_id"] = current_user.id
        return approval_request_repo.get_multi(db, page=page, page_size=page_size, filters=filters)

