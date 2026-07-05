from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5434/ticket_db"
    JWT_SECRET: str = "change-this-in-production"
    JWT_ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"


settings = Settings()