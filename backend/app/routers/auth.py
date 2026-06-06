from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest, ForgotPasswordRequest
from app.schemas.user import UserCreate, UserResponse
from app.schemas.base import APIResponse
from app.services.auth import AuthService
from app.core.deps import get_current_user
from app.models import User
from app.core.limiter import limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=APIResponse[UserResponse], status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def signup(request: Request, user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user in the system.
    """
    user = AuthService.register_user(db, user_in=user_in)
    return APIResponse(
        success=True,
        message="User registered successfully.",
        data=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=APIResponse[TokenResponse])
@limiter.limit("15/minute")
def login(request: Request, login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate a user and return access & refresh tokens.
    """
    user = AuthService.authenticate_user(db, login_data=login_data)
    tokens = AuthService.generate_tokens(user)
    return APIResponse(
        success=True,
        message="Logged in successfully.",
        data=TokenResponse(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            user=UserResponse.model_validate(tokens["user"])
        )
    )

@router.post("/refresh", response_model=APIResponse[TokenResponse])
def refresh_token(refresh_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Refresh access token using a valid refresh token.
    """
    tokens = AuthService.refresh_access_token(db, refresh_token=refresh_data.refresh_token)
    return APIResponse(
        success=True,
        message="Token refreshed successfully.",
        data=TokenResponse(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            user=UserResponse.model_validate(tokens["user"])
        )
    )

@router.post("/forgot-password", response_model=APIResponse[None])
def forgot_password(req: ForgotPasswordRequest):
    """
    Placeholder endpoint for password recovery.
    """
    return APIResponse(
        success=True,
        message="If the email exists, a password reset link has been dispatched.",
        data=None
    )

@router.get("/me", response_model=APIResponse[UserResponse])
def get_me(current_user: User = Depends(get_current_user)):
    """
    Retrieve details of the currently authenticated user.
    """
    return APIResponse(
        success=True,
        message="User profile retrieved.",
        data=UserResponse.model_validate(current_user)
    )

@router.get("/roles")
def get_roles(db: Session = Depends(get_db)):
    """
    Retrieve all available user roles for signup dropdown.
    """
    from app.models import Role
    from sqlalchemy import select
    roles = db.scalars(select(Role)).all()
    return {
        "success": True,
        "message": "Roles retrieved successfully.",
        "data": [{"id": str(r.id), "name": r.name, "description": r.description} for r in roles]
    }

@router.get("/managers")
def get_managers(db: Session = Depends(get_db)):
    """
    Retrieve all users who have the MANAGER role.
    """
    from app.models import User, Role
    from sqlalchemy import select
    stmt = select(User).join(Role).where(Role.name == "MANAGER")
    managers = db.scalars(stmt).all()
    return {
        "success": True,
        "message": "Managers retrieved successfully.",
        "data": [{"id": str(m.id), "email": m.email, "first_name": m.first_name, "last_name": m.last_name} for m in managers]
    }

