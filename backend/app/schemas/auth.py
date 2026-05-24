import re
from urllib.parse import urlparse

from ..utils.errors import ApiError


EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
DATA_IMAGE_URL_PATTERN = re.compile(r"^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$")
MAX_USERNAME_LENGTH = 80
MAX_EMAIL_LENGTH = 255
MAX_PASSWORD_LENGTH = 255
MAX_PROFILE_NICKNAME_LENGTH = 80
MAX_PROFILE_PROFESSION_LENGTH = 120
MAX_PROFILE_SOCIAL_LINKS_LENGTH = 500
MAX_PROFILE_BIO_LENGTH = 3000
MAX_PROFILE_AVATAR_URL_LENGTH = 200_000


def validate_register_payload(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ApiError(
            message="Тело запроса должно быть JSON-объектом.",
            status_code=400,
            error_code="invalid_json_body",
        )

    username = str(payload.get("username", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    if not username:
        raise ApiError("Поле username обязательно.", 400, "username_required")
    if len(username) < 3:
        raise ApiError("Username должен содержать минимум 3 символа.", 400, "username_too_short")
    if len(username) > MAX_USERNAME_LENGTH:
        raise ApiError("Username не должен превышать 80 символов.", 400, "username_too_long")
    if not email:
        raise ApiError("Поле email обязательно.", 400, "email_required")
    if len(email) > MAX_EMAIL_LENGTH:
        raise ApiError("Email не должен превышать 255 символов.", 400, "email_too_long")
    if not EMAIL_PATTERN.match(email):
        raise ApiError("Некорректный формат email.", 400, "invalid_email")
    if not password:
        raise ApiError("Поле password обязательно.", 400, "password_required")
    if len(password) < 8:
        raise ApiError("Пароль должен содержать минимум 8 символов.", 400, "password_too_short")
    if len(password) > MAX_PASSWORD_LENGTH:
        raise ApiError("Пароль не должен превышать 255 символов.", 400, "password_too_long")

    return {
        "username": username,
        "email": email,
        "password": password,
    }


def validate_login_payload(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ApiError(
            message="Тело запроса должно быть JSON-объектом.",
            status_code=400,
            error_code="invalid_json_body",
        )

    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    if not email:
        raise ApiError("Поле email обязательно.", 400, "email_required")
    if len(email) > MAX_EMAIL_LENGTH:
        raise ApiError("Email не должен превышать 255 символов.", 400, "email_too_long")
    if not EMAIL_PATTERN.match(email):
        raise ApiError("Некорректный формат email.", 400, "invalid_email")
    if not password:
        raise ApiError("Поле password обязательно.", 400, "password_required")
    if len(password) > MAX_PASSWORD_LENGTH:
        raise ApiError("Пароль не должен превышать 255 символов.", 400, "password_too_long")

    return {
        "email": email,
        "password": password,
    }


def _normalize_optional_profile_text(value) -> str | None:
    if value is None:
        return None

    normalized_value = str(value).strip()
    return normalized_value or None


def _validate_optional_text_length(
    *,
    value: str | None,
    max_length: int,
    field_name: str,
    error_code: str,
) -> None:
    if value is not None and len(value) > max_length:
        raise ApiError(
            message=f"Поле {field_name} не должно превышать {max_length} символов.",
            status_code=400,
            error_code=error_code,
        )


def _is_http_url(value: str) -> bool:
    parsed_url = urlparse(value)
    return parsed_url.scheme in {"http", "https"} and bool(parsed_url.netloc)


def _validate_profile_avatar_url(avatar_url: str | None) -> None:
    if avatar_url is None:
        return

    if _is_http_url(avatar_url):
        return

    if DATA_IMAGE_URL_PATTERN.match(avatar_url):
        return

    raise ApiError(
        message="Поле avatar_url должно содержать data:image/* или безопасную http/https ссылку.",
        status_code=400,
        error_code="invalid_avatar_url",
    )


def validate_profile_payload(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ApiError(
            message="Тело запроса должно быть JSON-объектом.",
            status_code=400,
            error_code="invalid_json_body",
        )

    allowed_fields = {
        "nickname",
        "profession",
        "social_links",
        "bio",
        "avatar_url",
    }
    filtered_payload = {key: value for key, value in payload.items() if key in allowed_fields}

    if not filtered_payload:
        raise ApiError(
            message="Не передано ни одного допустимого поля профиля.",
            status_code=400,
            error_code="empty_profile_payload",
        )

    normalized_payload = {
        key: _normalize_optional_profile_text(value)
        for key, value in filtered_payload.items()
    }

    if "nickname" in normalized_payload:
        _validate_optional_text_length(
            value=normalized_payload["nickname"],
            max_length=MAX_PROFILE_NICKNAME_LENGTH,
            field_name="nickname",
            error_code="nickname_too_long",
        )

    if "profession" in normalized_payload:
        _validate_optional_text_length(
            value=normalized_payload["profession"],
            max_length=MAX_PROFILE_PROFESSION_LENGTH,
            field_name="profession",
            error_code="profession_too_long",
        )

    if "social_links" in normalized_payload:
        _validate_optional_text_length(
            value=normalized_payload["social_links"],
            max_length=MAX_PROFILE_SOCIAL_LINKS_LENGTH,
            field_name="social_links",
            error_code="social_links_too_long",
        )

    if "bio" in normalized_payload:
        _validate_optional_text_length(
            value=normalized_payload["bio"],
            max_length=MAX_PROFILE_BIO_LENGTH,
            field_name="bio",
            error_code="bio_too_long",
        )

    if "avatar_url" in normalized_payload:
        _validate_optional_text_length(
            value=normalized_payload["avatar_url"],
            max_length=MAX_PROFILE_AVATAR_URL_LENGTH,
            field_name="avatar_url (макс. 200 000 символов)",
            error_code="avatar_url_too_long",
        )
        _validate_profile_avatar_url(normalized_payload["avatar_url"])

    return normalized_payload


def serialize_user_profile(user) -> dict:
    return {
        "nickname": user.profile_nickname or "",
        "profession": user.profile_profession or "",
        "social_links": user.profile_social_links or "",
        "bio": user.profile_bio or "",
        "avatar_url": user.profile_avatar_url or "",
    }


def serialize_user(user) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "profile": serialize_user_profile(user),
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def serialize_auth_response(user, access_token: str) -> dict:
    return {
        "access_token": access_token,
        "token_type": "Bearer",
        "user": serialize_user(user),
    }
