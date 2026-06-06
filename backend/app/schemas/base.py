from typing import Generic, TypeVar, List, Optional, Any
from pydantic import BaseModel, Field

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[T] = None

class FailureResponse(BaseModel):
    success: bool = False
    message: str = "An error occurred"
    errors: List[str] = Field(default_factory=list)

class PaginationMeta(BaseModel):
    total_count: int
    page: int
    page_size: int
    total_pages: int

class PaginatedData(BaseModel, Generic[T]):
    items: List[T]
    meta: PaginationMeta

class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Data retrieved successfully"
    data: PaginatedData[T]
