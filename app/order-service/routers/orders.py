from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db
from models import Order, OrderItem
from schemas import OrderCreate, OrderOut
from kafka_producer import publish
from auth import get_current_user_id

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")

    total = sum(item.price * item.quantity for item in payload.items)

    order = Order(user_id=user_id, total=total)
    db.add(order)
    await db.flush()

    for item in payload.items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            product_name=item.product_name,
            price=item.price,
            quantity=item.quantity,
        ))

    await db.commit()
    await db.refresh(order)

    # Reload with items
    result = await db.execute(
        select(Order).options(selectinload(Order.items)).where(Order.id == order.id)
    )
    order = result.scalar_one()

    # Publish event — notification-service and search-service will consume this
    await publish("order.created", {
        "order_id": order.id,
        "user_id": order.user_id,
        "total": float(order.total),
        "items": [
            {"product_id": i.product_id, "product_name": i.product_name, "quantity": i.quantity}
            for i in order.items
        ],
    })

    return order


@router.get("", response_model=list[OrderOut])
async def list_orders(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id, Order.user_id == user_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
