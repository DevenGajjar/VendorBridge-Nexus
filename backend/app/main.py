from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.database import engine, Base
from app.schemas.base import FailureResponse
from app.core.limiter import limiter

# Import all routers
from app.routers import (
    auth, vendor, rfq, quotation, approval, purchase_order, invoice, notification, audit_log, attachment, analytics
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VendorBridge Nexus API",
    description="Procurement & Vendor Management ERP Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

from fastapi.staticfiles import StaticFiles
import os
os.makedirs("generated_pdfs", exist_ok=True)
os.makedirs("uploads", exist_ok=True)
app.mount("/pdfs", StaticFiles(directory="generated_pdfs"), name="pdfs")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    response_content = FailureResponse(
        success=False,
        message="Rate limit exceeded. Too many requests.",
        errors=["Too many requests. Please try again later."]
    )
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content=response_content.model_dump()
    )

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api/v1
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(vendor.router, prefix=api_prefix)
app.include_router(rfq.router, prefix=api_prefix)
app.include_router(quotation.router, prefix=api_prefix)
app.include_router(approval.router, prefix=api_prefix)
app.include_router(purchase_order.router, prefix=api_prefix)
app.include_router(invoice.router, prefix=api_prefix)
app.include_router(notification.router, prefix=api_prefix)
app.include_router(audit_log.router, prefix=api_prefix)
app.include_router(attachment.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)

# --- GLOBAL EXCEPTION HANDLERS ---

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Validation error handler returning consistent error envelope.
    """
    errors_list = []
    for error in exc.errors():
        loc = " -> ".join(str(x) for x in error.get("loc", []))
        msg = error.get("msg", "Invalid value")
        errors_list.append(f"{loc}: {msg}")

    response_content = FailureResponse(
        success=False,
        message="Request validation failed.",
        errors=errors_list
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=response_content.model_dump()
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    HTTP exceptions handler (e.g. 404, 403, 401).
    """
    detail = exc.detail
    if isinstance(detail, list):
        errors_list = [str(x) for x in detail]
        msg = "HTTP Exception"
    else:
        errors_list = []
        msg = str(detail)

    response_content = FailureResponse(
        success=False,
        message=msg,
        errors=errors_list
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=response_content.model_dump()
    )

@app.exception_handler(Exception)
async def catch_all_exception_handler(request: Request, exc: Exception):
    """
    Catch-all internal server error handler.
    """
    response_content = FailureResponse(
        success=False,
        message="An unexpected server error occurred.",
        errors=[str(exc)]
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=response_content.model_dump()
    )

@app.get("/", tags=["Root"])
def read_root():
    return {
        "success": True,
        "message": "Welcome to VendorBridge Nexus API. Access docs at /docs."
    }
