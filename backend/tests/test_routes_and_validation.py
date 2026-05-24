from types import SimpleNamespace

import pytest
from flask_jwt_extended import create_access_token

from app import create_app
from app.schemas.auth import validate_profile_payload, validate_register_payload
from app.schemas.progress import validate_progress_note_payload
from app.schemas.roadmap import validate_admin_create_resource_payload
from app.utils.errors import ApiError


# Блок собирает минимальный payload роадмапа, достаточный для сериализации публичного endpoint.
def build_roadmap_details_payload():
    roadmap = SimpleNamespace(
        id=1,
        slug="test-map",
        title="Тестовая карта",
        short_description="Короткое описание",
        full_description="Полное описание",
        category="backend",
        level="junior",
        author=SimpleNamespace(role="admin", username="ветка"),
        tag_links=[],
    )
    node = SimpleNamespace(
        id=10,
        roadmap_id=1,
        parent_id=None,
        title="Шаг 1",
        description="Описание шага",
        content_type="article",
        position=0,
        depth=0,
        is_optional=False,
        resources=[],
    )

    return {
        "roadmap": roadmap,
        "nodes": [node],
        "total_steps_count": 1,
    }


# Блок проверяет, что публичная страница карты остаётся доступной даже с битым Authorization header.
def test_public_roadmap_details_ignore_invalid_authorization_header(monkeypatch):
    app = create_app()
    client = app.test_client()

    monkeypatch.setattr(
        "app.routes.roadmaps.RoadmapService.get_published_roadmap_details",
        lambda slug: build_roadmap_details_payload(),
    )

    response = client.get(
        "/api/roadmaps/test-map",
        headers={"Authorization": "Bearer invalid.token.value"},
    )

    assert response.status_code == 200
    assert response.get_json()["roadmap"]["nodes"][0]["title"] == "Шаг 1"


# Блок фиксирует защиту от переполнения username до уровня БД.
def test_register_validation_rejects_too_long_username():
    with pytest.raises(ApiError) as error:
        validate_register_payload(
            {
                "username": "u" * 81,
                "email": "user@example.com",
                "password": "super-secure-password",
            }
        )

    assert error.value.error_code == "username_too_long"


# Блок проверяет, что backend не принимает опасные javascript-ссылки в ресурсах.
def test_resource_validation_rejects_non_http_url():
    with pytest.raises(ApiError) as error:
        validate_admin_create_resource_payload(
            {
                "title": "Опасная ссылка",
                "url": "javascript:alert('xss')",
                "resource_type": "link",
                "position": 0,
            }
        )

    assert error.value.error_code == "invalid_url"


# Блок проверяет верхнюю границу размера заметки, чтобы тесты не ловили случайные 500 на больших payload.
def test_progress_note_validation_rejects_too_long_note():
    with pytest.raises(ApiError) as error:
        validate_progress_note_payload({"note": "a" * 5001})

    assert error.value.error_code == "note_too_long"


# Блок проверяет ограничения нового profile payload до записи в базу.
def test_profile_validation_rejects_invalid_avatar_url():
    with pytest.raises(ApiError) as error:
        validate_profile_payload({"avatar_url": "javascript:alert('xss')"})

    assert error.value.error_code == "invalid_avatar_url"


# Блок проверяет, что PATCH профиля возвращает сериализованного пользователя с обновлёнными полями.
def test_update_profile_route_updates_current_user(monkeypatch):
    app = create_app()
    client = app.test_client()
    fake_user = SimpleNamespace(
        id=1,
        username="tester",
        email="tester@example.com",
        role="user",
        created_at=None,
        profile_nickname=None,
        profile_profession=None,
        profile_social_links=None,
        profile_bio=None,
        profile_avatar_url=None,
    )

    # Блок подменяет загрузку пользователя из JWT, чтобы route можно было проверить без реальной БД.
    monkeypatch.setattr(
        "app.extensions.db.session.get",
        lambda model, identity: fake_user if identity == 1 else None,
    )

    # Блок подменяет сервис обновления профиля и имитирует запись новых данных в пользователя.
    def fake_update_user_profile(*, user, data):
        user.profile_nickname = data.get("nickname")
        user.profile_profession = data.get("profession")
        user.profile_social_links = data.get("social_links")
        user.profile_bio = data.get("bio")
        user.profile_avatar_url = data.get("avatar_url")
        return user

    monkeypatch.setattr(
        "app.routes.auth.AuthService.update_user_profile",
        fake_update_user_profile,
    )

    with app.app_context():
        access_token = create_access_token(identity=SimpleNamespace(id=1))

    response = client.patch(
        "/api/auth/me/profile",
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "nickname": "polomka",
            "profession": "Backend Engineer",
            "social_links": "github.com/polomka",
            "bio": "Люблю строить API.",
            "avatar_url": "https://example.com/avatar.png",
        },
    )

    assert response.status_code == 200
    assert response.get_json()["user"]["profile"]["nickname"] == "polomka"
