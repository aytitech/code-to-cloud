from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    port: int = 8006
    mongo_url: str = "mongodb://localhost:27017"
    mongo_db: str = "stackshop"
    jwt_secret: str = "changeme-dev-secret"

    model_config = {"env_file": ".env"}


settings = Settings()
