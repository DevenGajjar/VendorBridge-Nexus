from datetime import timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core import security
from app.core.config import settings
from app.models import User, Role
from app.repositories import user_repo, role_repo
from app.schemas.auth import TokenResponse, LoginRequest
from app.schemas.user import UserCreate

class AuthService:
    """
    Service handling user registration, login, token refresh, and RBAC utilities.
    """
    @staticmethod
    def register_user(db: Session, *, user_in: UserCreate) -> User:
        # Check if user already exists
        existing_user = user_repo.get_by_email(db, email=user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists."
            )
        
        # Verify role exists
        db_role = role_repo.get(db, id=user_in.role_id)
        if not db_role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Specified role not found."
            )

        hashed_password = security.get_password_hash(user_in.password)
        db_user = User(
            email=user_in.email,
            hashed_password=hashed_password,
            first_name=user_in.first_name,
            last_name=user_in.last_name,
            role_id=user_in.role_id,
            is_active=True
        )
        return user_repo.create(db, obj_in=db_user)

    @staticmethod
    def authenticate_user(db: Session, *, login_data: LoginRequest) -> User:
        user = user_repo.get_by_email(db, email=login_data.email)
        if not user or not security.verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is deactivated."
            )
        return user

    @staticmethod
    def generate_tokens(user: User) -> dict:
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        access_token = security.create_access_token(
            subject=user.id, expires_delta=access_token_expires
        )
        refresh_token = security.create_refresh_token(
            subject=user.id, expires_delta=refresh_token_expires
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user
        }

    @staticmethod
    def refresh_access_token(db: Session, *, refresh_token: str) -> dict:
        payload = security.decode_token(refresh_token, settings.JWT_REFRESH_SECRET_KEY)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token."
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token subject."
            )
            
        user = user_repo.get(db, id=user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is deactivated."
            )

        # Generate new access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            subject=user.id, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user
        }
