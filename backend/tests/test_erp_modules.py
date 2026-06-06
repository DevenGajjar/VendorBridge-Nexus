import pytest
from datetime import datetime, timedelta, timezone


def test_db_setup_and_workflow(client, db_session):
    from app.models import VendorCategory, Role, User
    from app.core import security
    
    # Get roles from DB
    roles = {r.name: r for r in db_session.query(Role).all()}
    
    # 1. Create Users
    admin_user = User(
        email="admin_t@vendorbridge.com",
        hashed_password=security.get_password_hash("SecurePassword123!"),
        first_name="Admin",
        last_name="Test",
        role_id=roles["ADMIN"].id,
        is_active=True
    )
    mgr_user = User(
        email="mgr_t@vendorbridge.com",
        hashed_password=security.get_password_hash("SecurePassword123!"),
        first_name="Manager",
        last_name="Test",
        role_id=roles["MANAGER"].id,
        is_active=True
    )
    vendor_user = User(
        email="vendor_u_t@vendorbridge.com",
        hashed_password=security.get_password_hash("SecurePassword123!"),
        first_name="Vendor",
        last_name="User",
        role_id=roles["VENDOR"].id,
        is_active=True
    )
    db_session.add_all([admin_user, mgr_user, vendor_user])
    db_session.commit()

    # Create Vendor Category
    cat = VendorCategory(name="Medical Devices", description="Equipment and tooling")
    db_session.add(cat)
    db_session.commit()

    # Login as Admin
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin_t@vendorbridge.com", "password": "SecurePassword123!"}
    )
    admin_token = login_resp.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. VENDOR MODULE TESTS
    vendor_resp = client.post(
        "/api/v1/vendors",
        headers=admin_headers,
        json={
            "name": "Global Medical Devices",
            "vendor_code": "VND-GLB001",
            "email": "global@medical.com",
            "phone": "123-456-7890",
            "address": "123 Healthcare Blvd",
            "gst_number": "27ABCDE1234F1Z1",
            "rating": 4.5,
            "category_id": str(cat.id),
            "status": "APPROVED",
            "user_id": str(vendor_user.id)
        }
    )
    assert vendor_resp.status_code == 201
    vendor_id = vendor_resp.json()["data"]["id"]

    # 3. RFQ MODULE TESTS
    deadline = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat().replace("+00:00", "Z")
    rfq_resp = client.post(
        "/api/v1/rfqs",
        headers=admin_headers,
        json={
            "title": "Hospital Bed procurement",
            "description": "Procuring 50 hospital beds",
            "deadline": deadline,
            "assigned_vendors": [vendor_id],
            "items": [
                {
                    "item_name": "Adjustable Hospital Bed",
                    "description": "5-way adjustable automatic bed",
                    "quantity": 50,
                    "target_price": 500.0
                }
            ]
        }
    )
    assert rfq_resp.status_code == 201
    rfq_data = rfq_resp.json()["data"]
    rfq_id = rfq_data["id"]
    rfq_item_id = rfq_data["items"][0]["id"]

    # Publish RFQ
    client.put(
        f"/api/v1/rfqs/{rfq_id}",
        headers=admin_headers,
        json={"status": "SENT"}
    )

    # 4. QUOTATION MODULE TESTS
    # Login as Vendor User
    vendor_login = client.post(
        "/api/v1/auth/login",
        json={"email": "vendor_u_t@vendorbridge.com", "password": "SecurePassword123!"}
    )
    vendor_token = vendor_login.json()["data"]["access_token"]
    vendor_headers = {"Authorization": f"Bearer {vendor_token}"}

    quote_resp = client.post(
        "/api/v1/quotations",
        headers=vendor_headers,
        json={
            "rfq_id": rfq_id,
            "delivery_days": 10,
            "items": [
                {
                    "rfq_item_id": rfq_item_id,
                    "unit_price": 480.0
                }
            ]
        }
    )
    assert quote_resp.status_code == 201
    quote_id = quote_resp.json()["data"]["id"]

    # Compare quotations
    compare_resp = client.get(
        f"/api/v1/quotations/compare?rfq_id={rfq_id}",
        headers=admin_headers
    )
    assert compare_resp.status_code == 200
    assert compare_resp.json()["data"]["recommended_quotation"]["id"] == quote_id

    # 5. APPROVAL WORKFLOW TESTS
    approval_resp = client.post(
        "/api/v1/approvals",
        headers=admin_headers,
        json={
            "entity_type": "QUOTATION",
            "entity_id": quote_id,
            "assigned_approver_id": str(mgr_user.id),
            "comments": "Recommended bid is below target price."
        }
    )
    assert approval_resp.status_code == 201
    app_req_id = approval_resp.json()["data"]["id"]

    # Login as Manager to approve
    mgr_login = client.post(
        "/api/v1/auth/login",
        json={"email": "mgr_t@vendorbridge.com", "password": "SecurePassword123!"}
    )
    mgr_token = mgr_login.json()["data"]["access_token"]
    mgr_headers = {"Authorization": f"Bearer {mgr_token}"}

    action_resp = client.post(
        f"/api/v1/approvals/{app_req_id}/action",
        headers=mgr_headers,
        json={
            "status": "APPROVED",
            "comments": "Approved. Price is very competitive."
        }
    )
    assert action_resp.status_code == 200

    # 6. PO AND INVOICE TESTS
    po_resp = client.post(
        "/api/v1/purchase-orders",
        headers=admin_headers,
        json={
            "quotation_id": quote_id,
            "delivery_date": (datetime.now(timezone.utc) + timedelta(days=15)).isoformat().replace("+00:00", "Z")
        }
    )
    assert po_resp.status_code == 201
    po_id = po_resp.json()["data"]["id"]

    # Approve PO status to ACCEPTED (first DRAFT -> SENT, then SENT -> ACCEPTED)
    sent_resp = client.put(
        f"/api/v1/purchase-orders/{po_id}",
        headers=admin_headers,
        json={"status": "SENT"}
    )
    assert sent_resp.status_code == 200

    accepted_resp = client.put(
        f"/api/v1/purchase-orders/{po_id}",
        headers=admin_headers,
        json={"status": "ACCEPTED"}
    )
    assert accepted_resp.status_code == 200


    # Generate Invoice
    invoice_resp = client.post(
        "/api/v1/invoices",
        headers=admin_headers,
        json={
            "purchase_order_id": po_id,
            "due_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat().replace("+00:00", "Z")
        }
    )
    assert invoice_resp.status_code == 201

    # 7. ANALYTICS & INTELLIGENCE
    analytics_resp = client.get("/api/v1/analytics/dashboard", headers=admin_headers)
    assert analytics_resp.status_code == 200
    assert analytics_resp.json()["data"]["total_vendors"] > 0

    intelligence_resp = client.get(f"/api/v1/vendors/{vendor_id}/intelligence", headers=admin_headers)
    assert intelligence_resp.status_code == 200
    assert "overall_score" in intelligence_resp.json()["data"]
