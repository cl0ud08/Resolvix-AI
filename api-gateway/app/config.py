from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    AUTH_SERVICE_URL: str = "http://localhost:8001"
    TICKET_SERVICE_URL: str = "http://localhost:8002"
    NOTIFICATION_SERVICE_URL: str = "http://localhost:8004"

    class Config:
        env_file = ".env"


settings = Settings()