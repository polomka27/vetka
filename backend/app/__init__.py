import os

from flask import Flask
from sqlalchemy.exc import IntegrityError
from werkzeug.exceptions import HTTPException

from .config import config_by_name
from .extensions import cors, db, jwt, limiter, migrate


def create_app(
    config_name: str | None = None,
    config_overrides: dict | None = None,
) -> Flask:
    app = Flask(__name__)

    resolved_config_name = config_name or os.getenv("VETKA_CONFIG") or os.getenv("FLASK_ENV") or "development"
    config_class = config_by_name.get(resolved_config_name, config_by_name["development"])
    app.config.from_object(config_class)
    # Блок позволяет тестам и локальным утилитам подменять конфиг до инициализации extensions и подключения БД.
    if config_overrides:
        app.config.update(config_overrides)
    config_validator = getattr(config_class, "validate", None)
    if callable(config_validator):
        config_validator()

    register_extensions(app)
    register_models()
    register_error_handlers(app)
    register_jwt_callbacks()
    register_blueprints(app)

    return app


def register_extensions(app: Flask) -> None:
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": [origin.strip() for origin in app.config["CORS_ORIGINS"].split(",") if origin.strip()]}},
    )


def register_models() -> None:
    from . import models  # noqa: F401


def register_error_handlers(app: Flask) -> None:
    from flask_limiter.errors import RateLimitExceeded

    from .utils.errors import ApiError

    # Блок откатывает сессию при ошибках, чтобы следующие запросы не падали на broken transaction.
    def rollback_session() -> None:
        try:
            db.session.rollback()
        except Exception:
            pass

    @app.errorhandler(RateLimitExceeded)
    def handle_rate_limit(_error: RateLimitExceeded):
        rollback_session()
        return ApiError(
            message="Слишком много запросов. Попробуй через минуту.",
            status_code=429,
            error_code="rate_limit_exceeded",
        ).to_response()

    @app.errorhandler(ApiError)
    def handle_api_error(error: ApiError):
        rollback_session()
        return error.to_response()

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(_error: IntegrityError):
        rollback_session()
        return ApiError(
            message="Конфликт данных. Проверь уникальность полей и позиции элементов.",
            status_code=409,
            error_code="integrity_conflict",
        ).to_response()

    @app.errorhandler(HTTPException)
    def handle_http_exception(error: HTTPException):
        rollback_session()
        return ApiError(
            message=error.description,
            status_code=error.code or 500,
            error_code=f"http_{error.code or 500}",
        ).to_response()

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception):
        rollback_session()
        app.logger.exception("Unhandled application error")
        return ApiError(
            message="Внутренняя ошибка сервера.",
            status_code=500,
            error_code="internal_server_error",
        ).to_response()


def register_jwt_callbacks() -> None:
    from .models import User
    from .utils.auth import build_error_response

    @jwt.user_identity_loader
    def user_identity_lookup(user: User) -> str:
        return str(user.id)

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        return db.session.get(User, int(identity))

    @jwt.expired_token_loader
    def expired_token_callback(_jwt_header, _jwt_payload):
        return build_error_response(
            message="Срок действия токена истек.",
            status_code=401,
            error_code="token_expired",
        )

    @jwt.invalid_token_loader
    def invalid_token_callback(_error: str):
        return build_error_response(
            message="Некорректный токен.",
            status_code=401,
            error_code="invalid_token",
        )

    @jwt.unauthorized_loader
    def missing_token_callback(_error: str):
        return build_error_response(
            message="Требуется токен доступа.",
            status_code=401,
            error_code="authorization_required",
        )

    @jwt.user_lookup_error_loader
    def user_lookup_error_callback(_jwt_header, _jwt_payload):
        return build_error_response(
            message="Пользователь для токена не найден.",
            status_code=401,
            error_code="user_not_found",
        )


def register_blueprints(app: Flask) -> None:
    from .routes.admin import admin_bp
    from .routes.auth import auth_bp
    from .routes.health import health_bp
    from .routes.progress import progress_bp
    from .routes.roadmaps import roadmaps_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(roadmaps_bp)
    app.register_blueprint(progress_bp)
    app.register_blueprint(admin_bp)
