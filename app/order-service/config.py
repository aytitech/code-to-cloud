from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    port: int = 8003
    db_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/orders"
    kafka_brokers: str = "localhost:9092"
    jwt_secret: str = "changeme-dev-secret"
    product_service_url: str = "http://localhost:8002"

    model_config = {"env_file": ".env"}


settings = Settings()
