from urllib.parse import urlparse

from ..utils.errors import ApiError
from ..models import Roadmap, Resource, RoadmapNode
from ..utils.tree import build_node_tree


ROADMAP_TITLE_MAX_LENGTH = 255
ROADMAP_SHORT_DESCRIPTION_MAX_LENGTH = 500
ROADMAP_CATEGORY_MAX_LENGTH = 100
ROADMAP_LEVEL_MAX_LENGTH = 50
NODE_TITLE_MAX_LENGTH = 255
NODE_CONTENT_TYPE_MAX_LENGTH = 50
RESOURCE_TITLE_MAX_LENGTH = 255
RESOURCE_URL_MAX_LENGTH = 2048
RESOURCE_TYPE_MAX_LENGTH = 50


def _normalize_optional_query_param(value: str | None) -> str | None:
    if value is None:
        return None

    normalized_value = value.strip()
    return normalized_value or None


def parse_roadmap_filters(args) -> dict:
    return {
        "category": _normalize_optional_query_param(args.get("category", type=str)),
        "level": _normalize_optional_query_param(args.get("level", type=str)),
        "tag": _normalize_optional_query_param(args.get("tag", type=str)),
        "search": _normalize_optional_query_param(args.get("search", type=str)),
    }


def _normalize_text_field(value) -> str:
    return str(value).strip()


def _normalize_optional_text_field(value) -> str | None:
    if value is None:
        return None

    normalized_value = str(value).strip()
    return normalized_value or None


def _validate_max_length(*, value: str, max_length: int, field_name: str, error_code: str) -> None:
    if len(value) > max_length:
        raise ApiError(
            message=f"Поле {field_name} не должно превышать {max_length} символов.",
            status_code=400,
            error_code=error_code,
        )


def _validate_http_url(url: str) -> None:
    parsed_url = urlparse(url)
    if parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc:
        raise ApiError(
            message="Поле url должно содержать корректную ссылку с http:// или https://.",
            status_code=400,
            error_code="invalid_url",
        )


