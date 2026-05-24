from pathlib import Path

import pytest

from app import create_app
from app.extensions import db
from app.models import Resource, Roadmap, RoadmapNode, RoadmapTag, RoadmapTagLink, User
from app.utils.security import hash_password


# Блок создаёт isolated Flask app на SQLite, чтобы прогнать реальные API-сценарии без внешней Postgres.
@pytest.fixture()
def app(tmp_path: Path):
    sqlite_path = tmp_path / "vetka-e2e.sqlite"
    app = create_app(
        config_overrides={
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{sqlite_path}",
        }
    )

    with app.app_context():
        db.drop_all()
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


# Блок отдаёт тестовый HTTP-клиент поверх полностью поднятого Flask app.
@pytest.fixture()
def client(app):
    return app.test_client()


# Блок создаёт администратора напрямую в БД, чтобы проверять защищённые admin-сценарии.
def create_admin(app):
    with app.app_context():
        admin = User(
            username="admin",
            email="admin@vetka.dev",
            password_hash=hash_password("Admin12345!"),
            role="admin",
        )
        db.session.add(admin)
        db.session.commit()


# Блок создаёт опубликованный роадмап с тегом, узлами и ресурсом для публичных и progress-сценариев.
def create_public_roadmap(app) -> dict:
    with app.app_context():
        admin = User(
            username="seed-admin",
            email="seed-admin@vetka.dev",
            password_hash=hash_password("Admin12345!"),
            role="admin",
        )
        tag = RoadmapTag(name="Python", slug="python")
        roadmap = Roadmap(
            slug="python-backend",
            title="Python Backend",
            short_description="Публичная карта backend-разработки.",
            full_description="Полное описание карты.",
            category="backend",
            level="junior",
            is_published=True,
            author=admin,
        )
        root_node = RoadmapNode(
            roadmap=roadmap,
            title="Основа Python",
            description="Синтаксис и структуры данных.",
            content_type="step",
            position=0,
            depth=0,
            is_optional=False,
        )
        child_node = RoadmapNode(
            roadmap=roadmap,
            parent=root_node,
            title="Функции",
            description="Научиться писать функции.",
            content_type="step",
            position=0,
            depth=1,
            is_optional=False,
        )
        resource = Resource(
            node=root_node,
            title="Python Docs",
            url="https://docs.python.org/3/tutorial/",
            resource_type="docs",
            position=0,
        )
        roadmap_tag_link = RoadmapTagLink(roadmap=roadmap, tag=tag)

        db.session.add_all([admin, tag, roadmap, root_node, child_node, resource, roadmap_tag_link])
        db.session.commit()

        return {
            "roadmap_slug": roadmap.slug,
            "root_node_id": root_node.id,
            "child_node_id": child_node.id,
        }


# Блок логинит пользователя через настоящий API, чтобы все дальнейшие запросы шли с реальным JWT.
def login(client, email: str, password: str) -> str:
    response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )
    assert response.status_code == 200
    return response.get_json()["access_token"]


