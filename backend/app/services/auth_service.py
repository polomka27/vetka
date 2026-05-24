from flask_jwt_extended import create_access_token
from sqlalchemy.exc import IntegrityError

from ..extensions import db
from ..models import User
from ..utils.errors import ApiError
from ..utils.security import check_password, hash_password


class AuthService:
    @staticmethod
    def register_user(*, username: str, email: str, password: str) -> tuple["User", str]:
        normalized_username = username.strip()
        normalized_email = email.strip().lower()

        user = User(
            username=normalized_username,
            email=normalized_email,
            password_hash=hash_password(password),
            profile_nickname=normalized_username,
        )

        db.session.add(user)
        try:
            db.session.commit()
        except IntegrityError as exc:
            db.session.rollback()
            constraint_name = getattr(getattr(getattr(exc, "orig", None), "diag", None), "constraint_name", "") or ""
            if "username" in constraint_name:
                raise ApiError(
                    message="Пользователь с таким username уже существует.",
                    status_code=409,
                    error_code="username_already_exists",
                ) from exc
            if "email" in constraint_name:
                raise ApiError(
                    message="Пользователь с таким email уже существует.",
                    status_code=409,
                    error_code="email_already_exists",
                ) from exc
            raise

        access_token = create_access_token(identity=user)
        return user, access_token

    @staticmethod
    def login_user(*, email: str, password: str) -> tuple[User, str]:
        normalized_email = email.strip().lower()
        user = User.query.filter_by(email=normalized_email).first()

        if user is None or not check_password(user.password_hash, password):
            raise ApiError(
                message="Неверный email или пароль.",
                status_code=401,
                error_code="invalid_credentials",
            )

        access_token = create_access_token(identity=user)
        return user, access_token

    @staticmethod
    def update_user_profile(*, user: User, data: dict) -> User:
        # Блок сопоставляет публичные поля профиля с колонками пользователя в БД.
        field_mapping = {
            "nickname": "profile_nickname",
            "profession": "profile_profession",
            "social_links": "profile_social_links",
            "bio": "profile_bio",
            "avatar_url": "profile_avatar_url",
        }

        for source_field, target_field in field_mapping.items():
            if source_field in data:
                setattr(user, target_field, data[source_field])

        db.session.commit()
        return user
