import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from database import reviews_collection
from schemas import ReviewIn, ReviewOut

router = APIRouter(prefix="/api/products/{product_id}/reviews", tags=["reviews"])


def _to_out(doc: dict) -> ReviewOut:
    return ReviewOut(
        id=doc["id"],
        product_id=doc["product_id"],
        user_id=doc["user_id"],
        user_name=doc["user_name"],
        rating=doc["rating"],
        comment=doc["comment"],
        created_at=doc["created_at"],
    )


@router.get("", response_model=list[ReviewOut])
async def list_reviews(product_id: str):
    cursor = reviews_collection.find({"product_id": product_id}).sort("created_at", -1)
    return [_to_out(doc) async for doc in cursor]


@router.post("", response_model=ReviewOut, status_code=201)
async def create_review(
    product_id: str,
    payload: ReviewIn,
    user: dict = Depends(get_current_user),
):
    # One review per user per product
    existing = await reviews_collection.find_one(
        {"product_id": product_id, "user_id": user["user_id"]}
    )
    if existing:
        raise HTTPException(status_code=409, detail="You already reviewed this product")

    doc = {
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "user_id": user["user_id"],
        "user_name": user["user_name"],
        "rating": payload.rating,
        "comment": payload.comment,
        "created_at": datetime.now(timezone.utc),
    }
    await reviews_collection.insert_one(doc)
    return _to_out(doc)