# Блок собирает Authorization header для защищённых endpoint'ов.
def auth_headers(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


# Блок проверяет сквозной пользовательский путь: регистрация, логин, публичная карта, прогресс и заметки.
def test_auth_public_and_progress_flow(client, app):
    fixture = create_public_roadmap(app)

    register_response = client.post(
        "/api/auth/register",
        json={
            "username": "student",
            "email": "student@example.com",
            "password": "StrongPass123",
        },
    )
    assert register_response.status_code == 201
    # Блок фиксирует, что профиль сразу получает nickname из username, введённого при регистрации.
    assert register_response.get_json()["user"]["profile"]["nickname"] == "student"

    access_token = login(client, "student@example.com", "StrongPass123")

    me_response = client.get("/api/auth/me", headers=auth_headers(access_token))
    assert me_response.status_code == 200
    assert me_response.get_json()["user"]["email"] == "student@example.com"
    assert me_response.get_json()["user"]["profile"]["nickname"] == "student"

    public_list_response = client.get("/api/roadmaps")
    assert public_list_response.status_code == 200
    assert any(
        roadmap["slug"] == fixture["roadmap_slug"]
        for roadmap in public_list_response.get_json()["roadmaps"]
    )

    public_detail_response = client.get(f"/api/roadmaps/{fixture['roadmap_slug']}")
    assert public_detail_response.status_code == 200
    assert public_detail_response.get_json()["roadmap"]["nodes"][0]["resources"][0]["title"] == "Python Docs"

    unauthorized_progress_response = client.get(f"/api/progress/roadmaps/{fixture['roadmap_slug']}")
    assert unauthorized_progress_response.status_code == 401

    status_response = client.patch(
        f"/api/progress/roadmaps/{fixture['roadmap_slug']}/nodes/{fixture['root_node_id']}",
        headers=auth_headers(access_token),
        json={"status": "in_progress"},
    )
    assert status_response.status_code == 200
    assert status_response.get_json()["status"] == "in_progress"

    note_response = client.patch(
        f"/api/progress/roadmaps/{fixture['roadmap_slug']}/nodes/{fixture['root_node_id']}/note",
        headers=auth_headers(access_token),
        json={"note": "Повторить comprehensions"},
    )
    assert note_response.status_code == 200
    assert note_response.get_json()["note"] == "Повторить comprehensions"

    progress_response = client.get(
        f"/api/progress/roadmaps/{fixture['roadmap_slug']}",
        headers=auth_headers(access_token),
    )
    assert progress_response.status_code == 200
    progress_payload = progress_response.get_json()
    assert progress_payload["node_statuses"][str(fixture["root_node_id"])] == "in_progress"
    assert progress_payload["node_notes"][str(fixture["root_node_id"])] == "Повторить comprehensions"

    started_roadmaps_response = client.get(
        "/api/progress/roadmaps",
        headers=auth_headers(access_token),
    )
    assert started_roadmaps_response.status_code == 200
    assert started_roadmaps_response.get_json()["roadmaps"][0]["slug"] == fixture["roadmap_slug"]


# Блок проверяет, что мастерская доступна авторизованному пользователю, но чужие карты по-прежнему защищены ownership-правилами.
def test_admin_flow_and_public_visibility(client, app):
    create_admin(app)

    user_register_response = client.post(
        "/api/auth/register",
        json={
            "username": "regular-user",
            "email": "regular@example.com",
            "password": "StrongPass123",
        },
    )
    assert user_register_response.status_code == 201
    user_access_token = login(client, "regular@example.com", "StrongPass123")

    create_roadmap_response = client.post(
        "/api/admin/roadmaps",
        headers=auth_headers(user_access_token),
        json={
            "title": "User workshop map",
            "short_description": "Создана обычным пользователем.",
            "full_description": "Доступ к мастерской открыт для авторизованных пользователей.",
            "category": "backend",
            "level": "junior",
            "is_published": True,
        },
    )
    assert create_roadmap_response.status_code == 201
    roadmap_payload = create_roadmap_response.get_json()["roadmap"]
    roadmap_id = roadmap_payload["id"]
    roadmap_slug = roadmap_payload["slug"]

    create_node_response = client.post(
        f"/api/admin/roadmaps/{roadmap_id}/nodes",
        headers=auth_headers(user_access_token),
        json={
            "parent_id": None,
            "title": "Первый шаг",
            "description": "Описание шага",
            "content_type": "step",
            "position": 0,
            "canvas_x": 120,
            "canvas_y": 240,
            "is_optional": False,
        },
    )
    assert create_node_response.status_code == 201
    node_id = create_node_response.get_json()["node"]["id"]

    create_resource_response = client.post(
        f"/api/admin/nodes/{node_id}/resources",
        headers=auth_headers(user_access_token),
        json={
            "title": "Полезный материал",
            "url": "https://example.com/resource",
            "resource_type": "docs",
            "position": 0,
        },
    )
    assert create_resource_response.status_code == 201
    resource_id = create_resource_response.get_json()["resource"]["id"]

    public_detail_response = client.get(f"/api/roadmaps/{roadmap_slug}")
    assert public_detail_response.status_code == 200
    public_node = public_detail_response.get_json()["roadmap"]["nodes"][0]
    assert public_node["canvas_x"] == 120.0
    assert public_node["resources"][0]["title"] == "Полезный материал"

    outsider_register_response = client.post(
        "/api/auth/register",
        json={
            "username": "outsider-user",
            "email": "outsider@example.com",
            "password": "StrongPass123",
        },
    )
    assert outsider_register_response.status_code == 201
    outsider_access_token = login(client, "outsider@example.com", "StrongPass123")

    forbidden_update_response = client.patch(
        f"/api/admin/roadmaps/{roadmap_id}",
        headers=auth_headers(outsider_access_token),
        json={
            "title": "Чужая карта"
        },
    )
    assert forbidden_update_response.status_code == 403

    update_node_response = client.patch(
        f"/api/admin/nodes/{node_id}",
        headers=auth_headers(user_access_token),
        json={
            "canvas_x": 333,
            "canvas_y": 444,
            "is_optional": True,
        },
    )
    assert update_node_response.status_code == 200

    updated_public_detail_response = client.get(f"/api/roadmaps/{roadmap_slug}")
    assert updated_public_detail_response.status_code == 200
    updated_public_node = updated_public_detail_response.get_json()["roadmap"]["nodes"][0]
    assert updated_public_node["canvas_x"] == 333.0
    assert updated_public_node["canvas_y"] == 444.0
    assert updated_public_node["is_optional"] is True

    admin_access_token = login(client, "admin@vetka.dev", "Admin12345!")

    delete_resource_response = client.delete(
        f"/api/admin/resources/{resource_id}",
        headers=auth_headers(admin_access_token),
    )
    assert delete_resource_response.status_code == 200

    delete_node_response = client.delete(
        f"/api/admin/nodes/{node_id}",
        headers=auth_headers(admin_access_token),
    )
    assert delete_node_response.status_code == 200

    delete_roadmap_response = client.delete(
        f"/api/admin/roadmaps/{roadmap_id}",
        headers=auth_headers(admin_access_token),
    )
    assert delete_roadmap_response.status_code == 200

    deleted_public_detail_response = client.get(f"/api/roadmaps/{roadmap_slug}")
    assert deleted_public_detail_response.status_code == 404
