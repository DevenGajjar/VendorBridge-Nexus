import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/vendorbridge"
    JWT_SECRET_KEY: str = "e83a9deef69a7c36a83693bf6f8d0ab4da68832a832ba81b0a8801d9f8c0ff58"
    JWT_REFRESH_SECRET_KEY: str = "9faee9a4f4e2ad2b694fffa21a37c95e1eb9bdf934dfefb37996c56134b22c71"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    API_V1_STR: str = "/api/v1"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
