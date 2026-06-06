from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, DeclarativeBase
from app.core.config import settings

# Create synchronous engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
