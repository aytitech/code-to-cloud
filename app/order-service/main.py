from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import create_tables
from kafka_producer import start_producer, stop_producer
from routers.orders import router as orders_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    await start_producer()
    yield
    await stop_producer()


app = FastAPI(title="Order Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orders_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "order-service"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=True)
