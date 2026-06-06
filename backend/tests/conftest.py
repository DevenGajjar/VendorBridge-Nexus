import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database import Base, get_db

DB_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../test.db"))
TEST_DATABASE_URL = f"sqlite:///{DB_FILE}"

def sqlite_to_char(date_str, format_str):
    if not date_str:
        return None
    # SQLite datetime strings start with YYYY-MM-DD
    if format_str == "YYYY-MM":
        return date_str[:7]
    return date_str

@pytest.fixture(scope="function")
def db_engine():
    # Remove existing test DB if any
    if os.path.exists(DB_FILE):
        try:
            os.remove(DB_FILE)
        except Exception:
            pass

    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    
    # Enforce SQLite foreign keys and register custom to_char function
    from sqlalchemy import event
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
        # Register to_char function
        dbapi_connection.create_function("to_char", 2, sqlite_to_char)

    Base.metadata.create_all(bind=engine)
    yield engine
    
    Base.metadata.drop_all(bind=engine)
    if os.path.exists(DB_FILE):
        try:
            os.remove(DB_FILE)
        except Exception:
            pass

@pytest.fixture(scope="function")
def db_session(db_engine):
    Session = sessionmaker(bind=db_engine, autoflush=False, autocommit=False)
    session = Session()
    try:
        # Seed basic roles for RBAC checks
        from app.models import Role
        roles = [
            Role(name="ADMIN", description="Admin"),
            Role(name="PROCUREMENT_OFFICER", description="PO"),
            Role(name="MANAGER", description="Manager"),
            Role(name="VENDOR", description="Vendor")
        ]
        session.add_all(roles)
        session.commit()
        yield session
    finally:
        session.close()

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
