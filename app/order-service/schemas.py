from datetime import datetime
from pydantic import BaseModel


class OrderItemIn(BaseModel):
    product_id: str
    product_name: str
    price: float
    quantity: int


class OrderCreate(BaseModel):
    items: list[OrderItemIn]


class OrderItemOut(BaseModel):
    id: str
    product_id: str
    product_name: str
    price: float
    quantity: int

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: str
    user_id: str
    status: str
    total: float
    created_at: datetime
    items: list[OrderItemOut]

    model_config = {"from_attributes": True}
