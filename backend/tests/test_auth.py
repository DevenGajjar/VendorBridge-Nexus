import pytest

def test_signup_success(client):
    # Retrieve role ID first
    roles_resp = client.get("/api/v1/auth/roles")
    assert roles_resp.status_code == 200
    roles = roles_resp.json()["data"]
    po_role = next(r for r in roles if r["name"] == "PROCUREMENT_OFFICER")

    # Verify that a user can register successfully with valid password complexity
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "test_officer@vendorbridge.com",
            "first_name": "Test",
            "last_name": "User",
            "password": "SecurePassword123!",
            "role_id": po_role["id"]
        }
    )
    assert response.status_code == 201
    assert response.json()["success"] is True
    assert "id" in response.json()["data"]

def test_signup_invalid_password(client):
    roles_resp = client.get("/api/v1/auth/roles")
    roles = roles_resp.json()["data"]
    po_role = next(r for r in roles if r["name"] == "PROCUREMENT_OFFICER")

    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "test_bad_pass@vendorbridge.com",
            "first_name": "Test",
            "last_name": "User",
            "password": "123",  # Weak password
            "role_id": po_role["id"]
        }
    )
    assert response.status_code == 422
    assert "validation failed" in response.json()["message"].lower()

def test_login_success(client):
    roles_resp = client.get("/api/v1/auth/roles")
    roles = roles_resp.json()["data"]
    po_role = next(r for r in roles if r["name"] == "PROCUREMENT_OFFICER")

    # Create a user first
    signup_resp = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "test_login@vendorbridge.com",
            "first_name": "Login",
            "last_name": "User",
            "password": "SecurePassword123!",
            "role_id": po_role["id"]
        }
    )
    assert signup_resp.status_code == 201
    
    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test_login@vendorbridge.com",
            "password": "SecurePassword123!"
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()["data"]