def validate_admin_create_roadmap_payload(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ApiError(
            message="Тело запроса должно быть JSON-объектом.",
            status_code=400,
            error_code="invalid_json_body",
        )

    title = _normalize_text_field(payload.get("title", ""))
    short_description = _normalize_text_field(payload.get("short_description", ""))
    category = _normalize_text_field(payload.get("category", ""))
    level = _normalize_text_field(payload.get("level", ""))
    full_description = _normalize_optional_text_field(payload.get("full_description"))
    is_published = payload.get("is_published", False)

    if not title:
        raise ApiError("Поле title обязательно.", 400, "title_required")
    if not short_description:
        raise ApiError("Поле short_description обязательно.", 400, "short_description_required")
    if not category:
        raise ApiError("Поле category обязательно.", 400, "category_required")
    if not level:
        raise ApiError("Поле level обязательно.", 400, "level_required")
    if not isinstance(is_published, bool):
        raise ApiError("Поле is_published должно быть boolean.", 400, "invalid_is_published")

    _validate_max_length(value=title, max_length=ROADMAP_TITLE_MAX_LENGTH, field_name="title", error_code="title_too_long")
    _validate_max_length(
        value=short_description,
        max_length=ROADMAP_SHORT_DESCRIPTION_MAX_LENGTH,
        field_name="short_description",
        error_code="short_description_too_long",
    )
    _validate_max_length(
        value=category,
        max_length=ROADMAP_CATEGORY_MAX_LENGTH,
        field_name="category",
        error_code="category_too_long",
    )
    _validate_max_length(value=level, max_length=ROADMAP_LEVEL_MAX_LENGTH, field_name="level", error_code="level_too_long")

    return {
        "title": title,
        "short_description": short_description,
        "full_description": full_description,
        "category": category,
        "level": level,
        "is_published": is_published,
    }


def validate_admin_update_roadmap_payload(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ApiError(
            message="Тело запроса должно быть JSON-объектом.",
            status_code=400,
            error_code="invalid_json_body",
        )

    allowed_fields = {
        "title",
        "short_description",
        "full_description",
        "category",
        "level",
        "is_published",
    }
    filtered_payload = {key: value for key, value in payload.items() if key in allowed_fields}

    if not filtered_payload:
        raise ApiError(
            message="Не передано ни одного допустимого поля для обновления.",
            status_code=400,
            error_code="empty_update_payload",
        )

    normalized_payload = {}

    for key, value in filtered_payload.items():
        if key == "full_description":
            normalized_payload[key] = _normalize_optional_text_field(value)
            continue

        if key == "is_published":
            if not isinstance(value, bool):
                raise ApiError(
                    message="Поле is_published должно быть boolean.",
                    status_code=400,
                    error_code="invalid_is_published",
                )
            normalized_payload[key] = value
            continue

        normalized_value = _normalize_text_field(value)
        if not normalized_value:
            raise ApiError(
                message=f"Поле {key} не может быть пустым.",
                status_code=400,
                error_code=f"{key}_empty",
            )

        if key == "title":
            _validate_max_length(value=normalized_value, max_length=ROADMAP_TITLE_MAX_LENGTH, field_name=key, error_code="title_too_long")
        if key == "short_description":
            _validate_max_length(
                value=normalized_value,
                max_length=ROADMAP_SHORT_DESCRIPTION_MAX_LENGTH,
                field_name=key,
                error_code="short_description_too_long",
            )
        if key == "category":
            _validate_max_length(
                value=normalized_value,
                max_length=ROADMAP_CATEGORY_MAX_LENGTH,
                field_name=key,
                error_code="category_too_long",
            )
        if key == "level":
            _validate_max_length(value=normalized_value, max_length=ROADMAP_LEVEL_MAX_LENGTH, field_name=key, error_code="level_too_long")

        normalized_payload[key] = normalized_value

    return normalized_payload


def validate_admin_create_node_payload(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ApiError(
            message="Тело запроса должно быть JSON-объектом.",
            status_code=400,
            error_code="invalid_json_body",
        )

    title = _normalize_text_field(payload.get("title", ""))
    content_type = _normalize_text_field(payload.get("content_type", ""))
    description = _normalize_optional_text_field(payload.get("description"))
    parent_id = payload.get("parent_id")
    position = payload.get("position", 0)
    canvas_x = payload.get("canvas_x")
    canvas_y = payload.get("canvas_y")
    is_optional = payload.get("is_optional", False)

    if not title:
        raise ApiError("Поле title обязательно.", 400, "title_required")
    if not content_type:
        raise ApiError("Поле content_type обязательно.", 400, "content_type_required")
    if parent_id is not None and not isinstance(parent_id, int):
        raise ApiError("Поле parent_id должно быть integer или null.", 400, "invalid_parent_id")
    if not isinstance(position, int):
        raise ApiError("Поле position должно быть integer.", 400, "invalid_position")
    if position < 0:
        raise ApiError("Поле position не может быть отрицательным.", 400, "invalid_position")
    if canvas_x is not None and not isinstance(canvas_x, (int, float)):
        raise ApiError("Поле canvas_x должно быть числом или null.", 400, "invalid_canvas_x")
    if canvas_y is not None and not isinstance(canvas_y, (int, float)):
        raise ApiError("Поле canvas_y должно быть числом или null.", 400, "invalid_canvas_y")
    if not isinstance(is_optional, bool):
        raise ApiError("Поле is_optional должно быть boolean.", 400, "invalid_is_optional")

    _validate_max_length(value=title, max_length=NODE_TITLE_MAX_LENGTH, field_name="title", error_code="title_too_long")
    _validate_max_length(
        value=content_type,
        max_length=NODE_CONTENT_TYPE_MAX_LENGTH,
        field_name="content_type",
        error_code="content_type_too_long",
    )

    return {
        "parent_id": parent_id,
        "title": title,
        "description": description,
        "content_type": content_type,
        "position": position,
        "canvas_x": float(canvas_x) if canvas_x is not None else None,
        "canvas_y": float(canvas_y) if canvas_y is not None else None,
        "is_optional": is_optional,
    }


def validate_admin_update_node_payload(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ApiError(
            message="Тело запроса должно быть JSON-объектом.",
            status_code=400,
            error_code="invalid_json_body",
        )

    allowed_fields = {
        "parent_id",
        "title",
        "description",
        "content_type",
        "position",
        "canvas_x",
        "canvas_y",
        "is_optional",
    }
    filtered_payload = {key: value for key, value in payload.items() if key in allowed_fields}

    if not filtered_payload:
        raise ApiError(
            message="Не передано ни одного допустимого поля для обновления.",
            status_code=400,
            error_code="empty_update_payload",
        )

    normalized_payload = {}

    if "parent_id" in filtered_payload:
        parent_id = filtered_payload["parent_id"]
        if parent_id is not None and not isinstance(parent_id, int):
            raise ApiError("Поле parent_id должно быть integer или null.", 400, "invalid_parent_id")
        normalized_payload["parent_id"] = parent_id

    if "title" in filtered_payload:
        title = _normalize_text_field(filtered_payload["title"])
        if not title:
            raise ApiError("Поле title не может быть пустым.", 400, "title_empty")
        _validate_max_length(value=title, max_length=NODE_TITLE_MAX_LENGTH, field_name="title", error_code="title_too_long")
        normalized_payload["title"] = title

    if "description" in filtered_payload:
        normalized_payload["description"] = _normalize_optional_text_field(filtered_payload["description"])

    if "content_type" in filtered_payload:
        content_type = _normalize_text_field(filtered_payload["content_type"])
        if not content_type:
            raise ApiError("Поле content_type не может быть пустым.", 400, "content_type_empty")
        _validate_max_length(
            value=content_type,
            max_length=NODE_CONTENT_TYPE_MAX_LENGTH,
            field_name="content_type",
            error_code="content_type_too_long",
        )
        normalized_payload["content_type"] = content_type

    if "position" in filtered_payload:
        position = filtered_payload["position"]
        if not isinstance(position, int) or position < 0:
            raise ApiError("Поле position должно быть integer >= 0.", 400, "invalid_position")
        normalized_payload["position"] = position

    if "canvas_x" in filtered_payload:
        canvas_x = filtered_payload["canvas_x"]
        if canvas_x is not None and not isinstance(canvas_x, (int, float)):
            raise ApiError("Поле canvas_x должно быть числом или null.", 400, "invalid_canvas_x")
        normalized_payload["canvas_x"] = float(canvas_x) if canvas_x is not None else None

    if "canvas_y" in filtered_payload:
        canvas_y = filtered_payload["canvas_y"]
        if canvas_y is not None and not isinstance(canvas_y, (int, float)):
            raise ApiError("Поле canvas_y должно быть числом или null.", 400, "invalid_canvas_y")
        normalized_payload["canvas_y"] = float(canvas_y) if canvas_y is not None else None

    if "is_optional" in filtered_payload:
        is_optional = filtered_payload["is_optional"]
        if not isinstance(is_optional, bool):
            raise ApiError("Поле is_optional должно быть boolean.", 400, "invalid_is_optional")
        normalized_payload["is_optional"] = is_optional

    return normalized_payload


def validate_admin_create_resource_payload(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ApiError(
            message="Тело запроса должно быть JSON-объектом.",
            status_code=400,
            error_code="invalid_json_body",
        )

    title = _normalize_text_field(payload.get("title", ""))
    url = _normalize_text_field(payload.get("url", ""))
    resource_type = _normalize_text_field(payload.get("resource_type", "link"))
    position = payload.get("position", 0)

    if not title:
        raise ApiError("Поле title обязательно.", 400, "title_required")
    if not url:
        raise ApiError("Поле url обязательно.", 400, "url_required")
    if not resource_type:
        raise ApiError("Поле resource_type обязательно.", 400, "resource_type_required")
    if not isinstance(position, int) or position < 0:
        raise ApiError("Поле position должно быть integer >= 0.", 400, "invalid_position")

    _validate_max_length(value=title, max_length=RESOURCE_TITLE_MAX_LENGTH, field_name="title", error_code="title_too_long")
    _validate_max_length(value=url, max_length=RESOURCE_URL_MAX_LENGTH, field_name="url", error_code="url_too_long")
    _validate_max_length(
        value=resource_type,
        max_length=RESOURCE_TYPE_MAX_LENGTH,
        field_name="resource_type",
        error_code="resource_type_too_long",
    )
    _validate_http_url(url)

    return {
        "title": title,
        "url": url,
        "resource_type": resource_type,
        "position": position,
    }


def serialize_roadmap_list_item(roadmap: Roadmap, steps_count: int) -> dict:
    author_name = "ветка" if roadmap.author and roadmap.author.role == "admin" else (
        roadmap.author.username if roadmap.author else "ветка"
    )

    return {
        "id": roadmap.id,
        "slug": roadmap.slug,
        "title": roadmap.title,
        "short_description": roadmap.short_description,
        "category": roadmap.category,
        "level": roadmap.level,
        "steps_count": int(steps_count),
        "author_name": author_name,
    }


def serialize_admin_roadmap(roadmap: Roadmap) -> dict:
    return {
        "roadmap": {
            "id": roadmap.id,
            "slug": roadmap.slug,
            "title": roadmap.title,
            "short_description": roadmap.short_description,
            "full_description": roadmap.full_description,
            "category": roadmap.category,
            "level": roadmap.level,
            "is_published": roadmap.is_published,
            "author_id": roadmap.author_id,
            "created_at": roadmap.created_at.isoformat() if roadmap.created_at else None,
            "updated_at": roadmap.updated_at.isoformat() if roadmap.updated_at else None,
        }
    }


def serialize_admin_roadmap_list_response(roadmaps: list[Roadmap]) -> dict:
    return {
        "roadmaps": [
            {
                "id": roadmap.id,
                "slug": roadmap.slug,
                "title": roadmap.title,
                "short_description": roadmap.short_description,
                "category": roadmap.category,
                "level": roadmap.level,
                "is_published": roadmap.is_published,
                "author_id": roadmap.author_id,
                "updated_at": roadmap.updated_at.isoformat() if roadmap.updated_at else None,
            }
            for roadmap in roadmaps
        ]
    }


def serialize_admin_roadmap_details_response(roadmap: Roadmap) -> dict:
    return {
        "roadmap": {
            "id": roadmap.id,
            "slug": roadmap.slug,
            "title": roadmap.title,
            "short_description": roadmap.short_description,
            "full_description": roadmap.full_description,
            "category": roadmap.category,
            "level": roadmap.level,
            "is_published": roadmap.is_published,
            "author_id": roadmap.author_id,
            "created_at": roadmap.created_at.isoformat() if roadmap.created_at else None,
            "updated_at": roadmap.updated_at.isoformat() if roadmap.updated_at else None,
            "nodes": [
                {
                    "id": node.id,
                    "roadmap_id": node.roadmap_id,
                    "parent_id": node.parent_id,
                    "title": node.title,
                    "description": node.description,
                    "content_type": node.content_type,
                    "position": node.position,
                    "depth": node.depth,
                    "canvas_x": node.canvas_x,
                    "canvas_y": node.canvas_y,
                    "is_optional": node.is_optional,
                    "resources": [serialize_resource(resource) for resource in node.resources],
                }
                for node in roadmap.nodes
            ],
        }
    }


def serialize_admin_node(node: RoadmapNode) -> dict:
    return {
        "node": {
            "id": node.id,
            "roadmap_id": node.roadmap_id,
            "parent_id": node.parent_id,
            "title": node.title,
            "description": node.description,
            "content_type": node.content_type,
            "position": node.position,
            "depth": node.depth,
            "canvas_x": node.canvas_x,
            "canvas_y": node.canvas_y,
            "is_optional": node.is_optional,
            "resources": [serialize_resource(resource) for resource in node.resources],
            "children": [
                {
                    "id": child.id,
                    "roadmap_id": child.roadmap_id,
                    "parent_id": child.parent_id,
                    "title": child.title,
                    "description": child.description,
                    "content_type": child.content_type,
                    "position": child.position,
                    "depth": child.depth,
                    "canvas_x": child.canvas_x,
                    "canvas_y": child.canvas_y,
                    "is_optional": child.is_optional,
                }
                for child in sorted(node.children, key=lambda child: (child.position, child.id))
            ],
        }
    }


def serialize_roadmap_list_response(roadmap_rows: list[dict]) -> dict:
    return {
        "roadmaps": [
            serialize_roadmap_list_item(
                roadmap=roadmap_row["roadmap"],
                steps_count=roadmap_row["steps_count"],
            )
            for roadmap_row in roadmap_rows
        ]
    }


def serialize_resource(resource: Resource) -> dict:
    return {
        "id": resource.id,
        "title": resource.title,
        "url": resource.url,
        "resource_type": resource.resource_type,
        "position": resource.position,
    }


def serialize_admin_resource(resource: Resource) -> dict:
    return {"resource": serialize_resource(resource)}


def serialize_node(node: RoadmapNode, progress_by_node_id: dict[int, str] | None = None) -> dict:
    resources = getattr(node, "resources", None) or []
    node_payload = {
        "id": node.id,
        "roadmap_id": node.roadmap_id,
        "parent_id": node.parent_id,
        "title": node.title,
        "description": getattr(node, "description", None),
        "content_type": getattr(node, "content_type", None),
        "position": node.position,
        "depth": node.depth,
        "canvas_x": getattr(node, "canvas_x", None),
        "canvas_y": getattr(node, "canvas_y", None),
        "is_optional": getattr(node, "is_optional", False),
        "resources": [serialize_resource(resource) for resource in resources],
        "children": [],
    }

    if progress_by_node_id is not None:
        node_payload["progress_status"] = progress_by_node_id.get(node.id, "not_started")

    return node_payload


def serialize_roadmap_details_response(
    *,
    roadmap: Roadmap,
    nodes: list[RoadmapNode],
    total_steps_count: int,
    progress_by_node_id: dict[int, str] | None = None,
) -> dict:
    serialized_nodes = [
        serialize_node(node=node, progress_by_node_id=progress_by_node_id) for node in nodes
    ]
    node_tree = build_node_tree(serialized_nodes)
    roadmap_author = getattr(roadmap, "author", None)
    author_name = "ветка" if roadmap_author and roadmap_author.role == "admin" else (
        roadmap_author.username if roadmap_author else "ветка"
    )
    roadmap_tag_links = getattr(roadmap, "tag_links", None) or []

    return {
        "roadmap": {
            "id": roadmap.id,
            "slug": roadmap.slug,
            "title": roadmap.title,
            "short_description": roadmap.short_description,
            "full_description": roadmap.full_description,
            "category": roadmap.category,
            "level": roadmap.level,
            "author_name": author_name,
            "total_steps_count": total_steps_count,
            "tags": [
                {
                    "id": tag_link.tag.id,
                    "name": tag_link.tag.name,
                    "slug": tag_link.tag.slug,
                }
                for tag_link in roadmap_tag_links
            ],
            "nodes": node_tree,
        }
    }
