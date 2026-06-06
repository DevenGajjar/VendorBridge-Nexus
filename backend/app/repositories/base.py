from typing import Generic, TypeVar, Type, List, Optional, Any, Dict, Tuple
from sqlalchemy import select, func, desc, asc, or_
from sqlalchemy.orm import Session
from app.database import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        return db.get(self.model, id)

    def get_multi(
        self,
        db: Session,
        *,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        search_fields: Optional[List[str]] = None,
        sort: Optional[str] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[ModelType], int]:
        query = select(self.model)

        # Apply Filters
        if filters:
            for field, val in filters.items():
                if hasattr(self.model, field) and val is not None:
                    query = query.where(getattr(self.model, field) == val)

        # Apply Search
        if search and search_fields:
            search_filters = []
            for field in search_fields:
                if hasattr(self.model, field):
                    search_filters.append(getattr(self.model, field).ilike(f"%{search}%"))
            if search_filters:
                query = query.where(or_(*search_filters))

        # Get Total Count
        count_query = select(func.count()).select_from(query.subquery())
        total_count = db.scalar(count_query) or 0

        # Apply Sorting (Format: "column_name desc" or "column_name asc")
        if sort:
            parts = sort.strip().split()
            sort_col = parts[0]
            sort_dir = parts[1].lower() if len(parts) > 1 else "asc"
            if hasattr(self.model, sort_col):
                col_attr = getattr(self.model, sort_col)
                if sort_dir == "desc":
                    query = query.order_by(desc(col_attr))
                else:
                    query = query.order_by(asc(col_attr))
        else:
            # Default sorting if created_at field is present
            if hasattr(self.model, "created_at"):
                query = query.order_by(desc(getattr(self.model, "created_at")))

        # Apply Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        result = db.scalars(query).all()
        return list(result), total_count

    def create(self, db: Session, *, obj_in: Any) -> ModelType:
        db.add(obj_in)
        db.commit()
        db.refresh(obj_in)
        return obj_in

    def update(self, db: Session, *, db_obj: ModelType, obj_in: Any) -> ModelType:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True) if hasattr(obj_in, "model_dump") else obj_in.__dict__
            
        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: Any) -> Optional[ModelType]:
        obj = db.get(self.model, id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj
