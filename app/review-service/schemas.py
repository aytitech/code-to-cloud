from datetime import datetime
from pydantic import BaseModel, Field


class ReviewIn(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=1, max_length=2000)


class ReviewOut(BaseModel):
    id: str
    product_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: datetime
