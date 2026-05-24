import os
from pathlib import Path
from datetime import timedelta

from dotenv import load_dotenv


# Блок загружает переменные окружения из backend/.env независимо от текущей рабочей директории.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-please-change-me-32")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-key-please-change-me-32")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_DAYS", "30")))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
    }
    JSON_SORT_KEYS = False
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173")
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")

    POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_HOST = os.getenv("POSTGRES_HOST", "127.0.0.1")
    POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB = os.getenv("POSTGRES_DB", "vetka")

    SQLALCHEMY_DATABASE_URI = (
        f"postgresql+psycopg://{POSTGRES_USER}:{POSTGRES_PASSWORD}"
        f"@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False

    @classmethod
    def validate(cls) -> None:
        # Блок запрещает запуск production-конфига с небезопасными dev-secret значениями.
        if cls.SECRET_KEY == "dev-secret-key-please-change-me-32":
            raise RuntimeError("SECRET_KEY должен быть задан для production-конфига.")

        if cls.JWT_SECRET_KEY == "dev-jwt-secret-key-please-change-me-32":
            raise RuntimeError("JWT_SECRET_KEY должен быть задан для production-конфига.")


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}
